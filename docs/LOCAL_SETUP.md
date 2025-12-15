# Lokale Entwicklung - Setup-Anleitung

Diese Anleitung erklärt, wie du das ShareLocal-Projekt lokal startest (API, Database und Frontend).

## Voraussetzungen

Bevor du startest, stelle sicher, dass folgende Tools installiert sind:

- **Node.js** 24.x LTS (empfohlen: [nvm](https://github.com/nvm-sh/nvm) verwenden)
- **pnpm** 9.0.0+ (`npm install -g pnpm@9.0.0`)
- **PostgreSQL** 17.x (lokal installiert oder via Docker)
- **Git** (zum Klonen des Repositories)

### Optionale Tools

- **Docker** & **Docker Compose** (für einfache Datenbank-Setup)
- **Flutter** 3.27.x (nur wenn du die Mobile App entwickeln möchtest)

## Schritt 1: Repository klonen und Dependencies installieren

```bash
# Repository klonen
git clone <repository-url>
cd ShareLocal

# Alle Dependencies installieren
pnpm install
```

## Schritt 2: Datenbank Setup

Du hast zwei Optionen für die Datenbank. **Wir empfehlen Option A (Docker)**, da es einfacher und zuverlässiger ist.

### Option A: PostgreSQL via Docker (⭐ **EMPFOHLEN** - Einfachste Option)

**Voraussetzung**: Docker Desktop muss gestartet sein.

1. **Docker Desktop starten** (falls nicht bereits laufend):
   - macOS: Öffne Docker Desktop App
   - Linux: `sudo systemctl start docker`
   - Windows: Starte Docker Desktop

2. **Docker Compose starten**:
   ```bash
   # Im Root-Verzeichnis
   docker-compose up -d postgres
   ```
   
   Dies startet PostgreSQL auf Port `5432` mit:
   - Database: `sharelocal`
   - User: `sharelocal`
   - Password: `sharelocal_dev`

2. **Environment-Variablen konfigurieren**:
   ```bash
   # Im Root-Verzeichnis
   cp packages/api/.env.example packages/api/.env
   ```
   
   Die `DATABASE_URL` sollte bereits korrekt sein:
   ```env
   DATABASE_URL="postgresql://sharelocal:sharelocal_dev@localhost:5432/sharelocal"
   JWT_SECRET="change-me-in-production-min-32-chars-long-secret-key"
   ENCRYPTION_KEY="change-me-in-production-min-32-chars-long-encryption-key"
   PORT=3001
   NODE_ENV=development
   ```

### Option B: PostgreSQL lokal installiert

1. **PostgreSQL starten** (falls nicht bereits laufend):
   ```bash
   # macOS (mit Homebrew)
   brew services start postgresql@17
   ```
   
   **⚠️ Troubleshooting für macOS:**
   
   Falls `brew services start` einen Fehler gibt (z.B. "Bootstrap failed: 5: Input/output error"):
   
   **Lösung 1: Service manuell starten**
   ```bash
   # PostgreSQL direkt starten (ohne brew services)
   /opt/homebrew/opt/postgresql@17/bin/postgres -D /opt/homebrew/var/postgresql@17
   
   # Oder falls installiert unter /usr/local:
   /usr/local/opt/postgresql@17/bin/postgres -D /usr/local/var/postgresql@17
   ```
   
   **Lösung 2: Launch Agent reparieren**
   ```bash
   # Alten Launch Agent entfernen
   rm ~/Library/LaunchAgents/homebrew.mxcl.postgresql@17.plist
   
   # Service neu registrieren
   brew services start postgresql@17
   ```
   
   **Lösung 3: PostgreSQL manuell starten (temporär)**
   ```bash
   # PostgreSQL im Vordergrund starten (für Testing)
   postgres -D /opt/homebrew/var/postgresql@17
   # Oder: /usr/local/var/postgresql@17
   ```
   
   **Linux (systemd):**
   ```bash
   sudo systemctl start postgresql
   ```
   
   **Windows:**
   Starte PostgreSQL Service über Services-Manager

2. **Datenbank erstellen**:
   ```bash
   # PostgreSQL CLI öffnen
   psql postgres
   
   # Datenbank erstellen
   CREATE DATABASE sharelocal;
   CREATE USER sharelocal WITH PASSWORD 'sharelocal_dev';
   GRANT ALL PRIVILEGES ON DATABASE sharelocal TO sharelocal;
   \q
   ```

3. **Environment-Variablen konfigurieren**:
   ```bash
   # Im Root-Verzeichnis
   cp packages/api/.env.example packages/api/.env
   ```
   
   Bearbeite `packages/api/.env` und setze:
   ```env
   DATABASE_URL="postgresql://sharelocal:sharelocal_dev@localhost:5432/sharelocal"
   JWT_SECRET="change-me-in-production-min-32-chars-long-secret-key"
   ENCRYPTION_KEY="change-me-in-production-min-32-chars-long-encryption-key"
   PORT=3001
   NODE_ENV=development
   ```


## Schritt 3: Prisma Setup

```bash
# Prisma Client generieren
pnpm --filter @sharelocal/database db:generate

# Database Migrationen ausführen
pnpm --filter @sharelocal/database db:migrate

# (Optional) Seed-Daten einfügen
pnpm --filter @sharelocal/database db:seed
```

## Schritt 4: Frontend Environment-Variablen

```bash
# Im Root-Verzeichnis
cp packages/web/.env.example packages/web/.env.local
```

Bearbeite `packages/web/.env.local` und setze:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Schritt 5: Projekte starten

Du hast mehrere Optionen:

### Option A: Alle Services gleichzeitig starten (empfohlen)

```bash
# Im Root-Verzeichnis
pnpm dev
```

Dies startet:
- **API**: `http://localhost:3001`
- **Web**: `http://localhost:3000` (oder 3002, je nach Konfiguration)

### Option B: Services einzeln starten

**Terminal 1 - API:**
```bash
pnpm api:dev
# Oder direkt im Package:
cd packages/api
pnpm dev
```

**Terminal 2 - Web:**
```bash
pnpm web:dev
# Oder direkt im Package:
cd packages/web
pnpm dev
```

**Terminal 3 - Database (nur wenn Docker verwendet wird):**
```bash
docker-compose up postgres
```

## Schritt 6: Verifizierung

### API Health Check

```bash
# API Health Check
curl http://localhost:3001/health

# Erwartete Antwort:
# {
#   "status": "ok",
#   "checks": {
#     "api": "ok",
#     "database": "ok",
#     "encryption": "ok"
#   }
# }
```

### Web Frontend

Öffne im Browser:
- **Frontend**: http://localhost:3000 (oder 3002)
- **API**: http://localhost:3001

## Nützliche Befehle

### Database Management

```bash
# Prisma Studio öffnen (GUI für Datenbank)
pnpm --filter @sharelocal/database db:studio

# Neue Migration erstellen
pnpm --filter @sharelocal/database db:migrate

# Migrationen in Production deployen
pnpm --filter @sharelocal/database db:migrate:deploy
```

### Development

```bash
# Alle Packages bauen
pnpm build

# Tests ausführen
pnpm test

# Linting
pnpm lint

# Clean (alle Build-Artefakte löschen)
pnpm clean
```

### Docker

```bash
# PostgreSQL starten
docker-compose up -d postgres

# PostgreSQL stoppen
docker-compose stop postgres

# PostgreSQL Logs anzeigen
docker-compose logs -f postgres

# PostgreSQL zurücksetzen (ACHTUNG: Löscht alle Daten!)
docker-compose down -v postgres
docker-compose up -d postgres
```

## Troubleshooting

### ⚠️ Node.js Deprecation Warning

**Warnung**: `[DEP0169] DeprecationWarning: url.parse() behavior is not standardized...`

**Erklärung**: Diese Warnung kommt von pnpm selbst, nicht von unserem Code. Sie ist harmlos und kann ignoriert werden. Sie wird in zukünftigen pnpm-Versionen behoben.

**Lösung**: Keine Aktion erforderlich. Die Warnung beeinträchtigt die Funktionalität nicht.

### Problem: Port bereits belegt

**Fehler**: `Error: listen EADDRINUSE: address already in use :::3001`

**Lösung**:
```bash
# Port prüfen
lsof -i :3001

# Prozess beenden
kill -9 <PID>
```

### Problem: Database Connection Error

**Fehler**: `Can't reach database server`

**Lösung**:
1. Prüfe, ob PostgreSQL läuft:
   ```bash
   # macOS/Linux
   pg_isready
   
   # Oder via Docker
   docker-compose ps postgres
   ```

2. Prüfe `DATABASE_URL` in `packages/api/.env`

3. Prüfe Firewall-Einstellungen

### Problem: Homebrew Services Bootstrap Error (macOS)

**Fehler**: `Bootstrap failed: 5: Input/output error` beim Starten von PostgreSQL

**Lösung**:
```bash
# Option 1: Launch Agent reparieren
rm ~/Library/LaunchAgents/homebrew.mxcl.postgresql@17.plist
brew services start postgresql@17

# Option 2: PostgreSQL direkt starten (ohne brew services)
# Finde den Installationspfad:
brew --prefix postgresql@17

# Starte PostgreSQL direkt:
/opt/homebrew/opt/postgresql@17/bin/postgres -D /opt/homebrew/var/postgresql@17

# Option 3: Docker verwenden (empfohlen)
docker-compose up -d postgres
```

### Problem: Prisma Client nicht gefunden

**Fehler**: `Cannot find module '@prisma/client'`

**Lösung**:
```bash
# Prisma Client neu generieren
pnpm --filter @sharelocal/database db:generate

# Dependencies neu installieren
pnpm install
```

### Problem: TypeScript-Fehler

**Fehler**: TypeScript-Kompilierungsfehler

**Lösung**:
```bash
# Alle Packages neu bauen
pnpm build

# TypeScript-Cache löschen
rm -rf packages/*/dist
rm -rf packages/*/node_modules/.cache
```

## Port-Übersicht

| Service | Port | URL |
|---------|------|-----|
| API (Dev) | 3001 | http://localhost:3001 |
| API (Prod) | 3101 | http://localhost:3101 |
| Web (Dev) | 3000/3002 | http://localhost:3000 |
| Web (Prod) | 3102 | http://localhost:3102 |
| PostgreSQL | 5432 | localhost:5432 |
| Prisma Studio | 5555 | http://localhost:5555 |

## Nächste Schritte

Nach erfolgreichem Setup kannst du:

1. **API testen**: Verwende die `.http` Dateien in `packages/api/http/`
2. **Frontend entwickeln**: Öffne http://localhost:3000 im Browser
3. **Database verwalten**: Öffne Prisma Studio mit `pnpm --filter @sharelocal/database db:studio`

## Weitere Dokumentation

- [API README](../packages/api/README.md) - Detaillierte API-Dokumentation
- [Web README](../packages/web/README.md) - Frontend-Dokumentation
- [Database README](../packages/database/README.md) - Database-Schema-Dokumentation
- [AGENTS.md](../AGENTS.md) - Projekt-Kontext für AI Agents

---

**Letzte Aktualisierung**: 15. Dezember 2025

