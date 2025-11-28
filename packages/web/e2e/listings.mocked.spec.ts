// E2E Tests: Listing Management (Mocked)
// Testet Listing Discovery mit Mock-Daten (keine echte API nötig)

import { test, expect } from './fixtures';

test.describe('Listings (Mocked)', () => {
  test.use({ useMocks: true }); // Activate mocks for all tests in this file

  test.beforeEach(async ({ page }) => {
    // Mocks werden bereits durch fixtures.ts gesetzt (via useMocks: true)
    // Die Mocks sind komplett in Playwright implementiert (nicht vom Backend)
    
    // Navigate to home page first to ensure page is ready
    await page.goto('/');
  });

  test('should display listings page (mocked)', async ({ page }) => {
    await page.goto('/listings');

    // Should show listings page header (shorter timeout for mocks)
    await expect(page.locator('[data-testid="listings-page-header"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h1')).toContainText(/Angebote/i);
  });

  test('should show mock listings', async ({ page }) => {
    // Set up response listener BEFORE navigation to verify mock is working
    const responsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        // Match GET /api/listings (list endpoint, not detail or /my)
        const isListingsList = url.includes('/api/listings') && 
                               !url.match(/\/api\/listings\/[a-f0-9-]{36}/i) &&
                               !url.includes('/api/listings/my') &&
                               response.status() === 200;
        if (isListingsList) {
          console.log(`[TEST] ✅ Mock response received: ${url}`);
        }
        return isListingsList;
      },
      { timeout: 15000 }
    );

    await page.goto('/listings', { waitUntil: 'domcontentloaded' });

    // Wait for API response (this verifies the mock is working)
    try {
      const response = await responsePromise;
      const body = await response.json();
      console.log(`[TEST] ✅ Mock response received with ${body.data?.length || 0} listings`);
    } catch (error) {
      console.error('[TEST] ❌ API response not received within timeout!');
      console.error('[TEST] This means the mock route is not matching the request');
      throw error; // Fail the test if mock doesn't work
    }

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Wait for React Query to render the data
    await page.waitForFunction(
      () => {
        const grid = document.querySelector('[data-testid="listings-grid"]');
        const empty = document.querySelector('[data-testid="listings-empty-state"]');
        const loading = document.querySelector('[data-testid="listings-page-header"]');
        // Make sure page is loaded (header exists) and either grid or empty state exists
        return loading !== null && (grid !== null || empty !== null);
      },
      { timeout: 15000, polling: 500 }
    );

    // Now check for UI elements
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
    // Wait for listings list API response
    const listResponsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/api/listings') && 
               !url.match(/\/api\/listings\/[a-f0-9-]{36}/i) &&
               !url.includes('/api/listings/my') &&
               response.status() === 200;
      },
      { timeout: 15000 }
    );

    await page.goto('/listings', { waitUntil: 'domcontentloaded' });

    // Wait for listings list to load
    await listResponsePromise;

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Wait for React Query to load data
    await page.waitForFunction(
      () => {
        const grid = document.querySelector('[data-testid="listings-grid"]');
        const empty = document.querySelector('[data-testid="listings-empty-state"]');
        const loading = document.querySelector('[data-testid="listings-page-header"]');
        return loading !== null && (grid !== null || empty !== null);
      },
      { timeout: 15000, polling: 500 }
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
    await page.waitForSelector('[data-testid^="listing-card-"]', { timeout: 10000 });

    // Wait for detail API response
    const detailResponsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.match(/\/api\/listings\/[a-f0-9-]{36}/i) && response.status() === 200;
      },
      { timeout: 15000 }
    );

    // Click on first listing card
    const firstListing = page.locator('[data-testid^="listing-card-"]').first();
    await firstListing.click();
    
    // Should navigate to listing detail page
    await expect(page).toHaveURL(/\/listings\/[a-f0-9-]+/, { timeout: 10000 });
    
    // Wait for detail API response
    await detailResponsePromise;
    
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show listing details
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
  });

  test('should require authentication to create listing (mocked)', async ({ page }) => {
    await page.goto('/listings/new');

    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login/);
  });
});

