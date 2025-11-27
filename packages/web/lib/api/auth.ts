// Authentication API Calls
// Funktionen für Login, Register, Logout

import apiClient, { ApiResponse } from './client';
import { User } from '@sharelocal/shared';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Login
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
  return response.data.data;
}

// Register
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
  return response.data.data;
}

// Token aus localStorage holen
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

// User aus localStorage holen
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

// Token und User speichern
export function setAuth(user: User, token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

// Logout (Token und User entfernen)
export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

// Prüft ob User eingeloggt ist
export function isAuthenticated(): boolean {
  return getToken() !== null && getUser() !== null;
}

