# @sharelocal/api

Backend API für ShareLocal - Express.js + TypeScript mit Ports & Adapters Architektur

## 🏛️ Architektur

Dieses Package verwendet **Ports & Adapters (Hexagonal Architecture)**:

```
src/
├── domain/              # Domain Layer (Pure Business Logic)
│   ├── entities/        # Domain Entities (User, Listing)
│   └── validation/      # Zod Validation Schemas
├── application/         # Application Layer
│   └── use-cases/       # Use Cases (GetUser, CreateListing, etc.)
├── ports/               # Ports (Interfaces)
│   ├── repositories/    # Repository Interfaces
│   └── services/        # Service Interfaces (Auth, etc.)
└── adapters/            # Adapters (Implementations)
    ├── database/        # Database Adapters (Prisma)
    ├── http/            # HTTP Adapters (Express)
    └── services/        # Service Adapters (JWT Auth)
```

**Vorteile:**
- ✅ Einfacher Austausch von Infrastruktur
- ✅ Testbarkeit durch Mock-Adapter
- ✅ Klare Trennung von Business Logic und Infrastruktur

## 🚀 Quick Start

### Voraussetzungen

- Node.js 24.x LTS
- PostgreSQL 17.x (läuft und erreichbar)
- `.env` Datei mit `DATABASE_URL`, `JWT_SECRET` und `ENCRYPTION_KEY`

### Environment Variables

Die API validiert beim Start automatisch alle erforderlichen Environment Variables. Bei fehlenden oder ungültigen Variablen wird die App nicht gestartet.

**Erforderliche Environment Variables:**

- **DATABASE_URL** (erforderlich)
  - PostgreSQL Connection String
  - Format: `postgresql://user:password@host:port/database`
  - Beispiel: `postgresql://postgres:password@localhost:5432/sharelocal`

- **JWT_SECRET** (erforderlich, min. 32 Zeichen)
  - Secret Key für JWT Token Signing
  - Muss in Production geändert werden
  - Generierung:
    ```bash
    # Option 1: Mit OpenSSL
    openssl rand -base64 32
    
    # Option 2: Mit Node.js
    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    ```

- **ENCRYPTION_KEY** (erforderlich, min. 32 Zeichen)
  - Secret Key für Verschlüsselung von Chat-Nachrichten
  - Muss in Production geändert werden
  - Generierung:
    ```bash
    # Option 1: Mit OpenSSL
    openssl rand -base64 32
    
    # Option 2: Mit Node.js
    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    ```

**Optionale Environment Variables:**

- **PORT** (optional, default: 3001)
  - Port für den API-Server
  - Muss zwischen 1 und 65535 sein

- **NODE_ENV** (optional, default: development)
  - Node Environment: `development`, `production`, oder `test`
  - In Production sollte `production` gesetzt sein

- **LOG_LEVEL** (optional)
  - Logging Level: `error`, `warn`, `info`, oder `debug`

**Setup:**

1. Kopiere `.env.example` zu `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fülle alle erforderlichen Variablen aus

3. Generiere sichere Secrets für Production:
   ```bash
   # Generiere JWT_SECRET
   openssl rand -base64 32
   
   # Generiere ENCRYPTION_KEY
   openssl rand -base64 32
   ```

**Validierung:**

Die API validiert beim Start automatisch:
- ✅ Alle erforderlichen Variablen sind gesetzt
- ✅ DATABASE_URL ist eine gültige PostgreSQL Connection String
- ✅ JWT_SECRET und ENCRYPTION_KEY sind mindestens 32 Zeichen lang
- ✅ In Production: Secrets wurden geändert (nicht mehr `change-me-in-production`)

Bei Fehlern wird die App nicht gestartet und zeigt klare Fehlermeldungen an.

### Installation

```bash
# Vom Root-Verzeichnis
pnpm install

# Oder direkt im Package
cd packages/api
pnpm install
```

### Entwicklung

```bash
# Vom Root-Verzeichnis
pnpm api:dev

# Oder direkt im Package
cd packages/api
pnpm dev
```

Der Server läuft standardmäßig auf `http://localhost:3001`

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Neuen User registrieren
- `POST /api/auth/login` - User einloggen (gibt JWT Token zurück)

### Users

