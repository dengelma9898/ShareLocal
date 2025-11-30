# NGINX Routing Debug - ShareLocal

## Problem

Container funktioniert direkt, aber über NGINX gibt es 404:
- ✅ `curl http://localhost:3002/share-local/dev` → 200 OK
- ✅ `curl http://localhost:3002/share-local/dev/health` → funktioniert
- ❌ `curl http://nuernbergspots.de/share-local/dev` → 404

## Debugging-Schritte

### Schritt 1: Prüfe NGINX Access Logs

**Auf dem Server:**

```bash
# Mache einen Request
curl http://nuernbergspots.de/share-local/dev

# Schaue NGINX Access Logs
sudo tail -f /var/log/nginx/access.log | grep share-local

# Schaue NGINX Error Logs
sudo tail -f /var/log/nginx/error.log
```

**Was zu suchen ist:**
- Welcher Location-Block wird verwendet?
- Was sendet NGINX an Backend?
- Gibt es Fehler in den Logs?

### Schritt 2: Prüfe Location-Block Reihenfolge

**Wichtig:** NGINX verwendet den ersten passenden Location-Block!

```bash
# Prüfe alle Location-Blöcke für /share-local/dev
sudo grep -n "location.*share-local" /etc/nginx/sites-available/nuernbergspots

# Prüfe ob /share-local/dev/api VOR /share-local/dev kommt
sudo grep -A 5 "location.*share-local/dev" /etc/nginx/sites-available/nuernbergspots
```

**Problem:** Wenn `/share-local/dev/api` VOR `/share-local/dev` kommt, könnte es den Request abfangen!

### Schritt 3: Teste NGINX direkt

```bash
# Teste mit curl über NGINX
curl -v http://nuernbergspots.de/share-local/dev 2>&1 | grep -E "Host:|GET|HTTP"

# Prüfe was NGINX an Backend sendet (mit tcpdump oder ähnlich)
# Oder schaue NGINX Access Logs
```

### Schritt 4: Prüfe ob Location-Block korrekt ist

```bash
# Prüfe die exakte Location-Config
sudo sed -n '/location \/share-local\/dev/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots
```

---

## Mögliche Probleme

### Problem 1: Location-Block Reihenfolge

**Symptom:** `/share-local/dev/api` kommt VOR `/share-local/dev`

**Ursache:** NGINX verwendet den ersten passenden Block. Wenn `/share-local/dev/api` zuerst kommt, wird `/share-local/dev` nie erreicht!

**Lösung:** `/share-local/dev` MUSS VOR `/share-local/dev/api` kommen!

```nginx
# RICHTIGE REIHENFOLGE:
location /share-local/dev {
    # ... Web Config
}

location /share-local/dev/api {
    # ... API Config
}
```

### Problem 2: Location-Block fehlt oder ist falsch

**Symptom:** Kein Location-Block für `/share-local/dev` gefunden

**Lösung:** Location-Block hinzufügen (siehe NGINX_BASEPATH_FIX.md)

### Problem 3: Proxy-Pass sendet falschen Pfad

**Symptom:** NGINX sendet `/` statt `/share-local/dev`

**Lösung:** `proxy_pass http://localhost:3002;` OHNE trailing slash verwenden

---

## Schnell-Diagnose

```bash
#!/bin/bash
echo "=== 1. Prüfe Location-Blöcke ==="
sudo grep -n "location.*share-local" /etc/nginx/sites-available/nuernbergspots

echo ""
echo "=== 2. Prüfe Location-Reihenfolge ==="
sudo awk '/location.*share-local\/dev/ {print NR": "$0}' /etc/nginx/sites-available/nuernbergspots

echo ""
echo "=== 3. Prüfe Web Location-Block ==="
sudo sed -n '/location \/share-local\/dev[^\/]/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots

echo ""
echo "=== 4. Teste Container direkt ==="
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/share-local/dev
echo " (sollte 200 sein)"

echo ""
echo "=== 5. Teste über NGINX ==="
curl -s -o /dev/null -w "%{http_code}" http://nuernbergspots.de/share-local/dev
echo " (sollte 200 sein, nicht 404)"

echo ""
echo "=== 6. NGINX Access Logs (letzte 5 Zeilen) ==="
sudo tail -5 /var/log/nginx/access.log | grep share-local || echo "Keine Logs gefunden"
```

---

## Nächste Schritte

1. ✅ Führe Schnell-Diagnose aus
2. ✅ Prüfe Location-Block Reihenfolge
3. ✅ Prüfe NGINX Access Logs
4. ✅ Basierend auf Ergebnissen: Fix anwenden

**Wahrscheinlichste Ursache:** Location-Block Reihenfolge - `/share-local/dev/api` kommt VOR `/share-local/dev`!

