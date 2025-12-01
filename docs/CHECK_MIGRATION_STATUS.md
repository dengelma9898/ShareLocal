# Migration-Status prüfen

## Problem: "No pending migrations" aber Tabellen fehlen

Wenn Prisma sagt "No pending migrations to apply", aber die Tabellen trotzdem fehlen, kann das mehrere Ursachen haben:

## Schritt 1: Prüfe Migration-History in der Datenbank

```bash
# Prüfe ob Migrationen in der Datenbank registriert sind
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;"
```

**Erwartete Ausgabe:**
- Eine Zeile mit `20251125212522_init` Migration
- `finished_at` sollte gesetzt sein
- `success` sollte `true` sein

## Schritt 2: Prüfe ob Tabellen wirklich fehlen

```bash
# Tabellen auflisten
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "\dt"

# Erwartete Tabellen:
# - users
# - listings
# - conversations
# - conversation_participants
# - messages
# - _prisma_migrations
```

## Schritt 3: Prüfe Migration-Dateien im Container

```bash
# Prüfe ob Migration-Dateien im Container vorhanden sind
docker exec --user root sharelocal-api-dev ls -la packages/database/prisma/migrations/

# Erwartete Ausgabe:
# - 20251125212522_init/
#   - migration.sql
# - migration_lock.toml
```

## Mögliche Ursachen

### Ursache 1: Migrationen wurden auf falscher Datenbank ausgeführt

**Symptom:** Migrationen in `_prisma_migrations`, aber Tabellen fehlen

**Lösung:**
1. Prüfe `DATABASE_URL` im Container:
   ```bash
   docker exec sharelocal-api-dev printenv | grep DATABASE_URL
   ```

2. Prüfe ob Datenbank-Name korrekt ist (`sharelocal_dev`)

### Ursache 2: Migrationen wurden ausgeführt, aber Tabellen wurden gelöscht

**Symptom:** Migrationen in `_prisma_migrations`, aber keine Tabellen

**Lösung:**
```bash
# Migrationen zurücksetzen und neu ausführen
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "DELETE FROM _prisma_migrations;"
docker exec --user root sharelocal-api-dev sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma"
```

### Ursache 3: Migrationen wurden ausgeführt, aber mit Fehlern

**Symptom:** Migrationen in `_prisma_migrations` mit `success = false`

**Lösung:**
```bash
# Prüfe Migration-Status
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "SELECT migration_name, finished_at, success, logs FROM _prisma_migrations;"

# Falls success = false, Migration als "rolled_back" markieren und neu ausführen
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "UPDATE _prisma_migrations SET rolled_back_at = NOW() WHERE migration_name = '20251125212522_init';"
docker exec --user root sharelocal-api-dev sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma"
```

### Ursache 4: Migration-Dateien fehlen im Container

**Symptom:** "No migration found in prisma/migrations"

**Lösung:**
1. Prüfe ob Migration-Dateien kopiert wurden:
   ```bash
   docker exec --user root sharelocal-api-dev ls -la packages/database/prisma/migrations/
   ```

2. Falls leer, Container neu bauen (Dockerfile wurde aktualisiert)

## Schnelle Lösung: Migrationen zurücksetzen und neu ausführen

```bash
# 1. Migration-History löschen
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "DELETE FROM _prisma_migrations;"

# 2. Migrationen neu ausführen
docker exec --user root sharelocal-api-dev sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma"

# 3. Tabellen prüfen
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "\dt"
```

## Nächste Schritte

1. ✅ Prüfe Migration-History in der Datenbank
2. ✅ Prüfe ob Tabellen existieren
3. ✅ Prüfe Migration-Dateien im Container
4. ⏳ Migrationen zurücksetzen falls nötig
5. ⏳ Migrationen neu ausführen

