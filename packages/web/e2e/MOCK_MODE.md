# Mock Mode für E2E Tests

## Übersicht

Playwright E2E Tests können in zwei Modi laufen:

1. **Real Mode** (Standard): Testet gegen echte Backend API
2. **Mock Mode**: Testet mit Mock-Daten (keine API nötig)

## Vorteile von Mock Mode

✅ **Schneller**: Keine echte API/Database nötig  
✅ **Isoliert**: Keine Abhängigkeit von externen Services  
✅ **Deterministisch**: Konsistente Test-Daten  
✅ **CI/CD freundlich**: Keine Database-Setup nötig  
✅ **Offline**: Funktioniert ohne Internet/Network  

## Nachteile von Mock Mode

❌ **Keine echte Integration**: Testet nicht die echte API  
❌ **Mock-Daten können abweichen**: Von echter API unterschiedlich  
❌ **Nicht alle Edge Cases**: Mock kann nicht alle Szenarien abdecken  

## Verwendung

### Real Mode (Standard)

```bash
# Benötigt laufende Backend API
cd packages/api && pnpm dev  # Terminal 1
cd packages/web && pnpm test:e2e:real  # Terminal 2
```

### Mock Mode

```bash
# Keine API nötig!
cd packages/web
pnpm test:e2e:mocked
```

## Test-Dateien

- **Real Mode Tests**: `*.spec.ts` (z.B. `auth.spec.ts`)
- **Mock Mode Tests**: `*.mocked.spec.ts` (z.B. `auth.mocked.spec.ts`)

## Mock-Implementierung

Mocks werden in `e2e/mocks/api-mocks.ts` definiert und simulieren alle Backend-Endpoints:

- `/api/auth/register` - User Registrierung
- `/api/auth/login` - User Login
- `/api/listings` - Listing CRUD
- `/api/users/*` - User Endpoints
- `/api/conversations` - Conversation Endpoints

## Empfehlung

**Für Entwicklung & CI/CD:**
- Verwende **Mock Mode** für schnelle Feedback-Loops
- Verwende **Real Mode** für Integration-Tests vor Commits

**Best Practice:**
- Mock Tests für schnelle UI-Tests
- Real Tests für vollständige Integration-Tests
- Beide in CI/CD Pipeline ausführen

## Commands

```bash
# Real Mode (benötigt API)
pnpm test:e2e:real

# Mock Mode (keine API nötig)
pnpm test:e2e:mocked

# Alle Tests (beide Modi)
pnpm test:e2e
```

