// API Mocks für Playwright E2E Tests
// Ermöglicht Tests ohne laufende Backend API

import { Page, Route } from '@playwright/test';

export interface MockResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
}

/**
 * Setup API Mocks für alle Backend-Endpoints
 * WICHTIG: Mocks müssen VOR der Navigation gesetzt werden
 * 
 * Die Mocks werden komplett in Playwright implementiert (nicht vom Backend).
 * Sie fangen HTTP-Requests ab, bevor sie das Backend erreichen.
 * 
 * Route-Matching: Playwright routes matchen URLs mit ** wildcards.
 * Patterns sind sehr generisch und sollten alle Varianten abdecken.
 * 
 * @param page - Playwright Page instance
 */
export async function setupApiMocks(page: Page) {
  // Warte bis die Seite bereit ist, bevor Routes gesetzt werden
  // Dies stellt sicher, dass Routes vor allen Requests registriert sind

  // Mock: Health Check
  await page.route('**/api/health**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ status: 'ok', message: 'ShareLocal API is running (mocked)' }),
    });
  });

  // Mock: Register User
  // Very generic pattern: matches ANY URL containing /api/auth/register
  await page.route('**/api/auth/register**', async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON();
    
    // Simuliere erfolgreiche Registrierung
    const mockUser = {
      id: `mock-user-${Date.now()}`,
      email: postData.email,
      name: postData.name,
      emailVerified: false,
      role: 'USER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const mockToken = `mock-jwt-token-${Date.now()}`;
    
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        data: {
          user: mockUser,
          token: mockToken,
        },
      }),
    });
  });

  // Mock: Login
  // Very generic pattern: matches ANY URL containing /api/auth/login
  await page.route('**/api/auth/login**', async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON();
    
    // Simuliere erfolgreichen Login
    const mockUser = {
      id: 'mock-user-123',
      email: postData.email,
      name: 'Mock User',
      emailVerified: true,
      role: 'USER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const mockToken = `mock-jwt-token-${Date.now()}`;
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        data: {
          user: mockUser,
          token: mockToken,
        },
      }),
    });
  });

  // Mock: Listings endpoint - handles GET list, GET detail, and POST create
  // IMPORTANT: Use a single route handler that checks the method
  await page.route('**/api/listings**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();
    
    // Parse URL to check path
    let urlPath: string;
    try {
      const urlObj = new URL(url);
      urlPath = urlObj.pathname;
    } catch {
      urlPath = url.split('?')[0];
    }
    
    // Skip /api/listings/my (user's own listings)
    if (urlPath.includes('/api/listings/my')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          data: [],
          pagination: { limit: 50, offset: 0, total: 0, totalPages: 0 },
        }),
      });
      return;
    }
    
    // Handle GET /api/listings/{id} - Detail page
    const detailMatch = urlPath.match(/\/api\/listings\/([a-f0-9-]{36})/i);
    if (detailMatch && method === 'GET') {
      const listingId = detailMatch[1];
      
      // Use the requested ID or fallback to a valid UUID
      const validId = listingId.match(/^[a-f0-9-]{36}$/i) ? listingId : '123e4567-e89b-12d3-a456-426614174001';
      
      const mockListing = {
        id: validId,
        title: 'Mock Listing Detail',
        description: 'Detailed description of mock listing',
        category: 'TOOL',
        type: 'OFFER',
        userId: 'mock-user-123',
        location: 'Nürnberg',
        pricePerDay: 10.0,
        currency: 'EUR',
        available: true,
        images: [],
        tags: ['test', 'mock'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: {
          id: 'mock-user-123',
          name: 'Mock Owner',
          email: 'owner@example.com',
        },
      };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: JSON.stringify({
          data: mockListing,
        }),
      });
      return;
    }
    
    // Handle GET /api/listings - List page
    if (method === 'GET' && urlPath === '/api/listings') {
      const mockListings = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          title: 'Mock Listing 1',
          description: 'This is a mock listing for testing',
          category: 'TOOL',
          type: 'OFFER',
          userId: 'mock-user-123',
          location: 'Nürnberg',
          pricePerDay: 10.0,
          currency: 'EUR',
          available: true,
          images: [],
          tags: ['test', 'mock'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          title: 'Mock Listing 2',
          description: 'Another mock listing',
          category: 'PLANT',
          type: 'REQUEST',
          userId: 'mock-user-456',
          location: 'München',
          pricePerDay: null,
          currency: null,
          available: true,
          images: [],
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: JSON.stringify({
          data: mockListings,
          pagination: {
            limit: 50,
            offset: 0,
            total: mockListings.length,
            totalPages: 1,
          },
        }),
      });
      return;
    }
    
    // Handle POST /api/listings - Create listing
    if (method === 'POST' && urlPath === '/api/listings') {
      const request = route.request();
      const postData = request.postDataJSON();
      
      const mockListing = {
        id: `mock-listing-${Date.now()}`,
        ...postData,
        userId: 'mock-user-123',
        available: true,
        images: postData.images || [],
        tags: postData.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: JSON.stringify({
          data: mockListing,
        }),
      });
      return;
    }
    
    // For any other method/path combination, return empty response
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Not found',
      }),
    });
  });

  // Mock: Get User
  // Very generic pattern: matches ANY URL containing /api/users/
  await page.route('**/api/users/**', async (route: Route) => {
    const mockUser = {
      id: 'mock-user-123',
      email: 'test@example.com',
      name: 'Mock User',
      emailVerified: true,
      role: 'USER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        data: mockUser,
      }),
    });
  });

  // Mock: Conversations API
  // Store for mock conversations and messages
  const mockConversations: any[] = [
    {
      id: 'mock-conversation-1',
      listingId: null,
      participants: [
        { id: 'mock-user-123', name: 'Mock User', email: 'mock@example.com' },
        { id: 'mock-owner-456', name: 'Listing Owner', email: 'owner@example.com' },
      ],
      listing: null,
      lastMessage: {
        id: 'mock-message-1',
        content: 'Test message',
        senderId: 'mock-owner-456',
        createdAt: new Date().toISOString(),
        read: false,
      },
      unreadCount: 2, // Simulate unread messages
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  const mockMessages: Record<string, any[]> = {};

  await page.route('**/api/conversations**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    // GET /api/conversations - Get all conversations
    if (method === 'GET' && !url.includes('/messages')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          data: mockConversations,
        }),
      });
      return;
    }

    // POST /api/conversations - Create conversation
    if (method === 'POST' && !url.includes('/messages')) {
      const request = route.request();
      const postData = request.postDataJSON();
      
      const mockConversation = {
        id: `mock-conversation-${Date.now()}`,
        listingId: postData.listingId || null,
        participants: [
          { id: 'mock-user-123', name: 'Mock User', email: 'mock@example.com' },
          { id: 'mock-owner-456', name: 'Listing Owner', email: 'owner@example.com' },
        ],
        listing: postData.listingId ? {
          id: postData.listingId,
          title: 'Mock Listing',
          category: 'TOOL',
          type: 'OFFER',
        } : null,
        lastMessage: null,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockConversations.push(mockConversation);
      mockMessages[mockConversation.id] = [];
      
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          data: mockConversation,
        }),
      });
      return;
    }

    // GET /api/conversations/:id/messages - Get messages
    if (method === 'GET' && url.includes('/messages')) {
      const conversationId = url.match(/\/conversations\/([^/]+)\/messages/)?.[1];
      const messages = conversationId ? (mockMessages[conversationId] || []) : [];
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          data: messages,
        }),
      });
      return;
    }

    // POST /api/conversations/:id/messages - Send message
    if (method === 'POST' && url.includes('/messages')) {
      const conversationId = url.match(/\/conversations\/([^/]+)\/messages/)?.[1];
      const request = route.request();
      const postData = request.postDataJSON();
      
      if (conversationId) {
        const mockMessage = {
          id: `mock-message-${Date.now()}`,
          conversationId,
          sender: {
            id: 'mock-user-123',
            name: 'Mock User',
            email: 'mock@example.com',
          },
          content: postData.content,
          read: false,
          createdAt: new Date().toISOString(),
        };

        if (!mockMessages[conversationId]) {
          mockMessages[conversationId] = [];
        }
        mockMessages[conversationId].push(mockMessage);
        
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            data: mockMessage,
          }),
        });
        return;
      }
    }

    await route.continue();
  });
}

/**
 * Remove all API mocks
 */
export async function removeApiMocks(page: Page) {
  await page.unroute('**/api/**');
}
