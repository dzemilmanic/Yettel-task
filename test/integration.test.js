const request = require('supertest');
const app = require('../src/app');
const { clearDatabase, closeDatabase } = require('./setup');

describe('Full Integration E2E Tests', () => {
  afterAll(async () => {
    await closeDatabase();
  });

  describe('Complete User Journey', () => {
    let userToken;
    let userId;
    let taskId;

    beforeAll(async () => {
      await clearDatabase();
    });

    it('should complete full user workflow', async () => {
      // 1. Registracija
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Integration',
          lastName: 'Test',
          username: 'integrationtest',
          email: 'integration@test.com',
          password: 'password123',
          role: 'basic'
        })
        .expect(201);

      expect(registerResponse.body.message).toBe('User registered successfully');
      userId = registerResponse.body.user.id;

      // 2. Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'integrationtest',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      userToken = loginResponse.body.token;

      // 3. Kreiranje taska
      const createTaskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          body: 'Završiti integraciju testova'
        })
        .expect(201);

      expect(createTaskResponse.body.message).toBe('Task created successfully');
      taskId = createTaskResponse.body.task.id;

      // 4. Dobijanje liste taskova
      const getTasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getTasksResponse.body.tasks.length).toBe(1);
      expect(getTasksResponse.body.tasks[0].id).toBe(taskId);

      // 5. Dobijanje pojedinačnog taska
      const getTaskResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getTaskResponse.body.task.body).toBe('Završiti integraciju testova');

      // 6. Ažuriranje taska
      const updateTaskResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          body: 'Integracioni testovi su gotovi!'
        })
        .expect(200);

      expect(updateTaskResponse.body.task.body).toBe('Integracioni testovi su gotovi!');

      // 7. Dobijanje svog profila
      const getUserResponse = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getUserResponse.body.user.username).toBe('integrationtest');

      // 8. Ažuriranje profila
      const updateUserResponse = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          email: 'updated@test.com'
        })
        .expect(200);

      expect(updateUserResponse.body.user.firstName).toBe('Updated');
      expect(updateUserResponse.body.user.lastName).toBe('Name');

      // 9. Brisanje taska
      const deleteTaskResponse = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(deleteTaskResponse.body.message).toBe('Task deleted successfully');

      // 10. Provera da je task obrisan
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('Admin vs Basic User Permissions', () => {
    let adminToken;
    let basicToken;
    let basicUserId;
    let basicTaskId;

    beforeAll(async () => {
      await clearDatabase();

      // Kreiraj basic usera
      const basicUser = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Basic',
          lastName: 'User',
          username: 'basicuser',
          email: 'basic@test.com',
          password: 'password123',
          role: 'basic'
        });

      basicUserId = basicUser.body.user.id;

      const basicLogin = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'basicuser',
          password: 'password123'
        });

      basicToken = basicLogin.body.token;

      // Kreiraj task za basic usera
      const task = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${basicToken}`)
        .send({ body: 'Basic user task' });

      basicTaskId = task.body.task.id;

      // Kreiraj admin usera
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Admin',
          lastName: 'User',
          username: 'adminuser',
          email: 'admin@test.com',
          password: 'password123',
          role: 'admin'
        });

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'adminuser',
          password: 'password123'
        });

      adminToken = adminLogin.body.token;
    });

    it('basic user cannot access all users', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${basicToken}`)
        .expect(403);
    });

    it('admin can access all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.length).toBeGreaterThanOrEqual(2);
    });

    it('basic user cannot access other user tasks', async () => {
      // Admin kreira task
      const adminTask = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ body: 'Admin task' });

      // Basic user pokušava pristup
      await request(app)
        .get(`/api/tasks/${adminTask.body.task.id}`)
        .set('Authorization', `Bearer ${basicToken}`)
        .expect(403);
    });

    it('admin can access any task', async () => {
      await request(app)
        .get(`/api/tasks/${basicTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('basic user cannot update other user tasks', async () => {
      const adminTask = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ body: 'Admin task' });

      await request(app)
        .put(`/api/tasks/${adminTask.body.task.id}`)
        .set('Authorization', `Bearer ${basicToken}`)
        .send({ body: 'Trying to hack' })
        .expect(403);
    });

    it('admin can update any task', async () => {
      await request(app)
        .put(`/api/tasks/${basicTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ body: 'Admin updated this' })
        .expect(200);
    });

    it('basic user cannot delete users', async () => {
      await request(app)
        .delete(`/api/users/${basicUserId}`)
        .set('Authorization', `Bearer ${basicToken}`)
        .expect(403);
    });

    it('admin can delete users', async () => {
      // Kreiraj usera za brisanje
      const userToDelete = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'To',
          lastName: 'Delete',
          username: 'todelete',
          email: 'todelete@test.com',
          password: 'password123',
          role: 'basic'
        });

      await request(app)
        .delete(`/api/users/${userToDelete.body.user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Error Handling & Edge Cases', () => {
    let userToken;

    beforeAll(async () => {
      await clearDatabase();

      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Error',
          lastName: 'Test',
          username: 'errortest',
          email: 'error@test.com',
          password: 'password123',
          role: 'basic'
        });

      const login = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'errortest',
          password: 'password123'
        });

      userToken = login.body.token;
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle expired/invalid token', async () => {
      await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);
    });

    it('should handle missing Authorization header', async () => {
      await request(app)
        .get('/api/tasks')
        .expect(401);
    });

    it('should handle non-existent routes', async () => {
      await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    it('should handle SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: "admin' OR '1'='1",
          password: "password"
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should handle XSS attempts in task body', async () => {
      const xssAttempt = '<script>alert("XSS")</script>';
      
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          body: xssAttempt
        })
        .expect(201);

      // Trebalo bi da sačuva kao običan tekst
      expect(response.body.task.body).toBe(xssAttempt);
    });
  });
});