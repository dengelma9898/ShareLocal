// Test Database Setup
// Verwaltet Test-Database Connection und Cleanup

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

/**
 * Erstellt eine neue Prisma Client Instanz für Tests
 * Verwendet DATABASE_URL aus Environment oder Test-Database
 */
export function getTestPrismaClient(): PrismaClient {
  if (!prisma) {
    const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error(
        'TEST_DATABASE_URL or DATABASE_URL must be set for tests. ' +
        'Please set TEST_DATABASE_URL to a separate test database.'
      );
    }

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

  return prisma;
}

/**
 * Bereinigt die Test-Database
 * Löscht alle Daten in der richtigen Reihenfolge (wegen Foreign Keys)
 */
export async function cleanupTestDatabase(): Promise<void> {
  const testPrisma = getTestPrismaClient();

  // Löschen in der richtigen Reihenfolge (wegen Foreign Keys)
  await testPrisma.message.deleteMany();
  await testPrisma.conversationParticipant.deleteMany();
  await testPrisma.conversation.deleteMany();
  await testPrisma.listing.deleteMany();
  await testPrisma.user.deleteMany();
}

/**
 * Schließt die Database Connection
 */
export async function closeTestDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

/**
 * Führt eine Migration auf der Test-Database aus
 * Sollte vor allen Tests einmal aufgerufen werden
 */
export async function migrateTestDatabase(): Promise<void> {
  const { execSync } = await import('child_process');
  
  const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set');
  }

  // Prisma Migrate für Test-Database
  execSync('pnpm --filter @sharelocal/database db:push', {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: 'inherit',
  });
}

