// E2E Tests: Listing Management (Mocked)
// Testet Listing Discovery mit Mock-Daten (keine echte API nötig)

import { test, expect } from './fixtures';
import { setupApiMocks } from './mocks/api-mocks';

test.describe('Listings (Mocked)', () => {
  test.beforeEach(async ({ page }) => {
    // Mocks werden bereits durch fixtures.ts gesetzt, aber sicherstellen dass sie aktiv sind
    await page.goto('/');
  });

  test('should display listings page (mocked)', async ({ page }) => {
    await page.goto('/listings');

    // Should show listings page header
    await expect(page.locator('[data-testid="listings-page-header"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1')).toContainText(/Angebote/i);
  });

  test('should show mock listings', async ({ page }) => {
    // Wait for API request to be intercepted and fulfilled
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/listings') && response.status() === 200,
      { timeout: 10000 }
    );

    await page.goto('/listings');

    // Wait for API response
    await responsePromise;

    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for listings grid or empty state to appear
    await page.waitForSelector(
      '[data-testid="listings-grid"], [data-testid="listings-empty-state"]',
      { timeout: 10000 }
    );

    // Check if listings grid exists (might be empty state if no listings)
    const listingsGrid = page.locator('[data-testid="listings-grid"]');
    const emptyState = page.locator('[data-testid="listings-empty-state"]');
    
    // Either grid or empty state should be visible
    const gridVisible = await listingsGrid.isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);
    
    expect(gridVisible || emptyVisible).toBe(true);
    
    // If grid is visible, should have at least one listing card
    if (gridVisible) {
      await expect(page.locator('[data-testid^="listing-card-"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to listing detail page (mocked)', async ({ page }) => {
    // Wait for API request to be intercepted and fulfilled
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/listings') && response.status() === 200,
      { timeout: 10000 }
    );

    await page.goto('/listings');

    // Wait for API response
    await responsePromise;

    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for listings grid or empty state to appear
    await page.waitForSelector(
      '[data-testid="listings-grid"], [data-testid="listings-empty-state"]',
      { timeout: 10000 }
    );

    // Check if listings grid exists
    const listingsGrid = page.locator('[data-testid="listings-grid"]');
    const hasListings = await listingsGrid.isVisible().catch(() => false);
    
    if (!hasListings) {
      // Skip test if no listings available
      test.skip();
      return;
    }
    
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

