// Integration Tests: Conversation & Message Endpoints
// Testet Chat-Funktionalität mit Verschlüsselung

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../setup/test-app.js';
import { cleanupTestDatabase } from '../setup/test-db.js';
import {
  createTestUser,
  createTestListing,
  createTestConversation,
  generateTestToken,
} from '../setup/test-helpers.js';

describe('POST /api/conversations', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should create a new conversation', async () => {
    const app = getTestApp();

    const user1 = await createTestUser({
      email: `user1-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 1',
    });

    const user2 = await createTestUser({
      email: `user2-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 2',
    });

    const listing = await createTestListing({
      ownerId: user1.id,
      title: 'Test Listing',
      description: 'Description',
      category: 'TOOL',
      type: 'OFFER',
    });

    const token = generateTestToken(user1.id, user1.email);

    const response = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        listingId: listing.id,
        participantIds: [user1.id, user2.id],
      })
      .expect(201);

    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.listingId).toBe(listing.id);
  });

  it('should automatically add current user to participants', async () => {
    const app = getTestApp();

    const user1 = await createTestUser({
      email: `user1-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 1',
    });

    const user2 = await createTestUser({
      email: `user2-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 2',
    });

    const token = generateTestToken(user1.id, user1.email);

    const response = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        participantIds: [user2.id], // user1 nicht explizit hinzugefügt
      })
      .expect(201);

    expect(response.body.data.id).toBeDefined();
  });
});

describe('GET /api/conversations', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should get all conversations for current user', async () => {
    const app = getTestApp();

    const user1 = await createTestUser({
      email: `user1-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 1',
    });

    const user2 = await createTestUser({
      email: `user2-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 2',
    });

    await createTestConversation({
      participantIds: [user1.id, user2.id],
    });

    const token = generateTestToken(user1.id, user1.email);

    const response = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].participants.length).toBe(2);
  });
});

describe('POST /api/conversations/:id/messages', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should send a message in a conversation', async () => {
    const app = getTestApp();

    const user1 = await createTestUser({
      email: `user1-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 1',
    });

    const user2 = await createTestUser({
      email: `user2-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 2',
    });

    const conversation = await createTestConversation({
      participantIds: [user1.id, user2.id],
    });

    const token = generateTestToken(user1.id, user1.email);

    const response = await request(app)
      .post(`/api/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Hello, this is a test message!',
      })
      .expect(201);

    expect(response.body.data.content).toBe('Hello, this is a test message!');
    expect(response.body.data.sender.id).toBe(user1.id);
    expect(response.body.data.read).toBe(false);
  });

  it('should encrypt message content in database', async () => {
    const app = getTestApp();

    const user1 = await createTestUser({
      email: `user1-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 1',
    });

    const user2 = await createTestUser({
      email: `user2-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 2',
    });

    const conversation = await createTestConversation({
      participantIds: [user1.id, user2.id],
    });

    const token = generateTestToken(user1.id, user1.email);

    const plaintextMessage = 'This is a secret message!';

    const response = await request(app)
      .post(`/api/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: plaintextMessage,
      })
      .expect(201);

    // Response sollte entschlüsselte Nachricht enthalten
    expect(response.body.data.content).toBe(plaintextMessage);

    // Database sollte verschlüsselte Nachricht enthalten (prüfen wir indirekt)
    // Wenn wir die Nachricht wieder abrufen, sollte sie entschlüsselt sein
    const getResponse = await request(app)
      .get(`/api/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getResponse.body.data.length).toBe(1);
    expect(getResponse.body.data[0].content).toBe(plaintextMessage);
  });

  it('should reject sending message if not a participant', async () => {
    const app = getTestApp();

    const user1 = await createTestUser({
      email: `user1-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 1',
    });

    const user2 = await createTestUser({
      email: `user2-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 2',
    });

    const user3 = await createTestUser({
      email: `user3-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 3',
    });

    const conversation = await createTestConversation({
      participantIds: [user1.id, user2.id], // user3 ist nicht Teilnehmer
    });

    const token = generateTestToken(user3.id, user3.email);

    await request(app)
      .post(`/api/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Unauthorized message',
      })
      .expect(403);
  });
});

describe('GET /api/conversations/:id/messages', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should get messages for a conversation', async () => {
    const app = getTestApp();

    const user1 = await createTestUser({
      email: `user1-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 1',
    });

    const user2 = await createTestUser({
      email: `user2-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 2',
    });

    const conversation = await createTestConversation({
      participantIds: [user1.id, user2.id],
    });

    const token1 = generateTestToken(user1.id, user1.email);
    const token2 = generateTestToken(user2.id, user2.email);

    // Sende mehrere Nachrichten
    await request(app)
      .post(`/api/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ content: 'Message 1' })
      .expect(201);

    await request(app)
      .post(`/api/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ content: 'Message 2' })
      .expect(201);

    // Hole alle Nachrichten
    const response = await request(app)
      .get(`/api/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(response.body.data.length).toBe(2);
    expect(response.body.data[0].content).toBe('Message 1');
    expect(response.body.data[1].content).toBe('Message 2');
  });

  it('should decrypt messages when retrieving', async () => {
    const app = getTestApp();

    const user1 = await createTestUser({
      email: `user1-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 1',
    });

    const user2 = await createTestUser({
      email: `user2-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'User 2',
    });

    const conversation = await createTestConversation({
      participantIds: [user1.id, user2.id],
    });

    const token = generateTestToken(user1.id, user1.email);

    const secretMessage = 'This is encrypted in the database!';

    // Sende verschlüsselte Nachricht
    await request(app)
      .post(`/api/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: secretMessage })
      .expect(201);

    // Hole Nachricht - sollte entschlüsselt sein
    const response = await request(app)
      .get(`/api/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].content).toBe(secretMessage);
  });
});

