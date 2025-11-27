// Use Case: Get User
// Application Layer - Orchestriert Domain Logic und Ports

import { UserRepository } from '../../ports/repositories/UserRepository.js';
import { User } from '../../domain/entities/User.js';

export class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }
}

