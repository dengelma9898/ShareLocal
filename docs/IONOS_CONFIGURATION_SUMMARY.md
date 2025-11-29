# IONOS Configuration Summary

## Was wurde konfiguriert

### ✅ Docker Setup
- **API Dockerfile**: Multi-stage Build, optimiert für Production
- **Web Dockerfile**: Next.js mit standalone output, basePath Support
- **Docker Compose**: Separate Configs für dev und prd

### ✅ Nginx Configuration
- **Sub-Path Routing**: `/share-local/dev` und `/share-local/prd`
- **API Routing**: `/share-local/{env}/api` → API Container
- **Web Routing**: `/share-local/{env}` → Web Container
- **Rewrite Rules**: Entfernen des Prefixes vor dem Proxying

### ✅ Next.js Configuration
- **basePath**: Dynamisch via `NEXT_PUBLIC_BASE_PATH`
- **API URL**: Dynamisch via `NEXT_PUBLIC_API_URL`
- **Standalone Output**: Für optimale Docker-Performance

---

## Wichtige Konfigurationen

### Environment Variables

**Production:**
```env
NEXT_PUBLIC_API_URL=https://nuernbergspots.de/share-local/prd/api
NEXT_PUBLIC_BASE_PATH=/share-local/prd
```

**Development:**
```env
NEXT_PUBLIC_API_URL=http://nuernbergspots.de/share-local/dev/api
NEXT_PUBLIC_BASE_PATH=/share-local/dev
```

### Docker Compose Ports

- **Web**: Port 3000 (intern)
- **API**: Port 3001 (intern)
- **PostgreSQL**: Port 5432 (intern)

**Wichtig**: Ports sind nur intern verfügbar. Nginx routet externe Requests.

### Nginx Routing

```
Externer Request: https://nuernbergspots.de/share-local/prd/listings
                    ↓
Nginx entfernt Prefix: /listings
                    ↓
Proxy zu Container: http://localhost:3000/listings
                    ↓
Next.js mit basePath: /share-local/prd/listings
```

---

## Deployment Workflow

### 1. Code auf Server
```bash
cd /opt/sharelocal/prd
git pull
```

### 2. Environment Variables setzen
```bash
export $(cat .env.production | grep -v '^#' | xargs)
```

### 3. Deployen
```bash
./scripts/deploy-to-server.sh prd
```

### 4. Nginx neu laden (falls Config geändert)
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Was du noch brauchst

### Von IONOS/Server
- [x] Docker verfügbar ✅
- [ ] **PostgreSQL**: Docker Container oder Managed?
- [ ] **Ports**: Sind 3000 und 3001 verfügbar?
- [ ] **SSL**: Soll Let's Encrypt eingerichtet werden?

### Secrets generieren
- [ ] **JWT_SECRET**: `openssl rand -base64 32`
- [ ] **ENCRYPTION_KEY**: `openssl rand -base64 32`
- [ ] **POSTGRES_PASSWORD**: `openssl rand -base64 32`

---

## Nächste Schritte

1. **Server Setup**: Führe `scripts/setup-server.sh` auf dem Server aus
2. **Environment Variables**: Erstelle `.env.production` und `.env.dev`
3. **Erste Deployment**: Führe `scripts/deploy-to-server.sh prd` aus
4. **Nginx konfigurieren**: Kopiere Configs und lade Nginx neu
5. **Testen**: Prüfe ob alles funktioniert

---

## Support

Bei Problemen siehe:
- `docs/IONOS_DEPLOYMENT.md` - Detaillierte Anleitung
- `docs/QUICK_START_DEPLOYMENT.md` - Schnellstart
- `docs/DEPLOYMENT_CHECKLIST.md` - Checkliste

