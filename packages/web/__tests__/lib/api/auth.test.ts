// Unit Tests: Auth API Functions
// Testet die Auth API Helper-Funktionen

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as authApi from '../../../lib/api/auth';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Auth API', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('getToken', () => {
    it('should return null when no token is stored', () => {
      expect(authApi.getToken()).toBeNull();
    });

    it('should return stored token', () => {
      localStorageMock.setItem('auth_token', 'test-token-123');
      expect(authApi.getToken()).toBe('test-token-123');
    });
  });

  describe('getUser', () => {
    it('should return null when no user is stored', () => {
      expect(authApi.getUser()).toBeNull();
    });

    it('should return parsed user object', () => {
      const user = { id: '123', email: 'test@example.com', name: 'Test User' };
      localStorageMock.setItem('user', JSON.stringify(user));
      expect(authApi.getUser()).toEqual(user);
    });

    it('should return null for invalid JSON', () => {
      localStorageMock.setItem('user', 'invalid-json');
      expect(authApi.getUser()).toBeNull();
    });
  });

  describe('setAuth', () => {
    it('should store user and token', () => {
      const user = { id: '123', email: 'test@example.com', name: 'Test User' } as any;
      const token = 'test-token-123';

      authApi.setAuth(user, token);

      expect(localStorageMock.getItem('auth_token')).toBe(token);
      expect(localStorageMock.getItem('user')).toBe(JSON.stringify(user));
    });
  });

  describe('logout', () => {
    it('should remove user and token from localStorage', () => {
      localStorageMock.setItem('auth_token', 'test-token');
      localStorageMock.setItem('user', JSON.stringify({ id: '123' }));

      authApi.logout();

      expect(localStorageMock.getItem('auth_token')).toBeNull();
      expect(localStorageMock.getItem('user')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token or user', () => {
      expect(authApi.isAuthenticated()).toBe(false);
    });

    it('should return true when both token and user exist', () => {
      localStorageMock.setItem('auth_token', 'test-token');
      localStorageMock.setItem('user', JSON.stringify({ id: '123' }));
      expect(authApi.isAuthenticated()).toBe(true);
    });

    it('should return false when only token exists', () => {
      localStorageMock.setItem('auth_token', 'test-token');
      expect(authApi.isAuthenticated()).toBe(false);
    });

    it('should return false when only user exists', () => {
      localStorageMock.setItem('user', JSON.stringify({ id: '123' }));
      expect(authApi.isAuthenticated()).toBe(false);
    });
  });
});

