exports.up = async (client) => {
  await client.query(`
    CREATE TABLE tasks (
      id SERIAL PRIMARY KEY,
      body TEXT NOT NULL,
      userId INTEGER NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Kreiranje indexa
  await client.query('CREATE INDEX idx_tasks_userId ON tasks(userId)');

  console.log('  ✓ Created tasks table');
};

exports.down = async (client) => {
  await client.query('DROP TABLE IF EXISTS tasks CASCADE');
  console.log('  ✓ Dropped tasks table');
};