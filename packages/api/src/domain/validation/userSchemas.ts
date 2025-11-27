// Validation Schemas für User mit Zod

import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  emailVerified: z.boolean().optional().default(false),
  role: z.enum(['USER', 'ADMIN']).optional().default('USER'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long').optional(),
  bio: z.string().max(500, 'Bio too long').optional().nullable(),
  location: z.string().max(200, 'Location too long').optional().nullable(),
  phone: z.string().max(20, 'Phone number too long').optional().nullable(),
  avatar: z.string().url('Invalid avatar URL').optional().nullable(),
});

export const getUserParamsSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUserParams = z.infer<typeof getUserParamsSchema>;

