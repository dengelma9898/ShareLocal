# NGINX No Logs Fix - ShareLocal

## Problem

Next.js Container zeigt keine Logs, auch wenn Requests gemacht werden:
- ✅ Container funktioniert direkt: `curl http://localhost:3002/share-local/dev` → 200 OK
- ❌ Über NGINX: `curl http://nuernbergspots.de/share-local/dev` → 404, keine Container-Logs

**Das bedeutet:** NGINX sendet den Request nicht an den Container!

---

## Debugging: Prüfe NGINX Logs

**Auf dem Server:**

```bash
# Mache Request
curl http://nuernbergspots.de/share-local/dev

# Schaue NGINX Access Logs
sudo tail -20 /var/log/nginx/access.log | grep share-local/dev

# Schaue NGINX Error Logs
sudo tail -20 /var/log/nginx/error.log

# Prüfe ob Request überhaupt ankommt
sudo tail -f /var/log/nginx/access.log
# Dann mache Request in anderem Terminal
```

**Was zu suchen ist:**
- Kommt der Request überhaupt bei NGINX an?
- Welcher Location-Block wird verwendet?
- Gibt es Fehler in den Error-Logs?

---

## Mögliche Probleme

### Problem 1: Location-Block matched nicht

**Symptom:** NGINX verwendet einen anderen Location-Block

**Prüfe:**

```bash
# Prüfe welche Location-Blöcke existieren
sudo grep -n "location" /etc/nginx/sites-available/nuernbergspots

# Prüfe ob /share-local/dev Block korrekt ist
sudo sed -n '/location \/share-local\/dev[^\/]/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots
```

### Problem 2: proxy_pass sendet Request an falschen Port

**Symptom:** NGINX sendet Request an Port 3000 statt 3002

**Prüfe:**

```bash
# Prüfe proxy_pass Konfiguration
sudo sed -n '/location \/share-local\/dev[^\/]/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots | grep proxy_pass
```

### Problem 3: Container läuft nicht oder Port ist falsch

**Symptom:** Container läuft nicht auf Port 3002

**Prüfe:**

```bash
# Prüfe ob Container läuft
docker ps | grep sharelocal-web-dev

# Prüfe Port-Mapping
docker port sharelocal-web-dev

# Teste Container direkt
curl http://localhost:3002/share-local/dev
```

---

## Lösung: Expliziter Pfad + Prüfe NGINX Logs

### Schritt 1: Expliziter Pfad in proxy_pass

```nginx
location /share-local/dev {
    # Expliziter Pfad - NGINX sendet genau das
    proxy_pass http://localhost:3002/share-local/dev;
    proxy_http_version 1.1;
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Prefix /share-local/dev;
    
    # WebSocket support
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

### Schritt 2: Prüfe NGINX Logs

```bash
# Aktiviere detaillierte Logging
sudo nano /etc/nginx/sites-available/nuernbergspots

# Füge zu server block hinzu:
access_log /var/log/nginx/access.log combined;
error_log /var/log/nginx/error.log debug;

# Reload NGINX
sudo nginx -t
sudo systemctl reload nginx

# Mache Request
curl http://nuernbergspots.de/share-local/dev

# Schaue Logs
sudo tail -50 /var/log/nginx/access.log | grep share-local
sudo tail -50 /var/log/nginx/error.log
```

---

## Alternative: Teste ob NGINX überhaupt matched

**Auf dem Server:**

```bash
# Füge temporär einen Test-Location-Block hinzu
sudo nano /etc/nginx/sites-available/nuernbergspots

# Füge VOR /share-local/dev hinzu:
location = /share-local/dev {
    return 200 "NGINX matched /share-local/dev";
    add_header Content-Type text/plain;
}

# Reload NGINX
sudo nginx -t
sudo systemctl reload nginx

# Teste
curl http://nuernbergspots.de/share-local/dev
# Sollte zeigen: "NGINX matched /share-local/dev"

# Wenn das funktioniert, dann matched NGINX den Block korrekt
# Dann ändere zurück zu proxy_pass
```

---

## Schnell-Diagnose

```bash
#!/bin/bash
echo "=== 1. Prüfe Container Status ==="
docker ps | grep sharelocal-web-dev

echo ""
echo "=== 2. Prüfe Port-Mapping ==="
docker port sharelocal-web-dev

echo ""
echo "=== 3. Teste Container direkt ==="
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3002/share-local/dev

echo ""
echo "=== 4. Prüfe NGINX Config ==="
sudo sed -n '/location \/share-local\/dev[^\/]/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots

echo ""
echo "=== 5. Prüfe NGINX Access Logs ==="
sudo tail -10 /var/log/nginx/access.log | grep share-local || echo "Keine Logs gefunden"

echo ""
echo "=== 6. Prüfe NGINX Error Logs ==="
sudo tail -10 /var/log/nginx/error.log
```

---

## Nächste Schritte

1. ✅ Führe Schnell-Diagnose aus
2. ✅ Prüfe NGINX Access Logs (kommt Request an?)
3. ✅ Prüfe NGINX Error Logs (gibt es Fehler?)
4. ✅ Teste mit explizitem Pfad in proxy_pass
5. ✅ Basierend auf Ergebnissen: Fix anwenden

**Wahrscheinlichste Ursache:** NGINX matched einen anderen Location-Block oder sendet Request an falschen Port!

