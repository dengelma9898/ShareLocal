// Integration Tests: Listing Endpoints
// Testet Listing CRUD Operations und Filter

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../setup/test-app.js';
import { cleanupTestDatabase } from '../setup/test-db.js';
import { createTestUser, createTestListing, generateTestToken } from '../setup/test-helpers.js';

describe('GET /api/listings', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should get all listings', async () => {
    const app = getTestApp();

    const owner = await createTestUser({
      email: `owner-${Date.now()}@example.com`,
      name: 'Owner',
    });

    await createTestListing({
      ownerId: owner.id,
      title: 'Test Listing 1',
      description: 'Description 1',
      category: 'TOOL',
      type: 'OFFER',
    });

    await createTestListing({
      ownerId: owner.id,
      title: 'Test Listing 2',
      description: 'Description 2',
      category: 'PLANT',
      type: 'REQUEST',
    });

    const response = await request(app)
      .get('/api/listings')
      .expect(200);

    expect(response.body.data.length).toBe(2);
  });

  it('should filter listings by category', async () => {
    const app = getTestApp();

    const owner = await createTestUser({
      email: `owner-category-${Date.now()}@example.com`,
      name: 'Owner',
    });

    await createTestListing({
      ownerId: owner.id,
      title: 'Tool Listing',
      description: 'A tool',
      category: 'TOOL',
      type: 'OFFER',
    });

    await createTestListing({
      ownerId: owner.id,
      title: 'Plant Listing',
      description: 'A plant',
      category: 'PLANT',
      type: 'OFFER',
    });

    const response = await request(app)
      .get('/api/listings?category=TOOL')
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].category).toBe('TOOL');
  });

  it('should filter listings by type', async () => {
    const app = getTestApp();

    const owner = await createTestUser({
      email: `owner-type-${Date.now()}@example.com`,
      name: 'Owner',
    });

    await createTestListing({
      ownerId: owner.id,
      title: 'Offer Listing',
      description: 'An offer',
      category: 'TOOL',
      type: 'OFFER',
    });

    await createTestListing({
      ownerId: owner.id,
      title: 'Request Listing',
      description: 'A request',
      category: 'TOOL',
      type: 'REQUEST',
    });

    const response = await request(app)
      .get('/api/listings?type=OFFER')
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].type).toBe('OFFER');
  });

  it('should search listings by title', async () => {
    const app = getTestApp();

    const owner = await createTestUser({
      email: `owner-search-${Date.now()}@example.com`,
      name: 'Owner',
    });

    await createTestListing({
      ownerId: owner.id,
      title: 'Hammer Tool',
      description: 'A hammer',
      category: 'TOOL',
      type: 'OFFER',
    });

    await createTestListing({
      ownerId: owner.id,
      title: 'Screwdriver Tool',
      description: 'A screwdriver',
      category: 'TOOL',
      type: 'OFFER',
    });

    const response = await request(app)
      .get('/api/listings?search=Hammer')
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].title).toContain('Hammer');
  });
});

describe('POST /api/listings', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should create a new listing', async () => {
    const app = getTestApp();

    const owner = await createTestUser({
      email: `owner-create-${Date.now()}@example.com`,
      name: 'Owner',
    });

    const token = generateTestToken(owner.id, owner.email);

    const response = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Listing',
        description: 'A new listing',
        category: 'TOOL',
        type: 'OFFER',
        price: 10.50,
      })
      .expect(201);

    expect(response.body.data.title).toBe('New Listing');
    expect(response.body.data.description).toBe('A new listing');
    expect(response.body.data.category).toBe('TOOL');
    expect(response.body.data.type).toBe('OFFER');
    expect(response.body.data.userId).toBe(owner.id); // Entity verwendet userId, nicht ownerId
  });

  it('should reject creation without authentication', async () => {
    const app = getTestApp();

    await request(app)
      .post('/api/listings')
      .send({
        title: 'New Listing',
        description: 'A new listing',
        category: 'TOOL',
        type: 'OFFER',
      })
      .expect(401);
  });

  it('should reject creation with invalid data', async () => {
    const app = getTestApp();

    const owner = await createTestUser({
      email: `owner-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'Owner',
    });

    const token = generateTestToken(owner.id, owner.email);

    const response = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        // title fehlt
        description: 'A new listing',
        category: 'TOOL',
        type: 'OFFER',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});

describe('PUT /api/listings/:id', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should update own listing', async () => {
    const app = getTestApp();

    const owner = await createTestUser({
      email: `owner-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'Owner',
    });

    const listing = await createTestListing({
      ownerId: owner.id,
      title: 'Original Title',
      description: 'Original description',
      category: 'TOOL',
      type: 'OFFER',
    });

    const token = generateTestToken(owner.id, owner.email);

    const response = await request(app)
      .put(`/api/listings/${listing.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Title',
        description: 'Updated description',
      })
      .expect(200);

    expect(response.body.data.title).toBe('Updated Title');
    expect(response.body.data.description).toBe('Updated description');
  });

  it('should reject update of other user listing', async () => {
    const app = getTestApp();

    const owner1 = await createTestUser({
      email: `owner1-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'Owner 1',
    });

    const owner2 = await createTestUser({
      email: `owner2-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'Owner 2',
    });

    const listing = await createTestListing({
      ownerId: owner1.id,
      title: 'Owner 1 Listing',
      description: 'Description',
      category: 'TOOL',
      type: 'OFFER',
    });

    const token = generateTestToken(owner2.id, owner2.email);

    await request(app)
      .put(`/api/listings/${listing.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Hacked Title',
      })
      .expect(403);
  });
});

describe('DELETE /api/listings/:id', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should delete own listing', async () => {
    const app = getTestApp();

    const owner = await createTestUser({
      email: `owner-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'Owner',
    });

    const listing = await createTestListing({
      ownerId: owner.id,
      title: 'To Delete',
      description: 'Will be deleted',
      category: 'TOOL',
      type: 'OFFER',
    });

    const token = generateTestToken(owner.id, owner.email);

    await request(app)
      .delete(`/api/listings/${listing.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    // Verify listing is deleted
    await request(app)
      .get(`/api/listings/${listing.id}`)
      .expect(404);
  });

  it('should reject delete of other user listing', async () => {
    const app = getTestApp();

    const owner1 = await createTestUser({
      email: `owner1-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'Owner 1',
    });

    const owner2 = await createTestUser({
      email: `owner2-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'Owner 2',
    });

    const listing = await createTestListing({
      ownerId: owner1.id,
      title: 'Owner 1 Listing',
      description: 'Description',
      category: 'TOOL',
      type: 'OFFER',
    });

    const token = generateTestToken(owner2.id, owner2.email);

    await request(app)
      .delete(`/api/listings/${listing.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});

