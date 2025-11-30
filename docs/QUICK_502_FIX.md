# Quick Fix: 502 Bad Gateway

## Schnell-Diagnose

Führe diese Befehle auf dem Server aus, um das Problem zu finden:

```bash
ssh root@87.106.208.51

# 1. Prüfe ob Container läuft
docker ps | grep sharelocal-api-dev

# 2. Falls Container läuft, prüfe ob er auf Port 3001 antwortet
curl http://localhost:3001/health

# 3. Prüfe Container-Logs
docker logs sharelocal-api-dev --tail 30

# 4. Prüfe ob Port 3001 offen ist
netstat -tuln | grep 3001

# 5. Prüfe NGINX-Konfiguration
nginx -t

# 6. Prüfe NGINX Error-Logs
tail -20 /var/log/nginx/error.log
```

## Häufigste Ursachen

### 1. Container läuft nicht
**Lösung:**
```bash
docker start sharelocal-api-dev
# Oder Container neu erstellen (siehe CI-Workflow)
```

### 2. Container läuft, aber antwortet nicht
**Prüfe:**
```bash
docker logs sharelocal-api-dev --tail 50
# Suche nach Fehlern: dotenv, database, port already in use
```

### 3. Port 3001 ist nicht gemappt
**Prüfe:**
```bash
docker port sharelocal-api-dev
# Sollte zeigen: 3001/tcp -> 0.0.0.0:3001
```

### 4. NGINX-Konfiguration ist falsch
**Prüfe:**
```bash
grep -A 3 "share-local/dev/health" /etc/nginx/sites-available/share-local-dev
# Sollte zeigen: proxy_pass http://localhost:3001/health;
```

### 5. Container ist nicht im richtigen Netzwerk
**Prüfe:**
```bash
docker inspect sharelocal-api-dev | grep NetworkMode
# Sollte zeigen: "NetworkMode": "sharelocal-network"
```

## Schnell-Fix

Falls Container läuft, aber nicht antwortet:
```bash
# Container neu starten
docker restart sharelocal-api-dev

# NGINX neu laden
systemctl reload nginx

# Teste erneut
curl http://localhost:3001/health
```

