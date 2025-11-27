# ShareLocal

Digitale Vermittlungsplattform für Ressourcen-Sharing in lokalen Gemeinschaften (Werkzeuge, Zeit, Pflanzen, Fähigkeiten, Produkte).

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

## 🎯 Projekt-Überblick

ShareLocal ist eine reine Vermittlungsplattform für lokale Gemeinschaften, die es Nutzern ermöglicht, Ressourcen zu teilen und auszutauschen.

**Kernprinzipien:**
- ✅ Reine Vermittlungsplattform (keine Haftung für Transaktionen)
- ✅ Open Source (AGPL-3.0)
- ✅ EU-Provider nur (GDPR-Compliance)
- ✅ Gemeinnützig (nicht primär profit-orientiert)
- ✅ Lokaler Fokus

**Was die Plattform tut:**
- ✅ Ressourcen-Katalog (Listings erstellen/suchen)
- ✅ User-Authentication & Profile
- ✅ Chat-System (Koordination zwischen Nutzern)
- ✅ Content-Moderation (nur explizite/illegale Inhalte)

**Was die Plattform NICHT tut:**
- ❌ Keine Zahlungsabwicklung (Nutzer koordinieren extern: SEPA, Bargeld)
- ❌ Keine Qualitätskontrolle/Transaktions-Moderation
- ❌ Keine Haftung für Nutzer-Transaktionen
- ❌ Keine Schlichtung bei Streitigkeiten

## 🏗️ Monorepo-Struktur

```
sharelocal/
├── packages/
│   ├── api/              # Backend API (Node.js + Express + TypeScript)
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

## 🚀 Quick Start

### Voraussetzungen

- **Node.js** 24.x LTS
- **pnpm** 9.0.0+
- **PostgreSQL** 17.x (für Database)
- **Flutter** 3.27.x (optional, für Mobile)

### Installation

```bash
# Repository klonen
git clone <repository-url>
cd ShareLocal

# Dependencies installieren
pnpm install

# Environment-Variablen einrichten
cp .env.example .env
# Bearbeite .env und setze DATABASE_URL

# Database Setup
cd packages/database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Alle Packages bauen
cd ../..
pnpm build
```

### Entwicklung

```bash
# Alle Apps starten (mit Turborepo)
pnpm dev

