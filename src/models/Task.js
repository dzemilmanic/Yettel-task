const pool = require('../config/database');

class Task {
  static async create(body, userId) {
    const result = await pool.query(
      'INSERT INTO tasks (body, userId) VALUES ($1, $2) RETURNING id',
      [body, userId]
    );
    return result.rows[0].id;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT t.*, u.username, u.firstName, u.lastName FROM tasks t JOIN users u ON t.userId = u.id WHERE t.id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      'SELECT t.*, u.username, u.firstName, u.lastName FROM tasks t JOIN users u ON t.userId = u.id WHERE t.userId = $1 ORDER BY t.createdAt DESC',
      [userId]
    );
    return result.rows;
  }

  static async findAll() {
    const result = await pool.query(
      'SELECT t.*, u.username, u.firstName, u.lastName FROM tasks t JOIN users u ON t.userId = u.id ORDER BY t.createdAt DESC'
    );
    return result.rows;
  }

  static async update(id, body) {
    const result = await pool.query(
      'UPDATE tasks SET body = $1 WHERE id = $2',
      [body, id]
    );
    return result.rowCount > 0;
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }
}

module.exports = Task;