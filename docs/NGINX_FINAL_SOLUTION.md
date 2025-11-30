# NGINX Final Solution - ShareLocal 404

## Problem

Next.js zeigt keine Request-Logs (das ist normal!), aber Requests geben 404:
- ✅ Container funktioniert direkt: `curl http://localhost:3002/share-local/dev` → 200 OK
- ❌ Über NGINX: `curl http://nuernbergspots.de/share-local/dev` → 404

**Wichtig:** Next.js logged standardmäßig keine Requests, nur Start-Logs. Das ist normal!

---

## Lösung: Expliziter Pfad in proxy_pass

**Das Problem:** NGINX hängt den Location-Pfad nicht korrekt an, obwohl `proxy_pass` ohne trailing slash ist.

**Die Lösung:** Verwende expliziten Pfad in `proxy_pass`:

**Auf dem Server:**

```bash
sudo nano /etc/nginx/sites-available/nuernbergspots
```

**Ändere den `/share-local/dev` Block (Zeile 39):**

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
    
    # WebSocket support (für Hot Reload in Dev)
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

**Wichtig:** `proxy_pass http://localhost:3002/share-local/dev;` mit explizitem Pfad!

**Dann:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Testen:**

```bash
curl http://nuernbergspots.de/share-local/dev
# Sollte jetzt: HTML-Seite zurückgeben (nicht 404)
```

---

## Warum expliziter Pfad?

**NGINX proxy_pass Verhalten:**

1. **Ohne trailing slash:** `proxy_pass http://localhost:3002;`
   - Request: `GET /share-local/dev`
   - NGINX sendet: `GET /share-local/dev` ✅
   - **Aber:** Manchmal funktioniert das nicht korrekt, wenn andere Location-Blöcke vorhanden sind

2. **Mit explizitem Pfad:** `proxy_pass http://localhost:3002/share-local/dev;`
   - Request: `GET /share-local/dev`
   - NGINX sendet: `GET /share-local/dev` ✅
   - **Vorteil:** Funktioniert immer, unabhängig von anderen Location-Blöcken

3. **Mit trailing slash:** `proxy_pass http://localhost:3002/;`
   - Request: `GET /share-local/dev`
   - NGINX sendet: `GET /` ❌ (entfernt Location-Pfad)

---

## Für Unterpfade (z.B. /share-local/dev/login)

**Mit explizitem Pfad funktionieren Unterpfade automatisch:**

- Request: `GET /share-local/dev/login`
- NGINX sendet: `GET /share-local/dev/login` ✅

**Das funktioniert, weil NGINX den Rest-Pfad automatisch anhängt, wenn `proxy_pass` einen Pfad enthält.**

---

## Für Production

**Dasselbe für `/share-local/prd`:**

```nginx
location /share-local/prd {
    proxy_pass http://localhost:3102/share-local/prd;
    # ... rest gleich
}
```

---

## Troubleshooting

### Problem: Immer noch 404

**Prüfe:**

```bash
# 1. Prüfe ob Container läuft
docker ps | grep sharelocal-web-dev

# 2. Teste Container direkt
curl http://localhost:3002/share-local/dev

# 3. Prüfe NGINX Config
sudo nginx -t

# 4. Prüfe ob Location-Block korrekt ist
sudo sed -n '/location \/share-local\/dev[^\/]/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots
```

### Problem: Assets werden nicht geladen

**Ursache:** Assets haben falschen Pfad

**Lösung:** Next.js wurde mit `basePath: '/share-local/dev'` gebaut, Assets sollten automatisch korrekt sein.

---

## Zusammenfassung

**Das Problem:** NGINX sendet `/` statt `/share-local/dev` an Next.js.

**Die Lösung:** Expliziter Pfad in `proxy_pass`: `http://localhost:3002/share-local/dev`

**Warum:** Funktioniert immer, unabhängig von anderen Location-Blöcken oder NGINX-Versionen.

