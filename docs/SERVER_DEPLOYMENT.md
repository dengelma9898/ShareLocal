# Server Deployment - Manuelle Schritte

## Übersicht

Einfache manuelle Schritte zum Deployment auf dem Server. Keine Scripts nötig - nur Docker Compose Commands.

---

## Voraussetzungen

- ✅ Docker und Docker Compose installiert
- ✅ `docker-compose.yml` und `docker-compose.prd.registry.yml` (oder `docker-compose.dev.registry.yml`) vorhanden
- ✅ `.env.production` (oder `.env.dev`) Datei mit Environment Variables

---

## Schritt 1: Aktuelle Container stoppen

```bash
cd /opt/sharelocal/prd  # oder /opt/sharelocal/dev

# Stoppe alle Container
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml down

# Oder für Development:
# docker compose -f docker-compose.yml -f docker-compose.dev.registry.yml down
```

**Was passiert:**
- ✅ Alle laufenden Container werden gestoppt
- ✅ Container werden entfernt
- ✅ Netzwerk wird entfernt (aber Volumes bleiben erhalten)

---

## Schritt 2: Alte Images löschen (optional)

```bash
# Zeige aktuelle Images
docker images | grep sharelocal

# Lösche alte Images (optional, spart Platz)
docker rmi $(docker images | grep sharelocal | awk '{print $3}')

# Oder lösche spezifische Images:
docker rmi <username>/sharelocal-api:latest
docker rmi <username>/sharelocal-web:latest
```

**Hinweis:** Dies ist optional. Docker kann auch mit mehreren Image-Versionen umgehen.

---

## Schritt 3: Neue Images pullen

```bash
cd /opt/sharelocal/prd  # oder /opt/sharelocal/dev

# Lade Environment Variables
export $(cat .env.production | grep -v '^#' | xargs)

# Setze DOCKERHUB_USERNAME falls nicht in .env
export DOCKERHUB_USERNAME=<dein-dockerhub-username>

# Pull neueste Images von Docker Hub
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml pull

# Oder für Development:
# docker compose -f docker-compose.yml -f docker-compose.dev.registry.yml pull
```

**Was passiert:**
- ✅ Neue Images werden von Docker Hub heruntergeladen
- ✅ Images werden lokal gespeichert

---

## Schritt 4: Container neu starten

```bash
cd /opt/sharelocal/prd  # oder /opt/sharelocal/dev

# Lade Environment Variables
export $(cat .env.production | grep -v '^#' | xargs)

# Setze DOCKERHUB_USERNAME falls nicht in .env
export DOCKERHUB_USERNAME=<dein-dockerhub-username>

# Starte alle Services
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml up -d

# Oder für Development:
# docker compose -f docker-compose.yml -f docker-compose.dev.registry.yml up -d
```

**Was passiert:**
- ✅ PostgreSQL Container startet
- ✅ API Container startet
- ✅ Web Container startet
- ✅ Alle Container laufen im Hintergrund (`-d`)

---

## Schritt 5: Prüfen ob alles läuft

```bash
# Zeige Status aller Container
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml ps

# Prüfe Logs
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml logs -f

# Prüfe Health Check
curl http://localhost:3001/health
```

**Erwartete Ausgabe:**
```json
{"status":"ok","checks":{"api":"ok","database":"ok","encryption":"ok"},"timestamp":"...","uptime":123,"version":"0.1.0"}
```

---

## Komplette Befehlsfolge (Copy & Paste)

### Production

```bash
cd /opt/sharelocal/prd
export $(cat .env.production | grep -v '^#' | xargs)
export DOCKERHUB_USERNAME=<dein-dockerhub-username>

# Stoppe alte Container
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml down

# Pull neue Images
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml pull

# Starte neue Container
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml up -d

# Prüfe Status
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml ps
```

### Development

```bash
cd /opt/sharelocal/dev
export $(cat .env.dev | grep -v '^#' | xargs)
export DOCKERHUB_USERNAME=<dein-dockerhub-username>

# Stoppe alte Container
docker compose -f docker-compose.yml -f docker-compose.dev.registry.yml down

# Pull neue Images
docker compose -f docker-compose.yml -f docker-compose.dev.registry.yml pull

# Starte neue Container
docker compose -f docker-compose.yml -f docker-compose.dev.registry.yml up -d

# Prüfe Status
docker compose -f docker-compose.yml -f docker-compose.dev.registry.yml ps
```

---

## Nützliche Commands

### Logs ansehen

```bash
# Alle Logs
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml logs -f

# Nur API Logs
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml logs -f api

# Nur Web Logs
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml logs -f web
```

### Container Status

```bash
# Status aller Container
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml ps

# Detaillierte Informationen
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

### Container neu starten (ohne neue Images)

```bash
# Alle Container
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml restart

# Nur API
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml restart api

# Nur Web
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml restart web
```

### Database Migrations ausführen

```bash
# Führe Migrations aus
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml run --rm api pnpm --filter @sharelocal/database db:push
```

### Alte Images aufräumen

```bash
# Zeige alle Images
docker images | grep sharelocal

# Lösche ungenutzte Images
docker image prune -a

# Lösche alle Images (Vorsicht!)
docker rmi $(docker images -q)
```

---

## Troubleshooting

### Problem: Container startet nicht

```bash
# Prüfe Logs
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml logs api

# Prüfe ob Image existiert
docker images | grep sharelocal

# Prüfe Environment Variables
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml config
```

### Problem: Image nicht gefunden

```bash
# Prüfe DOCKERHUB_USERNAME
echo $DOCKERHUB_USERNAME

# Prüfe ob Image auf Docker Hub existiert
docker pull <username>/sharelocal-api:latest

# Prüfe Image-Namen in docker-compose
cat docker-compose.prd.registry.yml | grep image
```

### Problem: Port bereits belegt

```bash
# Prüfe welche Container Ports verwenden
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Stoppe alle Container
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml down

# Prüfe ob Port frei ist
netstat -tuln | grep 3001
```

---

## Checkliste

### Vor dem Deployment
- [ ] GitHub Secrets konfiguriert
- [ ] Images wurden von GitHub Actions gebaut und zu Docker Hub gepusht
- [ ] `.env.production` (oder `.env.dev`) vorhanden und ausgefüllt
- [ ] `DOCKERHUB_USERNAME` in `.env` gesetzt oder als Environment Variable

### Deployment
- [ ] Alte Container gestoppt (`docker compose down`)
- [ ] Neue Images gepullt (`docker compose pull`)
- [ ] Container gestartet (`docker compose up -d`)
- [ ] Status geprüft (`docker compose ps`)
- [ ] Health Check erfolgreich (`curl http://localhost:3001/health`)

---

## Unterschiede: Production vs. Development

| Command | Production | Development |
|---------|------------|-------------|
| **Compose File** | `docker-compose.prd.registry.yml` | `docker-compose.dev.registry.yml` |
| **Image Tag** | `latest` (von main Branch) | `develop` (von develop Branch) |
| **Environment File** | `.env.production` | `.env.dev` |

---

## Nächste Schritte

Nach erfolgreichem Deployment:

1. ✅ Container laufen
2. ⏳ Nginx konfigurieren (falls noch nicht gemacht)
3. ⏳ Testen: `http://nuernbergspots.de/share-local/prd` (oder `/dev`)
4. ⏳ Monitoring einrichten (optional)

