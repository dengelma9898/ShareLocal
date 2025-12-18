# Accessibility Tests

## Übersicht

Die Accessibility-Tests verwenden zwei Tools, um WCAG 2.1 AA Compliance sicherzustellen:

1. **axe-core** (via `@axe-core/playwright`) - Automatisierte Accessibility-Tests in Playwright
2. **Lighthouse CI** - Automatische Accessibility-Audits mit Score-Validierung

## Lokale Ausführung

### axe-core Tests

```bash
# Alle Accessibility-Tests ausführen
pnpm --filter @sharelocal/web test:e2e:accessibility

# Oder direkt mit Playwright
pnpm --filter @sharelocal/web exec playwright test accessibility.mocked.spec.ts --project=chromium-mocked
```

### Lighthouse CI

```bash
# Lighthouse CI lokal ausführen (benötigt laufenden Dev-Server)
pnpm --filter @sharelocal/web dev  # In einem Terminal
lhci autorun  # In einem anderen Terminal
```

## CI/CD Integration

Die Accessibility-Tests laufen automatisch in GitHub Actions bei jedem Push:

1. **axe-core Tests** - Werden im `accessibility` Job ausgeführt
2. **Lighthouse CI** - Läuft automatisch und validiert Accessibility-Score ≥ 0.9

### Konfiguration

- **axe-core**: Testet WCAG 2.1 AA Compliance auf wichtigen Seiten
- **Lighthouse CI**: Validiert Accessibility-Score ≥ 0.9 (90%)

### Testierte Seiten

- Homepage (`/`)
- Listings Page (`/listings`)
- Login Page (`/login`)
- Register Page (`/register`)

## Erwartete Scores

- **Accessibility**: ≥ 0.9 (90%) - **ERROR** wenn nicht erreicht
- **Performance**: ≥ 0.7 (70%) - **WARN** wenn nicht erreicht
- **Best Practices**: ≥ 0.8 (80%) - **WARN** wenn nicht erreicht
- **SEO**: ≥ 0.8 (80%) - **WARN** wenn nicht erreicht

## Fehlerbehebung

Wenn Accessibility-Tests fehlschlagen:

1. **axe-core Verletzungen**: Prüfe die Console-Logs für Details zu Verletzungen
2. **Lighthouse Score zu niedrig**: Prüfe den Lighthouse-Report in `.lighthouseci/`

## Weitere Informationen

- [axe-core Dokumentation](https://github.com/dequelabs/axe-core)
- [Lighthouse CI Dokumentation](https://github.com/GoogleChrome/lighthouse-ci)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
