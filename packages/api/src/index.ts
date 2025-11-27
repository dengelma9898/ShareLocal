// Entry Point: Dependency Injection & App Startup
// Hier werden alle Adapters zusammengeführt

import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PrismaClient } from '@prisma/client';
import { createApp, AppDependencies } from './adapters/http/app.js';
import { PrismaUserRepository } from './adapters/database/PrismaUserRepository.js';
import { PrismaListingRepository } from './adapters/database/PrismaListingRepository.js';
import { PrismaConversationRepository } from './adapters/database/PrismaConversationRepository.js';
import { PrismaMessageRepository } from './adapters/database/PrismaMessageRepository.js';
import { JwtAuthService } from './adapters/services/JwtAuthService.js';
import { CryptoEncryptionService } from './adapters/services/CryptoEncryptionService.js';
import { validateEnvironmentOrThrow } from './utils/envValidation.js';
import { logger } from './utils/logger.js';

// Load .env from root directory (monorepo structure)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../../..');
dotenv.config({ path: resolve(rootDir, '.env') });
// Also try .env in api package directory as fallback
dotenv.config({ path: resolve(__dirname, '../.env') });

// Validate Environment Variables before starting the server
// This will exit the process if required variables are missing or invalid
validateEnvironmentOrThrow();

const PORT = process.env.PORT || 3001;

// Infrastructure Setup
const prisma = new PrismaClient();

// Adapters
const userRepository = new PrismaUserRepository(prisma);
const listingRepository = new PrismaListingRepository(prisma);
const encryptionService = new CryptoEncryptionService();
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

// Create Express App
const app = createApp(dependencies);

// Start Server
app.listen(PORT, () => {
  logger.info(`ShareLocal API server running on http://localhost:${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
  logger.info(`API Documentation: http://localhost:${PORT}/api`);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  logger.info('Database connection closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  logger.info('Database connection closed');
  process.exit(0);
});
