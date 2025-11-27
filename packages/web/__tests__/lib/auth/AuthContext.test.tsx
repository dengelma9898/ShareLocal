// Unit Tests: AuthContext
// Testet Auth Context Provider und Hook

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../../../lib/auth/AuthContext';
import * as authApi from '../../../lib/api/auth';

// Mock auth API
vi.mock('../../../lib/api/auth', () => ({
  getToken: vi.fn(),
  getUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  setAuth: vi.fn(),
  logout: vi.fn(),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should provide auth context when used inside provider', async () => {
      vi.mocked(authApi.getToken).mockReturnValue(null);
      vi.mocked(authApi.getUser).mockReturnValue(null);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should load user from localStorage on mount', async () => {
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test User' } as any;
      const mockToken = 'test-token-123';

      vi.mocked(authApi.getToken).mockReturnValue(mockToken);
      vi.mocked(authApi.getUser).mockReturnValue(mockUser);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});

