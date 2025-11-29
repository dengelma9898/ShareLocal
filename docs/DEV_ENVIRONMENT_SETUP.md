# Development Environment Setup - ShareLocal

## Übersicht

Anleitung für das Setup des Development Environment unter `nuernbergspots.de/share-local/dev`.

---

## Schritt 1: Server-Vorbereitung (einmalig)

### 1.1 SSH zum Server

```bash
ssh user@nuernbergspots.de
```

### 1.2 Verzeichnis erstellen

```bash
# Erstelle Dev-Verzeichnis (falls noch nicht vorhanden)
sudo mkdir -p /opt/sharelocal/dev
sudo chown -R $USER:$USER /opt/sharelocal/dev
```

### 1.3 Repository klonen

```bash
cd /opt/sharelocal/dev
git clone <repository-url> .
```

**Hinweis:** Falls du bereits das Production Repository hast, kannst du auch ein separates Dev-Repository klonen oder einen anderen Branch verwenden.

---

## Schritt 2: Server Setup (falls noch nicht gemacht)

Falls du das Server Setup noch nicht für Production gemacht hast:

```bash
cd /opt/sharelocal/dev
sudo ./scripts/setup-server.sh
```

**Was passiert:**
- ✅ Prüft/Installiert Docker
- ✅ Prüft/Installiert Docker Compose
- ✅ Prüft/Installiert Nginx
- ✅ Erstellt Verzeichnisse
- ✅ Kopiert Nginx Configs

**Hinweis:** Dies muss nur einmal gemacht werden, auch wenn du später Production deployst.

---

## Schritt 3: Secrets generieren

### 3.1 Generiere Secrets für Development

```bash
# Auf dem Server oder lokal
openssl rand -base64 32  # Für JWT_SECRET
openssl rand -base64 32  # Für ENCRYPTION_KEY
openssl rand -base64 32  # Für POSTGRES_PASSWORD
```

**Wichtig für Dev:**
- Du kannst die gleichen Secrets wie Production verwenden (einfacher)
- Oder separate Secrets für bessere Isolation
- Speichere diese Secrets sicher!

---

## Schritt 4: Environment Variables konfigurieren

### 4.1 Erstelle .env.dev Datei

```bash
cd /opt/sharelocal/dev

# Kopiere Template
cp .env.production.example .env.dev

# Bearbeite die Datei
nano .env.dev
```

### 4.2 Fülle .env.dev aus

**Wichtig:** Setze alle Werte, besonders die Dev-spezifischen:

```env
# Database (kann separate Dev-DB sein)
POSTGRES_USER=sharelocal
POSTGRES_PASSWORD=<DEIN_GENERIERTES_PASSWORD>
POSTGRES_DB=sharelocal_dev  # Separate Dev-Database

# API Configuration
NODE_ENV=development  # WICHTIG: development für Dev
PORT=3001
DATABASE_URL=postgresql://sharelocal:<DEIN_PASSWORD>@postgres:5432/sharelocal_dev?schema=public
JWT_SECRET=<DEIN_GENERIERTES_JWT_SECRET>
ENCRYPTION_KEY=<DEIN_GENERIERTES_ENCRYPTION_KEY>
LOG_LEVEL=debug  # Mehr Logging für Dev

# Web Configuration
NEXT_PUBLIC_API_URL=http://nuernbergspots.de/share-local/dev/api  # HTTP für Dev
NEXT_PUBLIC_BASE_PATH=/share-local/dev
```

**Wichtige Unterschiede zu Production:**
- `NODE_ENV=development` (statt `production`)
- `LOG_LEVEL=debug` (statt `info`)
- `NEXT_PUBLIC_API_URL` mit `http://` (statt `https://`)
- Separate Database: `sharelocal_dev` (optional, aber empfohlen)

### 4.3 Prüfe Environment Variables

