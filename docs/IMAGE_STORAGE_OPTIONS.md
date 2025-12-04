# Image Storage Options für ShareLocal

## Übersicht

Dieses Dokument beschreibt die verschiedenen Optionen für die Speicherung von Listing-Bildern in ShareLocal und empfiehlt die beste Lösung für MVP und Production.

---

## Deployment-Umgebungen

ShareLocal hat **drei Umgebungen**:

1. **Local Development** (`NODE_ENV=development`, läuft lokal)
   - Läuft auf `localhost:3001`
   - Keine Credentials nötig
   - Verwendet automatisch Local Storage

2. **Development Deployment** (`NODE_ENV=production`, deployed auf Server)
   - Läuft auf `https://nuernbergspots.de/share-local/dev`
   - Port: 3001 (API), 3002 (Web)
   - Benötigt Storage-Lösung

3. **Production Deployment** (`NODE_ENV=production`, deployed auf Server)
   - Läuft auf `https://nuernbergspots.de/share-local/prd`
   - Port: 3101 (API), 3102 (Web)
   - Benötigt Storage-Lösung

---

## Optionen für Image Storage

### Option 1: Server-basierte Speicherung (Empfohlen für MVP) ✅

**Beschreibung:**
Bilder werden direkt auf dem Server im Dateisystem gespeichert und über NGINX serviert.

**Vorteile:**
- ✅ **Einfach**: Keine zusätzlichen Services oder Credentials nötig
- ✅ **Kostengünstig**: Keine zusätzlichen Kosten (nutzt vorhandenen Server)
- ✅ **Schnell**: Direkter Zugriff, keine externe API-Calls
- ✅ **EU-konform**: Daten bleiben auf dem IONOS-Server (EU)
- ✅ **Perfekt für MVP**: Ausreichend für kleine bis mittlere Mengen an Bildern

**Nachteile:**
- ⚠️ **Skalierung**: Bei sehr vielen Bildern kann Speicherplatz knapp werden
- ⚠️ **Backup**: Muss manuell in Backup-Strategie integriert werden
- ⚠️ **CDN**: Keine automatische CDN-Integration (kann später hinzugefügt werden)

**Setup:**
1. Volume für Bilder im Docker Container mounten
2. NGINX konfigurieren, um `/uploads/images/` zu servieren
3. Keine zusätzlichen Credentials nötig

**Kosten:** €0 (nutzt vorhandenen Server-Speicher)

**Empfehlung:** ✅ **Für MVP ideal** - Einfach, kostengünstig, EU-konform

---

### Option 2: Scaleway Object Storage (S3-kompatibel)

**Beschreibung:**
Bilder werden in Scaleway Object Storage (S3-kompatibel) gespeichert.

**Vorteile:**
- ✅ **Skalierbar**: Unbegrenzte Speicherkapazität
- ✅ **CDN-ready**: Kann mit CDN kombiniert werden
- ✅ **EU-Provider**: Scaleway ist französischer Provider (EU)
- ✅ **S3-kompatibel**: Standard AWS S3 API

**Nachteile:**
- ⚠️ **Kosten**: ~€0.01 pro GB/Monat + Traffic-Kosten
- ⚠️ **Setup**: Benötigt Credentials und Bucket-Konfiguration
- ⚠️ **Komplexität**: Zusätzlicher Service zu verwalten

**Setup:**
1. Scaleway Account erstellen
2. Object Storage Bucket erstellen (Region: `fr-par`, `nl-ams`, oder `pl-waw`)
3. Access Keys generieren
4. Environment Variables setzen:
   ```
   SCALEWAY_ENDPOINT=https://s3.fr-par.scw.cloud
   SCALEWAY_REGION=fr-par
   SCALEWAY_ACCESS_KEY_ID=your-access-key
   SCALEWAY_SECRET_ACCESS_KEY=your-secret-key
   SCALEWAY_BUCKET_NAME=sharelocal-images
   ```

**Kosten:** ~€10-30/Monat (abhängig von Speicher und Traffic)

**Empfehlung:** Für Production bei größerem Volumen

---

### Option 3: IONOS Object Storage (S3-kompatibel)

**Beschreibung:**
IONOS bietet ebenfalls S3-kompatiblen Object Storage (ähnlich wie Scaleway).

**Vorteile:**
- ✅ **EU-Provider**: IONOS ist deutscher Provider (EU)
- ✅ **S3-kompatibel**: Standard AWS S3 API
- ✅ **Bekannt**: IONOS ist etablierter Provider

**Nachteile:**
- ⚠️ **Kosten**: Ähnlich wie Scaleway
- ⚠️ **Setup**: Benötigt Credentials und Bucket-Konfiguration
- ⚠️ **Komplexität**: Zusätzlicher Service zu verwalten

**Setup:**
1. IONOS Account erstellen
2. Object Storage aktivieren
3. Bucket erstellen
4. Access Keys generieren
5. Environment Variables setzen (ähnlich wie Scaleway)

**Kosten:** ~€10-30/Monat (abhängig von Speicher und Traffic)

