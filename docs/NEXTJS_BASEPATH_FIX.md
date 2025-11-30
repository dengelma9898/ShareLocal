# Next.js basePath Fix - ShareLocal

## Problem

Next.js gibt einen 404 zurück, obwohl der Health-Endpoint funktioniert.

**Symptom:**
```bash
curl http://nuernbergspots.de/share-local/dev
# {"statusCode":404,"timestamp":"...","message":"Cannot GET /"}
```

**Ursache:**
- NGINX entfernt den `/share-local/dev` Prefix mit `rewrite`
- Next.js wurde aber mit `basePath: '/share-local/dev'` gebaut
- Next.js erwartet `/share-local/dev/` im Request, bekommt aber nur `/`

---

## Lösung: Zwei Optionen

### Option 1: NGINX behält Prefix, Next.js mit basePath (Empfohlen)

**Vorteile:**
- ✅ Next.js kennt seinen basePath (für Links, Assets, etc.)
- ✅ Einfacher für Next.js Routing
- ✅ Assets werden korrekt geladen

**NGINX Config ändern:**

```nginx
# ShareLocal Dev Web - /share-local/dev
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

**Wichtig:** Entferne die `rewrite` Zeile! Next.js bekommt dann `/share-local/dev/` und kann es korrekt routen.

---

### Option 2: NGINX entfernt Prefix, Next.js ohne basePath

**Vorteile:**
- ✅ Next.js sieht nur `/` (einfacher)
- ✅ Keine basePath-Konfiguration nötig

**Nachteile:**
- ❌ Links und Assets müssen manuell angepasst werden
- ❌ Komplexer für Next.js

**NGINX Config (bleibt wie jetzt):**
```nginx
location /share-local/dev {
    rewrite ^/share-local/dev/?(.*) /$1 break;
    proxy_pass http://localhost:3002;
    # ...
}
```

**Next.js Config ändern:**
- Build OHNE `basePath` (leer lassen)
- Oder `basePath` zur Laufzeit überschreiben

---

## Empfehlung: Option 1

**Warum Option 1 besser ist:**
1. Next.js ist für basePath designed
2. Automatische Link-Generierung funktioniert
3. Assets werden korrekt geladen
4. Weniger manuelle Anpassungen nötig

---

## Implementierung: Option 1

### Schritt 1: NGINX Config aktualisieren

```bash
sudo nano /etc/nginx/sites-available/nuernbergspots
```

**Ändere:**
```nginx
# VORHER (falsch):
location /share-local/dev {
    rewrite ^/share-local/dev/?(.*) /$1 break;  # ❌ Entfernt Prefix
    proxy_pass http://localhost:3002;
    # ...
}

# NACHHER (richtig):
location /share-local/dev {
    # KEIN rewrite - Next.js bekommt den vollen Pfad
    # WICHTIG: Trailing slash bei proxy_pass, damit NGINX Location-Pfad anhängt
    proxy_pass http://localhost:3002/;  # ✅ Mit trailing slash
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

**Wichtig:** `proxy_pass` muss mit `/share-local/dev` enden (mit trailing slash), damit NGINX den Location-Pfad anhängt!

### Schritt 2: NGINX neu laden

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Schritt 3: Testen

```bash
curl http://nuernbergspots.de/share-local/dev
# Sollte: HTML-Seite zurückgeben (nicht 404)
```

---

## Alternative: Option 2 (falls Option 1 nicht funktioniert)

### Schritt 1: Next.js ohne basePath bauen

**Dockerfile ändern:**
```dockerfile
# Build OHNE basePath (leer lassen)
ARG NEXT_PUBLIC_API_URL
# ARG NEXT_PUBLIC_BASE_PATH  # ❌ Nicht setzen
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# ENV NEXT_PUBLIC_BASE_PATH=""  # Leer lassen
```

**Oder:** `next.config.js` ändern:
```js
basePath: '',  // Immer leer, NGINX macht das Routing
```

### Schritt 2: Container neu bauen

```bash
# Image neu bauen mit leerem basePath
docker build ...
```

---

## Troubleshooting

### Problem: "Cannot GET /share-local/dev"

**Ursache:** NGINX entfernt Prefix, aber Next.js erwartet ihn.

**Lösung:** Option 1 verwenden (NGINX behält Prefix).

### Problem: Assets werden nicht geladen

**Ursache:** `assetPrefix` stimmt nicht mit `basePath` überein.

**Lösung:** Beide auf den gleichen Wert setzen:
```js
basePath: '/share-local/dev',
assetPrefix: '/share-local/dev',
```

### Problem: Links funktionieren nicht

**Ursache:** Next.js `Link` Komponente verwendet basePath nicht korrekt.

**Lösung:** Option 1 verwenden, dann funktioniert `Link` automatisch.

---

## Zusammenfassung

1. ✅ **Option 1 (Empfohlen):** NGINX behält Prefix, Next.js mit basePath
2. ⚠️ **Option 2:** NGINX entfernt Prefix, Next.js ohne basePath

**Nächster Schritt:** NGINX Config aktualisieren (Option 1) und testen!

