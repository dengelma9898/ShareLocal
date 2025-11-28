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
  timeout: process.env.CI ? 60000 : 30000, // 60s timeout in CI, 30s locally
  reporter: process.env.CI ? [['html'], ['github']] : 'html',
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: process.env.CI ? 'on-first-retry' : 'on-first-retry', // Trace on retry in CI
    screenshot: 'only-on-failure', // Screenshot on failure
    video: process.env.CI ? 'retain-on-failure' : 'off', // Video only in CI on failure
    // Increase action timeout for CI
    actionTimeout: process.env.CI ? 30000 : 10000,
    navigationTimeout: process.env.CI ? 60000 : 30000,
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /.*\.mocked\.spec\.ts/, // Ignoriere Mock-Tests im Real-Mode
    },
    // Mock-Mode Projekt (keine API nötig)
    {
      name: 'chromium-mocked',
      use: { 
        ...devices['Desktop Chrome'],
      },
      testMatch: /.*\.mocked\.spec\.ts/, // Nur Mock-Tests
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