# Oder einzelne Apps starten:
pnpm api:dev      # Backend API auf http://localhost:3001
pnpm web:dev      # Frontend auf http://localhost:3000
```

### Mobile App

```bash
cd packages/mobile
flutter pub get
flutter run
```

## 📦 Packages

### [@sharelocal/api](packages/api/README.md)
Backend API mit Express.js, TypeScript und Ports & Adapters Architektur
- **Port**: 3001
- **Architektur**: Hexagonal Architecture (Ports & Adapters)
- **Features**: REST API, JWT Authentication, Zod Validation
- **Status**: ✅ MVP Features implementiert

### [@sharelocal/web](packages/web/README.md)
Next.js 16 Frontend mit App Router
- **Port**: 3000
- **Framework**: Next.js 16.x + React 19
- **Status**: 🚧 In Entwicklung

### [@sharelocal/mobile](packages/mobile/README.md)
Flutter Mobile App
- **Framework**: Flutter 3.27.x
- **Status**: 🚧 In Entwicklung

### [@sharelocal/shared](packages/shared/README.md)
Shared TypeScript Types und Utilities
- **Verwendung**: Wird von API und Web importiert
- **Status**: ✅ Basis-Types implementiert

### [@sharelocal/database](packages/database/README.md)
Prisma Database Schema
- **Database**: PostgreSQL 17.x mit PostGIS
- **Status**: ✅ Schema implementiert, Migrationen erstellt

## 🛠️ Technologie-Stack

**Backend:** Node.js 24.x + Express + TypeScript + Prisma + PostgreSQL 17.x  
**Frontend:** Next.js 16.x + React 19 + TypeScript + Tailwind  
**Mobile:** Flutter 3.27.x + Dart 3.7+  
**Hosting:** Hetzner Cloud (EU)  
**Chat:** Socket.io (MVP)  
**Maps:** OpenStreetMap + Leaflet  
**Storage:** Scaleway Object Storage (S3-kompatibel)  
**Lizenz:** AGPL-3.0

## 📝 Scripts

### Root-Level

- `pnpm dev` - Startet alle Apps im Development-Modus
- `pnpm build` - Baut alle Packages
- `pnpm test` - Führt Tests aus
- `pnpm lint` - Führt Linting aus
- `pnpm clean` - Bereinigt alle Build-Artefakte

### Package-spezifisch

- `pnpm api:dev` - Startet Backend API
- `pnpm web:dev` - Startet Frontend
- `pnpm db:generate` - Generiert Prisma Client
- `pnpm db:migrate` - Führt Database Migrationen aus
- `pnpm db:seed` - Seed-Daten einfügen

## 🏛️ Architektur

### Backend: Ports & Adapters (Hexagonal Architecture)

Das Backend verwendet **Ports & Adapters Architektur** für maximale Flexibilität:

- **Domain Layer**: Pure Business Logic, keine Infrastruktur-Abhängigkeiten
- **Ports**: Interfaces für externe Services (Repositories, Services)
- **Adapters**: Konkrete Implementierungen (Prisma, Express, etc.)
- **Application Layer**: Use Cases orchestrieren Domain Logic

**Vorteile:**
- ✅ Einfacher Austausch von Infrastruktur (z.B. Prisma → MongoDB)
- ✅ Testbarkeit durch Mock-Adapter
- ✅ Klare Trennung von Business Logic und Infrastruktur

Siehe [packages/api/README.md](packages/api/README.md) für Details.

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registrieren
- `POST /api/auth/login` - User einloggen

### Users
- `GET /api/users` - Liste aller User
- `GET /api/users/:id` - User abrufen
- `PUT /api/users/:id` - User aktualisieren (Protected: nur eigener Account)

### Listings
- `GET /api/listings` - Liste aller Listings (mit Filtern)
- `GET /api/listings/:id` - Listing abrufen
- `POST /api/listings` - Listing erstellen (Protected)
- `PUT /api/listings/:id` - Listing aktualisieren (Protected: nur Owner)
- `DELETE /api/listings/:id` - Listing löschen (Protected: nur Owner)

**API-Dokumentation**: Siehe `packages/api/http/` für `.http` Test-Dateien

## 📚 Dokumentation

- [Projekt-Dokumentation](01-circular-economy-marketplace.md)
- [Technische Analyse](02-technical-analysis.md)
- [Agent Context](AGENTS.md) - Anweisungen für AI Coding Agents
- [API README](packages/api/README.md)
- [Web README](packages/web/README.md)
- [Mobile README](packages/mobile/README.md)

## 🧪 Testing

```bash
# Alle Tests ausführen
pnpm test

# Package-spezifische Tests
pnpm --filter @sharelocal/api test
pnpm --filter @sharelocal/web test
```

**Test-Dateien:**
- API: `packages/api/http/*.http` - HTTP Request Tests
- Unit Tests: Vitest (Backend/Web), Flutter Test (Mobile)
- Integration Tests: Supertest (Backend), Playwright (E2E)

## 🔒 Sicherheit & GDPR

- ✅ HTTPS überall (Let's Encrypt)
- ✅ Rate Limiting, CSRF-Schutz
- ✅ Input Validation (Zod)
- ✅ Privacy-by-Design
- ✅ Datenminimierung
- ✅ Automatische Löschung nach X Jahren
- ✅ EU-Provider nur (GDPR-Compliance)

## 📄 Lizenz

AGPL-3.0 - Siehe [LICENSE](LICENSE) Datei

## 🤝 Contributing

Beiträge sind willkommen! Bitte lesen Sie die Contributing Guidelines (coming soon).

**Wichtig:**
- Build muss erfolgreich sein: `pnpm build`
- Dev-Start muss erfolgreich sein: `pnpm dev`
- Tests müssen grün sein: `pnpm test`
- Code-Reviews erforderlich

## 🗺️ Roadmap

### Phase 1: MVP (aktuell) ✅
- ✅ Database Schema
- ✅ Backend API mit Authentication
- ✅ CRUD für Users und Listings
- 🚧 Frontend (in Entwicklung)
- 🚧 Mobile App (in Entwicklung)

### Phase 2: Erweiterte Features
- Chat-System
- Standort-basierte Suche (PostGIS)
- Bild-Upload
- E-Mail-Verifizierung

### Phase 3: Optional
- Zahlungssystem
- KI-Features

---

**Status:** 🚧 In Entwicklung - MVP Phase

**Letzte Aktualisierung:** 2025-01-25
