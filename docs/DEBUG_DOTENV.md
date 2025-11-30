# Debug: dotenv im Docker Container prüfen

## Problem

Container zeigt immer noch `ERR_MODULE_NOT_FOUND: Cannot find package 'dotenv'`, obwohl wir es zu `dependencies` verschoben haben.

## Mögliche Ursachen

1. **Altes Docker Image wird verwendet** - Das neue Image wurde noch nicht gebaut/gepusht
2. **Container verwendet altes Image** - Container wurde nicht neu gestartet mit neuem Image
3. **pnpm workspace Struktur** - node_modules werden nicht korrekt kopiert

---

## Debug-Schritte

### Schritt 1: Prüfe welches Image der Container verwendet

```bash
docker inspect sharelocal-api-dev | grep Image
```

**Erwartete Ausgabe:**
```
"Image": "sha256:abc123...",
"Image": "dengelma/sharelocal-api-dev:latest"
```

### Schritt 2: Prüfe ob dotenv im Container vorhanden ist

```bash
# Prüfe ob dotenv im node_modules ist
docker exec sharelocal-api-dev ls -la /app/node_modules | grep dotenv

# Prüfe ob dotenv Package vorhanden ist
docker exec sharelocal-api-dev find /app/node_modules -name "dotenv" -type d

# Prüfe package.json
docker exec sharelocal-api-dev cat /app/package.json | grep dotenv
```

### Schritt 3: Prüfe Image-Tag und Build-Zeit

```bash
# Prüfe wann das Image gebaut wurde
docker images dengelma/sharelocal-api-dev

# Prüfe Image-Details
docker inspect dengelma/sharelocal-api-dev:latest | grep Created
```

### Schritt 4: Prüfe ob neues Image verfügbar ist

```bash
# Pull neuestes Image
docker pull dengelma/sharelocal-api-dev:latest

# Prüfe ob neues Image heruntergeladen wurde
docker images dengelma/sharelocal-api-dev
```

---

## Lösung: Container mit neuem Image neu starten

### Option 1: Container komplett neu erstellen

```bash
# Stoppe und entferne Container
docker stop sharelocal-api-dev
docker rm sharelocal-api-dev

# Pull neuestes Image
docker pull dengelma/sharelocal-api-dev:latest

# Starte Container neu (mit korrekten Env-Vars)
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

**Wichtig:** Ersetze `$DATABASE_URL`, `$JWT_SECRET`, `$ENCRYPTION_KEY` mit echten Werten!

### Option 2: Warte auf GitHub Actions Deployment

Die GitHub Actions sollten automatisch:
1. Neues Image bauen (mit dotenv in dependencies)
2. Image zu Docker Hub pushen
3. Container auf dem Server neu starten

**Prüfe GitHub Actions:**
- Gehe zu GitHub Repository → Actions
- Prüfe ob der letzte Workflow erfolgreich war
- Prüfe ob das Image gebaut wurde

---

## Schnell-Debug: Alles auf einmal prüfen

```bash
ssh root@87.106.208.51 << 'EOF'
echo "=== Container Image Info ==="
docker inspect sharelocal-api-dev | grep -A 2 "Image"

echo ""
echo "=== Image Build Time ==="
docker images dengelma/sharelocal-api-dev --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}"

echo ""
echo "=== Prüfe dotenv im Container ==="
docker exec sharelocal-api-dev ls /app/node_modules/.pnpm 2>/dev/null | grep dotenv || echo "dotenv nicht gefunden in .pnpm"
docker exec sharelocal-api-dev find /app/node_modules -name "dotenv" -type d 2>/dev/null | head -5

echo ""
echo "=== Prüfe package.json ==="
docker exec sharelocal-api-dev cat /app/package.json 2>/dev/null | grep -A 5 "dependencies" | grep dotenv || echo "dotenv nicht in dependencies"

echo ""
echo "=== Prüfe ob neues Image verfügbar ==="
docker pull dengelma/sharelocal-api-dev:latest 2>&1 | tail -3
EOF
```

---

## Falls dotenv immer noch fehlt

### Prüfe ob GitHub Actions erfolgreich war

1. Gehe zu GitHub Repository
2. Prüfe Actions Tab
3. Prüfe ob der letzte Workflow erfolgreich war
4. Prüfe ob Docker Build erfolgreich war

### Manuelles Rebuild (falls nötig)

Falls GitHub Actions fehlgeschlagen ist, kannst du lokal bauen:

```bash
# Lokal bauen und pushen
cd /path/to/ShareLocal
docker build -f packages/api/Dockerfile -t dengelma/sharelocal-api-dev:latest .
docker push dengelma/sharelocal-api-dev:latest

# Auf Server: Pull und restart
ssh root@87.106.208.51
docker pull dengelma/sharelocal-api-dev:latest
docker stop sharelocal-api-dev
docker rm sharelocal-api-dev
# Container wird beim nächsten Deployment automatisch neu gestartet
```

---

## Nächste Schritte

1. **Führe den Debug-Befehl aus** um zu sehen, was das Problem ist
2. **Prüfe GitHub Actions** ob das neue Image gebaut wurde
3. **Pull neues Image** falls verfügbar
4. **Starte Container neu** mit neuem Image

