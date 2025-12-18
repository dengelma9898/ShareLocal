import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * 
 * Tests die vollständige User-Journey durch die Web-App
 * inklusive Integration mit der Backend API
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Sequenziell für bessere API-Isolation
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Ein Worker für sequenzielle Ausführung
  // Shorter timeout for mocked tests (no real API calls)
  timeout: process.env.CI ? 30000 : 15000, // 30s in CI, 15s locally (reduced for mocks)
  reporter: process.env.CI ? [['html'], ['github']] : 'html',
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: process.env.CI ? 'on-first-retry' : 'on-first-retry', // Trace on retry in CI
    screenshot: 'only-on-failure', // Screenshot on failure
    video: process.env.CI ? 'retain-on-failure' : 'off', // Video only in CI on failure
    // Reduced timeouts for mocked tests (no network latency)
    actionTimeout: process.env.CI ? 15000 : 5000, // 15s in CI, 5s locally
    navigationTimeout: process.env.CI ? 30000 : 15000, // 30s in CI, 15s locally
  },
  
  projects: [
    // Real Mode: Chromium (Chrome/Edge)
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Longer timeouts for real API tests
        actionTimeout: process.env.CI ? 30000 : 10000,
        navigationTimeout: process.env.CI ? 60000 : 30000,
      },
      testIgnore: /.*\.mocked\.spec\.ts/, // Ignoriere Mock-Tests im Real-Mode
    },
    // Real Mode: Firefox
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        actionTimeout: process.env.CI ? 30000 : 10000,
        navigationTimeout: process.env.CI ? 60000 : 30000,
      },
      testIgnore: /.*\.mocked\.spec\.ts/,
    },
    // Real Mode: WebKit (Safari)
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        actionTimeout: process.env.CI ? 30000 : 10000,
        navigationTimeout: process.env.CI ? 60000 : 30000,
      },
      testIgnore: /.*\.mocked\.spec\.ts/,
    },
    // Real Mode: Mobile Chrome (Android)
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        actionTimeout: process.env.CI ? 30000 : 10000,
        navigationTimeout: process.env.CI ? 60000 : 30000,
      },
      testIgnore: /.*\.mocked\.spec\.ts/,
    },
    // Real Mode: Mobile Safari (iOS)
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 13'],
        actionTimeout: process.env.CI ? 30000 : 10000,
        navigationTimeout: process.env.CI ? 60000 : 30000,
      },
      testIgnore: /.*\.mocked\.spec\.ts/,
    },
    // Mock-Mode: Firefox (für schnelle Cross-Browser-Checks)
    {
      name: 'firefox-mocked',
      use: { 
        ...devices['Desktop Firefox'],
        actionTimeout: process.env.CI ? 10000 : 5000,
        navigationTimeout: process.env.CI ? 20000 : 10000,
      },
      testMatch: /.*\.mocked\.spec\.ts/,
      timeout: process.env.CI ? 20000 : 10000,
    },
    // Mock-Mode: WebKit/Safari (für schnelle Cross-Browser-Checks)
    {
      name: 'webkit-mocked',
      use: { 
        ...devices['Desktop Safari'],
        // Increased timeouts for webkit which can be slower, especially in CI
        actionTimeout: process.env.CI ? 30000 : 10000,
        navigationTimeout: process.env.CI ? 60000 : 30000,
      },
      testMatch: /.*\.mocked\.spec\.ts/,
      timeout: process.env.CI ? 60000 : 30000,
    },
    // Mock-Mode: Mobile Chrome (für schnelle Mobile-Checks)
    {
      name: 'mobile-chrome-mocked',
      use: { 
        ...devices['Pixel 5'],
        actionTimeout: process.env.CI ? 10000 : 5000,
        navigationTimeout: process.env.CI ? 20000 : 10000,
      },
      testMatch: /.*\.mocked\.spec\.ts/,
      timeout: process.env.CI ? 20000 : 10000,
    },
    // Mock-Mode Projekt (keine API nötig) - kürzere Timeouts, nur Chromium für Geschwindigkeit
    {
      name: 'chromium-mocked',
      use: { 
        ...devices['Desktop Chrome'],
        // Shorter timeouts for mocked tests (no network latency)
        actionTimeout: process.env.CI ? 10000 : 5000, // 10s in CI, 5s locally
        navigationTimeout: process.env.CI ? 20000 : 10000, // 20s in CI, 10s locally
      },
      testMatch: /.*\.mocked\.spec\.ts/, // Nur Mock-Tests
      // Shorter timeout for mocked tests
      timeout: process.env.CI ? 20000 : 10000, // 20s in CI, 10s locally
    },
  ],


  // Web Server für Tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe', // Show stdout in CI for debugging
    stderr: 'pipe',
    env: {
      // Ensure API URL is set correctly for mocked tests
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
      NODE_ENV: 'test',
    },
    // Backend API muss separat laufen (nicht automatisch gestartet)
    // Starte API manuell: cd packages/api && pnpm dev
  },
});

