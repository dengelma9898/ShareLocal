# IONOS Deployment Guide - ShareLocal

## Übersicht

Dieser Guide beschreibt, wie ShareLocal auf einem IONOS-Server unter `nuernbergspots.de/share-local/dev` und `/share-local/prd` deployed wird.

## Voraussetzungen

### Server-Anforderungen

- **IONOS Server** mit SSH-Zugang
- **Docker** und **Docker Compose** installiert
- **Nginx** installiert und konfiguriert
- **Domain**: `nuernbergspots.de` (bereits vorhanden)
- **PostgreSQL** 17.x (Docker Container oder Managed)

### Lokale Voraussetzungen

- Git Repository Zugang
- SSH-Zugang zum Server
- Docker lokal installiert (zum Testen)

---

## Schritt 1: Server-Vorbereitung

### 1.1 SSH-Verbindung zum Server

```bash
ssh user@nuernbergspots.de
```

### 1.2 Docker Installation prüfen

```bash
# Prüfe Docker Version
docker --version
docker compose version

# Falls nicht installiert, installiere Docker:
# Ubuntu/Debian:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installiere Docker Compose v2
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### 1.3 Nginx Installation prüfen

```bash
# Prüfe Nginx
nginx -v

# Falls nicht installiert:
sudo apt-get update
sudo apt-get install nginx
```

### 1.4 Verzeichnisstruktur erstellen

```bash
# Erstelle Verzeichnisse für ShareLocal
sudo mkdir -p /opt/sharelocal/{dev,prd}
sudo chown -R $USER:$USER /opt/sharelocal
```

---

## Schritt 2: Code auf Server deployen

### 2.1 Repository klonen

```bash
cd /opt/sharelocal/prd
git clone <repository-url> .
# Oder für Dev:
cd /opt/sharelocal/dev
git clone <repository-url> .
```

### 2.2 Environment Variables erstellen

```bash
# Für Production
cd /opt/sharelocal/prd
cp .env.production.example .env.production

# Bearbeite .env.production
nano .env.production
```

**Wichtige Variablen setzen:**

```env
# Generiere sichere Secrets:
# JWT_SECRET:
openssl rand -base64 32

# ENCRYPTION_KEY:
openssl rand -base64 32

# POSTGRES_PASSWORD:
openssl rand -base64 32

# Setze in .env.production:
DATABASE_URL=postgresql://sharelocal:DEIN_PASSWORD@postgres:5432/sharelocal?schema=public
JWT_SECRET=DEIN_JWT_SECRET_MIN_32_CHARS
ENCRYPTION_KEY=DEIN_ENCRYPTION_KEY_MIN_32_CHARS
NEXT_PUBLIC_API_URL=https://nuernbergspots.de/share-local/prd/api
NEXT_PUBLIC_BASE_PATH=/share-local/prd
```

### 2.3 Docker Images bauen

```bash
cd /opt/sharelocal/prd

# Lade Environment Variables
export $(cat .env.production | xargs)

# Baue Images
docker compose -f docker-compose.yml -f docker-compose.prd.yml build
```

---

## Schritt 3: Database Setup

### 3.1 Database Container starten

```bash
cd /opt/sharelocal/prd

# Starte nur PostgreSQL
docker compose up -d postgres

# Warte bis Database bereit ist
docker compose logs postgres
```

### 3.2 Database Migrations ausführen

```bash
cd /opt/sharelocal/prd

# Führe Prisma Migrations aus
docker compose run --rm api pnpm --filter @sharelocal/database db:push

# Oder manuell:
docker compose exec api pnpm --filter @sharelocal/database db:push
```

---

## Schritt 4: Nginx Konfiguration

### 4.1 Nginx Config kopieren

```bash
# Kopiere Nginx Configs
sudo cp infrastructure/nginx/share-local-prd.conf /etc/nginx/sites-available/share-local-prd
sudo cp infrastructure/nginx/share-local-dev.conf /etc/nginx/sites-available/share-local-dev

# Erstelle Symlinks
sudo ln -s /etc/nginx/sites-available/share-local-prd /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/share-local-dev /etc/nginx/sites-enabled/
```

### 4.2 Nginx Config anpassen

**Wichtig**: Passe die Ports in den Nginx-Configs an, falls Docker Container andere Ports verwenden:

```bash
sudo nano /etc/nginx/sites-available/share-local-prd
```

**Prüfe:**
- `proxy_pass http://localhost:3000` → Web Container Port
- `proxy_pass http://localhost:3001` → API Container Port

### 4.3 Nginx testen und neu laden

```bash
# Teste Nginx Config
sudo nginx -t

# Falls OK, lade Nginx neu
sudo systemctl reload nginx
```

---

## Schritt 5: Application starten

### 5.1 Alle Services starten

```bash
cd /opt/sharelocal/prd

# Starte alle Services
docker compose -f docker-compose.yml -f docker-compose.prd.yml up -d

# Prüfe Logs
docker compose logs -f
```

### 5.2 Health Checks prüfen

