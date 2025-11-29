# PostgreSQL Password Setup - ShareLocal

## Übersicht

Das PostgreSQL Password wird für den Database Container und die GitHub Secrets benötigt. Hier ist eine klare Anleitung.

---

## Schritt 1: Password generieren

### 1.1 Generiere ein sicheres Password

```bash
# Generiere ein sicheres Password (32 Zeichen)
openssl rand -base64 32

# Beispiel Output:
# aB3xY9mN2pQ7rT5vW8zC1dF4gH6jK0lM3nP9qS2tU5vW8xY1zA4bC7dE0fG
```

**Wichtig:**
- ✅ Speichere dieses Password sicher!
- ✅ Verwende es für alle Database-URLs (Dev und Prd können unterschiedlich sein)
- ✅ Mindestens 16 Zeichen empfohlen

---

## Schritt 2: Password verwenden

### 2.1 Server Setup (einmalig)

**Option A: Ein Container für alles (einfach)**

```bash
ssh root@87.106.208.51

# Erstelle Docker Network (falls nicht vorhanden)
docker network create sharelocal-network || true

# Starte PostgreSQL Container (für Dev und Prd)
docker run -d \
  --name sharelocal-postgres \
  --network sharelocal-network \
  --restart unless-stopped \
  -e POSTGRES_USER=sharelocal \
  -e POSTGRES_PASSWORD=<DEIN_GENERIERTES_PASSWORD> \
  -e POSTGRES_DB=sharelocal \
  -v sharelocal-postgres-data:/var/lib/postgresql/data \
  postgres:17-alpine
```

**Option B: Separate Container für Dev und Prd (sicherer)**

```bash
ssh root@87.106.208.51

# Erstelle Docker Network (falls nicht vorhanden)
docker network create sharelocal-network || true

# Starte Production PostgreSQL Container
docker run -d \
  --name sharelocal-postgres-prd \
  --network sharelocal-network \
  --restart unless-stopped \
  -e POSTGRES_USER=sharelocal \
  -e POSTGRES_PASSWORD=<PASSWORD_PRD> \
  -e POSTGRES_DB=sharelocal \
  -v sharelocal-postgres-prd-data:/var/lib/postgresql/data \
  postgres:17-alpine

# Starte Development PostgreSQL Container
docker run -d \
  --name sharelocal-postgres-dev \
  --network sharelocal-network \
  --restart unless-stopped \
  -e POSTGRES_USER=sharelocal \
  -e POSTGRES_PASSWORD=<PASSWORD_DEV> \
  -e POSTGRES_DB=sharelocal_dev \
  -v sharelocal-postgres-dev-data:/var/lib/postgresql/data \
  postgres:17-alpine
```

**Ersetze:** 
- `<DEIN_GENERIERTES_PASSWORD>` mit dem generierten Password (Option A)
- `<PASSWORD_PRD>` und `<PASSWORD_DEV>` mit unterschiedlichen Passwords (Option B)

---

## Schritt 3: GitHub Secrets konfigurieren

### 3.1 DATABASE_URL_PRD

Gehe zu: `https://github.com/<owner>/ShareLocal/settings/secrets/actions`

**Secret Name:** `DATABASE_URL_PRD`

**Wert (Option A - Ein Container):**
```
postgresql://sharelocal:<PASSWORD_PRD>@sharelocal-postgres:5432/sharelocal?schema=public
```

**Wert (Option B - Separate Container):**
```
postgresql://sharelocal:<PASSWORD_PRD>@sharelocal-postgres-prd:5432/sharelocal?schema=public
```

**Wichtig:** 
- Ersetze `<PASSWORD_PRD>` mit dem Production Password
- Container-Name muss mit dem Server Setup übereinstimmen:
  - Option A: `sharelocal-postgres`
  - Option B: `sharelocal-postgres-prd`

### 3.2 DATABASE_URL_DEV

**Secret Name:** `DATABASE_URL_DEV`

**Wert (Option A - Ein Container, gleiches Password):**
```
postgresql://sharelocal:<PASSWORD_PRD>@sharelocal-postgres:5432/sharelocal_dev?schema=public
```

**Wert (Option B - Separate Container, unterschiedliche Passwords):**
```
postgresql://sharelocal:<PASSWORD_DEV>@sharelocal-postgres-dev:5432/sharelocal_dev?schema=public
```

**Wichtig:**
- Option A: Gleiches Password wie Production, aber andere Database (`sharelocal_dev`)
- Option B: Unterschiedliches Password und separater Container (`sharelocal-postgres-dev`)

---

## Schritt 4: Password-Strategien

### Option 1: Ein Password für alles (einfach)

**Vorteile:**
- ✅ Einfach zu verwalten
- ✅ Weniger Fehlerquellen

**Nachteile:**
- ⚠️ Dev und Prd teilen sich das gleiche Password

**Verwendung:**
- Server Setup: `<password>`
- DATABASE_URL_PRD: `postgresql://sharelocal:<password>@sharelocal-postgres:5432/sharelocal?schema=public`
- DATABASE_URL_DEV: `postgresql://sharelocal:<password>@sharelocal-postgres:5432/sharelocal_dev?schema=public`

### Option 2: Separate Passwords und Container (sicherer)

**Vorteile:**
- ✅ Bessere Isolation zwischen Dev und Prd
- ✅ Sicherer
- ✅ Separate Volumes (Daten bleiben getrennt)

**Nachteile:**
- ⚠️ Mehr zu verwalten
- ⚠️ Zwei Container laufen parallel

