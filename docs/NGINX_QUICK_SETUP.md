# Nginx Quick Setup - ShareLocal Dev API

## Status
✅ Nginx ist installiert und läuft  
❌ ShareLocal-Konfiguration fehlt noch

## Schnell-Setup (auf dem Server)

### Schritt 1: Prüfe vorhandene Konfigurationen

```bash
ls -la /etc/nginx/sites-enabled/
ls -la /etc/nginx/sites-available/
```

### Schritt 2: Erstelle ShareLocal Dev Konfiguration

```bash
nano /etc/nginx/sites-available/share-local-dev
```

Füge folgenden Inhalt ein:

```nginx
# Nginx Configuration für ShareLocal Dev Environment
# Pfad: /share-local/dev

server {
    listen 80;
    server_name nuernbergspots.de;

    # Dev API - /share-local/dev/api
    location /share-local/dev/api {
        # Remove /share-local/dev prefix before proxying
        rewrite ^/share-local/dev/api/?(.*) /api/$1 break;
        
        # Proxy to Express API container
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # CORS headers
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        
        # Handle OPTIONS requests
        if ($request_method = OPTIONS) {
            return 204;
        }
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health checks
    location /share-local/dev/health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Speichere mit `Ctrl+O`, dann `Enter`, dann `Ctrl+X`.

### Schritt 3: Aktiviere die Konfiguration

```bash
# Erstelle Symlink
ln -sf /etc/nginx/sites-available/share-local-dev /etc/nginx/sites-enabled/

# Prüfe die Konfiguration
nginx -t
```

**Wichtig:** Falls `nginx -t` Fehler zeigt, prüfe die Logs:
```bash
tail -f /var/log/nginx/error.log
```

### Schritt 4: Lade Nginx neu

```bash
systemctl reload nginx
```

### Schritt 5: Prüfe ob API-Container läuft

```bash
docker ps | grep sharelocal-api-dev
```

Falls der Container nicht läuft:
```bash
# Prüfe Container-Logs
docker logs sharelocal-api-dev --tail 50

# Starte Container falls nötig
docker start sharelocal-api-dev
```

### Schritt 6: Teste lokal auf dem Server

```bash
# Health Check
curl http://localhost/share-local/dev/health

# API Root
curl http://localhost/share-local/dev/api/
```

### Schritt 7: Teste von außen

Von deinem lokalen Rechner:
```bash
curl http://nuernbergspots.de/share-local/dev/health
curl http://nuernbergspots.de/share-local/dev/api/
```

---

## Troubleshooting

### Problem: "nginx -t" zeigt Fehler

**Lösung:**
```bash
# Prüfe Syntax-Fehler
nginx -t

# Prüfe Logs
tail -f /var/log/nginx/error.log

# Prüfe ob andere Konfigurationen Konflikte verursachen
grep -r "location /share-local" /etc/nginx/sites-enabled/
```

### Problem: "502 Bad Gateway"

**Ursache:** Nginx kann den API-Container nicht erreichen.

**Lösung:**
```bash
# Prüfe ob Container läuft
docker ps | grep sharelocal-api-dev

# Prüfe ob Container auf Port 3001 lauscht
curl http://localhost:3001/health

# Prüfe Container-Logs
docker logs sharelocal-api-dev --tail 50
```

### Problem: "404 Not Found"

**Ursache:** Rewrite-Regel funktioniert nicht richtig.

**Lösung:**
```bash
# Prüfe Nginx-Logs
tail -f /var/log/nginx/error.log

# Teste direkt den Container
curl http://localhost:3001/api/
```

---

## Alternative: Konfiguration aus Repository kopieren

Falls du das Repository auf dem Server hast:

```bash
cd /path/to/ShareLocal
cp infrastructure/nginx/share-local-dev.conf /etc/nginx/sites-available/share-local-dev
ln -sf /etc/nginx/sites-available/share-local-dev /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## Nächste Schritte

Nach erfolgreicher Konfiguration:

1. ✅ API ist über `http://nuernbergspots.de/share-local/dev/api` erreichbar
2. ✅ Health Check über `http://nuernbergspots.de/share-local/dev/health`
3. ⏭️ Später: Web-Frontend hinzufügen (Port 3000)
4. ⏭️ Später: SSL/HTTPS mit Let's Encrypt einrichten

