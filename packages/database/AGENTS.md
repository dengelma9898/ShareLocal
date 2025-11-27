# @sharelocal/database - Agent Context

Prisma Database Schema Package

## Setup commands

- Install deps: `pnpm install` (vom Root) oder `pnpm --filter @sharelocal/database install`
- Generate Prisma Client: `pnpm db:generate`
- Push schema to DB: `pnpm db:push` (Development)
- Create migration: `pnpm db:migrate`
- Open Prisma Studio: `pnpm db:studio`
- Seed database: `pnpm db:seed`

## Dev environment tips

- PostgreSQL 17.x mit PostGIS erforderlich
- DATABASE_URL in `.env` Datei (Root-Verzeichnis) setzen
- Format: `postgresql://user:password@localhost:5432/sharelocal?schema=public`
- Nach Schema-Änderungen: `pnpm db:generate` ausführen
- Prisma Studio für Datenbank-Browser: `pnpm db:studio`

## Code style

- Prisma Schema Syntax befolgen
- Model-Namen: PascalCase
- Field-Namen: camelCase
- Relations klar definieren
- Indexes für Performance

## Testing instructions

- Schema-Validierung: `prisma validate`
- Migration-Tests: `prisma migrate dev --create-only` (prüft Syntax)
- Seed-Script sollte idempotent sein

## Package structure

```
prisma/
├── schema.prisma     # Prisma Schema Definition
└── seed.ts           # Database Seed Script (später)
```

## Dependencies

- @prisma/client für Runtime
- prisma CLI für Development
- PostgreSQL 17.x mit PostGIS

## Important notes

- Schema-Änderungen erfordern Migrationen
- Migrationen sollten niemals manuell editiert werden
- Seed-Script für Development-Daten
- PostGIS für geografische Features (Standort-Suche)
- Foreign Keys und Constraints definieren
- Indexes für häufig abgefragte Felder

## Database constraints

- Alle Tabellen sollten `createdAt` und `updatedAt` haben
- Soft Deletes mit `deletedAt` (später)
- UUIDs für IDs bevorzugt
- Timestamps als DateTime

## ⚠️ WICHTIG: Schema-Validierung muss erfolgreich sein

**Vor dem Abschließen von Schema-Änderungen MUSS die Validierung erfolgreich sein:**

```bash
pnpm db:generate
prisma validate
```

- Prisma Schema muss valide sein
- Prisma Client Generation muss erfolgreich sein
- Migrationen müssen erstellt werden können: `pnpm db:migrate --create-only`
- Schema-Fehler müssen behoben werden, bevor Änderungen als abgeschlossen gelten

