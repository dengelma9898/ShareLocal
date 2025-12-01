# Diagnose: 500 Internal Server Error bei Registrierung

## Problem

Bei der Registrierung über `https://nuernbergspots.de/share-local/dev/register` tritt ein 500 Internal Server Error auf.

## Schnelle Diagnose

### 1. Container-Logs prüfen

```bash
# API Container Logs (letzte 50 Zeilen)
docker logs sharelocal-api-dev --tail 50

# Oder mit Follow (live)
docker logs sharelocal-api-dev -f
```

### 2. Container-Status prüfen

```bash
# Alle ShareLocal Container anzeigen
docker ps -a | grep sharelocal

# Container-Status im Detail
docker ps --filter "name=sharelocal-api-dev" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 3. Environment-Variablen prüfen

```bash
# Environment-Variablen im Container prüfen
docker exec sharelocal-api-dev printenv | grep -E "(DATABASE_URL|JWT_SECRET|NODE_ENV)"
```

## Häufige Ursachen

### 1. Datenbankverbindungsproblem

**Symptom:** Fehler wie `PrismaClientInitializationError` oder `Can't reach database server`

**Prüfung:**
```bash
# Datenbank-Container Status
docker ps | grep postgres

# Datenbank-Verbindung testen
docker exec sharelocal-api-dev node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ DB connected'); process.exit(0); }).catch((e) => { console.error('❌ DB error:', e.message); process.exit(1); });"
```

**Lösung:**
- Prüfe `DATABASE_URL` in GitHub Secrets (Dev Environment)
- Stelle sicher, dass der PostgreSQL-Container läuft
- Prüfe Netzwerk-Verbindung zwischen Containern (`sharelocal-network`)

### 2. Fehlende Environment-Variablen

**Symptom:** Fehler wie `JWT_SECRET must be set in production` oder `Missing required environment variable`

**Prüfung:**
```bash
# Alle Environment-Variablen prüfen
docker exec sharelocal-api-dev printenv | sort
```

**Erforderliche Variablen:**
- `DATABASE_URL` - PostgreSQL Connection String
- `JWT_SECRET` - Secret für JWT Token Generation
- `ENCRYPTION_KEY` - Key für Verschlüsselung (optional für MVP)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Port für API (3001 für Dev)

**Lösung:**
- Prüfe GitHub Secrets (Dev Environment)
- Stelle sicher, dass Secrets beim Container-Start übergeben werden

### 3. Prisma Client nicht generiert

**Symptom:** Fehler wie `Cannot find module '@prisma/client'` oder `Prisma Client has not been generated yet`

**Prüfung:**
```bash
# Prüfe ob Prisma Client generiert wurde
docker exec sharelocal-api-dev ls -la node_modules/@prisma/client 2>/dev/null || echo "❌ Prisma Client nicht gefunden"

# Prüfe Prisma Schema
docker exec sharelocal-api-dev cat packages/database/prisma/schema.prisma | head -20
```

**Lösung:**
- Container neu bauen mit `pnpm --filter @sharelocal/database db:generate`
- Oder CI/CD Workflow prüfen (sollte automatisch generieren)

### 4. Datenbank-Migrationen fehlen

**Symptom:** Fehler wie `Table 'users' does not exist` oder `relation "users" does not exist`

**Prüfung:**
```bash
# Prüfe Migrationen
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "\dt" 2>/dev/null || echo "❌ Keine Tabellen gefunden"
```

**Lösung:**
- Migrationen ausführen: `docker exec sharelocal-api-dev pnpm --filter @sharelocal/database db:migrate`
- Oder Datenbank neu initialisieren

### 5. Rate Limiting

**Symptom:** Zu viele Requests in kurzer Zeit

**Prüfung:**
```bash
# Prüfe Rate Limiter Logs
docker logs sharelocal-api-dev | grep -i "rate limit"
```

**Lösung:**
- Warte einige Sekunden und versuche es erneut
- Oder Rate Limiter konfigurieren (siehe `packages/api/src/adapters/http/middleware/rateLimiter.ts`)

## Detaillierte Fehleranalyse

### Logs mit Stack-Trace

```bash
# Vollständige Logs mit Timestamps
docker logs sharelocal-api-dev --timestamps --tail 100

# Nur Errors
docker logs sharelocal-api-dev 2>&1 | grep -i error

# Suche nach spezifischem Fehler
docker logs sharelocal-api-dev 2>&1 | grep -A 10 "register"
```

### Health Check Endpoint

```bash
# Health Check prüfen
curl https://nuernbergspots.de/share-local/dev/api/health

# Oder direkt auf Container
curl http://localhost:3001/health
```

**Erwartete Antwort:**
```json
{
  "status": "ok",
  "database": "ok",
  "encryption": "ok",
  "timestamp": "2024-..."
}
```

