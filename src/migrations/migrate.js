#!/usr/bin/env node

const migrationManager = require('./migrationManager');
const pool = require('../config/database');

const command = process.argv[2];

async function main() {
  try {
    switch (command) {
      case 'up':
        console.log('Running pending migrations...\n');
        await migrationManager.runPendingMigrations();
        break;

      case 'down':
        console.log('Rolling back last migration...\n');
        await migrationManager.rollback();
        break;

      case 'status':
        await migrationManager.status();
        break;

      case 'create':
        const name = process.argv[3];
        if (!name) {
          console.error('Error: Migration name is required');
          console.log('Usage: npm run migrate:create <migration_name>');
          process.exit(1);
        }
        await createMigration(name);
        break;

      default:
        console.log('Available commands:');
        console.log('  npm run migrate:up      - Run all pending migrations');
        console.log('  npm run migrate:down    - Rollback last migration');
        console.log('  npm run migrate:status  - Show migration status');
        console.log('  npm run migrate:create <name> - Create new migration file');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function createMigration(name) {
  const fs = require('fs').promises;
  const path = require('path');
  
  // Dobijanje sledećeg broja migracije
  const migrationsDir = __dirname;
  const files = await fs.readdir(migrationsDir);
  const migrationFiles = files.filter(f => f.match(/^\d{3}_.*\.js$/));
  const nextNumber = migrationFiles.length > 0 
    ? String(migrationFiles.length + 1).padStart(3, '0')
    : '001';
  
  const filename = `${nextNumber}_${name}.js`;
  const filepath = path.join(migrationsDir, filename);
  
  const template = `exports.up = async (client) => {
  // Write your migration here
  await client.query(\`
    -- Your SQL here
  \`);

  console.log('  ✓ Migration completed');
};

exports.down = async (client) => {
  // Write rollback logic here
  await client.query(\`
    -- Your rollback SQL here
  \`);

  console.log('  ✓ Rollback completed');
};
`;

  await fs.writeFile(filepath, template);
  console.log(`✓ Created migration: ${filename}`);
}

main();