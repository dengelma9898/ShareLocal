# Prisma Migrate vs. Flyway - Automatische Migrationen

## Vergleich: Prisma Migrate vs. Flyway

**Prisma Migrate** ist das Äquivalent zu **Flyway** für Node.js/TypeScript Projekte.

### Gemeinsamkeiten

| Feature | Flyway | Prisma Migrate |
|---------|--------|----------------|
| **Migration-Versionierung** | ✅ Timestamps/Versionen | ✅ Timestamps (`20251125212522_init`) |
| **SQL-Migrationen** | ✅ | ✅ |
| **Migration-History** | ✅ `flyway_schema_history` | ✅ `_prisma_migrations` |
| **Automatische Ausführung** | ✅ Beim App-Start | ⚠️ Muss konfiguriert werden |
| **Rollback** | ✅ | ✅ (`migrate resolve --rolled-back`) |
| **CI/CD Integration** | ✅ | ✅ |

### Unterschiede

| Aspekt | Flyway | Prisma Migrate |
|--------|--------|----------------|
| **Schema-First** | ❌ SQL-basiert | ✅ Schema-First (generiert SQL) |
| **Migration-Generierung** | Manuell | Automatisch aus Schema |
| **Type Safety** | ❌ | ✅ TypeScript Types |

## Automatische Migrationen beim Deployment

### Option 1: Migrationen beim Container-Start (wie Flyway)

**Vorteil:** Migrationen werden automatisch ausgeführt, bevor die App startet (wie Flyway)

**Nachteil:** Container startet langsamer, Fehler beim Start möglich

#### Implementierung: Entrypoint Script

Erstelle `packages/api/scripts/migrate-and-start.sh`:

```bash
#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Migrationen ausführen
pnpm --filter @sharelocal/database db:migrate:deploy

echo "✅ Migrations completed"

# App starten
echo "🚀 Starting application..."
exec node packages/api/dist/index.js
```

**Dockerfile anpassen:**

```dockerfile
# Copy migration script
COPY packages/api/scripts/migrate-and-start.sh /app/migrate-and-start.sh
RUN chmod +x /app/migrate-and-start.sh

# Use migration script as entrypoint
CMD ["/app/migrate-and-start.sh"]
```

### Option 2: Migrationen in CI/CD (Empfohlen)

**Vorteil:** Klare Trennung, Migrationen werden vor Deployment ausgeführt

**Nachteil:** Zusätzlicher CI/CD Schritt

#### Implementierung: GitHub Actions

Füge Migration-Step zum Deployment hinzu:

```yaml
- name: Run database migrations
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ env.SERVER_HOST }}
    username: ${{ env.SERVER_USER }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      docker exec sharelocal-api-dev pnpm --filter @sharelocal/database db:migrate:deploy
```

### Option 3: Init Container (Kubernetes)

Für Kubernetes-Deployments (später):

```yaml
initContainers:
  - name: migrate
    image: dengelma/sharelocal-api-dev:latest
    command: ["pnpm", "--filter", "@sharelocal/database", "db:migrate:deploy"]
    env:
      - name: DATABASE_URL
        valueFrom:
          secretKeyRef:
            name: database-secret
            key: url
```

## Empfohlene Lösung für ShareLocal

**Für jetzt:** Option 2 (CI/CD) - Migrationen werden explizit vor Container-Start ausgeführt

**Später:** Option 1 (Entrypoint Script) - Automatisch wie Flyway

## Migration-Strategien

### 1. Development: `prisma migrate dev`

```bash
# Erstellt Migration und wendet sie an
pnpm db:migrate
```

**Verwendung:** Lokale Entwicklung, erstellt neue Migrationen

### 2. Production: `prisma migrate deploy`

```bash
# Wendet nur ausstehende Migrationen an
pnpm db:migrate:deploy
```

**Verwendung:** CI/CD, Production-Deployment

### 3. Schema Push: `prisma db push`

```bash
# Synchronisiert Schema ohne Migrationen (nur Dev!)
pnpm db:push
```

**Verwendung:** Nur für Tests, nicht für Production!

## Migration-History prüfen

### Prisma Migrate

```bash
# Migration-Status prüfen
docker exec sharelocal-api-dev pnpm --filter @sharelocal/database exec prisma migrate status

# Migration-History anzeigen
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;"
```

### Flyway (Vergleich)

```bash
# Migration-Status prüfen
flyway info

# Migration-History anzeigen
SELECT * FROM flyway_schema_history ORDER BY installed_on DESC;
```

## Best Practices

### 1. Migrationen niemals manuell editieren

**Prisma:** Migrationen werden aus Schema generiert, nicht manuell editiert

**Flyway:** Migrationen können manuell editiert werden (aber nicht empfohlen)

### 2. Migrationen immer testen

```bash
# Migration erstellen ohne anzuwenden
pnpm db:migrate --create-only

# Migration prüfen
cat packages/database/prisma/migrations/YYYYMMDDHHMMSS_migration_name/migration.sql
```

### 3. Rollback-Strategie

**Prisma:** Kein automatischer Rollback, aber `migrate resolve` für manuelle Korrekturen

**Flyway:** Automatischer Rollback mit `flyway undo`

### 4. CI/CD Integration

**Prisma:** Migrationen sollten vor Deployment ausgeführt werden

**Flyway:** Migrationen werden automatisch beim App-Start ausgeführt

## Nächste Schritte

1. ✅ Migrationen manuell ausführen (aktuell)
2. ⏳ CI/CD Integration hinzufügen (Option 2)
3. ⏳ Entrypoint Script für automatische Migrationen (Option 1, später)

## Siehe auch

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Flyway Docs](https://flywaydb.org/documentation/)
- `docs/DATABASE_MIGRATIONS_SERVER.md` - Anleitung für Server-Migrationen

