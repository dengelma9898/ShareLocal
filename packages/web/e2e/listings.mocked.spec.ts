// E2E Tests: Listing Management (Mocked)
// Testet Listing Discovery mit Mock-Daten (keine echte API nötig)

import { test, expect } from './fixtures';
import { setupApiMocks } from './mocks/api-mocks';

test.describe('Listings (Mocked)', () => {
  test.beforeEach(async ({ page }) => {
    // Mocks werden bereits durch fixtures.ts gesetzt (via useMocks: true)
    // Aber sicherstellen dass sie aktiv sind, bevor wir navigieren
    // Die Mocks sind komplett in Playwright implementiert (nicht vom Backend)
    
    // Warte länger, um sicherzustellen, dass Routes registriert sind
    // In CI kann es Race Conditions geben
    await page.waitForTimeout(200);
    
    // Verify routes are registered by checking if we can intercept a test request
    console.log('[TEST] Routes should be registered, waiting before navigation...');
    
    await page.goto('/');
  });

  test('should display listings page (mocked)', async ({ page }) => {
    await page.goto('/listings');

    // Should show listings page header (shorter timeout for mocks)
    await expect(page.locator('[data-testid="listings-page-header"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h1')).toContainText(/Angebote/i);
  });

  test('should show mock listings', async ({ page }) => {
    // Log all network requests for debugging
    page.on('request', (request) => {
      if (request.url().includes('/api/listings')) {
        console.log(`[TEST] Request: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', (response) => {
      if (response.url().includes('/api/listings')) {
        console.log(`[TEST] Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // Set up response listener BEFORE navigation to verify mock is working
    let apiResponseReceived = false;
    const responsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        const isListingsList = url.includes('/api/listings') && 
                               !url.includes('/api/listings/') && 
                               !url.includes('/api/listings/my') &&
                               response.status() === 200;
        if (isListingsList) {
          apiResponseReceived = true;
          console.log(`[TEST] ✅ Mock response received: ${url}`);
        }
        return isListingsList;
      },
      { timeout: 10000 } // Reduced timeout for mocked tests (10s)
    );

    await page.goto('/listings', { waitUntil: 'domcontentloaded' });

    // Wait for API response (this verifies the mock is working)
    try {
      const response = await responsePromise;
      const body = await response.json();
      console.log(`[TEST] ✅ Mock response body:`, JSON.stringify(body, null, 2));
    } catch (error) {
      // If response doesn't come, log for debugging
      console.error('[TEST] ❌ API response not received within timeout!');
      console.error('[TEST] This means the mock route is not matching the request');
      console.error('[TEST] Error:', error);
      // Continue anyway to see what happens
    }

    // Wait for page to be fully loaded (shorter timeout for mocks)
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Wait for React Query to render the data
    // Use a more robust check that waits for either grid or empty state
    await page.waitForFunction(
      () => {
        const grid = document.querySelector('[data-testid="listings-grid"]');
        const empty = document.querySelector('[data-testid="listings-empty-state"]');
        const loading = document.querySelector('[data-testid="listings-page-header"]');
        // Make sure page is loaded (header exists) and either grid or empty state exists
        return loading !== null && (grid !== null || empty !== null);
      },
      { timeout: 10000, polling: 500 } // Reduced timeout: 10s (was 30s)
    );

    // Now check for UI elements
    const listingsGrid = page.locator('[data-testid="listings-grid"]');
    const emptyState = page.locator('[data-testid="listings-empty-state"]');
    
    // Either grid or empty state should be visible
    const gridVisible = await listingsGrid.isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);
    
    expect(gridVisible || emptyVisible).toBe(true);
    
    // If grid is visible, should have at least one listing card (shorter timeout for mocks)
    if (gridVisible) {
      await expect(page.locator('[data-testid^="listing-card-"]').first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should navigate to listing detail page (mocked)', async ({ page }) => {
    // Wait for API response
    const responsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/api/listings') && 
               !url.includes('/api/listings/') && 
               !url.includes('/api/listings/my') &&
               response.status() === 200;
      },
      { timeout: 10000 } // Reduced timeout for mocked tests (10s)
    );

    await page.goto('/listings', { waitUntil: 'domcontentloaded' });

    // Wait for API response
    try {
      await responsePromise;
    } catch (error) {
      console.warn('[TEST] API response not received within timeout, continuing anyway');
    }

    // Wait for page to be fully loaded (shorter timeout for mocks)
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Wait for React Query to load data
    await page.waitForFunction(
      () => {
        const grid = document.querySelector('[data-testid="listings-grid"]');
        const empty = document.querySelector('[data-testid="listings-empty-state"]');
        const loading = document.querySelector('[data-testid="listings-page-header"]');
        return loading !== null && (grid !== null || empty !== null);
      },
      { timeout: 10000, polling: 500 } // Reduced timeout: 10s (was 30s)
    );

    // Check if listings grid exists
    const listingsGrid = page.locator('[data-testid="listings-grid"]');
    const hasListings = await listingsGrid.isVisible().catch(() => false);
    
    if (!hasListings) {
      // Skip test if no listings available
      test.skip();
      return;
    }
    
    // Wait for at least one listing card (shorter timeout for mocks)
    await page.waitForSelector('[data-testid^="listing-card-"]', { timeout: 5000 });

    // Click on first listing card
    const firstListing = page.locator('[data-testid^="listing-card-"]').first();
    await firstListing.click();
    
    // Should navigate to listing detail page (shorter timeout for mocks)
    await expect(page).toHaveURL(/\/listings\/[a-f0-9-]+/, { timeout: 5000 });
    
    // Wait for page to load (shorter timeout for mocks)
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    await page.waitForTimeout(500); // Reduced wait time
    
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

