// API Client für Conversations und Messages
// Frontend-spezifische API-Calls für Chat-Funktionalität

import apiClient from './client';
import { User } from '@sharelocal/shared';

// Types
export interface Conversation {
  id: string;
  listingId: string | null;
  participants: User[];
  listing?: {
    id: string;
    title: string;
    category: string;
    type: 'OFFER' | 'REQUEST';
  } | null;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
    read: boolean;
  };
  unreadCount: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: User;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface CreateConversationData {
  listingId: string; // Required - no direct chats allowed, only via listings
  participantIds: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Holt alle Conversations des aktuellen Users
 */
export async function getConversations(limit = 50, offset = 0): Promise<PaginatedResponse<Conversation>> {
  const response = await apiClient.get<{ data: Conversation[] }>(
    `/conversations?limit=${limit}&offset=${offset}`
  );
  return {
    data: response.data.data,
  };
}

/**
 * Erstellt eine neue Conversation
 */
export async function createConversation(data: CreateConversationData): Promise<Conversation> {
  const response = await apiClient.post<{ data: Conversation }>('/conversations', data);
  return response.data.data;
}

/**
 * Holt alle Messages einer Conversation
 */
export async function getMessages(
  conversationId: string,
  limit = 50,
  offset = 0
): Promise<PaginatedResponse<Message>> {
  const response = await apiClient.get<{ data: Message[] }>(
    `/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`
  );
  return {
    data: response.data.data,
  };
}

/**
 * Sendet eine Nachricht
 */
export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const response = await apiClient.post<{ data: Message }>(`/conversations/${conversationId}/messages`, {
    content,
  });
  return response.data.data;
}

