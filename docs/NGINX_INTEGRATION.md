# Nginx Integration - ShareLocal in bestehende Config

## Situation

Du hast bereits eine Nginx-Konfiguration mit:
- SSL auf Port 443
- `/dev/` Location für andere App (Port 3000)
- `/prd/` Location für andere App (Port 3100)

## Empfehlung: Integration in bestehende Config

**Ja, es ist Best Practice, die ShareLocal-Locations zur bestehenden Config hinzuzufügen**, da:
- ✅ Du bereits eine dev/prd Struktur hast
- ✅ SSL ist bereits konfiguriert
- ✅ Eine Config pro Domain ist übersichtlicher
- ✅ Keine Konflikte mit bestehenden Locations

## Integration: ShareLocal Locations hinzufügen

Füge folgende Location-Blöcke zu deiner bestehenden `nuernbergspots` Config hinzu:

### Für Development (`/share-local/dev`)

```nginx
# ShareLocal Dev Web - /share-local/dev
location /share-local/dev {
    rewrite ^/share-local/dev/?(.*) /$1 break;
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Prefix /share-local/dev;
    
    # WebSocket support (für Hot Reload in Dev)
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# ShareLocal Dev API - /share-local/dev/api
location /share-local/dev/api {
    rewrite ^/share-local/dev/api/?(.*) /api/$1 break;
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    
    # CORS headers
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    
    if ($request_method = OPTIONS) {
        return 204;
    }
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# ShareLocal Dev Health Check
location /share-local/dev/health {
    proxy_pass http://localhost:3001/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

### Für Production (`/share-local/prd`)

```nginx
# ShareLocal Prd Web - /share-local/prd
location /share-local/prd {
    rewrite ^/share-local/prd/?(.*) /$1 break;
    proxy_pass http://localhost:3102;
    proxy_http_version 1.1;
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Prefix /share-local/prd;
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Caching für statische Assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3102;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# ShareLocal Prd API - /share-local/prd/api
location /share-local/prd/api {
    rewrite ^/share-local/prd/api/?(.*) /api/$1 break;
    proxy_pass http://localhost:3101;  # Port 3101 für Production (analog zu anderen Apps: 3100)
    proxy_http_version 1.1;
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    
    # CORS headers
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    
    if ($request_method = OPTIONS) {
        return 204;
    }
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# ShareLocal Prd Health Check
location /share-local/prd/health {
    proxy_pass http://localhost:3101/health;  # Port 3101 für Production
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

## Port-Struktur

**Konsistent mit bestehender Struktur:**
- Dev Web: Port **3002** (Port 3000 bereits belegt)
- Dev API: Port **3001**
- Prd Web: Port **3102** (Port 3100 bereits belegt)
- Prd API: Port **3101**

**Vorteile:**
- ✅ Konsistente Port-Struktur über alle Apps hinweg
- ✅ Separate Container für dev und prd möglich
- ✅ Einfach zu merken: dev = 300x, prd = 310x
- ✅ Keine Konflikte mit bestehenden Services (3000/3100)

## Schritt-für-Schritt Anleitung

### 1. Öffne die bestehende Config

```bash
nano /etc/nginx/sites-available/nuernbergspots
# Oder wo auch immer deine Config liegt
```

### 2. Füge die ShareLocal Locations hinzu

Füge die Location-Blöcke **nach** deinen bestehenden `/dev/` und `/prd/` Locations ein, aber **vor** dem schließenden `}` des `server` Blocks.

**Beispiel-Struktur:**
```nginx
server {
    listen 443 ssl http2;
    server_name www.nuernbergspots.de nuernbergspots.de;
    
    # SSL Config...
    
    # Bestehende Locations
    location /dev/ {
        proxy_pass http://localhost:3000/;
        # ...
    }
    
    location /prd/ {
        proxy_pass http://localhost:3100/;
        # ...
    }
    
    # NEU: ShareLocal Dev API
    location /share-local/dev/api {
        # ... (siehe oben)
    }
    
    location /share-local/dev/health {
        # ... (siehe oben)
    }
    
    # NEU: ShareLocal Prd API
    location /share-local/prd/api {
        # ... (siehe oben)
    }
    
    location /share-local/prd/health {
        # ... (siehe oben)
    }
}
```

### 3. Prüfe die Config

```bash
nginx -t
```

### 4. Lade Nginx neu

```bash
systemctl reload nginx
```

### 5. Teste die API

**Development:**
```bash
curl https://nuernbergspots.de/share-local/dev/health
curl https://nuernbergspots.de/share-local/dev/api/
```

**Production:**
```bash
curl https://nuernbergspots.de/share-local/prd/health
curl https://nuernbergspots.de/share-local/prd/api/
```

## Warum nicht separate Configs?

**Separate Configs wären sinnvoll, wenn:**
- ❌ Verschiedene Domains (z.B. `sharelocal.de` vs `nuernbergspots.de`)
- ❌ Verschiedene SSL-Zertifikate
- ❌ Verschiedene Server-Blöcke nötig

**In deinem Fall:**
- ✅ Gleiche Domain (`nuernbergspots.de`)
- ✅ Gleiches SSL-Zertifikat
- ✅ Gleiche Server-Struktur
- ✅ Bereits dev/prd Pattern vorhanden

**→ Integration in bestehende Config ist die bessere Lösung!**

## Troubleshooting

### Problem: "location /share-local" wird nicht gefunden

**Ursache:** Location-Reihenfolge in Nginx ist wichtig. Spezifischere Locations müssen vor allgemeineren kommen.

**Lösung:** Stelle sicher, dass `/share-local/dev/api` **vor** `/share-local/dev` kommt (falls du später Web hinzufügst).

### Problem: Port-Konflikt zwischen dev und prd

**Gelöst:** Separate Ports:
- Dev Web: Port 3002
- Dev API: Port 3001
- Prd Web: Port 3102
- Prd API: Port 3101

**Wichtig:** Ports 3000 und 3100 sind bereits von anderen Services belegt, daher verwenden wir 3002 und 3102 für Web.

**Falls Probleme auftreten:**
1. Prüfe ob beide Container laufen: `docker ps | grep sharelocal-api`
2. Prüfe ob Ports korrekt gemappt sind: `docker ps | grep -E "3001|3101"`
3. Prüfe Container-Logs: `docker logs sharelocal-api-dev` und `docker logs sharelocal-api`

---

## Zusammenfassung

✅ **Empfehlung:** Füge ShareLocal-Locations zur bestehenden `nuernbergspots` Config hinzu  
✅ **Vorteile:** Einheitliche Struktur, SSL bereits vorhanden, einfacher zu verwalten  
✅ **Port-Struktur:** Dev = 3001, Prd = 3101 (konsistent mit bestehender Struktur: 3000/3100)

