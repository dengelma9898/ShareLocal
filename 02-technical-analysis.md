# Technische Analyse - Circular Economy Marketplace

## Architektur-Übersicht

### Empfohlene Architektur: Monorepo mit Microservices-ready Struktur

### LTS-Versionen & Support-Zeiträume

**Backend**:
- **Node.js**: 24.x (Krypton)
  - Active LTS: Oktober 2025 - Oktober 2026
  - Maintenance LTS: Oktober 2026 - April 2028
  - Features: Native TypeScript Execution, Performance-Verbesserungen

**Frontend**:
- **Next.js**: 16.x
  - Active LTS: Seit Oktober 2025
  - Maintenance LTS: 2 Jahre nach nächstem Major Release
  - Features: Turbopack als Standard-Bundler, React 19 Support, Cache Components

**Weitere Technologien**:
- **TypeScript**: 5.6+ (neueste stabile Version)
- **React**: 19.x (unterstützt von Next.js 16)
- **Flutter**: 3.27.x (neueste stabile Version)
- **PostgreSQL**: 17.x (neueste Major Version)
- **Docker**: 27.x (neueste stabile Version)

**Struktur**:
```
sharelocal/
├── backend/          # API-Server
├── frontend/         # Web-App
├── mobile/           # Mobile Apps (iOS + Android)
├── shared/           # Geteilte Types/Utilities
└── infrastructure/   # Docker, CI/CD, Deployment
```

---

## 1. Backend-Technologie

### Empfehlung: Node.js mit TypeScript + Express/Fastify

**Warum**:
- ✅ Große Community, viele Open-Source-Pakete
- ✅ TypeScript für Typsicherheit
- ✅ Gute Performance für I/O-lastige APIs
- ✅ Einfache Integration mit Chat-Systemen (WebSockets)
- ✅ Team-Erfahrung (2 Backend-Entwickler)

**Alternative**: Python mit FastAPI
- Schnellere Entwicklung für MVP
- Gute ML-Integration (später für KI-Features)
- Starke Community

**Stack-Empfehlung**:
```typescript
// Backend Stack
- Runtime: Node.js 24.x LTS (Krypton) - Active LTS seit Oktober 2025
- Framework: Express.js oder Fastify
- Sprache: TypeScript 5.6+
- ORM: Prisma (PostgreSQL) oder TypeORM
- Validation: Zod oder class-validator
- Authentication: JWT + Passport.js
- File Upload: Multer + S3-kompatibler Storage
- Real-time: Socket.io oder WebSockets
```

**API-Architektur**:
- RESTful API für CRUD-Operationen
- GraphQL optional später (wenn komplexe Queries nötig)
- WebSocket für Chat in Echtzeit

---

## 2. Frontend-Technologie

### Empfehlung: Next.js 16.x (React) mit TypeScript

**Warum**:
- ✅ Server-Side Rendering (SEO)
- ✅ API Routes für Backend-Integration
- ✅ Optimiertes Image-Handling
- ✅ Gute Performance
- ✅ Einfaches Deployment
- ✅ Active LTS seit Oktober 2025

**Alternative**: Remix oder SvelteKit
- Remix: Fokus auf UX
- SvelteKit: Leichtgewichtiger

**Stack-Empfehlung**:
```typescript
// Frontend Stack
- Framework: Next.js 16.x (App Router) - Active LTS seit Oktober 2025
- React: 19.x (unterstützt von Next.js 16)
- Sprache: TypeScript 5.6+
- UI-Framework: Tailwind CSS + shadcn/ui
- State Management: Zustand oder React Query
- Forms: React Hook Form + Zod
- Maps: Leaflet (OpenStreetMap) oder Mapbox GL
- i18n: next-intl (für Mehrsprachigkeit)
```

**Design-System**:
- shadcn/ui (Open Source, Tailwind-basiert)
- Oder: MUI (Material-UI) für schnelleres MVP

---

## 3. Mobile Apps

### Empfehlung: Flutter (Cross-Platform)

**Warum**:
- ✅ Ein Codebase für iOS + Android
- ✅ Gute Performance (native-like)
- ✅ Große Community
- ✅ Einfache EU-Provider-Integration
- ✅ Open Source

