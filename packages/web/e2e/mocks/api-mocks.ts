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
  
  // Log für Debugging
  console.log('[MOCK] Setting up API mocks...');
  
  // Log all requests for debugging (always log)
  // IMPORTANT: These listeners must be set up BEFORE routes are registered
  // to catch ALL requests, including those that don't match routes
  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      console.log(`[MOCK] 📤 Request event: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', (response) => {
    if (response.url().includes('/api/')) {
      console.log(`[MOCK] 📥 Response event: ${response.status()} ${response.url()}`);
    }
  });
  
  // Also log ALL requests (not just /api/) to see if requests are being made
  page.on('requestfailed', (request) => {
    if (request.url().includes('/api/')) {
      console.log(`[MOCK] ❌ Request failed: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    }
  });

  // Mock: Health Check
  // Very generic pattern: matches ANY URL containing /api/health
  await page.route('**/api/health**', async (route: Route) => {
    const url = route.request().url();
    if (process.env.CI) {
      console.log(`[MOCK] Health check: ${url}`);
    }
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

  // Mock: Get Listings (handle both GET requests and query parameters)
  // IMPORTANT: Use function matcher for better control and debugging
  // This route must be registered FIRST (before detail route)
  await page.route((url) => {
    // Match /api/listings but NOT /api/listings/{uuid} or /api/listings/my
    const isListRequest = url.includes('/api/listings') && 
                          !url.match(/\/api\/listings\/[a-f0-9-]{36}/i) &&
                          !url.includes('/api/listings/my');
    if (isListRequest) {
      console.log(`[MOCK] 🔵 Route matcher matched: ${url}`);
    }
    return isListRequest;
  }, async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();
    console.log(`[MOCK] 🔵 Route handler called for: ${method} ${url}`);
    
    // Parse URL to check path
    let urlPath: string;
    let urlHost: string;
    try {
      const urlObj = new URL(url);
      urlPath = urlObj.pathname;
      urlHost = urlObj.host;
    } catch {
      // Fallback: extract path from URL string
      urlPath = url.split('?')[0]; // Remove query params
      urlHost = '';
    }
    
    // Log ALL requests for debugging (always log in CI)
    console.log(`[MOCK] Route intercepted: ${method} ${url}`);
    console.log(`[MOCK] Path: ${urlPath}, Host: ${urlHost}`);
    
    // Skip if this is a specific listing detail request (has UUID after /listings/)
    // Pattern: /api/listings/{uuid} but not /api/listings?query or /api/listings/my
    // Also skip /api/listings/my (user's own listings)
    const isDetailRequest = urlPath.match(/\/api\/listings\/[a-f0-9-]{36}(\?|$)/i);
    const isMyListings = urlPath.includes('/api/listings/my') || url.includes('/api/listings/my');
    
    if (isDetailRequest || isMyListings) {
      console.log(`[MOCK] Skipping (detail/my): ${urlPath}`);
      await route.continue();
      return;
    }
    
    // Only handle GET requests for listings list
    if (method !== 'GET') {
      console.log(`[MOCK] Skipping (not GET): ${method}`);
      await route.continue();
      return;
    }
    
    // Log for debugging
    console.log(`[MOCK] ✅ Intercepting GET request to: ${url} (path: ${urlPath})`);
    
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
    
    // Log for debugging (always log)
    console.log(`[MOCK] Fulfilling GET /api/listings with ${mockListings.length} listings`);
    console.log(`[MOCK] Request URL: ${url}`);
    console.log(`[MOCK] Request Method: ${method}`);
    
    const responseBody = {
      data: mockListings,
      pagination: {
        limit: 50,
        offset: 0,
        total: mockListings.length,
        totalPages: 1,
      },
    };
    
    console.log(`[MOCK] Response body:`, JSON.stringify(responseBody, null, 2));
    
    try {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: JSON.stringify(responseBody),
      });
      console.log(`[MOCK] ✅ Successfully fulfilled request for ${url}`);
    } catch (error) {
      console.error(`[MOCK] ❌ Error fulfilling request for ${url}:`, error);
      throw error;
    }
  });

  // Mock: Create Listing (POST to /api/listings)
  // Very generic pattern: matches ANY URL containing /api/listings
  // This route handles POST requests, GET requests are handled by the list route above
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
    
    // Skip detail requests (handled by detail route)
    const isDetailRequest = urlPath.match(/\/api\/listings\/[a-f0-9-]{36}(\?|$)/i);
    if (isDetailRequest) {
      await route.continue();
      return;
    }
    
    // Only handle POST requests for creating listings
    if (method === 'POST') {
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
      // GET request - let the list route handle it (registered earlier)
      // This route is only for POST requests
      await route.continue();
    }
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

  // Mock: Get Conversations
  // Very generic pattern: matches ANY URL containing /api/conversations
  await page.route('**/api/conversations**', async (route: Route) => {
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
  // Very generic pattern: matches ANY URL containing /api/conversations
  await page.route('**/api/conversations**', async (route: Route) => {
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
  
  console.log('[MOCK] ✅ All API mocks set up');
  console.log('[MOCK] Registered routes:');
  console.log('[MOCK]   - **/api/health**');
  console.log('[MOCK]   - **/api/auth/register**');
  console.log('[MOCK]   - **/api/auth/login**');
  console.log('[MOCK]   - **/api/listings** (GET list)');
  console.log('[MOCK]   - **/api/listings** (POST create)');
  console.log('[MOCK]   - **/api/users/**');
  console.log('[MOCK]   - **/api/conversations**');
}

/**
 * Remove all API mocks
 */
export async function removeApiMocks(page: Page) {
  await page.unroute('**/api/**');
}
