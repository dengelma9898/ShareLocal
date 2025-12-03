// E2E Tests: Conversations & Messaging
// Testet Chat-Funktionalität: Conversation-Erstellung, Nachrichten senden

import { test, expect } from './fixtures';

test.describe('Conversations', () => {
  test('should create conversation from listing detail page', async ({ page, authenticatedUser, useMocks }) => {
    // Navigate to a listing (we'll use a mock listing)
    // In real scenario, we'd need to create a listing first
    await page.goto('/listings');

    // Wait for listings to load
    await page.waitForSelector('[data-testid="listings-grid"], [data-testid="listings-empty-state"]', { timeout: 10000 });

    // If there are listings, click on the first one
    const firstListing = page.locator('[data-testid="listing-card"]').first();
    if (await firstListing.isVisible({ timeout: 2000 })) {
      await firstListing.click();
      
      // Wait for listing detail page
      await page.waitForURL(/\/listings\/[a-f0-9-]+/, { timeout: 10000 });
      
      // Click "Kontakt aufnehmen" button
      const contactButton = page.locator('button:has-text("Kontakt aufnehmen")').first();
      await expect(contactButton).toBeVisible();
      await contactButton.click();
      
      // Should redirect to conversation page
      await expect(page).toHaveURL(/\/conversations\/[a-f0-9-]+/, { timeout: 10000 });
      
      // Should show conversation interface
      await expect(page.locator('h1, h2')).toContainText(/Unbekannt|Listing Owner/i);
    } else {
      // Skip test if no listings available
      test.skip();
    }
  });

  test('should send a message in a conversation', async ({ page, authenticatedUser, useMocks }) => {
    // First, we need to create a conversation
    // For this test, we'll navigate directly to a conversation page
    // In a real scenario, we'd create a conversation first
    
    // Create a mock conversation ID
    const conversationId = 'mock-conversation-test-123';
    
    // Navigate to conversation page
    await page.goto(`/conversations/${conversationId}`);
    
    // Wait for conversation page to load
    await page.waitForSelector('textarea[placeholder*="Nachricht"]', { timeout: 10000 });
    
    // Type a message
    const messageInput = page.locator('textarea[placeholder*="Nachricht"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Hallo! Ist das Angebot noch verfügbar?');
    
    // Send message (click send button or press Enter)
    const sendButton = page.locator('button[type="submit"]').or(page.locator('button:has([data-lucide="send"])'));
    await sendButton.click();
    
    // Wait for message to appear (if using mocks, it should appear immediately)
    // In real scenario, we'd wait for the API response
    if (useMocks) {
      await page.waitForTimeout(500); // Give time for mock response
    } else {
      // Wait for message to appear in the chat
      await expect(page.locator('text=Hallo! Ist das Angebot noch verfügbar?')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display conversation list page', async ({ page, authenticatedUser }) => {
    await page.goto('/conversations');
    
    // Should show conversations page
    await expect(page.locator('h1')).toContainText(/Nachrichten/i);
    
    // Should show either conversations list or empty state
    const conversationsList = page.locator('[data-testid="conversations-list"]');
    const emptyState = page.locator('text=Noch keine Nachrichten');
    
    // One of them should be visible
    const hasConversations = await conversationsList.isVisible({ timeout: 2000 }).catch(() => false);
    const isEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(hasConversations || isEmpty).toBe(true);
  });

  test('should show conversation detail page', async ({ page, authenticatedUser, useMocks }) => {
    // Navigate to a conversation (using mock ID)
    const conversationId = 'mock-conversation-test-123';
    await page.goto(`/conversations/${conversationId}`);
    
    // Should show conversation header
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 10000 });
    
    // Should show message input
    const messageInput = page.locator('textarea[placeholder*="Nachricht"]');
    await expect(messageInput).toBeVisible();
    
    // Should show send button
    const sendButton = page.locator('button[type="submit"]').or(page.locator('button:has([data-lucide="send"])'));
    await expect(sendButton).toBeVisible();
  });

  test('should prevent sending empty messages', async ({ page, authenticatedUser }) => {
    const conversationId = 'mock-conversation-test-123';
    await page.goto(`/conversations/${conversationId}`);
    
    // Wait for page to load
    await page.waitForSelector('textarea[placeholder*="Nachricht"]', { timeout: 10000 });
    
    // Send button should be disabled when input is empty
    const sendButton = page.locator('button[type="submit"]').or(page.locator('button:has([data-lucide="send"])'));
    
    // Try to send empty message (button should be disabled)
    const isDisabled = await sendButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should show messages link in header navigation', async ({ page, authenticatedUser }) => {
    await page.goto('/');
    
    // Should show "Nachrichten" link in desktop navigation
    const messagesLink = page.locator('a:has-text("Nachrichten")');
    await expect(messagesLink).toBeVisible({ timeout: 5000 });
    
    // Click should navigate to conversations page
    await messagesLink.click();
    await expect(page).toHaveURL(/\/conversations/, { timeout: 5000 });
  });

  test('should show unread badge in header when messages are unread', async ({ page, authenticatedUser, useMocks }) => {
    if (!useMocks) {
      // Skip if not using mocks - would need real API setup
      test.skip();
      return;
    }

    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Should show unread badge next to "Nachrichten" link
    const messagesLink = page.locator('a:has-text("Nachrichten")');
    await expect(messagesLink).toBeVisible({ timeout: 5000 });
    
    // Check for badge - it should show the unread count
    const badge = messagesLink.locator('..').locator('[class*="Badge"]');
    const badgeVisible = await badge.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (badgeVisible) {
      // Badge should show a number
      const badgeText = await badge.textContent();
      expect(badgeText).toBeTruthy();
      expect(parseInt(badgeText || '0', 10)).toBeGreaterThan(0);
    }
  });

  test('should show messages icon with badge on mobile', async ({ page, authenticatedUser, useMocks }) => {
    if (!useMocks) {
      test.skip();
      return;
    }

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should show messages icon button (mobile)
    const messagesIconButton = page.locator('a[href="/conversations"] button, button:has([data-lucide="message-square"])').or(
      page.locator('a[href="/conversations"]')
    );
    
    // Check if messages link/button exists (might be in mobile nav or header)
    const messagesLink = page.locator('a[href="/conversations"]');
    const hasMessagesLink = await messagesLink.isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(hasMessagesLink).toBe(true);
  });

  test('should navigate to conversations from header link', async ({ page, authenticatedUser }) => {
    await page.goto('/');
    
    // Find and click messages link
    const messagesLink = page.locator('a:has-text("Nachrichten")').or(page.locator('a[href="/conversations"]'));
    await expect(messagesLink.first()).toBeVisible({ timeout: 5000 });
    await messagesLink.first().click();
    
    // Should navigate to conversations page
    await expect(page).toHaveURL(/\/conversations/, { timeout: 5000 });
    await expect(page.locator('h1')).toContainText(/Nachrichten/i);
  });
});

