// E2E Test Helpers: Authentication
// Helper-Funktionen für Login/Logout in Tests

import { Page } from '@playwright/test';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001';

/**
 * Logs in a user for E2E tests
 * Uses API to login user, then sets auth token in localStorage
 */
export async function loginUser(page: Page, email: string, password: string) {
  // Use API directly to login and get token
  const response = await page.request.post(`${API_URL}/api/auth/login`, {
    data: { email, password },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
  }

  const data = await response.json();
  const token = data.data?.token;
  const user = data.data?.user;

  if (!token) {
    throw new Error('No token received from login');
  }

  // Set token and user in localStorage (matching authApi.setAuth implementation)
  await page.goto('/');
  await page.evaluate(
    ({ token, user }) => {
      // Matching authApi.setAuth implementation
      localStorage.setItem('auth_token', token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      // Trigger storage event to update AuthContext
      window.dispatchEvent(new Event('storage'));
    },
    { token, user }
  );

  // Reload page to apply auth
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // Wait for auth to be applied (check for logout button or user menu)
  await page.waitForTimeout(500);
}

/**
 * Creates a test user via API and returns credentials
 */
export async function createTestUser(page: Page) {
  const email = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  const password = 'test123456';
  const name = 'Test User';

  const response = await page.request.post(`${API_URL}/api/auth/register`, {
    data: { email, name, password },
  });

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to create test user: ${response.status()} ${errorText}`);
  }

  const data = await response.json();
  return {
    email,
    password,
    name,
    token: data.data?.token,
    userId: data.data?.user?.id,
  };
}

/**
 * Clears authentication state
 */
export async function logoutUser(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    sessionStorage.clear();
  });
  await page.context().clearCookies();
  await page.reload();
  await page.waitForLoadState('networkidle');
}

