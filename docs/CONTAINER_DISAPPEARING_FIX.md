# Container Disappearing Fix - ShareLocal Web Dev

## Problem

Container `sharelocal-web-dev` startet erfolgreich, verschwindet aber nach wenigen Minuten.

**Symptom:**
- Container ist nach Deployment sichtbar (`docker ps` zeigt ihn)
- Status: `Up X minutes (health: starting)`
- Nach kurzer Zeit: Container ist nicht mehr in `docker ps`
- `curl http://localhost:3002/share-local/dev` schlägt fehl

---

## Mögliche Ursachen

### 1. Health Check schlägt fehl

**Problem:** Health Check kann `/health` Endpoint nicht erreichen

**Prüfen:**
```bash
# Auf dem Server
docker ps -a | grep sharelocal-web-dev
docker inspect sharelocal-web-dev | grep -A 10 Health
docker logs sharelocal-web-dev --tail 50
```

**Mögliche Gründe:**
- Health Endpoint existiert nicht oder ist falsch konfiguriert
- Next.js Server läuft nicht auf dem erwarteten Port
- basePath verhindert Zugriff auf `/health`

### 2. Container crasht beim Start

**Problem:** Next.js Server kann nicht starten

**Prüfen:**
```bash
# Container Logs prüfen (auch wenn gestoppt)
docker logs sharelocal-web-dev --tail 100

# Prüfe Exit Code
docker inspect sharelocal-web-dev --format='{{.State.ExitCode}}'
```

**Mögliche Gründe:**
- `server.js` fehlt oder ist falsch
- basePath-Konfiguration verursacht Fehler
- Port-Konflikt
- Fehlende Dependencies

### 3. Cleanup-Script entfernt Container

**Problem:** Ein Script entfernt alte Container automatisch

**Prüfen:**
```bash
# Prüfe ob es Cleanup-Scripts gibt
find /opt /root /home -name "*cleanup*" -o -name "*prune*" 2>/dev/null | grep -i docker

# Prüfe Cron Jobs
crontab -l | grep docker
```

### 4. Docker Auto-Remove bei Exit

**Problem:** Container wurde mit `--rm` Flag gestartet

**Prüfen:**
```bash
# Prüfe ob Container mit --rm gestartet wurde
docker inspect sharelocal-web-dev --format='{{.HostConfig.AutoRemove}}'
```

---

## Debugging-Schritte

### Schritt 1: Prüfe Container Status (auch gestoppt)

```bash
# Zeige alle Container (auch gestoppte)
docker ps -a | grep sharelocal-web-dev

# Prüfe Exit Code und Status
docker inspect sharelocal-web-dev --format='{{.State.Status}} {{.State.ExitCode}} {{.State.Error}}'
```

### Schritt 2: Prüfe Container Logs

```bash
# Vollständige Logs
docker logs sharelocal-web-dev --tail 100

# Prüfe nach Fehlern
docker logs sharelocal-web-dev 2>&1 | grep -i error
docker logs sharelocal-web-dev 2>&1 | grep -i "cannot\|failed\|error"
```

### Schritt 3: Prüfe Health Check

```bash
# Prüfe Health Check Konfiguration
docker inspect sharelocal-web-dev --format='{{json .Config.Healthcheck}}' | jq

# Prüfe Health Check Status
docker inspect sharelocal-web-dev --format='{{json .State.Health}}' | jq
```

### Schritt 4: Teste Container manuell

```bash
# Starte Container manuell ohne Auto-Remove
docker run -d \
  --name sharelocal-web-dev-test \
  -p 3003:3002 \
  --restart unless-stopped \
  --network sharelocal-network \
  -e NODE_ENV=development \
  -e PORT=3002 \
  -e NEXT_PUBLIC_API_URL="http://nuernbergspots.de/share-local/dev/api" \
  -e NEXT_PUBLIC_BASE_PATH="/share-local/dev" \
  dengelma/sharelocal-web-dev:latest

# Beobachte Container
watch -n 1 'docker ps | grep sharelocal-web-dev-test'

# Prüfe Logs in Echtzeit
docker logs -f sharelocal-web-dev-test
```

