# Fix: Container im Status "Restarting (1)"

## Problem

Die Container `sharelocal-api-dev` und `sharelocal-api` (prd) sind im Status **"Restarting (1)"**, was bedeutet, dass sie kontinuierlich abstürzen und neu starten.

## Ursache

Häufige Ursachen:
1. ❌ Fehlende oder falsche Environment-Variablen
2. ❌ Datenbank-Verbindung schlägt fehl
3. ❌ Port bereits belegt
4. ❌ Fehler beim Start der Anwendung

---

## Lösung: Logs prüfen

### Schritt 1: Container-Logs ansehen

```bash
# Dev Container Logs
docker logs sharelocal-api-dev --tail 50

# Prd Container Logs
docker logs sharelocal-api --tail 50

# Logs mit Timestamps
docker logs -t sharelocal-api-dev --tail 50
```

**Was zu suchen ist:**
- `Error: Missing required environment variable`
- `Error: P1001: Can't reach database server`
- `Error: listen EADDRINUSE: address already in use`
- `Error: Cannot find module`
- `Error: Invalid DATABASE_URL`

---

## Häufige Probleme und Lösungen

### Problem 1: Fehlende Environment-Variablen

**Symptom in Logs:**
```
Error: Missing required environment variable: DATABASE_URL
Error: Missing required environment variable: JWT_SECRET
Error: Missing required environment variable: ENCRYPTION_KEY
```

**Lösung:**

**Option A: Container mit korrekten Env-Vars neu starten**

Stoppe die Container und starte sie mit den korrekten Environment-Variablen:

```bash
# Stoppe Container
docker stop sharelocal-api-dev sharelocal-api
docker rm sharelocal-api-dev sharelocal-api

# Dev Container neu starten (mit korrekten Env-Vars)
docker run -d \
  --name sharelocal-api-dev \
  -p 3001:3001 \
  --restart unless-stopped \
  --network sharelocal-network \
  -e NODE_ENV=development \
  -e PORT=3001 \
  -e DATABASE_URL="postgresql://user:password@sharelocal-postgres-dev:5432/sharelocal_dev" \
  -e JWT_SECRET="dein-jwt-secret" \
  -e ENCRYPTION_KEY="dein-encryption-key" \
  -e LOG_LEVEL=debug \
  dengelma/sharelocal-api-dev:latest

# Prd Container neu starten (mit korrekten Env-Vars)
docker run -d \
  --name sharelocal-api \
  -p 3101:3101 \
  --restart unless-stopped \
  --network sharelocal-network \
  -e NODE_ENV=production \
  -e PORT=3101 \
  -e DATABASE_URL="postgresql://user:password@sharelocal-postgres-prd:5432/sharelocal_prd" \
  -e JWT_SECRET="dein-jwt-secret" \
  -e ENCRYPTION_KEY="dein-encryption-key" \
  -e LOG_LEVEL=info \
  dengelma/sharelocal-api-prd:latest
```

**Wichtig:** Ersetze die Platzhalter mit echten Werten aus deinen GitHub Secrets!

**Option B: GitHub Actions Deployment nutzen**

Die GitHub Actions sollten die Container automatisch mit den korrekten Env-Vars starten. Prüfe ob das Deployment erfolgreich war.

---

### Problem 2: Datenbank-Verbindung schlägt fehl

**Symptom in Logs:**
```
Error: P1001: Can't reach database server at `sharelocal-postgres-dev:5432`
Error: P1000: Authentication failed
```

**Lösung:**

```bash
# Prüfe ob PostgreSQL Container läuft
docker ps | grep postgres

# Prüfe ob Container im gleichen Netzwerk sind
docker network inspect sharelocal-network

# Teste Datenbank-Verbindung
docker exec sharelocal-postgres-dev psql -U postgres -c "SELECT 1;"

# Prüfe DATABASE_URL Format
# Sollte sein: postgresql://user:password@container-name:5432/database
```

