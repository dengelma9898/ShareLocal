# GitHub Secrets Setup - ShareLocal

## Übersicht

Diese Anleitung zeigt dir, welche Secrets du zu GitHub hinzufügen musst, damit der Docker Build & Deploy Workflow funktioniert.

---

## Schritt 1: Zu GitHub Secrets navigieren

1. Gehe zu deinem Repository: `https://github.com/<owner>/ShareLocal`
2. Klicke auf **Settings** (oben rechts)
3. Klicke auf **Secrets and variables** → **Actions** (links im Menü)
4. Klicke auf **New repository secret**

---

## Schritt 2: Erforderliche Secrets hinzufügen

### 2.1 Docker Hub Credentials

#### DOCKERHUB_USERNAME
- **Name**: `DOCKERHUB_USERNAME`
- **Wert**: `dengelma9898` (oder dein Docker Hub Benutzername)
- **Wo findest du das?**: https://hub.docker.com/ → Dein Profil

#### DOCKERHUB_TOKEN
- **Name**: `DOCKERHUB_TOKEN`
- **Wert**: Docker Hub Access Token
- **Wie erstellen?**:
  1. Gehe zu: https://hub.docker.com/settings/security
  2. Klicke auf **New Access Token**
  3. Name: `sharelocal-github-actions` (oder ähnlich)
  4. Permissions: **Read & Write** (für Push)
  5. Kopiere den Token (wird nur einmal angezeigt!)
  6. Füge als Secret hinzu

---

### 2.2 SSH Deployment

#### SSH_PRIVATE_KEY
- **Name**: `SSH_PRIVATE_KEY`
- **Wert**: Dein privater SSH Key für Server-Zugriff
- **Wie erstellen?**:
  ```bash
  # Auf deinem lokalen Rechner
  ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/sharelocal_deploy
  
  # Kopiere den privaten Key
  cat ~/.ssh/sharelocal_deploy
  
  # Füge den öffentlichen Key zum Server hinzu
  ssh-copy-id -i ~/.ssh/sharelocal_deploy.pub root@87.106.208.51
  ```
- **Wichtig**: Nur der **private** Key kommt als Secret!

---

### 2.3 Database Secrets

#### DATABASE_URL_DEV
- **Name**: `DATABASE_URL_DEV`
- **Wert**: `postgresql://sharelocal:<password>@postgres:5432/sharelocal_dev?schema=public`
- **Beschreibung**: Database Connection String für Development

#### DATABASE_URL_PRD
- **Name**: `DATABASE_URL_PRD`
- **Wert**: `postgresql://sharelocal:<password>@postgres:5432/sharelocal?schema=public`
- **Beschreibung**: Database Connection String für Production

**Hinweis**: Ersetze `<password>` mit deinem echten Database Password!

---

### 2.4 Application Secrets

#### JWT_SECRET
- **Name**: `JWT_SECRET`
- **Wert**: Mindestens 32 Zeichen langer Secret
- **Generieren**: `openssl rand -base64 32`

#### ENCRYPTION_KEY
- **Name**: `ENCRYPTION_KEY`
- **Wert**: Mindestens 32 Zeichen langer Secret
- **Generieren**: `openssl rand -base64 32`

---

### 2.5 Frontend Build Variables

#### NEXT_PUBLIC_API_URL_DEV
- **Name**: `NEXT_PUBLIC_API_URL_DEV`
- **Wert**: `http://nuernbergspots.de/share-local/dev/api`
- **Beschreibung**: API URL für Development Frontend Build

#### NEXT_PUBLIC_BASE_PATH_DEV
- **Name**: `NEXT_PUBLIC_BASE_PATH_DEV`
- **Wert**: `/share-local/dev`
- **Beschreibung**: Base Path für Development Frontend Build

#### NEXT_PUBLIC_API_URL_PRD
- **Name**: `NEXT_PUBLIC_API_URL_PRD`
- **Wert**: `https://nuernbergspots.de/share-local/prd/api`
- **Beschreibung**: API URL für Production Frontend Build

#### NEXT_PUBLIC_BASE_PATH_PRD
- **Name**: `NEXT_PUBLIC_BASE_PATH_PRD`
- **Wert**: `/share-local/prd`
- **Beschreibung**: Base Path für Production Frontend Build

---

## Vollständige Liste

Hier ist die komplette Liste aller Secrets:

