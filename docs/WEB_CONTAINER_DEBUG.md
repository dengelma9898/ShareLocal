# Web Container Debug - ShareLocal Dev

## Problem

Container `sharelocal-web-dev` läuft nicht auf dem Server, obwohl Build erfolgreich war.

## Debugging-Schritte

### Schritt 1: Prüfe ob Container existiert (auch gestoppt)

```bash
# Auf dem Server ausführen
docker ps -a | grep sharelocal-web-dev
```

**Wenn Container existiert:**
- Schaue Status (Created, Exited, etc.)
- Prüfe Exit Code

**Wenn Container nicht existiert:**
- Container wurde möglicherweise nicht gestartet
- Oder wurde bereits entfernt

### Schritt 2: Prüfe Container Logs

```bash
# Falls Container existiert (auch gestoppt)
docker logs sharelocal-web-dev --tail 50

# Oder prüfe alle Container-Logs
docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep sharelocal-web
```

### Schritt 3: Prüfe ob Port 3002 frei ist

```bash
# Prüfe ob Port 3002 belegt ist
sudo lsof -i :3002
# oder
sudo netstat -tulpn | grep 3002
```

### Schritt 4: Versuche Container manuell zu starten

```bash
# Prüfe ob Image existiert
docker images | grep sharelocal-web-dev

# Versuche Container manuell zu starten
docker run -d \
  --name sharelocal-web-dev-test \
  -p 3002:3002 \
  --restart unless-stopped \
  --network sharelocal-network \
  -e NODE_ENV=development \
  -e PORT=3002 \
  -e NEXT_PUBLIC_API_URL="http://nuernbergspots.de/share-local/dev/api" \
  -e NEXT_PUBLIC_BASE_PATH="/share-local/dev" \
  dengelma/sharelocal-web-dev:latest

# Prüfe sofort ob Container läuft
docker ps | grep sharelocal-web-dev-test

# Prüfe Logs
docker logs sharelocal-web-dev-test --tail 50
```

### Schritt 5: Prüfe GitHub Actions Logs

Falls der Container im CI-Workflow nicht gestartet wurde:
- Prüfe GitHub Actions Logs für `deploy-dev` Job
- Schaue nach Fehlermeldungen nach "Start container"
- Prüfe ob "Container started successfully" ausgegeben wurde

---

## Mögliche Probleme

### Problem 1: Container startet, aber crasht sofort

**Symptom:** Container existiert, aber Status ist "Exited"

**Lösung:** Prüfe Logs für Fehler:
```bash
docker logs sharelocal-web-dev
```

**Häufige Ursachen:**
- Next.js Server kann nicht starten
- Fehlende Environment Variables
- Port-Konflikt
- basePath-Konfiguration falsch

### Problem 2: Container wurde nicht erstellt

**Symptom:** `docker ps -a | grep sharelocal-web-dev` gibt nichts zurück

**Lösung:** Prüfe GitHub Actions Logs:
- Wurde `docker run` erfolgreich ausgeführt?
- Gab es einen Fehler beim Container-Start?
- Wurde der Container sofort wieder entfernt?

### Problem 3: Port 3002 bereits belegt

**Symptom:** `docker run` gibt Fehler "port is already allocated"

**Lösung:** 
```bash
# Finde Container, der Port 3002 verwendet
docker ps --filter "publish=3002"

# Entferne ihn
docker rm -f <container-id>
```

### Problem 4: Image fehlt oder ist fehlerhaft

**Symptom:** `docker run` gibt Fehler "Unable to find image"

**Lösung:**
```bash
# Prüfe ob Image existiert
docker images | grep sharelocal-web-dev

# Falls nicht, pull Image
docker pull dengelma/sharelocal-web-dev:latest
```

---

## Schnell-Diagnose Skript

```bash
#!/bin/bash
echo "=== 1. Prüfe Container (auch gestoppt) ==="
docker ps -a | grep sharelocal-web-dev || echo "❌ Container existiert nicht"

echo ""
echo "=== 2. Prüfe Container Logs ==="
docker logs sharelocal-web-dev --tail 50 2>&1 || echo "❌ Keine Logs verfügbar"

echo ""
echo "=== 3. Prüfe Port 3002 ==="
sudo lsof -i :3002 || echo "✅ Port 3002 ist frei"

echo ""
echo "=== 4. Prüfe Image ==="
docker images | grep sharelocal-web-dev || echo "❌ Image nicht gefunden"

echo ""
echo "=== 5. Prüfe GitHub Actions (manuell) ==="
echo "Gehe zu: https://github.com/dengelma9898/ShareLocal/actions"
echo "Prüfe den letzten 'deploy-dev' Run für Fehler"
```

---

## Nächste Schritte

1. ✅ Führe Debug-Skript aus
2. ✅ Prüfe Container Logs
3. ✅ Prüfe GitHub Actions Logs
4. ✅ Basierend auf Ergebnissen: Fix anwenden

