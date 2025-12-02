# Migration-Dateien im Container prüfen

## Problem: Migration-Dateien fehlen im Container

Wenn `ls -la packages/database/prisma/migrations/` zeigt "No such file or directory", bedeutet das, dass das Docker Image ohne Migration-Dateien gebaut wurde.

## Prüfung: Sind Migration-Dateien im Docker Image?

### Schritt 1: Prüfe direkt im Docker Image (ohne Container)

```bash
# Prüfe ob Migration-Dateien im Image vorhanden sind
docker run --rm --entrypoint sh dengelma/sharelocal-api-dev:latest -c "ls -la packages/database/prisma/migrations/ 2>&1"
```

**Wenn Dateien vorhanden:**
- ✅ Image ist korrekt gebaut
- ❌ Container wurde mit altem Image gestartet
- ✅ Lösung: Container neu starten mit neuem Image

**Wenn Dateien fehlen:**
- ❌ Image wurde ohne Migration-Dateien gebaut
- ✅ Lösung: Image neu bauen (CI-Pipeline erneut ausführen)

### Schritt 2: Prüfe Dockerfile-Änderungen

Das Dockerfile sollte folgende Zeilen enthalten:

```dockerfile
# Stage 1: Build
COPY packages/database/prisma ./packages/database/prisma

# Stage 2: Production
COPY --from=api-builder --chown=nodejs:nodejs /app/packages/database/prisma ./packages/database/prisma
```

**Prüfung:**
```bash
# Lokal prüfen
cat packages/api/Dockerfile | grep -A 2 "Copy Prisma"
```

### Schritt 3: Prüfe Build-Kontext

Der CI-Workflow verwendet:
```yaml
context: .
file: packages/api/Dockerfile
```

**Das bedeutet:**
- Build-Kontext ist Root-Verzeichnis (`.`)
- Migration-Dateien sollten unter `packages/database/prisma/migrations/` verfügbar sein

**Prüfung lokal:**
```bash
# Prüfe ob Migration-Dateien im Build-Kontext sind
ls -la packages/database/prisma/migrations/
```

## Lösung: Container neu bauen

### Option 1: CI-Pipeline erneut ausführen (Empfohlen)

1. Gehe zu: https://github.com/dengelma9898/ShareLocal/actions
2. Öffne den letzten Workflow-Run
3. Klicke auf "Re-run jobs" → "Re-run all jobs"

**Oder:** Push einen leeren Commit um CI zu triggern:
```bash
git commit --allow-empty -m "Trigger CI rebuild"
git push origin main
```

### Option 2: Container manuell neu starten

```bash
# SSH zum Server
ssh root@87.106.208.51

# Container stoppen und entfernen
docker stop sharelocal-api-dev
docker rm sharelocal-api-dev

# Neues Image pullen (wird automatisch gebaut wenn CI läuft)
docker pull dengelma/sharelocal-api-dev:latest

# Container neu starten
docker run -d \
  --name sharelocal-api-dev \
  -p 3001:3001 \
  --restart unless-stopped \
  --network sharelocal-network \
  -e NODE_ENV=development \
  -e PORT=3001 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e ENCRYPTION_KEY="$ENCRYPTION_KEY" \
  -e LOG_LEVEL=debug \
  dengelma/sharelocal-api-dev:latest
```

## Verifizierung nach Neu-Build

Nach dem Neu-Build prüfe erneut:

```bash
# Prüfe Migration-Dateien
docker exec --user root sharelocal-api-dev ls -la packages/database/prisma/migrations/

# Erwartete Ausgabe:
# drwxr-xr-x    4 root     root           128 Dec  1 21:00 .
# drwxr-xr-x    3 root     root            96 Dec  1 21:00 ..
# drwxr-xr-x    3 root     root            96 Dec  1 21:00 20251125212522_init
# -rw-r--r--    1 root     root           126 Dec  1 21:00 migration_lock.toml
```

## Warum fehlen die Dateien?

**Mögliche Ursachen:**

1. **Image wurde vor Dockerfile-Änderung gebaut**
   - Dockerfile wurde aktualisiert, aber Image wurde nicht neu gebaut
   - Lösung: CI-Pipeline erneut ausführen

2. **Build-Kontext schließt Migration-Dateien aus**
   - `.dockerignore` könnte Migration-Dateien ausschließen
   - Prüfung: `cat .dockerignore` (sollte keine Migration-Dateien ausschließen)

3. **COPY-Befehl im Dockerfile ist falsch**
   - Pfad könnte falsch sein
   - Prüfung: `cat packages/api/Dockerfile | grep -A 2 "Copy Prisma"`

## Nächste Schritte

1. ✅ Prüfe ob Migration-Dateien im Image vorhanden sind
2. ✅ Prüfe Dockerfile-Änderungen
3. ⏳ CI-Pipeline erneut ausführen (Image neu bauen)
4. ⏳ Container neu starten
5. ⏳ Migration-Dateien erneut prüfen