```bash
# Lade Environment Variables
export $(cat .env.dev | grep -v '^#' | xargs)

# Prüfe ob alle gesetzt sind
echo $JWT_SECRET
echo $ENCRYPTION_KEY
echo $DATABASE_URL
echo $NEXT_PUBLIC_BASE_PATH
```

---

## Schritt 5: Docker Compose für Dev anpassen

### 5.1 Prüfe docker-compose.dev.yml

Das Dev-Override sollte bereits konfiguriert sein. Falls nicht, erstelle es:

```bash
cd /opt/sharelocal/dev
cat docker-compose.dev.yml
```

**Sollte enthalten:**
- Development-Modus für API und Web
- Volume-Mounts für Hot Reload
- Dev-spezifische Environment Variables

---

## Schritt 6: Erste Deployment

### 6.1 Deploye Development Environment

```bash
cd /opt/sharelocal/dev

# Lade Environment Variables
export $(cat .env.dev | grep -v '^#' | xargs)

# Führe Deployment-Script aus
./scripts/deploy-to-server.sh dev
```

**Was passiert:**
1. ✅ Docker Images werden gebaut (mit Dev-Config)
2. ✅ PostgreSQL Container startet (mit Dev-Database)
3. ✅ Database Migrations werden ausgeführt
4. ✅ API und Web Container starten (Development-Modus)
5. ✅ Health Checks werden geprüft

### 6.2 Prüfe ob alles läuft

```bash
# Container Status
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps

# Logs ansehen (mit Hot Reload Output)
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Health Check (lokal auf Server)
curl http://localhost:3001/health
```

**Erwartete Ausgabe:**
```json
{"status":"ok","checks":{"api":"ok","database":"ok","encryption":"ok"},"timestamp":"...","uptime":123,"version":"0.1.0"}
```

---

## Schritt 7: Nginx konfigurieren

### 7.1 Nginx Dev Config kopieren

```bash
cd /opt/sharelocal/dev

# Kopiere Dev Config
sudo cp infrastructure/nginx/share-local-dev.conf /etc/nginx/sites-available/share-local-dev

# Erstelle Symlink
sudo ln -sf /etc/nginx/sites-available/share-local-dev /etc/nginx/sites-enabled/
```

### 7.2 Nginx Config anpassen (falls nötig)

```bash
# Prüfe ob Ports korrekt sind
sudo nano /etc/nginx/sites-available/share-local-dev
```

**Prüfe:**
- `proxy_pass http://localhost:3000` → Web Container Port
- `proxy_pass http://localhost:3001` → API Container Port

**Wichtig für Dev:**
- WebSocket Support sollte aktiviert sein (für Hot Reload)
- CORS Headers sollten permissiv sein

### 7.3 Nginx testen und neu laden

```bash
# Teste Config
sudo nginx -t

# Falls OK, lade Nginx neu
sudo systemctl reload nginx
```

---

## Schritt 8: Testen

### 8.1 Prüfe ob alles erreichbar ist

```bash
# API Health Check (via Nginx)
curl http://nuernbergspots.de/share-local/dev/api/health

# Sollte zurückgeben:
# {"status":"ok","checks":{...}}
```

### 8.2 Teste Web-App im Browser

Öffne im Browser:
- **Development**: `http://nuernbergspots.de/share-local/dev`
- **API**: `http://nuernbergspots.de/share-local/dev/api/health`

### 8.3 Prüfe Hot Reload (Development)

In Development-Modus sollten Code-Änderungen automatisch neu geladen werden:

```bash
# Ändere eine Datei
nano packages/api/src/index.ts

# Prüfe Logs - sollte automatisch neu starten
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f api
```

---

## Schritt 9: Code-Änderungen deployen

### 9.1 Code aktualisieren

```bash
cd /opt/sharelocal/dev

# Pull latest code
git pull

# Oder: Checkout bestimmten Branch
git checkout develop
git pull
```

### 9.2 Container neu starten

**Für Development (mit Hot Reload):**
```bash
# Container sollten automatisch neu laden
# Falls nicht, restart:
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart api
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart web
```

