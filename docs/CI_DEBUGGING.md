# CI Debugging Guide

## Playwright Test Artifacts in GitHub Actions

Wenn Playwright-Tests in GitHub Actions fehlschlagen, werden automatisch Debug-Artifacts erstellt:

### Wo finde ich die Artifacts?

1. **GitHub Actions Run öffnen**
   - Gehe zu deinem Repository auf GitHub
   - Klicke auf "Actions" Tab
   - Öffne den fehlgeschlagenen Workflow-Run

2. **Artifacts herunterladen**
   - Scroll nach unten zum Abschnitt "Artifacts"
   - Du findest dort "playwright-report" (wenn Tests fehlschlagen)
   - Klicke auf "playwright-report" und lade es herunter

3. **Artifacts-Inhalt**
   - `test-results/` - Screenshots, Videos, Traces für jeden fehlgeschlagenen Test
   - `playwright-report/` - HTML-Report mit allen Test-Ergebnissen

### Artifacts-Struktur

```
playwright-report/
├── index.html              # HTML-Report (öffne im Browser)
└── data/
    └── ...

test-results/
├── test-name-retry1/
│   ├── test-failed-1.png   # Screenshot beim Fehler
│   ├── trace.zip           # Playwright Trace (öffne mit: npx playwright show-trace)
│   └── video.webm          # Video des Test-Runs (nur bei Fehlern)
└── ...
```

### Artifacts ansehen

#### HTML-Report
```bash
# Nach dem Download
cd playwright-report
open index.html  # Oder einfach im Browser öffnen
```

#### Playwright Trace
```bash
# Trace ansehen (interaktiv)
npx playwright show-trace test-results/test-name-retry1/trace.zip
```

#### Screenshots/Videos
- Screenshots: Einfach im Browser öffnen
- Videos: Mit jedem Video-Player öffnen

### Was wird hochgeladen?

- ✅ **Screenshots**: Bei jedem fehlgeschlagenen Test
- ✅ **Videos**: Bei fehlgeschlagenen Tests (nur in CI)
- ✅ **Traces**: Bei Retries (interaktive Debugging-Session)
- ✅ **HTML-Report**: Vollständiger Test-Report

### Retention

- Artifacts werden **30 Tage** aufbewahrt
- Danach werden sie automatisch gelöscht

### Troubleshooting

#### Keine Artifacts sichtbar?
- Prüfe, ob der Workflow-Run abgeschlossen ist (nicht cancelled)
- Artifacts werden nur hochgeladen, wenn Tests laufen (auch bei Fehlern)

#### Artifacts zu groß?
- Videos werden nur bei Fehlern erstellt (nicht bei erfolgreichen Tests)
- Traces werden nur bei Retries erstellt

### Beispiel-Workflow

1. Test schlägt fehl in CI
2. Gehe zu GitHub Actions → Fehlgeschlagener Run
3. Lade "playwright-report" herunter
4. Öffne `playwright-report/index.html` im Browser
5. Sieh dir Screenshots/Traces an, um den Fehler zu debuggen

### Weitere Debugging-Optionen

#### Lokale Reproduktion
```bash
# Tests lokal mit CI-Umgebung simulieren
CI=true pnpm --filter @sharelocal/web test:e2e:mocked
```

#### Debug-Modus
```bash
# Playwright UI-Modus (interaktiv)
pnpm --filter @sharelocal/web test:e2e:ui
```

#### Trace ansehen
```bash
# Trace aus CI herunterladen und ansehen
npx playwright show-trace path/to/trace.zip
```

