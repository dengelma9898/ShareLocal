# NGINX Location Order Fix - ShareLocal

## Problem

`proxy_pass` ist korrekt (`http://localhost:3002;` ohne trailing slash), aber beide Requests geben 404:
- ❌ `curl http://nuernbergspots.de/share-local/dev` → 404
- ❌ `curl http://nuernbergspots.de/share-local/dev/` → 404

**Das bedeutet:** Ein anderer Location-Block fängt den Request ab!

---

## Debugging: Prüfe alle Location-Blöcke

**Auf dem Server:**

```bash
# Zeige alle Location-Blöcke mit Zeilennummern
sudo grep -n "location" /etc/nginx/sites-available/nuernbergspots

# Zeige alle Location-Blöcke die mit / beginnen (allgemeine Blöcke)
sudo awk '/location \// {print NR": "$0}' /etc/nginx/sites-available/nuernbergspots

# Zeige alle Location-Blöcke die share-local enthalten
sudo awk '/location.*share-local/ {print NR": "$0}' /etc/nginx/sites-available/nuernbergspots
```

**Wichtig:** NGINX matched Locations in dieser Reihenfolge:
1. Exact match (`location = /path`)
2. Prefix match - längster Prefix zuerst (`location /share-local/dev/api` vor `location /share-local/dev`)
3. Regex match (`location ~ pattern`)
4. General prefix match (`location /`)

---

## Mögliche Probleme

### Problem 1: Allgemeiner Location-Block fängt Request ab

**Symptom:** Ein `location /` Block kommt VOR `/share-local/dev`

**Prüfe:**

```bash
# Prüfe ob location / existiert und vor /share-local/dev kommt
sudo awk '/^[[:space:]]*location \// {print NR": "$0}' /etc/nginx/sites-available/nuernbergspots
```

**Lösung:** Stelle sicher, dass `/share-local/dev` VOR allgemeinen Blöcken kommt, oder verwende `location = /share-local/dev` für exact match.

### Problem 2: Location-Block Reihenfolge falsch

**Symptom:** `/share-local/dev/api` kommt VOR `/share-local/dev`, aber NGINX matched falsch

**Prüfe:**

```bash
# Prüfe Reihenfolge
sudo awk '/location.*share-local\/dev/ {print NR": "$0}' /etc/nginx/sites-available/nuernbergspots
```

**Sollte sein:**
- Zeile X: `location /share-local/dev/api` (spezifischer)
- Zeile Y: `location /share-local/dev` (allgemeiner, Y > X)

**Aber:** NGINX matched längsten Prefix zuerst, also sollte `/share-local/dev/api` VOR `/share-local/dev` kommen!

### Problem 3: Regex Location-Block matched falsch

**Symptom:** Ein `location ~` Block matched `/share-local/dev`

**Prüfe:**

```bash
# Prüfe Regex Locations
sudo grep -n "location ~" /etc/nginx/sites-available/nuernbergspots
```

---

## Lösung: Exact Match verwenden

**Wenn `/share-local/dev` nicht funktioniert, verwende exact match:**

```nginx
# Exact match für Root-Route
location = /share-local/dev {
    proxy_pass http://localhost:3002/share-local/dev;
    # ... rest gleich
}

# Oder mit trailing slash
location = /share-local/dev/ {
    proxy_pass http://localhost:3002/share-local/dev/;
    # ... rest gleich
}

# Allgemeiner Block für alles andere unter /share-local/dev
location /share-local/dev/ {
    proxy_pass http://localhost:3002;
    # ... rest gleich
}
```

**Aber:** Das ist kompliziert. Besser: Prüfe warum der normale Block nicht funktioniert.

---

## Empfohlene Lösung: Prüfe NGINX Logs

**Auf dem Server:**

```bash
# Mache Request
curl http://nuernbergspots.de/share-local/dev

# Schaue NGINX Access Logs
sudo tail -20 /var/log/nginx/access.log | grep share-local/dev

# Schaue NGINX Error Logs
sudo tail -20 /var/log/nginx/error.log
```

**Was zu suchen ist:**
- Welcher Location-Block wird verwendet? (steht in den Logs)
- Was sendet NGINX an Backend? (steht in den Logs)

---

## Alternative: Expliziter Pfad in proxy_pass

**Wenn NGINX den Pfad nicht korrekt anhängt:**

```nginx
location /share-local/dev {
    # Expliziter Pfad - NGINX sendet genau das
    proxy_pass http://localhost:3002/share-local/dev;
    proxy_http_version 1.1;
    
    # ... rest gleich
}
```

**Aber:** Das könnte zu Problemen führen, wenn Unterpfade aufgerufen werden (`/share-local/dev/login` würde zu `/share-local/dev/login` werden, was OK ist).

---

## Schnell-Diagnose

```bash
#!/bin/bash
echo "=== 1. Alle Location-Blöcke ==="
sudo grep -n "location" /etc/nginx/sites-available/nuernbergspots

echo ""
echo "=== 2. Location-Reihenfolge für share-local/dev ==="
sudo awk '/location.*share-local\/dev/ {print NR": "$0}' /etc/nginx/sites-available/nuernbergspots

echo ""
echo "=== 3. Allgemeine Location-Blöcke (location /) ==="
sudo awk '/^[[:space:]]*location \// {print NR": "$0}' /etc/nginx/sites-available/nuernbergspots

echo ""
echo "=== 4. Exakter /share-local/dev Block ==="
sudo sed -n '/location \/share-local\/dev[^\/]/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots

echo ""
echo "=== 5. NGINX Access Logs (letzte 10 Zeilen) ==="
sudo tail -10 /var/log/nginx/access.log | grep share-local || echo "Keine Logs gefunden"
```

---

## Nächste Schritte

1. ✅ Führe Schnell-Diagnose aus
2. ✅ Prüfe ob `location /` Block existiert und vor `/share-local/dev` kommt
3. ✅ Prüfe NGINX Access Logs
4. ✅ Basierend auf Ergebnissen: Fix anwenden

**Wahrscheinlichste Ursache:** Ein allgemeiner `location /` Block fängt den Request ab, bevor er `/share-local/dev` erreicht!

