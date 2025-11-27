import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import dotenv from 'dotenv';

// Lade Environment Variables für Tests
// Versuche zuerst .env.test im API Package, dann Root .env
dotenv.config({ path: resolve(__dirname, '.env.test') });
dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '.env') });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
    // setupFiles wird für beforeEach/afterEach verwendet
    // globalSetup/globalTeardown für einmalige Setup/Teardown
    env: {
      // Setze Defaults für Tests falls nicht gesetzt
      NODE_ENV: process.env.NODE_ENV || 'test',
      JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-key-min-32-chars-long-for-testing',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'test-encryption-key-min-32-chars-long-for-testing',
      DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '',
    },
    // Integration Tests sequenziell ausführen für bessere Isolation
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Sequenziell statt parallel für Integration Tests
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/index.ts',
        'src/__tests__/**',
      ],
    },
    // Timeout für Integration Tests (können länger dauern)
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});

