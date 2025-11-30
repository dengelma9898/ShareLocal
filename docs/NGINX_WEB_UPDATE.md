# NGINX Update für Web Frontend - ShareLocal

## Übersicht

Die Web Frontend Container laufen jetzt auf Ports **3002** (Dev) und **3102** (Prd). Die NGINX-Konfiguration muss entsprechend aktualisiert werden.

## Wichtig: Nur eine NGINX Config Datei

**Die NGINX-Konfiguration ist in der bestehenden `nuernbergspots` Config-Datei**, nicht in separaten `share-local-*` Dateien.

Die Dateien `infrastructure/nginx/share-local-*.conf` im Repository sind nur **Templates/Beispiele** für die Integration.

---

## Port-Konfiguration

| Service | Environment | Port | NGINX Location |
|---------|-------------|------|----------------|
| Web | Development | **3002** | `/share-local/dev` |
| API | Development | **3001** | `/share-local/dev/api` |
| Web | Production | **3102** | `/share-local/prd` |
| API | Production | **3101** | `/share-local/prd/api` |

---

## Update-Schritte

### Schritt 1: SSH zum Server

```bash
ssh root@87.106.208.51
```

### Schritt 2: Öffne die NGINX Config

```bash
# Finde die Config-Datei (wahrscheinlich nuernbergspots)
ls -la /etc/nginx/sites-enabled/
ls -la /etc/nginx/sites-available/

# Öffne die Config (z.B. nuernbergspots)
sudo nano /etc/nginx/sites-available/nuernbergspots
# oder falls in sites-enabled:
sudo nano /etc/nginx/sites-enabled/nuernbergspots
```

### Schritt 3: Füge/Update Web Locations hinzu

**Für Development (`/share-local/dev`):**

Füge diesen Location-Block hinzu (oder aktualisiere, falls bereits vorhanden):

```nginx
# ShareLocal Dev Web - /share-local/dev
# WICHTIG: KEIN rewrite - Next.js wurde mit basePath gebaut und erwartet den vollen Pfad
location /share-local/dev {
    # KEIN rewrite - Next.js bekommt den vollen Pfad /share-local/dev
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
```

**Wichtig:** Dieser Block muss **VOR** `/share-local/dev/api` kommen, da NGINX spezifischere Locations zuerst matched!

**Für Production (`/share-local/prd`):**

Füge diesen Location-Block hinzu (oder aktualisiere, falls bereits vorhanden):

```nginx
# ShareLocal Prd Web - /share-local/prd
# WICHTIG: KEIN rewrite - Next.js wurde mit basePath gebaut und erwartet den vollen Pfad
location /share-local/prd {
    # KEIN rewrite - Next.js bekommt den vollen Pfad /share-local/prd
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
```

**Wichtig:** Dieser Block muss **VOR** `/share-local/prd/api` kommen!

### Schritt 4: Prüfe die Config

```bash
sudo nginx -t
```

**Erwartete Ausgabe:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Schritt 5: Lade NGINX neu

```bash
sudo systemctl reload nginx
```

### Schritt 6: Teste die Web Frontend

**Development:**
```bash
curl http://nuernbergspots.de/share-local/dev
# Sollte: HTML-Seite zurückgeben

curl http://nuernbergspots.de/share-local/dev/health
# Sollte: {"status":"ok"} zurückgeben
```

**Production:**
```bash
curl http://nuernbergspots.de/share-local/prd
# Sollte: HTML-Seite zurückgeben

curl http://nuernbergspots.de/share-local/prd/health
# Sollte: {"status":"ok"} zurückgeben
```

---

## Location-Reihenfolge (WICHTIG!)

NGINX matched Locations in der Reihenfolge, in der sie definiert sind. **Spezifischere Locations müssen vor allgemeineren kommen:**

**Korrekte Reihenfolge:**
```nginx
# 1. Spezifischste Locations zuerst
location /share-local/dev/api { ... }      # API zuerst
location /share-local/dev/health { ... }   # Health zuerst
location /share-local/dev { ... }          # Web danach

location /share-local/prd/api { ... }      # API zuerst
location /share-local/prd/health { ... }  # Health zuerst
location /share-local/prd { ... }          # Web danach
```

**Falsche Reihenfolge:**
```nginx
# ❌ FALSCH: Allgemeine Location zuerst
location /share-local/dev { ... }          # Matched alles!
location /share-local/dev/api { ... }      # Wird nie erreicht
```

---

## Troubleshooting

### Problem: "502 Bad Gateway"

**Ursache:** Web Container läuft nicht oder Port ist falsch.

**Lösung:**
```bash
# Prüfe ob Container läuft
docker ps | grep sharelocal-web

# Prüfe ob Port korrekt ist
docker inspect sharelocal-web-dev | grep -A 5 '"Ports"'

# Prüfe Container Logs
docker logs sharelocal-web-dev
```

### Problem: "404 Not Found"

**Ursache:** Location-Reihenfolge ist falsch oder Location-Block fehlt.

**Lösung:**
- Prüfe ob `/share-local/dev` Location-Block existiert
- Prüfe ob er VOR `/share-local/dev/api` kommt
- Prüfe ob `proxy_pass` Port 3002 (Dev) oder 3102 (Prd) verwendet

### Problem: Assets werden nicht geladen

**Ursache:** `basePath` oder `assetPrefix` ist nicht korrekt konfiguriert.

**Lösung:**
- Prüfe ob `NEXT_PUBLIC_BASE_PATH` beim Build gesetzt wurde
- Prüfe ob `next.config.js` `basePath` und `assetPrefix` korrekt setzt

---

## Zusammenfassung

1. ✅ Web Dev läuft auf Port **3002**
2. ✅ Web Prd läuft auf Port **3102**
3. ✅ NGINX Config muss in bestehender `nuernbergspots` Datei aktualisiert werden
4. ✅ Location-Reihenfolge: `/share-local/dev/api` VOR `/share-local/dev`
5. ✅ NGINX neu laden nach Änderungen

