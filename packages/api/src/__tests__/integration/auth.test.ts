// Integration Tests: Authentication Endpoints
// Testet Register und Login Flows

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../setup/test-app.js';
import { cleanupTestDatabase } from '../setup/test-db.js';
import { createTestUser } from '../setup/test-helpers.js';

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should register a new user successfully', async () => {
    const app = getTestApp();

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'test123456',
      })
      .expect(201);

    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data.user.email).toBe('test@example.com');
    expect(response.body.data.user.name).toBe('Test User');
    expect(response.body.data.user).not.toHaveProperty('passwordHash');
    expect(typeof response.body.data.token).toBe('string');
  });

  it('should reject registration with invalid email', async () => {
    const app = getTestApp();

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        name: 'Test User',
        password: 'test123456',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('details');
  });

  it('should reject registration with short password', async () => {
    const app = getTestApp();

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'short',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should reject registration with duplicate email', async () => {
    const app = getTestApp();

    // Erstelle ersten User
    await createTestUser({
      email: 'existing@example.com',
      name: 'Existing User',
    });

    // Versuche zweiten User mit gleicher Email zu registrieren
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'existing@example.com',
        name: 'New User',
        password: 'test123456',
      })
      .expect(409);

    expect(response.body.error).toContain('already exists');
  });

  it('should reject registration with missing fields', async () => {
    const app = getTestApp();

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        // name fehlt
        password: 'test123456',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should login successfully with correct credentials', async () => {
    const app = getTestApp();

    // Erstelle Test-User
    await createTestUser({
      email: 'test@example.com',
      name: 'Test User',
      password: 'test123456',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'test123456',
      })
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data.user.email).toBe('test@example.com');
    expect(typeof response.body.data.token).toBe('string');
  });

  it('should reject login with wrong password', async () => {
    const app = getTestApp();

    await createTestUser({
      email: 'test@example.com',
      name: 'Test User',
      password: 'correctpassword',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword',
      })
      .expect(401);

    expect(response.body.error).toContain('Invalid email or password');
  });

  it('should reject login with non-existent email', async () => {
    const app = getTestApp();

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'test123456',
      })
      .expect(401);

    expect(response.body.error).toContain('Invalid email or password');
  });

  it('should reject login with invalid email format', async () => {
    const app = getTestApp();

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid-email',
        password: 'test123456',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should reject login with missing fields', async () => {
    const app = getTestApp();

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        // password fehlt
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});

