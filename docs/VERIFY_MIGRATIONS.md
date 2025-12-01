# Migrationen verifizieren

## Problem: Tabellen fehlen trotz CI-Pipeline

Wenn die Tabellen nach einem erfolgreichen Deployment fehlen, kann das mehrere Ursachen haben:

## Schritt 1: Prüfe ob Migrationen im CI ausgeführt wurden

### GitHub Actions Logs prüfen

1. Gehe zu: https://github.com/dengelma9898/ShareLocal/actions
2. Öffne den letzten erfolgreichen Workflow-Run
3. Suche nach "🔄 Running database migrations..."
4. Prüfe ob "✅ Migrations completed" erscheint

**Wenn Migrationen fehlgeschlagen sind:**
- Prüfe die Fehlermeldung
- Prüfe ob `DATABASE_URL` korrekt ist
- Prüfe ob Netzwerk-Verbindung funktioniert

## Schritt 2: Migrationen manuell auf dem Server ausführen

```bash
# SSH zum Server
ssh root@87.106.208.51

# Prüfe ob Container läuft
docker ps | grep sharelocal-api-dev

# Migrationen manuell ausführen (als root, da Container als nodejs User läuft)
docker exec --user root sharelocal-api-dev sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma"
```

## Schritt 3: Prüfe Migration-Status

```bash
# Migration-Status prüfen
docker exec sharelocal-api-dev sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate status --schema=./packages/database/prisma/schema.prisma"

# Oder direkt in der Datenbank
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;"
```

## Schritt 4: Prüfe ob Tabellen existieren

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

## Häufige Probleme

### Problem 1: Migrationen wurden auf falscher Datenbank ausgeführt

**Symptom:** Migrationen erfolgreich, aber Tabellen fehlen

**Ursache:** `DATABASE_URL` im CI zeigt auf falsche Datenbank

**Lösung:**
1. Prüfe GitHub Secrets (Dev Environment) → `DATABASE_URL`
2. Stelle sicher, dass `DATABASE_URL` auf `sharelocal_dev` zeigt
3. Prüfe Container-Name: `sharelocal-postgres-dev`

### Problem 2: Container wurde nicht neu gestartet

**Symptom:** Alte Container-Version läuft noch

**Lösung:**
```bash
# Container stoppen und entfernen
docker stop sharelocal-api-dev
docker rm sharelocal-api-dev

# CI-Pipeline erneut ausführen oder manuell starten
```

### Problem 3: Migrationen wurden ausgeführt, aber Rollback erfolgt

**Symptom:** Migrationen in `_prisma_migrations`, aber Tabellen fehlen

**Lösung:**
```bash
# Migration-Status prüfen
docker exec sharelocal-api-dev sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate status --schema=./packages/database/prisma/schema.prisma"

# Falls Migrationen als "rolled_back" markiert sind, neu ausführen (als root)
docker exec --user root sharelocal-api-dev sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate resolve --applied <migration_name> --schema=./packages/database/prisma/schema.prisma"
```

### Problem 4: Migration-Dateien fehlen im Container

**Symptom:** "Migration not found" Fehler

**Lösung:**
1. Prüfe ob Migration-Dateien im Container vorhanden sind:
   ```bash
   docker exec --user root sharelocal-api-dev ls -la packages/database/prisma/migrations/
   ```

2. Falls nicht vorhanden, Container neu bauen (Dockerfile wurde aktualisiert)

## Nächste Schritte

1. ✅ Prüfe CI-Logs für Migration-Ausführung
2. ✅ Prüfe Migration-Status auf dem Server
3. ✅ Prüfe ob Tabellen existieren
4. ⏳ Migrationen manuell ausführen falls nötig
5. ⏳ Container neu starten falls nötig

