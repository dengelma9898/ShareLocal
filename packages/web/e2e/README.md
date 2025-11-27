# E2E Tests mit Playwright

End-to-End Tests für die ShareLocal Web-Anwendung.

## Voraussetzungen

1. **Backend API muss laufen** auf `http://localhost:3001`
   ```bash
   cd packages/api
   pnpm dev
   ```

2. **Web-App wird automatisch gestartet** von Playwright (auf `http://localhost:3000`)

3. **Test-Database** sollte bereit sein (wird automatisch verwendet)

## Test-Ausführung

```bash
# WICHTIG: Stelle sicher, dass die Backend API läuft!
# In einem Terminal:
cd packages/api && pnpm dev

# In einem anderen Terminal:
cd packages/web
pnpm test:e2e

# Alle E2E Tests ausführen
pnpm test:e2e

# Mit UI (interaktiv, empfohlen für Entwicklung)
pnpm test:e2e:ui

# Im Browser (headed mode - sieht man den Browser)
pnpm test:e2e:headed

# Debug Mode (pausiert bei jedem Test)
pnpm test:e2e:debug

# Report anzeigen (nach Test-Ausführung)
pnpm test:e2e:report
```

## Test-Struktur

```
e2e/
├── auth.spec.ts                    # Authentication Tests (Register, Login, Logout)
├── listings.spec.ts                # Listing Discovery Tests (öffentlich)
├── listings-authenticated.spec.ts  # Listing Management (authenticated)
├── conversations.spec.ts           # Chat Tests (später)
├── fixtures.ts                     # Custom Test Fixtures
├── helpers/
│   └── auth.ts                     # Auth Helper Functions
└── README.md                        # Diese Datei
```

## Test-Fixtures

### `authenticatedUser` Fixture

Automatisch authentifizierter User für Tests:

```typescript
import { test, expect } from './fixtures';

test('should create listing', async ({ page, authenticatedUser }) => {
  // User ist bereits eingeloggt
  await page.goto('/listings/new');
  // ...
});
```

## Helper-Funktionen

### `createTestUser(page)`

Erstellt einen Test-User via API:

```typescript
import { createTestUser } from './helpers/auth';

const user = await createTestUser(page);
// user.email, user.password, user.token, user.userId
```

**Wichtig**: Benötigt laufende Backend API!

### `loginUser(page, email, password)`

Loggt einen User ein:

```typescript
import { loginUser } from './helpers/auth';

await loginUser(page, 'test@example.com', 'password123');
```

### `logoutUser(page)`

Loggt den aktuellen User aus:

```typescript
import { logoutUser } from './helpers/auth';

await logoutUser(page);
```

## Best Practices

1. **Test-Isolation**: Jeder Test sollte unabhängig sein
2. **Test-Daten**: Verwende eindeutige Test-Daten (z.B. `Date.now()` für Emails)
3. **Cleanup**: Tests bereinigen sich selbst (via fixtures)
4. **Warten auf Elemente**: Verwende `waitForSelector` statt feste `waitForTimeout`
5. **Selektoren**: Bevorzuge `data-testid` Attribute für stabile Selektoren

## Debugging

### Test im Browser ausführen

```bash
pnpm test:e2e:headed
```

### Test pausieren

```typescript
await page.pause(); // Pausiert Test und öffnet Playwright Inspector
```

### Screenshots

Screenshots werden automatisch bei Fehlern erstellt und im Report angezeigt.

### Trace Viewer

```bash
# Trace wird automatisch bei Retries erstellt
# Öffne im Report: "Trace" Button bei fehlgeschlagenen Tests
```

## CI/CD Integration

Tests können in CI/CD Pipelines ausgeführt werden:

```yaml
# Beispiel GitHub Actions
- name: Start Backend API
  run: |
    cd packages/api
    pnpm dev &
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
    ENCRYPTION_KEY: ${{ secrets.ENCRYPTION_KEY }}

- name: Install Playwright Browsers
  run: pnpm exec playwright install --with-deps chromium

- name: Run E2E Tests
  run: |
    cd packages/web
    pnpm test:e2e
  env:
    CI: true
```

## Troubleshooting

### Tests schlagen fehl wegen Timeout

- Prüfe ob Backend API läuft (`http://localhost:3001`)
- Prüfe ob Web-App läuft (`http://localhost:3000`)
- Erhöhe Timeout in `playwright.config.ts` falls nötig

### "ENCRYPTION_KEY environment variable is required"

- Backend API benötigt Environment-Variablen
- Stelle sicher, dass `.env` Datei im Root-Verzeichnis existiert
- Oder setze Environment-Variablen manuell

### Auth-Token wird nicht gesetzt

- Prüfe `localStorage` im Browser (headed mode)
- Prüfe ob API-Endpoint korrekt ist
- Prüfe ob Token-Format korrekt ist

### Element nicht gefunden

- Verwende Playwright Inspector (`pnpm test:e2e:debug`)
- Prüfe ob Element wirklich gerendert wird
- Verwende `data-testid` Attribute für stabile Selektoren

### Backend API Connection Error

- Stelle sicher, dass Backend API läuft: `cd packages/api && pnpm dev`
- Prüfe ob Port 3001 frei ist: `lsof -ti:3001`
- Prüfe Environment-Variablen in `.env` Datei
