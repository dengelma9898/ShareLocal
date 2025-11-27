# Testing Guide

Dieses Verzeichnis enthält alle Tests für die ShareLocal API.

## Test-Struktur

```
src/__tests__/
├── setup/                    # Test-Setup und Helpers
│   ├── test-db.ts           # Database Setup für Tests
│   ├── test-app.ts          # Express App Setup für Tests
│   ├── test-helpers.ts      # Utility-Funktionen
│   └── global-setup.ts      # Global Setup (wird vor allen Tests ausgeführt)
├── integration/              # Integration Tests (HTTP Endpoints)
│   ├── auth.test.ts         # Authentication Tests
│   ├── users.test.ts        # User CRUD Tests
│   ├── listings.test.ts     # Listing CRUD Tests
│   └── conversations.test.ts # Chat Tests
└── unit/                     # Unit Tests (Business Logic)
    └── use-cases/           # Use Case Tests mit Mocks
        └── RegisterUserUseCase.test.ts
```

## Test-Typen

### Integration Tests
- Testen HTTP Endpoints end-to-end
- Verwenden echte Database (Test-Database)
- Testen vollständige Request/Response Cycles
- Verwenden Supertest für HTTP-Requests

### Unit Tests
- Testen Business Logic isoliert
- Verwenden Mock-Repositories und Services
- Schnell und fokussiert auf einzelne Use Cases

## Setup

### 1. Test-Database erstellen

Erstelle eine separate Test-Database:

```bash
# PostgreSQL
createdb sharelocal_test

# Oder mit psql
psql -U postgres -c "CREATE DATABASE sharelocal_test;"
```

### 2. Environment Variables

Erstelle `.env.test` Datei (siehe `.env.test.example`):

```bash
cp .env.test.example .env.test
```

Wichtig: `TEST_DATABASE_URL` sollte auf eine separate Test-Database zeigen!

### 3. Dependencies installieren

```bash
pnpm install
```

### 4. Database Schema für Tests

```bash
# Prisma Schema auf Test-Database pushen
DATABASE_URL="postgresql://..." pnpm --filter @sharelocal/database db:push
```

## Tests ausführen

### Alle Tests
```bash
pnpm test
```

### Nur Integration Tests
```bash
pnpm test integration
```

### Nur Unit Tests
```bash
pnpm test unit
```

### Einzelne Test-Datei
```bash
pnpm test auth.test.ts
```

### Watch Mode
```bash
pnpm test --watch
```

### Coverage
```bash
pnpm test --coverage
```

## Test-Writing Guidelines

### Integration Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../setup/test-app.js';
import { cleanupTestDatabase } from '../setup/test-db.js';

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await cleanupTestDatabase(); // Cleanup vor jedem Test
  });

  it('should register a new user', async () => {
    const app = getTestApp();
    
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', ... })
      .expect(201);
    
    expect(response.body.data).toHaveProperty('user');
  });
});
```

### Unit Tests

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegisterUserUseCase } from '../../../application/use-cases/RegisterUserUseCase.js';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockUserRepository: UserRepository;
  
  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    } as unknown as UserRepository;
    
    useCase = new RegisterUserUseCase(mockUserRepository, mockAuthService);
  });
  
  it('should register user', async () => {
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
    // ... test logic
  });
});
```

## Test-Helpers

### `createTestUser(data)`
Erstellt einen Test-User in der Database.

### `createTestListing(data)`
Erstellt ein Test-Listing in der Database.

### `createTestConversation(data)`
Erstellt eine Test-Conversation.

### `generateTestToken(userId, email)`
Generiert einen JWT Token für Tests.

### `cleanupTestDatabase()`
Bereinigt die Test-Database (löscht alle Daten).

## Best Practices

1. **Isolation**: Jeder Test sollte isoliert sein
   - Verwende `beforeEach` für Cleanup
   - Verwende `afterEach` für Cleanup

2. **Test-Database**: Verwende immer eine separate Test-Database
   - Niemals Production-Database für Tests!
   - `TEST_DATABASE_URL` sollte gesetzt sein

3. **Cleanup**: Bereinige Database nach jedem Test
   - Verhindert Test-Interferenzen
   - Stellt sicher, dass Tests deterministisch sind

4. **Mocking**: Verwende Mocks für Unit Tests
   - Mock externe Dependencies
   - Teste nur die Business Logic

5. **Assertions**: Verwende klare Assertions
   - Teste sowohl Success- als auch Error-Cases
   - Teste Edge Cases

6. **Naming**: Verwende beschreibende Test-Namen
   - `should register a new user successfully`
   - `should reject registration with duplicate email`

## Troubleshooting

### "TEST_DATABASE_URL must be set"
- Erstelle `.env.test` Datei
- Setze `TEST_DATABASE_URL` auf Test-Database

### "Database connection failed"
- Stelle sicher, dass PostgreSQL läuft
- Prüfe Database-URL
- Prüfe Berechtigungen

### "Tests are failing randomly"
- Stelle sicher, dass `cleanupTestDatabase()` in `beforeEach` aufgerufen wird
- Prüfe auf Race Conditions
- Verwende separate Test-Database

### "Cannot find module"
- Führe `pnpm install` aus
- Prüfe TypeScript-Pfade
- Prüfe `vitest.config.ts` Aliases

