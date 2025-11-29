# Nächste Schritte - Deployment auf IONOS

## Übersicht

Dieser Guide führt dich Schritt für Schritt durch das erste Deployment auf den IONOS-Server.

---

## Schritt 1: Server-Vorbereitung (auf dem Server)

### 1.1 SSH zum Server

```bash
ssh user@nuernbergspots.de
```

### 1.2 Verzeichnisse erstellen

```bash
# Erstelle Verzeichnisse für beide Environments
sudo mkdir -p /opt/sharelocal/{dev,prd,backups}
sudo chown -R $USER:$USER /opt/sharelocal
```

### 1.3 Repository klonen

```bash
# Für Production
cd /opt/sharelocal/prd
git clone <repository-url> .

# Für Development (optional, später)
cd /opt/sharelocal/dev
git clone <repository-url> .
```

### 1.4 Server Setup Script ausführen

```bash
cd /opt/sharelocal/prd

# Führe Setup-Script aus (benötigt sudo)
sudo ./scripts/setup-server.sh
```

**Was passiert:**
- ✅ Prüft/Installiert Docker
- ✅ Prüft/Installiert Docker Compose
- ✅ Prüft/Installiert Nginx
- ✅ Erstellt Verzeichnisse
- ✅ Kopiert Nginx Configs

---

## Schritt 2: Secrets generieren

### 2.1 Generiere sichere Secrets

```bash
# Auf dem Server oder lokal
openssl rand -base64 32  # Für JWT_SECRET
openssl rand -base64 32  # Für ENCRYPTION_KEY
openssl rand -base64 32  # Für POSTGRES_PASSWORD
```

**Wichtig:** Speichere diese Secrets sicher! Du brauchst sie für die `.env` Dateien.

---

## Schritt 3: Environment Variables konfigurieren

### 3.1 Erstelle .env Dateien

```bash
cd /opt/sharelocal/prd

# Kopiere Template
cp .env.production.example .env.production

# Bearbeite die Datei
nano .env.production
```

### 3.2 Fülle .env.production aus

**Wichtig:** Ersetze alle `CHANGE-ME` Werte mit deinen generierten Secrets:

```env
# Database
POSTGRES_USER=sharelocal
POSTGRES_PASSWORD=<DEIN_GENERIERTES_PASSWORD>
POSTGRES_DB=sharelocal

# API Configuration
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://sharelocal:<DEIN_PASSWORD>@postgres:5432/sharelocal?schema=public
JWT_SECRET=<DEIN_GENERIERTES_JWT_SECRET>
ENCRYPTION_KEY=<DEIN_GENERIERTES_ENCRYPTION_KEY>
LOG_LEVEL=info

# Web Configuration
NEXT_PUBLIC_API_URL=https://nuernbergspots.de/share-local/prd/api
NEXT_PUBLIC_BASE_PATH=/share-local/prd
```

**Für Development (später):**
```env
NEXT_PUBLIC_API_URL=http://nuernbergspots.de/share-local/dev/api
NEXT_PUBLIC_BASE_PATH=/share-local/dev
NODE_ENV=development
```

### 3.3 Prüfe Environment Variables

```bash
# Lade Environment Variables
export $(cat .env.production | grep -v '^#' | xargs)

# Prüfe ob alle gesetzt sind
echo $JWT_SECRET
echo $ENCRYPTION_KEY
echo $DATABASE_URL
```

---

## Schritt 4: Erste Deployment

### 4.1 Deploye Production Environment

```bash
cd /opt/sharelocal/prd

# Lade Environment Variables
export $(cat .env.production | grep -v '^#' | xargs)

# Führe Deployment-Script aus
./scripts/deploy-to-server.sh prd
```

**Was passiert:**
1. ✅ Docker Images werden gebaut
2. ✅ PostgreSQL Container startet
3. ✅ Database Migrations werden ausgeführt
4. ✅ API und Web Container starten
5. ✅ Health Checks werden geprüft

### 4.2 Prüfe ob alles läuft

```bash
# Container Status
docker compose ps

# Logs ansehen
docker compose logs -f

# Health Check (lokal auf Server)
curl http://localhost:3001/health
```

**Erwartete Ausgabe:**
```json
{"status":"ok","checks":{"api":"ok","database":"ok","encryption":"ok"},"timestamp":"...","uptime":123,"version":"0.1.0"}
```

---

## Schritt 5: Nginx konfigurieren

### 5.1 Nginx Configs kopieren

```bash
# Auf dem Server
cd /opt/sharelocal/prd

# Kopiere Configs
sudo cp infrastructure/nginx/share-local-prd.conf /etc/nginx/sites-available/share-local-prd
sudo cp infrastructure/nginx/share-local-dev.conf /etc/nginx/sites-available/share-local-dev

# Erstelle Symlinks
sudo ln -sf /etc/nginx/sites-available/share-local-prd /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/share-local-dev /etc/nginx/sites-enabled/
```

