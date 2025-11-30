# ShareLocal - Agent Context

## Projekt-Überblick

**Ziel**: Digitale Vermittlungsplattform für Ressourcen-Sharing in lokalen Gemeinschaften (Werkzeuge, Zeit, Pflanzen, Fähigkeiten, Produkte).

**Kernprinzipien**:
- ✅ Reine Vermittlungsplattform (keine Haftung für Transaktionen)
- ✅ Open Source (AGPL-3.0 oder GPL-3.0)
- ✅ EU-Provider nur (GDPR-Compliance)
- ✅ Gemeinnützig (nicht primär profit-orientiert)
- ✅ Lokaler Fokus (Start: 15.000-Einwohner-Stadt)

**Was die Plattform NICHT tut**:
- ❌ Keine Zahlungsabwicklung (Nutzer koordinieren extern: SEPA, Bargeld)
- ❌ Keine Qualitätskontrolle/Transaktions-Moderation
- ❌ Keine Haftung für Nutzer-Transaktionen
- ❌ Keine Schlichtung bei Streitigkeiten

**Was die Plattform tut**:
- ✅ Ressourcen-Katalog (Listings erstellen/suchen)
- ✅ User-Authentication & Profile
- ✅ Chat-System (Koordination zwischen Nutzern)
- ✅ Content-Moderation (nur explizite/illegale Inhalte)

---

## Monorepo-Struktur

```
sharelocal/
├── packages/
│   ├── api/              # Backend API (Node.js + Express)
│   ├── web/              # Next.js Frontend
│   ├── mobile/           # Flutter App
│   ├── shared/           # Shared TypeScript Types/Utils
│   └── database/         # Prisma Schema
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
└── docs/                 # Dokumentation
```

**Monorepo-Tools**: Turborepo + pnpm workspaces

Jedes Package hat seine eigene `AGENTS.md` mit package-spezifischen Anweisungen.

### ⚠️ WICHTIG: pnpm Workspace-Struktur verstehen

**Kritische Regeln für pnpm Workspaces:**

1. **Jedes Package hat eigene Dependencies**: Dependencies werden in der `package.json` des jeweiligen Packages definiert
   - `packages/api/package.json` → Dependencies für API
   - `packages/database/package.json` → Dependencies für Database (inkl. `prisma` CLI als devDependency)
   - `packages/shared/package.json` → Dependencies für Shared

2. **Package-spezifische Befehle**: Verwende `pnpm --filter <package-name>` für Package-spezifische Operationen
   ```bash
   # Richtig: Prisma im database Package installieren
   pnpm --filter @sharelocal/database add -D prisma@^5.19.0
   
   # Falsch: Im Root installieren (verursacht workspace-root-check Fehler)
   pnpm add -D -w prisma@^5.19.0
   ```

3. **Docker Builds in Workspaces**:
   - **NIEMALS** Dependencies im Root installieren (`-w` Flag vermeiden)
   - **IMMER** `pnpm --filter <package-name>` verwenden für Package-spezifische Operationen
   - Production-Installation: `pnpm install --frozen-lockfile --prod` installiert alle Production-Dependencies korrekt
   - Prisma Client Generation: `prisma` CLI ist in `packages/database/package.json` als devDependency
   - `prisma generate` benötigt **KEINE** DATABASE_URL (nur Schema)

4. **Wo sind welche Tools?**
   - `prisma` CLI: `packages/database/package.json` (devDependency)
   - `@prisma/client`: `packages/database/package.json` (dependency) + `packages/api/package.json` (dependency)
   - `dotenv`: `packages/api/package.json` (dependency)
   - TypeScript: In jedem Package als devDependency

5. **Docker Production Build Pattern**:
   ```dockerfile
   # 1. Package-Dateien kopieren
   COPY packages/*/package.json ./packages/*/
   
   # 2. Production-Dependencies installieren
   RUN pnpm install --frozen-lockfile --prod
   
   # 3. Tools temporär installieren (falls nötig)
   RUN pnpm --filter @sharelocal/database add -D prisma@^5.19.0 && \
       pnpm --filter @sharelocal/database db:generate && \
       pnpm --filter @sharelocal/database remove prisma
   ```

---

## Setup commands (Root)

- Install all deps: `pnpm install`
- Start all apps: `pnpm dev`
- Build all packages: `pnpm build`
- Run all tests: `pnpm test`
- Lint all packages: `pnpm lint`
- Clean all: `pnpm clean`

### Package-spezifische Commands

- API: `pnpm api:dev` (läuft auf :3001)
- Web: `pnpm web:dev` (läuft auf :3000)
- Mobile: `cd packages/mobile && flutter run`

---

## Wichtige Constraints & Regeln

### EU-Provider-Pflicht
- ✅ Alle Services müssen in EU gehostet werden
- ✅ Keine US-Provider (AWS, Google Cloud, Azure) - nur wenn absolut nötig und nur EU-Regionen
- ✅ GDPR-Compliance durch EU-Hosting

### Open Source
- ✅ Lizenz: AGPL-3.0 oder GPL-3.0 (starke Copyleft)
- ✅ Code-Qualität: Hohe Standards, Code-Reviews erforderlich
- ✅ Dokumentation: Deutsch + Englisch
- ✅ Contributing Guidelines + Code of Conduct