**Empfehlung:** Alternative zu Scaleway, falls bereits IONOS-Kunde

**Hinweis:** IONOS Object Storage verwendet die gleiche S3-API wie Scaleway. Die Implementierung kann einfach angepasst werden, indem ein `IonosStorageService` erstellt wird (ähnlich wie `ScalewayStorageService`).

---

### Option 4: IONOS Object Storage (S3-kompatibel) - Empfohlen für Production

**Beschreibung:**
IONOS bietet Object Storage mit S3-kompatibler API.

**Vorteile:**
- ✅ **EU-Provider**: IONOS ist deutscher Provider (EU)
- ✅ **Konsistent**: Da bereits IONOS Server-Instanzen verwendet werden
- ✅ **S3-kompatibel**: Standard AWS S3 API
- ✅ **Einfache Integration**: Ein Account für Server und Storage

**Nachteile:**
- ⚠️ **Kosten**: ~€10-30/Monat (abhängig von Speicher und Traffic)
- ⚠️ **Setup**: Benötigt Credentials und Bucket-Konfiguration

**Kosten:** ~€10-30/Monat

**Empfehlung:** ✅ **Primäre Option für Production**, da bereits IONOS-Infrastruktur verwendet wird

---

## Empfehlung für MVP

### ✅ Server-basierte Speicherung (Option 1)

**Warum:**
1. **Einfachheit**: Keine zusätzlichen Services oder Credentials
2. **Kosten**: €0 zusätzliche Kosten
3. **Geschwindigkeit**: Schnelle Implementierung
4. **EU-konform**: Daten bleiben auf IONOS-Server (EU)
5. **Ausreichend**: Für MVP mit begrenzter Nutzerzahl völlig ausreichend

**Migration später:**
Wenn das Volumen wächst, kann einfach zu IONOS Object Storage migriert werden, da die `StorageService` Interface-abstrahiert ist. Da bereits IONOS Server-Instanzen verwendet werden, ist IONOS Object Storage die naheliegendste Option.

---

## Empfehlung für Production (nach MVP)

### IONOS Object Storage (primäre Empfehlung)

**Warum:**
1. **Konsistenz**: Bereits IONOS Server-Instanzen im Einsatz
2. **Skalierbarkeit**: Unbegrenzte Kapazität
3. **CDN-Integration**: Kann mit Cloudflare CDN kombiniert werden
4. **Backup**: Automatische Redundanz
5. **Performance**: Bessere Performance bei vielen Requests
6. **Ein Account**: Ein IONOS Account für Server und Storage

**Alternative:** Scaleway Object Storage (falls gewünscht)

**Migration:**
Die Migration von Server-Storage zu Cloud-Storage ist einfach, da die `StorageService` Interface-abstrahiert ist. Einfach den Storage Service in der Dependency Injection austauschen. Da bereits IONOS verwendet wird, ist IONOS Object Storage die naheliegendste Option.

---

## Implementierung

### Aktuelle Implementierung

Die API unterstützt bereits beide Modi:

1. **LocalStorageService**: Für lokale Entwicklung und Server-basierte Speicherung
2. **ScalewayStorageService**: Für Cloud-Storage (kann leicht für IONOS angepasst werden)

**Automatische Auswahl:**
- Local Development: Verwendet automatisch Local Storage
- Deployed (Dev/Prod): Kann Server-Storage oder Cloud-Storage verwenden

### Server-basierte Speicherung für Deployed Environments

**Setup:**
1. Volume im Docker Container mounten:
   ```yaml
   volumes:
     - ./uploads:/app/uploads
   ```

2. NGINX konfigurieren, um `/uploads/images/` zu servieren:
   ```nginx
   location /uploads/images/ {
     alias /path/to/uploads/images/;
     expires 30d;
     add_header Cache-Control "public, immutable";
   }
   ```

3. Environment Variable setzen (optional):
   ```
   STORAGE_TYPE=local
   LOCAL_STORAGE_DIR=/app/uploads/images
   LOCAL_STORAGE_PUBLIC_URL=https://nuernbergspots.de/uploads/images
   ```

### Cloud-Storage Setup

**Scaleway:**
```
STORAGE_TYPE=scaleway
SCALEWAY_ENDPOINT=https://s3.fr-par.scw.cloud
SCALEWAY_REGION=fr-par
SCALEWAY_ACCESS_KEY_ID=your-access-key
SCALEWAY_SECRET_ACCESS_KEY=your-secret-key
SCALEWAY_BUCKET_NAME=sharelocal-images
```

**IONOS:** (ähnlich, würde eigenen Service benötigen)
```
STORAGE_TYPE=ionos
IONOS_ENDPOINT=https://s3.ionos.com
IONOS_REGION=de
IONOS_ACCESS_KEY_ID=your-access-key
IONOS_SECRET_ACCESS_KEY=your-secret-key
IONOS_BUCKET_NAME=sharelocal-images
```

---

## Vergleichstabelle

