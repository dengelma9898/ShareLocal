# NGINX Deep Debug - ShareLocal 404

## Problem

Auch nach Änderung zu `location = /dev/` gibt es immer noch 404.

## Deep Debugging

### Schritt 1: Prüfe was NGINX an Backend sendet

**Auf dem Server:**

```bash
# Aktiviere Debug-Logging in NGINX (temporär)
sudo nano /etc/nginx/nginx.conf
# Füge hinzu: error_log /var/log/nginx/error.log debug;

# Oder prüfe Access Logs mit mehr Details
# Füge zu server block hinzu:
# access_log /var/log/nginx/access.log combined;

# Mache Request
curl http://nuernbergspots.de/share-local/dev

# Schaue Access Logs
sudo tail -20 /var/log/nginx/access.log | grep share-local/dev

# Schaue Error Logs
sudo tail -20 /var/log/nginx/error.log
```

### Schritt 2: Prüfe Container Logs während Request

**Auf dem Server:**

```bash
# In Terminal 1: Logs beobachten
docker logs -f sharelocal-web-dev

# In Terminal 2: Request machen
curl http://nuernbergspots.de/share-local/dev

# Schaue was in den Logs steht
# Next.js sollte zeigen, welche Route aufgerufen wurde
```

### Schritt 3: Teste mit tcpdump (siehe was NGINX wirklich sendet)

```bash
# Prüfe was NGINX an Port 3002 sendet
sudo tcpdump -i lo -A -s 0 'tcp port 3002 and host localhost' &
TCPDUMP_PID=$!

# Mache Request
curl http://nuernbergspots.de/share-local/dev

# Stoppe tcpdump
sudo kill $TCPDUMP_PID

# Schaue Output - suche nach "GET /" oder "GET /share-local/dev"
```

### Schritt 4: Prüfe exakte /share-local/dev Config

**Auf dem Server:**

```bash
# Zeige kompletten Block mit Zeilennummern
sudo sed -n '/location \/share-local\/dev[^\/]/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots | cat -n

# Prüfe ob es versteckte Zeichen gibt
sudo sed -n '/location \/share-local\/dev[^\/]/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots | od -c | head -20
```

---

## Alternative Lösung: Expliziter Pfad in proxy_pass

**Wenn NGINX den Pfad nicht korrekt anhängt, verwende expliziten Pfad:**

```nginx
location /share-local/dev {
    # Expliziter Pfad - NGINX sendet genau das
    proxy_pass http://localhost:3002/share-local/dev;
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

**Wichtig:** `proxy_pass http://localhost:3002/share-local/dev;` mit explizitem Pfad.

**Aber:** Wenn Unterpfade aufgerufen werden (`/share-local/dev/login`), wird NGINX `/share-local/dev/login` senden, was korrekt ist.

---

## Alternative Lösung 2: Rewrite verwenden, aber Next.js OHNE basePath

**Wenn expliziter Pfad nicht funktioniert:**

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

## Schnell-Test: Was sendet NGINX wirklich?

```bash
#!/bin/bash
echo "=== Test 1: Container direkt ==="
echo "Request: GET /share-local/dev"
curl -v http://localhost:3002/share-local/dev 2>&1 | grep -E "< HTTP|GET"

echo ""
echo "=== Test 2: Über NGINX ==="
echo "Request: GET /share-local/dev"
curl -v http://nuernbergspots.de/share-local/dev 2>&1 | grep -E "< HTTP|GET|Location"

echo ""
echo "=== Test 3: Container Logs während Request ==="
echo "Mache Request und schaue Container Logs:"
echo "docker logs sharelocal-web-dev --tail 20"
```

---

## Nächste Schritte

1. ✅ Prüfe Container Logs während Request
2. ✅ Prüfe NGINX Access Logs
3. ✅ Teste mit explizitem Pfad in proxy_pass
4. ✅ Falls das nicht funktioniert: Next.js OHNE basePath bauen

**Wahrscheinlichste Ursache:** NGINX sendet `/` statt `/share-local/dev` an Next.js, trotz korrekter Config