**Falls Netzwerk-Problem:**
```bash
# Erstelle Netzwerk falls nicht vorhanden
docker network create sharelocal-network

# Verbinde Container zum Netzwerk
docker network connect sharelocal-network sharelocal-api-dev
docker network connect sharelocal-network sharelocal-postgres-dev
```

---

### Problem 3: Port bereits belegt

**Symptom in Logs:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Lösung:**

```bash
# Finde welcher Prozess Port 3001 verwendet
lsof -i :3001
# Oder
netstat -tulpn | grep 3001

# Stoppe den anderen Container/Prozess
docker stop <container-name>
# Oder
kill <pid>

# Starte Container neu
docker start sharelocal-api-dev
```

---

### Problem 4: Container-Image fehlt oder ist fehlerhaft

**Symptom in Logs:**
```
Error: Cannot find module
Error: ENOENT: no such file or directory
```

**Lösung:**

```bash
# Prüfe ob Image existiert
docker images | grep sharelocal-api

# Falls nicht, pull Image
docker pull dengelma/sharelocal-api-dev:latest
docker pull dengelma/sharelocal-api-prd:latest

# Prüfe Image-Details
docker inspect dengelma/sharelocal-api-dev:latest
```

---

## Schnell-Fix: Container komplett neu erstellen

**Falls nichts hilft, Container komplett neu erstellen:**

```bash
# 1. Stoppe und entferne Container
docker stop sharelocal-api-dev sharelocal-api
docker rm sharelocal-api-dev sharelocal-api

# 2. Pull neueste Images
docker pull dengelma/sharelocal-api-dev:latest
docker pull dengelma/sharelocal-api-prd:latest

# 3. Prüfe GitHub Secrets (falls du sie lokal hast)
# DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY

# 4. Starte Container mit korrekten Env-Vars (siehe oben)
```

---

## Debug-Befehl: Alles auf einmal prüfen

```bash
ssh root@87.106.208.51 << 'EOF'
echo "=== Container Status ==="
docker ps -a | grep sharelocal-api

echo ""
echo "=== Dev Container Logs (letzte 30 Zeilen) ==="
docker logs sharelocal-api-dev --tail 30 2>&1

echo ""
echo "=== Prd Container Logs (letzte 30 Zeilen) ==="
docker logs sharelocal-api --tail 30 2>&1

echo ""
echo "=== PostgreSQL Container Status ==="
docker ps | grep postgres

echo ""
echo "=== Netzwerk-Check ==="
docker network inspect sharelocal-network 2>/dev/null | grep -A 5 "Containers" || echo "Netzwerk nicht gefunden"

echo ""
echo "=== Port-Check ==="
netstat -tuln | grep -E "3001|3101"
EOF
```

---

## Nächste Schritte

1. **Führe den Debug-Befehl aus** um die genaue Fehlermeldung zu sehen
2. **Prüfe die Logs** für spezifische Fehler
3. **Behebe das Problem** basierend auf der Fehlermeldung
4. **Starte Container neu** mit korrekten Environment-Variablen

---

## Wichtig: Environment-Variablen aus GitHub Secrets

Die Container müssen mit den korrekten Environment-Variablen gestartet werden:

**Dev:**
- `DATABASE_URL` (aus GitHub Secret `DATABASE_URL` für `dev` environment)
- `JWT_SECRET` (aus GitHub Secret `JWT_SECRET` für `dev` environment)
- `ENCRYPTION_KEY` (aus GitHub Secret `ENCRYPTION_KEY` für `dev` environment)

**Prd:**
- `DATABASE_URL` (aus GitHub Secret `DATABASE_URL` für `prd` environment)
- `JWT_SECRET` (aus GitHub Secret `JWT_SECRET` für `prd` environment)
- `ENCRYPTION_KEY` (aus GitHub Secret `ENCRYPTION_KEY` für `prd` environment)

**Tipp:** Die GitHub Actions sollten diese automatisch setzen. Falls nicht, prüfe ob das Deployment erfolgreich war.

