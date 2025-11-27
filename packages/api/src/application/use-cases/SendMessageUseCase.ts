// Use Case: Send Message
// Application Layer - Orchestriert Domain Logic und Ports

import { MessageRepository } from '../../ports/repositories/MessageRepository.js';
import { ConversationRepository } from '../../ports/repositories/ConversationRepository.js';
import { Message } from '../../domain/entities/Message.js';
import { AppError } from '../../adapters/http/middleware/errorHandler.js';

export interface SendMessageData {
  conversationId: string;
  content: string;
}

export class SendMessageUseCase {
  constructor(
    private messageRepository: MessageRepository,
    private conversationRepository: ConversationRepository
  ) {}

  async execute(data: SendMessageData, senderId: string): Promise<Message> {
    // Validate conversation exists
    const conversation = await this.conversationRepository.findById(data.conversationId);
    if (!conversation) {
      throw new AppError(404, 'Conversation not found');
    }

    // Note: Participant check should be done in the HTTP layer
    // We assume the sender is validated before calling this use case

    // Create message
    const message = await this.messageRepository.create({
      conversationId: data.conversationId,
      senderId,
      content: data.content.trim(),
    });

    return message;
  }
}

