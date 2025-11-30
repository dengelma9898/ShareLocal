# Next.js basePath Debugging

## Problem

NGINX Config wurde angepasst, aber Next.js gibt immer noch 404 zurück.

## Debugging-Schritte

### Schritt 1: Prüfe was NGINX an Next.js sendet

**Auf dem Server:**

```bash
# Prüfe NGINX Logs
sudo tail -f /var/log/nginx/access.log

# In einem anderen Terminal:
curl http://nuernbergspots.de/share-local/dev

# Schaue was in den Logs steht
```

### Schritt 2: Prüfe Container Logs

```bash
# Prüfe was Next.js Container empfängt
docker logs sharelocal-web-dev --tail 50

# Mache einen Request und schaue die Logs
curl http://nuernbergspots.de/share-local/dev
docker logs sharelocal-web-dev --tail 10
```

### Schritt 3: Teste direkt den Container

```bash
# Teste direkt ohne NGINX
curl http://localhost:3002/share-local/dev
curl http://localhost:3002/share-local/dev/
curl http://localhost:3002/
```

### Schritt 4: Prüfe basePath im Container

```bash
# Prüfe Environment Variables
docker exec sharelocal-web-dev printenv | grep BASE_PATH
docker exec sharelocal-web-dev printenv | grep NEXT_PUBLIC

# Prüfe ob basePath beim Build gesetzt wurde
docker exec sharelocal-web-dev cat packages/web/.next/BUILD_ID
docker exec sharelocal-web-dev ls -la packages/web/.next/
```

---

## Mögliche Probleme & Lösungen

### Problem 1: Doppeltes basePath

**Symptom:** NGINX sendet `/share-local/dev/share-local/dev`

**Ursache:** `proxy_pass` mit trailing path + location path = doppelt

**Lösung:** `proxy_pass` OHNE trailing path verwenden:

```nginx
# FALSCH:
proxy_pass http://localhost:3002/share-local/dev;  # ❌ Doppelt

# RICHTIG:
proxy_pass http://localhost:3002/;  # ✅ NGINX hängt Location-Pfad an
```

### Problem 2: Next.js erwartet `/` statt `/share-local/dev`

**Symptom:** Next.js wurde OHNE basePath gebaut, aber NGINX sendet `/share-local/dev`

**Ursache:** Build-Arg `NEXT_PUBLIC_BASE_PATH` wurde nicht gesetzt oder leer

**Lösung:** Container neu bauen mit korrektem basePath:

```bash
# Prüfe Build-Args im CI-Workflow
# NEXT_PUBLIC_BASE_PATH muss gesetzt sein
```

### Problem 3: Next.js standalone Server ignoriert basePath

**Symptom:** Next.js wurde MIT basePath gebaut, aber Server erwartet `/`

**Ursache:** Next.js standalone Server behandelt basePath anders

**Lösung:** NGINX muss `/` senden, nicht `/share-local/dev`:

```nginx
location /share-local/dev {
    rewrite ^/share-local/dev/?(.*) /$1 break;  # Entfernt Prefix
    proxy_pass http://localhost:3002;  # Sendet nur / oder /rest
    # ...
}
```

**Aber dann:** Next.js OHNE basePath bauen!

---

## Empfohlene Lösung: Option 3

**Next.js OHNE basePath bauen, NGINX macht das Routing:**

### Schritt 1: NGINX Config (wie ursprünglich)

```nginx
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
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

### Schritt 2: Next.js OHNE basePath bauen

**Dockerfile ändern:**

```dockerfile
# Build OHNE basePath
ARG NEXT_PUBLIC_API_URL
# ARG NEXT_PUBLIC_BASE_PATH  # ❌ Nicht setzen
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# ENV NEXT_PUBLIC_BASE_PATH=""  # Leer lassen
```

**Oder:** `next.config.js` ändern:

```js
basePath: '',  // Immer leer
assetPrefix: '',  // Immer leer
```

### Schritt 3: Links manuell anpassen

**In React Components:**

```tsx
// Statt:
<Link href="/login">Login</Link>

// Verwende:
<Link href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/login`}>Login</Link>

// Oder besser: Helper-Funktion
function getPath(path: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${basePath}${path}`;
}

<Link href={getPath('/login')}>Login</Link>
```

---

## Schnell-Fix: Teste beide Optionen

### Test 1: Container direkt testen

```bash
# Teste mit basePath
curl http://localhost:3002/share-local/dev
curl http://localhost:3002/share-local/dev/

# Teste ohne basePath
curl http://localhost:3002/
curl http://localhost:3002/health
```

**Wenn `/health` funktioniert, aber `/share-local/dev` nicht:**
→ Next.js wurde MIT basePath gebaut, aber NGINX sendet falschen Pfad

**Wenn `/` funktioniert:**
→ Next.js wurde OHNE basePath gebaut, NGINX muss `/` senden

### Test 2: NGINX Logs prüfen

```bash
sudo tail -f /var/log/nginx/access.log | grep share-local
```

**Schaue:** Was sendet NGINX an Backend?

---

## Nächste Schritte

1. ✅ Führe Debugging-Schritte aus
2. ✅ Prüfe Container Logs
3. ✅ Teste Container direkt
4. ✅ Basierend auf Ergebnissen: Option 1 oder Option 3 verwenden

