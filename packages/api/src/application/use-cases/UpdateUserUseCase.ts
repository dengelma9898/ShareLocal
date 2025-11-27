// Use Case: Update User
// Application Layer - Orchestriert Domain Logic und Ports

import { UserRepository, UpdateUserData } from '../../ports/repositories/UserRepository.js';
import { User } from '../../domain/entities/User.js';
import { AppError } from '../../adapters/http/middleware/errorHandler.js';

export class UpdateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: string, data: UpdateUserData): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return this.userRepository.update(userId, data);
  }
}

