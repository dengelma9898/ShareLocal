// Unit Tests: RegisterUserUseCase
// Testet Business Logic mit Mock-Repositories

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegisterUserUseCase } from '../../../application/use-cases/RegisterUserUseCase.js';
import { UserRepository } from '../../../ports/repositories/UserRepository.js';
import { AuthService } from '../../../ports/services/AuthService.js';
import { User } from '../../../domain/entities/User.js';
import { AppError } from '../../../adapters/http/middleware/errorHandler.js';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockUserRepository: UserRepository;
  let mockAuthService: AuthService;

  beforeEach(() => {
    // Mock Repositories und Services
    mockUserRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as UserRepository;

    mockAuthService = {
      hashPassword: vi.fn(),
      comparePassword: vi.fn(),
      generateToken: vi.fn(),
    } as unknown as AuthService;

    useCase = new RegisterUserUseCase(mockUserRepository, mockAuthService);
  });

  it('should register a new user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'test123456',
    };

    const mockUser = new User({
      id: 'user-id',
      email: userData.email,
      name: userData.name,
      emailVerified: false,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockToken = 'jwt-token';

    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(mockAuthService.hashPassword).mockResolvedValue('hashed-password');
    vi.mocked(mockUserRepository.create).mockResolvedValue(mockUser);
    vi.mocked(mockAuthService.generateToken).mockReturnValue(mockToken);

    const result = await useCase.execute(userData);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
    expect(mockAuthService.hashPassword).toHaveBeenCalledWith(userData.password);
    expect(mockUserRepository.create).toHaveBeenCalledWith({
      email: userData.email,
      name: userData.name,
      passwordHash: 'hashed-password',
      emailVerified: false,
      role: 'USER',
    });
    expect(mockAuthService.generateToken).toHaveBeenCalledWith({
      userId: mockUser.id,
      email: mockUser.email,
    });
    expect(result.user).toEqual(mockUser);
    expect(result.token).toBe(mockToken);
  });

  it('should throw error if user already exists', async () => {
    const userData = {
      email: 'existing@example.com',
      name: 'Test User',
      password: 'test123456',
    };

    const existingUser = new User({
      id: 'existing-id',
      email: userData.email,
      name: 'Existing User',
      emailVerified: false,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);

    await expect(useCase.execute(userData)).rejects.toThrow(AppError);
    await expect(useCase.execute(userData)).rejects.toThrow('already exists');

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });

  it('should hash password before creating user', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'test123456',
    };

    const mockUser = new User({
      id: 'user-id',
      email: userData.email,
      name: userData.name,
      emailVerified: false,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(mockAuthService.hashPassword).mockResolvedValue('hashed-password');
    vi.mocked(mockUserRepository.create).mockResolvedValue(mockUser);
    vi.mocked(mockAuthService.generateToken).mockReturnValue('token');

    await useCase.execute(userData);

    expect(mockAuthService.hashPassword).toHaveBeenCalledWith(userData.password);
    expect(mockUserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: 'hashed-password',
      })
    );
  });
});

