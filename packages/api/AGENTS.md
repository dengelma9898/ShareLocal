# @sharelocal/api - Agent Context

Backend API Package - Express.js + TypeScript

## Architektur: Ports & Adapters (Hexagonal Architecture)

Das API-Package verwendet **Ports & Adapters (Hexagonal Architecture)** für maximale Flexibilität:

- **Domain Layer**: Pure Business Logic, keine Infrastruktur-Abhängigkeiten
- **Ports**: Interfaces für externe Services (Repositories, Services)
- **Adapters**: Konkrete Implementierungen (Prisma, Express, etc.)
- **Application Layer**: Use Cases orchestrieren Domain Logic

**Vorteile**:
- ✅ Einfacher Austausch von Infrastruktur (z.B. Prisma → MongoDB)
- ✅ Testbarkeit durch Mock-Adapter
- ✅ Klare Trennung von Business Logic und Infrastruktur
- ✅ Unabhängigkeit von Frameworks

## Setup commands

- Install deps: `pnpm install` (vom Root) oder `pnpm --filter @sharelocal/api install`
- Start dev server: `pnpm dev` (vom Package-Root) oder `pnpm api:dev` (vom Root)
- Build: `pnpm build`
- Start production: `pnpm start`
- Run tests: `pnpm test`
- Lint: `pnpm lint`

## Dev environment tips

- Server läuft standardmäßig auf `http://localhost:3001`
- Environment-Variablen in `.env` Datei (Root-Verzeichnis)
- Hot-Reload mit `tsx watch` - Änderungen werden automatisch neu geladen
- Health-Check Endpoint: `GET /health`
- API Endpoints: `GET /api/users/:id`, `GET /api/listings`, `POST /api/listings`

## ⚠️ WICHTIG: Port-Konfiguration

**Feste Port-Zuweisung (NIEMALS ändern ohne Dokumentation zu aktualisieren):**
- **Development**: Port **3001**
- **Production**: Port **3101**

**Diese Ports sind fest zugewiesen:**
- ✅ API Dev: Port 3001 (konsistent mit NGINX-Konfiguration)
- ✅ API Prod: Port 3101 (konsistent mit NGINX-Konfiguration)
- ✅ NGINX-Konfiguration auf dem Server (Server ist die Quelle der Wahrheit)
- ✅ CI-Workflows: `.github/workflows/ci-api.yml`

**Bei Port-Änderungen müssen folgende Dateien/Systeme aktualisiert werden:**
1. `.github/workflows/ci-api.yml` (deploy-dev und deploy-prd)
2. **NGINX-Konfiguration auf dem Server** (Server ist die Quelle der Wahrheit)
3. Diese Dokumentation (`packages/api/AGENTS.md`)

## Code style

- TypeScript strict mode (siehe `tsconfig.json`)
- ES Modules (`"type": "module"`)
- Single quotes, semicolons
- Functional patterns bevorzugt
- Domain Entities enthalten Business Logic
- Use Cases orchestrieren Domain Logic
- **Type Safety**: Vermeide `any` Types wo möglich - verwende konkrete Types (Zod-inferred types, Prisma types, etc.)
- **ESLint**: Keine `eslint-disable` Kommentare - wenn eine Regel zu strikt ist, entferne sie aus der ESLint-Konfiguration statt sie zu deaktivieren

## Package structure (Ports & Adapters)

```
src/
├── index.ts                    # Entry point, Dependency Injection
├── domain/                     # Domain Layer (Pure Business Logic)
│   └── entities/              # Domain Entities (User, Listing, etc.)
├── application/                # Application Layer
│   └── use-cases/             # Use Cases (GetUser, CreateListing, etc.)
├── ports/                      # Ports (Interfaces)
│   ├── repositories/          # Repository Interfaces
│   └── services/             # Service Interfaces (Auth, etc.)
└── adapters/                  # Adapters (Implementations)
    ├── database/              # Database Adapters (PrismaUserRepository, etc.)
    └── http/                  # HTTP Adapters (Express Routes, App Setup)
```

## Dependency Injection

Alle Dependencies werden in `src/index.ts` injiziert:

```typescript
// Infrastructure Setup
const prisma = new PrismaClient();

// Adapters
const userRepository = new PrismaUserRepository(prisma);
const listingRepository = new PrismaListingRepository(prisma);

// Dependency Injection
const dependencies: AppDependencies = {
  userRepository,
  listingRepository,
};

const app = createApp(dependencies);
```

## Testing instructions

- Test-Framework: Vitest
- Integration Tests: Supertest für HTTP-Endpoint-Tests
- Unit Tests: Vitest mit Mock-Repositories für Use Cases
- Coverage-Ziel: 70%+ für kritische Komponenten
- **KRITISCH: Alle Tests MÜSSEN erfolgreich sein vor jedem Commit**
- **Tests müssen grün sein**: Keine fehlgeschlagenen Tests werden akzeptiert
- Tests laufen sequenziell (nicht parallel) für bessere Database-Isolation
- Test-Database wird vor/nach jedem Test bereinigt
- **Wichtig**: Use Cases können mit Mock-Repositories getestet werden

