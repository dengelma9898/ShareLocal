// Use Case: Register User
// Application Layer - Orchestriert Domain Logic und Ports

import { UserRepository } from '../../ports/repositories/UserRepository.js';
import { AuthService } from '../../ports/services/AuthService.js';
import { User } from '../../domain/entities/User.js';
import { AppError } from '../../adapters/http/middleware/errorHandler.js';

export interface RegisterUserData {
  email: string;
  name: string;
  password: string;
}

export class RegisterUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private authService: AuthService
  ) {}

  async execute(data: RegisterUserData): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(409, 'User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.authService.hashPassword(data.password);

    // Create user
    const user = await this.userRepository.create({
      email: data.email,
      name: data.name,
      passwordHash,
      emailVerified: false,
      role: 'USER',
    });

    // Generate token
    const token = this.authService.generateToken({
      userId: user.id,
      email: user.email,
    });

    return { user, token };
  }
}

