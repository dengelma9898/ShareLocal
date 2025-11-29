# Quick Start Deployment - IONOS

## Übersicht

Schnellstart-Anleitung für Deployment auf IONOS-Server unter `nuernbergspots.de/share-local/dev` und `/share-local/prd`.

---

## Voraussetzungen

- ✅ Docker verfügbar auf IONOS-Server
- ✅ SSH-Zugang zum Server
- ✅ Domain: `nuernbergspots.de` konfiguriert

---

## Schritt 1: Server Setup (einmalig)

### 1.1 SSH zum Server

```bash
ssh user@nuernbergspots.de
```

### 1.2 Server Setup Script ausführen

```bash
# Auf dem Server
cd /opt/sharelocal/prd  # oder /opt/sharelocal/dev
git clone <repository-url> .

# Führe Setup-Script aus (benötigt sudo)
sudo ./scripts/setup-server.sh
```

**Was das Script macht:**
- ✅ Prüft/Installiert Docker
- ✅ Prüft/Installiert Docker Compose
- ✅ Prüft/Installiert Nginx
- ✅ Erstellt Verzeichnisse
- ✅ Kopiert Nginx Configs

---

## Schritt 2: Environment Variables

### 2.1 Erstelle .env Dateien

```bash
# Für Production
cd /opt/sharelocal/prd
cp .env.production.example .env.production

# Für Development
cd /opt/sharelocal/dev
cp .env.production.example .env.dev
```

### 2.2 Generiere Secrets

```bash
# Generiere sichere Secrets
openssl rand -base64 32  # Für JWT_SECRET
openssl rand -base64 32  # Für ENCRYPTION_KEY
openssl rand -base64 32  # Für POSTGRES_PASSWORD
```

### 2.3 Fülle .env Dateien aus

**Für Production (`.env.production`):**
```env
POSTGRES_USER=sharelocal
POSTGRES_PASSWORD=<generiertes-password>
POSTGRES_DB=sharelocal

DATABASE_URL=postgresql://sharelocal:<password>@postgres:5432/sharelocal?schema=public
JWT_SECRET=<generiertes-jwt-secret>
ENCRYPTION_KEY=<generiertes-encryption-key>

NEXT_PUBLIC_API_URL=https://nuernbergspots.de/share-local/prd/api
NEXT_PUBLIC_BASE_PATH=/share-local/prd
NODE_ENV=production
```

**Für Development (`.env.dev`):**
```env
POSTGRES_USER=sharelocal
POSTGRES_PASSWORD=<generiertes-password>
POSTGRES_DB=sharelocal_dev

DATABASE_URL=postgresql://sharelocal:<password>@postgres:5432/sharelocal_dev?schema=public
JWT_SECRET=<generiertes-jwt-secret>
ENCRYPTION_KEY=<generiertes-encryption-key>

NEXT_PUBLIC_API_URL=http://nuernbergspots.de/share-local/dev/api
NEXT_PUBLIC_BASE_PATH=/share-local/dev
NODE_ENV=development
```

---

## Schritt 3: Deployment

### 3.1 Production Deployment

```bash
cd /opt/sharelocal/prd

# Lade Environment Variables
export $(cat .env.production | grep -v '^#' | xargs)

# Deploye
./scripts/deploy-to-server.sh prd
```

**Was das Script macht:**
- ✅ Baut Docker Images
- ✅ Startet PostgreSQL
- ✅ Führt Database Migrations aus
- ✅ Startet API und Web Container
- ✅ Prüft Health Checks

### 3.2 Development Deployment

```bash
cd /opt/sharelocal/dev

# Lade Environment Variables
export $(cat .env.dev | grep -v '^#' | xargs)

# Deploye
./scripts/deploy-to-server.sh dev
```

---

## Schritt 4: Nginx konfigurieren

### 4.1 Nginx Configs aktivieren

```bash
# Auf dem Server
sudo cp /opt/sharelocal/prd/infrastructure/nginx/share-local-prd.conf /etc/nginx/sites-available/share-local-prd
sudo cp /opt/sharelocal/prd/infrastructure/nginx/share-local-dev.conf /etc/nginx/sites-available/share-local-dev

# Erstelle Symlinks
sudo ln -sf /etc/nginx/sites-available/share-local-prd /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/share-local-dev /etc/nginx/sites-enabled/

# Teste Config
sudo nginx -t

# Lade Nginx neu
sudo systemctl reload nginx
```

### 4.2 Prüfe ob es funktioniert

```bash
# API Health Check
curl http://nuernbergspots.de/share-local/prd/api/health

# Dev API Health Check
curl http://nuernbergspots.de/share-local/dev/api/health
```

---

## Schritt 5: SSL/TLS (Optional, aber empfohlen)

### 5.1 Let's Encrypt installieren

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

### 5.2 SSL-Zertifikat erstellen

```bash
sudo certbot --nginx -d nuernbergspots.de
```

Certbot konfiguriert Nginx automatisch für HTTPS.

---

## Updates deployen

```bash
cd /opt/sharelocal/prd  # oder /opt/sharelocal/dev

# Pull latest code
git pull

# Rebuild und Restart
./scripts/deploy-to-server.sh prd  # oder dev
```

---

## Troubleshooting

### Container startet nicht

```bash
# Prüfe Logs
docker compose logs api
docker compose logs web

# Prüfe Status
docker compose ps
```

### Database Connection Error

```bash
# Prüfe Database Container
docker compose ps postgres
docker compose logs postgres

# Teste Connection
docker compose exec api node -e "console.log(process.env.DATABASE_URL)"
```

### Nginx 502 Bad Gateway

```bash
# Prüfe ob Container laufen
docker compose ps

# Prüfe Nginx Error Logs
sudo tail -f /var/log/nginx/error.log

# Prüfe Container Ports
docker compose port api 3001
docker compose port web 3000
```

### Next.js basePath funktioniert nicht

```bash
# Prüfe Environment Variables
docker compose exec web env | grep BASE_PATH

# Prüfe Next.js Build
docker compose exec web ls -la packages/web/.next
```

---

## Wichtige URLs

### Production
- **Web**: `https://nuernbergspots.de/share-local/prd`
- **API**: `https://nuernbergspots.de/share-local/prd/api`
- **Health**: `https://nuernbergspots.de/share-local/prd/api/health`

### Development
- **Web**: `http://nuernbergspots.de/share-local/dev`
- **API**: `http://nuernbergspots.de/share-local/dev/api`
- **Health**: `http://nuernbergspots.de/share-local/dev/api/health`

---

## Nächste Schritte

1. ✅ Docker Setup erstellt
2. ✅ Deployment Scripts erstellt
3. ⏳ Server Setup durchführen
4. ⏳ Erste Deployment testen
5. ⏳ SSL-Zertifikate einrichten
6. ⏳ Monitoring einrichten

