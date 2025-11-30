# PrismaClientInitializationError Diagnose

## Schnell-Diagnose

Führe diese Befehle auf dem Server aus, um die Ursache des `PrismaClientInitializationError` zu identifizieren:

```bash
#!/bin/bash
set -e

CONTAINER_NAME="sharelocal-api-dev"

echo "=== 1. Container Status ==="
docker ps | grep $CONTAINER_NAME || echo "❌ Container läuft nicht"

echo ""
echo "=== 2. Image-Version prüfen ==="
docker inspect $CONTAINER_NAME | grep -A 3 '"Image"'

echo ""
echo "=== 3. Prisma Client Verzeichnis ==="
docker exec $CONTAINER_NAME sh -c "
  if [ -d 'node_modules/.prisma/client' ]; then
    echo '✅ Prisma Client Verzeichnis existiert'
    ls -la node_modules/.prisma/client/ | head -10
  else
    echo '❌ Prisma Client Verzeichnis fehlt!'
  fi
"

echo ""
echo "=== 4. Prisma Engine Binary ==="
docker exec $CONTAINER_NAME sh -c "
  ENGINE=\$(ls node_modules/.prisma/client/query-engine-linux-musl* 2>/dev/null | head -1)
  if [ -n \"\$ENGINE\" ]; then
    echo \"✅ Engine gefunden: \$ENGINE\"
    ls -la \$ENGINE
    echo ''
    if [ -x \"\$ENGINE\" ]; then
      echo '✅ Engine ist ausführbar'
    else
      echo '❌ Engine ist NICHT ausführbar!'
      echo 'Versuche chmod +x...'
      chmod +x \$ENGINE 2>/dev/null || echo '❌ chmod fehlgeschlagen (kein root?)'
    fi
  else
    echo '❌ Prisma Engine Binary fehlt!'
    echo 'Verfügbare Dateien in .prisma/client:'
    ls -la node_modules/.prisma/client/ 2>/dev/null || echo 'Verzeichnis existiert nicht'
  fi
"

echo ""
echo "=== 5. Native Dependencies (Alpine) ==="
docker exec $CONTAINER_NAME sh -c "
  if apk info libc6-compat >/dev/null 2>&1; then
    echo '✅ libc6-compat installiert'
  else
    echo '❌ libc6-compat fehlt!'
  fi
  
  if apk info openssl >/dev/null 2>&1; then
    echo '✅ openssl installiert'
  else
    echo '❌ openssl fehlt!'
  fi
"

echo ""
echo "=== 6. DATABASE_URL Format ==="
docker exec $CONTAINER_NAME printenv DATABASE_URL | sed 's/:[^:@]*@/:***@/'

echo ""
echo "=== 7. PostgreSQL Verbindung testen ==="
docker exec $CONTAINER_NAME sh -c "
  if command -v nc >/dev/null 2>&1; then
    DB_HOST=\$(echo \$DATABASE_URL | sed -n 's/.*@\\([^:]*\\):.*/\\1/p')
    DB_PORT=\$(echo \$DATABASE_URL | sed -n 's/.*:\\([0-9]*\\)\\/.*/\\1/p')
    echo \"Teste Verbindung zu \$DB_HOST:\$DB_PORT...\"
    if nc -z \$DB_HOST \$DB_PORT 2>/dev/null; then
      echo '✅ PostgreSQL erreichbar'
    else
      echo '❌ PostgreSQL NICHT erreichbar!'
    fi
  else
    echo '⚠️  nc (netcat) nicht verfügbar, überspringe Verbindungstest'
  fi
"

echo ""
echo "=== 8. Container Logs (letzte 20 Zeilen) ==="
docker logs $CONTAINER_NAME --tail 20

echo ""
echo "=== 9. Prisma Schema Location ==="
docker exec $CONTAINER_NAME sh -c "
  if [ -f 'packages/database/prisma/schema.prisma' ]; then
    echo '✅ Schema gefunden'
  else
    echo '⚠️  Schema nicht im Container (normal für Production)'
  fi
"

echo ""
echo "=== 10. Node.js Version ==="
docker exec $CONTAINER_NAME node --version

echo ""
echo "=== 11. Prisma Client Version ==="
docker exec $CONTAINER_NAME sh -c "
  if [ -f 'node_modules/.prisma/client/package.json' ]; then
    grep '\"version\"' node_modules/.prisma/client/package.json || echo 'Version nicht gefunden'
  else
    echo '❌ Prisma Client package.json fehlt'
  fi
"
```

## Mögliche Ursachen und Lösungen

### Ursache 1: Prisma Engine Binary fehlt

**Symptom:** `❌ Prisma Engine Binary fehlt!`

**Lösung:** Image neu bauen. Das Image wurde möglicherweise vor den Dockerfile-Änderungen erstellt.

```bash
# Auf dem Server: Image neu pullen
docker pull dengelma/sharelocal-api-dev:latest

# Container neu starten
docker stop sharelocal-api-dev
docker rm sharelocal-api-dev
# Container wird automatisch neu gestartet durch CI/CD
```

### Ursache 2: Prisma Engine nicht ausführbar

**Symptom:** `❌ Engine ist NICHT ausführbar!`

**Lösung:** Das `chmod +x` im Dockerfile wird als `nodejs` User ausgeführt, hat aber möglicherweise nicht die Berechtigung. Wir müssen das `chmod` vor dem `USER nodejs` ausführen.

**Fix:** Dockerfile anpassen (siehe unten)

### Ursache 3: Native Dependencies fehlen

**Symptom:** `❌ libc6-compat fehlt!` oder `❌ openssl fehlt!`

**Lösung:** Image neu bauen. Die `apk add` Befehle wurden möglicherweise nicht ausgeführt.

### Ursache 4: Falsche Prisma Binary Target

**Symptom:** Engine existiert, aber mit falschem Namen (z.B. `query-engine-linux-x64` statt `query-engine-linux-musl`)

**Lösung:** Prisma Schema prüfen und Binary Target für Alpine Linux setzen.

### Ursache 5: PostgreSQL nicht erreichbar

**Symptom:** `❌ PostgreSQL NICHT erreichbar!`

**Lösung:** 
- Prüfe ob PostgreSQL Container läuft: `docker ps | grep postgres`
- Prüfe Netzwerk: `docker network inspect sharelocal-network`
- Prüfe Hostname in DATABASE_URL (sollte `postgres` sein, nicht `localhost`)

## Dockerfile Fix (falls Engine nicht ausführbar)

Wenn die Engine nicht ausführbar ist, müssen wir das `chmod` vor dem `USER nodejs` ausführen:

```dockerfile
# Copy all node_modules (includes dotenv and all dependencies)
COPY --from=api-builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Ensure Prisma Engine is executable (BEFORE switching to nodejs user)
RUN chmod +x node_modules/.prisma/client/query-engine-linux-musl* 2>/dev/null || true

# Set user (AFTER chmod)
USER nodejs
```

## Nächste Schritte

1. Führe das Diagnoseskript aus
2. Teile die Ausgabe
3. Basierend auf den Ergebnissen können wir den spezifischen Fix anwenden

