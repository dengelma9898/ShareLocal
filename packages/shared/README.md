# @sharelocal/shared

Shared TypeScript Types und Utilities für ShareLocal

Dieses Package enthält gemeinsame Type-Definitionen und Utility-Funktionen, die von allen anderen Packages (`@sharelocal/api`, `@sharelocal/web`) verwendet werden können.

## 🎯 Zweck

- **Type-Safety**: Gemeinsame Types für API und Frontend
- **Konsistenz**: Einheitliche Datenstrukturen über alle Packages
- **Wiederverwendbarkeit**: Keine Duplikation von Type-Definitionen

## 📦 Installation

```bash
# Wird automatisch installiert, wenn andere Packages installiert werden
pnpm install

# Oder explizit
pnpm --filter @sharelocal/shared install
```

## 🚀 Verwendung

### In anderen Packages

```typescript
import { User, Listing, UserRole, ListingCategory } from '@sharelocal/shared';
```

### Build

```bash
# Package bauen
pnpm build

# Watch-Mode für Development
pnpm dev
```

## 📁 Struktur

```
src/
├── index.ts          # Main Export
types/                # Type Definitions (später)
utils/                # Utility Functions (später)
constants/            # Constants (später)
```

## 📝 Verfügbare Types

### User Types

- `User` - User Entity
- `UserRole` - 'USER' | 'ADMIN'

### Listing Types

- `Listing` - Listing Entity
- `ListingCategory` - 'TOOL' | 'PLANT' | 'SKILL' | 'PRODUCT' | 'TIME' | 'OTHER'
- `ListingType` - 'OFFER' | 'REQUEST'

### API Response Types

- `ApiResponse<T>` - Standard API Response Format
- `PaginatedResponse<T>` - Paginierte API Responses

## ⚠️ Wichtige Regeln

- **Nur pure Functions und Types** - Keine Side-Effects
- **Keine Runtime-Dependencies** - Nur DevDependencies
- **Breaking Changes vermeiden** - Semantic Versioning beachten
- **Build muss erfolgreich sein** - Wird von anderen Packages importiert
- **Synchronisation**: Types sollten mit Prisma Schema synchronisiert bleiben

## 🔄 Synchronisation mit Database Schema

Die Types in diesem Package sollten mit dem Prisma Schema in `@sharelocal/database` synchronisiert bleiben. Bei Schema-Änderungen:

1. Prisma Schema aktualisieren
2. Types in diesem Package entsprechend anpassen
3. Build ausführen: `pnpm build`
4. Abhängige Packages testen

## 📚 Weitere Dokumentation

- [AGENTS.md](AGENTS.md) - Detaillierte Anweisungen für AI Coding Agents

---

**Status:** ✅ Basis-Types implementiert