### Schritt 5: Prüfe ob Health Endpoint funktioniert

```bash
# Teste Health Endpoint direkt im Container
docker exec sharelocal-web-dev-test curl http://localhost:3002/health

# Oder teste von außen
curl http://localhost:3003/health
```

---

## Mögliche Fixes

### Fix 1: Health Check anpassen

**Problem:** Health Check verwendet falschen Port oder Pfad

**Lösung:** Dockerfile Health Check anpassen:

```dockerfile
# Aktuell:
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const port = process.env.PORT || '3000'; require('http').get(`http://localhost:${port}/health`, (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Mit basePath:
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=5 \
  CMD node -e "const port = process.env.PORT || '3000'; const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''; require('http').get(`http://localhost:${port}${basePath}/health`, (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

**Wichtig:** `start-period` erhöhen, damit Next.js Zeit zum Starten hat!

### Fix 2: Health Check deaktivieren (temporär)

**Problem:** Health Check schlägt fehl, Container wird als "unhealthy" markiert

**Lösung:** Health Check temporär deaktivieren, um zu prüfen ob Container ohne ihn läuft:

```dockerfile
# Kommentiere Health Check aus
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD node -e "..."
```

### Fix 3: Container ohne Auto-Remove starten

**Problem:** Container wird automatisch entfernt

**Lösung:** Stelle sicher, dass CI-Workflow kein `--rm` Flag verwendet (ist bereits korrekt)

### Fix 4: Start-Period erhöhen

**Problem:** Next.js braucht länger zum Starten

**Lösung:** `start-period` im Health Check erhöhen:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=5 \
  CMD node -e "..."
```

---

## Schnell-Diagnose Skript

```bash
#!/bin/bash
CONTAINER_NAME="sharelocal-web-dev"

echo "=== 1. Container Status (auch gestoppt) ==="
docker ps -a | grep $CONTAINER_NAME || echo "❌ Container existiert nicht"

echo ""
echo "=== 2. Container Details ==="
if docker ps -a | grep -q $CONTAINER_NAME; then
  docker inspect $CONTAINER_NAME --format='Status: {{.State.Status}}'
  docker inspect $CONTAINER_NAME --format='Exit Code: {{.State.ExitCode}}'
  docker inspect $CONTAINER_NAME --format='Error: {{.State.Error}}'
  docker inspect $CONTAINER_NAME --format='Started: {{.State.StartedAt}}'
  docker inspect $CONTAINER_NAME --format='Finished: {{.State.FinishedAt}}'
else
  echo "Container nicht gefunden"
fi

echo ""
echo "=== 3. Container Logs (letzte 50 Zeilen) ==="
docker logs $CONTAINER_NAME --tail 50 2>&1 || echo "Keine Logs verfügbar"

echo ""
echo "=== 4. Health Check Status ==="
docker inspect $CONTAINER_NAME --format='{{json .State.Health}}' 2>/dev/null | jq || echo "Kein Health Check Status"

echo ""
echo "=== 5. Prüfe ob Port 3002 belegt ist ==="
sudo lsof -i :3002 || echo "Port 3002 ist frei"

echo ""
echo "=== 6. Teste Health Endpoint (falls Container läuft) ==="
if docker ps | grep -q $CONTAINER_NAME; then
  docker exec $CONTAINER_NAME curl -s http://localhost:3002/health || echo "Health Endpoint nicht erreichbar"
else
  echo "Container läuft nicht"
fi
```

---

## Nächste Schritte

1. ✅ Führe Diagnose-Skript auf dem Server aus
2. ✅ Prüfe Container Logs für Fehler
3. ✅ Prüfe Health Check Status
4. ✅ Basierend auf Ergebnissen: Fix anwenden

**Wahrscheinlichste Ursache:** Health Check schlägt fehl, weil:
- Next.js braucht länger zum Starten (start-period zu kurz)
- Health Endpoint ist nicht erreichbar (basePath Problem?)
- Port-Konflikt

