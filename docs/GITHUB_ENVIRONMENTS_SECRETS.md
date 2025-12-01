# GitHub Environments Secrets Setup - ShareLocal

## Übersicht

Secrets werden in GitHub Environments (`dev` und `prd`) gespeichert, nicht als Repository Secrets. Jedes Environment hat seine eigenen Secrets.

---

## Secret-Struktur

### Repository Secrets (für alle Environments)

Diese Secrets sind für das gesamte Repository verfügbar:

- `DOCKERHUB_USERNAME` - Docker Hub Benutzername
- `DOCKERHUB_TOKEN` - Docker Hub Access Token
- `SSH_PRIVATE_KEY` - SSH Private Key für Server-Deployment

### Environment Secrets: `dev`

Diese Secrets sind nur für das `dev` Environment verfügbar:

- `DATABASE_URL` - Database Connection String für Development
- `JWT_SECRET` - JWT Secret für Development
- `ENCRYPTION_KEY` - Encryption Key für Development
- `NEXT_PUBLIC_API_URL_DEV` (optional) - API URL für Frontend Build
- `NEXT_PUBLIC_BASE_PATH_DEV` (optional) - Base Path für Frontend Build

### Environment Secrets: `prd`

Diese Secrets sind nur für das `prd` Environment verfügbar:

- `DATABASE_URL` - Database Connection String für Production
- `JWT_SECRET` - JWT Secret für Production
- `ENCRYPTION_KEY` - Encryption Key für Production
- `NEXT_PUBLIC_API_URL_PRD` (optional) - API URL für Frontend Build
- `NEXT_PUBLIC_BASE_PATH_PRD` (optional) - Base Path für Frontend Build

---

## Schritt 1: Repository Secrets hinzufügen

1. Gehe zu: `https://github.com/<owner>/ShareLocal/settings/secrets/actions`
2. Klicke auf **New repository secret**

**Hinzufügen:**

| Secret Name | Wert | Beschreibung |
|-------------|------|--------------|
| `DOCKERHUB_USERNAME` | `dengelma` | Docker Hub Benutzername |
| `DOCKERHUB_TOKEN` | `dckr_pat_...` | Docker Hub Access Token |
| `SSH_PRIVATE_KEY` | `-----BEGIN OPENSSH...` | SSH Private Key |

---

## Schritt 2: Environment Secrets hinzufügen

### 2.1 Dev Environment Secrets

1. Gehe zu: `https://github.com/<owner>/ShareLocal/settings/environments`
2. Klicke auf **dev** Environment
3. Unter **Environment secrets** → **Add secret**

**Hinzufügen:**

| Secret Name | Wert | Beschreibung |
|-------------|------|--------------|
| `DATABASE_URL` | `postgresql://sharelocal:<password>@sharelocal-postgres-dev:5432/sharelocal_dev?schema=public` | Development Database URL<br>**⚠️ WICHTIG: Kein Leerzeichen nach dem Doppelpunkt!** |
| `JWT_SECRET` | `<generiertes-secret>` | JWT Secret (min. 32 Zeichen) |
| `ENCRYPTION_KEY` | `<generiertes-secret>` | Encryption Key (min. 32 Zeichen) |
| `NEXT_PUBLIC_API_URL_DEV` | `https://nuernbergspots.de/share-local/dev` | (Optional) Dev API URL (ohne /api, wird automatisch hinzugefügt) |
| `NEXT_PUBLIC_BASE_PATH_DEV` | `/share-local/dev` | (Optional) Dev Base Path |

### 2.2 Prd Environment Secrets

1. Gehe zu: `https://github.com/<owner>/ShareLocal/settings/environments`
2. Klicke auf **prd** Environment
3. Unter **Environment secrets** → **Add secret**

**Hinzufügen:**

| Secret Name | Wert | Beschreibung |
|-------------|------|--------------|
| `DATABASE_URL` | `postgresql://sharelocal:<password>@sharelocal-postgres-prd:5432/sharelocal?schema=public` | Production Database URL<br>**⚠️ WICHTIG: Kein Leerzeichen nach dem Doppelpunkt!** |
| `JWT_SECRET` | `<generiertes-secret>` | JWT Secret (min. 32 Zeichen) |
| `ENCRYPTION_KEY` | `<generiertes-secret>` | Encryption Key (min. 32 Zeichen) |
| `NEXT_PUBLIC_API_URL_PRD` | `https://nuernbergspots.de/share-local/prd` | (Optional) Prd API URL (ohne /api, wird automatisch hinzugefügt) |
| `NEXT_PUBLIC_BASE_PATH_PRD` | `/share-local/prd` | (Optional) Prd Base Path |

---

