# Dev Environment - Quick Start

## Schnellstart für Development Environment

### Voraussetzungen
- ✅ Server Setup bereits ausgeführt (einmalig)
- ✅ Docker und Docker Compose installiert
- ✅ Docker Login zu ghcr.io (für Registry Deployment)

---

## Deployment-Methoden

### Option 1: Registry Deployment (empfohlen) ⚡

**Vorteile:** Schnell, kein Build auf Server, automatische Versionierung

```bash
# Siehe: docs/DEPLOYMENT_REGISTRY.md
./scripts/deploy-from-registry.sh dev
```

### Option 2: Local Build 🔨

**Vorteile:** Hot Reload möglich, vollständige Kontrolle

```bash
# Siehe: docs/DEV_ENVIRONMENT_SETUP.md
./scripts/deploy-to-server.sh dev
```

---

## Schritt 1: Minimales Setup (Registry)

```bash
ssh user@nuernbergspots.de
cd /opt/sharelocal/dev

# Nur notwendige Dateien (oder kopiere manuell)
git clone --depth 1 --filter=blob:none --sparse <repository-url> .
git sparse-checkout set docker-compose.yml docker-compose.dev.registry.yml scripts infrastructure/nginx .env.production.example
```

**Oder kopiere manuell:**
- `docker-compose.yml`
- `docker-compose.dev.registry.yml`
- `scripts/deploy-from-registry.sh`
- `.env.production.example`

---

## Schritt 2: Environment Variables

```bash
# Kopiere Template
cp .env.production.example .env.dev

# Bearbeite und setze wichtige Werte
nano .env.dev
```

**Minimale .env.dev Konfiguration:**
```env
# GitHub Repository Owner (für Registry Images)
GITHUB_REPOSITORY_OWNER=dengelma9898

# Database
POSTGRES_USER=sharelocal
POSTGRES_PASSWORD=<password>
POSTGRES_DB=sharelocal_dev

DATABASE_URL=postgresql://sharelocal:<password>@postgres:5432/sharelocal_dev?schema=public
JWT_SECRET=<min-32-chars>
ENCRYPTION_KEY=<min-32-chars>

NODE_ENV=development
LOG_LEVEL=debug

NEXT_PUBLIC_API_URL=http://nuernbergspots.de/share-local/dev/api
NEXT_PUBLIC_BASE_PATH=/share-local/dev
```

---

## Schritt 3: Docker Login (Registry Deployment)

```bash
# Erstelle GitHub Personal Access Token mit 'read:packages' Berechtigung
# https://github.com/settings/tokens

# Login zu ghcr.io
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin
```

---

## Schritt 4: Deployen

### Registry Deployment (empfohlen)

```bash
cd /opt/sharelocal/dev
export $(cat .env.dev | grep -v '^#' | xargs)
./scripts/deploy-from-registry.sh dev
```

### Local Build

```bash
cd /opt/sharelocal/dev
export $(cat .env.dev | grep -v '^#' | xargs)
./scripts/deploy-to-server.sh dev
```

---

## Schritt 4: Nginx konfigurieren

```bash
sudo cp infrastructure/nginx/share-local-dev.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/share-local-dev /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Schritt 5: Testen

```bash
# API Health Check
curl http://nuernbergspots.de/share-local/dev/api/health

# Im Browser
# http://nuernbergspots.de/share-local/dev
```

---

## Nützliche Commands

### Logs ansehen
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

### Container Status
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

### Container neu starten
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart
```

### Code aktualisieren
```bash
git pull
# Container laden automatisch neu (Hot Reload)
```

---

## URLs

- **Web**: `http://nuernbergspots.de/share-local/dev`
- **API**: `http://nuernbergspots.de/share-local/dev/api`

