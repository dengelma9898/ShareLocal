// Integration Tests für Health Check Endpoints

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../setup/test-app.js';
import { cleanupTestDatabase } from '../setup/test-db.js';

describe('Health Check', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  describe('GET /health', () => {
    it('should return health status with all checks', async () => {
      const app = getTestApp();
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');

      // Prüfe Checks-Struktur
      expect(response.body.checks).toHaveProperty('api');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('encryption');

      // Alle Checks sollten 'ok' sein in einer gesunden Test-Umgebung
      expect(response.body.checks.api).toBe('ok');
      expect(response.body.checks.database).toBe('ok');
      expect(response.body.checks.encryption).toBe('ok');
      
      // Status sollte 'ok' sein wenn alle Checks ok sind
      expect(response.body.status).toBe('ok');
    });

    it('should return structured health check response', async () => {
      const app = getTestApp();
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      
      // Prüfe Response-Struktur
      expect(response.body).toMatchObject({
        status: expect.stringMatching(/^(ok|degraded|error)$/),
        checks: {
          api: expect.stringMatching(/^(ok|error)$/),
          database: expect.stringMatching(/^(ok|error)$/),
          encryption: expect.stringMatching(/^(ok|error)$/),
        },
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
      });

      // Timestamp sollte ein gültiges ISO-Datum sein
      expect(() => new Date(response.body.timestamp)).not.toThrow();
      
      // Uptime sollte eine positive Zahl sein
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const app = getTestApp();
      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('message', 'API is alive');
      expect(response.body).toHaveProperty('timestamp');
      
      // Timestamp sollte ein gültiges ISO-Datum sein
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status when ready', async () => {
      const app = getTestApp();
      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('checks');
      expect(response.body).toHaveProperty('timestamp');
      
      // Prüfe Checks-Struktur
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('encryption');
      
      // In einer gesunden Test-Umgebung sollten alle Checks 'ok' sein
      expect(response.body.checks.database).toBe('ok');
      expect(response.body.checks.encryption).toBe('ok');
    });

    it('should return structured readiness response', async () => {
      const app = getTestApp();
      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(200);
      
      // Prüfe Response-Struktur
      expect(response.body).toMatchObject({
        status: 'ready',
        checks: {
          database: expect.stringMatching(/^(ok|error)$/),
          encryption: expect.stringMatching(/^(ok|error)$/),
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('Health Check Endpoints are not rate limited', () => {
    it('should allow unlimited requests to /health', async () => {
      const app = getTestApp();
      
      // Mache viele Requests - sollten alle erfolgreich sein
      for (let i = 0; i < 200; i++) {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
      }
    });

    it('should allow unlimited requests to /health/live', async () => {
      const app = getTestApp();
      
      // Mache viele Requests - sollten alle erfolgreich sein
      for (let i = 0; i < 200; i++) {
        const response = await request(app).get('/health/live');
        expect(response.status).toBe(200);
      }
    });

    it('should allow unlimited requests to /health/ready', async () => {
      const app = getTestApp();
      
      // Mache viele Requests - sollten alle erfolgreich sein
      for (let i = 0; i < 200; i++) {
        const response = await request(app).get('/health/ready');
        expect(response.status).toBe(200);
      }
    });
  });
});