### 5.2 Nginx Config anpassen (falls nötig)

```bash
# Prüfe ob Ports korrekt sind
sudo nano /etc/nginx/sites-available/share-local-prd
```

**Prüfe:**
- `proxy_pass http://localhost:3000` → Web Container Port
- `proxy_pass http://localhost:3001` → API Container Port

**Falls Docker Container andere Ports verwenden**, passe die Config an.

### 5.3 Nginx testen und neu laden

```bash
# Teste Config
sudo nginx -t

# Falls OK, lade Nginx neu
sudo systemctl reload nginx
```

---

## Schritt 6: Testen

### 6.1 Prüfe ob alles erreichbar ist

```bash
# API Health Check (via Nginx)
curl http://nuernbergspots.de/share-local/prd/api/health

# Sollte zurückgeben:
# {"status":"ok","checks":{...}}
```

### 6.2 Teste Web-App im Browser

Öffne im Browser:
- **Production**: `http://nuernbergspots.de/share-local/prd`
- **API**: `http://nuernbergspots.de/share-local/prd/api/health`

### 6.3 Prüfe Logs bei Problemen

```bash
# Nginx Error Logs
sudo tail -f /var/log/nginx/error.log

# Container Logs
docker compose logs -f api
docker compose logs -f web
```

---

## Schritt 7: SSL/TLS einrichten (Optional, aber empfohlen)

### 7.1 Let's Encrypt installieren

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

### 7.2 SSL-Zertifikat erstellen

```bash
sudo certbot --nginx -d nuernbergspots.de
```

**Certbot wird:**
- ✅ SSL-Zertifikat erstellen
- ✅ Nginx automatisch für HTTPS konfigurieren
- ✅ Automatische Erneuerung einrichten

### 7.3 Teste HTTPS

```bash
# Prüfe ob HTTPS funktioniert
curl https://nuernbergspots.de/share-local/prd/api/health
```

---

## Schritt 8: Development Environment (Optional)

Falls du auch ein Dev-Environment einrichten möchtest:

```bash
cd /opt/sharelocal/dev

# Repository klonen (falls noch nicht geschehen)
git clone <repository-url> .

# Erstelle .env.dev
cp .env.production.example .env.dev
nano .env.dev

# Setze Dev-spezifische Variablen:
# NEXT_PUBLIC_API_URL=http://nuernbergspots.de/share-local/dev/api
# NEXT_PUBLIC_BASE_PATH=/share-local/dev
# NODE_ENV=development

# Deploye
export $(cat .env.dev | grep -v '^#' | xargs)
./scripts/deploy-to-server.sh dev
```

---

## Checkliste

### Vor dem Deployment
- [ ] Server Setup Script ausgeführt
- [ ] Secrets generiert (JWT_SECRET, ENCRYPTION_KEY, POSTGRES_PASSWORD)
- [ ] `.env.production` erstellt und ausgefüllt
- [ ] Environment Variables geprüft

### Nach dem Deployment
- [ ] Container laufen (`docker compose ps`)
- [ ] Health Checks funktionieren (`curl http://localhost:3001/health`)
- [ ] Nginx konfiguriert und neu geladen
- [ ] Web-App erreichbar (`http://nuernbergspots.de/share-local/prd`)
- [ ] API erreichbar (`http://nuernbergspots.de/share-local/prd/api/health`)
- [ ] SSL-Zertifikat eingerichtet (optional)

---

## Troubleshooting

### Problem: Container startet nicht

```bash
# Prüfe Logs
docker compose logs api
docker compose logs web

# Prüfe Environment Variables
docker compose config
```

### Problem: Database Connection Error

```bash
# Prüfe Database Container
docker compose ps postgres
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
# Prüfe Environment Variables
docker compose exec web env | grep BASE_PATH

# Prüfe Next.js Build
docker compose exec web ls -la packages/web/.next
```

---

## Nächste Schritte nach erfolgreichem Deployment

1. ✅ **Monitoring einrichten** - Health Checks überwachen
2. ✅ **Backups testen** - Backup-Script testen
3. ✅ **SSL einrichten** - Let's Encrypt konfigurieren
4. ✅ **Domain testen** - Alle Features testen
5. ✅ **Performance optimieren** - Falls nötig

---

## Support

Bei Problemen:
- Siehe `docs/IONOS_DEPLOYMENT.md` für detaillierte Anleitung
- Siehe `docs/QUICK_START_DEPLOYMENT.md` für Schnellstart
- Prüfe Logs: `docker compose logs -f`

