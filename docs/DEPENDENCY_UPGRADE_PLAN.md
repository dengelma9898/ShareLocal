# Dependency Upgrade Plan - Major Updates

Dieses Dokument beschreibt den schrittweisen Plan zur Aktualisierung der Major-Versionen unserer Dependencies.

## Übersicht der Major-Updates

| Package | Aktuell | Ziel | Kritikalität | Geschätzte Dauer |
|---------|---------|------|--------------|------------------|
| `zod` | 3.25.76 | 4.1.13 | 🔴 Hoch | 1-2 Stunden |
| `@prisma/client` | 5.22.0 | 6.19.1 | 🔴 Hoch | 1-2 Stunden |
| `express` | 4.21.2 | 5.2.1 | 🟡 Mittel | 1-2 Stunden |
| `vitest` | 1.6.1 | 4.0.15 | 🟢 Niedrig | 1 Stunde |
| `tailwindcss` | 3.4.18 | 4.1.18 | 🟡 Mittel | 2-3 Stunden |
| `eslint` | 8.57.1 | 9.39.2 | 🟢 Niedrig | 1-2 Stunden |

## Upgrade-Reihenfolge

Die Reihenfolge wurde nach Abhängigkeiten und Kritikalität gewählt:

### Phase 1: Zod (🔴 Hoch)
**Warum zuerst**: Zod wird von vielen Packages verwendet (API, Web, Shared). Ein Update hier betrifft viele Bereiche.

