# NGINX Rewrite Fix - ShareLocal

## Problem

Container funktioniert direkt, aber über NGINX gibt es 404:
- ✅ `curl http://localhost:3002/share-local/dev` → 200 OK
- ❌ `curl http://nuernbergspots.de/share-local/dev` → 404

**Location-Block Reihenfolge ist korrekt:**
- Zeile 39: `/share-local/dev` (allgemeiner)
- Zeile 60: `/share-local/dev/api` (spezifischer)

## Lösung: Rewrite entfernen

**Auf dem Server:**

```bash
sudo nano /etc/nginx/sites-available/nuernbergspots
```

**Suche nach Zeile 39 und prüfe den `/share-local/dev` Location-Block:**

```nginx
# FALSCH (mit rewrite):
location /share-local/dev {
    rewrite ^/share-local/dev/?(.*) /$1 break;  # ❌ Entfernt Prefix!
    proxy_pass http://localhost:3002;
    # ...
}

# RICHTIG (ohne rewrite):
location /share-local/dev {
    # KEIN rewrite - Next.js bekommt den vollen Pfad
    proxy_pass http://localhost:3002;  # OHNE trailing slash
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

**Wichtig:**
1. ❌ Entferne die `rewrite` Zeile komplett!
2. ✅ `proxy_pass http://localhost:3002;` OHNE trailing slash

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

## Warum funktioniert es jetzt?

**Vorher (mit rewrite):**
- Request: `GET /share-local/dev`
- NGINX entfernt Prefix: `GET /`
- NGINX sendet an Backend: `GET /`
- Next.js erwartet: `/share-local/dev`
- Resultat: 404 ❌

**Nachher (ohne rewrite):**
- Request: `GET /share-local/dev`
- NGINX behält Prefix: `GET /share-local/dev`
- NGINX sendet an Backend: `GET /share-local/dev`
- Next.js erwartet: `/share-local/dev`
- Resultat: 200 OK ✅

---

## Für Production

Dasselbe für `/share-local/prd`:

```nginx
location /share-local/prd {
    # KEIN rewrite
    proxy_pass http://localhost:3102;  # OHNE trailing slash
    # ... rest gleich
}
```

