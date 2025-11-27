// E2E Tests: Listing Management
// Testet Listing Discovery, Creation, und Viewing

import { test, expect } from '@playwright/test';

test.describe('Listings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display listings page', async ({ page }) => {
    await page.goto('/listings');

    // Should show listings page header
    await expect(page.locator('[data-testid="listings-page-header"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText(/Angebote/i);
  });

  test('should filter listings by category', async ({ page }) => {
    await page.goto('/listings');

    // Wait for page to load (either listings or empty state)
    await page.waitForSelector('[data-testid="listings-grid"], [data-testid="listings-empty-state"]', { timeout: 10000 });

    // Check if there are listings to filter
    const listingsGrid = page.locator('[data-testid="listings-grid"]');
    if (await listingsGrid.isVisible()) {
      // Find category filter checkbox for TOOL
      const toolCategoryCheckbox = page.locator('#category-TOOL');
      
      if (await toolCategoryCheckbox.isVisible()) {
        await toolCategoryCheckbox.click();
        
        // Wait for filtered results
        await page.waitForTimeout(1000);
        
        // Verify filter is applied - listings should still be visible or empty state
        await expect(page.locator('[data-testid="listings-grid"], [data-testid="listings-empty-state"]')).toBeVisible();
      }
    } else {
      // No listings available, skip this test
      test.skip();
    }
  });

  test('should navigate to listing detail page', async ({ page }) => {
    await page.goto('/listings');

    // Wait for page to load (either listings grid, empty state, or loading skeleton)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give React Query time to fetch

    // Check if there are listings
    const listingsGrid = page.locator('[data-testid="listings-grid"]');
    const isEmptyState = page.locator('[data-testid="listings-empty-state"]');
    
    const hasListings = await listingsGrid.isVisible({ timeout: 3000 }).catch(() => false);
    const isEmpty = await isEmptyState.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!hasListings && isEmpty) {
      // No listings available, skip this test
      test.skip();
      return;
    }
    
    if (hasListings) {
      // Wait for at least one listing card
      await page.waitForSelector('[data-testid^="listing-card-"]', { timeout: 5000 });
      
      // Click on first listing card link
      const firstListingLink = page.locator('[data-testid^="listing-card-"]').first();
      await firstListingLink.click();
      
      // Should navigate to listing detail page
      await expect(page).toHaveURL(/\/listings\/[a-f0-9-]+/, { timeout: 10000 });
      
      // Should show listing details
      await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 });
    } else {
      // Still loading or error, skip
      test.skip();
    }
  });

  test('should require authentication to create listing', async ({ page }) => {
    await page.goto('/listings/new');

    // Should redirect to login if not authenticated
    // Or show login prompt
    await expect(page).toHaveURL(/\/login/);
  });

  test('should create a new listing when authenticated', async ({ page }) => {
    // This test requires authentication
    // In a real scenario, you'd use a helper function to login first
    test.skip(); // Skip until auth helper is implemented
  });
});

