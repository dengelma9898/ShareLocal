// E2E Tests: Listing Management (Authenticated)
// Testet Listing Creation mit authentifiziertem User

import { test, expect } from './fixtures';

test.describe('Listings (Authenticated)', () => {
  test('should create a new listing', async ({ page, authenticatedUser }) => {
    await page.goto('/listings/new');

    // Step 1: Fill basic info
    await page.fill('[data-testid="listing-title-input"]', 'Test Listing E2E');
    await page.fill('[data-testid="listing-description-input"]', 'This is a test listing description for E2E testing');
    
    // Select type (using Select component)
    await page.click('[data-testid="listing-type-select"]');
    // Wait for dropdown to open and select the option
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Angebot (ich biete an)")').first().click();
    
    // Select category
    await page.click('[data-testid="listing-category-select"]');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Werkzeug")').first().click();

    // Click "Weiter" to go to next step
    await page.click('button:has-text("Weiter")');
    
    // Step 2: Skip optional details (or fill them if needed)
    // Click "Weiter" again to go to preview
    await page.click('button:has-text("Weiter")');
    
    // Step 3: Submit form
    await page.click('[data-testid="listing-submit-button"]');

    // Should redirect to listing detail page
    await expect(page).toHaveURL(/\/listings\/[a-f0-9-]+/, { timeout: 15000 });
    
    // Should show listing details
    await expect(page.locator('text=Test Listing E2E')).toBeVisible();
  });

  test('should show my listings page', async ({ page, authenticatedUser }) => {
    await page.goto('/listings/my');

    // Should show my listings page
    await expect(page.locator('h1, h2')).toContainText(/Meine Angebote|My Listings/i);
  });

  test('should edit own listing', async ({ page, authenticatedUser }) => {
    // First create a listing via API or form
    // Then navigate to edit page
    test.skip(); // Skip until listing creation helper is implemented
  });
});

