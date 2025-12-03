// Use Case: Create Conversation
// Application Layer - Orchestriert Domain Logic und Ports

import { ConversationRepository } from '../../ports/repositories/ConversationRepository.js';
import { Conversation } from '../../domain/entities/Conversation.js';
import { AppError } from '../../adapters/http/middleware/errorHandler.js';
import { UserRepository } from '../../ports/repositories/UserRepository.js';
import { ListingRepository } from '../../ports/repositories/ListingRepository.js';

export interface CreateConversationData {
  listingId: string; // Required - no direct chats allowed
  participantIds: string[];
}

export class CreateConversationUseCase {
  constructor(
    private conversationRepository: ConversationRepository,
    private userRepository: UserRepository,
    private listingRepository: ListingRepository
  ) {}

  async execute(data: CreateConversationData, currentUserId: string): Promise<Conversation> {
    // Validate participants
    if (data.participantIds.length < 2) {
      throw new AppError(400, 'At least 2 participants required');
    }

    // Ensure current user is in participants
    if (!data.participantIds.includes(currentUserId)) {
      throw new AppError(403, 'You must be a participant in the conversation');
    }

    // Validate all participants exist
    for (const userId of data.participantIds) {
      const user = await this.userRepository.findById(userId);
      if (!user || user.isDeleted()) {
        throw new AppError(404, `User ${userId} not found`);
      }
    }

    // Validate listing exists (required)
    const listing = await this.listingRepository.findById(data.listingId);
    if (!listing || listing.isDeleted()) {
      throw new AppError(404, 'Listing not found');
    }

    // Check if listing owner is in participants
    if (!data.participantIds.includes(listing.userId)) {
      throw new AppError(400, 'Listing owner must be a participant');
    }

    // Check if conversation already exists between these users (for same listing)
    const existingConversation = await this.conversationRepository.findBetweenUsers(
      data.participantIds[0],
      data.participantIds[1],
      data.listingId
    );

    if (existingConversation) {
      // Return existing conversation instead of creating duplicate
      return existingConversation;
    }

    // Create conversation
    const conversation = await this.conversationRepository.create({
      listingId: data.listingId,
      participantIds: data.participantIds,
    });

    return conversation;
  }
}

