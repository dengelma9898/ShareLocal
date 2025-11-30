# NGINX /dev/ Block Fix - ShareLocal

## Problem

Es gibt einen `location /dev/` Block auf Zeile 29, der VOR `/share-local/dev` (Zeile 39) kommt!

**Location-Reihenfolge:**
- Zeile 29: `location /dev/` ⚠️
- Zeile 39: `location /share-local/dev` ✅
- Zeile 64: `location /share-local/dev/api` ✅
- Zeile 90: `location /share-local/dev/health` ✅

**Problem:** Der `/dev/` Block könnte den Request abfangen!

---

## Lösung: Prüfe was im /dev/ Block steht

**Auf dem Server:**

```bash
# Zeige den kompletten /dev/ Block
sudo sed -n '/location \/dev\//,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots

# Prüfe was dieser Block macht
sudo awk '/location \/dev\//,/^[[:space:]]*}/' /etc/nginx/sites-available/nuernbergspots
```

**Mögliche Probleme:**

### Problem 1: /dev/ Block matched /share-local/dev

**Symptom:** NGINX matched `/dev/` statt `/share-local/dev`

**Lösung:** `/dev/` Block ändern zu exact match oder entfernen:

```nginx
# VORHER (könnte Probleme verursachen):
location /dev/ {
    # ...
}

# NACHHER (exact match):
location = /dev/ {
    # ... nur für genau /dev/
}

# ODER: Block entfernen, falls nicht benötigt
```

### Problem 2: /dev/ Block hat allgemeine proxy_pass

**Symptom:** `/dev/` Block leitet alle Requests weiter, die mit `/dev/` beginnen

**Lösung:** Block spezifischer machen oder entfernen

---

## Empfohlene Lösung

### Option 1: /dev/ Block zu exact match ändern

**Wenn `/dev/` Block nur für genau `/dev/` sein soll:**

```nginx
# Exact match - matched nur genau /dev/
location = /dev/ {
    # ... deine Config
}
```

### Option 2: /dev/ Block entfernen (falls nicht benötigt)

**Wenn `/dev/` Block nicht benötigt wird:**

```bash
sudo nano /etc/nginx/sites-available/nuernbergspots
# Lösche den location /dev/ Block komplett
```

### Option 3: /share-local/dev Block VOR /dev/ Block verschieben

**Wenn `/dev/` Block benötigt wird:**

```nginx
# Reihenfolge ändern:
# 1. Zuerst spezifischere Blocks
location /share-local/dev/api {
    # ...
}

location /share-local/dev/health {
    # ...
}

location /share-local/dev {
    # ...
}

# 2. Dann allgemeinere Blocks
location /dev/ {
    # ...
}
```

**Aber:** NGINX matched längsten Prefix zuerst, also sollte `/share-local/dev` automatisch vor `/dev/` matchen. Das Problem könnte woanders liegen.

---

## Debugging: Prüfe was NGINX matched

**Auf dem Server:**

```bash
# Mache Request
curl http://nuernbergspots.de/share-local/dev

# Schaue NGINX Access Logs
sudo tail -20 /var/log/nginx/access.log | grep share-local/dev

# Schaue welche Location verwendet wurde
# (NGINX Logs zeigen normalerweise nicht direkt welche Location matched wurde,
#  aber du kannst sehen, welcher Backend verwendet wurde)
```

---

## Schnell-Fix: Prüfe /dev/ Block

```bash
#!/bin/bash
echo "=== 1. Zeige /dev/ Block ==="
sudo sed -n '/location \/dev\//,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots

echo ""
echo "=== 2. Zeige /share-local/dev Block ==="
sudo sed -n '/location \/share-local\/dev[^\/]/,/^[[:space:]]*}/p' /etc/nginx/sites-available/nuernbergspots

echo ""
echo "=== 3. Teste /dev/ direkt ==="
curl -s -o /dev/null -w "Status: %{http_code}\n" http://nuernbergspots.de/dev/

echo ""
echo "=== 4. Teste /share-local/dev ==="
curl -s -o /dev/null -w "Status: %{http_code}\n" http://nuernbergspots.de/share-local/dev
```

---

## Nächste Schritte

1. ✅ Zeige was im `/dev/` Block steht
2. ✅ Prüfe ob `/dev/` Block den Request abfängt
3. ✅ Entferne oder ändere `/dev/` Block, falls nötig
4. ✅ Teste erneut

**Wahrscheinlichste Ursache:** Der `/dev/` Block fängt den Request ab, bevor er `/share-local/dev` erreicht!

