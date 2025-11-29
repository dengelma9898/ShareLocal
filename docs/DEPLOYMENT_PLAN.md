# Deployment Plan - ShareLocal Online

## Übersicht

Dieses Dokument beschreibt, was benötigt wird, um ShareLocal online zugänglich zu machen.

## Was wir brauchen

### 1. Infrastructure Components

#### ✅ Bereits vorhanden
- ✅ Health Checks (`/health`, `/health/live`, `/health/ready`)
- ✅ Structured Logging (Winston)
- ✅ Environment Variable Validation
- ✅ Rate Limiting & Security Headers
- ✅ CI/CD Pipeline (GitHub Actions)

#### ❌ Noch zu erstellen
- ❌ Docker Container für API & Web
- ❌ Docker Compose Setup
- ❌ Reverse Proxy (Nginx/Traefik)
- ❌ SSL/TLS Setup (Let's Encrypt)
- ❌ Database Migration Strategy
- ❌ Deployment Workflow
- ❌ Backup Strategy
- ❌ Monitoring Setup

---

## Deployment-Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Cloudflare (CDN + DNS)                     │
│              - EU-Regionen                              │
│              - DDoS-Schutz                             │
│              - SSL-Termination (optional)              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Hetzner Cloud Server (EU)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Nginx/Traefik (Reverse Proxy + SSL)            │   │
│  │  - Let's Encrypt SSL-Zertifikate                │   │
│  │  - Load Balancing (später)                      │   │
│  └───────────┬──────────────────┬──────────────────┘   │
│              │                  │                        │
│  ┌───────────▼──────────┐  ┌───▼──────────────────┐   │
│  │  Next.js Web (3000)  │  │  Express API (3001)   │   │
│  │  - Docker Container  │  │  - Docker Container    │   │
│  └──────────────────────┘  └──────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  PostgreSQL 17.x                                │   │
│  │  - Managed Database (Hetzner)                    │   │
│  │  - Oder Docker Container                         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Schritt-für-Schritt Plan

### Phase 1: Docker Setup (MVP) ⏱️ ~2-3 Stunden

1. **Dockerfiles erstellen**
   - `packages/api/Dockerfile` - Multi-stage Build für API
   - `packages/web/Dockerfile` - Multi-stage Build für Next.js
   - `.dockerignore` Dateien

2. **Docker Compose Setup**
   - `docker-compose.yml` - Lokale Entwicklung
   - `docker-compose.prod.yml` - Production Setup
   - Environment Variables Management

3. **Build & Test**
   - Lokal testen mit Docker Compose
   - Images bauen und testen

### Phase 2: Server Setup (MVP) ⏱️ ~3-4 Stunden

1. **Hetzner Cloud Server**
   - Server erstellen (Ubuntu 24.04 LTS)
   - SSH-Zugang konfigurieren
   - Firewall einrichten

2. **Docker Installation**
   - Docker 27.x installieren
   - Docker Compose v2 installieren

3. **Reverse Proxy Setup**
   - Nginx oder Traefik installieren
   - SSL mit Let's Encrypt (Certbot)
   - Domain-Konfiguration

4. **Database Setup**
   - PostgreSQL 17.x installieren (oder Managed DB)
   - Backup-Strategie einrichten

### Phase 3: Deployment Automation ⏱️ ~2-3 Stunden

1. **GitHub Actions Deployment**
   - Deployment Workflow erstellen
   - Secrets konfigurieren
   - Automated Deployments

2. **Migration Strategy**
   - Prisma Migrations automatisch ausführen
   - Rollback-Strategie

3. **Environment Management**
   - Production `.env` Template
   - Secrets Management

### Phase 4: Monitoring & Backup ⏱️ ~2 Stunden

1. **Monitoring**
   - Health Check Monitoring
   - Log Aggregation
   - Error Tracking (optional)

2. **Backup**
   - Database Backups (täglich)
   - Backup Retention Policy

---

## Technische Details

### Server-Anforderungen (MVP)

**Minimum:**
- **CPU**: 2 vCPU
- **RAM**: 4 GB
- **Storage**: 40 GB SSD
- **Network**: 20 TB Traffic/Monat
- **Kosten**: ~€8-12/Monat (Hetzner Cloud CPX21)

**Empfohlen (für Wachstum):**
- **CPU**: 4 vCPU
- **RAM**: 8 GB
- **Storage**: 80 GB SSD
- **Network**: 20 TB Traffic/Monat
- **Kosten**: ~€16-20/Monat (Hetzner Cloud CPX41)

### Domain & DNS

**Benötigt:**
- Domain-Registrierung (z.B. `.de`, `.eu`, `.org`)
- DNS-Konfiguration:
  - `A` Record → Server IP
  - `CNAME` für `www` → Hauptdomain
  - Optional: `CNAME` für `api` → Hauptdomain

**Empfohlene Domain-Registrare (EU):**
- Hetzner Domain (günstig, EU)
- INWX (EU)
- Namecheap (EU-Regionen)

### SSL/TLS

**Let's Encrypt (kostenlos):**
- Automatische Zertifikats-Erneuerung
- Wildcard-Zertifikate möglich
- Integration mit Nginx/Traefik

### Database

**Optionen:**
1. **Managed PostgreSQL** (Hetzner)
   - ✅ Automatische Backups
   - ✅ Hochverfügbarkeit
   - ✅ Einfaches Management
   - ❌ Zusätzliche Kosten (~€15-30/Monat)

2. **Self-hosted PostgreSQL** (Docker)
   - ✅ Kostenlos
   - ✅ Volle Kontrolle
   - ❌ Manuelle Backups nötig
   - ❌ Mehr Wartung

**Empfehlung für MVP:** Self-hosted mit automatischen Backups

---

## Nächste Schritte

1. ✅ Docker Setup erstellen
2. ✅ Docker Compose konfigurieren
3. ✅ Deployment-Dokumentation
4. ⏳ Server einrichten (manuell)
5. ⏳ Domain & DNS konfigurieren
6. ⏳ SSL-Zertifikate einrichten
7. ⏳ Erste Deployment durchführen

---

## Checkliste für Production-Deployment

### Vor dem Deployment
- [ ] Alle Tests bestehen (CI Pipeline)
- [ ] Environment Variables dokumentiert
- [ ] Secrets sicher gespeichert (GitHub Secrets)
- [ ] Database Migrations getestet
- [ ] Backup-Strategie implementiert
- [ ] Monitoring eingerichtet
- [ ] SSL-Zertifikate konfiguriert
- [ ] Domain & DNS konfiguriert

### Nach dem Deployment
- [ ] Health Checks funktionieren
- [ ] SSL-Zertifikate gültig
- [ ] API erreichbar
- [ ] Web-App erreichbar
- [ ] Database-Verbindung funktioniert
- [ ] Logs werden gespeichert
- [ ] Backups laufen
- [ ] Monitoring aktiv

---

## Kosten-Schätzung (MVP)

**Monatliche Kosten:**
- Hetzner Cloud Server: €8-12
- Domain: €10-15/Jahr (~€1/Monat)
- Cloudflare: €0 (Free Tier)
- **Gesamt: ~€9-13/Monat**

**Optional:**
- Managed PostgreSQL: +€15-30/Monat
- Monitoring (z.B. Better Uptime): +€0-10/Monat

---

## Sicherheits-Checkliste

- [ ] HTTPS überall (Let's Encrypt)
- [ ] Firewall konfiguriert (nur notwendige Ports)
- [ ] SSH Key-basiert (kein Passwort-Login)
- [ ] Rate Limiting aktiv
- [ ] Security Headers (Helmet.js)
- [ ] Environment Variables verschlüsselt
- [ ] Database nicht öffentlich zugänglich
- [ ] Regelmäßige Updates (automatisch)
- [ ] Backups verschlüsselt
- [ ] Logs rotieren (Winston Daily Rotate)

---

## Support & Dokumentation

- **Deployment-Guide**: `docs/DEPLOYMENT_GUIDE.md` (zu erstellen)
- **Troubleshooting**: `docs/TROUBLESHOOTING.md` (zu erstellen)
- **Server-Setup**: `docs/SERVER_SETUP.md` (zu erstellen)

