# Test Setup Verification Guide

Dieses Dokument führt dich durch die Verifizierung des Test-Setups.

## Schritt 1: Dependencies installieren

```bash
cd packages/api
pnpm install
```

Dies installiert:
- `vitest` - Test Framework
- `supertest` - HTTP Testing für Express
- `@types/supertest` - TypeScript Types

## Schritt 2: Test-Database erstellen

Erstelle eine separate Test-Database (wichtig: nicht die Production-Database verwenden!):

```bash
# PostgreSQL
createdb sharelocal_test

# Oder mit psql
psql -U postgres -c "CREATE DATABASE sharelocal_test;"
```

## Schritt 3: Environment Variables setzen

Erstelle `.env.test` Datei im `packages/api` Verzeichnis:

```bash
cd packages/api
cp .env.test.example .env.test
```

Bearbeite `.env.test` und setze:

```env
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/sharelocal_test?schema=public"
JWT_SECRET="test-jwt-secret-key-min-32-chars-long-for-testing"
ENCRYPTION_KEY="test-encryption-key-min-32-chars-long-for-testing"
NODE_ENV="test"
```

**Wichtig:** 
- Verwende eine **separate Test-Database** (nicht Production!)
- Die Secrets können einfache Test-Strings sein (nur für Tests)

## Schritt 4: Database Schema für Tests

Führe Prisma Migrations auf der Test-Database aus:

```bash
# Vom Root-Verzeichnis
cd packages/database

# Setze DATABASE_URL auf Test-Database
export DATABASE_URL="postgresql://user:password@localhost:5432/sharelocal_test?schema=public"

# Push Schema zur Test-Database
pnpm db:push
```

Oder direkt:

```bash
DATABASE_URL="postgresql://..." pnpm --filter @sharelocal/database db:push
```

## Schritt 5: Verification Test ausführen

Führe den Verification Test aus, um zu prüfen, ob alles funktioniert:

```bash
cd packages/api
pnpm test verify.test.ts
```

**Erwartetes Ergebnis:**
- ✅ Alle Tests sollten grün sein
- ✅ Keine Fehler bei Database-Connection
- ✅ HTTP Requests funktionieren

## Schritt 6: Alle Tests ausführen

Wenn der Verification Test erfolgreich ist, führe alle Tests aus:

```bash
pnpm test
```

## Troubleshooting

### "TEST_DATABASE_URL must be set"
- Stelle sicher, dass `.env.test` existiert
- Prüfe, ob `TEST_DATABASE_URL` gesetzt ist
- Vitest lädt `.env.test` automatisch (mit dotenv)

### "Database connection failed"
- Prüfe, ob PostgreSQL läuft: `pg_isready`
- Prüfe Database-URL Format
- Prüfe Berechtigungen für Test-Database

### "Cannot find module 'supertest'"
- Führe `pnpm install` aus
- Prüfe `node_modules` Verzeichnis

### "Prisma Client not generated"
- Führe `pnpm --filter @sharelocal/database db:generate` aus
- Oder `pnpm --filter @sharelocal/database db:push` (generiert automatisch)

### "Tests are failing randomly"
- Stelle sicher, dass `cleanupTestDatabase()` in `beforeEach` aufgerufen wird
- Prüfe auf Race Conditions
- Verwende separate Test-Database

## Nächste Schritte

Nach erfolgreicher Verifizierung:

1. ✅ Verification Test läuft erfolgreich
2. ✅ Integration Tests können ausgeführt werden
3. ✅ Unit Tests können ausgeführt werden
4. ✅ Coverage Reports können generiert werden

## Test-Commands Übersicht

```bash
# Verification Test (sollte zuerst laufen)
pnpm test verify.test.ts

# Alle Tests
pnpm test

# Nur Integration Tests
pnpm test:integration

# Nur Unit Tests
pnpm test:unit

# Watch Mode
pnpm test:watch

# Mit Coverage
pnpm test:coverage
```