### Rechtliches
- ✅ Haftungsausschluss klar in AGB formulieren
- ✅ DSA-Compliance (Content-Moderation nur für explizite/illegale Inhalte)
- ✅ Keine Transaktions-Moderation
- ✅ Nutzer handeln auf eigene Verantwortung

### Sicherheit & GDPR
- ✅ HTTPS überall (Let's Encrypt)
- ✅ Rate Limiting, CSRF-Schutz
- ✅ Input Validation (Zod)
- ✅ Privacy-by-Design
- ✅ Datenminimierung
- ✅ Automatische Löschung nach X Jahren

---

## Technologie-Stack (Übersicht)

### Backend
- **Runtime**: Node.js 24.x LTS (Krypton)
- **Framework**: Express.js
- **Sprache**: TypeScript 5.6+
- **Datenbank**: PostgreSQL 17.x (mit PostGIS)
- **ORM**: Prisma
- **Validation**: Zod
- **Auth**: JWT + Passport.js
- **Chat**: Socket.io (MVP), später Matrix

### Frontend
- **Framework**: Next.js 16.x (App Router)
- **React**: 19.x
- **Sprache**: TypeScript 5.6+
- **Styling**: Tailwind CSS + shadcn/ui
- **Maps**: Leaflet (OpenStreetMap)

### Mobile
- **Framework**: Flutter 3.27.x
- **Sprache**: Dart 3.7+
- **State**: Riverpod oder Bloc
- **Maps**: flutter_map (OpenStreetMap)

### Infrastructure
- **Hosting**: Hetzner Cloud (EU)
- **Container**: Docker 27.x + Docker Compose v2
- **CI/CD**: GitHub Actions oder GitLab CI
- **CDN**: Cloudflare (EU-Regionen)
- **Storage**: Scaleway Object Storage (S3-kompatibel)
- **E-Mail**: Mailgun EU

---

## Code-Standards (Global)

### Testing
- Unit Tests: Jest/Vitest (Backend/Web), Flutter Test (Mobile)
- Integration Tests: Supertest (Backend), Playwright (E2E)
- Coverage-Ziel: 70%+ für kritische Komponenten
- Tests müssen vor jedem Commit grün sein

### Code-Qualität
- TypeScript strict mode (wo zutreffend)
- ESLint + Prettier
- Pre-commit Hooks
- Code-Reviews erforderlich
- **Ports & Adapters Architektur** für Backend (siehe `packages/api/AGENTS.md`)
- **Type Safety**: Vermeide `any` Types wo möglich - verwende konkrete Types (Zod-inferred types, Prisma types, React types, etc.)
- **ESLint**: Keine `eslint-disable` Kommentare - wenn eine Regel zu strikt ist, entferne sie aus der ESLint-Konfiguration statt sie zu deaktivieren

### Performance
- Backend: Caching (Redis), Database Indexing, Pagination
- Frontend: Code Splitting, Image Optimization, Lazy Loading
- Mobile: Offline-First, Image Caching

---

## Entwicklungsprioritäten

### Phase 1: MVP (4-6 Monate)
1. Ressourcen-Katalog (2-3 Monate)
2. User-Authentication (1 Monat)
3. Chat-System (1-2 Monate)
4. Mobile Apps (2-3 Monate)
5. Testing & Deployment (1 Monat)

### Phase 2: Erweiterte Features (4-6 Monate)
- Werkzeug-Sharing mit Kalender
- Pflanzen-Sharing
- Skills-Sharing (erweitert)
- Reparatur-Service-Integration
- Nachhaltigkeits-Tracking

### Phase 3: Optional (später)
- Zahlungssystem (2-3 Monate)
- KI-Features (2-3 Monate)

---

## Wichtige Entscheidungen

### ✅ Getroffen
- Next.js (nicht HTMX)
- Flutter (nicht React Native)
- PostgreSQL (nicht MongoDB)
- Socket.io für MVP (später Matrix möglich)
- OpenStreetMap (nicht Google Maps)
- EU-Provider nur
- **Ports & Adapters (Hexagonal Architecture)** für Backend API
  - Ermöglicht einfachen Austausch von Infrastruktur
  - Bessere Testbarkeit durch Mock-Adapter
  - Klare Trennung von Business Logic und Infrastruktur

### ⚠️ Offen / Später
- Zahlungssystem: Mollie oder Adyen EU
- KI-Features: Self-hosted ML oder Hugging Face EU
- Kubernetes: Später bei Skalierung

---

## Package-spezifische Anweisungen

Jedes Package hat seine eigene `AGENTS.md` Datei mit detaillierten Anweisungen:

- `packages/api/AGENTS.md` - Backend API Setup & Commands
- `packages/web/AGENTS.md` - Next.js Frontend Setup & Commands
- `packages/mobile/AGENTS.md` - Flutter App Setup & Commands
- `packages/shared/AGENTS.md` - Shared Types Setup & Commands
- `packages/database/AGENTS.md` - Prisma Schema Setup & Commands

**Wichtig**: Agents lesen die nächste `AGENTS.md` im Directory-Tree. Package-spezifische Anweisungen überschreiben globale Anweisungen.

---

## Wichtige Links & Referenzen

- Projekt-Dokumentation: `01-circular-economy-marketplace.md`
- Technische Analyse: `02-technical-analysis.md`
- Lizenz: AGPL-3.0 oder GPL-3.0
- Repository: GitHub/GitLab/Codeberg (EU-basiert bevorzugt)
- AGENTS.md Standard: https://agents.md/

---

## Docker Builds in pnpm Workspace Monorepo

### ⚠️ KRITISCH: Häufige Fehler vermeiden

**1. Dependencies im falschen Package installieren:**
```dockerfile
# ❌ FALSCH: Im Root installieren
RUN pnpm add -D -w prisma@^5.19.0

# ✅ RICHTIG: Im entsprechenden Package installieren
RUN pnpm --filter @sharelocal/database add -D prisma@^5.19.0
```

**2. Dummy DATABASE_URL für prisma generate:**
```dockerfile
# ❌ FALSCH: DATABASE_URL ist nicht nötig
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm --filter @sharelocal/database db:generate

# ✅ RICHTIG: Keine DATABASE_URL benötigt
RUN pnpm --filter @sharelocal/database db:generate
```

**3. node_modules kopieren statt saubere Installation:**
```dockerfile
# ❌ FALSCH: node_modules kopieren kann zu fehlenden Dependencies führen
COPY --from=builder /app/node_modules ./node_modules

# ✅ RICHTIG: Saubere Production-Installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile --prod
```

**4. Workspace-Struktur nicht beibehalten:**
- Kopiere **ALLE** Package-`package.json` Dateien
- Kopiere Root `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- Führe `pnpm install` aus, um korrekte Workspace-Struktur zu erhalten

### Docker Build Pattern (Production Stage)

```dockerfile
# 1. Package-Dateien kopieren (für saubere Installation)
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/packages/*/package.json ./packages/*/

# 2. Production-Dependencies installieren
RUN pnpm install --frozen-lockfile --prod

# 3. Tools temporär installieren (falls nötig, z.B. Prisma CLI)
RUN pnpm --filter @sharelocal/database add -D prisma@^5.19.0 && \
    pnpm --filter @sharelocal/database db:generate && \
    pnpm --filter @sharelocal/database remove prisma

# 4. Build-Artefakte kopieren
COPY --from=builder /app/packages/api/dist ./dist
```

### Wo sind welche Dependencies?

| Dependency | Package | Typ | Verwendung |
|------------|---------|-----|------------|
| `prisma` CLI | `packages/database` | devDependency | Prisma Client Generation |
| `@prisma/client` | `packages/database` + `packages/api` | dependency | Runtime Database Client |
| `dotenv` | `packages/api` | dependency | Environment Variables |
| `express` | `packages/api` | dependency | HTTP Server |
| TypeScript | Alle Packages | devDependency | Type Checking & Compilation |

---

## Port-Konfiguration (KRITISCH - NIEMALS ändern ohne Dokumentation)

**Feste Port-Zuweisung für Services:**

| Service | Environment | Port | NGINX Location |
|---------|-------------|------|----------------|
| API | Development | **3001** | `/share-local/dev/api` |
| API | Production | **3101** | `/share-local/prd/api` |
| Web | Development | TBD (später) | `/share-local/dev` |
| Web | Production | TBD (später) | `/share-local/prd` |

**⚠️ WICHTIG:**
- Diese Ports sind **fest zugewiesen** und dürfen **NICHT** geändert werden ohne:
  1. CI-Workflows zu aktualisieren (`.github/workflows/ci-*.yml`)
  2. NGINX-Konfigurationen zu aktualisieren (`infrastructure/nginx/*.conf`)
  3. Diese Dokumentation zu aktualisieren
  4. Alle betroffenen Dokumentationen zu aktualisieren

**Bei Port-Änderungen müssen folgende Dateien aktualisiert werden:**
- `.github/workflows/ci-api.yml` (deploy-dev: PORT=3001, deploy-prd: PORT=3101)
- `.github/workflows/ci-web.yml` (wenn Web deployed wird)
- `infrastructure/nginx/share-local-dev.conf` (API: 3001)
- `infrastructure/nginx/share-local-prd.conf` (API: 3101)
- `packages/api/AGENTS.md` (Port-Dokumentation)
- Diese Datei (`AGENTS.md`)

---

## Quick Reference

**Backend**: Node.js 24.x + Express + TypeScript + Prisma + PostgreSQL 17.x  
**Frontend**: Next.js 16.x + React 19 + TypeScript + Tailwind  
**Mobile**: Flutter 3.27.x + Dart 3.7+  
**Hosting**: Hetzner Cloud (EU)  
**Chat**: Socket.io (MVP)  
**Maps**: OpenStreetMap + Leaflet  
**Storage**: Scaleway Object Storage (S3-kompatibel)  
**Lizenz**: AGPL-3.0  
**Ports**: API Dev=3001, API Prod=3101 (siehe Port-Konfiguration oben)
