# Next.js Root Route Fix - ShareLocal

## Problem

NGINX Config ist korrekt (`proxy_pass http://localhost:3002/share-local/dev;`), aber Root-Route gibt 404:
- ✅ `/share-local/dev/health` → 200 OK (aber das ist API, nicht Web!)
- ❌ `/share-local/dev` → 404
- ✅ Container direkt: `curl http://localhost:3002/share-local/dev` → 200 OK

**Wichtig:** Der `/health` Block verwendet Port 3001 (API), nicht 3002 (Web)!

---

## Mögliche Ursachen

### Problem 1: Next.js erwartet trailing slash für Root-Route

**Symptom:** `/share-local/dev` gibt 404, aber `/share-local/dev/` könnte funktionieren

**Test:**

```bash
curl http://localhost:3002/share-local/dev/
# Prüfe ob das funktioniert
```

**Lösung:** Automatisches trailing slash in NGINX:

```nginx
location /share-local/dev {
    # Füge trailing slash hinzu für Root-Route
    if ($request_uri ~ ^/share-local/dev[^/]*$) {
        return 301 /share-local/dev/;
    }
    
    proxy_pass http://localhost:3002/share-local/dev;
    # ... rest gleich
}
```

### Problem 2: Next.js Route `/` existiert nicht unter basePath

**Symptom:** Next.js wurde mit `basePath: '/share-local/dev'` gebaut, aber `app/page.tsx` Route ist nicht verfügbar

**Prüfe:**

```bash
# Prüfe ob app/page.tsx existiert
docker exec sharelocal-web-dev ls -la packages/web/app/ | grep page

# Prüfe Environment Variables
docker exec sharelocal-web-dev printenv | grep BASE_PATH
```

### Problem 3: NGINX sendet falschen Pfad trotz explizitem Pfad

**Symptom:** Auch mit explizitem Pfad funktioniert es nicht

**Test mit tcpdump:**

```bash
sudo tcpdump -i lo -A -s 0 'tcp port 3002 and host localhost' &
TCPDUMP_PID=$!

curl http://nuernbergspots.de/share-local/dev

sudo kill $TCPDUMP_PID
# Schaue Output - was sendet NGINX wirklich?
```

---

## Lösung: Prüfe was Next.js wirklich empfängt

**Auf dem Server:**

```bash
# Teste verschiedene Pfade direkt am Container
echo "=== Test 1: Root ohne trailing slash ==="
curl -v http://localhost:3002/share-local/dev 2>&1 | grep -E "< HTTP|404|200"

echo ""
echo "=== Test 2: Root mit trailing slash ==="
curl -v http://localhost:3002/share-local/dev/ 2>&1 | grep -E "< HTTP|404|200"

echo ""
echo "=== Test 3: Health-Endpoint ==="
curl -v http://localhost:3002/health 2>&1 | grep -E "< HTTP|404|200"

echo ""
echo "=== Test 4: Health mit basePath ==="
curl -v http://localhost:3002/share-local/dev/health 2>&1 | grep -E "< HTTP|404|200"
```

**Basierend auf den Ergebnissen:**

### Wenn `/share-local/dev/` funktioniert, aber `/share-local/dev` nicht:

**Lösung:** Automatisches trailing slash:

```nginx
location /share-local/dev {
    # Automatisches trailing slash für Root-Route
    if ($request_uri ~ ^/share-local/dev[^/]*$) {
        return 301 /share-local/dev/;
    }
    
    proxy_pass http://localhost:3002/share-local/dev;
    # ... rest gleich
}
```

### Wenn beide nicht funktionieren:

**Prüfe Next.js Config:**

```bash
# Prüfe ob basePath korrekt ist
docker exec sharelocal-web-dev printenv | grep BASE_PATH

# Sollte zeigen: NEXT_PUBLIC_BASE_PATH=/share-local/dev

# Prüfe ob app/page.tsx existiert
docker exec sharelocal-web-dev ls -la packages/web/app/page.tsx
```

---

## Alternative: Rewrite verwenden, Next.js OHNE basePath

**Wenn nichts funktioniert, verwende rewrite:**

```nginx
location /share-local/dev {
    # Entfernt Prefix, Next.js sieht nur /
    rewrite ^/share-local/dev/?(.*) /$1 break;
    proxy_pass http://localhost:3002;
    # ... rest gleich
}
```

**Aber dann:** Next.js muss OHNE basePath gebaut werden!

---

## Schnell-Test

```bash
#!/bin/bash
echo "=== Test Container direkt ==="
echo "1. Root ohne trailing slash:"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3002/share-local/dev

echo "2. Root mit trailing slash:"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3002/share-local/dev/

echo "3. Health:"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3002/health

echo ""
echo "=== Test über NGINX ==="
echo "1. Root ohne trailing slash:"
curl -s -o /dev/null -w "%{http_code}\n" http://nuernbergspots.de/share-local/dev

echo "2. Root mit trailing slash:"
curl -s -o /dev/null -w "%{http_code}\n" http://nuernbergspots.de/share-local/dev/
```

---

## Nächste Schritte

1. ✅ Teste verschiedene Pfade direkt am Container
2. ✅ Prüfe ob trailing slash hilft
3. ✅ Basierend auf Ergebnissen: Fix anwenden

**Wahrscheinlichste Ursache:** Next.js erwartet `/share-local/dev/` (mit trailing slash) für Root-Route!

