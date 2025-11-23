const pool = require('../src/config/database');

// Čišćenje baze pre testova
async function clearDatabase() {
  try {
    await pool.query('DELETE FROM tasks');
    await pool.query('DELETE FROM users');
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE tasks_id_seq RESTART WITH 1');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

// Zatvaranje konekcije nakon testova
async function closeDatabase() {
  await pool.end();
}

module.exports = {
  clearDatabase,
  closeDatabase
};