**Alternative**: React Native
- Code-Sharing mit Web-Frontend
- Große Community
- Performance kann bei komplexen Features nachlassen

**Native Apps** (wenn Budget/Team vorhanden):
- iOS: Swift + SwiftUI
- Android: Kotlin + Jetpack Compose
- Höhere Kosten, bessere Performance

**Flutter Stack-Empfehlung**:
```dart
// Mobile Stack
- Framework: Flutter 3.27.x (neueste stabile Version)
- Sprache: Dart 3.7+
- State Management: Riverpod oder Bloc
- HTTP: Dio oder http
- Local Storage: Hive oder SQLite
- Maps: flutter_map (OpenStreetMap)
- Push Notifications: Firebase Cloud Messaging (EU-Region) oder self-hosted
```

---

## 4. Datenbank

### Empfehlung: PostgreSQL (auf EU-Servern)

**Warum**:
- ✅ Relationale Struktur für komplexe Beziehungen
- ✅ JSON-Support für flexible Metadaten
- ✅ PostGIS für Geodaten/Radius-Suche
- ✅ Open Source
- ✅ Gute Performance bei Skalierung

**Datenbank-Struktur**:
```sql
-- Haupt-Tabellen
- users (Profile, Auth)
- resources (Listings: Produkte, Werkzeuge, Pflanzen, Skills)
- messages (Chat-Nachrichten)
- reviews (Bewertungen)
- categories (Kategorisierung)
- locations (Geodaten mit PostGIS)
```

**Version**:
- PostgreSQL 17.x (neueste stabile Major Version)
- PostGIS Extension für Geodaten

**Hosting**:
- Hetzner Cloud (PostgreSQL Managed)
- OVHcloud Managed Databases
- Oder: Self-hosted auf Hetzner VPS

**Backup-Strategie**:
- Tägliche automatische Backups
- Point-in-Time Recovery (PITR)
- Backup-Archivierung (30 Tage)

---

## 5. Chat-System

### Empfehlung: Self-hosted Matrix oder Socket.io

**Option 1: Matrix (Synapse) - Empfohlen**
- ✅ Open Source, dezentral
- ✅ EU-hosted möglich
- ✅ E2E-Verschlüsselung
- ✅ Gute GDPR-Compliance
- ⚠️ Komplexer zu setup

**Option 2: Socket.io (einfacher für MVP)**
- ✅ Einfache Integration
- ✅ Real-time Messaging
- ✅ Self-hosted auf EU-Servern
- ⚠️ Weniger Features als Matrix

**Option 3: Rocket.Chat**
- ✅ Open Source
- ✅ Self-hosted möglich
- ✅ Feature-reich
- ⚠️ Komplexer als Socket.io

**Empfehlung für MVP**: Socket.io
- Schnell implementierbar
- Ausreichend für MVP
- Später Migration zu Matrix möglich

---

## 6. File Storage & CDN

### Empfehlung: S3-kompatibler Storage (EU)

**Provider**:
- Scaleway Object Storage (S3-kompatibel, EU)
- OVHcloud Object Storage
- Hetzner Storage Box (S3-kompatibel)

**CDN**:
- Cloudflare (EU-Regionen)
- Oder: Self-hosted Nginx mit Caching

**Struktur**:
```
storage/
├── users/          # Profilbilder
├── resources/     # Produktbilder
└── documents/     # PDFs, etc.
```

---

## 7. Maps & Geodaten

### Empfehlung: OpenStreetMap mit Leaflet/Mapbox GL

**Option 1: OpenStreetMap + Leaflet (Open Source)**
- ✅ Kostenlos, Open Source
- ✅ Self-hosted möglich
- ✅ Gute Performance
- ✅ Routing: OSRM (Open Source Routing Machine)

**Option 2: Mapbox EU**
- ✅ Bessere Performance
- ✅ Professionellere Karten
- ⚠️ Kostenpflichtig (aber günstig für MVP)

**Empfehlung**: OpenStreetMap + Leaflet für MVP
- Kostenlos
- Open Source (passt zur Philosophie)
- Später Migration zu Mapbox möglich

---

## 8. Authentication & Authorization

### Empfehlung: JWT + OAuth2 (optional)

