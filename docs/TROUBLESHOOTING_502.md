# Troubleshooting: 502 Bad Gateway

## Problem

Beim Aufruf von `https://nuernbergspots.de/share-local/dev/health` bekommst du einen **502 Bad Gateway** Fehler.

**Bedeutung:** Nginx kann den API-Container nicht erreichen.

---

## Debugging-Schritte

### Schritt 1: Prüfe ob Container läuft

```bash
ssh root@87.106.208.51
docker ps | grep sharelocal-api-dev
```

**Erwartete Ausgabe:**
```
CONTAINER ID   IMAGE                              STATUS         PORTS                    NAMES
abc123def456   dengelma/sharelocal-api-dev:latest Up 2 minutes   0.0.0.0:3001->3001/tcp  sharelocal-api-dev
```

**Falls Container nicht läuft:**
```bash
# Starte Container
docker start sharelocal-api-dev

# Oder prüfe warum er gestoppt wurde
docker ps -a | grep sharelocal-api-dev
docker logs sharelocal-api-dev --tail 50
```

---

### Schritt 2: Prüfe Container-Logs

```bash
# Letzte 50 Zeilen der Logs
docker logs sharelocal-api-dev --tail 50

# Logs live verfolgen
docker logs -f sharelocal-api-dev

# Logs mit Timestamps
docker logs -t sharelocal-api-dev --tail 50
```

**Was zu prüfen ist:**
- ✅ Container startet erfolgreich?
- ✅ API hört auf Port 3001?
- ✅ Datenbank-Verbindung funktioniert?
- ❌ Fehler beim Start?
- ❌ Port bereits belegt?
- ❌ Environment-Variablen fehlen?

---

### Schritt 3: Prüfe ob Container auf Port 3001 lauscht

**Lokal auf dem Server:**
```bash
# Prüfe ob Port 3001 offen ist
netstat -tuln | grep 3001
# Oder
ss -tuln | grep 3001

# Teste direkt den Container
curl http://localhost:3001/health
```

**Erwartete Antwort:**
```json
{
  "status": "ok",
  "checks": {
    "api": "ok",
    "database": "ok",
    "encryption": "ok"
  },
  "timestamp": "2025-11-29T22:00:00.000Z",
  "uptime": 3600,
  "version": "0.1.0"
}
```

**Falls `curl http://localhost:3001/health` nicht funktioniert:**
- Container läuft nicht richtig
- Port ist nicht korrekt gemappt
- API hat einen Fehler beim Start

---

### Schritt 4: Prüfe Container-Details

```bash
# Container-Details anzeigen
docker inspect sharelocal-api-dev

# Prüfe Port-Mapping
docker port sharelocal-api-dev

# Prüfe Environment-Variablen
docker inspect sharelocal-api-dev | grep -A 20 "Env"
```

**Wichtige Checks:**
- Port-Mapping: `"3001/tcp": [{"HostIp": "0.0.0.0", "HostPort": "3001"}]`
- Environment: `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY` vorhanden?
- Status: `"Status": "running"`

---

### Schritt 5: Prüfe Nginx-Konfiguration

```bash
# Prüfe Nginx-Konfiguration
nginx -t

# Prüfe ob Location-Block korrekt ist
grep -A 10 "share-local/dev/api" /etc/nginx/sites-available/nuernbergspots

# Prüfe Nginx-Logs
tail -f /var/log/nginx/error.log
```

**Wichtige Checks:**
- `proxy_pass http://localhost:3001;` (nicht `http://localhost:3001/` mit trailing slash!)
- Location-Block ist aktiviert
- Keine Syntax-Fehler

---

### Schritt 6: Teste Container direkt

```bash
# Teste Health Endpoint direkt
curl http://localhost:3001/health

# Teste API Root
curl http://localhost:3001/

# Teste mit verbose Output
curl -v http://localhost:3001/health
```

**Falls das funktioniert, aber Nginx nicht:**
- Nginx-Konfiguration ist falsch
- Nginx kann Container nicht erreichen (Netzwerk-Problem)

---

## Häufige Probleme und Lösungen

