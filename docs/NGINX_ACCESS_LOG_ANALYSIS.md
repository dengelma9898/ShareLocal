# NGINX Access Log Analysis - ShareLocal

## Problem-Analyse

NGINX Access Logs zeigen:
- ✅ `/share-local/dev/health` → 200 OK
- ❌ `/share-local/dev` → 404
- ❌ `/share-local/dev/` → 404

**Das bedeutet:**
1. NGINX matched den `/share-local/dev/health` Block korrekt
2. NGINX matched den `/share-local/dev` Block, aber Next.js gibt 404 zurück
3. **Problem:** NGINX sendet wahrscheinlich `/` statt `/share-local/dev` an Next.js

---

## Lösung: Expliziter Pfad in proxy_pass

**Das Problem:** Der `/share-local/dev` Block sendet `/` statt `/share-local/dev` an Next.js.

**Die Lösung:** Verwende expliziten Pfad in `proxy_pass`:

**Auf dem Server:**

```bash
sudo nano /etc/nginx/sites-available/nuernbergspots
```

**Prüfe zuerst die aktuelle Config:**

```bash
# Zeige den kompletten /share-local/dev Block
sudo sed -n '/location \/share-local\/dev[^\/]/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots
```

**Ändere den `/share-local/dev` Block:**

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

## Warum funktioniert /health aber nicht /?

**Der `/share-local/dev/health` Block funktioniert, weil:**
- Er hat wahrscheinlich einen eigenen Location-Block: `location /share-local/dev/health`
- Dieser Block ist spezifischer und wird zuerst matched
- Er hat wahrscheinlich bereits einen expliziten Pfad oder korrekte Konfiguration

**Der `/share-local/dev` Block funktioniert nicht, weil:**
- NGINX hängt den Location-Pfad nicht korrekt an
- Oder es gibt einen Konflikt mit anderen Location-Blöcken

**Die Lösung:** Expliziter Pfad in `proxy_pass` behebt das Problem.

---

## Prüfe aktuelle Config

**Auf dem Server:**

```bash
# Zeige alle Location-Blöcke für share-local/dev
sudo awk '/location.*share-local\/dev/ {print NR": "$0}' /etc/nginx/sites-available/nuernbergspots

# Zeige den /share-local/dev Block komplett
sudo sed -n '/location \/share-local\/dev[^\/]/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots

# Zeige den /share-local/dev/health Block komplett
sudo sed -n '/location \/share-local\/dev\/health/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots
```

**Vergleiche die beiden Blocks - der `/health` Block hat wahrscheinlich eine andere `proxy_pass` Konfiguration!**

---

## Alternative: Prüfe was NGINX wirklich sendet

**Wenn expliziter Pfad nicht funktioniert:**

```bash
# Teste mit tcpdump
sudo tcpdump -i lo -A -s 0 'tcp port 3002 and host localhost' &
TCPDUMP_PID=$!

# Mache Request
curl http://nuernbergspots.de/share-local/dev

# Stoppe tcpdump
sudo kill $TCPDUMP_PID

# Schaue Output - suche nach "GET /" oder "GET /share-local/dev"
```

---

## Zusammenfassung

**Das Problem:** NGINX sendet `/` statt `/share-local/dev` an Next.js.

**Die Lösung:** Expliziter Pfad in `proxy_pass`: `http://localhost:3002/share-local/dev`

**Warum /health funktioniert:** Hat wahrscheinlich bereits korrekte Config oder eigenen Location-Block.

