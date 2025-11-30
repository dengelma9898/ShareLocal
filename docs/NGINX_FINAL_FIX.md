# NGINX Final Fix - ShareLocal Web 404

## Problem

NGINX Config sieht korrekt aus (kein `rewrite`), aber Root-Route gibt immer noch 404:
- ✅ Container funktioniert direkt: `curl http://localhost:3002/share-local/dev` → 200 OK
- ✅ Health-Endpoint funktioniert: `curl http://nuernbergspots.de/share-local/dev/health` → 200 OK
- ❌ Root-Route gibt 404: `curl http://nuernbergspots.de/share-local/dev` → 404

## Aktuelle Config (korrekt)

```nginx
location /share-local/dev {
    # KEIN rewrite - Next.js bekommt den vollen Pfad
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Prefix /share-local/dev;
    
    # WebSocket support
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

## Mögliche Lösungen

### Lösung 1: Trailing Slash hinzufügen (wenn Next.js es erwartet)

**Teste zuerst:**

```bash
curl http://nuernbergspots.de/share-local/dev/
# Wenn das funktioniert, füge automatisches trailing slash hinzu
```

**NGINX Config:**

```nginx
location /share-local/dev {
    # Füge trailing slash hinzu, falls nicht vorhanden (außer für Dateien)
    if ($request_uri ~ ^/share-local/dev[^/]*$) {
        return 301 /share-local/dev/;
    }
    
    proxy_pass http://localhost:3002;
    # ... rest gleich
}
```

### Lösung 2: Prüfe ob Next.js basePath korrekt ist

**Auf dem Server:**

```bash
# Prüfe Environment Variables im Container
docker exec sharelocal-web-dev printenv | grep BASE_PATH

# Sollte zeigen: NEXT_PUBLIC_BASE_PATH=/share-local/dev

# Prüfe was Next.js tatsächlich empfängt
docker logs sharelocal-web-dev --tail 50
# Mache Request: curl http://nuernbergspots.de/share-local/dev
# Schaue Logs für Fehler
```

### Lösung 3: Prüfe NGINX Access Logs

**Auf dem Server:**

```bash
# Mache Request
curl http://nuernbergspots.de/share-local/dev

# Schaue NGINX Access Logs
sudo tail -20 /var/log/nginx/access.log | grep share-local/dev

# Schaue NGINX Error Logs
sudo tail -20 /var/log/nginx/error.log
```

**Was zu suchen ist:**
- Welcher Location-Block wird verwendet?
- Was sendet NGINX an Backend?
- Gibt es Fehler?

### Lösung 4: Teste verschiedene Pfade

**Auf dem Server:**

```bash
# Test 1: Mit trailing slash
curl -v http://nuernbergspots.de/share-local/dev/ 2>&1 | grep -E "< HTTP|404|200"

# Test 2: Ohne trailing slash
curl -v http://nuernbergspots.de/share-local/dev 2>&1 | grep -E "< HTTP|404|200"

# Test 3: Direkt am Container
curl -v http://localhost:3002/share-local/dev 2>&1 | grep -E "< HTTP|404|200"
curl -v http://localhost:3002/share-local/dev/ 2>&1 | grep -E "< HTTP|404|200"
```

---

## Empfohlene Lösung: Trailing Slash hinzufügen

**Wenn `/share-local/dev/` funktioniert, aber `/share-local/dev` nicht:**

```nginx
location /share-local/dev {
    # Automatisches trailing slash für Root-Route
    if ($request_uri ~ ^/share-local/dev[^/]*$) {
        return 301 /share-local/dev/;
    }
    
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Prefix /share-local/dev;
    
    # WebSocket support
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

**Dann:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Debugging-Befehle

```bash
#!/bin/bash
echo "=== Test 1: Container direkt ==="
echo "Ohne trailing slash:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/share-local/dev
echo ""

echo "Mit trailing slash:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/share-local/dev/
echo ""

echo ""
echo "=== Test 2: Über NGINX ==="
echo "Ohne trailing slash:"
curl -s -o /dev/null -w "%{http_code}" http://nuernbergspots.de/share-local/dev
echo ""

echo "Mit trailing slash:"
curl -s -o /dev/null -w "%{http_code}" http://nuernbergspots.de/share-local/dev/
echo ""

echo ""
echo "=== Test 3: NGINX Logs ==="
echo "Mache Request und schaue Logs:"
echo "curl http://nuernbergspots.de/share-local/dev"
echo "sudo tail -5 /var/log/nginx/access.log | grep share-local"
```

---

## Nächste Schritte

1. ✅ Teste ob `/share-local/dev/` (mit trailing slash) funktioniert
2. ✅ Prüfe NGINX Access Logs
3. ✅ Prüfe Container Logs während Request
4. ✅ Basierend auf Ergebnissen: Fix anwenden

**Wahrscheinlichste Ursache:** Next.js erwartet `/share-local/dev/` (mit trailing slash) statt `/share-local/dev`

