// Playwright Test Fixtures
// Custom fixtures für E2E Tests

import { test as base } from '@playwright/test';
import { loginUser, createTestUser, logoutUser } from './helpers/auth';
import { setupApiMocks, removeApiMocks } from './mocks/api-mocks';

type TestFixtures = {
  authenticatedUser: {
    email: string;
    password: string;
    name: string;
    token: string;
    userId: string;
  };
  useMocks: boolean;
};

export const test = base.extend<TestFixtures>({
  // Fixture für authentifizierten User
  authenticatedUser: async ({ page, useMocks }, use) => {
    if (useMocks) {
      // Mit Mocks: User wird automatisch "eingeloggt" via Mock
      const user = {
        email: 'mock@example.com',
        password: 'mock123456',
        name: 'Mock User',
        token: 'mock-jwt-token',
        userId: 'mock-user-123',
      };
      
      // Setze Mock-Token direkt
      await page.goto('/');
      await page.evaluate((token) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify({ id: 'mock-user-123', email: 'mock@example.com', name: 'Mock User' }));
      }, user.token);
      
      await use(user);
      
      // Cleanup
      await logoutUser(page);
    } else {
      // Ohne Mocks: Erstelle echten User via API
      const user = await createTestUser(page);
      await loginUser(page, user.email, user.password);
      
      await use(user);
      
      // Cleanup: Logout after test
      await logoutUser(page);
    }
  },
  
  // Fixture für Mock-Mode
  useMocks: [false, { option: true }],
  
  // Setup Mocks wenn useMocks = true
  // WICHTIG: Mocks müssen VOR der ersten Navigation gesetzt werden
  page: async ({ page, useMocks }, use) => {
    if (useMocks) {
      // Setze Mocks BEVOR die Seite verwendet wird
      // Dies stellt sicher, dass alle Routes registriert sind, bevor Requests gemacht werden
      await setupApiMocks(page);
      
      // Warte kurz, um sicherzustellen, dass Routes vollständig registriert sind
      // Dies hilft bei Race Conditions in CI
      await page.waitForTimeout(100);
    }
    
    await use(page);
    
    if (useMocks) {
      await removeApiMocks(page);
    }
  },
});

export { expect } from '@playwright/test';
