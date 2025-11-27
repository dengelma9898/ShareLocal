// Test Helpers
// Utility-Funktionen für Tests

import { getTestPrismaClient } from './test-db.js';
import { JwtAuthService } from '../../adapters/services/JwtAuthService.js';

// Verwende Singleton-Pattern für AuthService, um sicherzustellen,
// dass derselbe JWT_SECRET verwendet wird wie in der Test-App
let authServiceInstance: JwtAuthService | null = null;

function getAuthService(): JwtAuthService {
  if (!authServiceInstance) {
    authServiceInstance = new JwtAuthService();
  }
  return authServiceInstance;
}

/**
 * Erstellt einen Test-User in der Database
 */
export async function createTestUser(data: {
  email: string;
  name: string;
  password?: string;
  emailVerified?: boolean;
}) {
  const prisma = getTestPrismaClient();
  const authService = getAuthService();
  const passwordHash = data.password
    ? await authService.hashPassword(data.password)
    : await authService.hashPassword('test123');

  return await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      emailVerified: data.emailVerified ?? false,
      role: 'USER',
    },
  });
}

/**
 * Erstellt ein Test-Listing in der Database
 */
export async function createTestListing(data: {
  ownerId: string;
  title: string;
  description: string;
  category: string;
  type: 'OFFER' | 'REQUEST';
  price?: number;
}) {
  const prisma = getTestPrismaClient();

  return await prisma.listing.create({
    data: {
      userId: data.ownerId, // Prisma Schema verwendet userId, nicht ownerId
      title: data.title,
      description: data.description,
      category: data.category,
      type: data.type,
      pricePerDay: data.price ?? null,
    },
  });
}

/**
 * Erstellt eine Test-Conversation
 */
export async function createTestConversation(data: {
  participantIds: string[];
  listingId?: string;
}) {
  const prisma = getTestPrismaClient();

  const conversation = await prisma.conversation.create({
    data: {
      listingId: data.listingId ?? null,
      participants: {
        create: data.participantIds.map((userId) => ({
          userId,
        })),
      },
    },
    include: {
      participants: true,
    },
  });

  return conversation;
}

/**
 * Generiert einen JWT Token für einen User
 * Verwendet denselben AuthService wie die Test-App für Konsistenz
 */
export function generateTestToken(userId: string, email: string): string {
  const authService = getAuthService();
  return authService.generateToken({ userId, email });
}

/**
 * Wartet eine bestimmte Zeit (für async Tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