**Migrations-Ressourcen**:
- [Zod 4.0 Release Notes](https://github.com/colinhacks/zod/releases/tag/v4.0.0)
- [Zod Migration Guide](https://zod.dev/?id=migrating-to-v4)
- [Zod Changelog](https://github.com/colinhacks/zod/blob/master/CHANGELOG.md)

**Schritte**:
1. ✅ Migrations-Dokumentation lesen
2. Zod 4 Breaking Changes identifizieren
3. Alle Zod-Schemas prüfen und anpassen
4. Tests aktualisieren
5. Build-Verifizierung

**Betroffene Packages**: `@sharelocal/api`, `@sharelocal/web`, `@sharelocal/shared`

**Bekannte Breaking Changes (Zod 4)**:
- `z.string().min()` und `z.string().max()` haben neue Parameter
- `z.coerce` Verhalten geändert
- Type-Inferenz Verbesserungen (möglicherweise TypeScript-Fehler)
- Neue `z.brand()` API

### Phase 2: Prisma (🔴 Hoch)
**Warum zweitens**: Prisma ist kritisch für die Datenbank-Schicht. Nach Zod, da Zod-Schemas möglicherweise angepasst werden müssen.

**Hinweis**: Prisma 7.1.0 hat Breaking Changes (datasource URL muss in `prisma.config.ts`), die noch nicht vollständig stabil sind. Wir verwenden Prisma 6.19.1 (stabile Major-Version).

**Migrations-Ressourcen**:
- [Prisma 6.0 Release Notes](https://github.com/prisma/prisma/releases/tag/6.0.0)
- [Prisma Upgrade Guide](https://www.prisma.io/docs/guides/upgrade-guides)
- [Prisma 6 Migration Guide](https://www.prisma.io/docs/guides/upgrade-guides/upgrading-versions/upgrading-to-prisma-6)

**Schritte**:
1. ✅ Migrations-Dokumentation gelesen
2. ✅ Prisma 6 Breaking Changes identifiziert
3. ✅ Schema.prisma geprüft (keine Änderungen nötig)
4. ✅ Prisma Client neu generiert
5. ✅ API-Code geprüft (keine Anpassungen nötig)
6. ⏳ Migrationen testen
7. ⏳ Build-Verifizierung

**Betroffene Packages**: `@sharelocal/database`, `@sharelocal/api`

**Bekannte Breaking Changes (Prisma 6)**:
- Node.js 18.17+ erforderlich
- Verbesserte Type-Safety
- Performance-Verbesserungen
- Keine Schema-Änderungen erforderlich (kompatibel mit Prisma 5)

### Phase 3: Express (🟡 Mittel)
**Warum drittens**: Express ist das Backend-Framework. Nach Prisma, da API-Code möglicherweise angepasst werden muss.

**Migrations-Ressourcen**:
- [Express 5.0 Release Notes](https://github.com/expressjs/express/releases/tag/v5.0.0)
- [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html)
- [Express 5 Breaking Changes](https://github.com/expressjs/express/wiki/Migrating-from-4.x-to-5.x)

**Schritte**:
1. Migrations-Dokumentation lesen
2. Express 5 Breaking Changes identifizieren
3. API-Routes prüfen und anpassen
4. Middleware prüfen
5. Tests aktualisieren
6. Build-Verifizierung

**Betroffene Packages**: `@sharelocal/api`

**Bekannte Breaking Changes (Express 5)**:
- Node.js 18+ erforderlich
- `app.listen()` gibt Promise zurück
- Middleware-Signaturen geändert
- Verbesserte Error-Handling

### Phase 4: Vitest (🟢 Niedrig) ⚠️ **ÜBERSPRUNGEN**
**Warum viertens**: Testing-Framework, weniger kritisch. Nach Express, da Tests möglicherweise angepasst werden müssen.

**Status**: Vitest 4.0.15 wurde getestet, hat aber Test-Isolationsprobleme. Mit Vitest 1.6.1 laufen alle Tests erfolgreich (58 Tests), mit Vitest 4.0.15 schlagen 15 Tests fehl. Daher bleiben wir vorerst bei Vitest 1.x.

**Schritte**:
1. ✅ Migrations-Dokumentation gelesen
2. ✅ Vitest 4 Breaking Changes identifiziert (`pool: 'forks'` wurde entfernt)
3. ✅ Test-Konfiguration angepasst (verschiedene Optionen getestet)
4. ❌ Tests schlagen fehl - Test-Isolationsprobleme
5. ⚠️ **Entscheidung**: Bei Vitest 1.x bleiben bis Vitest 4 stabiler ist

**Betroffene Packages**: `@sharelocal/api`, `@sharelocal/web`, `@sharelocal/shared`

**Bekannte Probleme mit Vitest 4**:
- `pool: 'forks'` wurde entfernt
- `threads: false` (VM-basiert) bietet nicht die gleiche Isolation wie `forks` in Vitest 1
- Tests schlagen fehl aufgrund von Test-Isolationsproblemen (Foreign Key Constraints, Duplicate Keys)

### Phase 5: Tailwind CSS (🟡 Mittel)
**Warum fünftens**: Styling-Framework. Kann später kommen, da es hauptsächlich Frontend betrifft.

**Schritte**:
1. Migrations-Dokumentation lesen
2. Tailwind 4 Breaking Changes identifizieren
3. tailwind.config.ts anpassen
4. CSS-Klassen prüfen
5. Build-Verifizierung

**Betroffene Packages**: `@sharelocal/web`

### Phase 6: ESLint (🟢 Niedrig) ✅ **TEILWEISE ABGESCHLOSSEN**
**Warum zuletzt**: Dev-Tool, am wenigsten kritisch. Kann als letztes aktualisiert werden.

**Status**: ESLint 9 wurde erfolgreich für `@sharelocal/api` und `@sharelocal/shared` migriert. `@sharelocal/web` bleibt bei ESLint 8, da `next lint` noch nicht vollständig mit ESLint 9 kompatibel ist.

**Schritte**:
1. ✅ Migrations-Dokumentation gelesen
2. ✅ ESLint 9 Breaking Changes identifiziert (Flat Config Format)
3. ✅ ESLint-Konfiguration migriert (API & Shared)
4. ⚠️ Web-Package: Bei ESLint 8 bleiben (Next.js Kompatibilität)
5. ✅ Build-Verifizierung erfolgreich

**Betroffene Packages**: `@sharelocal/api` (✅), `@sharelocal/shared` (✅), `@sharelocal/web` (⚠️ ESLint 8), `@sharelocal/database` (keine ESLint-Konfiguration)

**Bekannte Probleme**:
- `next lint` unterstützt ESLint 9 Flat Config noch nicht vollständig
- FlatCompat mit Next.js Configs verursacht zirkuläre Referenzen
- Lösung: Web-Package bleibt bei ESLint 8 bis Next.js vollständige ESLint 9 Unterstützung bietet

## Allgemeine Vorgehensweise für jedes Update

1. **Vorbereitung**:
   - Feature-Branch erstellen: `upgrade-<package-name>-<version>`
   - Aktuelle Tests ausführen und sicherstellen, dass sie grün sind
   - Backup erstellen (Git Commit)

2. **Update durchführen**:
   - Migrations-Dokumentation lesen
   - Package aktualisieren: `pnpm --filter <package> add <package>@<version>`
   - Breaking Changes identifizieren
   - Code anpassen
   - Tests aktualisieren

3. **Verifizierung**:
   - `pnpm build` - Build muss erfolgreich sein
   - `pnpm test` - Tests müssen grün sein
   - `pnpm lint` - Linting muss erfolgreich sein
   - Manuelle Tests (falls nötig)

4. **Commit & Merge**:
   - Änderungen committen
   - Pull Request erstellen
   - Code Review
   - Merge nach main

## Risiken & Mitigation

### Risiko: Breaking Changes in Production
**Mitigation**: Jedes Update wird in einem separaten Branch getestet, bevor es gemerged wird.

### Risiko: Abhängigkeiten zwischen Packages
**Mitigation**: Reihenfolge wurde nach Abhängigkeiten gewählt. Zod zuerst, da es von vielen Packages verwendet wird.

### Risiko: Test-Failures
**Mitigation**: Tests werden nach jedem Update ausgeführt. Bei Fehlern wird der Code angepasst.

## Status-Tracking

- [x] Phase 1: Zod 3 → 4 ✅ **ABGESCHLOSSEN** (15. Dezember 2025)
- [x] Phase 2: Prisma 5 → 6 ✅ **ABGESCHLOSSEN** (15. Dezember 2025) - Prisma 7 noch nicht stabil, daher 6.x
- [x] Phase 3: Express 4 → 5 ✅ **ABGESCHLOSSEN** (15. Dezember 2025)
- [ ] Phase 4: Vitest 1 → 4 ⚠️ **ÜBERSPRUNGEN** (15. Dezember 2025) - Vitest 4 hat Test-Isolationsprobleme, bleiben bei Vitest 1.x
- [x] Phase 5: Tailwind CSS 3 → 4 ✅ **ABGESCHLOSSEN** (15. Dezember 2025)
- [x] Phase 6: ESLint 8 → 9 ✅ **TEILWEISE ABGESCHLOSSEN** (15. Dezember 2025) - API & Shared: ESLint 9, Web: ESLint 8 (Next.js Kompatibilität)

## Durchgeführte Migrationen

### Phase 1: Zod 3 → 4 ✅

**Datum**: 15. Dezember 2025  
**Branch**: `upgrade-zod-4`

**Durchgeführte Änderungen**:
1. ✅ Zod 4.1.13 installiert in `@sharelocal/api` und `@sharelocal/web`
2. ✅ Breaking Change behoben: `error.errors` → `error.issues` in `validation.ts`
3. ✅ API Build erfolgreich
4. ✅ Web Build erfolgreich
5. ✅ Alle Tests bestehen (58 Tests)

**Geänderte Dateien**:
- `packages/api/src/adapters/http/middleware/validation.ts` (3 Stellen: `error.errors` → `error.issues`)
- `packages/api/package.json` (zod: ^3.23.8 → ^4.1.13)
- `packages/web/package.json` (zod: ^3.25.76 → ^4.1.13)

**Breaking Changes behoben**:
- `ZodError.errors` wurde zu `ZodError.issues` umbenannt (Zod 4 Breaking Change)

**Verifizierung**:
- ✅ `pnpm --filter @sharelocal/api build` - Erfolgreich
- ✅ `pnpm --filter @sharelocal/web build` - Erfolgreich
- ✅ `pnpm --filter @sharelocal/api test` - 58 Tests bestehen

### Phase 2: Prisma 5 → 6 ✅

**Datum**: 15. Dezember 2025  
**Branch**: `upgrade-prisma-7` (trotz Branch-Name: Prisma 6.x verwendet)

**Durchgeführte Änderungen**:
1. ✅ Prisma 6.19.1 installiert (statt 7.1.0, da Prisma 7 noch nicht stabil)
2. ✅ Prisma Client neu generiert
3. ✅ Schema.prisma geprüft (keine Änderungen nötig - kompatibel)
4. ✅ API Build erfolgreich
5. ✅ Alle Tests bestehen (58 Tests)

**Geänderte Dateien**:
- `packages/database/package.json` (prisma: ^5.19.0 → ^6.19.1, @prisma/client: ^5.19.0 → ^6.19.1)
- `packages/api/package.json` (@prisma/client: ^5.19.0 → ^6.19.1)

**Breaking Changes behoben**:
- Keine Code-Änderungen nötig - Prisma 6 ist kompatibel mit Prisma 5 Schema

**Hinweis**: Prisma 7.1.0 wurde getestet, hat aber Breaking Changes (datasource URL muss in `prisma.config.ts`), die noch nicht vollständig stabil sind. Daher wurde Prisma 6.19.1 verwendet (stabile Major-Version).

**Verifizierung**:
- ✅ `pnpm --filter @sharelocal/database db:generate` - Erfolgreich
- ✅ `pnpm --filter @sharelocal/api build` - Erfolgreich
- ✅ `pnpm --filter @sharelocal/api test` - 58 Tests bestehen

### Phase 3: Express 4 → 5 ✅

**Datum**: 15. Dezember 2025  
**Branch**: `upgrade-express-5`

**Durchgeführte Änderungen**:
1. ✅ Express 5.2.1 installiert
2. ✅ Code geprüft (keine Breaking Changes in unserem Code)
3. ✅ API Build erfolgreich
4. ✅ Alle Tests bestehen (58 Tests)

**Geänderte Dateien**:
- `packages/api/package.json` (express: ^4.18.2 → ^5.2.1)
- `packages/api/src/index.ts` (Kommentar hinzugefügt zu app.listen())

**Breaking Changes geprüft**:
- `app.listen()` gibt in Express 5 ein Promise zurück, aber Callback wird weiterhin unterstützt
- Keine Code-Änderungen nötig - unser Code ist kompatibel

**Verifizierung**:
- ✅ `pnpm --filter @sharelocal/api build` - Erfolgreich
- ✅ `pnpm --filter @sharelocal/api test` - 58 Tests bestehen

### Phase 5: Tailwind CSS 3 → 4 ✅

**Datum**: 15. Dezember 2025  
**Branch**: `upgrade-tailwind-4`

**Durchgeführte Änderungen**:
1. ✅ Tailwind CSS 4.1.18 installiert
2. ✅ `@tailwindcss/postcss` Plugin installiert
3. ✅ PostCSS-Konfiguration angepasst (`tailwindcss` → `@tailwindcss/postcss`)
4. ✅ CSS-Datei migriert (`@tailwind base/components/utilities` → `@import "tailwindcss"`)
5. ✅ `@apply` Direktiven durch native CSS ersetzt
6. ✅ `tailwind.config.ts` vereinfacht (Theme-Konfiguration in CSS)

**Geänderte Dateien**:
- `packages/web/package.json` (tailwindcss: ^3.4.1 → ^4.1.18, tailwind-merge: ^2.2.1 → ^3.4.0)
- `packages/web/postcss.config.js` (tailwindcss → @tailwindcss/postcss)
- `packages/web/app/globals.css` (@tailwind → @import, @apply → native CSS)
- `packages/web/tailwind.config.ts` (vereinfacht, Theme-Konfiguration entfernt)

**Breaking Changes behoben**:
- Tailwind CSS 4 verwendet CSS-basierte Konfiguration
- `@apply` Direktiven müssen durch native CSS ersetzt werden
- PostCSS Plugin wurde zu `@tailwindcss/postcss` verschoben

**Verifizierung**:
- ✅ `pnpm --filter @sharelocal/web build` - Erfolgreich

### Phase 6: ESLint 8 → 9 ✅ **TEILWEISE**

**Datum**: 15. Dezember 2025  
**Branch**: `upgrade-eslint-9`

**Durchgeführte Änderungen**:
1. ✅ ESLint 9.39.2 installiert (API, Shared)
2. ✅ ESLint 8.57.0 beibehalten (Web - Next.js Kompatibilität)
3. ✅ Konfigurationen zu Flat Config migriert (API, Shared)
4. ✅ Benötigte Pakete installiert (`@eslint/js`, `@eslint/eslintrc`, `globals`)
5. ✅ Linting-Fehler behoben (unused variable in JwtAuthService)

**Geänderte Dateien**:
- `packages/api/package.json` (eslint: ^8.57.0 → ^9.39.2, @typescript-eslint/*: ^7.0.0 → ^8.49.0)
- `packages/shared/package.json` (eslint: ^8.57.0 → ^9.39.2, @typescript-eslint/*: ^7.0.0 → ^8.49.0)
- `packages/web/package.json` (eslint: ^8.57.0 beibehalten, @typescript-eslint/*: ^7.0.0 → ^8.49.0)
- `packages/api/.eslintrc.json` → `packages/api/eslint.config.mjs` (migriert)
- `packages/shared/.eslintrc.json` → `packages/shared/eslint.config.mjs` (migriert)
- `packages/api/src/adapters/services/JwtAuthService.ts` (unused variable entfernt)

**Breaking Changes behoben**:
- ESLint 9 verwendet Flat Config Format (`eslint.config.mjs`)
- `.eslintrc.json` wurde zu `eslint.config.mjs` migriert
- `FlatCompat` wird verwendet für Kompatibilität mit alten Configs

**Hinweis**: `@sharelocal/web` bleibt bei ESLint 8, da `next lint` noch nicht vollständig mit ESLint 9 kompatibel ist. Sobald Next.js vollständige ESLint 9 Unterstützung bietet, kann auch das Web-Package migriert werden.

**Verifizierung**:
- ✅ `pnpm --filter @sharelocal/api lint` - Erfolgreich
- ✅ `pnpm --filter @sharelocal/shared lint` - Erfolgreich
- ✅ `pnpm --filter @sharelocal/api build` - Erfolgreich
- ✅ `pnpm --filter @sharelocal/web build` - Erfolgreich

---

**Letzte Aktualisierung**: 15. Dezember 2025
**Nächster Schritt**: Phase 1 - Zod 3 → 4 Migration

