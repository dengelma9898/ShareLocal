# Dockerfile Migration-Dateien Fix

## Problem

Migration-Dateien fehlen im Container trotz Dockerfile-Änderungen:
```bash
docker exec --user root sharelocal-api-dev ls -la packages/database/prisma/migrations/
# ls: packages/database/prisma/migrations/: No such file or directory
```

## Lösung: Explizites Kopieren der Migration-Dateien

Das Dockerfile wurde so geändert, dass Migration-Dateien explizit kopiert werden:

### Vorher (funktionierte nicht):
```dockerfile
COPY packages/database/prisma ./packages/database/prisma
```

### Nachher (explizit):
```dockerfile
# Builder-Stage
COPY packages/database/prisma/schema.prisma ./packages/database/prisma/
COPY packages/database/prisma/migrations ./packages/database/prisma/migrations
COPY packages/database/prisma/migration_lock.toml ./packages/database/prisma/

# Production-Stage
COPY --from=api-builder --chown=nodejs:nodejs /app/packages/database/prisma/schema.prisma ./packages/database/prisma/
COPY --from=api-builder --chown=nodejs:nodejs /app/packages/database/prisma/migrations ./packages/database/prisma/migrations
COPY --from=api-builder --chown=nodejs:nodejs /app/packages/database/prisma/migration_lock.toml ./packages/database/prisma/
```

## Debug-Steps hinzugefügt

Das Dockerfile enthält jetzt Debug-Steps, die während des Builds prüfen, ob Migration-Dateien kopiert wurden:

```dockerfile
# Debug: Prüfe ob Migration-Dateien kopiert wurden
RUN ls -la ./packages/database/prisma/migrations/ || echo "⚠️ WARNING: Migration files not found in builder stage"
```

**Im CI-Build-Log sollte erscheinen:**
```
drwxr-xr-x    4 root     root           128 Dec  1 21:00 .
drwxr-xr-x    3 root     root            96 Dec  1 21:00 ..
drwxr-xr-x    3 root     root            96 Dec  1 21:00 20251125212522_init
-rw-r--r--    1 root     root           126 Dec  1 21:00 migration_lock.toml
```

**Wenn Warnung erscheint:**
- ❌ Migration-Dateien wurden nicht kopiert
- ✅ Prüfe Build-Kontext und COPY-Befehle

## Nächste Schritte

1. ✅ Dockerfile wurde aktualisiert
2. ⏳ CI-Pipeline erneut ausführen (Image neu bauen)
3. ⏳ Prüfe CI-Build-Logs für Debug-Ausgaben
4. ⏳ Nach Deployment: Migration-Dateien erneut prüfen

## Verifizierung nach Neu-Build

Nach dem Neu-Build prüfe:

```bash
# Prüfe Migration-Dateien im Container
docker exec --user root sharelocal-api-dev ls -la packages/database/prisma/migrations/

# Erwartete Ausgabe:
# drwxr-xr-x    4 root     root           128 Dec  1 21:00 .
# drwxr-xr-x    3 root     root            96 Dec  1 21:00 ..
# drwxr-xr-x    3 root     root            96 Dec  1 21:00 20251125212522_init
# -rw-r--r--    1 root     root           126 Dec  1 21:00 migration_lock.toml
```

## Warum explizites Kopieren?

**Problem mit `COPY packages/database/prisma ./packages/database/prisma`:**
- Docker kopiert möglicherweise nicht alle Unterverzeichnisse korrekt
- Leere Verzeichnisse werden nicht kopiert
- Migration-Dateien in Unterordnern könnten übersehen werden

**Lösung: Explizites Kopieren**
- Jede Datei/Verzeichnis wird explizit kopiert
- Keine Abhängigkeit von Docker's automatischer Verzeichnis-Kopier-Logik
- Klarere Fehlerbehandlung

