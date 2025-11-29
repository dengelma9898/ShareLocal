# PostgreSQL Options - Docker Container vs Managed

## Übersicht

Es gibt zwei Hauptoptionen für PostgreSQL auf dem IONOS-Server:

1. **Docker Container** (in docker-compose.yml)
2. **Managed PostgreSQL** (IONOS Database Service)

---

## Option 1: Docker Container PostgreSQL

### Wie es funktioniert

PostgreSQL läuft als Docker Container, gestartet via `docker-compose.yml`:

```yaml
postgres:
  image: postgres:17-alpine
  container_name: sharelocal-postgres
  environment:
    POSTGRES_USER: sharelocal
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: sharelocal
  volumes:
    - postgres_data:/var/lib/postgresql/data
  ports:
    - "5432:5432"
```

### Vorteile ✅

- **Kostenlos** - Keine zusätzlichen Kosten
- **Volle Kontrolle** - Du bestimmst Version, Konfiguration, Updates
- **Einfache Entwicklung** - Gleiche Umgebung lokal und auf Server
- **Einfache Backups** - Docker Volumes können einfach gesichert werden
- **Isolation** - Läuft in eigenem Container, getrennt von anderen Services
- **Portable** - Kann einfach auf anderen Servern deployed werden

### Nachteile ❌

- **Manuelle Wartung** - Du musst Updates, Backups, Monitoring selbst machen
- **Keine Hochverfügbarkeit** - Bei Container-Ausfall ist Database weg
- **Ressourcen-Sharing** - Teilt sich CPU/RAM mit anderen Containers
- **Keine automatischen Backups** - Du musst Backup-Strategie selbst implementieren
- **Keine Point-in-Time Recovery** - Komplexere Recovery-Szenarien schwieriger

### Wartung

**Updates:**
```bash
docker compose pull postgres
docker compose up -d postgres
```

**Backups:**
```bash
# Manuelles Backup
docker compose exec postgres pg_dump -U sharelocal sharelocal > backup.sql

# Automatische Backups (via Cron)
0 2 * * * docker compose exec -T postgres pg_dump -U sharelocal sharelocal > /backups/db_$(date +\%Y\%m\%d).sql
```

**Monitoring:**
- Du musst selbst Monitoring einrichten
- Health Checks via Docker Compose
- Logs: `docker compose logs postgres`

---

## Option 2: Managed PostgreSQL (IONOS)

### Wie es funktioniert

IONOS bietet einen verwalteten PostgreSQL-Service:

- **Dedicated Database Server** - Läuft separat von deinem Application Server
- **IONOS verwaltet** - Updates, Backups, Monitoring werden von IONOS gemacht
- **Connection String** - Du verbindest dich über eine externe URL

### Vorteile ✅

- **Automatische Backups** - Tägliche Backups, Retention Policy
- **Hochverfügbarkeit** - Redundanz, Failover, Replikation möglich
- **Automatische Updates** - IONOS kümmert sich um Security Patches
- **Monitoring** - IONOS überwacht Performance, Disk Space, etc.
- **Point-in-Time Recovery** - Kann zu jedem Zeitpunkt wiederhergestellt werden
- **Dedicated Ressourcen** - Eigene CPU/RAM, nicht geteilt
- **Weniger Wartung** - Du musst dich nicht um Database kümmern
- **Skalierbar** - Einfaches Upgraden von Ressourcen

### Nachteile ❌

- **Kosten** - Zusätzliche monatliche Kosten (~€15-30/Monat)
- **Weniger Kontrolle** - Du kannst nicht alles konfigurieren
- **Externe Dependency** - Database läuft auf anderem Server
- **Network Latency** - Minimale Latenz durch externe Verbindung
- **Vendor Lock-in** - Abhängig von IONOS

### Konfiguration

**Connection String:**
```env
DATABASE_URL=postgresql://user:password@db123.ionos.com:5432/sharelocal?schema=public&sslmode=require
```

**In docker-compose.yml:**
```yaml
api:
  environment:
    DATABASE_URL: ${DATABASE_URL}  # Externe Managed DB URL
  # Kein depends_on postgres mehr nötig
```

