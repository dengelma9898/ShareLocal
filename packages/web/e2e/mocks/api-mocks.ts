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
 */
export async function setupApiMocks(page: Page) {
  // Warte bis die Seite bereit ist, bevor Routes gesetzt werden
  // Dies stellt sicher, dass Routes vor allen Requests registriert sind
  
  // Mock: Health Check
  await page.route('**/api/health', async (route: Route) => {
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
  await page.route('**/api/auth/register', async (route: Route) => {
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
    
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          user: mockUser,
          token: mockToken,
        },
      }),
    });
  });

  // Mock: Login
  await page.route('**/api/auth/login', async (route: Route) => {
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

  // Mock: Get Listings (handle both GET requests and query parameters)
  // Match both /api/listings and /api/listings?query=params
  // IMPORTANT: This route must be registered BEFORE the detail route
  await page.route('**/api/listings**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();
    
    // Skip if this is a specific listing detail request (has UUID after /listings/)
    // Pattern: /api/listings/{uuid} but not /api/listings?query or /api/listings/my
    // Also skip /api/listings/my (user's own listings)
    if (url.match(/\/api\/listings\/[a-f0-9-]{36}(\?|$)/i) || url.includes('/api/listings/my')) {
      route.continue();
      return;
    }
    
    // Only handle GET requests for listings list
    if (method !== 'GET') {
      route.continue();
      return;
    }
    
    // Log for debugging (only in test mode)
    if (process.env.CI) {
      console.log(`[MOCK] Intercepting GET request to: ${url}`);
    }
    
    const mockListings = [
      {
        id: 'mock-listing-1',
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
        id: 'mock-listing-2',
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
    
    // Log for debugging
    if (process.env.CI) {
      console.log(`[MOCK] Fulfilling GET /api/listings with ${mockListings.length} listings`);
    }
    
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
  });

  // Mock: Get Listing by ID (must be AFTER the list route to avoid conflicts)
  // Match pattern: /api/listings/{uuid} (exact UUID pattern)
  await page.route('**/api/listings/[a-f0-9-]{36}**', async (route: Route) => {
    const url = route.request().url();
    const listingId = url.match(/\/api\/listings\/([a-f0-9-]{36})/i)?.[1] || 'mock-listing-1';
    
    // Only handle GET requests for listing detail
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    
    const mockListing = {
      id: listingId,
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
    };
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        data: {
          ...mockListing,
          owner: {
            id: 'mock-user-123',
            name: 'Mock Owner',
            email: 'owner@example.com',
          },
        },
      }),
    });
  });

  // Mock: Create Listing (POST to /api/listings)
  await page.route('**/api/listings', async (route: Route) => {
    if (route.request().method() === 'POST') {
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
        },
        body: JSON.stringify({
          data: mockListing,
        }),
      });
    } else {
      // GET request - use existing mock (will be handled by **/api/listings** route)
      await route.continue();
    }
  });

  // Mock: Get User
  await page.route('**/api/users/*', async (route: Route) => {
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

  // Mock: Get Conversations
  await page.route('**/api/conversations*', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        data: [],
      }),
    });
  });

  // Mock: Create Conversation
  await page.route('**/api/conversations', async (route: Route) => {
    if (route.request().method() === 'POST') {
      const request = route.request();
      const postData = request.postDataJSON();
      
      const mockConversation = {
        id: `mock-conversation-${Date.now()}`,
        listingId: postData.listingId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
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
    } else {
      await route.continue();
    }
  });
}

/**
 * Remove all API mocks
 */
export async function removeApiMocks(page: Page) {
  await page.unroute('**/api/**');
}