- `GET /api/users` - Liste aller User (mit Pagination)
- `GET /api/users/:id` - User abrufen
- `PUT /api/users/:id` - User aktualisieren (Protected: nur eigener Account)

### Listings

- `GET /api/listings` - Liste aller Listings (mit Filtern: category, type, search, etc.)
- `GET /api/listings/:id` - Listing abrufen
- `POST /api/listings` - Listing erstellen (Protected: erfordert Authentication)
- `PUT /api/listings/:id` - Listing aktualisieren (Protected: nur Owner)
- `DELETE /api/listings/:id` - Listing löschen (Protected: nur Owner)

### Health Check

Die API bietet drei Health Check Endpoints für Monitoring und Deployment:

- `GET /health` - **Vollständiger Health Check** mit Status aller Services
  - Prüft API, Database und Encryption Service
  - Gibt strukturierte Response mit Status (`ok`, `degraded`, `error`) zurück
  - HTTP Status: `200` (ok/degraded) oder `503` (error)
  
- `GET /health/live` - **Liveness Check** (für Kubernetes/Docker)
  - Einfacher Check, ob die API läuft
  - Wird für Container-Orchestrierung verwendet
  - HTTP Status: `200` wenn API läuft
  
- `GET /health/ready` - **Readiness Check** (für Kubernetes/Docker)
  - Prüft, ob die API bereit ist, Requests zu verarbeiten
  - Prüft Database und Encryption Service
  - HTTP Status: `200` (ready) oder `503` (not ready)

**Beispiel Response (`GET /health`):**
```json
{
  "status": "ok",
  "checks": {
    "api": "ok",
    "database": "ok",
    "encryption": "ok"
  },
  "timestamp": "2025-01-25T20:00:00.000Z",
  "uptime": 3600,
  "version": "0.1.0"
}
```

**Status-Werte:**
- `ok`: Alle Services funktionieren korrekt
- `degraded`: API läuft, aber einige Dependencies haben Probleme
- `error`: API hat kritische Probleme

### Root Endpoint

- `GET /` - API Info

## 🛡️ Security Features

### Security Headers (Helmet.js)

Die API verwendet **Helmet.js** zum Setzen von Security Headers. Helmet.js ist ein Express-Middleware, das verschiedene HTTP-Security-Header automatisch setzt, um die App gegen häufige Web-Vulnerabilities zu schützen.

**Warum Helmet.js?**

1. **XSS Protection**: Verhindert Cross-Site-Scripting-Angriffe durch Content-Security-Policy (CSP) Header
2. **Clickjacking Protection**: Verhindert Clickjacking-Angriffe durch X-Frame-Options Header
3. **MIME Sniffing Protection**: Verhindert MIME-Type-Sniffing durch X-Content-Type-Options Header
4. **HTTPS Enforcement**: Erzwingt HTTPS-Verbindungen durch Strict-Transport-Security (HSTS) Header
5. **XSS Filter**: Aktiviert XSS-Filter im Browser durch X-XSS-Protection Header
6. **Referrer Policy**: Kontrolliert, welche Referrer-Informationen gesendet werden
7. **Permissions Policy**: Kontrolliert Browser-Features und APIs

**Konfiguration:**

Helmet.js wird standardmäßig mit sicheren Defaults konfiguriert. Für Production können spezifische Header angepasst werden, z.B. für CSP (Content Security Policy) wenn nötig.

