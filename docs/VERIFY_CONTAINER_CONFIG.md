# Container-Konfiguration Verifizieren

## Schnell-Verifizierung

Führe diese Befehle auf dem Server aus, um die Container-Konfiguration zu prüfen:

```bash
ssh root@87.106.208.51

# 1. Prüfe Container-Status
docker ps | grep sharelocal-api-dev

# 2. Prüfe Image-Version (wichtig: neuestes Image?)
docker inspect sharelocal-api-dev | grep Image

# 3. Prüfe Environment-Variablen
docker exec sharelocal-api-dev printenv | grep -E "DATABASE_URL|JWT_SECRET|ENCRYPTION_KEY|PORT|NODE_ENV"

# 4. Prüfe ob Prisma Engine vorhanden ist
docker exec sharelocal-api-dev ls -la node_modules/.prisma/client/ 2>/dev/null || echo "Prisma Client nicht gefunden!"

# 5. Prüfe Prisma Engine Binary
docker exec sharelocal-api-dev ls -la node_modules/.prisma/client/query-engine-linux-musl* 2>/dev/null || echo "Prisma Engine Binary nicht gefunden!"

# 6. Prüfe ob native Dependencies installiert sind
docker exec sharelocal-api-dev sh -c "apk info | grep -E 'libc6-compat|openssl'"

# 7. Teste Datenbank-Verbindung direkt
docker exec sharelocal-api-dev node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`
  .then(() => {
    console.log('✅ Database connection OK');
    prisma.\$disconnect();
  })
  .catch(e => {
    console.error('❌ Database connection FAILED:', e.message);
    prisma.\$disconnect();
    process.exit(1);
  });
"

# 8. Prüfe PostgreSQL Container
docker ps | grep postgres

# 9. Prüfe Netzwerk-Verbindung
docker network inspect sharelocal-network | grep -A 10 "Containers"

# 10. Teste Health Endpoint direkt
curl http://localhost:3001/health
```

## Detaillierte Verifizierung

### Schritt 1: Image-Version prüfen

```bash
# Prüfe wann das Image erstellt wurde
docker images dengelma/sharelocal-api-dev --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}"

# Prüfe ob neuestes Image verwendet wird
docker inspect sharelocal-api-dev | grep -A 5 "Image"
```

**Erwartet:** Image sollte weniger als 10 Minuten alt sein (nach CI-Build)

### Schritt 2: Prisma Client Verifizierung

```bash
# Prüfe ob Prisma Client generiert wurde
docker exec sharelocal-api-dev sh -c "
  echo '=== Prisma Client Verzeichnis ==='
  ls -la node_modules/.prisma/client/ 2>/dev/null || echo '❌ Prisma Client nicht gefunden'
  
  echo ''
  echo '=== Prisma Engine Binary ==='
  ls -la node_modules/.prisma/client/query-engine-linux-musl* 2>/dev/null || echo '❌ Prisma Engine nicht gefunden'
  
  echo ''
  echo '=== Prisma Engine Executable? ==='
  test -x node_modules/.prisma/client/query-engine-linux-musl* && echo '✅ Executable' || echo '❌ Not executable'
"
```

**Erwartet:**
- ✅ `node_modules/.prisma/client/` Verzeichnis existiert
- ✅ `query-engine-linux-musl*` Binary existiert
- ✅ Binary ist ausführbar

### Schritt 3: Native Dependencies prüfen

```bash
# Prüfe ob libc6-compat installiert ist
docker exec sharelocal-api-dev sh -c "apk info libc6-compat 2>/dev/null && echo '✅ libc6-compat installed' || echo '❌ libc6-compat missing'"

# Prüfe ob openssl installiert ist
docker exec sharelocal-api-dev sh -c "apk info openssl 2>/dev/null && echo '✅ openssl installed' || echo '❌ openssl missing'"
```

**Erwartet:** Beide Pakete sollten installiert sein

### Schritt 4: Environment-Variablen prüfen

```bash
# Zeige alle wichtigen Environment-Variablen
docker exec sharelocal-api-dev printenv | grep -E "DATABASE_URL|JWT_SECRET|ENCRYPTION_KEY|PORT|NODE_ENV" | sed 's/=.*/=***/'

# Prüfe DATABASE_URL auf Leerzeichen (häufiger Fehler!)
docker exec sharelocal-api-dev printenv DATABASE_URL | grep -o ":[[:space:]]" && echo "❌ Leerzeichen in DATABASE_URL gefunden!" || echo "✅ Kein Leerzeichen"
```

**Erwartet:**
- ✅ `DATABASE_URL` ist gesetzt (Format: `postgresql://user:pass@host:5432/db`)
- ✅ **KEIN Leerzeichen** nach dem Doppelpunkt (`:`)
- ✅ `JWT_SECRET` ist gesetzt
- ✅ `ENCRYPTION_KEY` ist gesetzt
- ✅ `PORT=3001`
- ✅ `NODE_ENV=development`

**⚠️ Häufiger Fehler:** Leerzeichen in DATABASE_URL
- ❌ Falsch: `postgresql://user: password@host:5432/db`
- ✅ Richtig: `postgresql://user:password@host:5432/db`

### Schritt 5: Datenbank-Verbindung testen

```bash
# Teste Prisma Client Initialisierung
docker exec sharelocal-api-dev node -e "
const { PrismaClient } = require('@prisma/client');
console.log('Initializing Prisma Client...');
const prisma = new PrismaClient();
console.log('Prisma Client created successfully');
prisma.\$queryRaw\`SELECT 1 as test\`
  .then(result => {
    console.log('✅ Database query successful:', result);
    return prisma.\$disconnect();
  })
  .then(() => {
    console.log('✅ Database connection closed');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e.message);
    console.error('Error code:', e.code);
    prisma.\$disconnect().finally(() => process.exit(1));
  });
"
```

