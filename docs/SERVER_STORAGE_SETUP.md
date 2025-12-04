# Server-basierte Speicherung Setup (MVP)

## Übersicht

Dieses Dokument beschreibt die notwendigen Schritte, um die Server-basierte Speicherung für Listing-Bilder auf dem IONOS-Server einzurichten.

---

## ✅ Was wurde bereits implementiert

1. **API-Code**: `LocalStorageService` ist implementiert und wird automatisch verwendet
2. **NGINX-Konfiguration**: `/uploads/images/` Location-Block ist in beiden Configs vorhanden
3. **CI/CD Pipeline**: Volume-Mount und Environment Variables wurden hinzugefügt

---

## 🔧 Was muss auf dem Server gemacht werden

### 1. Verzeichnis erstellen (einmalig)

```bash
# SSH auf den Server
ssh root@87.106.208.51

# Verzeichnis erstellen
mkdir -p /var/www/sharelocal/uploads/images
chmod 755 /var/www/sharelocal/uploads/images
```

**Wichtig:** Dieses Verzeichnis wird von NGINX serviert und muss auf dem Host-System existieren.

### 2. NGINX-Konfiguration für Bild-Serving

**⚠️ WICHTIG:** Die NGINX-Konfiguration auf dem Server ist die Quelle der Wahrheit.

**Lösung:** Die API serviert die Bilder selbst über Express.static. NGINX muss `/share-local/dev/uploads/images/` an die API weiterleiten.

**Aktion:** Prüfe die NGINX-Konfiguration direkt auf dem Server:

```bash
# SSH auf den Server
ssh root@87.106.208.51

# NGINX-Konfiguration prüfen
nginx -t  # Test Konfiguration

# Stelle sicher, dass folgender Location-Block vorhanden ist:
# location /share-local/dev/uploads/images/ {
#     rewrite ^/share-local/dev/uploads/images/?(.*) /uploads/images/$1 break;
#     proxy_pass http://localhost:3001;
#     proxy_http_version 1.1;
#     proxy_set_header Host $host;
#     expires 30d;
#     add_header Cache-Control "public, immutable";
# }

# NGINX neu laden (falls Änderungen nötig waren)
systemctl reload nginx  # Oder: service nginx reload
```

**Hinweis:** 
- Die API serviert die Bilder selbst (Express.static), daher muss NGINX die Requests an die API weiterleiten
- Kein separater Location-Block für statische Dateien nötig - die API übernimmt das
- Für Production (`/share-local/prd/uploads/images/`) gilt das Gleiche, nur mit Port 3101

---

## 🚀 CI/CD Pipeline Änderungen

Die CI/CD Pipeline wurde bereits aktualisiert:

### Was wurde geändert:

1. **Volume Mount hinzugefügt**: `/var/www/sharelocal/uploads/images:/app/uploads/images`
2. **Environment Variables hinzugefügt**:
   - `BASE_URL=https://nuernbergspots.de`
   - `LOCAL_STORAGE_DIR=/app/uploads/images`
   - `LOCAL_STORAGE_PUBLIC_URL=https://nuernbergspots.de/uploads/images`
3. **Automatische Verzeichnis-Erstellung**: Das Deployment-Script erstellt das Verzeichnis automatisch, falls es nicht existiert

### Deployment-Workflow:

1. **Dev Deployment** (`deploy-dev` Job):
   - Erstellt `/var/www/sharelocal/uploads/images` auf dem Host
   - Mountet Volume in Container: `/app/uploads/images`
   - Setzt Environment Variables für Local Storage

2. **Prod Deployment** (`deploy-prd` Job):
   - Gleiche Schritte wie Dev, aber mit Port 3101

---

## 📋 Checkliste für Server-Setup

- [ ] **Verzeichnis erstellt**: `/var/www/sharelocal/uploads/images` existiert
- [ ] **Berechtigungen gesetzt**: `chmod 755` auf Verzeichnis
- [ ] **NGINX-Konfiguration aktiv**: Configs sind auf dem Server und NGINX wurde neu geladen
- [ ] **Volume Mount funktioniert**: Nach Deployment sollte Container Zugriff auf Host-Verzeichnis haben
- [ ] **Test Upload**: Ein Test-Upload sollte funktionieren und Bild sollte unter `https://nuernbergspots.de/uploads/images/` erreichbar sein

