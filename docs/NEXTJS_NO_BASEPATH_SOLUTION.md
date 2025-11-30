# Next.js OHNE basePath Lösung - ShareLocal

## Problem

NGINX-Konfiguration mit basePath funktioniert nicht zuverlässig. Lösung: Next.js OHNE basePath bauen, NGINX entfernt Prefix.

---

## Lösung: Next.js OHNE basePath

### Schritt 1: Next.js Config ändern

**Datei:** `packages/web/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sharelocal/shared'],
  
  // Enable standalone output for Docker
  output: 'standalone',
  
  // KEIN basePath - NGINX entfernt Prefix
  basePath: '',
  assetPrefix: '',
};

module.exports = nextConfig;
```

**Wichtig:** `basePath` und `assetPrefix` sind jetzt leer!

### Schritt 2: Dockerfile anpassen

**Datei:** `packages/web/Dockerfile`

```dockerfile
# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
# ARG NEXT_PUBLIC_BASE_PATH  # ❌ Nicht mehr benötigt
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}  # ❌ Nicht mehr benötigt
```

**Oder:** Lass die Zeilen drin, aber setze sie auf leer:

```dockerfile
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BASE_PATH=""
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_BASE_PATH=""
```

### Schritt 3: CI-Workflow anpassen

**Datei:** `.github/workflows/ci-web.yml`

**Entferne `NEXT_PUBLIC_BASE_PATH` aus Build-Args:**

```yaml
build-args: |
  NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL_DEV || 'http://nuernbergspots.de/share-local/dev/api' }}
  # NEXT_PUBLIC_BASE_PATH entfernt - Next.js läuft ohne basePath
```

**Entferne auch aus Runtime-Env:**

```yaml
-e NEXT_PUBLIC_API_URL="${{ secrets.NEXT_PUBLIC_API_URL_DEV || 'http://nuernbergspots.de/share-local/dev/api' }}"
# -e NEXT_PUBLIC_BASE_PATH entfernt
```

### Schritt 4: NGINX Config anpassen

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
    
    # WebSocket support
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

### Schritt 5: Links in Components anpassen

**Falls Links hardcoded sind, müssen sie angepasst werden:**

**Vorher:**
```tsx
<Link href="/login">Login</Link>
```

**Nachher:**
```tsx
// Links funktionieren weiterhin, da Next.js ohne basePath läuft
<Link href="/login">Login</Link>
// NGINX fügt automatisch /share-local/dev hinzu
```

**Oder mit Helper-Funktion:**

```tsx
// lib/utils/paths.ts
export function getPath(path: string) {
  // Für externe Links (z.B. API)
  if (path.startsWith('http')) {
    return path;
  }
  // Für interne Links - NGINX fügt Prefix hinzu
  return path;
}

// Verwendung:
<Link href={getPath('/login')}>Login</Link>
```

**Aber:** Da NGINX den Prefix entfernt, sollten normale Next.js Links weiterhin funktionieren!

---

## Vorteile dieser Lösung

- ✅ Einfacher: Next.js läuft wie normal (ohne basePath)
- ✅ Zuverlässiger: NGINX rewrite ist bewährt und funktioniert immer
- ✅ Weniger Fehlerquellen: Keine basePath-Konfiguration nötig
- ✅ Assets funktionieren automatisch

---

## Nachteile

- ❌ Links müssen manuell angepasst werden (falls sie basePath verwenden)
- ❌ Assets müssen über NGINX geroutet werden

---

## Implementierung

1. ✅ Ändere `next.config.js` (basePath entfernen)
2. ✅ Ändere Dockerfile (NEXT_PUBLIC_BASE_PATH entfernen)
3. ✅ Ändere CI-Workflow (NEXT_PUBLIC_BASE_PATH entfernen)
4. ✅ Ändere NGINX Config (rewrite hinzufügen)
5. ✅ Teste

---

## Testen

**Nach Änderungen:**

```bash
# Container neu bauen und deployen
# Dann testen:
curl http://nuernbergspots.de/share-local/dev
# Sollte: HTML-Seite zurückgeben

curl http://nuernbergspots.de/share-local/dev/login
# Sollte: Login-Seite zurückgeben
```

---

## Zusammenfassung

**Das Problem:** basePath-Konfiguration funktioniert nicht zuverlässig mit NGINX.

**Die Lösung:** Next.js OHNE basePath bauen, NGINX entfernt Prefix mit rewrite.

**Warum:** Einfacher, zuverlässiger, weniger Fehlerquellen.

