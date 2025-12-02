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
});

