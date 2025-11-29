# ShareLocal Deployment - Übersicht

## 🎯 Ziel

ShareLocal unter `nuernbergspots.de/share-local/dev` und `/share-local/prd` deployen.

## ✅ Was wurde erstellt

### Docker Setup
- ✅ `packages/api/Dockerfile` - Multi-stage Build für API
- ✅ `packages/web/Dockerfile` - Multi-stage Build für Next.js
- ✅ `docker-compose.yml` - Basis-Konfiguration
- ✅ `docker-compose.dev.yml` - Development Override
- ✅ `docker-compose.prd.yml` - Production Override

### Nginx Configuration
- ✅ `infrastructure/nginx/share-local-dev.conf` - Dev Environment
- ✅ `infrastructure/nginx/share-local-prd.conf` - Production Environment

### Deployment Scripts
- ✅ `scripts/setup-server.sh` - Server Setup (einmalig)
- ✅ `scripts/deploy-to-server.sh` - Deployment Automation

### Dokumentation
- ✅ `docs/IONOS_DEPLOYMENT.md` - Detaillierte Anleitung
- ✅ `docs/QUICK_START_DEPLOYMENT.md` - Schnellstart
- ✅ `docs/IONOS_CONFIGURATION_SUMMARY.md` - Konfigurations-Übersicht
- ✅ `.env.production.example` - Environment Variables Template

## 🚀 Quick Start

### 1. Server Setup (einmalig)
```bash
ssh user@nuernbergspots.de
cd /opt/sharelocal/prd
git clone <repo-url> .
sudo ./scripts/setup-server.sh
```

### 2. Environment Variables
```bash
cp .env.production.example .env.production
# Bearbeite .env.production und setze alle Werte
```

### 3. Deployen
```bash
./scripts/deploy-to-server.sh prd
```

### 4. Nginx konfigurieren
```bash
sudo cp infrastructure/nginx/share-local-prd.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/share-local-prd /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📚 Dokumentation

- **Schnellstart**: `docs/QUICK_START_DEPLOYMENT.md`
- **Detailliert**: `docs/IONOS_DEPLOYMENT.md`
- **Konfiguration**: `docs/IONOS_CONFIGURATION_SUMMARY.md`
- **Checkliste**: `docs/DEPLOYMENT_CHECKLIST.md`

## 🔧 Was du noch brauchst

1. **Secrets generieren**:
   ```bash
   openssl rand -base64 32  # JWT_SECRET
   openssl rand -base64 32  # ENCRYPTION_KEY
   openssl rand -base64 32  # POSTGRES_PASSWORD
   ```

2. **PostgreSQL**: Docker Container oder Managed?

3. **SSL**: Soll Let's Encrypt eingerichtet werden?

## 🌐 URLs nach Deployment

- **Production Web**: `https://nuernbergspots.de/share-local/prd`
- **Production API**: `https://nuernbergspots.de/share-local/prd/api`
- **Development Web**: `http://nuernbergspots.de/share-local/dev`
- **Development API**: `http://nuernbergspots.de/share-local/dev/api`

