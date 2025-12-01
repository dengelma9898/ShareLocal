# Manuelle Migration-Verifizierung

## Übersicht

Die Migration-Verifizierung wurde aus dem CI entfernt und als manuelles Script verfügbar gemacht. Das CI führt nur noch die Migrationen aus, die Verifizierung kann manuell durchgeführt werden.

## Verifizierungs-Script

**Datei:** `scripts/verify-migrations.sh`

### Verwendung

#### Auf dem Server (nach Deployment)

```bash
# SSH zum Server
ssh root@87.106.208.51

# Script ausführen
cd /path/to/ShareLocal
export DATABASE_URL="postgresql://sharelocal:password@sharelocal-postgres-dev:5432/sharelocal_dev?schema=public"
./scripts/verify-migrations.sh
```

#### Lokal (für Tests)

```bash
# Script ausführen
export DATABASE_URL="postgresql://user:password@localhost:5432/sharelocal_dev?schema=public"
export CONTAINER_NAME="sharelocal-api-dev"
export POSTGRES_CONTAINER="sharelocal-postgres-dev"
./scripts/verify-migrations.sh
```

### Was das Script prüft

1. **Migration-Dateien im Container**
   - Prüft ob `packages/database/prisma/migrations/` im Container vorhanden ist
   - Zeigt Migration-Dateien an

2. **Migration-Status**
   - Prüft ob Migrationen ausgeführt wurden
   - Zeigt Migration-Status an

3. **Tabellen in der Datenbank**
   - Prüft ob alle erforderlichen Tabellen existieren:
     - `users`
     - `listings`
     - `conversations`
     - `conversation_participants`
     - `messages`

4. **Migration-History**
   - Zeigt die letzten 5 Migrationen aus `_prisma_migrations`
   - Prüft ob Migrationen erfolgreich waren

### Environment-Variablen

Das Script verwendet folgende Environment-Variablen (alle optional):

- `CONTAINER_NAME` - Name des API-Containers (Default: `sharelocal-api-dev`)
- `IMAGE_NAME` - Docker Image Name (Default: `dengelma/sharelocal-api-dev:latest`)
- `POSTGRES_CONTAINER` - Name des PostgreSQL-Containers (Default: `sharelocal-postgres-dev`)
- `DB_NAME` - Datenbank-Name (Default: `sharelocal_dev`)
- `DB_USER` - Datenbank-User (Default: `sharelocal`)
- `DATABASE_URL` - Vollständige Database URL (für Migration-Status-Check)

### Beispiel-Output

```
🔍 Migration Verification Script
==================================

📋 Running locally

1️⃣ Checking migration files in container...
-------------------------------------------
total 8
drwxr-xr-x    4 root     root           128 Dec  1 21:00 .
drwxr-xr-x    3 root     root            96 Dec  1 21:00 ..
drwxr-xr-x    3 root     root            96 Dec  1 21:00 20251125212522_init
-rw-r--r--    1 root     root           126 Dec  1 21:00 migration_lock.toml
✅ Migration files found in container

2️⃣ Checking migration status...
--------------------------------
✅ Migration status check completed

3️⃣ Checking tables in database...
----------------------------------
 public | users                        | table | sharelocal
 public | listings                     | table | sharelocal
 public | conversations                | table | sharelocal
 public | conversation_participants    | table | sharelocal
 public | messages                     | table | sharelocal
✅ Required tables found in database

4️⃣ Checking migration history...
----------------------------------
✅ Migration history found (1 migrations)
 migration_name      |      finished_at       | success
---------------------+------------------------+--------
 20251125212522_init | 2025-12-01 21:00:00    | t

✅ Verification completed successfully
```

## CI-Workflow

Der CI-Workflow führt jetzt nur noch die Migrationen aus:

```yaml
# Migrationen ausführen
docker run --rm \
  --network sharelocal-network \
  --user root \
  -e DATABASE_URL="${{ secrets.DATABASE_URL }}" \
  $IMAGE_NAME \
  sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma"
```

**Keine automatische Verifizierung mehr** - diese kann manuell mit dem Script durchgeführt werden.

## Vorteile

1. **CI bleibt schnell** - Keine zusätzlichen Checks die Deployment verzögern
2. **Flexibilität** - Verifizierung kann wann immer nötig durchgeführt werden
3. **Detaillierte Ausgabe** - Script zeigt alle Details an
4. **Wiederverwendbar** - Script kann lokal und auf dem Server verwendet werden

## Troubleshooting

### Script schlägt fehl: "Migration files NOT found"

**Ursache:** Docker Image wurde ohne Migration-Dateien gebaut

**Lösung:**
1. Prüfe Dockerfile - kopiert es Migration-Dateien?
2. Container neu bauen
3. Prüfe Build-Kontext

### Script schlägt fehl: "Required tables NOT found"

**Ursache:** Migrationen wurden nicht ausgeführt

**Lösung:**
1. Prüfe Migration-History Output
2. Führe Migrationen manuell aus:
   ```bash
   docker exec --user root sharelocal-api-dev sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma"
   ```

### Script schlägt fehl: "DATABASE_URL not set"

**Ursache:** `DATABASE_URL` Environment-Variable fehlt

**Lösung:**
```bash
export DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
./scripts/verify-migrations.sh
```

## Nächste Schritte

1. ✅ CI führt Migrationen automatisch aus
2. ✅ Verifizierung kann manuell mit Script durchgeführt werden
3. ⏳ Nach jedem Deployment: Script ausführen um zu verifizieren

