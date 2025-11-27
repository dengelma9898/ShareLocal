// HTTP Adapter: Conversation Routes
// Express-spezifische Implementierung

import { Router } from 'express';
import { CreateConversationUseCase } from '../../../application/use-cases/CreateConversationUseCase.js';
import { GetConversationsUseCase } from '../../../application/use-cases/GetConversationsUseCase.js';
import { SendMessageUseCase } from '../../../application/use-cases/SendMessageUseCase.js';
import { GetMessagesUseCase } from '../../../application/use-cases/GetMessagesUseCase.js';
import { ConversationRepository } from '../../../ports/repositories/ConversationRepository.js';
import {
  validateBody,
  validateParams,
  validateQuery,
  ValidatedRequest,
} from '../middleware/validation.js';
import {
  createConversationSchema,
  createMessageSchema,
  getConversationsQuerySchema,
  getMessagesQuerySchema,
  getConversationParamsSchema,
  CreateConversationInput,
  CreateMessageInput,
  GetConversationParams,
  GetConversationsQuery,
} from '../../../domain/validation/conversationSchemas.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { AuthService } from '../../../ports/services/AuthService.js';
import { UserRepository } from '../../../ports/repositories/UserRepository.js';
import { AppError } from '../middleware/errorHandler.js';

export function createConversationRoutes(
  createConversationUseCase: CreateConversationUseCase,
  getConversationsUseCase: GetConversationsUseCase,
  sendMessageUseCase: SendMessageUseCase,
  getMessagesUseCase: GetMessagesUseCase,
  conversationRepository: ConversationRepository,
  authService: AuthService,
  userRepository: UserRepository
): Router {
  const router = Router();

  // GET /api/conversations - Get all conversations for current user (Protected)
  router.get(
    '/',
    authenticate(authService, userRepository),
    validateQuery(getConversationsQuerySchema),
    async (req: AuthenticatedRequest & ValidatedRequest<GetConversationsQuery>, res, next) => {
      try {
        const limit = req.validated?.limit ? parseInt(req.validated.limit, 10) : 50;
        const offset = req.validated?.offset ? parseInt(req.validated.offset, 10) : 0;

        const conversations = await getConversationsUseCase.execute(req.user!.userId, limit, offset);

        return res.json({
          data: conversations.map((conv) => ({
            id: conv.conversation.id,
            listingId: conv.conversation.listingId,
            participants: conv.participants.map((p) => p.toJSON()),
            listing: conv.listing ? conv.listing.toJSON() : null,
            lastMessage: conv.lastMessage,
            unreadCount: conv.unreadCount || 0,
            updatedAt: conv.conversation.updatedAt,
            createdAt: conv.conversation.createdAt,
          })),
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  // POST /api/conversations - Create new conversation (Protected)
  router.post(
    '/',
    authenticate(authService, userRepository),
    validateBody(createConversationSchema),
    async (req: AuthenticatedRequest & ValidatedRequest<CreateConversationInput>, res, next) => {
      try {
        // Ensure current user is in participants
        const validatedData = req.validated!;
        const participantIds = validatedData.participantIds || [];
        if (!participantIds.includes(req.user!.userId)) {
          participantIds.push(req.user!.userId);
        }

        const conversation = await createConversationUseCase.execute(
          {
            listingId: validatedData.listingId,
            participantIds,
          },
          req.user!.userId
        );

        return res.status(201).json({ data: conversation.toJSON() });
      } catch (error) {
        return next(error);
      }
    }
  );

  // GET /api/conversations/:id/messages - Get messages for a conversation (Protected)
  router.get(
    '/:id/messages',
    authenticate(authService, userRepository),
    validateParams(getConversationParamsSchema),
    validateQuery(getMessagesQuerySchema),
    async (req: AuthenticatedRequest & ValidatedRequest<GetConversationParams & GetMessagesQuery>, res, next) => {
      try {
        const { id } = req.validated!;
        const limit = req.validated?.limit ? parseInt(req.validated.limit, 10) : 50;
        const offset = req.validated?.offset ? parseInt(req.validated.offset, 10) : 0;

        // Verify user is participant
        const conversation = await conversationRepository.findById(id);
        if (!conversation) {
          throw new AppError(404, 'Conversation not found');
        }

        // Check if user is participant (simplified - in production, check participants table)
        const conversations = await conversationRepository.findByUserId(req.user!.userId, 1000, 0);
        const isParticipant = conversations.some((c) => c.conversation.id === id);
        if (!isParticipant) {
          throw new AppError(403, 'You are not a participant in this conversation');
        }

        const messages = await getMessagesUseCase.execute(id, req.user!.userId, limit, offset);

        return res.json({
          data: messages.map((m) => ({
            id: m.message.id,
            conversationId: m.message.conversationId,
            sender: m.sender.toJSON(),
            content: m.message.content,
            read: m.message.read,
            createdAt: m.message.createdAt,
          })),
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  // POST /api/conversations/:id/messages - Send a message (Protected)
  router.post(
    '/:id/messages',
    authenticate(authService, userRepository),
    validateParams(getConversationParamsSchema),
    validateBody(createMessageSchema),
    async (req: AuthenticatedRequest & ValidatedRequest<GetConversationParams & CreateMessageInput>, res, next) => {
      try {
        const { id } = req.validated!;

        // Verify user is participant
        const conversation = await conversationRepository.findById(id);
        if (!conversation) {
          throw new AppError(404, 'Conversation not found');
        }

        // Check if user is participant
        const conversations = await conversationRepository.findByUserId(req.user!.userId, 1000, 0);
        const isParticipant = conversations.some((c) => c.conversation.id === id);
        if (!isParticipant) {
          throw new AppError(403, 'You are not a participant in this conversation');
        }

        const message = await sendMessageUseCase.execute(
          {
            conversationId: id,
            content: req.body.content,
          },
          req.user!.userId
        );

        // Fetch sender for response
        const sender = await userRepository.findById(message.senderId);

        return res.status(201).json({
          data: {
            id: message.id,
            conversationId: message.conversationId,
            sender: sender?.toJSON(),
            content: message.content,
            read: message.read,
            createdAt: message.createdAt,
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}

