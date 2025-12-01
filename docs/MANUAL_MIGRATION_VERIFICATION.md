# Manuelle Migration-Verifizierung

## Übersicht

Das CI führt automatisch Migrationen aus. Diese Anleitung zeigt, wie du manuell auf dem Server prüfen kannst, ob alles korrekt funktioniert.

## Prüfschritte auf dem Server

### Schritt 1: Prüfe ob Migration-Dateien im Container vorhanden sind

```bash
# SSH zum Server
ssh root@87.106.208.51

# Prüfe Migration-Dateien im Container
docker exec --user root sharelocal-api-dev ls -la packages/database/prisma/migrations/
```

**Erwartete Ausgabe:**
```
drwxr-xr-x    4 root     root           128 Dec  1 21:00 .
drwxr-xr-x    3 root     root            96 Dec  1 21:00 ..
drwxr-xr-x    3 root     root            96 Dec  1 21:00 20251125212522_init
-rw-r--r--    1 root     root           126 Dec  1 21:00 migration_lock.toml
```

**Wenn fehlend:**
- ❌ Docker Image wurde ohne Migration-Dateien gebaut
- ✅ Lösung: Container neu bauen

### Schritt 2: Prüfe Migration-Status

```bash
# Migration-Status prüfen
docker exec --user root sharelocal-api-dev sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate status --schema=./packages/database/prisma/schema.prisma"
```

**Erwartete Ausgabe:**
```
Database schema is up to date!
```

**Wenn Fehler:**
- Prüfe `DATABASE_URL` im Container: `docker exec sharelocal-api-dev printenv | grep DATABASE_URL`
- Prüfe Netzwerk-Verbindung zum PostgreSQL-Container

### Schritt 3: Prüfe ob Tabellen existieren

```bash
# Tabellen auflisten
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "\dt"
```

**Erwartete Tabellen:**
- `users`
- `listings`
- `conversations`
- `conversation_participants`
- `messages`
- `_prisma_migrations`

**Wenn Tabellen fehlen:**
- Prüfe Migration-History (Schritt 4)
- Führe Migrationen manuell aus (siehe unten)

### Schritt 4: Prüfe Migration-History

```bash
# Migration-History anzeigen
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "SELECT migration_name, finished_at, success FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

**Erwartete Ausgabe:**
```
 migration_name      |      finished_at       | success
---------------------+------------------------+--------
 20251125212522_init | 2025-12-01 21:00:00    | t
```

**Wenn leer (0 rows):**
- Migrationen wurden noch nie ausgeführt
- Führe Migrationen manuell aus (siehe unten)

**Wenn `success = false`:**
- Migrationen schlugen fehl
- Prüfe Logs: `docker logs sharelocal-api-dev | grep -i migration`

## Migrationen manuell ausführen (falls nötig)

Falls die Prüfung zeigt, dass Migrationen nicht ausgeführt wurden:

```bash
# Migrationen manuell ausführen
docker exec --user root sharelocal-api-dev sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma"
```

**Erwartete Ausgabe:**
```
✅ Applied migration: 20251125212522_init
```

## Troubleshooting

### Problem: Migration-Dateien fehlen im Container

**Prüfung:**
```bash
docker exec --user root sharelocal-api-dev ls -la packages/database/prisma/migrations/
```

**Lösung:**
- Container wurde mit altem Dockerfile gebaut
- Container neu bauen (CI-Pipeline erneut ausführen)

### Problem: Tabellen fehlen trotz "No pending migrations"

**Prüfung:**
```bash
# Prüfe Migration-History
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "SELECT * FROM _prisma_migrations;"
```

**Lösung:**
- Falls History leer ist: Migrationen wurden nie ausgeführt → Migrationen manuell ausführen
- Falls History vorhanden, aber Tabellen fehlen: Migration-History löschen und neu ausführen:
  ```bash
  docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "DELETE FROM _prisma_migrations;"
  docker exec --user root sharelocal-api-dev sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma"
  ```

### Problem: Migrationen schlagen fehl

**Prüfung:**
```bash
# Prüfe Container-Logs
docker logs sharelocal-api-dev | grep -i migration

# Prüfe DATABASE_URL
docker exec sharelocal-api-dev printenv | grep DATABASE_URL
```

**Lösung:**
- Prüfe ob `DATABASE_URL` korrekt ist
- Prüfe ob PostgreSQL-Container läuft: `docker ps | grep postgres`
- Prüfe Netzwerk-Verbindung: `docker network inspect sharelocal-network`

## Nächste Schritte

1. ✅ CI führt Migrationen automatisch aus
2. ✅ Verifizierung kann manuell mit Script durchgeführt werden
3. ⏳ Nach jedem Deployment: Script ausführen um zu verifizieren

