// Integration Tests für Rate Limiting
// Testet, dass Rate Limiting korrekt funktioniert

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import cors from 'cors';
import { createAuthRoutes } from '../../adapters/http/routes/authRoutes.js';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase.js';
import { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase.js';
import { PrismaUserRepository } from '../../adapters/database/PrismaUserRepository.js';
import { JwtAuthService } from '../../adapters/services/JwtAuthService.js';
import { getTestPrismaClient } from '../setup/test-db.js';
import { cleanupTestDatabase } from '../setup/test-db.js';
import { createTestUser } from '../setup/test-helpers.js';
import rateLimit from 'express-rate-limit';

// Rate Limiter mit niedrigen Limits für Tests
const testAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 Versuche für Tests
  message: {
    error: 'Zu viele Login-Versuche',
    message: 'Bitte versuchen Sie es später erneut. Maximal 5 Versuche pro 15 Minuten.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Erstelle Test-App mit Rate Limiting aktiviert
function createTestAppWithRateLimit(): Express {
  const prisma = getTestPrismaClient();
  const userRepository = new PrismaUserRepository(prisma);
  const authService = new JwtAuthService();
  
  const registerUserUseCase = new RegisterUserUseCase(userRepository, authService);
  const loginUserUseCase = new LoginUserUseCase(userRepository, authService);

  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // Rate Limiter auf Auth-Routes anwenden
  app.use('/api/auth', testAuthLimiter, createAuthRoutes(registerUserUseCase, loginUserUseCase));
  
  return app;
}

describe('Rate Limiting', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  describe('Auth Endpoints', () => {
    it('should allow requests within rate limit', async () => {
      // Erstelle eine neue App-Instanz für diesen Test (isoliert Rate Limits)
      const app = createTestAppWithRateLimit();
      const testEmail = `test-rate-limit-${Date.now()}@example.com`;
      const testPassword = 'test123456';

      // Erstelle einen Test-User
      await createTestUser({
        email: testEmail,
        name: 'Test User',
        password: testPassword,
      });

      // Erste 4 Requests sollten erfolgreich sein (5. könnte bereits limitiert sein)
      for (let i = 0; i < 4; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: testEmail,
            password: testPassword,
          });

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('token');
      }
    });

    it('should block requests exceeding rate limit for login', async () => {
      // Erstelle eine neue App-Instanz für diesen Test (isoliert Rate Limits)
      const app = createTestAppWithRateLimit();
      const testEmail = `test-rate-limit-block-${Date.now()}@example.com`;
      const testPassword = 'test123456';

      // Erstelle einen Test-User
      await createTestUser({
        email: testEmail,
        name: 'Test User',
        password: testPassword,
      });

      // Rate Limit ist 5, also sollten die ersten Requests erfolgreich sein
      // Teste, dass Rate Limiting funktioniert, indem wir viele Requests machen
      const responses = [];
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: testEmail,
            password: testPassword,
          });
        responses.push(response);
      }

      // Mindestens einige Requests sollten erfolgreich sein (200)
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);

      // Mindestens einer der Requests sollte blockiert werden (429) - das beweist, dass Rate Limiting funktioniert
      const blockedCount = responses.filter((r) => r.status === 429).length;
      expect(blockedCount).toBeGreaterThan(0);

      // Prüfe, dass mindestens ein Request blockiert wurde und die richtige Fehlermeldung hat
      const blockedResponse = responses.find((r) => r.status === 429);
      expect(blockedResponse).toBeDefined();
      expect(blockedResponse!.body).toHaveProperty('error');
      expect(blockedResponse!.body.error).toContain('Zu viele Login-Versuche');
    });

    it('should block requests exceeding rate limit for register', async () => {
      // Erstelle eine neue App-Instanz für diesen Test (isoliert Rate Limits)
      const app = createTestAppWithRateLimit();

      // Versuche 6 Registrierungen (Rate Limit ist 5)
      const responses = [];
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: `Test User ${i}`,
            email: `test-register-${Date.now()}-${i}@example.com`,
            password: 'test123456',
          });
        responses.push(response);
      }

      // Mindestens einer der Requests sollte 429 sein (Rate Limit überschritten)
      const hasRateLimitError = responses.some((r) => r.status === 429);
      expect(hasRateLimitError).toBe(true);
      
      // Wenn der letzte Request 429 ist, prüfe die Fehlermeldung
      const lastResponse = responses[responses.length - 1];
      if (lastResponse.status === 429) {
        expect(lastResponse.body).toHaveProperty('error');
        expect(lastResponse.body.error).toContain('Zu viele Login-Versuche');
      }
    });
  });
});
