// Use Case: Get Conversation Messages
// Application Layer - Orchestriert Domain Logic und Ports

import { MessageRepository, MessageWithSender } from '../../ports/repositories/MessageRepository.js';
import { ConversationRepository } from '../../ports/repositories/ConversationRepository.js';
import { AppError } from '../../adapters/http/middleware/errorHandler.js';

export class GetMessagesUseCase {
  constructor(
    private messageRepository: MessageRepository,
    private conversationRepository: ConversationRepository
  ) {}

  async execute(
    conversationId: string,
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<MessageWithSender[]> {
    // Validate conversation exists
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new AppError(404, 'Conversation not found');
    }

    // Note: Participant check should be done in HTTP layer
    // We assume the user is validated before calling this use case

    // Get messages
    const messages = await this.messageRepository.findByConversationId(conversationId, limit, offset);

    // Mark messages as read for this user
    await this.messageRepository.markConversationAsRead(conversationId, userId);

    return messages;
  }
}

