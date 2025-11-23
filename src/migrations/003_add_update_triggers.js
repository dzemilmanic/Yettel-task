exports.up = async (client) => {
  // Kreiranje funkcije za auto-update updatedAt
  await client.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updatedAt = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql'
  `);

  // Trigger za users tabelu
  await client.query(`
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column()
  `);

  // Trigger za tasks tabelu
  await client.query(`
    CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column()
  `);

  console.log('  ✓ Created update triggers');
};

exports.down = async (client) => {
  await client.query('DROP TRIGGER IF EXISTS update_users_updated_at ON users');
  await client.query('DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks');
  await client.query('DROP FUNCTION IF EXISTS update_updated_at_column()');
  console.log('  ✓ Dropped update triggers');
};