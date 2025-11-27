// Use Case: Login User
// Application Layer - Orchestriert Domain Logic und Ports

import { UserRepository } from '../../ports/repositories/UserRepository.js';
import { AuthService } from '../../ports/services/AuthService.js';
import { User } from '../../domain/entities/User.js';
import { AppError } from '../../adapters/http/middleware/errorHandler.js';

export interface LoginUserData {
  email: string;
  password: string;
}

export class LoginUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private authService: AuthService
  ) {}

  async execute(data: LoginUserData): Promise<{ user: User; token: string }> {
    // Find user by email with password hash
    const userWithPassword = await this.userRepository.findByEmailWithPassword(data.email);
    if (!userWithPassword) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.authService.verifyPassword(
      data.password,
      userWithPassword.passwordHash
    );

    if (!isValidPassword) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Get clean User instance without passwordHash
    // userWithPassword is a User instance, we just need to ensure it's clean
    // The passwordHash property is added via Object.assign, so the User methods are preserved
    const user = userWithPassword as User;

    // Generate token
    const token = this.authService.generateToken({
      userId: user.id,
      email: user.email,
    });

    return { user, token };
  }
}

