# CI Migration Verification & Troubleshooting

## Problem: Migrationen werden im CI nicht automatisch ausgeführt

Dieses Dokument erklärt, wie Migrationen im CI funktionieren und wie man Probleme diagnostiziert.

## Wie Migrationen im CI funktionieren

### 1. Build Stage (Dockerfile)

**Datei:** `packages/api/Dockerfile`

```dockerfile
# Stage 1: Build
COPY packages/database/prisma ./packages/database/prisma

# Stage 2: Production
COPY --from=api-builder --chown=nodejs:nodejs /app/packages/database/prisma ./packages/database/prisma
```

**Was passiert:**
- Migration-Dateien werden ins Docker Image kopiert
- Pfad: `/app/packages/database/prisma/migrations/`

### 2. Deployment Stage (CI Workflow)

**Datei:** `.github/workflows/ci-api.yml`

```yaml
# 1. Prüfe Migration-Dateien
docker run --rm --user root $IMAGE_NAME \
  sh -c "ls -la packages/database/prisma/migrations/"

# 2. Führe Migrationen aus
docker run --rm --user root \
  -e DATABASE_URL="${{ secrets.DATABASE_URL }}" \
  $IMAGE_NAME \
  sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma"

# 3. Verifiziere Tabellen
docker run --rm postgres:17 \
  psql -h sharelocal-postgres-dev -U sharelocal -d sharelocal_dev -c "\dt"
```

## Verifizierung im CI

Der CI-Workflow führt jetzt automatisch folgende Checks aus:

### ✅ Check 1: Migration-Dateien vorhanden?

```bash
ls -la packages/database/prisma/migrations/
```

**Erwartete Ausgabe:**
```
20251125212522_init/
migration_lock.toml
```

**Wenn fehlend:**
- ❌ Docker Image wurde mit altem Dockerfile gebaut
- ❌ Build-Kontext schließt Migration-Dateien aus
- ✅ Lösung: Container neu bauen

### ✅ Check 2: Migrationen erfolgreich?

```bash
npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma
```

**Erwartete Ausgabe:**
```
✅ Applied migration: 20251125212522_init
```

**Wenn Fehler:**
- ❌ `DATABASE_URL` falsch
- ❌ Netzwerk-Verbindung fehlt
- ❌ Migration-Dateien fehlen
- ✅ Lösung: Prüfe CI-Logs für Details

### ✅ Check 3: Tabellen erstellt?

```bash
psql -h sharelocal-postgres-dev -U sharelocal -d sharelocal_dev -c "\dt"
```

**Erwartete Tabellen:**
- `users`
- `listings`
- `conversations`
- `conversation_participants`
- `messages`
- `_prisma_migrations`

**Wenn fehlend:**
- ❌ Migrationen wurden nicht ausgeführt
- ❌ Migrationen schlugen fehl
- ✅ Lösung: Prüfe Migration-History

## Häufige Probleme & Lösungen

### Problem 1: "No migration found in prisma/migrations"

**Ursache:** Migration-Dateien wurden nicht ins Docker Image kopiert

**Diagnose:**
```bash
# Im CI-Log nach "Checking migration files" suchen
# Sollte zeigen: ls -la packages/database/prisma/migrations/
```

**Lösung:**
1. Prüfe Dockerfile - kopiert es Migration-Dateien?
2. Prüfe Build-Kontext - sind Migration-Dateien im Build-Kontext?
3. Container neu bauen

### Problem 2: "No pending migrations to apply" aber Tabellen fehlen

**Ursache:** Migrationen wurden bereits registriert, aber Tabellen wurden gelöscht

**Diagnose:**
```bash
# Prüfe Migration-History
SELECT * FROM _prisma_migrations;
```

**Lösung:**
```bash
# Migration-History löschen und neu ausführen
DELETE FROM _prisma_migrations;
# Dann Migrationen erneut ausführen
```

### Problem 3: Migrationen schlagen fehl ohne Fehlermeldung

**Ursache:** Fehler wird nicht richtig geloggt

**Diagnose:**
- Prüfe CI-Logs für "Migration failed"
- Prüfe Migration-Status Output

**Lösung:**
- CI-Workflow wurde aktualisiert mit besserem Error-Handling
- Migration-Status wird jetzt automatisch ausgegeben bei Fehlern

### Problem 4: Container kann Migration-Dateien nicht finden

**Ursache:** Pfad ist falsch oder Dateien fehlen

**Diagnose:**
```bash
# Im CI-Log prüfen:
docker run --rm $IMAGE_NAME ls -la packages/database/prisma/migrations/
```

**Lösung:**
- Prüfe Dockerfile COPY-Befehle
- Prüfe Build-Kontext
- Container neu bauen

## Build-Kontext prüfen

Der Build-Kontext ist wichtig! Im CI-Workflow:

```yaml
context: .
file: packages/api/Dockerfile
```

**Das bedeutet:**
- Build-Kontext ist Root-Verzeichnis (`.`)
- Dockerfile ist in `packages/api/Dockerfile`
- COPY-Befehle sind relativ zum Build-Kontext

**Beispiel:**
```dockerfile
COPY packages/database/prisma ./packages/database/prisma
```

**Das kopiert:**
- Von: `./packages/database/prisma` (relativ zum Root)
- Nach: `/app/packages/database/prisma` (im Container)

## Nächste Schritte

1. ✅ CI-Workflow wurde aktualisiert mit Verifizierung
2. ⏳ Nächster CI-Run wird automatisch prüfen:
   - Migration-Dateien vorhanden?
   - Migrationen erfolgreich?
   - Tabellen erstellt?
3. ⏳ Falls Probleme: CI-Logs zeigen jetzt detaillierte Fehlermeldungen

## Manuelle Verifizierung

Falls CI-Probleme weiterhin bestehen:

```bash
# 1. Prüfe Migration-Dateien im Container
docker run --rm dengelma/sharelocal-api-dev:latest ls -la packages/database/prisma/migrations/

# 2. Prüfe Migration-Status
docker run --rm --user root \
  -e DATABASE_URL="postgresql://..." \
  dengelma/sharelocal-api-dev:latest \
  sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate status --schema=./packages/database/prisma/schema.prisma"

# 3. Prüfe Tabellen
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "\dt"
```

