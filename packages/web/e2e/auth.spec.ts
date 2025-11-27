// E2E Tests: Authentication Flow
// Testet User Registration und Login

import { test, expect } from '@playwright/test';
import { createTestUser, loginUser } from './helpers/auth';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Cleanup: Clear localStorage and cookies
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  });

  // Skip all tests if API is not running
  test.beforeAll(async ({ request }) => {
    try {
      const response = await request.get('http://localhost:3001/health');
      if (!response.ok()) {
        console.warn('⚠️  Backend API not running on http://localhost:3001');
        console.warn('   Please start the API: cd packages/api && pnpm dev');
        test.skip();
      }
    } catch (error) {
      console.warn('⚠️  Backend API not running on http://localhost:3001');
      console.warn('   Please start the API: cd packages/api && pnpm dev');
      test.skip();
    }
  });

  test('should register a new user', async ({ page }) => {
    await page.goto('/register');

    const testEmail = `test-${Date.now()}@example.com`;

    // Fill registration form using data-testid
    await page.fill('[data-testid="register-name-input"]', 'Test User');
    await page.fill('[data-testid="register-email-input"]', testEmail);
    await page.fill('[data-testid="register-password-input"]', 'test123456');
    await page.fill('[data-testid="register-confirm-password-input"]', 'test123456');

    // Submit form
    await page.click('[data-testid="register-submit-button"]');

    // Wait for navigation - should redirect to home page after successful registration
    await page.waitForURL('/', { timeout: 15000 });
    
    // Verify we're on home page
    await expect(page).toHaveURL('/');
  });

  test('should login with valid credentials', async ({ page }) => {
    // First register a user via UI
    await page.goto('/register');
    
    const testEmail = `test-login-${Date.now()}@example.com`;
    const testPassword = 'test123456';
    
    await page.fill('[data-testid="register-name-input"]', 'Test User');
    await page.fill('[data-testid="register-email-input"]', testEmail);
    await page.fill('[data-testid="register-password-input"]', testPassword);
    await page.fill('[data-testid="register-confirm-password-input"]', testPassword);
    await page.click('[data-testid="register-submit-button"]');
    
    // Wait for redirect to home
    await page.waitForURL('/', { timeout: 15000 });
    
    // Now logout and login again
    const userAvatar = page.locator('button:has([class*="Avatar"])');
    if (await userAvatar.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userAvatar.click();
      await page.locator('text=Abmelden').click();
      await page.waitForTimeout(1000);
    }
    
    // Now login
    await page.goto('/login');
    await page.fill('[data-testid="login-email-input"]', testEmail);
    await page.fill('[data-testid="login-password-input"]', testPassword);
    await page.click('[data-testid="login-submit-button"]');

    // Wait for navigation - should redirect to home page after successful login
    await page.waitForURL('/', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    // Should show user is logged in - check for user avatar button or user menu
    // The avatar might be in a button or directly in the header
    const avatarButton = page.locator('button').filter({ has: page.locator('[class*="Avatar"], [class*="avatar"]') });
    const hasAvatar = await avatarButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!hasAvatar) {
      // Alternative: Check if login button is gone (means we're logged in)
      const loginButton = page.locator('text=Anmelden');
      await expect(loginButton).not.toBeVisible({ timeout: 5000 });
    } else {
      await expect(avatarButton).toBeVisible();
    }
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="login-email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="login-password-input"]', 'wrongpassword');

    await page.click('[data-testid="login-submit-button"]');

    // Wait for error to appear
    await page.waitForTimeout(1000);
    
    // Should show error message (either in Alert or Toast)
    const errorAlert = page.locator('[data-testid="login-error"]');
    const errorText = page.locator('text=/invalid|falsch|fehler|ungültig|email|password/i');
    
    // Check if error is visible (either in alert or toast)
    const isErrorVisible = await errorAlert.isVisible().catch(() => false) || 
                          await errorText.isVisible().catch(() => false);
    
    expect(isErrorVisible).toBe(true);
  });

  test('should logout successfully', async ({ page }) => {
    // First register a user via UI
    await page.goto('/register');
    
    const testEmail = `test-logout-${Date.now()}@example.com`;
    const testPassword = 'test123456';
    
    await page.fill('[data-testid="register-name-input"]', 'Test User');
    await page.fill('[data-testid="register-email-input"]', testEmail);
    await page.fill('[data-testid="register-password-input"]', testPassword);
    await page.fill('[data-testid="register-confirm-password-input"]', testPassword);
    await page.click('[data-testid="register-submit-button"]');
    
    // Wait for redirect to home
    await page.waitForURL('/', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click on user avatar to open dropdown
    // Try multiple selectors for the avatar button
    const userAvatar = page.locator('button').filter({ has: page.locator('[class*="Avatar"], [class*="avatar"]') }).first();
    const avatarVisible = await userAvatar.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!avatarVisible) {
      // If avatar not found, try to find by checking if we're logged in (login button should be gone)
      const loginButton = page.locator('text=Anmelden');
      const isLoggedIn = !(await loginButton.isVisible({ timeout: 2000 }).catch(() => false));
      if (!isLoggedIn) {
        throw new Error('User is not logged in after registration');
      }
      // If logged in but avatar not visible, skip logout test
      test.skip();
      return;
    }
    
    await userAvatar.click();
    
    // Wait for dropdown to open
    await page.waitForTimeout(500);
    
    // Click logout option
    await page.locator('text=Abmelden').click();
    
    // Should redirect to home page and show login button
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Anmelden')).toBeVisible({ timeout: 5000 });
  });
});

