# Deployment mit Container Registry - ShareLocal

## Übersicht

Automatisiertes Deployment mit GitHub Actions und GitHub Container Registry (ghcr.io). Images werden automatisch gebaut und gepusht, auf dem Server werden sie nur gepullt.

---

## Vorteile

✅ **Kein Repository Clone nötig** - Nur docker-compose.yml und .env Dateien  
✅ **Automatisches Build** - Bei jedem Push zu main/develop  
✅ **Schnelleres Deployment** - Kein Build auf dem Server  
✅ **Versionierung** - Images werden getaggt (branch, commit SHA, tags)  
✅ **Multi-Architecture** - Unterstützt amd64 und arm64  

---

## Schritt 1: GitHub Actions Setup

### 1.1 Workflow aktivieren

Der Workflow `.github/workflows/docker-build-push.yml` ist bereits erstellt und wird automatisch bei Push zu `main` oder `develop` ausgeführt.

**Was passiert:**
- ✅ Images werden gebaut (API und Web)
- ✅ Images werden zu `ghcr.io/<owner>/sharelocal-api` und `sharelocal-web` gepusht
- ✅ Tags: `latest`, `main`, `develop`, `<commit-sha>`

### 1.2 Images ansehen

Nach dem ersten Push kannst du die Images hier sehen:
- **GitHub**: `https://github.com/<owner>/ShareLocal/pkgs/container/sharelocal-api`
- **Registry**: `ghcr.io/<owner>/sharelocal-api:latest`

---

## Schritt 2: Server Setup (einmalig)

### 2.1 Docker Login zu ghcr.io

**Option 1: Mit GitHub Personal Access Token (empfohlen)**

```bash
# Erstelle GitHub PAT mit 'read:packages' Berechtigung
# https://github.com/settings/tokens

# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin
```

**Option 2: Mit GitHub CLI**

```bash
# Installiere gh CLI
# https://cli.github.com/

# Login
gh auth login
docker login ghcr.io -u <username> -p $(gh auth token)
```

**Option 3: Mit GitHub Actions Token (für CI/CD)**

```bash
# Auf dem Server (falls GitHub Actions läuft)
echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
```

### 2.2 Minimales Repository Setup

**Du brauchst nur:**

```bash
# Erstelle Verzeichnis
mkdir -p /opt/sharelocal/prd
cd /opt/sharelocal/prd

# Klone nur die notwendigen Dateien (oder kopiere manuell)
git clone --depth 1 --filter=blob:none --sparse <repo-url> .
git sparse-checkout set docker-compose.yml docker-compose.prd.registry.yml scripts infrastructure/nginx .env.production.example
```

**Oder kopiere manuell:**
- `docker-compose.yml`
- `docker-compose.prd.registry.yml` (oder `docker-compose.dev.registry.yml`)
- `scripts/deploy-from-registry.sh`
- `.env.production.example`
- `infrastructure/nginx/share-local-prd.conf` (für Nginx)

### 2.3 Environment Variables

```bash
cd /opt/sharelocal/prd

# Kopiere Template
cp .env.production.example .env.production

# Bearbeite
nano .env.production
```

**Wichtig:** Füge hinzu:
```env
# GitHub Repository Owner (für Image-Namen)
GITHUB_REPOSITORY_OWNER=dengelma9898

# Rest wie gewohnt...
DATABASE_URL=...
JWT_SECRET=...
ENCRYPTION_KEY=...
```

---

## Schritt 3: Deployment

### 3.1 Deploye Production

```bash
cd /opt/sharelocal/prd

# Lade Environment Variables
export $(cat .env.production | grep -v '^#' | xargs)

# Deploye
./scripts/deploy-from-registry.sh prd
```

**Was passiert:**
1. ✅ Prüft Docker Login
2. ✅ Pulled Images von ghcr.io
3. ✅ Startet PostgreSQL
4. ✅ Führt Migrations aus
5. ✅ Startet API und Web Container

### 3.2 Deploye Development

```bash
cd /opt/sharelocal/dev

# Lade Environment Variables
export $(cat .env.dev | grep -v '^#' | xargs)

# Deploye
./scripts/deploy-from-registry.sh dev
```

---

## Schritt 4: Updates deployen

