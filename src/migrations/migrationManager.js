const pool = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class MigrationManager {
  // Kreiranje tabele za praćenje migracija
  async createMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
    console.log('✓ Migrations table ready');
  }

  // Dobijanje svih izvršenih migracija
  async getExecutedMigrations() {
    try {
      const result = await pool.query('SELECT name FROM migrations ORDER BY id');
      return result.rows.map(row => row.name);
    } catch (error) {
      return [];
    }
  }

  // Dobijanje svih fajlova migracija
  async getMigrationFiles() {
    const migrationsDir = path.join(__dirname);
    const files = await fs.readdir(migrationsDir);
    return files
      .filter(file => {
        // Uzmi samo fajlove koji počinju sa brojem (001_, 002_, itd.)
        return file.match(/^\d{3}_.*\.js$/);
      })
      .sort();
  }

  // Pokretanje pending migracija
  async runPendingMigrations() {
    await this.createMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file)
    );

    if (pendingMigrations.length === 0) {
      console.log('✓ No pending migrations');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s)`);

    for (const file of pendingMigrations) {
      await this.runMigration(file);
    }

    console.log('✓ All migrations completed successfully');
  }

  // Pokretanje pojedinačne migracije
  async runMigration(filename) {
    const migrationPath = path.join(__dirname, filename);
    const migration = require(migrationPath);

    console.log(`Running migration: ${filename}`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await migration.up(client);
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      console.log(`✓ Migration ${filename} completed`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`✗ Migration ${filename} failed:`, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  // Rollback poslednje migracije
  async rollback() {
    await this.createMigrationsTable();
    
    const result = await pool.query(
      'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastMigration = result.rows[0].name;
    const migrationPath = path.join(__dirname, lastMigration);
    const migration = require(migrationPath);

    console.log(`Rolling back migration: ${lastMigration}`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await migration.down(client);
      await client.query('DELETE FROM migrations WHERE name = $1', [lastMigration]);
      await client.query('COMMIT');
      console.log(`✓ Rollback ${lastMigration} completed`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`✗ Rollback ${lastMigration} failed:`, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  // Prikaz statusa migracija
  async status() {
    await this.createMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();

    console.log('\n=== Migration Status ===\n');
    
    for (const file of migrationFiles) {
      const status = executedMigrations.includes(file) ? '✓' : '✗';
      console.log(`${status} ${file}`);
    }
    
    console.log('\n');
  }
}

module.exports = new MigrationManager();