### Test-Commands

```bash
# Alle Tests ausführen
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

### Test-Setup

- Test-Database: Verwendet `TEST_DATABASE_URL` oder `DATABASE_URL` aus `.env`
- Environment Variables werden automatisch aus `.env.test` oder `.env` geladen
- Jeder Test sollte eindeutige Test-Daten verwenden (z.B. `email: \`test-${Date.now()}@example.com\``)
- Database wird in `beforeEach` und `afterEach` bereinigt für Isolation

### ⚠️ WICHTIG: Tests müssen erfolgreich sein

**Vor jedem Commit MÜSSEN alle Tests erfolgreich laufen:**
```bash
pnpm test
```

- ✅ Alle Tests müssen grün sein (0 failed)
- ❌ Keine fehlgeschlagenen Tests werden akzeptiert
- 🔄 Bei fehlgeschlagenen Tests: Problem beheben, Tests erneut ausführen

## Dependencies

- Express.js für HTTP-Server
- CORS für Cross-Origin Requests
- **dotenv** für Environment-Variablen (⚠️ WICHTIG: Muss in `package.json` dependencies sein, nicht nur transitive)
- **@prisma/client** für Database (via Adapter) - wird von `@sharelocal/database` Package bereitgestellt
- Zod für Validation
- bcryptjs für Password Hashing
- jsonwebtoken für JWT-Authentication
- winston für Logging

### ⚠️ WICHTIG: Docker Builds in pnpm Workspace

**Kritische Regeln für Docker-Builds:**

1. **Production-Installation**: Verwende `pnpm install --frozen-lockfile --prod` im Production-Stage
   - Installiert alle Production-Dependencies korrekt (inkl. `dotenv`)
   - Kopiere `node_modules` nicht direkt - führe eine saubere Installation durch

2. **Prisma Client Generation**: 
   - `prisma` CLI ist in `packages/database/package.json` als devDependency
   - Installiere temporär: `pnpm --filter @sharelocal/database add -D prisma@^5.19.0`
   - Generiere Client: `pnpm --filter @sharelocal/database db:generate`
   - Entferne wieder: `pnpm --filter @sharelocal/database remove prisma`
   - **KEINE** DATABASE_URL benötigt für `prisma generate`

3. **Workspace-Struktur beibehalten**:
   - Kopiere alle Package-`package.json` Dateien
   - Kopiere Root `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
   - Führe `pnpm install --prod` aus, um korrekte `node_modules`-Struktur zu erhalten

## Wichtige Architektur-Regeln

1. **Domain Layer** darf keine Infrastruktur-Abhängigkeiten haben
2. **Ports** definieren Interfaces, keine Implementierungen
3. **Adapters** implementieren Ports und sind austauschbar
4. **Use Cases** orchestrieren Domain Logic über Ports
5. **Dependency Injection** in `index.ts` - alle Adapters werden dort zusammengeführt

## Adapter austauschen

Um z.B. Prisma durch MongoDB zu ersetzen:

1. Neuen Adapter erstellen: `adapters/database/MongoUserRepository.ts`
2. Implementiert `UserRepository` Port
3. In `index.ts` austauschen:
   ```typescript
   const userRepository = new MongoUserRepository(mongoClient);
   ```

**Keine Änderungen** in Domain Layer oder Use Cases nötig!

## Important notes

- Alle API-Endpoints sollten validiert werden (Zod)
- Rate Limiting implementieren (später)
- CSRF-Schutz für State-changing Requests
- Input Validation ist Pflicht
- Error Handling sollte konsistent sein
- Domain Logic gehört in Entities, nicht in Controllers

## ⚠️ WICHTIG: Build UND Dev-Start müssen erfolgreich sein

**Vor dem Abschließen von Änderungen MÜSSEN beide Checks erfolgreich sein:**

### 1. Build Check
```bash
pnpm build
```
- TypeScript-Kompilierung muss ohne Fehler durchlaufen
- Alle Type-Checks müssen bestehen

### 2. Dev-Start Check
```bash
pnpm dev
# Oder: pnpm tsx src/index.ts
```
- Server muss ohne Runtime-Fehler starten können
- Keine unhandled exceptions
- Alle Imports müssen aufgelöst werden können

**Wichtig**: Build und Dev-Start können unterschiedliche Fehler zeigen:
- Build (`tsc`) prüft nur Type-Checks
- Dev-Start (`tsx`) führt Code aus und zeigt Runtime-Fehler
- **Beide müssen erfolgreich sein**, bevor Änderungen als abgeschlossen gelten

Bei Fehlern:
- Build-Fehler: `pnpm tsc --noEmit` für detaillierte TypeScript-Fehlermeldungen
- Runtime-Fehler: `pnpm tsx src/index.ts` für detaillierte Laufzeit-Fehlermeldungen
