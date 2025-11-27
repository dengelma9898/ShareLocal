// Authentication Middleware für Express
// Verifiziert JWT Tokens und fügt User-Context zu Requests hinzu

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../../ports/services/AuthService.js';
import { UserRepository } from '../../../ports/repositories/UserRepository.js';
import { AppError } from './errorHandler.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authenticate(authService: AuthService, userRepository: UserRepository) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(401, 'Authentication required');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const payload = authService.verifyToken(token);
      if (!payload) {
        throw new AppError(401, 'Invalid or expired token');
      }

      // Verify user still exists
      const user = await userRepository.findById(payload.userId);
      if (!user || user.isDeleted()) {
        throw new AppError(401, 'User not found');
      }

      // Add user to request
      req.user = {
        userId: payload.userId,
        email: payload.email,
      };

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }
      return next(new AppError(401, 'Authentication failed'));
    }
  };
}

