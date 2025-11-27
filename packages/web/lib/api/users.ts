// API Client für User-Operationen
// Funktionen zum Abrufen und Aktualisieren von User-Daten

import apiClient from './client';
import { User } from '@sharelocal/shared';

export interface UpdateUserData {
  name?: string;
  bio?: string;
  location?: string;
  phone?: string;
  avatar?: string;
}

/**
 * Holt den eigenen User (erfordert Authentication)
 * Verwendet /me Endpoint, der automatisch die ID aus dem Token verwendet
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<{ data: User }>(`/users/me`);
  return response.data.data;
}

/**
 * Holt einen User nach ID
 */
export async function getUser(id: string): Promise<User> {
  const response = await apiClient.get<{ data: User }>(`/users/${id}`);
  return response.data.data;
}

/**
 * Aktualisiert den eigenen User (erfordert Authentication)
 * Verwendet /me Endpoint, der automatisch die ID aus dem Token verwendet
 */
export async function updateUser(_id: string, data: UpdateUserData): Promise<User> {
  // Use /me endpoint instead of /users/:id to avoid ID mismatch issues
  const response = await apiClient.put<{ data: User }>(`/users/me`, data);
  return response.data.data;
}