---

## Vergleich

| Feature | Docker Container | Managed PostgreSQL |
|---------|------------------|-------------------|
| **Kosten** | ✅ Kostenlos | ❌ ~€15-30/Monat |
| **Setup** | ✅ Einfach (docker-compose) | ⚠️ IONOS Dashboard |
| **Wartung** | ❌ Du machst alles | ✅ IONOS macht alles |
| **Backups** | ❌ Manuell | ✅ Automatisch |
| **Updates** | ❌ Manuell | ✅ Automatisch |
| **Hochverfügbarkeit** | ❌ Nein | ✅ Ja |
| **Monitoring** | ❌ Selbst einrichten | ✅ Inklusive |
| **Kontrolle** | ✅ Volle Kontrolle | ⚠️ Eingeschränkt |
| **Performance** | ⚠️ Geteilte Ressourcen | ✅ Dedicated |
| **Skalierbarkeit** | ⚠️ Begrenzt | ✅ Einfach |

---

## Empfehlung

### Für MVP / Entwicklung: **Docker Container** ✅

**Warum:**
- ✅ Kostenlos
- ✅ Einfaches Setup
- ✅ Ausreichend für MVP
- ✅ Einfache Entwicklung (gleiche Umgebung lokal)

**Wann umsteigen:**
- Wenn du >1000 aktive Nutzer hast
- Wenn Hochverfügbarkeit wichtig wird
- Wenn du keine Zeit für Database-Wartung hast
- Wenn automatische Backups kritisch sind

### Für Production (später): **Managed PostgreSQL** ✅

**Warum:**
- ✅ Automatische Backups (kritisch für Production)
- ✅ Hochverfügbarkeit
- ✅ Weniger Wartung
- ✅ Professionelles Monitoring

---

## Migration von Docker zu Managed

Falls du später migrieren möchtest:

### 1. Managed DB erstellen
- IONOS Dashboard → Database Service erstellen
- Connection String notieren

### 2. Daten migrieren
```bash
# Export von Docker Container
docker compose exec postgres pg_dump -U sharelocal sharelocal > backup.sql

# Import in Managed DB
psql -h db123.ionos.com -U user -d sharelocal < backup.sql
```

### 3. Environment Variable ändern
```env
# Alte (Docker Container)
DATABASE_URL=postgresql://sharelocal:password@postgres:5432/sharelocal

# Neue (Managed)
DATABASE_URL=postgresql://user:password@db123.ionos.com:5432/sharelocal?sslmode=require
```

### 4. docker-compose.yml anpassen
```yaml
# Entferne postgres Service
# Entferne depends_on postgres von api
```

---

## Für ShareLocal MVP

### Empfehlung: **Docker Container** ✅

**Gründe:**
1. **Kostenlos** - Wichtig für MVP
2. **Einfaches Setup** - Läuft mit `docker compose up`
3. **Ausreichend** - Für MVP mit wenigen Nutzern perfekt
4. **Einfache Backups** - Script bereits erstellt
5. **Später migrierbar** - Einfach zu Managed DB wechseln

**Backup-Strategie:**
- Tägliche Backups via Cron (Script in `docs/IONOS_DEPLOYMENT.md`)
- Backups auf Server speichern
- Optional: Backups zu externem Storage kopieren

**Monitoring:**
- Health Checks via Docker Compose
- Logs: `docker compose logs postgres`
- Optional: Prometheus/Grafana später

---

## Entscheidungshilfe

**Wähle Docker Container wenn:**
- ✅ MVP / Entwicklung
- ✅ Budget ist begrenzt
- ✅ Du willst volle Kontrolle
- ✅ Du hast Zeit für Wartung

**Wähle Managed PostgreSQL wenn:**
- ✅ Production mit vielen Nutzern
- ✅ Hochverfügbarkeit wichtig
- ✅ Automatische Backups kritisch
- ✅ Du willst weniger Wartung

---

## Für ShareLocal

**Empfehlung für jetzt:** Docker Container ✅

**Später migrieren zu:** Managed PostgreSQL (wenn nötig)

**Backup-Strategie:** Tägliche automatische Backups (Script vorhanden)

