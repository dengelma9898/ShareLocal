# Datenbank-Migrationen auf dem Server ausführen

## Problem

Die Tabelle `public.users` existiert nicht in der Datenbank. Das bedeutet, dass die Prisma-Migrationen noch nicht ausgeführt wurden.

## Lösung: Migrationen ausführen

### Option 1: Migrationen im API-Container ausführen (Empfohlen)

```bash
# SSH zum Server
ssh root@87.106.208.51

# Migrationen im API-Container ausführen
docker exec sharelocal-api-dev pnpm --filter @sharelocal/database db:migrate:deploy
```

**Wichtig:** Verwende `db:migrate deploy` für Production, nicht `db:migrate dev`!

### Option 2: Migrationen manuell mit Prisma CLI

```bash
# SSH zum Server
ssh root@87.106.208.51

# In den API-Container gehen
docker exec -it sharelocal-api-dev sh

# Migrationen ausführen
cd /app
pnpm --filter @sharelocal/database db:migrate:deploy

# Oder direkt mit Prisma CLI
cd packages/database
npx prisma migrate deploy
```

### Option 3: Migrationen über CI/CD (Zukünftig)

Migrationen sollten idealerweise automatisch beim Deployment ausgeführt werden. Siehe `.github/workflows/ci-api.yml` für CI/CD Integration.

## Prüfung: Migrationen erfolgreich

### 1. Tabellen prüfen

```bash
# SSH zum Server
ssh root@87.106.208.51

# PostgreSQL Container prüfen
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "\dt"
```

**Erwartete Tabellen:**
- `users`
- `listings`
- `conversations`
- `messages`
- `_prisma_migrations`

### 2. Health Check prüfen

```bash
# Health Check sollte jetzt "ok" zurückgeben
curl https://nuernbergspots.de/share-local/dev/api/health
```

**Erwartete Antwort:**
```json
{
  "status": "ok",
  "database": "ok",
  "encryption": "ok",
  "timestamp": "2024-..."
}
```

### 3. Registrierung testen

Nach erfolgreichen Migrationen sollte die Registrierung funktionieren:

```bash
curl -X POST https://nuernbergspots.de/share-local/dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "test123456"
  }'
```

## Troubleshooting

### Problem: "Migration not found"

**Ursache:** Migrationen wurden nicht ins Docker Image kopiert

**Lösung:**
1. Prüfe ob Migrationen im Container vorhanden sind:
   ```bash
   docker exec sharelocal-api-dev ls -la packages/database/prisma/migrations
   ```

2. Falls nicht vorhanden, Container neu bauen (Migrationen sollten im Dockerfile kopiert werden)

### Problem: "Database connection failed"

**Ursache:** `DATABASE_URL` ist falsch oder Datenbank-Container läuft nicht

**Lösung:**
1. Prüfe `DATABASE_URL`:
   ```bash
   docker exec sharelocal-api-dev printenv | grep DATABASE_URL
   ```

2. Prüfe Datenbank-Container:
   ```bash
   docker ps | grep postgres
   ```

3. Prüfe Netzwerk:
   ```bash
   docker network inspect sharelocal-network
   ```

### Problem: "Migration already applied"

**Ursache:** Migrationen wurden bereits ausgeführt

**Lösung:**
- Das ist OK! Prüfe ob Tabellen existieren:
  ```bash
  docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "\dt"
  ```

## Migrationen zurücksetzen (Nur für Development!)

**⚠️ WARNUNG:** Nur für Development-Datenbanken! Löscht alle Daten!

```bash
# SSH zum Server
ssh root@87.106.208.51

# Datenbank zurücksetzen
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Migrationen neu ausführen
docker exec sharelocal-api-dev pnpm --filter @sharelocal/database db:migrate:deploy
```

## Automatische Migrationen beim Deployment

### CI/CD Integration (Zukünftig)

Migrationen sollten automatisch beim Deployment ausgeführt werden. Füge folgenden Schritt zum CI-Workflow hinzu:

```yaml
- name: Run database migrations
  run: |
    docker exec sharelocal-api-dev pnpm --filter @sharelocal/database db:migrate:deploy
```

**Oder besser:** Migrationen vor dem Container-Start ausführen (init container oder entrypoint script).

## Nächste Schritte

1. ✅ Migrationen ausführen (siehe Option 1 oben)
2. ✅ Tabellen prüfen
3. ✅ Health Check testen
4. ✅ Registrierung testen
5. ⏳ CI/CD für automatische Migrationen einrichten (optional)

