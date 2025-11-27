// Use Case: Get User Conversations
// Application Layer - Orchestriert Domain Logic und Ports

import { ConversationRepository, ConversationWithParticipants } from '../../ports/repositories/ConversationRepository.js';

export class GetConversationsUseCase {
  constructor(private conversationRepository: ConversationRepository) {}

  async execute(userId: string, limit = 50, offset = 0): Promise<ConversationWithParticipants[]> {
    const conversations = await this.conversationRepository.findByUserId(userId, limit, offset);
    return conversations;
  }
}

