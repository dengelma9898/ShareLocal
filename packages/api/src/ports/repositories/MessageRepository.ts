// Port: Message Repository Interface
// Definiert die Schnittstelle für Message-Operationen

import { Message } from '../../domain/entities/Message.js';
import { User } from '../../domain/entities/User.js';

export interface CreateMessageData {
  conversationId: string;
  senderId: string;
  content: string;
}

export interface MessageWithSender {
  message: Message;
  sender: User;
}

export interface MessageRepository {
  // Create
  create(data: CreateMessageData): Promise<Message>;

  // Read
  findById(id: string): Promise<Message | null>;
  findByConversationId(
    conversationId: string,
    limit?: number,
    offset?: number
  ): Promise<MessageWithSender[]>;
  countUnread(conversationId: string, userId: string): Promise<number>;

  // Update
  markAsRead(id: string): Promise<Message>;
  markConversationAsRead(conversationId: string, userId: string): Promise<void>;

  // Delete (optional, für später)
  delete(id: string): Promise<void>;
}

