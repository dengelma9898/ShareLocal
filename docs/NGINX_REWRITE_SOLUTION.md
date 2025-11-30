# NGINX Rewrite Solution - ShareLocal

## Lösung: Next.js OHNE basePath, NGINX entfernt Prefix

Nachdem Next.js jetzt OHNE basePath gebaut wird, muss NGINX den Prefix entfernen.

---

## NGINX Config anpassen

**Auf dem Server:**

```bash
sudo nano /etc/nginx/sites-available/nuernbergspots
```

**Ändere den `/share-local/dev` Block:**

```nginx
location /share-local/dev {
    # Entfernt Prefix - Next.js sieht nur /
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
```

**Wichtig:**
- `rewrite ^/share-local/dev/?(.*) /$1 break;` entfernt den Prefix
- `proxy_pass http://localhost:3002;` ohne Pfad (Next.js sieht nur `/`)

**Für Production (`/share-local/prd`):**

```nginx
location /share-local/prd {
    rewrite ^/share-local/prd/?(.*) /$1 break;
    proxy_pass http://localhost:3102;
    # ... rest gleich
}
```

**Dann:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Testen:**

```bash
curl http://nuernbergspots.de/share-local/dev
# Sollte jetzt: HTML-Seite zurückgeben (nicht 404)

curl http://nuernbergspots.de/share-local/dev/login
# Sollte: Login-Seite zurückgeben
```

---

## Wie es funktioniert

**Request-Flow:**

1. **Request:** `GET /share-local/dev`
2. **NGINX rewrite:** Entfernt `/share-local/dev` → `GET /`
3. **NGINX proxy_pass:** Sendet `GET /` an `http://localhost:3002`
4. **Next.js:** Sieht nur `/` (Root-Route)
5. **Response:** HTML-Seite
6. **NGINX:** Sendet Response zurück an Client

**Für Unterpfade:**

1. **Request:** `GET /share-local/dev/login`
2. **NGINX rewrite:** Entfernt `/share-local/dev` → `GET /login`
3. **NGINX proxy_pass:** Sendet `GET /login` an `http://localhost:3002`
4. **Next.js:** Sieht `/login` (Login-Route)
5. **Response:** Login-Seite

---

## Vorteile

- ✅ Einfacher: Next.js läuft wie normal (ohne basePath)
- ✅ Zuverlässiger: NGINX rewrite ist bewährt
- ✅ Links funktionieren automatisch (relative Pfade)
- ✅ Assets funktionieren automatisch

---

## Zusammenfassung

**Änderungen:**
1. ✅ Next.js Config: `basePath: ''` (leer)
2. ✅ Dockerfile: `NEXT_PUBLIC_BASE_PATH` entfernt
3. ✅ CI-Workflow: `NEXT_PUBLIC_BASE_PATH` entfernt
4. ✅ NGINX Config: `rewrite` hinzugefügt

**Ergebnis:** Next.js läuft ohne basePath, NGINX entfernt Prefix - einfacher und zuverlässiger!

