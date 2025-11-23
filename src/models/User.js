const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { firstName, lastName, username, email, password, role = 'basic' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (firstName, lastName, username, email, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [firstName, lastName, username, email, hashedPassword, role]
    );
    
    return result.rows[0].id;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, firstName, lastName, username, email, role, createdAt, updatedAt FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query(
      'SELECT id, firstName, lastName, username, email, role, createdAt, updatedAt FROM users ORDER BY createdAt DESC'
    );
    return result.rows;
  }

  static async update(id, userData) {
    const { firstName, lastName, email, password } = userData;
    let query = 'UPDATE users SET firstName = $1, lastName = $2, email = $3';
    let params = [firstName, lastName, email];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = $4 WHERE id = $5';
      params.push(hashedPassword, id);
    } else {
      query += ' WHERE id = $4';
      params.push(id);
    }

    const result = await pool.query(query, params);
    return result.rowCount > 0;
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;