# NGINX 404 Problem - Zusammenfassung aller Tests

## Problem

**Symptom:**
- ✅ Container funktioniert direkt: `curl http://localhost:3002/` → 200 OK (HTML)
- ✅ Container funktioniert direkt: `curl http://localhost:3001/` → API-Antwort
- ❌ Über NGINX: `curl http://nuernbergspots.de/share-local/dev` → `{"statusCode":404,"timestamp":"...","message":"Cannot GET /"}`

**Die 404-Nachricht ist im API-Format** (JSON mit `statusCode`, `timestamp`, `message`).

---

## Was wir wissen (FAKTEN)

### ✅ Funktioniert

1. **Container läuft korrekt:**
   - `docker ps | grep sharelocal-web-dev` → Container läuft
   - `docker exec sharelocal-web-dev printenv | grep PORT` → `PORT=3002`
   - `curl http://localhost:3002/` → 200 OK (HTML-Seite)

2. **NGINX Config scheint korrekt:**
   - `proxy_pass http://localhost:3002;` → Port 3002 ✅
   - `rewrite ^/share-local/dev/?(.*) /$1 break;` → Vor `proxy_pass` ✅
   - Location-Block existiert auf Zeile 40 ✅

### ❌ Funktioniert NICHT

1. **NGINX leitet Request nicht weiter:**
   - `tcpdump` zeigt **KEINE Requests** auf Port 3001 oder 3002
   - Container-Logs zeigen **KEINE neuen Requests** nach NGINX-Request

2. **Temporärer `return` funktioniert nicht:**
   - `return 200 "NGINX matched...";` im `/share-local/dev` Block → **Funktioniert NICHT**
   - Das bedeutet: NGINX matched diesen Block **NICHT**!

3. **404 kommt zurück:**
   - Format: `{"statusCode":404,"timestamp":"...","message":"Cannot GET /"}`
   - Das ist API-Format, nicht Next.js-Format

---

## Was wir bereits getestet haben

### ❌ Getestet und funktioniert NICHT

1. **Rewrite vor proxy_pass** ✅ Getestet - funktioniert nicht
2. **proxy_pass ohne trailing slash** ✅ Getestet - funktioniert nicht
3. **proxy_pass mit trailing slash** ✅ Getestet - funktioniert nicht
4. **proxy_pass mit explizitem Pfad** ✅ Getestet - funktioniert nicht
5. **Location-Reihenfolge ändern** ✅ Getestet - funktioniert nicht
6. **Temporärer return im Block** ✅ Getestet - funktioniert nicht (Block matched nicht!)
7. **PORT Environment Variable** ✅ Getestet - ist korrekt (3002)
8. **Container direkt testen** ✅ Getestet - funktioniert (200 OK)

### ⚠️ Noch nicht getestet

1. **Exact match (`location = /share-local/dev`)** - Noch nicht getestet
2. **Prüfe ob ein anderer Block matched** - Noch nicht systematisch getestet
3. **NGINX Config komplett neu laden** - Noch nicht getestet
4. **Prüfe ob NGINX die Config überhaupt lädt** - Noch nicht getestet

---

## Aktuelle NGINX Config (was wir wissen)

**Zeile 29:** `location = /dev/` → `proxy_pass http://localhost:3000/;`
**Zeile 40:** `location /share-local/dev` → `proxy_pass http://localhost:3002;`
**Zeile 62:** `location /share-local/dev/api` → `proxy_pass http://localhost:3001;`

**Wichtig:** Der `/share-local/dev` Block hat:
- `rewrite ^/share-local/dev/?(.*) /$1 break;` (vor proxy_pass)
- `proxy_pass http://localhost:3002;` (ohne trailing slash)

---

## Das eigentliche Problem

**NGINX matched den `/share-local/dev` Block NICHT!**

**Beweis:**
- Temporärer `return` im Block funktioniert nicht
- `tcpdump` zeigt keine Requests auf Port 3002
- Container-Logs zeigen keine Requests

**Das bedeutet:** Ein anderer Location-Block matched zuerst!

---

## Mögliche Ursachen (noch nicht getestet)

1. **Ein `location /` Block matched zuerst**
   - Prüfe: `sudo awk '/^[[:space:]]*location \// {print NR": "$0}' /etc/nginx/sites-available/nuernbergspots`

2. **Der `location = /dev/` Block matched irgendwie**
   - Prüfe: Was macht dieser Block genau?

3. **NGINX lädt die Config nicht korrekt**
   - Prüfe: `sudo nginx -T | grep -A 20 "location /share-local/dev"`

4. **Ein anderer Server-Block matched**
   - Prüfe: Gibt es mehrere `server` Blöcke?

---

## Nächste Schritte (systematisch)

### Schritt 1: Prüfe welcher Block tatsächlich matched

```bash
# Zeige ALLE Location-Blöcke
sudo grep -n "location" /etc/nginx/sites-available/nuernbergspots

# Prüfe ob location / existiert
sudo awk '/^[[:space:]]*location \// {print NR": "$0}' /etc/nginx/sites-available/nuernbergspots

# Prüfe komplette Config
sudo nginx -T | grep -B 5 -A 20 "location.*share-local/dev"
```

### Schritt 2: Prüfe ob ein anderer Server-Block matched

```bash
# Zeige alle server Blöcke
sudo grep -n "server {" /etc/nginx/sites-available/nuernbergspots

# Prüfe welcher server Block für nuernbergspots.de matched
sudo nginx -T | grep -A 50 "server_name nuernbergspots.de"
```

### Schritt 3: Teste exact match

```bash
sudo nano /etc/nginx/sites-available/nuernbergspots
# Ändere: location /share-local/dev → location = /share-local/dev
sudo nginx -t
sudo systemctl reload nginx
curl http://nuernbergspots.de/share-local/dev
```

---

## Zusammenfassung

**Was funktioniert:** Container, Ports, Config-Syntax
**Was nicht funktioniert:** NGINX matched den `/share-local/dev` Block nicht
**Was noch nicht getestet:** Welcher Block matched stattdessen, exact match, andere Server-Blöcke

**Nächster Schritt:** Systematisch prüfen, welcher Block tatsächlich matched!

