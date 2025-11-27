// Global Test Setup
// Wird einmal vor allen Tests ausgeführt

import { cleanupTestDatabase, migrateTestDatabase } from './test-db.js';

export async function setup() {
  console.log('🧪 Setting up test environment...');

  // Stelle sicher, dass TEST_DATABASE_URL gesetzt ist
  if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
    throw new Error(
      'TEST_DATABASE_URL or DATABASE_URL must be set for tests.\n' +
      'Please create a separate test database and set TEST_DATABASE_URL in .env.test'
    );
  }

  // Optional: Migration ausführen (falls nötig)
  // await migrateTestDatabase();

  // Database bereinigen
  await cleanupTestDatabase();

  console.log('✅ Test environment ready');
}

export async function teardown() {
  console.log('🧹 Cleaning up test environment...');
  
  // Database bereinigen nach allen Tests
  await cleanupTestDatabase();
  
  console.log('✅ Test environment cleaned up');
}

