// Integration Tests: User Endpoints
// Testet User CRUD Operations

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../setup/test-app.js';
import { cleanupTestDatabase } from '../setup/test-db.js';
import { createTestUser, generateTestToken } from '../setup/test-helpers.js';

describe('GET /api/users', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should get all users with pagination', async () => {
    const app = getTestApp();

    // Erstelle Test-Users
    await createTestUser({ email: 'user1@example.com', name: 'User 1' });
    await createTestUser({ email: 'user2@example.com', name: 'User 2' });
    await createTestUser({ email: 'user3@example.com', name: 'User 3' });

    const response = await request(app)
      .get('/api/users?limit=2&offset=0')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeLessThanOrEqual(2);
  });

  it('should return empty array when no users exist', async () => {
    const app = getTestApp();

    const response = await request(app)
      .get('/api/users')
      .expect(200);

    expect(response.body.data).toEqual([]);
  });
});

describe('GET /api/users/:id', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should get user by id', async () => {
    const app = getTestApp();

    const user = await createTestUser({
      email: 'test@example.com',
      name: 'Test User',
    });

    const response = await request(app)
      .get(`/api/users/${user.id}`)
      .expect(200);

    expect(response.body.data.id).toBe(user.id);
    expect(response.body.data.email).toBe('test@example.com');
    expect(response.body.data.name).toBe('Test User');
    expect(response.body.data).not.toHaveProperty('passwordHash');
  });

  it('should return 404 for non-existent user', async () => {
    const app = getTestApp();

    const response = await request(app)
      .get('/api/users/00000000-0000-0000-0000-000000000000')
      .expect(404);

    expect(response.body.error).toContain('not found');
  });

  it('should return 400 for invalid UUID', async () => {
    const app = getTestApp();

    const response = await request(app)
      .get('/api/users/invalid-id')
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});

describe('PUT /api/users/:id', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should update own user profile', async () => {
    const app = getTestApp();

    const user = await createTestUser({
      email: `test-update-${Date.now()}@example.com`,
      name: 'Test User',
    });

    const token = generateTestToken(user.id, user.email);

    const response = await request(app)
      .put(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
        bio: 'Updated bio',
      })
      .expect(200);

    expect(response.body.data.name).toBe('Updated Name');
    expect(response.body.data.bio).toBe('Updated bio');
  });

  it('should reject update without authentication', async () => {
    const app = getTestApp();

    const user = await createTestUser({
      email: `test-no-auth-${Date.now()}@example.com`,
      name: 'Test User',
    });

    await request(app)
      .put(`/api/users/${user.id}`)
      .send({
        name: 'Updated Name',
      })
      .expect(401);
  });

  it('should reject update of other user', async () => {
    const app = getTestApp();

    const user1 = await createTestUser({
      email: 'user1@example.com',
      name: 'User 1',
    });

    const user2 = await createTestUser({
      email: 'user2@example.com',
      name: 'User 2',
    });

    const token = generateTestToken(user1.id, user1.email);

    await request(app)
      .put(`/api/users/${user2.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Hacked Name',
      })
      .expect(403);
  });

  it('should reject update with invalid data', async () => {
    const app = getTestApp();

    const user = await createTestUser({
      email: `test-invalid-${Date.now()}@example.com`,
      name: 'Test User',
    });

    const token = generateTestToken(user.id, user.email);

    const response = await request(app)
      .put(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'A', // Invalid: name must be at least 2 characters
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('details');
  });
});

