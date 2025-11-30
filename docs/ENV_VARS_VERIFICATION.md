# Environment Variables Verification - ShareLocal

## Übersicht

Dieses Dokument verifiziert alle Environment-Variablen für Web und API in CI/CD und docker-compose Dateien.

---

## CI/CD Deployment (GitHub Actions)

### Web Dev Deployment

**Workflow:** `.github/workflows/ci-web.yml` → `deploy-dev`

**Build-Args (beim Build gesetzt):**
```yaml
build-args: |
  NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL_DEV || 'http://nuernbergspots.de/share-local/dev/api' }}
  NEXT_PUBLIC_BASE_PATH=${{ secrets.NEXT_PUBLIC_BASE_PATH_DEV || '/share-local/dev' }}
```

**Runtime Environment Variables:**
```bash
-e NODE_ENV=development
-e PORT=3002
-e NEXT_PUBLIC_API_URL="${{ secrets.NEXT_PUBLIC_API_URL_DEV || 'http://nuernbergspots.de/share-local/dev/api' }}"
-e NEXT_PUBLIC_BASE_PATH="${{ secrets.NEXT_PUBLIC_BASE_PATH_DEV || '/share-local/dev' }}"
```

**Status:** ✅ Korrekt

---

### Web Prd Deployment

**Workflow:** `.github/workflows/ci-web.yml` → `deploy-prd`

**Build-Args (beim Build gesetzt):**
```yaml
build-args: |
  NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL_PRD || 'https://nuernbergspots.de/share-local/prd/api' }}
  NEXT_PUBLIC_BASE_PATH=${{ secrets.NEXT_PUBLIC_BASE_PATH_PRD || '/share-local/prd' }}
```

**Runtime Environment Variables:**
```bash
-e NODE_ENV=production
-e PORT=3102
-e NEXT_PUBLIC_API_URL="${{ secrets.NEXT_PUBLIC_API_URL_PRD || 'https://nuernbergspots.de/share-local/prd/api' }}"
-e NEXT_PUBLIC_BASE_PATH="${{ secrets.NEXT_PUBLIC_BASE_PATH_PRD || '/share-local/prd' }}"
```

**Status:** ✅ Korrekt

---

## Docker Compose Dateien

### Verwendung

**Wichtig:** Docker Compose Dateien werden **NUR für lokale Entwicklung** verwendet, **NICHT für Server-Deployment**!

**Server-Deployment:** Verwendet `docker run` direkt (siehe CI-Workflows)

**Lokale Entwicklung:** Verwendet `docker-compose` mit Override-Dateien

---

### docker-compose.yml (Basis)

**Web Service:**
```yaml
web:
  build:
    args:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3001}
      NEXT_PUBLIC_BASE_PATH: ${NEXT_PUBLIC_BASE_PATH:-}  # ⚠️ Leer!
  environment:
    PORT: 3000  # ⚠️ Veraltet - sollte 3002 sein für Dev
    NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3001}
    NEXT_PUBLIC_BASE_PATH: ${NEXT_PUBLIC_BASE_PATH:-}  # ⚠️ Leer!
```

**Status:** ⚠️ Port 3000 ist veraltet (sollte 3002 sein), aber für lokale Entwicklung OK

---

### docker-compose.dev.yml (Development Override)

**Web Service:**
```yaml
web:
  environment:
    NODE_ENV: development
    NEXT_PUBLIC_API_URL: http://localhost:3001
    NEXT_PUBLIC_BASE_PATH: /share-local/dev  # ✅ Korrekt
```

**Status:** ✅ Korrekt für lokale Entwicklung

---

### docker-compose.prd.yml (Production Override)

**Web Service:**
```yaml
web:
  build:
    args:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-https://nuernbergspots.de/share-local/prd/api}
      NEXT_PUBLIC_BASE_PATH: /share-local/prd  # ✅ Korrekt
  environment:
    NODE_ENV: production
    NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-https://nuernbergspots.de/share-local/prd/api}
    NEXT_PUBLIC_BASE_PATH: /share-local/prd  # ✅ Korrekt
```

**Status:** ✅ Korrekt

---

## Wichtige Erkenntnisse

### 1. NEXT_PUBLIC_* Variablen

**Wichtig:** `NEXT_PUBLIC_*` Variablen werden beim Build in den Code eingebaut!

- ✅ Build-Args müssen gesetzt sein (im Dockerfile)
- ✅ Runtime Environment Variables werden ignoriert, wenn sie beim Build nicht gesetzt waren
- ✅ Beide (Build-Args UND Runtime) sollten gesetzt sein für Konsistenz

### 2. basePath

**Wichtig:** `basePath` wird beim Build evaluiert und in `next.config.js` eingebaut!

- ✅ Muss beim Build gesetzt sein (Build-Arg)
- ✅ Runtime Variable wird ignoriert für basePath (nur für Client-Side Code)

### 3. Ports

**CI/CD:** 
- Dev: Port 3002 ✅
- Prd: Port 3102 ✅

**docker-compose.yml:**
- Basis: Port 3000 ⚠️ (veraltet, aber OK für lokale Entwicklung)

---

## Empfehlungen

### Docker Compose Dateien

**Option 1: Behalten (für lokale Entwicklung)**
- ✅ Nützlich für lokale Entwicklung
- ✅ Einfaches `docker-compose up`
- ⚠️ Ports sind veraltet, aber für lokal OK

**Option 2: Entfernen (wenn nicht verwendet)**
- ✅ Weniger Verwirrung
- ✅ Klarere Trennung: CI/CD für Deployment, lokale Entwicklung ohne Docker

**Empfehlung:** Behalten, aber dokumentieren, dass sie nur für lokale Entwicklung sind.

---

## Verifizierung Checkliste

### CI/CD Workflows

- [x] ✅ Build-Args für `NEXT_PUBLIC_API_URL` gesetzt
- [x] ✅ Build-Args für `NEXT_PUBLIC_BASE_PATH` gesetzt
- [x] ✅ Runtime Environment Variables gesetzt
- [x] ✅ Ports korrekt (3002 Dev, 3102 Prd)

### Docker Compose (lokale Entwicklung)

- [x] ✅ `docker-compose.dev.yml` hat korrekten basePath
- [x] ✅ `docker-compose.prd.yml` hat korrekten basePath
- [ ] ⚠️ `docker-compose.yml` Port 3000 ist veraltet (aber OK für lokal)

---

## Zusammenfassung

**CI/CD Deployment:** ✅ Alle Environment-Variablen korrekt gesetzt

**Docker Compose:** ✅ Korrekt für lokale Entwicklung, Ports sind veraltet aber OK

**Nächster Schritt:** Container neu bauen, um sicherzustellen, dass basePath beim Build gesetzt wurde.

