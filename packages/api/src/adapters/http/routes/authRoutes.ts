// HTTP Adapter: Authentication Routes
// Express-spezifische Implementierung

import { Router } from 'express';
import { RegisterUserUseCase } from '../../../application/use-cases/RegisterUserUseCase.js';
import { LoginUserUseCase } from '../../../application/use-cases/LoginUserUseCase.js';
import { validateBody, ValidatedRequest } from '../middleware/validation.js';
import { registerSchema, loginSchema } from '../../../domain/validation/authSchemas.js';
import { authLimiter } from '../middleware/rateLimiter.js';

export function createAuthRoutes(
  registerUserUseCase: RegisterUserUseCase,
  loginUserUseCase: LoginUserUseCase
): Router {
  const router = Router();

  // POST /api/auth/register - Register new user
  router.post(
    '/register',
    authLimiter, // Rate Limiting für Registration
    validateBody(registerSchema),
    async (req: ValidatedRequest<any>, res, next) => {
      try {
        const { user, token } = await registerUserUseCase.execute(req.body);
        return res.status(201).json({
          data: {
            user: user.toJSON(),
            token,
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  // POST /api/auth/login - Login user
  router.post(
    '/login',
    authLimiter, // Rate Limiting für Login (Schutz gegen Brute-Force)
    validateBody(loginSchema),
    async (req: ValidatedRequest<any>, res, next) => {
      try {
        const { user, token } = await loginUserUseCase.execute(req.body);
        return res.json({
          data: {
            user: user.toJSON(),
            token,
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}

