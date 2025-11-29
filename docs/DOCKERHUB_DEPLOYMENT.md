# Docker Hub Deployment - ShareLocal

## Übersicht

Einfaches Deployment mit Docker Hub: GitHub Actions baut Images mit Environment Variables aus GitHub Secrets und pusht sie zu Docker Hub. Auf dem Server werden Images nur gepullt und gestartet.

---

## Schritt 1: GitHub Secrets konfigurieren

### 1.1 Erforderliche Secrets

Gehe zu: `https://github.com/<owner>/ShareLocal/settings/secrets/actions`

**Erforderliche Secrets:**

```bash
# Docker Hub Credentials
DOCKERHUB_USERNAME=dein-dockerhub-username
DOCKERHUB_TOKEN=dein-dockerhub-token  # Access Token von Docker Hub

# Production Environment Variables (für Build)
NEXT_PUBLIC_API_URL_PRD=https://nuernbergspots.de/share-local/prd/api
NEXT_PUBLIC_BASE_PATH_PRD=/share-local/prd

# Development Environment Variables (für Build)
NEXT_PUBLIC_API_URL_DEV=http://nuernbergspots.de/share-local/dev/api
NEXT_PUBLIC_BASE_PATH_DEV=/share-local/dev
```

### 1.2 Docker Hub Token erstellen

1. Gehe zu: https://hub.docker.com/settings/security
2. Erstelle neuen Access Token
3. Kopiere Token und füge als `DOCKERHUB_TOKEN` Secret hinzu

---

## Schritt 2: GitHub Actions Workflow

Der Workflow `.github/workflows/docker-build-push.yml` ist bereits konfiguriert und:

- ✅ Baut Images automatisch bei Push zu `main` oder `develop`
- ✅ Verwendet GitHub Secrets für Build Args
- ✅ Pusht Images zu Docker Hub: `<username>/sharelocal-api:latest` und `<username>/sharelocal-web:latest`
- ✅ Taggt automatisch: `latest`, `main`, `develop`, `<commit-sha>`

**Was passiert:**
- Push zu `main` → Production Images (`latest` Tag)
- Push zu `develop` → Development Images (`develop` Tag)

---

## Schritt 3: Server Setup (einmalig)

### 3.1 Minimales Setup

**Du brauchst nur diese Dateien auf dem Server:**

```bash
mkdir -p /opt/sharelocal/prd
cd /opt/sharelocal/prd

# Kopiere nur diese Dateien:
# - docker-compose.yml
# - docker-compose.prd.registry.yml (oder docker-compose.dev.registry.yml)
# - scripts/deploy-simple.sh
# - .env.production.example
```

**Oder klone Repository (nur für diese Dateien):**

```bash
git clone --depth 1 <repo-url> .
# Oder kopiere manuell die oben genannten Dateien
```

### 3.2 Environment Variables

```bash
cd /opt/sharelocal/prd

# Kopiere Template
cp .env.production.example .env.production

# Bearbeite
nano .env.production
```

**Wichtig:** Setze `DOCKERHUB_USERNAME`:

```env
# Docker Hub Username (für Image-Namen)
DOCKERHUB_USERNAME=dein-dockerhub-username

# Database
POSTGRES_USER=sharelocal
POSTGRES_PASSWORD=<password>
POSTGRES_DB=sharelocal

DATABASE_URL=postgresql://sharelocal:<password>@postgres:5432/sharelocal?schema=public
JWT_SECRET=<min-32-chars>
ENCRYPTION_KEY=<min-32-chars>

# Runtime Environment Variables (werden beim Start gesetzt)
NODE_ENV=production
LOG_LEVEL=info
NEXT_PUBLIC_API_URL=https://nuernbergspots.de/share-local/prd/api
NEXT_PUBLIC_BASE_PATH=/share-local/prd
```

---

## Schritt 4: Deployment

### 4.1 Einfaches Deployment

```bash
cd /opt/sharelocal/prd

# Lade Environment Variables
export $(cat .env.production | grep -v '^#' | xargs)

# Deploye (pullt Images und startet Container)
./scripts/deploy-simple.sh prd
```

**Was passiert:**
1. ✅ Pulled Images von Docker Hub
2. ✅ Startet PostgreSQL
3. ✅ Führt Migrations aus
4. ✅ Startet API und Web Container

### 4.2 Manuell (ohne Script)

```bash
# Pull Images
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml pull

# Starte Services
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml up -d
```

---

## Schritt 5: Updates deployen

### 5.1 Automatisch (nach Push zu GitHub)

```bash
# Auf dem Server
cd /opt/sharelocal/prd

# Pull neueste Images
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml pull

# Restart Services
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml up -d
```

