# Docker Build Verify - Web Frontend

## Prüfe ob Build-Args korrekt gesetzt wurden

### Schritt 1: Prüfe Container Environment Variables

**Auf dem Server:**

```bash
# Prüfe alle Environment Variables im Container
docker exec sharelocal-web-dev printenv | grep -E "NEXT_PUBLIC|BASE_PATH|PORT"

# Erwartete Ausgabe:
# NEXT_PUBLIC_API_URL=http://nuernbergspots.de/share-local/dev/api
# NEXT_PUBLIC_BASE_PATH=/share-local/dev
# PORT=3002
```

### Schritt 2: Prüfe ob basePath beim Build gesetzt wurde

**Wichtig:** `NEXT_PUBLIC_BASE_PATH` wird beim Build in den Code eingebaut. Wenn es beim Build nicht gesetzt war, funktioniert es nicht zur Laufzeit!

```bash
# Prüfe Build-Konfiguration im Container
docker exec sharelocal-web-dev cat packages/web/.next/BUILD_ID

# Prüfe ob basePath in der Build-Konfiguration ist
docker exec sharelocal-web-dev sh -c "grep -r 'basePath' packages/web/.next/ 2>/dev/null | head -5" || echo "basePath nicht gefunden"

# Prüfe Next.js Config (falls vorhanden)
docker exec sharelocal-web-dev cat packages/web/next.config.js 2>/dev/null || echo "next.config.js nicht im Container"
```

### Schritt 3: Teste Container direkt

```bash
# Teste verschiedene Pfade
echo "=== Test 1: Root ==="
curl http://localhost:3002/

echo "=== Test 2: Mit basePath ==="
curl http://localhost:3002/share-local/dev

echo "=== Test 3: Mit basePath und trailing slash ==="
curl http://localhost:3002/share-local/dev/

echo "=== Test 4: Health ==="
curl http://localhost:3002/health
```

### Schritt 4: Prüfe Container Logs

```bash
# Schaue Container Logs beim Start
docker logs sharelocal-web-dev --tail 50

# Mache einen Request und schaue Logs
curl http://localhost:3002/share-local/dev
docker logs sharelocal-web-dev --tail 10
```

---

## Mögliche Probleme

### Problem 1: NEXT_PUBLIC_BASE_PATH wurde beim Build nicht gesetzt

**Symptom:** `docker exec sharelocal-web-dev printenv | grep BASE_PATH` gibt nichts zurück

**Ursache:** Build-Arg wurde nicht übergeben oder war leer

**Lösung:** Prüfe CI-Workflow Build-Args:

```yaml
build-args: |
  NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL_DEV || 'http://nuernbergspots.de/share-local/dev/api' }}
  NEXT_PUBLIC_BASE_PATH=${{ secrets.NEXT_PUBLIC_BASE_PATH_DEV || '/share-local/dev' }}
```

**Fix:** Stelle sicher, dass der Default-Wert `/share-local/dev` ist (nicht leer).

### Problem 2: basePath wurde beim Build gesetzt, aber Next.js erwartet trotzdem `/`

**Symptom:** Container gibt 404 für `/share-local/dev`, aber Health funktioniert

**Ursache:** Next.js standalone Server behandelt basePath anders

**Lösung:** NGINX muss `/share-local/dev` senden (nicht `/`)

### Problem 3: Container wurde mit falschem basePath gebaut

**Symptom:** Container erwartet `/share-local/dev`, aber NGINX sendet `/`

**Ursache:** Build-Arg war falsch oder Container ist alt

**Lösung:** Container neu bauen mit korrektem basePath

---

## Debugging-Befehle

### Vollständige Diagnose

```bash
#!/bin/bash
echo "=== 1. Container Environment Variables ==="
docker exec sharelocal-web-dev printenv | grep -E "NEXT_PUBLIC|BASE_PATH|PORT|NODE_ENV"

echo ""
echo "=== 2. Container Port ==="
docker inspect sharelocal-web-dev | grep -A 5 '"Ports"'

echo ""
echo "=== 3. Test Container direkt ==="
echo "Root:"
curl -s http://localhost:3002/ | head -5
echo ""
echo "With basePath:"
curl -s http://localhost:3002/share-local/dev | head -5
echo ""
echo "Health:"
curl -s http://localhost:3002/health

echo ""
echo "=== 4. Container Logs (letzte 10 Zeilen) ==="
docker logs sharelocal-web-dev --tail 10

echo ""
echo "=== 5. Prüfe ob basePath im Build vorhanden ist ==="
docker exec sharelocal-web-dev sh -c "
  if [ -f 'packages/web/.next/BUILD_ID' ]; then
    echo 'Build ID:'
    cat packages/web/.next/BUILD_ID
    echo ''
    echo 'Suche nach basePath in Build:'
    find packages/web/.next -name '*.json' -exec grep -l 'basePath\|share-local' {} \; 2>/dev/null | head -3
  else
    echo '❌ Build-Verzeichnis nicht gefunden'
  fi
"
```

---

## Nächste Schritte

1. ✅ Führe Debugging-Befehle aus
2. ✅ Prüfe ob `NEXT_PUBLIC_BASE_PATH` im Container gesetzt ist
3. ✅ Teste Container direkt (ohne NGINX)
4. ✅ Basierend auf Ergebnissen: Fix anwenden

