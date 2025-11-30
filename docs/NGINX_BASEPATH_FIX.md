# NGINX basePath Fix - ShareLocal

## Problem

Health-Endpoint funktioniert (`/share-local/dev/health`), aber Root-Route gibt 404 (`/share-local/dev`).

**Symptom:**
```bash
curl http://nuernbergspots.de/share-local/dev/health
# ✅ {"status":"ok",...}

curl http://nuernbergspots.de/share-local/dev
# ❌ {"statusCode":404,"message":"Cannot GET /"}
```

**Ursache:**
- Next.js wurde mit `basePath: '/share-local/dev'` gebaut
- NGINX sendet `/share-local/dev` an Next.js
- Next.js erwartet `/share-local/dev/` (mit trailing slash) oder den vollständigen Pfad
- NGINX `proxy_pass` Konfiguration ist falsch

---

## Lösung: NGINX Config anpassen

### Option 1: NGINX behält Prefix, Next.js bekommt vollen Pfad (Empfohlen)

**NGINX Config:**

```nginx
location /share-local/dev {
    # WICHTIG: proxy_pass OHNE trailing slash, damit NGINX Location-Pfad anhängt
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

**Wichtig:** `proxy_pass http://localhost:3002;` OHNE trailing slash!

Wenn NGINX `proxy_pass` OHNE trailing slash verwendet, hängt es automatisch den Location-Pfad (`/share-local/dev`) an den Backend-Request an.

**Beispiel:**
- Request: `GET /share-local/dev`
- NGINX sendet an Backend: `GET /share-local/dev` ✅

---

### Option 2: NGINX entfernt Prefix, Next.js OHNE basePath

**NGINX Config:**

```nginx
location /share-local/dev {
    # Entfernt Prefix
    rewrite ^/share-local/dev/?(.*) /$1 break;
    proxy_pass http://localhost:3002;
    # ... rest gleich
}
```

**Aber dann:** Next.js muss OHNE basePath gebaut werden!

---

## Empfehlung: Option 1

**Warum Option 1 besser ist:**
- ✅ Next.js kennt seinen basePath (für Links, Assets, etc.)
- ✅ Automatische Link-Generierung funktioniert
- ✅ Assets werden korrekt geladen
- ✅ Weniger manuelle Anpassungen nötig

---

## Implementierung auf dem Server

### Schritt 1: NGINX Config öffnen

```bash
sudo nano /etc/nginx/sites-available/nuernbergspots
```

### Schritt 2: Prüfe aktuelle Config

Suche nach dem `/share-local/dev` Location-Block und prüfe die `proxy_pass` Zeile.

### Schritt 3: Ändere proxy_pass

**Falls `proxy_pass` mit `/share-local/dev` endet:**
```nginx
# VORHER (falsch):
proxy_pass http://localhost:3002/share-local/dev;  # ❌

# NACHHER (richtig):
proxy_pass http://localhost:3002;  # ✅ OHNE trailing slash
```

**Falls `proxy_pass` mit `/` endet:**
```nginx
# VORHER (falsch):
proxy_pass http://localhost:3002/;  # ❌ Entfernt Location-Pfad

# NACHHER (richtig):
proxy_pass http://localhost:3002;  # ✅ Behält Location-Pfad
```

### Schritt 4: NGINX neu laden

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Schritt 5: Testen

```bash
curl http://nuernbergspots.de/share-local/dev
# Sollte jetzt: HTML-Seite zurückgeben (nicht 404)

curl http://nuernbergspots.de/share-local/dev/health
# Sollte weiterhin funktionieren
```

---

## Für Production

Dasselbe für `/share-local/prd`:

```nginx
location /share-local/prd {
    proxy_pass http://localhost:3102;  # OHNE trailing slash
    # ... rest gleich
}
```

---

## Troubleshooting

### Problem: Immer noch 404

**Prüfe:**
1. Ist `proxy_pass` OHNE trailing slash?
2. Wurde Next.js mit korrektem `basePath` gebaut?
3. Prüfe Container Logs: `docker logs sharelocal-web-dev --tail 50`

### Problem: Assets werden nicht geladen

**Ursache:** `assetPrefix` stimmt nicht mit `basePath` überein.

**Lösung:** Beide auf den gleichen Wert setzen (ist bereits korrekt in `next.config.js`).

---

## Zusammenfassung

**Das Problem:** NGINX sendet falschen Pfad an Next.js.

**Die Lösung:** `proxy_pass http://localhost:3002;` OHNE trailing slash verwenden, damit NGINX automatisch `/share-local/dev` anhängt.

