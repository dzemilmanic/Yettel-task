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
      'SELECT t.id, t.body, t.userid, t.createdat, t.updatedat, u.username, u.firstname, u.lastname FROM tasks t JOIN users u ON t.userid = u.id WHERE t.id = $1',
      [id]
    );
    if (!result.rows[0]) return null;
    
    const task = result.rows[0];
    return {
      id: task.id,
      body: task.body,
      userId: task.userid,
      username: task.username,
      firstName: task.firstname,
      lastName: task.lastname,
      createdAt: task.createdat,
      updatedAt: task.updatedat
    };
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      'SELECT t.id, t.body, t.userid, t.createdat, t.updatedat, u.username, u.firstname, u.lastname FROM tasks t JOIN users u ON t.userid = u.id WHERE t.userid = $1 ORDER BY t.createdat DESC',
      [userId]
    );
    
    return result.rows.map(task => ({
      id: task.id,
      body: task.body,
      userId: task.userid,
      username: task.username,
      firstName: task.firstname,
      lastName: task.lastname,
      createdAt: task.createdat,
      updatedAt: task.updatedat
    }));
  }

  static async findAll() {
    const result = await pool.query(
      'SELECT t.id, t.body, t.userid, t.createdat, t.updatedat, u.username, u.firstname, u.lastname FROM tasks t JOIN users u ON t.userid = u.id ORDER BY t.createdat DESC'
    );
    
    return result.rows.map(task => ({
      id: task.id,
      body: task.body,
      userId: task.userid,
      username: task.username,
      firstName: task.firstname,
      lastName: task.lastname,
      createdAt: task.createdat,
      updatedAt: task.updatedat
    }));
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