| Kriterium | Server-Storage | IONOS Object Storage | Scaleway |
|-----------|----------------|----------------------|----------|
| **Kosten** | €0 | ~€10-30/Monat | ~€10-30/Monat |
| **Setup-Komplexität** | Niedrig | Mittel | Mittel |
| **Skalierbarkeit** | Begrenzt | Unbegrenzt | Unbegrenzt |
| **EU-konform** | ✅ | ✅ | ✅ |
| **CDN-Integration** | Manuell | ✅ | ✅ |
| **MVP-tauglich** | ✅ | ✅ | ✅ |
| **Konsistenz mit Infra** | ✅ (IONOS Server) | ✅ (IONOS Server) | ⚠️ (anderer Provider) |

---

## Fazit

**Für MVP:** ✅ **Server-basierte Speicherung** ist die beste Wahl
- Einfach, kostengünstig, EU-konform
- Später einfach migrierbar zu Cloud-Storage

**Für Production (nach MVP):** ✅ **Scaleway oder IONOS Object Storage**
- Skalierbar, CDN-ready, professionell
- Beide sind EU-Provider und S3-kompatibel

**IONOS Object Storage (Empfohlen):**
- ✅ Bereits IONOS Server-Instanzen im Einsatz
- ✅ Ein Account für Server und Storage
- ✅ Deutscher EU-Provider
- ✅ S3-kompatibel (gleiche API wie Scaleway)

**Scaleway Object Storage (Alternative):**
- Gute Option, aber zusätzlicher Provider
- Etwas bessere Developer-Experience
- Für MVP ist IONOS die konsistentere Wahl

---

## Setup-Anleitung für Server-basierte Speicherung (MVP)

### 1. Docker Volume hinzufügen

Füge in `docker-compose.yml` oder `docker-compose.dev.yml` / `docker-compose.prd.yml` ein Volume hinzu:

```yaml
services:
  api:
    volumes:
      - ./uploads:/app/uploads  # Mount uploads-Verzeichnis
      # ... andere volumes
```

### 2. NGINX-Konfiguration

**⚠️ WICHTIG:** Die NGINX-Konfiguration auf dem Server ist die Quelle der Wahrheit. Die Repository-Dateien repräsentieren nicht die aktuelle Server-Konfiguration.

Die NGINX-Konfiguration auf dem Server muss folgenden Location-Block enthalten:

```nginx
location /uploads/images/ {
    alias /var/www/sharelocal/uploads/images/;
    expires 30d;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin * always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

**Wichtig:** 
- Der Pfad `/var/www/sharelocal/uploads/images/` muss auf dem IONOS-Server existieren und mit dem Container-Volume synchronisiert sein.
- Prüfe die NGINX-Konfiguration direkt auf dem Server: `nginx -t` und `systemctl reload nginx`

### 3. Environment Variables (optional)

Für deployed Environments kannst du explizit Server-Storage verwenden:

```bash
# In .env oder Environment Variables
STORAGE_TYPE=local
LOCAL_STORAGE_DIR=/app/uploads/images
LOCAL_STORAGE_PUBLIC_URL=https://nuernbergspots.de/uploads/images
BASE_URL=https://nuernbergspots.de
```

**Oder:** Lass die Variablen leer - die API verwendet automatisch Server-Storage wenn keine Scaleway-Credentials gesetzt sind.

### 4. Verzeichnis erstellen

Auf dem Host-System:

```bash
mkdir -p /var/www/sharelocal/uploads/images
chmod 755 /var/www/sharelocal/uploads/images
```

### 5. Backup-Strategie

Füge das `uploads/` Verzeichnis zu deiner Backup-Strategie hinzu:

```bash
# Beispiel: Tägliches Backup
tar -czf backup-uploads-$(date +%Y%m%d).tar.gz /var/www/sharelocal/uploads/
```

---

## Migration zu Cloud-Storage (später)

Wenn das Volumen wächst, kann einfach zu Cloud-Storage migriert werden:

1. **Scaleway/IONOS Account erstellen**
2. **Bucket erstellen**
3. **Environment Variables setzen:**
   ```
   STORAGE_TYPE=scaleway
   SCALEWAY_ENDPOINT=https://s3.fr-par.scw.cloud
   SCALEWAY_REGION=fr-par
   SCALEWAY_ACCESS_KEY_ID=your-access-key
   SCALEWAY_SECRET_ACCESS_KEY=your-secret-key
   SCALEWAY_BUCKET_NAME=sharelocal-images
   ```
4. **Bestehende Bilder migrieren** (optionales Script)
5. **Deployment neu starten**

Die API wechselt automatisch zu Cloud-Storage, da die `StorageService` Interface-abstrahiert ist.

---

## Nächste Schritte

1. ✅ **MVP**: Server-basierte Speicherung implementieren
2. ✅ NGINX-Konfiguration für `/uploads/images/` hinzufügen
3. ✅ Docker Volume für `uploads/` mounten
4. ⏳ **Später**: Migration zu Cloud-Storage wenn Volumen wächst