**Weitere Informationen:**
- [Helmet.js Dokumentation](https://helmetjs.github.io/)
- [OWASP Security Headers Guide](https://owasp.org/www-project-secure-headers/)

### Rate Limiting

Die API verwendet **Rate Limiting** zum Schutz gegen Brute-Force Attacks und API-Missbrauch:

- **Auth-Endpoints** (`/api/auth/*`): 5 Versuche pro 15 Minuten pro IP
- **API-Endpoints** (`/api/*`): 100 Requests pro 15 Minuten pro IP
- **Health Check** (`/health`) und Root-Endpoint (`/`) sind nicht rate-limited

Bei Überschreitung des Limits wird ein `429 Too Many Requests` Status mit einer Fehlermeldung zurückgegeben.

## 🔐 Authentication

Die API verwendet **JWT (JSON Web Tokens)** für Authentication.

### Login Flow

1. `POST /api/auth/login` mit `email` und `password`
2. Response enthält `token` und `user` Objekt
3. Token in `Authorization: Bearer <token>` Header für protected Routes verwenden

### Protected Routes

Protected Routes erfordern einen gültigen JWT Token im `Authorization` Header:

```http
Authorization: Bearer <your-jwt-token>
```

## 📝 Scripts

- `pnpm dev` - Startet Development-Server mit Hot-Reload (`tsx watch`)
- `pnpm build` - Kompiliert TypeScript zu JavaScript
- `pnpm start` - Startet Production-Server (`node dist/index.js`)
- `pnpm lint` - Führt ESLint aus
- `pnpm test` - Führt Tests aus (Vitest)

## 📊 Logging

Die API verwendet **Winston** für strukturiertes Logging.

**Log-Levels:**
- `error`: Fehler und Exceptions
- `warn`: Warnungen
- `info`: Allgemeine Informationen (Standard in Production)
- `debug`: Detaillierte Debug-Informationen (Standard in Development)

**Konfiguration:**

- **Development**: Farbige, lesbare Logs in der Console
- **Production**: JSON-formatierte Logs in Console und Dateien (`logs/error.log`, `logs/combined.log`)
- **Log-Rotation**: Automatisch bei 5MB, behält 5 Dateien

**Environment Variables:**

- `LOG_LEVEL`: Setzt das Log-Level (`error`, `warn`, `info`, `debug`)
- `LOG_TO_FILE`: Wenn `true`, werden Logs auch in Dateien geschrieben (Standard: nur in Production)

**Beispiel:**

```typescript
import { logger } from './utils/logger.js';

logger.info('Server started', { port: 3001 });
logger.error('Database connection failed', { error: err.message });
logger.debug('Request details', { method: 'GET', path: '/api/users' });
```

## 🧪 Testing

### HTTP Request Tests

Verwende die `.http` Dateien in `http/` Verzeichnis:

- `http/api.http` - Allgemeine API-Endpoints
- `http/auth.http` - Authentication-Endpoints
- `http/protected-routes.http` - Protected Routes mit Token-Beispielen

**VS Code**: Installiere "REST Client" Extension  
**IntelliJ IDEA**: Built-in HTTP Client

### Beispiel Request

```http
### Login
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "max.mustermann@example.com",
  "password": "test123"
}
```

## 📦 Dependencies

### Runtime

- `express` - HTTP Server Framework
- `@prisma/client` - Database Client
- `zod` - Schema Validation
- `bcryptjs` - Password Hashing
- `jsonwebtoken` - JWT Token Generation/Verification
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Environment Variables

### Development

- `typescript` - TypeScript Compiler
- `tsx` - TypeScript Execution (für Dev-Server)
- `vitest` - Test Framework
- `eslint` - Linting

## 🏗️ Dependency Injection

Alle Dependencies werden in `src/index.ts` injiziert:

```typescript
// Infrastructure Setup
const prisma = new PrismaClient();

// Adapters
const userRepository = new PrismaUserRepository(prisma);
const listingRepository = new PrismaListingRepository(prisma);
const authService = new JwtAuthService();

// Dependency Injection
const dependencies: AppDependencies = {
  userRepository,
  listingRepository,
  authService,
};

const app = createApp(dependencies);
```

## 🔄 Adapter austauschen

Um z.B. Prisma durch MongoDB zu ersetzen:

1. Neuen Adapter erstellen: `adapters/database/MongoUserRepository.ts`
2. Implementiert `UserRepository` Port
3. In `index.ts` austauschen

**Keine Änderungen** in Domain Layer oder Use Cases nötig!

## ⚠️ Wichtige Regeln

- **Build muss erfolgreich sein**: `pnpm build` vor dem Abschließen
- **Dev-Start muss erfolgreich sein**: `pnpm dev` muss ohne Fehler starten
- Alle API-Endpoints müssen validiert werden (Zod)
- Domain Logic gehört in Entities, nicht in Routes
- Error Handling sollte konsistent sein

## 📚 Weitere Dokumentation

- [AGENTS.md](AGENTS.md) - Detaillierte Anweisungen für AI Coding Agents
- [http/api.http](http/api.http) - API Endpoint Beispiele
- [http/auth.http](http/auth.http) - Authentication Beispiele
- [http/protected-routes.http](http/protected-routes.http) - Protected Routes Beispiele

---

**Status:** ✅ MVP Features implementiert
