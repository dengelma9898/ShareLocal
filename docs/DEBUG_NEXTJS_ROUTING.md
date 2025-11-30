# Debug Next.js Routing - ShareLocal

## Problem

NGINX Config ist korrekt, aber Root-Route gibt 404:
- ✅ `/share-local/dev/health` funktioniert
- ❌ `/share-local/dev` gibt 404

## Debugging-Schritte

### Schritt 1: Teste verschiedene Pfade direkt am Container

**Auf dem Server:**

```bash
# Teste Root ohne basePath
curl http://localhost:3002/

# Teste mit basePath ohne trailing slash
curl http://localhost:3002/share-local/dev

# Teste mit basePath mit trailing slash
curl http://localhost:3002/share-local/dev/

# Teste Health-Endpoint
curl http://localhost:3002/health
curl http://localhost:3002/share-local/dev/health
```

**Erwartetes Verhalten:**
- Wenn Next.js mit `basePath: '/share-local/dev'` gebaut wurde:
  - `/` → 404 (weil basePath erwartet wird)
  - `/share-local/dev` → sollte funktionieren
  - `/share-local/dev/` → sollte funktionieren
  - `/health` → sollte funktionieren (health ist immer auf Root-Level)

### Schritt 2: Prüfe Container Logs

```bash
# Mache einen Request und schaue Logs
curl http://nuernbergspots.de/share-local/dev
docker logs sharelocal-web-dev --tail 20

# Schaue nach:
# - Welche Route wird aufgerufen?
# - Gibt es Fehler?
# - Was zeigt Next.js in den Logs?
```

### Schritt 3: Prüfe basePath im Container

```bash
# Prüfe Environment Variables
docker exec sharelocal-web-dev printenv | grep BASE_PATH

# Prüfe Next.js Config (falls vorhanden)
docker exec sharelocal-web-dev cat packages/web/next.config.js 2>/dev/null || echo "next.config.js nicht im Container"

# Prüfe Build-Konfiguration
docker exec sharelocal-web-dev sh -c "find packages/web/.next -name '*.json' -exec grep -l 'basePath\|share-local' {} \; 2>/dev/null | head -3"
```

### Schritt 4: Teste mit trailing slash

```bash
# Teste ob trailing slash hilft
curl http://nuernbergspots.de/share-local/dev/
```

---

## Mögliche Probleme & Lösungen

### Problem 1: Next.js erwartet trailing slash

**Symptom:** `/share-local/dev` gibt 404, aber `/share-local/dev/` funktioniert

**Lösung:** NGINX automatisch trailing slash hinzufügen:

```nginx
location /share-local/dev {
    # Füge trailing slash hinzu, falls nicht vorhanden
    if ($request_uri !~ ^/share-local/dev/.*) {
        rewrite ^/share-local/dev$ /share-local/dev/ permanent;
    }
    
    proxy_pass http://localhost:3002;
    # ... rest gleich
}
```

### Problem 2: Next.js standalone Server behandelt basePath anders

**Symptom:** Health funktioniert, aber Root-Route nicht

**Ursache:** Next.js standalone Server mit basePath erwartet Requests wie `/share-local/dev/` (mit trailing slash)

**Lösung:** NGINX trailing slash hinzufügen oder Next.js Route anpassen

### Problem 3: Next.js Route `/` existiert nicht unter basePath

**Symptom:** `/share-local/dev` gibt 404, aber `/share-local/dev/health` funktioniert

**Ursache:** Next.js `app/page.tsx` Route ist nicht unter `/share-local/dev/` verfügbar

**Lösung:** Prüfe ob `app/page.tsx` existiert und korrekt ist

---

## Schnell-Test

```bash
#!/bin/bash
echo "=== Test 1: Container direkt (ohne NGINX) ==="
echo "Root (/):"
curl -s http://localhost:3002/ | head -3

echo ""
echo "Mit basePath (/share-local/dev):"
curl -s http://localhost:3002/share-local/dev | head -3

echo ""
echo "Mit basePath und trailing slash (/share-local/dev/):"
curl -s http://localhost:3002/share-local/dev/ | head -3

echo ""
echo "Health (/health):"
curl -s http://localhost:3002/health

echo ""
echo "=== Test 2: Über NGINX ==="
echo "Root (/share-local/dev):"
curl -s http://nuernbergspots.de/share-local/dev | head -3

echo ""
echo "Mit trailing slash (/share-local/dev/):"
curl -s http://nuernbergspots.de/share-local/dev/ | head -3

echo ""
echo "=== Test 3: Container Logs ==="
docker logs sharelocal-web-dev --tail 10
```

---

## Nächste Schritte

1. ✅ Führe Schnell-Test aus
2. ✅ Prüfe Container Logs
3. ✅ Teste verschiedene Pfade direkt am Container
4. ✅ Basierend auf Ergebnissen: Fix anwenden

**Wahrscheinlichste Ursache:** Next.js erwartet `/share-local/dev/` (mit trailing slash) statt `/share-local/dev`