## Schritt-für-Schritt Diagnose

### Schritt 1: Container läuft?

```bash
docker ps | grep sharelocal-api-dev
```

**Wenn nicht:**
- Container starten: `docker start sharelocal-api-dev`
- Oder neu deployen über GitHub Actions

### Schritt 2: Logs prüfen

```bash
docker logs sharelocal-api-dev --tail 50
```

**Suche nach:**
- `error` oder `Error`
- `PrismaClientInitializationError`
- `JWT_SECRET`
- `DATABASE_URL`
- Stack Traces

### Schritt 3: Environment-Variablen prüfen

```bash
docker exec sharelocal-api-dev printenv | grep -E "(DATABASE_URL|JWT_SECRET)"
```

**Prüfe:**
- `DATABASE_URL` ist gesetzt und korrekt formatiert
- `JWT_SECRET` ist gesetzt (nicht `change-me-in-production`)
- Keine Leerzeichen in `DATABASE_URL` nach dem Doppelpunkt

### Schritt 4: Datenbank-Verbindung testen

```bash
# Health Check Endpoint
curl http://localhost:3001/health
```

**Wenn Health Check fehlschlägt:**
- Datenbank-Container prüfen: `docker ps | grep postgres`
- Netzwerk prüfen: `docker network inspect sharelocal-network`
- `DATABASE_URL` prüfen (Container-Name muss stimmen)

### Schritt 5: API direkt testen

```bash
# Registrierung direkt testen
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "test123456"
  }'
```

**Wenn das funktioniert:**
- Problem liegt bei NGINX oder Frontend
- Prüfe NGINX-Logs: `docker logs <nginx-container>` oder Server-Logs

**Wenn das nicht funktioniert:**
- Problem liegt bei der API
- Prüfe Logs (Schritt 2)
- Prüfe Environment-Variablen (Schritt 3)

## Häufige Fehlermeldungen und Lösungen

### "PrismaClientInitializationError: Can't reach database server"

**Ursache:** Datenbank-Container läuft nicht oder falsche `DATABASE_URL`

**Lösung:**
1. Prüfe PostgreSQL-Container: `docker ps | grep postgres`
2. Starte Container falls nötig: `docker start sharelocal-postgres-dev`
3. Prüfe `DATABASE_URL`: Muss Container-Namen enthalten (z.B. `sharelocal-postgres-dev`)
4. Prüfe Netzwerk: `docker network inspect sharelocal-network`

### "JWT_SECRET must be set in production"

**Ursache:** `JWT_SECRET` ist nicht gesetzt oder ist `change-me-in-production`

**Lösung:**
1. Prüfe GitHub Secrets (Dev Environment)
2. Stelle sicher, dass Secret beim Container-Start übergeben wird
3. Container neu starten mit korrekten Environment-Variablen

### "Table 'users' does not exist"

**Ursache:** Datenbank-Migrationen wurden nicht ausgeführt

**Lösung:**
```bash
# Migrationen ausführen
docker exec sharelocal-api-dev pnpm --filter @sharelocal/database db:migrate
```

### "Cannot find module '@prisma/client'"

**Ursache:** Prisma Client wurde nicht generiert

**Lösung:**
```bash
# Prisma Client generieren
docker exec sharelocal-api-dev pnpm --filter @sharelocal/database db:generate
```

Oder Container neu bauen.

## Nächste Schritte

1. ✅ Container-Logs prüfen
2. ✅ Environment-Variablen prüfen
3. ✅ Health Check testen
4. ✅ API direkt testen
5. ⏳ Fehler beheben basierend auf Logs
6. ⏳ Container neu starten falls nötig

## Debugging-Tipps

### Live-Logs beobachten

```bash
# Terminal 1: API Logs
docker logs sharelocal-api-dev -f

# Terminal 2: Registrierung testen
curl -X POST https://nuernbergspots.de/share-local/dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test","password":"test123456"}'
```

### Verbesserte Fehler-Logs aktivieren

Setze `LOG_LEVEL=debug` im Container:

```bash
docker exec sharelocal-api-dev printenv LOG_LEVEL
# Falls nicht gesetzt, Container mit LOG_LEVEL=debug neu starten
```

### Prisma Studio (optional)

```bash
# Prisma Studio starten (für Datenbank-Inspektion)
docker exec -it sharelocal-api-dev pnpm --filter @sharelocal/database db:studio
```

## Support

Wenn das Problem weiterhin besteht:

1. Vollständige Logs sammeln: `docker logs sharelocal-api-dev > api-logs.txt`
2. Environment-Variablen sammeln: `docker exec sharelocal-api-dev printenv > env-vars.txt`
3. Health Check Ergebnis: `curl http://localhost:3001/health > health-check.json`
4. Diese Dateien für weitere Analyse bereitstellen

