# Web Build Verifizierung - ShareLocal

## Übersicht

Dieses Dokument beschreibt, was für den Web Build benötigt wird und wie man ihn verifiziert.

---

## Was wird benötigt?

### 1. GitHub Secrets

**Dev Environment:**
- `NEXT_PUBLIC_API_URL_DEV` (optional, Default: `https://nuernbergspots.de/share-local/dev`) - **⚠️ WICHTIG:** Ohne `/api`, wird automatisch hinzugefügt
- `NEXT_PUBLIC_BASE_PATH_DEV` (optional, Default: `/share-local/dev`)

**Prd Environment:**
- `NEXT_PUBLIC_API_URL_PRD` (optional, Default: `https://nuernbergspots.de/share-local/prd`) - **⚠️ WICHTIG:** Ohne `/api`, wird automatisch hinzugefügt
- `NEXT_PUBLIC_BASE_PATH_PRD` (optional, Default: `/share-local/prd`)

### 2. Port-Konfiguration

**WICHTIG:** Ports müssen konsistent sein zwischen CI-Workflow, Dockerfile und NGINX!

| Service | Environment | Port | NGINX Location |
|---------|-------------|------|----------------|
| Web | Development | **3002** | `/share-local/dev` |
| Web | Production | **3102** | `/share-local/prd` |

**Hinweis:** Ports 3000 und 3100 sind bereits von anderen Services belegt, daher verwenden wir 3002 und 3102.

### 3. Health Endpoint

**Problem:** Next.js Web hat keinen `/health` Endpoint, aber Dockerfile erwartet ihn!

**Lösung:** Health-Endpoint erstellen in `packages/web/app/health/route.ts`

---

## Verifizierungs-Checkliste

### Vor dem Build

- [ ] **GitHub Secrets prüfen**
  ```bash
  # Prüfe ob Secrets gesetzt sind (in GitHub UI)
  # Settings → Environments → dev/prd → Secrets
  ```

- [ ] **Port-Konfiguration konsistent**
  - [ ] CI-Workflow (`.github/workflows/ci-web.yml`)
  - [ ] NGINX Config (`infrastructure/nginx/share-local-*.conf`)
  - [ ] Dockerfile (`packages/web/Dockerfile`)

- [ ] **Health Endpoint vorhanden**
  - [ ] `packages/web/app/health/route.ts` existiert
  - [ ] Endpoint gibt `200 OK` zurück

### Build-Prozess

- [ ] **Dependencies installieren**
  ```bash
  pnpm install --frozen-lockfile
  ```

- [ ] **Prisma Client generieren**
  ```bash
  pnpm --filter @sharelocal/database db:generate
  ```

- [ ] **Shared Package bauen**
  ```bash
  pnpm --filter @sharelocal/shared build
  ```

- [ ] **Web Build**
  ```bash
  pnpm --filter @sharelocal/web build
  ```

- [ ] **Standalone Output prüfen**
  ```bash
  # Prüfe ob .next/standalone existiert
  ls -la packages/web/.next/standalone
  ```

### Docker Build

- [ ] **Build Args korrekt**
  - [ ] `NEXT_PUBLIC_API_URL` wird übergeben
  - [ ] `NEXT_PUBLIC_BASE_PATH` wird übergeben

- [ ] **Image erfolgreich gebaut**
  ```bash
  docker build -f packages/web/Dockerfile \
    --build-arg NEXT_PUBLIC_API_URL=https://nuernbergspots.de/share-local/dev \
    --build-arg NEXT_PUBLIC_BASE_PATH=/share-local/dev \
    -t sharelocal-web-dev:test .
  ```

- [ ] **Container startet**
  ```bash
  docker run -d \
    --name sharelocal-web-test \
    -p 3002:3002 \
    -e NODE_ENV=development \
    -e PORT=3002 \
    -e NEXT_PUBLIC_API_URL=https://nuernbergspots.de/share-local/dev \
    -e NEXT_PUBLIC_BASE_PATH=/share-local/dev \
    sharelocal-web-dev:test
  ```

- [ ] **Health Check funktioniert**
  ```bash
  curl http://localhost:3002/health
  # Sollte: {"status":"ok"} zurückgeben
  ```

### Deployment

- [ ] **Container läuft**
  ```bash
  docker ps | grep sharelocal-web
  ```

- [ ] **Port ist korrekt**
  ```bash
  docker inspect sharelocal-web-dev | grep -A 5 '"Ports"'
  ```

- [ ] **Netzwerk korrekt**
  ```bash
  docker network inspect sharelocal-network | grep sharelocal-web
  ```

- [ ] **NGINX Proxy funktioniert**
  ```bash
  curl http://nuernbergspots.de/share-local/dev
  # Sollte: HTML-Seite zurückgeben
  ```

- [ ] **API-Verbindung funktioniert**
  ```bash
  # Prüfe ob Frontend API-Calls macht
  curl http://nuernbergspots.de/share-local/dev/api/health
  ```

---

## Bekannte Probleme & Fixes

### Problem 1: Port-Konflikt

**Symptom:** Ports 3000 und 3100 sind bereits von anderen Services belegt.

**Fix:** Alternative Ports verwenden:
- Dev: Port 3002 (statt 3000)
- Prd: Port 3102 (statt 3100)

### Problem 2: Health Endpoint fehlt

**Symptom:** Docker Health Check schlägt fehl, weil `/health` nicht existiert.

**Fix:** Health-Endpoint erstellen in `packages/web/app/health/route.ts`

### Problem 3: Base Path Konfiguration

**Symptom:** Assets werden nicht korrekt geladen unter `/share-local/dev`.

**Fix:** 
- `NEXT_PUBLIC_BASE_PATH` muss beim Build gesetzt werden (Build Arg)
- `basePath` und `assetPrefix` in `next.config.js` müssen korrekt sein

---

## Nächste Schritte

1. ✅ Health-Endpoint erstellen
2. ✅ Port-Konfiguration korrigieren
3. ✅ GitHub Secrets prüfen
4. ✅ Test-Build durchführen
5. ✅ Deployment testen