**MVP-Stack**:
```typescript
// Authentication
- JWT für Session-Management
- Passport.js für Strategies
- bcrypt für Password-Hashing
- E-Mail-Verifizierung (nodemailer)
- Optional: OAuth2 (Google, Facebook) - später
```

**2FA** (später):
- TOTP (Time-based One-Time Password)
- Oder: SMS (EU-Provider)

---

## 9. E-Mail-Service

### Empfehlung: Self-hosted oder EU-Provider

**Optionen**:
- Mail-in-a-Box (Self-hosted auf Hetzner)
- Mailgun EU-Regionen
- SendGrid EU-Regionen
- Oder: Postfix auf eigenem Server

**Empfehlung für MVP**: Mailgun EU
- Einfache Integration
- Gute Deliverability
- Später Migration zu Self-hosted möglich

---

## 10. Monitoring & Analytics

### Empfehlung: Privacy-friendly Tools

**Monitoring**:
- Prometheus + Grafana (Self-hosted)
- Sentry (Error Tracking) - EU-Regionen

**Analytics**:
- Plausible Analytics (EU-hosted, GDPR-konform)
- Oder: Matomo (Self-hosted)

**Logging**:
- Loki + Grafana (Self-hosted)
- Oder: ELK Stack (Elasticsearch EU-Regionen)

---

## 11. CI/CD & DevOps

### Empfehlung: GitLab CI oder GitHub Actions

**Pipeline**:
```yaml
# CI/CD Flow
1. Code Push → GitHub/GitLab
2. Automated Tests (Unit, Integration)
3. Build (Docker Images)
4. Deploy to Staging
5. Manual Approval
6. Deploy to Production
```

**Containerisierung**:
- Docker 27.x (neueste stabile Version)
- Docker Compose v2 für lokale Entwicklung
- Kubernetes später (wenn Skalierung nötig)

**Deployment**:
- Hetzner Cloud mit Docker
- Oder: Kubernetes auf Hetzner (später)

---

## 12. Code-Organisation & Open Source

### Empfehlung: Monorepo mit Workspaces

**Struktur**:
```
sharelocal/
├── packages/
│   ├── api/              # Backend API
│   ├── web/              # Next.js Frontend
│   ├── mobile/           # Flutter App
│   ├── shared/           # Shared Types/Utils
│   └── database/         # Prisma Schema
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
└── docs/                 # Dokumentation
```

**Tools**:
- Turborepo oder Nx für Monorepo-Management
- pnpm oder npm workspaces
- Shared TypeScript-Types zwischen Frontend/Backend

**Open Source Setup**:
- Repository: GitHub oder Codeberg (EU-basiert)
- Lizenz: AGPL-3.0 (wie im Dokument empfohlen)
- Contributing Guidelines
- Code of Conduct
- Issue Templates
- Pull Request Templates

---

## 13. Sicherheit & GDPR

### Empfehlungen

