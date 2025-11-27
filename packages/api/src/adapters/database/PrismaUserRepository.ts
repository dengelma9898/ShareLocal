// Adapter: Prisma Implementation für UserRepository
// Konkrete Implementierung des UserRepository Ports

import { PrismaClient } from '@prisma/client';
import { UserRepository, CreateUserData, UpdateUserData } from '../../ports/repositories/UserRepository.js';
import { User } from '../../domain/entities/User.js';

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!userData) return null;

    return new User(userData);
  }

  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (!userData) return null;

    return new User(userData);
  }

  async findByEmailWithPassword(email: string): Promise<(User & { passwordHash: string }) | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (!userData) return null;

    const user = new User(userData);
    // Füge passwordHash als Property hinzu, behalte aber User-Instanz
    Object.assign(user, { passwordHash: userData.passwordHash });
    return user as User & { passwordHash: string };
  }

  async create(data: CreateUserData): Promise<User> {
    const userData = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        emailVerified: data.emailVerified ?? false,
        role: data.role ?? 'USER',
      },
    });

    return new User(userData);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const userData = await this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return new User(userData);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async findAll(limit = 50, offset = 0): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((userData) => new User(userData));
  }

  async count(): Promise<number> {
    return this.prisma.user.count({
      where: { deletedAt: null },
    });
  }
}