**Server Setup:**
```bash
# Production Container
docker run -d \
  --name sharelocal-postgres-prd \
  --network sharelocal-network \
  --restart unless-stopped \
  -e POSTGRES_USER=sharelocal \
  -e POSTGRES_PASSWORD=<password-prd> \
  -e POSTGRES_DB=sharelocal \
  -v sharelocal-postgres-prd-data:/var/lib/postgresql/data \
  postgres:17-alpine

# Development Container
docker run -d \
  --name sharelocal-postgres-dev \
  --network sharelocal-network \
  --restart unless-stopped \
  -e POSTGRES_USER=sharelocal \
  -e POSTGRES_PASSWORD=<password-dev> \
  -e POSTGRES_DB=sharelocal_dev \
  -v sharelocal-postgres-dev-data:/var/lib/postgresql/data \
  postgres:17-alpine
```

**GitHub Secrets:**
- DATABASE_URL_PRD: `postgresql://sharelocal:<password-prd>@sharelocal-postgres-prd:5432/sharelocal?schema=public`
- DATABASE_URL_DEV: `postgresql://sharelocal:<password-dev>@sharelocal-postgres-dev:5432/sharelocal_dev?schema=public`

**Wichtig:** 
- Container-Name für Prd: `sharelocal-postgres-prd` → DATABASE_URL muss `sharelocal-postgres-prd` verwenden
- Container-Name für Dev: `sharelocal-postgres-dev` → DATABASE_URL muss `sharelocal-postgres-dev` verwenden
- Container-Namen müssen in DATABASE_URL exakt übereinstimmen!

---

## Schritt 5: Password prüfen

### 5.1 Teste Connection vom Server

```bash
ssh root@87.106.208.51

# Teste Connection
docker exec -it sharelocal-postgres psql -U sharelocal -d sharelocal -c "SELECT version();"
```

### 5.2 Teste Connection von API Container

```bash
# Starte API Container mit DATABASE_URL
docker run --rm \
  --network sharelocal-network \
  -e DATABASE_URL="postgresql://sharelocal:<password>@sharelocal-postgres:5432/sharelocal?schema=public" \
  <image> node -e "console.log('Connection test')"
```

---

## Checkliste

### Server Setup
- [ ] Password generiert (`openssl rand -base64 32`)
- [ ] Password sicher gespeichert
- [ ] PostgreSQL Container gestartet mit Password
- [ ] Connection getestet

### GitHub Secrets
- [ ] `DATABASE_URL_PRD` erstellt mit Password
- [ ] `DATABASE_URL_DEV` erstellt (optional, mit gleichem oder anderem Password)
- [ ] Password in URL korrekt eingefügt

### Deployment Test
- [ ] Push zu `main` gemacht
- [ ] API Container startet erfolgreich
- [ ] Database Connection funktioniert

---

## Troubleshooting

### Problem: "password authentication failed"

**Lösung:**
- Prüfe ob Password im Container und GitHub Secret identisch ist
- Prüfe ob `POSTGRES_USER` korrekt ist (`sharelocal`)
- Prüfe ob Container-Name korrekt ist (`sharelocal-postgres`)

### Problem: "connection refused"

**Lösung:**
- Prüfe ob PostgreSQL Container läuft: `docker ps | grep postgres`
- Prüfe ob Container im gleichen Network ist: `docker network inspect sharelocal-network`
- Prüfe ob Port 5432 erreichbar ist

### Problem: "database does not exist"

**Lösung:**
- Prüfe ob Database-Name korrekt ist (`sharelocal` oder `sharelocal_dev`)
- Erstelle Database manuell falls nötig:
  ```bash
  docker exec -it sharelocal-postgres psql -U sharelocal -c "CREATE DATABASE sharelocal_dev;"
  ```

---

## Empfehlung für MVP

**Für den Start (MVP):**

✅ **Verwende ein Password für alles** (Option 1)
- Einfacher zu verwalten
- Weniger Fehlerquellen
- Später kannst du auf separate Passwords umstellen

**Password generieren:**
```bash
openssl rand -base64 32
```

**Verwende es für:**
- Server Setup: `POSTGRES_PASSWORD=<generiertes-password>`
- GitHub Secret `DATABASE_URL_PRD`: `postgresql://sharelocal:<generiertes-password>@sharelocal-postgres:5432/sharelocal?schema=public`
- GitHub Secret `DATABASE_URL_DEV`: `postgresql://sharelocal:<generiertes-password>@sharelocal-postgres:5432/sharelocal_dev?schema=public`

---

## Sicherheitshinweise

⚠️ **Wichtig:**
- ✅ Speichere Passwords sicher (Password Manager)
- ✅ Verwende starke Passwords (min. 16 Zeichen)
- ✅ Teile Passwords nicht öffentlich
- ✅ Rotiere Passwords regelmäßig (optional)
- ✅ Verwende unterschiedliche Passwords für Dev/Prd (später)

---

## Nächste Schritte

1. ✅ Password generiert
2. ✅ Server Setup mit Password durchgeführt
3. ✅ GitHub Secrets mit Password konfiguriert
4. ⏳ Deployment testen
5. ⏳ Database Connection prüfen





docker run -d \
  --name sharelocal-postgres \
  --network sharelocal-network \
  --restart unless-stopped \
  -e POSTGRES_USER=sharelocal \
  -e POSTGRES_PASSWORD=gPrsCR2jxzxeHEe \
  -e POSTGRES_DB=sharelocal \
  -v sharelocal-postgres-data:/var/lib/postgresql/data \
  postgres:17-alpine


docker run -d \
  --name sharelocal-postgres \
  --network sharelocal-network \
  --restart unless-stopped \
  -e POSTGRES_USER=sharelocal \
  -e POSTGRES_PASSWORD=feksa9faxcubmedvIt \
  -e POSTGRES_DB=sharelocal \
  -v sharelocal-postgres-data:/var/lib/postgresql/data \
  postgres:17-alpine