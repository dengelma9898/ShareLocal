// Test App Setup
// Erstellt eine Test-Instanz der Express App mit Test-Dependencies

import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp, AppDependencies } from '../../adapters/http/app.js';
import { PrismaUserRepository } from '../../adapters/database/PrismaUserRepository.js';
import { PrismaListingRepository } from '../../adapters/database/PrismaListingRepository.js';
import { PrismaConversationRepository } from '../../adapters/database/PrismaConversationRepository.js';
import { PrismaMessageRepository } from '../../adapters/database/PrismaMessageRepository.js';
import { JwtAuthService } from '../../adapters/services/JwtAuthService.js';
import { CryptoEncryptionService } from '../../adapters/services/CryptoEncryptionService.js';
import { getTestPrismaClient } from './test-db.js';

let testApp: Express | null = null;

/**
 * Erstellt eine Test-Instanz der Express App
 * Verwendet Test-Database und Test-Services
 */
export function getTestApp(): Express {
  if (!testApp) {
    const prisma = getTestPrismaClient();
    const encryptionService = new CryptoEncryptionService();

    // Adapters mit Test-Database
    const userRepository = new PrismaUserRepository(prisma);
    const listingRepository = new PrismaListingRepository(prisma);
    const conversationRepository = new PrismaConversationRepository(prisma, encryptionService);
    const messageRepository = new PrismaMessageRepository(prisma, encryptionService);
    const authService = new JwtAuthService();

    // Dependency Injection
    const dependencies: AppDependencies = {
      userRepository,
      listingRepository,
      conversationRepository,
      messageRepository,
      authService,
      prisma,
      encryptionService,
    };

    testApp = createApp(dependencies);
  }

  return testApp;
}

/**
 * Resettet die Test-App (für Isolation zwischen Tests)
 */
export function resetTestApp(): void {
  testApp = null;
}