### 5.2 Mit Script

```bash
cd /opt/sharelocal/prd
./scripts/deploy-simple.sh prd
```

---

## Image Tags

### Verfügbare Tags

- `latest` - Neueste Version von main Branch (Production)
- `main` - Main Branch
- `develop` - Develop Branch (Development)
- `<commit-sha>` - Spezifischer Commit (z.B. `main-abc1234`)

### Images auf Docker Hub

- **API**: `https://hub.docker.com/r/<username>/sharelocal-api`
- **Web**: `https://hub.docker.com/r/<username>/sharelocal-web`

---

## Unterschiede: Docker Hub vs. Local Build

| Feature | Docker Hub Deployment | Local Build |
|---------|----------------------|-------------|
| **Repository Clone** | ❌ Nicht nötig | ✅ Vollständig |
| **Build auf Server** | ❌ Nicht nötig | ✅ Erforderlich |
| **Deployment Zeit** | ⚡ Schnell (nur Pull) | 🐌 Langsam (Build) |
| **Server Ressourcen** | 💚 Gering | 💛 Hoch |
| **Environment Variables** | ✅ Aus GitHub Secrets | ❌ Lokal |

---

## Troubleshooting

### Problem: Docker Hub Login fehlgeschlagen

```bash
# Prüfe ob Images öffentlich sind oder Login nötig ist
docker pull <username>/sharelocal-api:latest

# Falls Login nötig:
docker login -u <username> -p <token>
```

### Problem: Image nicht gefunden

```bash
# Prüfe ob Image existiert
docker pull <username>/sharelocal-api:latest

# Prüfe DOCKERHUB_USERNAME
echo $DOCKERHUB_USERNAME

# Prüfe Image-Namen in docker-compose
cat docker-compose.prd.registry.yml | grep image
```

### Problem: Build Args fehlen

```bash
# Prüfe GitHub Secrets
# GitHub → Settings → Secrets → Actions

# Prüfe ob Secrets gesetzt sind:
# - DOCKERHUB_USERNAME
# - DOCKERHUB_TOKEN
# - NEXT_PUBLIC_API_URL_PRD
# - NEXT_PUBLIC_BASE_PATH_PRD
# - NEXT_PUBLIC_API_URL_DEV
# - NEXT_PUBLIC_BASE_PATH_DEV
```

---

## Workflow Übersicht

```
1. Code Push zu GitHub (main/develop)
   ↓
2. GitHub Actions Workflow startet
   ↓
3. Baut Docker Images mit Secrets als Build Args
   ↓
4. Pusht Images zu Docker Hub
   ↓
5. Auf Server: docker pull + docker-compose up
```

---

## Best Practices

### 1. Separate Images für Dev/Prd

- **Production**: `<username>/sharelocal-api:latest` (von main)
- **Development**: `<username>/sharelocal-api:develop` (von develop)

### 2. Versionierung

```bash
# Erstelle Git Tag für Version
git tag v1.0.0
git push origin v1.0.0

# Image wird automatisch als v1.0.0 getaggt
```

### 3. Rollback

```bash
# Verwende spezifischen Tag
# Ändere Image Tag in docker-compose.prd.registry.yml
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml pull
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml up -d
```

---

## Checkliste

### GitHub Setup
- [ ] Docker Hub Account erstellt
- [ ] Docker Hub Token erstellt
- [ ] GitHub Secrets konfiguriert:
  - [ ] `DOCKERHUB_USERNAME`
  - [ ] `DOCKERHUB_TOKEN`
  - [ ] `NEXT_PUBLIC_API_URL_PRD`
  - [ ] `NEXT_PUBLIC_BASE_PATH_PRD`
  - [ ] `NEXT_PUBLIC_API_URL_DEV`
  - [ ] `NEXT_PUBLIC_BASE_PATH_DEV`
- [ ] Workflow getestet (Push zu main/develop)

### Server Setup
- [ ] Docker installiert
- [ ] Docker Compose installiert
- [ ] Dateien kopiert (docker-compose.yml, docker-compose.prd.registry.yml, deploy-simple.sh)
- [ ] `.env.production` erstellt und ausgefüllt
- [ ] `DOCKERHUB_USERNAME` gesetzt

### Deployment
- [ ] Images gepullt (`docker compose pull`)
- [ ] Container gestartet (`docker compose up -d`)
- [ ] Health Checks erfolgreich
- [ ] Nginx konfiguriert

---

## Nächste Schritte

1. ✅ GitHub Secrets konfigurieren
2. ✅ Ersten Push zu main machen (Images werden gebaut)
3. ⏳ Auf Server: Images pullen und starten
4. ⏳ Nginx konfigurieren
5. ⏳ Testen

