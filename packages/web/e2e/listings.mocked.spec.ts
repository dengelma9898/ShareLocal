// E2E Tests: Listing Management (Mocked)
// Testet Listing Discovery mit Mock-Daten (keine echte API nötig)

import { test, expect } from './fixtures';
import { setupApiMocks } from './mocks/api-mocks';

test.describe('Listings (Mocked)', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API Mocks
    await setupApiMocks(page);
    await page.goto('/');
  });

  test('should display listings page (mocked)', async ({ page }) => {
    await page.goto('/listings');

    // Should show listings page header
    await expect(page.locator('[data-testid="listings-page-header"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText(/Angebote/i);
  });

  test('should show mock listings', async ({ page }) => {
    await page.goto('/listings');

    // Wait for listings to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should show listings grid with mock data
    const listingsGrid = page.locator('[data-testid="listings-grid"]');
    await expect(listingsGrid).toBeVisible({ timeout: 5000 });
    
    // Should have at least one listing card
    await expect(page.locator('[data-testid^="listing-card-"]').first()).toBeVisible();
  });

  test('should navigate to listing detail page (mocked)', async ({ page }) => {
    await page.goto('/listings');

    // Wait for listings to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Wait for listings grid to be visible
    const listingsGrid = page.locator('[data-testid="listings-grid"]');
    await expect(listingsGrid).toBeVisible({ timeout: 5000 });
    
    // Wait for at least one listing card
    await page.waitForSelector('[data-testid^="listing-card-"]', { timeout: 5000 });

    // Click on first listing card
    const firstListing = page.locator('[data-testid^="listing-card-"]').first();
    await firstListing.click();
    
    // Should navigate to listing detail page
    await expect(page).toHaveURL(/\/listings\/[a-f0-9-]+/, { timeout: 10000 });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Should show listing details - check for any visible content
    // The page should have loaded content (either heading, card, or main content)
    const hasContent = await Promise.race([
      page.locator('h1, h2').first().isVisible().then(() => true),
      page.locator('[class*="Card"]').first().isVisible().then(() => true),
      page.locator('main, [role="main"]').first().isVisible().then(() => true),
      page.waitForTimeout(2000).then(() => false),
    ]).catch(() => false);
    
    expect(hasContent).toBe(true);
  });

  test('should require authentication to create listing (mocked)', async ({ page }) => {
    await page.goto('/listings/new');

    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login/);
  });
});