### 4.1 Automatisch (bei Push zu main/develop)

```bash
# Auf dem Server
cd /opt/sharelocal/prd

# Pull neueste Images
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml pull

# Restart Services
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml up -d
```

### 4.2 Manuell (mit Script)

```bash
cd /opt/sharelocal/prd
./scripts/deploy-from-registry.sh prd
```

---

## Image Tags

### Verfügbare Tags

- `latest` - Neueste Version von main Branch
- `main` - Main Branch
- `develop` - Develop Branch
- `<commit-sha>` - Spezifischer Commit (z.B. `main-abc1234`)
- `v1.0.0` - Version Tags (wenn Git Tag erstellt)

### Tag verwenden

In `docker-compose.prd.registry.yml`:

```yaml
api:
  image: ghcr.io/dengelma9898/sharelocal-api:v1.0.0  # Spezifische Version
  # oder
  image: ghcr.io/dengelma9898/sharelocal-api:main-abc1234  # Spezifischer Commit
```

---

## Unterschiede: Registry vs. Local Build

| Feature | Registry Deployment | Local Build |
|---------|---------------------|-------------|
| **Repository Clone** | ❌ Nicht nötig | ✅ Vollständig |
| **Build auf Server** | ❌ Nicht nötig | ✅ Erforderlich |
| **Deployment Zeit** | ⚡ Schnell (nur Pull) | 🐌 Langsam (Build) |
| **Server Ressourcen** | 💚 Gering | 💛 Hoch |
| **Hot Reload (Dev)** | ❌ Nicht möglich | ✅ Möglich |
| **Versionierung** | ✅ Automatisch | ❌ Manuell |

---

## Troubleshooting

### Problem: Docker Login fehlgeschlagen

```bash
# Prüfe Login
docker login ghcr.io

# Prüfe ob Token gültig ist
docker pull ghcr.io/<owner>/sharelocal-api:latest
```

### Problem: Image nicht gefunden

```bash
# Prüfe ob Image existiert
docker pull ghcr.io/<owner>/sharelocal-api:latest

# Prüfe GITHUB_REPOSITORY_OWNER
echo $GITHUB_REPOSITORY_OWNER

# Prüfe Image-Namen in docker-compose
cat docker-compose.prd.registry.yml | grep image
```

### Problem: Permission Denied

```bash
# Prüfe GitHub Token Berechtigungen
# Token muss 'read:packages' haben

# Prüfe Repository Visibility
# Private Repos benötigen authentifizierten Zugriff
```

---

## Migration von Local Build zu Registry

### Schritt 1: Images erstmalig pushen

```bash
# GitHub Actions wird automatisch ausgeführt bei Push zu main
# Oder manuell triggern:
# GitHub → Actions → "Build and Push Docker Images" → Run workflow
```

### Schritt 2: Server Setup

```bash
# Auf dem Server
cd /opt/sharelocal/prd

# Docker Login
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin

# Teste Pull
docker pull ghcr.io/<owner>/sharelocal-api:latest
```

### Schritt 3: Deployment Script ändern

```bash
# Verwende neues Script
./scripts/deploy-from-registry.sh prd

# Oder manuell:
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml pull
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml up -d
```

---

## Best Practices

### 1. Separate Images für Dev/Prd

- **Production**: `ghcr.io/<owner>/sharelocal-api:latest` (von main)
- **Development**: `ghcr.io/<owner>/sharelocal-api:develop` (von develop)

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
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml pull
# Ändere Image Tag in docker-compose.prd.registry.yml
docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml up -d
```

---

## Vergleich: Registry vs. Local Build

### Wann Registry verwenden?

✅ **Production Deployments**  
✅ **Schnelle Updates**  
✅ **Begrenzte Server-Ressourcen**  
✅ **Multi-Server Deployments**  

### Wann Local Build verwenden?

✅ **Development mit Hot Reload**  
✅ **Lokale Tests**  
✅ **Offline Development**  

---

## Nächste Schritte

1. ✅ GitHub Actions Workflow aktiviert
2. ✅ Images werden automatisch gebaut
3. ⏳ Docker Login auf Server konfigurieren
4. ⏳ Erste Deployment mit Registry
5. ⏳ Nginx konfigurieren

