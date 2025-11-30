# Nginx Setup für ShareLocal API

## Problem

Die API ist direkt über Port 3001 erreichbar, aber nicht über Nginx unter `/share-local/dev/api`.

## Lösung: Nginx konfigurieren

### Schritt 1: SSH zum Server

```bash
ssh root@87.106.208.51
```

### Schritt 2: Prüfe ob Nginx installiert ist

```bash
nginx -v
```

Falls nicht installiert:
```bash
apt-get update
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
```

### Schritt 3: Prüfe ob Nginx läuft

```bash
systemctl status nginx
```

### Schritt 4: Kopiere Nginx-Konfiguration

**Option A: Falls du das Repository auf dem Server hast:**

```bash
cd /path/to/ShareLocal
cp infrastructure/nginx/share-local-dev.conf /etc/nginx/sites-available/share-local-dev
```

**Option B: Falls du das Repository nicht auf dem Server hast:**

Erstelle die Datei manuell:
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

    # Dev Environment - /share-local/dev
    location /share-local/dev {
        # Remove /share-local/dev prefix before proxying
        rewrite ^/share-local/dev/?(.*) /$1 break;
        
        # Proxy to Next.js web container (später)
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Prefix /share-local/dev;
        
        # WebSocket support (für Hot Reload in Dev)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

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

### Schritt 5: Aktiviere die Konfiguration

```bash
# Erstelle Symlink
ln -sf /etc/nginx/sites-available/share-local-dev /etc/nginx/sites-enabled/

# Prüfe die Konfiguration
nginx -t
```

Falls Fehler auftreten, prüfe die Logs:
```bash
tail -f /var/log/nginx/error.log
```

### Schritt 6: Lade Nginx neu

```bash
systemctl reload nginx
```

### Schritt 7: Prüfe ob Port 80 offen ist

```bash
# Prüfe ob Nginx auf Port 80 lauscht
netstat -tuln | grep :80

# Oder
ss -tuln | grep :80
```

Falls Port 80 nicht offen ist, prüfe die Firewall:
```bash
# UFW (falls aktiv)
ufw status
ufw allow 80/tcp
ufw allow 443/tcp

# Oder iptables
iptables -L -n | grep 80
```

### Schritt 8: Teste die API

**Lokal auf dem Server:**
```bash
curl http://localhost/share-local/dev/health
curl http://localhost/share-local/dev/api/
```

**Von deinem lokalen Rechner:**
```bash
curl http://nuernbergspots.de/share-local/dev/health
curl http://nuernbergspots.de/share-local/dev/api/
```

---

## Troubleshooting

### Problem: "Failed to connect to nuernbergspots.de port 80"

**Mögliche Ursachen:**

1. **Nginx läuft nicht:**
   ```bash
   systemctl status nginx
   systemctl start nginx
   ```

2. **Port 80 ist nicht offen (Firewall):**
   ```bash
   # Prüfe Firewall
   ufw status
   # Falls aktiv, öffne Port 80
   ufw allow 80/tcp
   ```

3. **Nginx-Konfiguration ist nicht aktiv:**
   ```bash
   # Prüfe ob Symlink existiert
   ls -la /etc/nginx/sites-enabled/ | grep share-local-dev
   
   # Falls nicht, erstelle ihn
   ln -sf /etc/nginx/sites-available/share-local-dev /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

4. **API Container läuft nicht:**
   ```bash
   docker ps | grep sharelocal-api-dev
   
   # Falls nicht, starte ihn
   docker start sharelocal-api-dev
   ```

5. **Port 3001 ist nicht erreichbar:**
   ```bash
   # Prüfe ob Container auf Port 3001 lauscht
   curl http://localhost:3001/health
   
   # Prüfe Container-Logs
   docker logs sharelocal-api-dev
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

**Ursache:** Nginx-Konfiguration ist falsch oder nicht aktiv.

**Lösung:**
```bash
# Prüfe Nginx-Konfiguration
nginx -t

# Prüfe ob Symlink existiert
ls -la /etc/nginx/sites-enabled/ | grep share-local-dev

# Prüfe Nginx-Logs
tail -f /var/log/nginx/error.log
```

---

## Schnelltest: Direkt über Port 3001

Falls Nginx noch nicht konfiguriert ist, kannst du die API direkt testen:

```bash
# Von deinem lokalen Rechner
curl http://nuernbergspots.de:3001/health

# Falls Port 3001 nicht öffentlich erreichbar ist, teste lokal auf dem Server
ssh root@87.106.208.51
curl http://localhost:3001/health
```

**Wichtig:** Port 3001 sollte normalerweise nicht öffentlich erreichbar sein (nur über Nginx). Falls er öffentlich erreichbar ist, prüfe die Firewall-Einstellungen.

---

## Nächste Schritte

Nach erfolgreicher Nginx-Konfiguration:

1. ✅ API ist über `http://nuernbergspots.de/share-local/dev/api` erreichbar
2. ✅ Health Check über `http://nuernbergspots.de/share-local/dev/health`
3. ⏭️ Später: SSL/HTTPS mit Let's Encrypt einrichten
4. ⏭️ Später: Web-Frontend deployen (Port 3000)

---

## Weitere Informationen

- **Nginx-Konfiguration**: `infrastructure/nginx/share-local-dev.conf`
- **API Testing Guide**: `docs/API_TESTING.md`