---

## 🧪 Testing

### 1. Test-Upload durchführen

```bash
# Authentifizierung
curl -X POST https://nuernbergspots.de/share-local/dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Token speichern
TOKEN="<token-from-response>"

# Bild hochladen
curl -X POST https://nuernbergspots.de/share-local/dev/api/images/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/test-image.jpg"
```

### 2. Bild-URL prüfen

Die Response sollte eine URL zurückgeben wie:
```json
{
  "data": {
    "url": "https://nuernbergspots.de/uploads/images/1234567890-abc123.jpg",
    "filename": "test-image.jpg",
    "mimetype": "image/jpeg"
  }
}
```

### 3. Bild direkt abrufen

```bash
curl -I https://nuernbergspots.de/uploads/images/1234567890-abc123.jpg
```

Sollte `200 OK` zurückgeben mit `Content-Type: image/jpeg`.

---

## 🔍 Troubleshooting

### Problem: 404 beim Bild-Abruf

**Ursache:** NGINX findet das Bild nicht

**Lösung:**
1. Prüfe, ob Verzeichnis existiert: `ls -la /var/www/sharelocal/uploads/images/`
2. Prüfe NGINX-Konfiguration: `nginx -t`
3. Prüfe NGINX-Logs: `tail -f /var/log/nginx/error.log`
4. Stelle sicher, dass NGINX-Benutzer (`www-data` oder `nginx`) Leserechte hat

### Problem: Container kann nicht in Verzeichnis schreiben

**Ursache:** Berechtigungsprobleme

**Lösung:**
```bash
# Prüfe Container-User
docker exec sharelocal-api-dev whoami  # Sollte "nodejs" sein (UID 1001)

# Setze Berechtigungen auf Host-Verzeichnis
chmod 777 /var/www/sharelocal/uploads/images  # Temporär für Testing
# Oder besser: chown nodejs:nodejs /var/www/sharelocal/uploads/images
```

### Problem: Bilder werden nicht persistiert nach Container-Restart

**Ursache:** Volume-Mount fehlt oder ist falsch konfiguriert

**Lösung:**
1. Prüfe Container-Volumes: `docker inspect sharelocal-api-dev | grep -A 10 Mounts`
2. Stelle sicher, dass Volume-Mount in CI/CD Pipeline vorhanden ist
3. Prüfe, ob Host-Verzeichnis existiert: `ls -la /var/www/sharelocal/uploads/images/`

---

## 📊 Monitoring

### Verzeichnis-Größe überwachen

```bash
# Größe des uploads-Verzeichnisses prüfen
du -sh /var/www/sharelocal/uploads/images/

# Anzahl der Bilder
ls -1 /var/www/sharelocal/uploads/images/ | wc -l
```

### Logs prüfen

```bash
# API-Logs (Upload-Logs)
docker logs sharelocal-api-dev | grep -i "image uploaded"

# NGINX-Logs (Zugriffe auf Bilder)
tail -f /var/log/nginx/access.log | grep "/uploads/images/"
```

---

## 🔄 Migration zu Cloud-Storage (später)

Wenn das Volumen wächst, kann einfach zu IONOS Object Storage migriert werden:

1. IONOS Object Storage Bucket erstellen
2. Environment Variables setzen:
   ```
   STORAGE_TYPE=ionos
   IONOS_ENDPOINT=https://s3.ionos.com
   IONOS_ACCESS_KEY_ID=...
   IONOS_SECRET_ACCESS_KEY=...
   IONOS_BUCKET_NAME=sharelocal-images
   ```
3. `IonosStorageService` implementieren (ähnlich wie `ScalewayStorageService`)
4. Storage Service in Dependency Injection austauschen

Die Migration ist einfach, da die `StorageService` Interface-abstrahiert ist.

---

## 📚 Weitere Informationen

- **Image Storage Options**: `docs/IMAGE_STORAGE_OPTIONS.md`
- **LocalStorageService**: `packages/api/src/adapters/services/LocalStorageService.ts`

**⚠️ Hinweis:** NGINX-Konfigurationen müssen direkt auf dem Server geprüft werden. Die Server-Konfiguration ist die Quelle der Wahrheit.