| Secret Name | Beispiel Wert | Beschreibung |
|-------------|---------------|--------------|
| `DOCKERHUB_USERNAME` | `dengelma9898` | Docker Hub Benutzername |
| `DOCKERHUB_TOKEN` | `dckr_pat_...` | Docker Hub Access Token |
| `SSH_PRIVATE_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | SSH Private Key für Server |
| `DATABASE_URL_DEV` | `postgresql://...` | Development Database URL |
| `DATABASE_URL_PRD` | `postgresql://...` | Production Database URL |
| `JWT_SECRET` | `base64-encoded-string` | JWT Secret (min. 32 Zeichen) |
| `ENCRYPTION_KEY` | `base64-encoded-string` | Encryption Key (min. 32 Zeichen) |
| `NEXT_PUBLIC_API_URL_DEV` | `http://nuernbergspots.de/share-local/dev/api` | Dev API URL |
| `NEXT_PUBLIC_BASE_PATH_DEV` | `/share-local/dev` | Dev Base Path |
| `NEXT_PUBLIC_API_URL_PRD` | `https://nuernbergspots.de/share-local/prd/api` | Prd API URL |
| `NEXT_PUBLIC_BASE_PATH_PRD` | `/share-local/prd` | Prd Base Path |

---

## Schritt 3: Secrets hinzufügen

Für jedes Secret:

1. Klicke auf **New repository secret**
2. **Name**: Trage den Secret-Namen ein (z.B. `DOCKERHUB_USERNAME`)
3. **Secret**: Trage den Wert ein
4. Klicke auf **Add secret**

**Wichtig**: 
- Secrets sind case-sensitive
- Nach dem Speichern kannst du den Wert nicht mehr sehen (nur ändern)
- Secrets werden automatisch maskiert in Logs

---

## Schritt 4: Server Setup (einmalig)

### 4.1 Docker Network erstellen

```bash
ssh root@87.106.208.51

# Erstelle Docker Network (falls nicht vorhanden)
docker network create sharelocal-network || true
```

### 4.2 PostgreSQL Container starten (einmalig)

```bash
# Starte PostgreSQL Container (falls nicht läuft)
docker run -d \
  --name sharelocal-postgres \
  --network sharelocal-network \
  --restart unless-stopped \
  -e POSTGRES_USER=sharelocal \
  -e POSTGRES_PASSWORD=<dein-password> \
  -e POSTGRES_DB=sharelocal \
  -v sharelocal-postgres-data:/var/lib/postgresql/data \
  postgres:17-alpine
```

**Wichtig**: Ersetze `<dein-password>` mit dem gleichen Password, das du in `DATABASE_URL_PRD` verwendet hast!

---

## Schritt 5: Prüfen

Nachdem du alle Secrets hinzugefügt hast, solltest du diese Liste sehen:

```
✅ DOCKERHUB_USERNAME
✅ DOCKERHUB_TOKEN
✅ SSH_PRIVATE_KEY
✅ DATABASE_URL_DEV
✅ DATABASE_URL_PRD
✅ JWT_SECRET
✅ ENCRYPTION_KEY
✅ NEXT_PUBLIC_API_URL_DEV
✅ NEXT_PUBLIC_BASE_PATH_DEV
✅ NEXT_PUBLIC_API_URL_PRD
✅ NEXT_PUBLIC_BASE_PATH_PRD
```

---

## Schritt 6: Testen

### 6.1 Workflow testen

1. Mache einen Push zu `main` oder `develop`
2. Gehe zu: **Actions** Tab in GitHub
3. Prüfe ob der Workflow **"Docker Build and Deploy"** läuft
4. Prüfe ob die Images erfolgreich zu Docker Hub gepusht wurden
5. Prüfe ob die Container erfolgreich auf dem Server gestartet wurden

### 6.2 Server prüfen

```bash
ssh root@87.106.208.51

# Prüfe laufende Container
docker ps | grep sharelocal

# Prüfe Logs
docker logs sharelocal-api
docker logs sharelocal-web
```

---

## Troubleshooting

### Problem: "SSH connection failed"

**Lösung**: 
- Prüfe ob `SSH_PRIVATE_KEY` korrekt ist (kompletter Key, inkl. Header/Footer)
- Prüfe ob öffentlicher Key auf Server hinzugefügt wurde
- Prüfe ob Server erreichbar ist: `ping 87.106.208.51`

### Problem: "Docker Hub login failed"

**Lösung**:
- Prüfe ob `DOCKERHUB_USERNAME` korrekt ist
- Prüfe ob `DOCKERHUB_TOKEN` gültig ist (nicht abgelaufen)
- Prüfe ob Token die richtigen Permissions hat (Read & Write)

### Problem: "Container startet nicht"

**Lösung**:
- Prüfe Logs: `docker logs sharelocal-api`
- Prüfe ob PostgreSQL Container läuft: `docker ps | grep postgres`
- Prüfe ob Docker Network existiert: `docker network ls | grep sharelocal`

---

## Nächste Schritte

Nachdem alle Secrets konfiguriert sind:

1. ✅ Secrets hinzugefügt
2. ✅ Server Setup (Docker Network, PostgreSQL)
3. ⏳ Push zu `main` oder `develop` machen
4. ⏳ Workflow prüfen (Actions Tab)
5. ⏳ Container auf Server prüfen
6. ⏳ Nginx konfigurieren (falls noch nicht gemacht)

