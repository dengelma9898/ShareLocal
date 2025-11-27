// Verification Test
// Einfacher Test um zu prüfen, ob die Test-Infrastruktur funktioniert
// Dieser Test sollte ZUERST ausgeführt werden, um Setup zu verifizieren

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { getTestApp } from './test-app.js';
import { getTestPrismaClient, cleanupTestDatabase, closeTestDatabase } from './test-db.js';
import { createTestUser } from './test-helpers.js';

describe('Test Infrastructure Verification', () => {
  beforeAll(async () => {
    // Stelle sicher, dass Environment Variables gesetzt sind
    if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
      console.warn(
        '⚠️  WARNING: TEST_DATABASE_URL or DATABASE_URL not set.\n' +
        '   Tests may fail. Please set TEST_DATABASE_URL in .env.test'
      );
    }
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await closeTestDatabase();
  });

  it('should be able to create test app', () => {
    const app = getTestApp();
    expect(app).toBeDefined();
  });

  it('should be able to connect to test database', async () => {
    const prisma = getTestPrismaClient();
    expect(prisma).toBeDefined();
    
    // Teste einfache Query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
  });

  it('should be able to cleanup database', async () => {
    await cleanupTestDatabase();
    // Sollte ohne Fehler durchlaufen
    expect(true).toBe(true);
  });

  it('should be able to create test user', async () => {
    await cleanupTestDatabase();
    
    const user = await createTestUser({
      email: 'verify@example.com',
      name: 'Verify User',
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('verify@example.com');
    expect(user.name).toBe('Verify User');
    
    await cleanupTestDatabase();
  });

  it('should be able to make HTTP request to test app', async () => {
    const app = getTestApp();
    
    // Teste Health Endpoint mit supertest
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    // Health Check gibt jetzt strukturierte Response zurück
    expect(response.body.status).toMatch(/^(ok|degraded|error)$/);
    expect(response.body).toHaveProperty('checks');
    expect(response.body.checks).toHaveProperty('api');
    expect(response.body.checks).toHaveProperty('database');
    expect(response.body.checks).toHaveProperty('encryption');
  });

  it('should be able to access API root endpoint', async () => {
    const app = getTestApp();
    
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.body.message).toBe('ShareLocal API');
  });
});

