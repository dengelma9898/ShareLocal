// Shared Types and Utilities for ShareLocal
// Diese Types sollten mit dem Prisma Schema synchronisiert bleiben

export type UserRole = 'USER' | 'ADMIN';

export type ListingCategory = 'TOOL' | 'PLANT' | 'SKILL' | 'PRODUCT' | 'TIME' | 'OTHER';

export type ListingType = 'OFFER' | 'REQUEST';

// User Types
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatar?: string | null;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// Listing Types
export interface Listing {
  id: string;
  title: string;
  description: string;
  category: ListingCategory;
  type: ListingType;
  userId: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pricePerDay?: number | null;
  currency?: string | null;
  available: boolean;
  images: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// Conversation Types
export interface Conversation {
  id: string;
  listingId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Constants
export const SHARELOCAL_VERSION = '0.1.0';
