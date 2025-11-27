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
  reporter: 'html',
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
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
    stdout: 'ignore',
    stderr: 'pipe',
    // Backend API muss separat laufen (nicht automatisch gestartet)
    // Starte API manuell: cd packages/api && pnpm dev
  },
});

