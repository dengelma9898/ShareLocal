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
  # Prisma 5.22+ verwendet .so.node Dateien statt ausführbarer Binaries
  ENGINE_SO=\$(ls node_modules/.prisma/client/libquery_engine-linux-musl*.so.node 2>/dev/null | head -1)
  ENGINE_BIN=\$(ls node_modules/.prisma/client/query-engine-linux-musl* 2>/dev/null | head -1)
  
  if [ -n \"\$ENGINE_SO\" ]; then
    echo \"✅ Prisma Engine (.so.node) gefunden: \$ENGINE_SO\"
    ls -la \$ENGINE_SO
    echo ''
    if [ -r \"\$ENGINE_SO\" ]; then
      echo '✅ Engine ist lesbar'
    else
      echo '❌ Engine ist NICHT lesbar!'
    fi
  elif [ -n \"\$ENGINE_BIN\" ]; then
    echo \"✅ Prisma Engine (Binary) gefunden: \$ENGINE_BIN\"
    ls -la \$ENGINE_BIN
    echo ''
    if [ -x \"\$ENGINE_BIN\" ]; then
      echo '✅ Engine ist ausführbar'
    else
      echo '❌ Engine ist NICHT ausführbar!'
      echo 'Versuche chmod +x...'
      chmod +x \$ENGINE_BIN 2>/dev/null || echo '❌ chmod fehlgeschlagen (kein root?)'
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
# Hole DATABASE_URL aus Container
DATABASE_URL=\$(docker exec $CONTAINER_NAME printenv DATABASE_URL)
DB_HOST=\$(echo \$DATABASE_URL | sed -n 's/.*@\\([^:]*\\):.*/\\1/p')
DB_PORT=\$(echo \$DATABASE_URL | sed -n 's/.*:\\([0-9]*\\)\\/.*/\\1/p')

echo "DATABASE_URL Host: \$DB_HOST"
echo "DATABASE_URL Port: \$DB_PORT"
echo ''

# Prüfe ob PostgreSQL Container läuft (auf dem Host)
echo '=== PostgreSQL Container Status ==='
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E 'postgres|NAMES' || echo '❌ Kein PostgreSQL Container gefunden'

echo ''
echo '=== Docker Network Prüfung ==='
NETWORK=\$(docker inspect $CONTAINER_NAME --format '{{range \$net, \$v := .NetworkSettings.Networks}}{{printf "%s" \$net}}{{end}}' 2>/dev/null | head -1)
echo "API Container Netzwerk: \$NETWORK"

if [ -n "\$NETWORK" ]; then
  echo "Container im Netzwerk \$NETWORK:"
  docker network inspect \$NETWORK --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || echo 'Netzwerk nicht gefunden'
else
  echo '⚠️  Kein Netzwerk gefunden - Container ist möglicherweise nicht im Docker-Netzwerk'
fi

echo ''
echo '=== Verbindungstest (vom Container aus) ==='
docker exec $CONTAINER_NAME sh -c "
  DB_HOST_FROM_URL=\$(echo \$DATABASE_URL | sed -n 's/.*@\\([^:]*\\):.*/\\1/p')
  DB_PORT_FROM_URL=\$(echo \$DATABASE_URL | sed -n 's/.*:\\([0-9]*\\)\\/.*/\\1/p')
  if command -v nc >/dev/null 2>&1; then
    echo \"Teste Verbindung zu \$DB_HOST_FROM_URL:\$DB_PORT_FROM_URL...\"
    if nc -z \$DB_HOST_FROM_URL \$DB_PORT_FROM_URL 2>/dev/null; then
      echo '✅ PostgreSQL erreichbar'
    else
      echo '❌ PostgreSQL NICHT erreichbar!'
      echo ''
      echo 'Mögliche Ursachen:'
      echo '  1. PostgreSQL Container läuft nicht'
      echo '  2. Container ist nicht im gleichen Netzwerk'
      echo '  3. Hostname in DATABASE_URL ist falsch (sollte Container-Name sein)'
      echo '  4. Port ist falsch'
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

### Ursache 1: Prisma Engine Binary fehlt oder falscher Typ

**Symptom:** `❌ Prisma Engine Binary fehlt!` oder Engine-Dateien sind vorhanden, aber Prisma kann sie nicht laden

**Hinweis:** Prisma 5.22+ verwendet `.so.node` Dateien statt ausführbarer Binaries. Das ist normal!

**Lösung:** 
1. Prüfe ob `.so.node` Dateien vorhanden sind (z.B. `libquery_engine-linux-musl-openssl-3.0.x.so.node`)
2. Falls Engine fehlt: Image neu bauen

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

1. **Prüfe ob PostgreSQL Container läuft:**
   ```bash
   docker ps | grep postgres
   ```

2. **Prüfe Netzwerk:**
   ```bash
   # Prüfe welches Netzwerk der API Container verwendet
   docker inspect sharelocal-api-dev --format '{{range $net, $v := .NetworkSettings.Networks}}{{printf "%s\n" $net}}{{end}}'
   
   # Prüfe welche Container im Netzwerk sind
   docker network inspect <NETWORK_NAME> --format '{{range .Containers}}{{.Name}} {{end}}'
   ```

3. **Prüfe Hostname in DATABASE_URL:**
   - Sollte der Container-Name sein (z.B. `sharelocal-postgres-dev` oder `sharelocal-postgres-prd`)
   - NICHT `localhost` oder `127.0.0.1` verwenden!
   - Der Hostname muss exakt mit dem Container-Namen übereinstimmen

4. **Falls Container nicht im gleichen Netzwerk:**
   ```bash
   # Container zum Netzwerk hinzufügen
   docker network connect sharelocal-network sharelocal-postgres-dev
   ```

5. **Falls Container nicht läuft:**
   ```bash
   # Starte PostgreSQL Container
   docker start sharelocal-postgres-dev
   # oder
   docker start sharelocal-postgres-prd
   ```

## Dockerfile Fix (Prisma 5.22+)

**Wichtig:** Prisma 5.22+ verwendet `.so.node` Dateien statt ausführbarer Binaries. Das `chmod +x` ist nicht mehr nötig, aber die Dateien müssen lesbar sein.

```dockerfile
# Copy all node_modules (includes dotenv and all dependencies)
COPY --from=api-builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Prisma 5.22+ verwendet .so.node Dateien (kein chmod nötig)
# Die Dateien werden automatisch mit korrekten Berechtigungen kopiert durch --chown

# Set user
USER nodejs
```

**Falls du noch Prisma < 5.22 verwendest:**
```dockerfile
# Ensure Prisma Engine is executable (BEFORE switching to nodejs user)
RUN chmod +x node_modules/.prisma/client/query-engine-linux-musl* 2>/dev/null || true
```

## Nächste Schritte

1. Führe das Diagnoseskript aus
2. Teile die Ausgabe
3. Basierend auf den Ergebnissen können wir den spezifischen Fix anwenden

## Schnell-Fix: PostgreSQL Container nicht erreichbar

**Wenn das Diagnoseskript zeigt:**
- ✅ Prisma Engine vorhanden und lesbar
- ❌ PostgreSQL Container nicht gefunden oder nicht im Netzwerk

**Dann führe diese Befehle auf dem Server aus:**

```bash
# 1. Prüfe ob PostgreSQL Container existiert (auch gestoppt)
docker ps -a | grep postgres

# 2. Falls Container existiert aber gestoppt ist, starte ihn
docker start sharelocal-postgres-dev
# oder
docker start sharelocal-postgres-prd

# 3. Falls Container nicht existiert, erstelle ihn
docker network create sharelocal-network || true

docker run -d \
  --name sharelocal-postgres-dev \
  --network sharelocal-network \
  --restart unless-stopped \
  -e POSTGRES_USER=sharelocal \
  -e POSTGRES_PASSWORD=<DEIN_PASSWORD> \
  -e POSTGRES_DB=sharelocal_dev \
  -v sharelocal-postgres-dev-data:/var/lib/postgresql/data \
  postgres:17-alpine

# 4. Prüfe ob API Container im gleichen Netzwerk ist
docker network inspect sharelocal-network --format '{{range .Containers}}{{.Name}} {{end}}'

# 5. Falls API Container nicht im Netzwerk ist, füge ihn hinzu
docker network connect sharelocal-network sharelocal-api-dev

# 6. Prüfe ob DATABASE_URL den richtigen Container-Namen verwendet
docker exec sharelocal-api-dev printenv DATABASE_URL
# Sollte sein: postgresql://sharelocal:***@sharelocal-postgres-dev:5432/sharelocal_dev?schema=public
# NICHT: postgresql://sharelocal:***@postgres:5432/...
```

**Wichtig:** Der Hostname in DATABASE_URL muss exakt mit dem Container-Namen übereinstimmen!

