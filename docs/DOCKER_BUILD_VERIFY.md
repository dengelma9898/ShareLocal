# Docker Build Verification - dotenv Issue

## Problem

Container zeigt `ERR_MODULE_NOT_FOUND: Cannot find package 'dotenv'`, obwohl wir es zu `dependencies` verschoben haben.

## Debug: Prüfe ob dotenv im Image vorhanden ist

Führe auf dem Server aus:

```bash
# Prüfe ob dotenv im Image vorhanden ist
docker run --rm dengelma/sharelocal-api-dev:latest sh -c "
  echo '=== Checking package.json ==='
  cat /app/package.json | grep -A 15 'dependencies' | grep dotenv || echo 'dotenv NOT in dependencies'
  
  echo ''
  echo '=== Checking node_modules ==='
  find /app/node_modules -name 'dotenv' -type d 2>/dev/null | head -5 || echo 'dotenv NOT found in node_modules'
  
  echo ''
  echo '=== Checking .pnpm store ==='
  ls -la /app/node_modules/.pnpm 2>/dev/null | grep dotenv || echo 'dotenv NOT in .pnpm'
"
```

## Mögliche Ursachen

1. **Image wurde vor package.json Änderung gebaut**
   - Lösung: Warte auf neuen GitHub Actions Build oder baue lokal neu

2. **pnpm workspace Struktur nicht korrekt kopiert**
   - Lösung: Prüfe ob alle Workspace-Dateien kopiert werden

3. **node_modules werden nicht korrekt kopiert**
   - Lösung: Prüfe Dockerfile COPY-Befehle

## Lösung: Image lokal neu bauen und testen

```bash
# Lokal bauen
cd /path/to/ShareLocal
docker build -f packages/api/Dockerfile -t dengelma/sharelocal-api-dev:test .

# Teste ob dotenv vorhanden ist
docker run --rm dengelma/sharelocal-api-dev:test sh -c "
  find /app/node_modules -name 'dotenv' -type d
  cat /app/package.json | grep dotenv
"

# Falls erfolgreich, pushe Image
docker tag dengelma/sharelocal-api-dev:test dengelma/sharelocal-api-dev:latest
docker push dengelma/sharelocal-api-dev:latest
```

## Prüfe GitHub Actions Build

1. Gehe zu GitHub Repository → Actions
2. Prüfe den letzten erfolgreichen Build
3. Prüfe ob der Build nach dem `dotenv` Fix war
4. Prüfe die Build-Logs für Fehler

## Temporäre Lösung: dotenv entfernen

Falls das Problem weiterhin besteht, können wir `dotenv` komplett entfernen, da Docker Container Environment-Variablen direkt setzen können:

```typescript
// Statt dotenv.config()
// Verwende direkt process.env (wird von Docker gesetzt)
```

Aber das sollte nicht nötig sein, wenn das Image korrekt gebaut wurde.

