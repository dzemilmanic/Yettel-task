const request = require('supertest');
const app = require('../src/app');
const { clearDatabase, closeDatabase } = require('./setup');

describe('Authentication E2E Tests', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          email: 'john@example.com',
          password: 'password123',
          role: 'basic'
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('username', 'johndoe');
      expect(response.body.user).toHaveProperty('email', 'john@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail with duplicate username', async () => {
      // Prvi korisnik
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          email: 'john1@example.com',
          password: 'password123'
        });

      // Pokušaj sa istim username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          username: 'johndoe',
          email: 'john2@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Username already exists');
    });

    it('should fail with duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe1',
          email: 'john@example.com',
          password: 'password123'
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          username: 'johndoe2',
          email: 'john@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email already exists');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'johndoe',
          password: 'password123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          email: 'john@example.com',
          password: '123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Registruj test korisnika pre svakog testa
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          email: 'john@example.com',
          password: 'password123',
          role: 'basic'
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'johndoe',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username', 'johndoe');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'wronguser',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'johndoe',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });
});