exports.up = async (client) => {
  await client.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      firstName VARCHAR(100) NOT NULL,
      lastName VARCHAR(100) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'basic' CHECK (role IN ('basic', 'admin')),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Kreiranje indexa za bolje performanse
  await client.query('CREATE INDEX idx_users_username ON users(username)');
  await client.query('CREATE INDEX idx_users_email ON users(email)');

  console.log('  ✓ Created users table');
};

exports.down = async (client) => {
  await client.query('DROP TABLE IF EXISTS users CASCADE');
  console.log('  ✓ Dropped users table');
};