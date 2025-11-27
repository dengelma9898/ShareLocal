// Adapter: Prisma Message Repository Implementation
// Konkrete Implementierung des MessageRepository Ports

import { PrismaClient } from '@prisma/client';
import { MessageRepository, MessageWithSender, CreateMessageData } from '../../ports/repositories/MessageRepository.js';
import { Message } from '../../domain/entities/Message.js';
import { User } from '../../domain/entities/User.js';
import { EncryptionService } from '../../ports/services/EncryptionService.js';
import { logger } from '../../utils/logger.js';

export class PrismaMessageRepository implements MessageRepository {
  constructor(
    private prisma: PrismaClient,
    private encryptionService: EncryptionService
  ) {}

  async create(data: CreateMessageData): Promise<Message> {
    // Encrypt message content before storing
    const encryptedContent = this.encryptionService.encrypt(data.content);

    const messageData = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: encryptedContent, // Store encrypted content
        read: false,
      },
    });

    // Update conversation updatedAt timestamp
    await this.prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    // Return message with decrypted content for domain entity
    return new Message({
      ...messageData,
      content: data.content, // Use original plaintext for domain entity
    });
  }

  async findById(id: string): Promise<Message | null> {
    const messageData = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!messageData) return null;

    // Decrypt message content
    let decryptedContent: string;
    try {
      decryptedContent = this.encryptionService.decrypt(messageData.content);
    } catch (error) {
      // If decryption fails (e.g., old unencrypted messages), use original content
      logger.error(`Failed to decrypt message ${messageData.id} in findById`, { error, messageId: messageData.id });
      decryptedContent = messageData.content;
    }

    return new Message({
      ...messageData,
      content: decryptedContent,
    });
  }

  async findByConversationId(
    conversationId: string,
    limit = 50,
    offset = 0
  ): Promise<MessageWithSender[]> {
    const messagesData = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: true,
      },
      orderBy: { createdAt: 'asc' }, // Oldest first for chat display
      take: limit,
      skip: offset,
    });

    return messagesData.map((data) => {
      // Decrypt message content
      let decryptedContent: string;
      try {
        decryptedContent = this.encryptionService.decrypt(data.content);
      } catch (error) {
        // If decryption fails (e.g., old unencrypted messages), use original content
        logger.error(`Failed to decrypt message ${data.id} in findByConversationId`, { error, messageId: data.id });
        decryptedContent = data.content;
      }

      return {
        message: new Message({
          id: data.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: decryptedContent, // Use decrypted content
          read: data.read,
          createdAt: data.createdAt,
        }),
        sender: new User(data.sender),
      };
    });
  }

  async countUnread(conversationId: string, userId: string): Promise<number> {
    // Count messages in conversation that are not from the current user and not read
    const count = await this.prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
    });

    return count;
  }

  async markAsRead(id: string): Promise<Message> {
    const messageData = await this.prisma.message.update({
      where: { id },
      data: { read: true },
    });

    // Decrypt message content
    let decryptedContent: string;
    try {
      decryptedContent = this.encryptionService.decrypt(messageData.content);
    } catch (error) {
      // If decryption fails (e.g., old unencrypted messages), use original content
      logger.error(`Failed to decrypt message ${messageData.id} in findById`, { error, messageId: messageData.id });
      decryptedContent = messageData.content;
    }

    return new Message({
      ...messageData,
      content: decryptedContent,
    });
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    // Mark all messages in conversation as read (except own messages)
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
      data: { read: true },
    });

    // Update participant's lastReadAt
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.message.delete({
      where: { id },
    });
  }
}

