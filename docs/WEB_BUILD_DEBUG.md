# Web Build Debug - ShareLocal

## Schnell-Diagnose

Führe diese Befehle auf dem Server aus, um zu prüfen, ob der Docker Build korrekt ist:

```bash
#!/bin/bash
set -e

CONTAINER_NAME="sharelocal-web-dev"

echo "=== 1. Container Status ==="
docker ps | grep $CONTAINER_NAME || echo "❌ Container läuft nicht"

echo ""
echo "=== 2. Environment Variables ==="
docker exec $CONTAINER_NAME printenv | grep -E "NEXT_PUBLIC|BASE_PATH|PORT|NODE_ENV" || echo "Keine NEXT_PUBLIC Variablen gefunden"

echo ""
echo "=== 3. Test Container direkt (ohne NGINX) ==="
echo "Test 1: Root (/)"
curl -s http://localhost:3002/ | head -3 || echo "❌ Fehler"

echo ""
echo "Test 2: Mit basePath (/share-local/dev)"
curl -s http://localhost:3002/share-local/dev | head -3 || echo "❌ Fehler"

echo ""
echo "Test 3: Mit basePath und trailing slash (/share-local/dev/)"
curl -s http://localhost:3002/share-local/dev/ | head -3 || echo "❌ Fehler"

echo ""
echo "Test 4: Health endpoint"
curl -s http://localhost:3002/health || echo "❌ Fehler"

echo ""
echo "=== 4. Container Logs ==="
docker logs $CONTAINER_NAME --tail 20

echo ""
echo "=== 5. Prüfe Build-Konfiguration ==="
docker exec $CONTAINER_NAME sh -c "
  if [ -f 'packages/web/.next/BUILD_ID' ]; then
    echo '✅ Build-Verzeichnis existiert'
    echo 'Build ID:'
    cat packages/web/.next/BUILD_ID
  else
    echo '❌ Build-Verzeichnis nicht gefunden'
  fi
"

echo ""
echo "=== 6. Prüfe Next.js Config (wenn vorhanden) ==="
docker exec $CONTAINER_NAME sh -c "
  if [ -f 'packages/web/next.config.js' ]; then
    echo '✅ next.config.js gefunden'
    cat packages/web/next.config.js
  else
    echo '⚠️  next.config.js nicht im Container (normal für standalone)'
  fi
"
```

---

## Was zu prüfen ist

### 1. Environment Variables

**Erwartete Ausgabe:**
```
NEXT_PUBLIC_API_URL=http://nuernbergspots.de/share-local/dev/api
NEXT_PUBLIC_BASE_PATH=/share-local/dev
PORT=3002
NODE_ENV=development
```

**Wenn `NEXT_PUBLIC_BASE_PATH` fehlt:**
→ Build-Arg wurde nicht übergeben oder Container ist alt

### 2. Container direkt testen

**Erwartetes Verhalten:**
- `/` → 404 (weil basePath `/share-local/dev` ist)
- `/share-local/dev` → HTML-Seite (200 OK)
- `/share-local/dev/` → HTML-Seite (200 OK)
- `/health` → `{"status":"ok"}` (200 OK)

**Wenn `/share-local/dev` 404 gibt:**
→ Next.js wurde OHNE basePath gebaut oder basePath ist falsch

**Wenn `/` funktioniert:**
→ Next.js wurde OHNE basePath gebaut, NGINX muss `/` senden

### 3. Container Logs

**Schaue nach:**
- Fehler beim Start
- Welche Requests kommen an
- basePath-Warnungen

---

## Mögliche Probleme & Fixes

### Problem 1: NEXT_PUBLIC_BASE_PATH fehlt beim Build

**Symptom:** `docker exec ... printenv | grep BASE_PATH` gibt nichts zurück

**Ursache:** Build-Arg wurde nicht übergeben

**Fix:** Prüfe CI-Workflow - Build-Args müssen gesetzt sein:

```yaml
build-args: |
  NEXT_PUBLIC_BASE_PATH=${{ secrets.NEXT_PUBLIC_BASE_PATH_DEV || '/share-local/dev' }}
```

**Wichtig:** Der Default-Wert `/share-local/dev` muss vorhanden sein!

### Problem 2: Container wurde mit falschem basePath gebaut

**Symptom:** Container erwartet `/share-local/dev`, aber gibt 404

**Ursache:** Build-Arg war leer oder falsch

**Fix:** Container neu bauen:

```bash
# Auf dem Server: Image neu pullen
docker pull dengelma/sharelocal-web-dev:latest

# Container neu starten
docker stop sharelocal-web-dev
docker rm sharelocal-web-dev
# Container wird automatisch neu gestartet durch CI/CD
```

### Problem 3: basePath wurde beim Build gesetzt, aber Next.js erwartet trotzdem `/`

**Symptom:** Container gibt 404 für `/share-local/dev`, aber Health funktioniert

**Ursache:** Next.js standalone Server behandelt basePath anders als erwartet

**Fix:** NGINX muss `/share-local/dev` senden (nicht `/`):

```nginx
location /share-local/dev {
    proxy_pass http://localhost:3002/;  # Trailing slash!
    # ...
}
```

---

## Nächste Schritte

1. ✅ Führe Debug-Skript aus
2. ✅ Teile die Ausgabe
3. ✅ Basierend auf Ergebnissen können wir den spezifischen Fix anwenden

