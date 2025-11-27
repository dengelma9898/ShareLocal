# CI/CD Pipeline Setup

**Stand:** 2025-01-25  
**Status:** ✅ Vollständig implementiert

---

## ✅ GitHub Actions CI Pipeline

Die CI Pipeline läuft automatisch bei jedem Push oder Pull Request zu `main` oder `develop` Branches.

### Workflow: `.github/workflows/ci.yml`

**Jobs:**

1. **Lint** (Linting)
   - Führt ESLint für API und Web aus
   - Prüft Code-Qualität

2. **Build** (Build)
   - Baut API Package (TypeScript → JavaScript)
   - Baut Web Package (Next.js Build)
   - Prüft, ob alles kompiliert

3. **Test API** (API Tests)
   - Startet PostgreSQL Service (Docker)
   - Führt Database Migrations aus
   - Führt alle API Tests aus (58 Tests)
   - Prüft, ob alle Tests erfolgreich sind

4. **Test Web** (Web E2E Tests)
   - Installiert Playwright Browsers
   - Führt E2E Tests im Mock-Mode aus
   - Prüft Frontend-Funktionalität

5. **Summary** (Zusammenfassung)
   - Zeigt Status aller Jobs
   - Erstellt GitHub Summary

---

## 🚀 Verwendung

### Automatisch

Die Pipeline läuft automatisch bei:
- Push zu `main` oder `develop`
- Pull Requests zu `main` oder `develop`

### Manuell

Pipeline kann auch manuell getriggert werden über GitHub Actions UI.

---

## 📋 Requirements

### GitHub Secrets (optional)

Für Production-Builds können Secrets gesetzt werden:

- `DATABASE_URL`: PostgreSQL Connection String (für Tests wird lokaler Service verwendet)
- `JWT_SECRET`: JWT Secret (für Tests wird Default verwendet)
- `ENCRYPTION_KEY`: Encryption Key (für Tests wird Default verwendet)

**Hinweis:** Für CI werden Default-Werte verwendet, Secrets sind optional.

---

## 🔍 Pipeline Status

Pipeline-Status kann über GitHub Actions Tab im Repository eingesehen werden:
- ✅ Grüner Status = Alle Checks erfolgreich
- ❌ Roter Status = Mindestens ein Check fehlgeschlagen

---

## 🛠️ Lokales Testen

Um die Pipeline lokal zu testen:

```bash
# Lint
pnpm --filter @sharelocal/api lint
pnpm --filter @sharelocal/web lint

# Build
pnpm --filter @sharelocal/api build
pnpm --filter @sharelocal/web build

# Tests
pnpm --filter @sharelocal/api test
pnpm --filter @sharelocal/web test:e2e:mocked
```

---

## 📊 Pipeline-Dauer

- **Lint**: ~30 Sekunden
- **Build**: ~1-2 Minuten
- **Test API**: ~2-3 Minuten (inkl. Database Setup)
- **Test Web**: ~1-2 Minuten

**Gesamt:** ~5-8 Minuten

---

## ✅ Erfolgskriterien

Pipeline ist erfolgreich wenn:
- ✅ Alle Lint-Checks bestehen
- ✅ Alle Builds erfolgreich sind
- ✅ Alle Tests erfolgreich sind (58 API Tests, Web E2E Tests)

---

**Status:** ✅ CI/CD Pipeline aktiv und funktionsfähig