### Problem 1: Container läuft nicht

**Symptom:**
```bash
docker ps | grep sharelocal-api-dev
# Keine Ausgabe
```

**Lösung:**
```bash
# Prüfe warum Container gestoppt wurde
docker ps -a | grep sharelocal-api-dev
docker logs sharelocal-api-dev --tail 100

# Starte Container neu
docker start sharelocal-api-dev

# Falls Container nicht existiert, erstelle ihn neu (siehe Deployment)
```

---

### Problem 2: Port bereits belegt

**Symptom:**
```bash
docker logs sharelocal-api-dev
# Error: listen EADDRINUSE: address already in use :::3001
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

### Problem 3: Datenbank-Verbindung fehlgeschlagen

**Symptom:**
```bash
docker logs sharelocal-api-dev
# Error: P1001: Can't reach database server
# Oder: Error: P1000: Authentication failed
```

**Lösung:**
```bash
# Prüfe ob PostgreSQL Container läuft
docker ps | grep postgres

# Prüfe DATABASE_URL Environment-Variable
docker inspect sharelocal-api-dev | grep DATABASE_URL

# Teste Datenbank-Verbindung
docker exec sharelocal-api-dev node -e "console.log(process.env.DATABASE_URL)"
```

---

### Problem 4: Environment-Variablen fehlen

**Symptom:**
```bash
docker logs sharelocal-api-dev
# Error: Missing required environment variable: DATABASE_URL
# Oder: Error: Missing required environment variable: JWT_SECRET
```

**Lösung:**
```bash
# Prüfe Environment-Variablen
docker inspect sharelocal-api-dev | grep -A 30 "Env"

# Falls fehlend, Container neu starten mit korrekten Env-Vars
# Siehe GitHub Actions Workflow für korrekte Env-Vars
```

---

### Problem 5: Nginx kann Container nicht erreichen

**Symptom:**
- Container läuft (`docker ps` zeigt Container)
- `curl http://localhost:3001/health` funktioniert
- Aber Nginx gibt 502 zurück

**Lösung:**
```bash
# Prüfe Nginx-Konfiguration
nginx -t

# Prüfe ob proxy_pass korrekt ist
grep -A 5 "share-local/dev/api" /etc/nginx/sites-available/nuernbergspots

# Prüfe Nginx-Logs
tail -f /var/log/nginx/error.log

# Lade Nginx neu
systemctl reload nginx
```

**Häufige Fehler:**
- `proxy_pass http://localhost:3001/;` (trailing slash entfernen!)
- Location-Block ist nicht aktiviert
- Nginx läuft nicht

---

## Schnell-Debug-Befehl

**Alles auf einmal prüfen:**
```bash
ssh root@87.106.208.51 << 'EOF'
echo "=== Container Status ==="
docker ps | grep sharelocal-api-dev

echo ""
echo "=== Container Logs (letzte 20 Zeilen) ==="
docker logs sharelocal-api-dev --tail 20

echo ""
echo "=== Port Check ==="
netstat -tuln | grep 3001

echo ""
echo "=== Health Check (lokal) ==="
curl -s http://localhost:3001/health | head -5

echo ""
echo "=== Nginx Config Test ==="
nginx -t

echo ""
echo "=== Nginx Error Logs (letzte 10 Zeilen) ==="
tail -10 /var/log/nginx/error.log
EOF
```

---

## Nächste Schritte

Nach dem Debugging:

1. **Falls Container nicht läuft:** Starte ihn neu oder erstelle ihn neu
2. **Falls Port belegt:** Stoppe den anderen Prozess
3. **Falls Datenbank-Fehler:** Prüfe PostgreSQL Container und DATABASE_URL
4. **Falls Nginx-Fehler:** Korrigiere Nginx-Konfiguration

---

## Weitere Hilfe

- **Container-Logs:** `docker logs sharelocal-api-dev -f`
- **Nginx-Logs:** `tail -f /var/log/nginx/error.log`
- **Container-Status:** `docker ps -a | grep sharelocal`
- **Port-Check:** `netstat -tuln | grep -E "3001|3101"`

