const request = require('supertest');
const app = require('../src/app');
const { clearDatabase, closeDatabase } = require('./setup');

describe('Tasks E2E Tests', () => {
  let basicUserToken;
  let basicUserId;
  let adminUserToken;
  let adminUserId;
  let taskId;

  beforeAll(async () => {
    await clearDatabase();

    // Registruj basic korisnika
    const basicUser = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        role: 'basic'
      });

    basicUserId = basicUser.body.user.id;

    // Login basic korisnik
    const basicLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'johndoe',
        password: 'password123'
      });

    basicUserToken = basicLogin.body.token;

    // Registruj admin korisnika
    const adminUser = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Admin',
        lastName: 'User',
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      });

    adminUserId = adminUser.body.user.id;

    // Login admin korisnik
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'password123'
      });

    adminUserToken = adminLogin.body.token;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/tasks', () => {
    it('should create a task as basic user', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({
          body: 'Završiti projekat do petka'
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Task created successfully');
      expect(response.body.task).toHaveProperty('id');
      expect(response.body.task).toHaveProperty('body', 'Završiti projekat do petka');
      expect(response.body.task).toHaveProperty('userId', basicUserId);

      taskId = response.body.task.id;
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          body: 'Test task'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token is required');
    });

    it('should fail with empty body', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({
          body: ''
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Task body is required');
    });
  });

  describe('GET /api/tasks', () => {
    beforeAll(async () => {
      // Kreiraj task za basic usera
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({ body: 'Basic user task 1' });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({ body: 'Basic user task 2' });

      // Kreiraj task za admin usera
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({ body: 'Admin task' });
    });

    it('should return only user tasks for basic user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${basicUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(Array.isArray(response.body.tasks)).toBe(true);
      
      // Basic user treba da vidi samo svoje taskove
      const allTasksBelongToUser = response.body.tasks.every(
        task => task.userId === basicUserId
      );
      expect(allTasksBelongToUser).toBe(true);
    });

    it('should return all tasks for admin user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(response.body.tasks.length).toBeGreaterThanOrEqual(3);
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/tasks')
        .expect(401);
    });
  });

  describe('GET /api/tasks/:id', () => {
    let userTaskId;

    beforeAll(async () => {
      const task = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({ body: 'Test task for get by id' });

      userTaskId = task.body.task.id;
    });

    it('should get own task by id', async () => {
      const response = await request(app)
        .get(`/api/tasks/${userTaskId}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .expect(200);

      expect(response.body.task).toHaveProperty('id', userTaskId);
      expect(response.body.task).toHaveProperty('body', 'Test task for get by id');
    });

    it('should allow admin to get any task', async () => {
      const response = await request(app)
        .get(`/api/tasks/${userTaskId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(response.body.task).toHaveProperty('id', userTaskId);
    });

    it('should fail when accessing other user task as basic user', async () => {
      // Kreiraj task sa admin userom
      const adminTask = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({ body: 'Admin only task' });

      // Pokušaj pristup sa basic userom
      const response = await request(app)
        .get(`/api/tasks/${adminTask.body.task.id}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should return 404 for non-existent task', async () => {
      await request(app)
        .get('/api/tasks/99999')
        .set('Authorization', `Bearer ${basicUserToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let userTaskId;

    beforeAll(async () => {
      const task = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({ body: 'Original task' });

      userTaskId = task.body.task.id;
    });

    it('should update own task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${userTaskId}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({
          body: 'Updated task'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Task updated successfully');
      expect(response.body.task).toHaveProperty('body', 'Updated task');
    });

    it('should allow admin to update any task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${userTaskId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          body: 'Admin updated this'
        })
        .expect(200);

      expect(response.body.task).toHaveProperty('body', 'Admin updated this');
    });

    it('should fail when basic user tries to update other user task', async () => {
      const adminTask = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({ body: 'Admin task' });

      await request(app)
        .put(`/api/tasks/${adminTask.body.task.id}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({ body: 'Trying to update' })
        .expect(403);
    });

    it('should fail with empty body', async () => {
      await request(app)
        .put(`/api/tasks/${userTaskId}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({ body: '' })
        .expect(400);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete own task', async () => {
      const task = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({ body: 'Task to delete' });

      const response = await request(app)
        .delete(`/api/tasks/${task.body.task.id}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Task deleted successfully');

      // Proveri da je task obrisan
      await request(app)
        .get(`/api/tasks/${task.body.task.id}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .expect(404);
    });

    it('should allow admin to delete any task', async () => {
      const task = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({ body: 'Task to be deleted by admin' });

      await request(app)
        .delete(`/api/tasks/${task.body.task.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);
    });

    it('should fail when basic user tries to delete other user task', async () => {
      const adminTask = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({ body: 'Admin task' });

      await request(app)
        .delete(`/api/tasks/${adminTask.body.task.id}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .expect(403);
    });
  });
});