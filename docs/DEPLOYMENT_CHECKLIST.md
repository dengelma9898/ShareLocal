# Deployment Checklist - ShareLocal

## Was wurde erstellt

### ✅ Docker Setup
- [x] `packages/api/Dockerfile` - Multi-stage Build für API
- [x] `packages/web/Dockerfile` - Multi-stage Build für Next.js mit basePath Support
- [x] `packages/api/.dockerignore` - Ignore-Regeln für API
- [x] `packages/web/.dockerignore` - Ignore-Regeln für Web
- [x] `docker-compose.yml` - Basis-Konfiguration
- [x] `docker-compose.dev.yml` - Development Override
- [x] `docker-compose.prd.yml` - Production Override

### ✅ Nginx Configuration
- [x] `infrastructure/nginx/share-local-dev.conf` - Dev Environment Config
- [x] `infrastructure/nginx/share-local-prd.conf` - Production Config

### ✅ Next.js Configuration
- [x] `packages/web/next.config.js` - basePath Support hinzugefügt
- [x] Standalone Output für Docker

### ✅ Documentation
- [x] `docs/DEPLOYMENT_PLAN.md` - Allgemeiner Deployment-Plan
- [x] `docs/IONOS_DEPLOYMENT.md` - IONOS-spezifischer Guide
- [x] `.env.production.example` - Environment Variables Template

---

## Was du noch brauchst (von IONOS/Server)

### Server-Informationen
- [ ] **SSH-Zugang** zum Server
- [ ] **Docker** installiert? (prüfen mit `docker --version`)
- [ ] **Docker Compose** installiert? (prüfen mit `docker compose version`)
- [ ] **Nginx** installiert? (prüfen mit `nginx -v`)
- [ ] **PostgreSQL** verfügbar? (Docker Container oder Managed)

### Domain & Routing
- [x] Domain: `nuernbergspots.de` ✅
- [ ] **Nginx** muss konfiguriert werden für `/share-local/dev` und `/share-local/prd`
- [ ] **Ports** müssen verfügbar sein (3000 für Web, 3001 für API)

### Secrets & Environment Variables
- [ ] **JWT_SECRET** generieren (32+ Zeichen)
- [ ] **ENCRYPTION_KEY** generieren (32+ Zeichen)
- [ ] **POSTGRES_PASSWORD** generieren
- [ ] **DATABASE_URL** konfigurieren

---

## Nächste Schritte

### 1. IONOS Docker Support prüfen

**Frage an dich:** Unterstützt dein IONOS-Server Docker?

```bash
# Auf dem Server prüfen:
ssh user@nuernbergspots.de
docker --version
docker compose version
```

**Falls nicht:**
- IONOS Managed Hosting unterstützt oft kein Docker
- Alternative: VPS bei IONOS (falls verfügbar)
- Oder: Separate Docker-Hosting-Lösung

### 2. Lokales Testen

Bevor wir auf den Server deployen, sollten wir lokal testen:

```bash
# Lokal Docker Compose testen
docker compose up --build

# Prüfe ob alles läuft
curl http://localhost:3001/health
curl http://localhost:3000
```

### 3. Server-Setup (wenn Docker verfügbar)

Siehe: `docs/IONOS_DEPLOYMENT.md` für detaillierte Anleitung

---

## Wichtige Konfigurationen

### Next.js basePath

Die Web-App muss wissen, dass sie unter `/share-local/dev` oder `/share-local/prd` läuft:

**Environment Variables:**
```env
NEXT_PUBLIC_BASE_PATH=/share-local/dev  # oder /share-local/prd
NEXT_PUBLIC_API_URL=http://nuernbergspots.de/share-local/dev/api
```

### API Routing

Die API läuft intern auf Port 3001, wird aber über Nginx unter `/share-local/dev/api` exponiert.

**Nginx** entfernt das `/share-local/dev` Prefix und leitet an den Container weiter.

---

## Fragen für dich

1. **Docker verfügbar?** Kannst du Docker auf dem IONOS-Server installieren/verwenden?
2. **PostgreSQL?** Hast du bereits eine PostgreSQL-Datenbank oder sollen wir eine im Docker Container starten?
3. **Ports?** Sind Ports 3000 und 3001 auf dem Server verfügbar?
4. **SSL?** Soll SSL/HTTPS eingerichtet werden (Let's Encrypt)?

---

## Alternative: Ohne Docker

Falls Docker nicht verfügbar ist, können wir auch:

1. **PM2** für Node.js Prozesse verwenden
2. **Nginx** als Reverse Proxy (wie jetzt)
3. **PostgreSQL** als Managed Service oder lokal installiert

Sag mir Bescheid, welche Option du bevorzugst!