**Erwartet:** 
- ✅ Prisma Client wird erstellt
- ✅ Datenbank-Query funktioniert
- ✅ Keine Fehler

### Schritt 6: PostgreSQL Container prüfen

```bash
# Prüfe PostgreSQL Container
docker ps | grep postgres

# Prüfe PostgreSQL Logs
docker logs sharelocal-postgres-dev --tail 20 2>/dev/null || docker logs sharelocal-postgres --tail 20

# Teste PostgreSQL direkt
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "SELECT version();" 2>/dev/null || \
docker exec sharelocal-postgres psql -U sharelocal -d sharelocal_dev -c "SELECT version();"
```

**Erwartet:**
- ✅ PostgreSQL Container läuft
- ✅ Container-Name stimmt mit DATABASE_URL überein
- ✅ Datenbank-Verbindung funktioniert

### Schritt 7: Netzwerk-Verbindung prüfen

```bash
# Prüfe ob beide Container im gleichen Netzwerk sind
docker network inspect sharelocal-network --format '{{range .Containers}}{{.Name}} {{end}}'

# Teste Netzwerk-Verbindung vom API Container zu PostgreSQL
docker exec sharelocal-api-dev sh -c "
  DB_HOST=\$(echo \$DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/')
  echo 'Testing connection to:' \$DB_HOST
  nc -zv \$DB_HOST 5432 2>&1 || echo '❌ Cannot reach database host'
"
```

**Erwartet:**
- ✅ Beide Container sind im `sharelocal-network`
- ✅ API Container kann PostgreSQL Container erreichen

## Vollständiger Verifizierungs-Befehl

```bash
ssh root@87.106.208.51 << 'EOF'
echo "=========================================="
echo "Container-Konfiguration Verifizierung"
echo "=========================================="
echo ""

echo "1. Container Status:"
docker ps | grep sharelocal-api-dev || echo "❌ Container läuft nicht"
echo ""

echo "2. Image-Version:"
docker inspect sharelocal-api-dev --format '{{.Config.Image}}' 2>/dev/null || echo "❌ Container nicht gefunden"
echo ""

echo "3. Environment-Variablen:"
docker exec sharelocal-api-dev printenv | grep -E "DATABASE_URL|JWT_SECRET|ENCRYPTION_KEY|PORT|NODE_ENV" | sed 's/=.*/=***/' || echo "❌ Container nicht erreichbar"
echo ""

echo "4. Prisma Client:"
docker exec sharelocal-api-dev ls -la node_modules/.prisma/client/ 2>/dev/null | head -5 || echo "❌ Prisma Client nicht gefunden"
echo ""

echo "5. Prisma Engine Binary:"
docker exec sharelocal-api-dev ls -la node_modules/.prisma/client/query-engine-linux-musl* 2>/dev/null || echo "❌ Prisma Engine nicht gefunden"
echo ""

echo "6. Native Dependencies:"
docker exec sharelocal-api-dev sh -c "apk info | grep -E 'libc6-compat|openssl'" || echo "❌ Native Dependencies fehlen"
echo ""

echo "7. PostgreSQL Container:"
docker ps | grep postgres || echo "❌ PostgreSQL Container läuft nicht"
echo ""

echo "8. Netzwerk:"
docker network inspect sharelocal-network --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || echo "❌ Netzwerk nicht gefunden"
echo ""

echo "9. Health Check (lokal):"
curl -s http://localhost:3001/health | head -10 || echo "❌ Health Check fehlgeschlagen"
echo ""

echo "10. Datenbank-Verbindung:"
docker exec sharelocal-api-dev node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`
  .then(() => { console.log('✅ Database OK'); prisma.\$disconnect(); })
  .catch(e => { console.error('❌ Database Error:', e.message); prisma.\$disconnect(); process.exit(1); });
" 2>&1 || echo "❌ Datenbank-Test fehlgeschlagen"
EOF
```

## Häufige Probleme und Lösungen

### Problem: Prisma Engine nicht gefunden

**Symptom:** `ls: node_modules/.prisma/client/query-engine-linux-musl*: No such file or directory`

**Lösung:**
- Neues Image bauen (CI sollte automatisch laufen)
- Prisma Client wurde nicht generiert → Prüfe Build-Logs

### Problem: Prisma Engine nicht ausführbar

**Symptom:** Engine existiert, aber `PrismaClientInitializationError`

**Lösung:**
- `chmod +x node_modules/.prisma/client/query-engine-linux-musl*` (sollte automatisch im Dockerfile passieren)
- Prüfe ob native Dependencies installiert sind

### Problem: Native Dependencies fehlen

**Symptom:** `apk info` zeigt keine libc6-compat oder openssl

**Lösung:**
- Neues Image bauen (native Dependencies wurden im Dockerfile hinzugefügt)
- Prüfe Dockerfile: `RUN apk add --no-cache libc6-compat openssl`

### Problem: Datenbank-Verbindung fehlgeschlagen

**Symptom:** `Database health check failed` oder `Can't reach database server`

**Lösung:**
- Prüfe PostgreSQL Container läuft
- Prüfe DATABASE_URL enthält korrekten Container-Namen
- Prüfe beide Container sind im `sharelocal-network`

### Problem: Falsches Image verwendet

**Symptom:** Alte Image-Version, native Dependencies fehlen

**Lösung:**
```bash
# Pull neuestes Image
docker pull dengelma/sharelocal-api-dev:latest

# Container neu starten
docker restart sharelocal-api-dev
```

