# GitHub Secrets Setup - ShareLocal

## Übersicht

Diese Anleitung zeigt dir, welche Secrets du zu GitHub hinzufügen musst, damit der Docker Build & Push Workflow funktioniert.

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
- **Wert**: Dein Docker Hub Benutzername
- **Beispiel**: `dengelma9898`
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

### 2.2 Production Environment Variables (für Build)

Diese werden beim Build der Production Images verwendet (Push zu `main`).

#### NEXT_PUBLIC_API_URL_PRD
- **Name**: `NEXT_PUBLIC_API_URL_PRD`
- **Wert**: `https://nuernbergspots.de/share-local/prd/api`
- **Beschreibung**: API URL für Production Frontend Build

#### NEXT_PUBLIC_BASE_PATH_PRD
- **Name**: `NEXT_PUBLIC_BASE_PATH_PRD`
- **Wert**: `/share-local/prd`
- **Beschreibung**: Base Path für Production Frontend Build

---

### 2.3 Development Environment Variables (für Build)

Diese werden beim Build der Development Images verwendet (Push zu `develop`).

#### NEXT_PUBLIC_API_URL_DEV
- **Name**: `NEXT_PUBLIC_API_URL_DEV`
- **Wert**: `http://nuernbergspots.de/share-local/dev/api`
- **Beschreibung**: API URL für Development Frontend Build

#### NEXT_PUBLIC_BASE_PATH_DEV
- **Name**: `NEXT_PUBLIC_BASE_PATH_DEV`
- **Wert**: `/share-local/dev`
- **Beschreibung**: Base Path für Development Frontend Build

---

## Vollständige Liste

Hier ist die komplette Liste aller Secrets, die du hinzufügen musst:

| Secret Name | Beispiel Wert | Beschreibung |
|-------------|---------------|--------------|
| `DOCKERHUB_USERNAME` | `dengelma9898` | Docker Hub Benutzername |
| `DOCKERHUB_TOKEN` | `dckr_pat_...` | Docker Hub Access Token |
| `NEXT_PUBLIC_API_URL_PRD` | `https://nuernbergspots.de/share-local/prd/api` | Production API URL |
| `NEXT_PUBLIC_BASE_PATH_PRD` | `/share-local/prd` | Production Base Path |
| `NEXT_PUBLIC_API_URL_DEV` | `http://nuernbergspots.de/share-local/dev/api` | Development API URL |
| `NEXT_PUBLIC_BASE_PATH_DEV` | `/share-local/dev` | Development Base Path |

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

## Schritt 4: Prüfen

Nachdem du alle Secrets hinzugefügt hast, solltest du diese Liste sehen:

```
✅ DOCKERHUB_USERNAME
✅ DOCKERHUB_TOKEN
✅ NEXT_PUBLIC_API_URL_PRD
✅ NEXT_PUBLIC_BASE_PATH_PRD
✅ NEXT_PUBLIC_API_URL_DEV
✅ NEXT_PUBLIC_BASE_PATH_DEV
```

---

## Schritt 5: Testen

### 5.1 Workflow testen

1. Mache einen Push zu `main` oder `develop`
2. Gehe zu: **Actions** Tab in GitHub
3. Prüfe ob der Workflow **"Build and Push Docker Images"** läuft
4. Prüfe ob die Images erfolgreich zu Docker Hub gepusht wurden

### 5.2 Images prüfen

Nach erfolgreichem Build solltest du die Images hier sehen:
- **API**: `https://hub.docker.com/r/<username>/sharelocal-api`
- **Web**: `https://hub.docker.com/r/<username>/sharelocal-web`

---

## Troubleshooting

### Problem: "Secret not found"

**Lösung**: 
- Prüfe ob der Secret-Name exakt übereinstimmt (case-sensitive)
- Prüfe ob der Secret im richtigen Repository gesetzt ist

### Problem: "Docker Hub login failed"

**Lösung**:
- Prüfe ob `DOCKERHUB_USERNAME` korrekt ist
- Prüfe ob `DOCKERHUB_TOKEN` gültig ist (nicht abgelaufen)
- Prüfe ob Token die richtigen Permissions hat (Read & Write)

### Problem: "Build args missing"

**Lösung**:
- Prüfe ob alle `NEXT_PUBLIC_*` Secrets gesetzt sind
- Prüfe ob die Werte korrekt sind (keine Leerzeichen am Anfang/Ende)

---

## Beispiel: Alle Secrets auf einmal

Falls du alle Secrets schnell hinzufügen möchtest, hier die Werte für dein Setup:

```
DOCKERHUB_USERNAME=dengelma9898
DOCKERHUB_TOKEN=<dein-token-von-docker-hub>
NEXT_PUBLIC_API_URL_PRD=https://nuernbergspots.de/share-local/prd/api
NEXT_PUBLIC_BASE_PATH_PRD=/share-local/prd
NEXT_PUBLIC_API_URL_DEV=http://nuernbergspots.de/share-local/dev/api
NEXT_PUBLIC_BASE_PATH_DEV=/share-local/dev
```

**Wichtig**: Ersetze `<dein-token-von-docker-hub>` mit deinem echten Docker Hub Token!

---

## Nächste Schritte

Nachdem alle Secrets konfiguriert sind:

1. ✅ Secrets hinzugefügt
2. ⏳ Push zu `main` oder `develop` machen
3. ⏳ Workflow prüfen (Actions Tab)
4. ⏳ Images auf Docker Hub prüfen
5. ⏳ Auf Server deployen (siehe `docs/DOCKERHUB_DEPLOYMENT.md`)