**Für größere Änderungen (Rebuild nötig):**
```bash
# Rebuild Images
docker compose -f docker-compose.yml -f docker-compose.dev.yml build

# Restart Services
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

---

## Schritt 10: Database Migrations (Dev)

### 10.1 Neue Migrations ausführen

```bash
cd /opt/sharelocal/dev

# Führe Migrations aus
docker compose -f docker-compose.yml -f docker-compose.dev.yml run --rm api pnpm --filter @sharelocal/database db:push
```

**Hinweis:** In Development kannst du `db:push` verwenden (schneller, aber nicht für Production).

---

## Unterschiede: Dev vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| **NODE_ENV** | `development` | `production` |
| **LOG_LEVEL** | `debug` | `info` |
| **Hot Reload** | ✅ Aktiv | ❌ Deaktiviert |
| **Source Maps** | ✅ Aktiv | ❌ Deaktiviert |
| **API URL** | `http://` | `https://` |
| **Database** | `sharelocal_dev` | `sharelocal` |
| **Build** | Development Build | Optimized Production Build |
| **Volumes** | Source Code gemountet | Nur Built Files |

---

## Nützliche Commands für Dev

### Logs ansehen

```bash
# Alle Logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Nur API Logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f api

# Nur Web Logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f web
```

### Container Status

```bash
# Status aller Container
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps

# Health Checks
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps --format "table {{.Name}}\t{{.Status}}"
```

### Database Zugriff

```bash
# PostgreSQL Shell
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U sharelocal -d sharelocal_dev

# Database Backup (Dev)
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres pg_dump -U sharelocal sharelocal_dev > backup_dev.sql
```

### Container neu starten

```bash
# Alle Container
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart

# Nur API
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart api

# Nur Web
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart web
```

---

## Troubleshooting

### Problem: Hot Reload funktioniert nicht

```bash
# Prüfe ob Volumes korrekt gemountet sind
docker compose -f docker-compose.yml -f docker-compose.dev.yml config | grep volumes

# Prüfe Container Logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs api | grep -i "watch\|reload"
```

### Problem: Code-Änderungen werden nicht übernommen

```bash
# Prüfe ob Development-Modus aktiv ist
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec api env | grep NODE_ENV

# Sollte zeigen: NODE_ENV=development

# Falls nicht, restart Container
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart
```

### Problem: Database Connection Error

```bash
# Prüfe Database Container
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps postgres

# Prüfe Database Logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs postgres

# Teste Connection
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec api node -e "console.log(process.env.DATABASE_URL)"
```

---

## Checkliste für Dev Setup

### Vor dem Deployment
- [ ] Server Setup ausgeführt (einmalig)
- [ ] Secrets generiert
- [ ] `.env.dev` erstellt und ausgefüllt
- [ ] `NODE_ENV=development` gesetzt
- [ ] `NEXT_PUBLIC_BASE_PATH=/share-local/dev` gesetzt
- [ ] Separate Dev-Database konfiguriert (optional)

### Nach dem Deployment
- [ ] Container laufen (`docker compose ps`)
- [ ] Health Checks funktionieren
- [ ] Nginx konfiguriert
- [ ] Web-App erreichbar (`http://nuernbergspots.de/share-local/dev`)
- [ ] API erreichbar (`http://nuernbergspots.de/share-local/dev/api/health`)
- [ ] Hot Reload funktioniert (Code-Änderungen werden übernommen)

---

## URLs für Development

- **Web**: `http://nuernbergspots.de/share-local/dev`
- **API**: `http://nuernbergspots.de/share-local/dev/api`
- **Health**: `http://nuernbergspots.de/share-local/dev/api/health`

---

## Nächste Schritte

1. ✅ Dev Environment deployed
2. ✅ Hot Reload funktioniert
3. ⏳ Code-Änderungen testen
4. ⏳ Features entwickeln und testen
5. ⏳ Nach erfolgreichen Tests → Production deployen

