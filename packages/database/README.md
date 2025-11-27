# @sharelocal/database

Prisma Database Schema für ShareLocal

## Schema-Übersicht

Das Schema enthält folgende Haupt-Entitäten:

- **User**: Benutzer mit Authentifizierung und Profil-Daten
- **Listing**: Ressourcen-Katalog (Werkzeuge, Pflanzen, Skills, etc.)
- **Conversation**: Chat-Threads zwischen Nutzern
- **Message**: Einzelne Nachrichten in Conversations

## Setup

1. Erstelle eine `.env` Datei im Root-Verzeichnis mit:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sharelocal?schema=public"
```

2. Generiere den Prisma Client:
```bash
pnpm db:generate
```

3. Führe Migrationen aus:
```bash
pnpm db:migrate
```

4. Seed die Datenbank mit Test-Daten:
```bash
pnpm db:seed
```

## Scripts

- `pnpm db:generate` - Generiert Prisma Client
- `pnpm db:push` - Synchronisiert Schema mit Datenbank (Development)
- `pnpm db:migrate` - Erstellt und führt Migrationen aus
- `pnpm db:studio` - Öffnet Prisma Studio (GUI)
- `pnpm db:seed` - Führt Seed-Script aus

## Verwendung

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Beispiel: User erstellen
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '...',
  },
});
```

## Schema-Features

- ✅ Soft Deletes (`deletedAt` Feld)
- ✅ Timestamps (`createdAt`, `updatedAt`)
- ✅ Indexes für Performance
- ✅ Relations mit Cascade Delete
- ✅ Enums für Type-Safety
- ✅ Vorbereitet für PostGIS (latitude/longitude Felder)

## Seed-Daten

Das Seed-Script erstellt:
- 3 Test-User (inkl. Admin)
- 3 Beispiel-Listings
- 1 Test-Conversation mit Messages

Standard-Passwort für alle Test-User: `test123`

## ⚠️ Wichtige Regeln

- **Schema-Validierung muss erfolgreich sein**: `prisma validate` vor dem Abschließen
- **Migrationen testen**: `pnpm db:migrate --create-only` vor dem Anwenden
- Schema-Änderungen erfordern Migrationen
- Migrationen sollten niemals manuell editiert werden

## 📚 Weitere Dokumentation

- [AGENTS.md](AGENTS.md) - Detaillierte Anweisungen für AI Coding Agents
