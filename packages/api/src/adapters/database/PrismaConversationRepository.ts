// Adapter: Prisma Conversation Repository Implementation
// Konkrete Implementierung des ConversationRepository Ports

import { PrismaClient, Prisma } from '@prisma/client';
import { ConversationRepository, ConversationWithParticipants, CreateConversationData } from '../../ports/repositories/ConversationRepository.js';
import { Conversation } from '../../domain/entities/Conversation.js';
import { User } from '../../domain/entities/User.js';
import { Listing } from '../../domain/entities/Listing.js';
import { EncryptionService } from '../../ports/services/EncryptionService.js';
import { logger } from '../../utils/logger.js';

export class PrismaConversationRepository implements ConversationRepository {
  constructor(
    private prisma: PrismaClient,
    private encryptionService?: EncryptionService
  ) {}

  async create(data: CreateConversationData): Promise<Conversation> {
    const conversationData = await this.prisma.conversation.create({
      data: {
        listingId: data.listingId || null,
        participants: {
          create: data.participantIds.map((userId) => ({
            userId,
          })),
        },
      },
    });

    return new Conversation(conversationData);
  }

  async findById(id: string): Promise<Conversation | null> {
    const conversationData = await this.prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversationData) return null;

    return new Conversation(conversationData);
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<ConversationWithParticipants[]> {
    const conversationsData = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        listing: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    type ConversationWithIncludes = Prisma.ConversationGetPayload<{
      include: {
        participants: { include: { user: true } };
        listing: true;
        messages: { include: { sender: true } };
      };
    }>;

    return conversationsData.map((conv: ConversationWithIncludes) => {
      const conversation = new Conversation({
        id: conv.id,
        listingId: conv.listingId,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      });

      const participants = conv.participants.map((p: ConversationWithIncludes['participants'][0]) => new User(p.user));
      const listing = conv.listing ? new Listing(conv.listing) : undefined;

      // Decrypt lastMessage content if encryption service is available
      let lastMessageContent = conv.messages[0]?.content;
      if (conv.messages[0] && this.encryptionService) {
        try {
          lastMessageContent = this.encryptionService.decrypt(conv.messages[0].content);
        } catch (error) {
          // If decryption fails (e.g., old unencrypted messages), use original content
            logger.error(`Failed to decrypt lastMessage ${conv.messages[0].id}`, { error, messageId: conv.messages[0].id });
          lastMessageContent = conv.messages[0].content;
        }
      }

      const lastMessage = conv.messages[0]
        ? {
            id: conv.messages[0].id,
            content: lastMessageContent,
            senderId: conv.messages[0].senderId,
            createdAt: conv.messages[0].createdAt,
            read: conv.messages[0].read,
          }
        : undefined;

      // Count unread messages for this user
      // Note: This is a simplified version - in production, you'd want to count properly
      const unreadCount = lastMessage && !lastMessage.read && lastMessage.senderId !== userId ? 1 : 0;

      return {
        conversation,
        participants,
        listing,
        lastMessage,
        unreadCount,
      };
    });
  }

  async findByListingId(listingId: string): Promise<Conversation[]> {
    const conversationsData = await this.prisma.conversation.findMany({
      where: { listingId },
    });

    return conversationsData.map((data: Prisma.ConversationGetPayload<Record<string, never>>) => new Conversation(data));
  }

  async findBetweenUsers(userId1: string, userId2: string, listingId?: string): Promise<Conversation | null> {
    const conversationData = await this.prisma.conversation.findFirst({
      where: {
        listingId: listingId || null,
        participants: {
          every: {
            userId: {
              in: [userId1, userId2],
            },
          },
        },
        AND: [
          {
            participants: {
              some: { userId: userId1 },
            },
          },
          {
            participants: {
              some: { userId: userId2 },
            },
          },
        ],
      },
    });

    if (!conversationData) return null;

    return new Conversation(conversationData);
  }

  async update(id: string, data: Partial<{ listingId: string | null }>): Promise<Conversation> {
    const conversationData = await this.prisma.conversation.update({
      where: { id },
      data,
    });

    return new Conversation(conversationData);
  }

  async delete(id: string): Promise<void> {
    // Soft delete: Remove all participants (cascade will handle messages)
    await this.prisma.conversationParticipant.deleteMany({
      where: { conversationId: id },
    });
  }
}

