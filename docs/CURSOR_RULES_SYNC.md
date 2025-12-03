# Cursor Rules & AGENTS.md Synchronisation

## Übersicht

Dieses Projekt verwendet sowohl `AGENTS.md` Dateien (nach dem [agents.md Standard](https://agents.md/)) als auch `.cursorrules` Dateien, um sicherzustellen, dass Cursor die Projekt-Kontext-Informationen einliest.

## Warum beide?

- **AGENTS.md**: Standard-Dokumentation für AI-Agents (agents.md Standard)
- **.cursorrules**: Wird von Cursor automatisch eingelesen und garantiert, dass Cursor die Regeln verwendet

## Datei-Struktur

Jedes Package hat sowohl eine `AGENTS.md` als auch eine `.cursorrules` Datei:

```
sharelocal/
├── AGENTS.md                    # Root-Kontext
├── .cursorrules                 # Root-Regeln (Cursor)
├── packages/
│   ├── api/
│   │   ├── AGENTS.md           # API-spezifischer Kontext
│   │   └── .cursorrules        # API-spezifische Regeln (Cursor)
│   ├── web/
│   │   ├── AGENTS.md           # Web-spezifischer Kontext
│   │   └── .cursorrules        # Web-spezifische Regeln (Cursor)
│   ├── database/
│   │   ├── AGENTS.md           # Database-spezifischer Kontext
│   │   └── .cursorrules        # Database-spezifische Regeln (Cursor)
│   ├── shared/
│   │   ├── AGENTS.md           # Shared-spezifischer Kontext
│   │   └── .cursorrules        # Shared-spezifische Regeln (Cursor)
│   └── mobile/
│       ├── AGENTS.md           # Mobile-spezifischer Kontext
│       └── .cursorrules        # Mobile-spezifische Regeln (Cursor)
```

## Synchronisation

**Wichtig**: Die `.cursorrules` Dateien sollten mit den entsprechenden `AGENTS.md` Dateien synchronisiert bleiben.

### Quelle der Wahrheit

- **AGENTS.md** ist die Quelle der Wahrheit
- **.cursorrules** enthält den gleichen Inhalt für Cursor

### Wenn du AGENTS.md aktualisierst

Wenn du eine `AGENTS.md` Datei aktualisierst, solltest du auch die entsprechende `.cursorrules` Datei aktualisieren:

1. Öffne die entsprechende `AGENTS.md` Datei
2. Kopiere den Inhalt
3. Öffne die entsprechende `.cursorrules` Datei
4. Ersetze den Inhalt nach dem Header (der erste Abschnitt bleibt gleich)
5. Speichere beide Dateien

### Automatisierung (Optional)

Du könntest ein Script erstellen, das die Synchronisation automatisiert:

```bash
#!/bin/bash
# sync-cursorrules.sh

# Root
cp AGENTS.md .cursorrules.tmp
sed -i '' '1s/^/# ShareLocal - Cursor Rules\n\n⚠️ **WICHTIG**: Diese Datei sollte mit `AGENTS.md` synchronisiert bleiben.\nDie Quelle der Wahrheit ist `AGENTS.md`. Diese `.cursorrules` Datei wird von Cursor automatisch eingelesen.\n\n---\n\n/' .cursorrules.tmp
mv .cursorrules.tmp .cursorrules

# Packages
for pkg in api web database shared mobile; do
  if [ -f "packages/$pkg/AGENTS.md" ]; then
    cp "packages/$pkg/AGENTS.md" "packages/$pkg/.cursorrules.tmp"
    sed -i '' "1s/^/# @sharelocal\/$pkg - Cursor Rules\n\n⚠️ **WICHTIG**: Diese Datei sollte mit \`AGENTS.md\` synchronisiert bleiben.\nDie Quelle der Wahrheit ist \`packages\/$pkg\/AGENTS.md\`. Diese \`.cursorrules\` Datei wird von Cursor automatisch eingelesen.\n\n---\n\n/" "packages/$pkg/.cursorrules.tmp"
    mv "packages/$pkg/.cursorrules.tmp" "packages/$pkg/.cursorrules"
  fi
done
```

## Verwendung

### Für Entwickler

- Lies die `AGENTS.md` Dateien für vollständige Dokumentation
- Cursor liest automatisch die `.cursorrules` Dateien ein
- Beide enthalten die gleichen Informationen

### Für AI-Agents

- AI-Agents sollten beide Dateien lesen können
- `.cursorrules` wird von Cursor garantiert eingelesen
- `AGENTS.md` folgt dem agents.md Standard

## Best Practices

1. **Immer beide Dateien aktualisieren**: Wenn du eine `AGENTS.md` aktualisierst, aktualisiere auch die entsprechende `.cursorrules`
2. **Header beibehalten**: Der Header in `.cursorrules` sollte nicht geändert werden
3. **Inhalt synchron halten**: Der Inhalt nach dem Header sollte identisch sein
4. **Commits zusammen**: Committe beide Dateien zusammen, wenn du sie aktualisierst

## Troubleshooting

### Cursor ignoriert die Regeln

1. Stelle sicher, dass `.cursorrules` Dateien im richtigen Verzeichnis sind
2. Überprüfe, ob die Dateien nicht in `.gitignore` sind
3. Starte Cursor neu, damit die Regeln neu geladen werden

### Unterschiedliche Inhalte

1. Vergleiche `AGENTS.md` und `.cursorrules` in dem betroffenen Package
2. Aktualisiere die `.cursorrules` Datei mit dem Inhalt aus `AGENTS.md`
3. Behalte den Header in `.cursorrules` bei

