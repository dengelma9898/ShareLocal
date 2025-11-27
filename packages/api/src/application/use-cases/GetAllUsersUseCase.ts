// Use Case: Get All Users
// Application Layer - Orchestriert Domain Logic und Ports

import { UserRepository } from '../../ports/repositories/UserRepository.js';
import { User } from '../../domain/entities/User.js';

export class GetAllUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(limit = 50, offset = 0): Promise<{ users: User[]; total: number }> {
    const users = await this.userRepository.findAll(limit, offset);
    const total = await this.userRepository.count();

    return { users, total };
  }
}