```bash
# API Health Check
curl http://localhost:3001/health

# Web Health Check (falls implementiert)
curl http://localhost:3000/share-local/prd/health

# Via Nginx
curl http://nuernbergspots.de/share-local/prd/api/health
```

---

## Schritt 6: SSL/TLS Setup (Optional, aber empfohlen)

### 6.1 Let's Encrypt installieren

```bash
# Installiere Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

### 6.2 SSL-Zertifikat erstellen

```bash
# Erstelle Zertifikat für nuernbergspots.de
sudo certbot --nginx -d nuernbergspots.de

# Certbot konfiguriert Nginx automatisch
```

### 6.3 Automatische Erneuerung

```bash
# Teste automatische Erneuerung
sudo certbot renew --dry-run

# Certbot erneuert automatisch (via cron)
```

---

## Schritt 7: Monitoring & Maintenance

### 7.1 Logs ansehen

```bash
# Alle Logs
docker compose logs -f

# Nur API Logs
docker compose logs -f api

# Nur Web Logs
docker compose logs -f web
```

### 7.2 Container Status prüfen

```bash
# Container Status
docker compose ps

# Health Checks
docker compose ps --format "table {{.Name}}\t{{.Status}}"
```

### 7.3 Updates deployen

```bash
cd /opt/sharelocal/prd

# Pull latest code
git pull

# Rebuild Images
docker compose -f docker-compose.yml -f docker-compose.prd.yml build

# Restart Services
docker compose -f docker-compose.yml -f docker-compose.prd.yml up -d

# Run Migrations (falls nötig)
docker compose exec api pnpm --filter @sharelocal/database db:push
```

---

## Dev Environment Setup

Für Development Environment (`/share-local/dev`):

```bash
cd /opt/sharelocal/dev

# Kopiere .env.example zu .env
cp .env.production.example .env

# Setze Dev-spezifische Variablen:
NEXT_PUBLIC_API_URL=http://nuernbergspots.de/share-local/dev/api
NEXT_PUBLIC_BASE_PATH=/share-local/dev
NODE_ENV=development

# Starte Dev Environment
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

---

## Troubleshooting

### Problem: Container startet nicht

```bash
# Prüfe Logs
docker compose logs api
docker compose logs web

# Prüfe Environment Variables
docker compose config

# Prüfe Container Status
docker compose ps
```

### Problem: Database Connection Error

```bash
# Prüfe Database Container
docker compose ps postgres

# Prüfe Database Logs
docker compose logs postgres

# Teste Connection
docker compose exec api node -e "console.log(process.env.DATABASE_URL)"
```

### Problem: Nginx 502 Bad Gateway

```bash
# Prüfe ob Container laufen
docker compose ps

# Prüfe Container Ports
docker compose port api 3001
docker compose port web 3000

# Prüfe Nginx Error Logs
sudo tail -f /var/log/nginx/error.log
```

### Problem: Next.js basePath funktioniert nicht

```bash
# Prüfe NEXT_PUBLIC_BASE_PATH
docker compose exec web env | grep BASE_PATH

# Prüfe Next.js Build
docker compose exec web ls -la packages/web/.next
```

---

## Backup Strategy

### Database Backup

```bash
# Erstelle Backup Script
cat > /opt/sharelocal/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/sharelocal/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker compose exec -T postgres pg_dump -U sharelocal sharelocal > $BACKUP_DIR/sharelocal_$DATE.sql
gzip $BACKUP_DIR/sharelocal_$DATE.sql

# Lösche Backups älter als 30 Tage
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
EOF

chmod +x /opt/sharelocal/backup-db.sh

# Füge zu Cron hinzu (täglich um 2 Uhr)
crontab -e
# Füge hinzu:
0 2 * * * /opt/sharelocal/backup-db.sh
```

---

## Checkliste für Deployment

### Vor dem Deployment
- [ ] Docker und Docker Compose installiert
- [ ] Nginx installiert und konfiguriert
- [ ] Environment Variables gesetzt (`.env.production`)
- [ ] Secrets generiert (JWT_SECRET, ENCRYPTION_KEY)
- [ ] Database Container läuft
- [ ] Migrations ausgeführt
- [ ] Nginx Config getestet

### Nach dem Deployment
- [ ] Alle Container laufen (`docker compose ps`)
- [ ] Health Checks funktionieren
- [ ] Web-App erreichbar (`https://nuernbergspots.de/share-local/prd`)
- [ ] API erreichbar (`https://nuernbergspots.de/share-local/prd/api/health`)
- [ ] SSL-Zertifikat gültig (falls konfiguriert)
- [ ] Logs werden geschrieben
- [ ] Backups konfiguriert

---

## Nächste Schritte

1. ✅ Docker Setup erstellt
2. ✅ Nginx Configs erstellt
3. ⏳ Server-Setup durchführen
4. ⏳ Erste Deployment testen
5. ⏳ SSL-Zertifikate einrichten
6. ⏳ Monitoring einrichten