## Schritt 3: Secrets generieren

### 3.1 JWT_SECRET und ENCRYPTION_KEY

```bash
# Generiere JWT_SECRET
openssl rand -base64 32

# Generiere ENCRYPTION_KEY
openssl rand -base64 32
```

**Wichtig:** 
- Verwende unterschiedliche Secrets für Dev und Prd (sicherer)
- Oder verwende die gleichen Secrets (einfacher für MVP)

### 3.2 DATABASE_URL

**Für Dev:**
```
postgresql://sharelocal:<password-dev>@sharelocal-postgres-dev:5432/sharelocal_dev?schema=public
```

**Für Prd:**
```
postgresql://sharelocal:<password-prd>@sharelocal-postgres-prd:5432/sharelocal?schema=public
```

**Wichtig:** 
- Container-Name muss mit Server Setup übereinstimmen
- Password muss mit Server Setup übereinstimmen

---

## Schritt 4: Workflow-Verhalten

### 4.1 Dev Environment

Wenn der Workflow das `dev` Environment verwendet:
- ✅ Zugriff auf Repository Secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `SSH_PRIVATE_KEY`)
- ✅ Zugriff auf Dev Environment Secrets (`DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`)
- ❌ Kein Zugriff auf Prd Environment Secrets

### 4.2 Prd Environment

Wenn der Workflow das `prd` Environment verwendet:
- ✅ Zugriff auf Repository Secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `SSH_PRIVATE_KEY`)
- ✅ Zugriff auf Prd Environment Secrets (`DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`)
- ❌ Kein Zugriff auf Dev Environment Secrets

---

## Vorteile dieser Struktur

✅ **Bessere Organisation** - Secrets sind nach Environment getrennt  
✅ **Sicherer** - Prd Secrets sind nicht für Dev verfügbar  
✅ **Einfacher zu verwalten** - Keine Suffixe (`_PRD`, `_DEV`) nötig  
✅ **Klarere Struktur** - Jedes Environment hat seine eigenen Secrets  

---

## Checkliste

### Repository Secrets
- [ ] `DOCKERHUB_USERNAME`
- [ ] `DOCKERHUB_TOKEN`
- [ ] `SSH_PRIVATE_KEY`

### Dev Environment Secrets
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`
- [ ] `ENCRYPTION_KEY`
- [ ] `NEXT_PUBLIC_API_URL_DEV` (optional)
- [ ] `NEXT_PUBLIC_BASE_PATH_DEV` (optional)

### Prd Environment Secrets
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`
- [ ] `ENCRYPTION_KEY`
- [ ] `NEXT_PUBLIC_API_URL_PRD` (optional)
- [ ] `NEXT_PUBLIC_BASE_PATH_PRD` (optional)

---

## Troubleshooting

### Problem: "Secret not found"

**Lösung:**
- Prüfe ob Secret im richtigen Environment gesetzt ist
- Prüfe ob Job das richtige Environment verwendet (`environment: dev` oder `environment: prd`)
- Prüfe ob Secret-Name exakt übereinstimmt (case-sensitive)

### Problem: "Wrong environment secrets"

**Lösung:**
- Prüfe ob Job das richtige Environment verwendet
- Prüfe ob Secrets im richtigen Environment gesetzt sind
- Repository Secrets sind für alle Environments verfügbar

### Problem: "Database connection failed" oder "PrismaClientInitializationError"

**Häufige Ursache: Leerzeichen in DATABASE_URL**

**Symptom:**
```bash
docker exec sharelocal-api-dev printenv | grep DATABASE_URL
# DATABASE_URL=postgresql://sharelocal: password@postgres:5432/...
#                                    ^ Leerzeichen hier!
```

**Lösung:**
1. Gehe zu GitHub → Settings → Environments → `dev` (oder `prd`)
2. Öffne das `DATABASE_URL` Secret
3. Prüfe ob nach dem Doppelpunkt (`:`) ein Leerzeichen ist
4. **Korrigiere:** `postgresql://sharelocal:password@...` (kein Leerzeichen!)
5. Speichere das Secret
6. Container neu starten: `docker restart sharelocal-api-dev`

**Korrekte Format:**
```
postgresql://sharelocal:password@postgres:5432/sharelocal_dev?schema=public
```

**Falsche Format (mit Leerzeichen):**
```
postgresql://sharelocal: password@postgres:5432/sharelocal_dev?schema=public
```

---

## Nächste Schritte

1. ✅ Repository Secrets hinzugefügt
2. ✅ Dev Environment Secrets hinzugefügt
3. ✅ Prd Environment Secrets hinzugefügt
4. ⏳ Workflow testen (Push zu `main`)
5. ⏳ Deployment prüfen

