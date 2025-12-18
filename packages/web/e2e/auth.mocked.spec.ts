// E2E Tests: Authentication Flow (Mocked)
// Testet User Registration und Login mit Mock-Daten (keine echte API nötig)

import { test, expect } from './fixtures';
import { setupApiMocks } from './mocks/api-mocks';

test.describe('Authentication (Mocked)', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API Mocks
    await setupApiMocks(page);
    
    // Cleanup: Clear localStorage and cookies
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  });

  test('should register a new user (mocked)', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    const testEmail = `test-mock-${Date.now()}@example.com`;

    // Fill registration form using data-testid
    await page.fill('[data-testid="register-name-input"]', 'Test User');
    await page.fill('[data-testid="register-email-input"]', testEmail);
    await page.fill('[data-testid="register-password-input"]', 'test123456');
    await page.fill('[data-testid="register-confirm-password-input"]', 'test123456');

    // Submit form
    await page.click('[data-testid="register-submit-button"]');

    // Wait for navigation - should redirect to home page after successful registration
    // Increased timeout for webkit which can be slower
    await page.waitForURL('/', { timeout: 30000 });
    
    // Verify we're on home page
    await expect(page).toHaveURL('/');
  });

  test('should login with valid credentials (mocked)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill login form using data-testid
    // Mock akzeptiert jede Email/Password Kombination
    await page.fill('[data-testid="login-email-input"]', 'test@example.com');
    await page.fill('[data-testid="login-password-input"]', 'anypassword');

    // Submit form
    await page.click('[data-testid="login-submit-button"]');

    // Wait for navigation - should redirect to home page after successful login
    // Increased timeout for webkit which can be slower
    await page.waitForURL('/', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    
    // Should show user is logged in - check for user avatar button or login button gone
    const loginButton = page.locator('text=Anmelden');
    await expect(loginButton).not.toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid login credentials (mocked)', async ({ page }) => {
    // Note: Mock gibt immer Erfolg zurück, daher testen wir hier die UI-Validierung
    await page.goto('/login');

    // Leere Felder sollten Validierungsfehler zeigen
    await page.click('[data-testid="login-submit-button"]');
    
    // Should show validation errors
    await page.waitForTimeout(500);
    const hasErrors = await page.locator('[data-testid="login-error"], .text-red-600, [role="alert"]').isVisible().catch(() => false);
    
    // UI sollte Validierungsfehler zeigen (auch wenn Mock erfolgreich wäre)
    expect(hasErrors || page.locator('input:invalid').count() > 0).toBeTruthy();
  });
});

