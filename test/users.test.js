const request = require('supertest');
const app = require('../src/app');
const { clearDatabase, closeDatabase } = require('./setup');

describe('Users E2E Tests', () => {
  let basicUserToken;
  let basicUserId;
  let adminUserToken;
  let adminUserId;
  let otherUserId;

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

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'password123'
      });

    adminUserToken = adminLogin.body.token;

    // Kreiraj još jednog korisnika
    const otherUser = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        password: 'password123',
        role: 'basic'
      });

    otherUserId = otherUser.body.user.id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /api/users', () => {
    it('should return all users for admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThanOrEqual(3);
    });

    it('should fail for basic user', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${basicUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Admin access required');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get own profile as basic user', async () => {
      const response = await request(app)
        .get(`/api/users/${basicUserId}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('id', basicUserId);
      expect(response.body.user).toHaveProperty('username', 'johndoe');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should allow admin to get any user', async () => {
      const response = await request(app)
        .get(`/api/users/${basicUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('id', basicUserId);
    });

    it('should fail when basic user tries to access other user', async () => {
      const response = await request(app)
        .get(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update own profile as basic user', async () => {
      const response = await request(app)
        .put(`/api/users/${basicUserId}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({
          firstName: 'Johnny',
          lastName: 'Doe',
          email: 'johnny@example.com'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User updated successfully');
      // PostgreSQL vraća lowercase kolone
      const firstName = response.body.user.firstName || response.body.user.firstname;
      const email = response.body.user.email;
      expect(firstName).toBe('Johnny');
      expect(email).toBe('johnny@example.com');
    });

    it('should allow admin to update any user', async () => {
      const response = await request(app)
        .put(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          firstName: 'Janet',
          lastName: 'Smith',
          email: 'janet@example.com'
        })
        .expect(200);

      const firstName = response.body.user.firstName || response.body.user.firstname;
      expect(firstName).toBe('Janet');
    });

    it('should fail when basic user tries to update other user', async () => {
      await request(app)
        .put(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({
          firstName: 'Hacker',
          lastName: 'Attempt',
          email: 'hacker@example.com'
        })
        .expect(403);
    });

    it('should update password successfully', async () => {
      await request(app)
        .put(`/api/users/${basicUserId}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({
          firstName: 'Johnny',
          lastName: 'Doe',
          email: 'johnny@example.com',
          password: 'newpassword123'
        })
        .expect(200);

      // Proveri da novi password radi
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'johndoe',
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });

    it('should fail with duplicate email', async () => {
      await request(app)
        .put(`/api/users/${basicUserId}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .send({
          firstName: 'Johnny',
          lastName: 'Doe',
          email: 'admin@example.com' // Email admina
        })
        .expect(400);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should allow admin to delete user', async () => {
      // Kreiraj korisnika za brisanje
      const userToDelete = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Delete',
          lastName: 'Me',
          username: 'deleteme',
          email: 'delete@example.com',
          password: 'password123',
          role: 'basic'
        });

      const response = await request(app)
        .delete(`/api/users/${userToDelete.body.user.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User deleted successfully');

      // Proveri da korisnik više ne postoji
      await request(app)
        .get(`/api/users/${userToDelete.body.user.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(404);
    });

    it('should fail when basic user tries to delete user', async () => {
      await request(app)
        .delete(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${basicUserToken}`)
        .expect(403);
    });

    it('should cascade delete user tasks', async () => {
      // Kreiraj korisnika
      const user = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Cascade',
          lastName: 'User',
          username: 'cascadeuser',
          email: 'cascade@example.com',
          password: 'password123',
          role: 'basic'
        });

      const userId = user.body.user.id;

      // Login
      const login = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'cascadeuser',
          password: 'password123'
        });

      const token = login.body.token;

      // Kreiraj task
      const task = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ body: 'Task that will be deleted' });

      const taskId = task.body.task.id;

      // Obriši korisnika
      await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      // Proveri da je task takođe obrisan (CASCADE)
      const tasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      const taskExists = tasksResponse.body.tasks.some(t => t.id === taskId);
      expect(taskExists).toBe(false);
    });
  });
});