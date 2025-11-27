// Port: User Repository Interface
// Definiert die Schnittstelle für User-Datenzugriff
// Kann später durch verschiedene Implementierungen ersetzt werden (Prisma, MongoDB, etc.)

import { User } from '../../domain/entities/User.js';

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
  emailVerified?: boolean;
  role?: 'USER' | 'ADMIN';
}

export interface UpdateUserData {
  name?: string;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  avatar?: string | null;
}

export interface UserRepository {
  // CRUD Operations
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailWithPassword(email: string): Promise<(User & { passwordHash: string }) | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;

  // Query Operations
  findAll(limit?: number, offset?: number): Promise<User[]>;
  count(): Promise<number>;
}

