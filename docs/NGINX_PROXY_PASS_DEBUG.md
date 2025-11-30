# NGINX proxy_pass Debug - ShareLocal

## Problem

Beide Requests geben 404 zurück:
- ❌ `curl http://nuernbergspots.de/share-local/dev` → 404
- ❌ `curl http://nuernbergspots.de/share-local/dev/` → 404

**Aber:** Container funktioniert direkt: `curl http://localhost:3002/share-local/dev` → 200 OK

**Das bedeutet:** NGINX sendet `/` statt `/share-local/dev` an Next.js!

---

## Debugging: Was sendet NGINX wirklich?

### Schritt 1: Prüfe NGINX Access Logs

**Auf dem Server:**

```bash
# Mache einen Request
curl http://nuernbergspots.de/share-local/dev

# Schaue NGINX Access Logs
sudo tail -20 /var/log/nginx/access.log | grep share-local/dev

# Schaue was NGINX an Backend sendet
# Format: $request_uri zeigt was NGINX an Backend sendet
```

### Schritt 2: Prüfe NGINX Error Logs

```bash
sudo tail -20 /var/log/nginx/error.log
```

### Schritt 3: Teste mit tcpdump oder ähnlich

```bash
# Prüfe was NGINX tatsächlich an Port 3002 sendet
sudo tcpdump -i lo -A -s 0 'tcp port 3002' &
# Dann mache Request: curl http://nuernbergspots.de/share-local/dev
# Stoppe tcpdump: kill %1
```

### Schritt 4: Prüfe Container Logs während Request

```bash
# In einem Terminal: Logs beobachten
docker logs -f sharelocal-web-dev

# In anderem Terminal: Request machen
curl http://nuernbergspots.de/share-local/dev

# Schaue was in den Logs steht
```

---

## Mögliche Probleme & Lösungen

### Problem 1: proxy_pass hat trailing slash

**Symptom:** NGINX entfernt Location-Pfad wenn `proxy_pass` mit `/` endet

**Prüfe:**

```bash
sudo grep -A 2 "location /share-local/dev" /etc/nginx/sites-available/nuernbergspots | grep proxy_pass
```

**Falls `proxy_pass http://localhost:3002/;` (mit trailing slash):**

```nginx
# FALSCH:
proxy_pass http://localhost:3002/;  # ❌ Entfernt Location-Pfad!

# RICHTIG:
proxy_pass http://localhost:3002;  # ✅ Behält Location-Pfad
```

### Problem 2: Location-Block wird nicht verwendet

**Symptom:** Ein anderer Location-Block fängt den Request ab

**Prüfe:**

```bash
# Prüfe alle Location-Blöcke
sudo grep -n "location" /etc/nginx/sites-available/nuernbergspots | grep -E "share-local|^[0-9]+:.*location /"

# Prüfe ob es einen allgemeineren Block gibt, der vorher matched
sudo awk '/location \// {print NR": "$0}' /etc/nginx/sites-available/nuernbergspots
```

### Problem 3: Rewrite entfernt Pfad

**Symptom:** Ein `rewrite` entfernt den Pfad vor `proxy_pass`

**Prüfe:**

```bash
# Prüfe ob rewrite vorhanden ist
sudo sed -n '/location \/share-local\/dev/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots | grep rewrite
```

**Falls `rewrite` vorhanden:**

```nginx
# FALSCH:
location /share-local/dev {
    rewrite ^/share-local/dev/?(.*) /$1 break;  # ❌ Entfernt Pfad!
    proxy_pass http://localhost:3002;
}

# RICHTIG:
location /share-local/dev {
    # KEIN rewrite
    proxy_pass http://localhost:3002;  # ✅ Behält Pfad
}
```

---

## Schnell-Diagnose Skript

```bash
#!/bin/bash
echo "=== 1. Prüfe proxy_pass Konfiguration ==="
sudo sed -n '/location \/share-local\/dev/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots | grep -E "proxy_pass|rewrite"

echo ""
echo "=== 2. Prüfe Location-Block Reihenfolge ==="
sudo awk '/location.*share-local\/dev/ {print NR": "$0}' /etc/nginx/sites-available/nuernbergspots

echo ""
echo "=== 3. Prüfe ob rewrite vorhanden ==="
sudo sed -n '/location \/share-local\/dev/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots | grep -c rewrite || echo "Kein rewrite gefunden"

echo ""
echo "=== 4. Teste Container direkt ==="
echo "Request: GET /share-local/dev"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3002/share-local/dev

echo ""
echo "=== 5. Teste über NGINX ==="
echo "Request: GET /share-local/dev"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://nuernbergspots.de/share-local/dev

echo ""
echo "=== 6. NGINX Access Logs (letzte 5 Zeilen) ==="
sudo tail -5 /var/log/nginx/access.log | grep share-local || echo "Keine Logs gefunden"
```

---

## Empfohlene Lösung

**Basierend auf dem Problem, dass NGINX `/` statt `/share-local/dev` sendet:**

### Option 1: proxy_pass ohne trailing slash (sollte bereits so sein)

```nginx
location /share-local/dev {
    proxy_pass http://localhost:3002;  # OHNE trailing slash
    # ... rest
}
```

### Option 2: Expliziter Pfad in proxy_pass

```nginx
location /share-local/dev {
    proxy_pass http://localhost:3002/share-local/dev;  # MIT explizitem Pfad
    # ... rest
}
```

**Aber:** Das könnte zu doppeltem Pfad führen (`/share-local/dev/share-local/dev`)

### Option 3: Rewrite verwenden, aber Next.js OHNE basePath bauen

```nginx
location /share-local/dev {
    rewrite ^/share-local/dev/?(.*) /$1 break;
    proxy_pass http://localhost:3002;
    # ... rest
}
```

**Aber dann:** Next.js muss OHNE basePath gebaut werden!

---

## Nächste Schritte

1. ✅ Führe Schnell-Diagnose aus
2. ✅ Prüfe NGINX Access Logs
3. ✅ Prüfe Container Logs während Request
4. ✅ Prüfe ob `proxy_pass` trailing slash hat
5. ✅ Basierend auf Ergebnissen: Fix anwenden

**Wahrscheinlichste Ursache:** `proxy_pass` hat trailing slash oder ein `rewrite` entfernt den Pfad

