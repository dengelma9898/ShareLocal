// Port: Conversation Repository Interface
// Definiert die Schnittstelle für Conversation-Operationen

import { Conversation } from '../../domain/entities/Conversation.js';
import { User } from '../../domain/entities/User.js';
import { Listing } from '../../domain/entities/Listing.js';

export interface CreateConversationData {
  listingId?: string;
  participantIds: string[]; // Mindestens 2 Teilnehmer
}

export interface ConversationWithParticipants {
  conversation: Conversation;
  participants: User[];
  listing?: Listing;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
    read: boolean;
  };
  unreadCount?: number;
}

export interface ConversationRepository {
  // Create
  create(data: CreateConversationData): Promise<Conversation>;

  // Read
  findById(id: string): Promise<Conversation | null>;
  findByUserId(userId: string, limit?: number, offset?: number): Promise<ConversationWithParticipants[]>;
  findByListingId(listingId: string): Promise<Conversation[]>;
  findBetweenUsers(userId1: string, userId2: string, listingId?: string): Promise<Conversation | null>;

  // Update
  update(id: string, data: Partial<{ listingId: string | null }>): Promise<Conversation>;

  // Delete (soft delete via participants)
  delete(id: string): Promise<void>;
}

