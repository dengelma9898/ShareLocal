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
 */
export async function setupApiMocks(page: Page) {
  // Mock: Health Check
  await page.route('**/api/health', (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
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
    
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          user: mockUser,
          token: mockToken,
        },
      }),
    });
  });

  // Mock: Get Listings
  await page.route('**/api/listings*', async (route: Route) => {
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
    
    route.fulfill({
      status: 200,
      contentType: 'application/json',
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

  // Mock: Get Listing by ID
  await page.route('**/api/listings/*', async (route: Route) => {
    const url = route.request().url();
    const listingId = url.split('/listings/')[1]?.split('?')[0];
    
    const mockListing = {
      id: listingId || 'mock-listing-1',
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
    
    route.fulfill({
      status: 200,
      contentType: 'application/json',
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

  // Mock: Create Listing
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
      
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockListing,
        }),
      });
    } else {
      // GET request - use existing mock
      route.continue();
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
    
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: mockUser,
      }),
    });
  });

  // Mock: Get Conversations
  await page.route('**/api/conversations*', async (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
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
      
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockConversation,
        }),
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Remove all API mocks
 */
export async function removeApiMocks(page: Page) {
  await page.unroute('**/api/**');
}

