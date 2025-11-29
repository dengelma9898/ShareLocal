# Dev Environment - Quick Start

## Schnellstart für Development Environment

### Voraussetzungen
- ✅ Server Setup bereits ausgeführt (einmalig)
- ✅ Docker und Docker Compose installiert

---

## Schritt 1: Repository klonen

```bash
ssh user@nuernbergspots.de
cd /opt/sharelocal/dev
git clone <repository-url> .
```

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

## Schritt 3: Deployen

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