**Security**:
- HTTPS überall (Let's Encrypt)
- Rate Limiting (express-rate-limit)
- CSRF-Schutz
- SQL Injection Prevention (ORM)
- XSS Prevention (React automatisch)
- Input Validation (Zod)

**GDPR-Compliance**:
- Datenminimierung (nur notwendige Daten)
- Löschkonzept (automatische Löschung nach X Jahren)
- Nutzerrechte (Auskunft, Löschung, Portabilität)
- Privacy-by-Design
- Datenschutzerklärung

---

## 14. Testing-Strategie

### Empfehlung: Multi-Layer Testing

**Backend**:
- Unit Tests: Jest oder Vitest
- Integration Tests: Supertest
- E2E Tests: Playwright

**Frontend**:
- Unit Tests: Vitest
- Component Tests: React Testing Library
- E2E Tests: Playwright

**Mobile**:
- Unit Tests: Flutter Test
- Widget Tests: Flutter Widget Tests
- E2E Tests: Flutter Integration Tests

**Coverage-Ziel**: 70%+ für kritische Komponenten

---

## 15. Performance-Optimierung

### Empfehlungen

**Backend**:
- Caching (Redis für Sessions/Cache)
- Database Indexing (PostgreSQL)
- API Response Compression (gzip)
- Pagination für große Listen

**Frontend**:
- Code Splitting (Next.js automatisch)
- Image Optimization (Next.js Image Component)
- Lazy Loading
- Service Worker (PWA)

**Mobile**:
- Offline-First (lokale Datenbank)
- Image Caching
- Lazy Loading

---

## Zusammenfassung der Technologie-Stack-Empfehlung

### Backend
- **Runtime**: Node.js 24.x LTS (Krypton) - Active LTS seit Oktober 2025, Support bis April 2028
- **Framework**: Express.js oder Fastify
- **Sprache**: TypeScript 5.6+
- **Datenbank**: PostgreSQL 17.x (Hetzner/OVHcloud)
- **ORM**: Prisma
- **Chat**: Socket.io (MVP), später Matrix
- **Validation**: Zod
- **Authentication**: JWT + Passport.js

### Frontend
- **Framework**: Next.js 16.x (App Router) - Active LTS seit Oktober 2025
- **React**: 19.x (unterstützt von Next.js 16)
- **Sprache**: TypeScript 5.6+
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand oder React Query
- **Maps**: Leaflet (OpenStreetMap)
- **Forms**: React Hook Form + Zod
- **i18n**: next-intl

### Mobile
- **Framework**: Flutter 3.27.x (neueste stabile Version)
- **Sprache**: Dart 3.7+
- **State Management**: Riverpod oder Bloc
- **HTTP**: Dio
- **Local Storage**: Hive oder SQLite
- **Maps**: flutter_map (OpenStreetMap)

### Infrastructure
- **Hosting**: Hetzner Cloud (EU)
- **Container**: Docker 27.x + Docker Compose v2
- **CI/CD**: GitHub Actions oder GitLab CI
- **CDN**: Cloudflare (EU-Regionen)
- **Monitoring**: Prometheus + Grafana
- **Analytics**: Plausible Analytics (EU-hosted)

### Services
- **Datenbank**: PostgreSQL 17.x (Managed oder Self-hosted auf Hetzner)
- **Storage**: S3-kompatibler Storage (Scaleway Object Storage)
- **E-Mail**: Mailgun EU
- **Chat**: Socket.io (MVP), später Matrix
- **Maps**: OpenStreetMap + Leaflet

---

## Architektur-Diagramm

```
┌─────────────────────────────────────────────────────────────┐
│                        Nutzer                                │
│              (Web Browser, iOS App, Android App)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    CDN (Cloudflare EU)                       │
│              (Statische Assets, Caching)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Frontend (Next.js) - Hetzner Cloud              │
│              ┌──────────────────────────────┐                │
│              │  Web App (React + TypeScript)│                │
│              └──────────────────────────────┘                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Node.js) - Hetzner Cloud           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ REST API     │  │ WebSocket    │  │ File Upload  │     │
│  │ (Express)    │  │ (Socket.io)  │  │ (Multer)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────┬──────────────────┬──────────────────┬───────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │ Redis Cache  │  │ Object       │
│ (Hetzner)    │  │ (Sessions)   │  │ Storage      │
│              │  │              │  │ (Scaleway)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Entscheidungsmatrix

### Backend-Framework

| Kriterium | Node.js + Express | Python + FastAPI |
|-----------|-------------------|------------------|
| Entwicklungsgeschwindigkeit | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Performance | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Community | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| TypeScript Support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| ML-Integration (später) | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Empfehlung** | ✅ **Empfohlen** | Alternative |

### Mobile Framework

| Kriterium | Flutter | React Native | Native |
|-----------|---------|--------------|--------|
| Code-Sharing | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ |
| Performance | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Entwicklungsgeschwindigkeit | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Kosten | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Empfehlung** | ✅ **Empfohlen** | Alternative | Nur bei Budget |

### Chat-System

| Kriterium | Socket.io | Matrix | Rocket.Chat |
|-----------|-----------|--------|-------------|
| Einfachheit | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Features | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| GDPR-Compliance | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| E2E-Verschlüsselung | ❌ | ✅ | ✅ |
| **Empfehlung** | ✅ **MVP** | Später | Alternative |

### Maps-Service

| Kriterium | OpenStreetMap | Mapbox EU |
|-----------|---------------|-----------|
| Kosten | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Open Source | ✅ | ❌ |
| Performance | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Features | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Empfehlung** | ✅ **MVP** | Später |

---

## Nächste Schritte

### Phase 1: Setup (Woche 1-2)

1. **Repository Setup**
   - Monorepo-Struktur erstellen
   - GitHub/Codeberg Repository
   - AGPL-3.0 Lizenz hinzufügen
   - Contributing Guidelines
   - Code of Conduct

2. **Development Environment**
   - Docker Compose für lokale Entwicklung
   - CI/CD Pipeline (GitHub Actions)
   - Code-Quality-Tools (ESLint, Prettier)
   - Testing-Framework Setup

### Phase 2: Backend-Skeleton (Woche 3-4)

1. **API-Server**
   - Express.js Setup mit TypeScript
   - Prisma Schema für Datenbank
   - Authentication (JWT)
   - Basic CRUD Endpoints

2. **Datenbank**
   - PostgreSQL Schema Design
   - Migration Setup
   - Seed Data

### Phase 3: Frontend-Skeleton (Woche 5-6)

1. **Web App**
   - Next.js Setup mit TypeScript
   - Tailwind CSS + shadcn/ui
   - Basic Routing
   - API Integration

### Phase 4: Mobile-Skeleton (Woche 7-8)

1. **Mobile App**
   - Flutter Setup
   - Basic Navigation
   - API Integration
   - Shared Types mit Backend

### Phase 5: MVP-Features (Woche 9-20)

1. **Ressourcen-Katalog** (Woche 9-14)
   - CRUD für Listings
   - Kategorisierung
   - Suche und Filter
   - Standort-basierte Suche

2. **User-Authentication** (Woche 15-16)
   - Registrierung/Login
   - Profil-Verwaltung
   - E-Mail-Verifizierung

3. **Chat-System** (Woche 17-20)
   - Socket.io Integration
   - In-App-Messaging
   - Benachrichtigungen

### Phase 6: Testing & Deployment (Woche 21-24)

1. **Testing**
   - Unit Tests
   - Integration Tests
   - E2E Tests

2. **Deployment**
   - Hetzner Cloud Setup
   - CI/CD Pipeline
   - Monitoring Setup

---

## Risiken & Mitigation

### Technische Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Skalierungsprobleme | Mittel | Hoch | Microservices-ready Architektur, Caching |
| Performance-Probleme | Niedrig | Mittel | Load Testing, Optimierung |
| Sicherheitslücken | Mittel | Hoch | Security-Audit, Penetration Testing |
| Datenverlust | Niedrig | Hoch | Automatische Backups, Disaster Recovery |

### Technologie-Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Vendor-Lock-in | Niedrig | Mittel | Open Source, Standard-Technologien |
| Technologie-Verfall | Niedrig | Mittel | Bewährte Technologien verwenden |
| Team-Knowledge | Mittel | Mittel | Dokumentation, Code-Reviews |

---

## Kosten-Schätzung (Technologie)

### Entwicklung (einmalig)

- **Backend-Entwicklung**: €80.000 - €120.000
- **Frontend-Entwicklung**: €30.000 - €45.000
- **Mobile Apps**: €60.000 - €90.000
- **DevOps/Infrastructure Setup**: €10.000 - €15.000

### Laufende Kosten (monatlich)

- **Hetzner Cloud** (Server): €50 - €150/Monat
- **PostgreSQL** (Managed): €30 - €80/Monat
- **Object Storage** (Scaleway): €10 - €30/Monat
- **CDN** (Cloudflare): €0 - €20/Monat (Free Tier möglich)
- **E-Mail** (Mailgun EU): €10 - €30/Monat
- **Monitoring** (Self-hosted): €0 - €20/Monat
- **Analytics** (Plausible): €9 - €19/Monat

**Gesamt Infrastructure**: €109 - €349/Monat

---

## Fazit

Die empfohlene Technologie-Stack ist:

✅ **EU-konform** (alle Provider in EU)  
✅ **Open Source** (passt zur Philosophie)  
✅ **Skalierbar** (Microservices-ready)  
✅ **Kosteneffizient** (günstige EU-Provider)  
✅ **GDPR-konform** (Privacy-by-Design)  
✅ **Community-freundlich** (Standard-Technologien)

Die Architektur ist für das MVP optimiert, kann aber später einfach erweitert werden (Zahlungssystem, KI-Features).

