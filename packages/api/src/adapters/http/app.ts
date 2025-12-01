// HTTP Adapter: Express App Setup
// Konfiguriert Express mit allen Routes

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createUserRoutes } from './routes/userRoutes.js';
import { createListingRoutes } from './routes/listingRoutes.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { createConversationRoutes } from './routes/conversationRoutes.js';
import { GetUserUseCase } from '../../application/use-cases/GetUserUseCase.js';
import { GetAllUsersUseCase } from '../../application/use-cases/GetAllUsersUseCase.js';
import { UpdateUserUseCase } from '../../application/use-cases/UpdateUserUseCase.js';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase.js';
import { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase.js';
import { CreateListingUseCase } from '../../application/use-cases/CreateListingUseCase.js';
import { UpdateListingUseCase } from '../../application/use-cases/UpdateListingUseCase.js';
import { DeleteListingUseCase } from '../../application/use-cases/DeleteListingUseCase.js';
import { UserRepository } from '../../ports/repositories/UserRepository.js';
import { ListingRepository } from '../../ports/repositories/ListingRepository.js';
import { ConversationRepository } from '../../ports/repositories/ConversationRepository.js';
import { MessageRepository } from '../../ports/repositories/MessageRepository.js';
import { AuthService } from '../../ports/services/AuthService.js';
import { CreateConversationUseCase } from '../../application/use-cases/CreateConversationUseCase.js';
import { GetConversationsUseCase } from '../../application/use-cases/GetConversationsUseCase.js';
import { SendMessageUseCase } from '../../application/use-cases/SendMessageUseCase.js';
import { GetMessagesUseCase } from '../../application/use-cases/GetMessagesUseCase.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { createHealthCheckHandler, createLivenessHandler, createReadinessHandler, HealthCheckDependencies } from './middleware/healthCheck.js';
import { EncryptionService } from '../../ports/services/EncryptionService.js';
import { PrismaClient } from '@prisma/client';

export interface AppDependencies {
  userRepository: UserRepository;
  listingRepository: ListingRepository;
  conversationRepository: ConversationRepository;
  messageRepository: MessageRepository;
  authService: AuthService;
  prisma: PrismaClient;
  encryptionService: EncryptionService;
}

export function createApp(dependencies: AppDependencies): Express {
  const app = express();

  // Trust Proxy: Wichtig für Rate Limiting hinter NGINX/Reverse Proxy
  // Erlaubt Express, X-Forwarded-For Header zu vertrauen (von NGINX gesetzt)
  // Nur dem ersten Proxy vertrauen (1) - sicherer als 'true'
  // Siehe: https://expressjs.com/en/guide/behind-proxies.html
  // Siehe: https://express-rate-limit.github.io/ERR_ERL_PERMISSIVE_TRUST_PROXY/
  app.set('trust proxy', 1); // Nur dem ersten Proxy vertrauen (NGINX)

  // Security Middleware
  // Helmet.js setzt verschiedene Security Headers zum Schutz gegen XSS, Clickjacking, etc.
  // Siehe README für Details, warum wir Helmet.js verwenden
  app.use(helmet());
  
  // CORS: Erlaubt Cross-Origin Requests (konfiguriert für Frontend)
  app.use(cors());
  
  // Body Parser: Parst JSON Request Bodies
  app.use(express.json());
  
  // Rate Limiting: Allgemeine API-Limits (gilt für alle /api/* Routes)
  // Health Check und Root-Endpoint sind ausgenommen
  app.use('/api', apiLimiter);

  // Use Cases
  const getUserUseCase = new GetUserUseCase(dependencies.userRepository);
  const getAllUsersUseCase = new GetAllUsersUseCase(dependencies.userRepository);
  const updateUserUseCase = new UpdateUserUseCase(dependencies.userRepository);
  const registerUserUseCase = new RegisterUserUseCase(
    dependencies.userRepository,
    dependencies.authService
  );
  const loginUserUseCase = new LoginUserUseCase(
    dependencies.userRepository,
    dependencies.authService
  );
  const createListingUseCase = new CreateListingUseCase(
    dependencies.listingRepository,
    dependencies.userRepository
  );
  const updateListingUseCase = new UpdateListingUseCase(dependencies.listingRepository);
  const deleteListingUseCase = new DeleteListingUseCase(dependencies.listingRepository);
  const createConversationUseCase = new CreateConversationUseCase(
    dependencies.conversationRepository,
    dependencies.userRepository,
    dependencies.listingRepository
  );
  const getConversationsUseCase = new GetConversationsUseCase(dependencies.conversationRepository);
  const sendMessageUseCase = new SendMessageUseCase(
    dependencies.messageRepository,
    dependencies.conversationRepository
  );
  const getMessagesUseCase = new GetMessagesUseCase(
    dependencies.messageRepository,
    dependencies.conversationRepository
  );

  // Health Check Routes
  // Health Check: Vollständiger Status-Check aller Services
  const healthCheckDependencies: HealthCheckDependencies = {
    prisma: dependencies.prisma,
    encryptionService: dependencies.encryptionService,
  };
  
  app.get('/health', createHealthCheckHandler(healthCheckDependencies));
  
  // Liveness Check: Einfacher Check, ob API läuft (für Kubernetes/Docker)
  app.get('/health/live', createLivenessHandler());
  
  // Readiness Check: Prüft, ob API bereit ist, Requests zu verarbeiten
  app.get('/health/ready', createReadinessHandler(healthCheckDependencies));

  // Root Endpoint
  app.get('/', (_req, res) => {
    res.json({
      message: 'ShareLocal API',
      version: '0.1.0',
    });
  });

  app.use(
    '/api/auth',
    createAuthRoutes(registerUserUseCase, loginUserUseCase)
  );
  app.use(
    '/api/users',
    createUserRoutes(
      getUserUseCase,
      getAllUsersUseCase,
      updateUserUseCase,
      dependencies.authService,
      dependencies.userRepository
    )
  );
  app.use(
    '/api/listings',
    createListingRoutes(
      createListingUseCase,
      updateListingUseCase,
      deleteListingUseCase,
      dependencies.listingRepository,
      dependencies.authService,
      dependencies.userRepository
    )
  );
  app.use(
    '/api/conversations',
    createConversationRoutes(
      createConversationUseCase,
      getConversationsUseCase,
      sendMessageUseCase,
      getMessagesUseCase,
      dependencies.conversationRepository,
      dependencies.authService,
      dependencies.userRepository
    )
  );

  // Error Handling (muss nach allen Routes kommen)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
