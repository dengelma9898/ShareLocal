// HTTP Adapter: User Routes
// Express-spezifische Implementierung

import { Router } from 'express';
import { GetUserUseCase } from '../../../application/use-cases/GetUserUseCase.js';
import { GetAllUsersUseCase } from '../../../application/use-cases/GetAllUsersUseCase.js';
import { UpdateUserUseCase } from '../../../application/use-cases/UpdateUserUseCase.js';
import { validateParams, validateBody, ValidatedRequest } from '../middleware/validation.js';
import { getUserParamsSchema, updateUserSchema } from '../../../domain/validation/userSchemas.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { AuthService } from '../../../ports/services/AuthService.js';
import { UserRepository } from '../../../ports/repositories/UserRepository.js';
import { AppError } from '../middleware/errorHandler.js';

export function createUserRoutes(
  getUserUseCase: GetUserUseCase,
  getAllUsersUseCase: GetAllUsersUseCase,
  updateUserUseCase: UpdateUserUseCase,
  authService: AuthService,
  userRepository: UserRepository
): Router {
  const router = Router();

  // GET /api/users - List all users
  router.get('/', async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const { users, total } = await getAllUsersUseCase.execute(limit, offset);

      res.json({
        data: users.map((user) => user.toJSON()),
        pagination: {
          limit,
          offset,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  // GET /api/users/me - Get current user's profile (Protected)
  router.get(
    '/me',
    authenticate(authService, userRepository),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        // Use userId from token
        const userId = req.user!.userId;
        const user = await getUserUseCase.execute(userId);

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ data: user.toJSON() });
      } catch (error) {
        return next(error);
      }
    }
  );

  // GET /api/users/:id - Get user by ID
  router.get(
    '/:id',
    validateParams(getUserParamsSchema),
    async (req: ValidatedRequest<{ id: string }>, res, next) => {
      try {
        const { id } = req.validated!;
        const user = await getUserUseCase.execute(id);

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ data: user.toJSON() });
      } catch (error) {
        return next(error);
      }
    }
  );

  // PUT /api/users/me - Update current user's profile (Protected)
  router.put(
    '/me',
    authenticate(authService, userRepository),
    validateBody(updateUserSchema),
    async (req: AuthenticatedRequest & ValidatedRequest<UpdateUserInput>, res, next) => {
      try {
        // Use userId from token - no need to check ownership
        const userId = req.user!.userId;
        const updateData = req.validated!;
        const user = await updateUserUseCase.execute(userId, updateData);
        return res.json({ data: user.toJSON() });
      } catch (error) {
        return next(error);
      }
    }
  );

  // PUT /api/users/:id - Update user (Protected: nur eigener Account)
  router.put(
    '/:id',
    authenticate(authService, userRepository),
    validateParams(getUserParamsSchema),
    validateBody(updateUserSchema),
    async (req: AuthenticatedRequest & ValidatedRequest<GetUserParams & UpdateUserInput>, res, next) => {
      try {
        const validatedData = req.validated!;
        const { id } = validatedData;
        
        // Check if user is updating their own account
        if (req.user?.userId !== id) {
          throw new AppError(403, 'You can only update your own account');
        }
        
        // Extract update data (exclude id from update)
        const updateData: UpdateUserInput = { ...validatedData };
        delete (updateData as { id?: string }).id;
        const user = await updateUserUseCase.execute(id, updateData);
        return res.json({ data: user.toJSON() });
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}
