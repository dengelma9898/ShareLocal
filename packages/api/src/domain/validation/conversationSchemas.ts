// Validation Schemas für Conversations
// Zod-basierte Validierung für Conversation-Operationen

import { z } from 'zod';

// Create Conversation Schema
// listingId is required - no direct chats allowed, only via listings
// participantIds kann 1 sein, da der aktuelle User automatisch hinzugefügt wird
export const createConversationSchema = z.object({
  listingId: z.string().uuid('Invalid listing ID'),
  participantIds: z
    .array(z.string().uuid('Invalid user ID'))
    .min(1, 'At least 1 participant required (current user will be added automatically)')
    .max(10, 'Maximum 10 participants allowed'),
});

// Create Message Schema
export const createMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message content cannot be empty')
    .max(5000, 'Message content too long'),
});

// Get Messages Query Schema
export const getMessagesQuerySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
});

// Get Conversations Query Schema
export const getConversationsQuerySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
});

export const getConversationParamsSchema = z.object({
  id: z.string().uuid('Invalid conversation ID'),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type GetConversationParams = z.infer<typeof getConversationParamsSchema>;
export type GetConversationsQuery = z.infer<typeof getConversationsQuerySchema>;
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;

