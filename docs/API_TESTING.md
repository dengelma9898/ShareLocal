# API Testing Guide - ShareLocal

## Übersicht

Diese Anleitung zeigt dir, wie du die deployed API testen kannst.

---

## API Zugriff

**Development Environment:**
- **URL (über Nginx - empfohlen)**: `http://nuernbergspots.de/share-local/dev/api`
- **URL (direkt, falls Nginx nicht konfiguriert)**: `http://nuernbergspots.de:3001`
- **Port**: `3001` (intern)

**Production Environment:**
- **URL (über Nginx)**: `https://nuernbergspots.de/share-local/prd/api`
- **Port**: `3101` (intern, analog zu anderen Apps: 3100)

> **Wichtig**: Die API sollte über Nginx unter `/share-local/dev/api` erreichbar sein. Falls Nginx noch nicht konfiguriert ist, siehe Abschnitt "Nginx Setup" weiter unten.

---

## Schnelltest: Health Check

### Option A: Über Nginx (empfohlen)

```bash
# Health Check über Nginx
curl http://nuernbergspots.de/share-local/dev/health

# Oder direkt API Root
curl http://nuernbergspots.de/share-local/dev/api/
```

### Option B: Direkt über Port (falls Nginx nicht konfiguriert)

```bash
# Einfacher Health Check
curl http://nuernbergspots.de:3001/health/live
```

### 1. Einfacher Health Check (API läuft?)

**Über Nginx:**
```bash
curl http://nuernbergspots.de/share-local/dev/health
```

**Direkt (falls Nginx nicht konfiguriert):**
```bash
curl http://nuernbergspots.de:3001/health/live
```

**Erwartete Antwort:**
```json
{
  "status": "ok",
  "message": "API is alive"
}
```

### 2. Vollständiger Health Check (alle Services)

**Über Nginx:**
```bash
curl http://nuernbergspots.de/share-local/dev/health
```

**Direkt (falls Nginx nicht konfiguriert):**
```bash
curl http://nuernbergspots.de:3001/health
```

**Erwartete Antwort:**
```json
{
  "status": "ok",
  "checks": {
    "api": "ok",
    "database": "ok",
    "encryption": "ok"
  },
  "timestamp": "2025-11-29T22:00:00.000Z",
  "uptime": 3600,
  "version": "0.1.0"
}
```

### 3. Readiness Check (API bereit für Requests?)

**Über Nginx:**
```bash
curl http://nuernbergspots.de/share-local/dev/health
```

**Direkt (falls Nginx nicht konfiguriert):**
```bash
curl http://nuernbergspots.de:3001/health/ready
```

---

## Verfügbare Endpoints

### Root Endpoint

**Über Nginx:**
```bash
curl http://nuernbergspots.de/share-local/dev/api/
```

**Direkt (falls Nginx nicht konfiguriert):**
```bash
curl http://nuernbergspots.de:3001/
```

**Antwort:**
```json
{
  "message": "ShareLocal API",
  "version": "0.1.0"
}
```

---

### Authentication

#### User registrieren

**Über Nginx:**
```bash
curl -X POST http://nuernbergspots.de/share-local/dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User"
  }'
```

**Direkt (falls Nginx nicht konfiguriert):**
```bash
curl -X POST http://nuernbergspots.de:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User"
  }'
```

**Erwartete Antwort:**
```json
{
  "data": {
    "id": "uuid",
    "email": "test@example.com",
    "name": "Test User",
    "emailVerified": false,
    "role": "USER"
  }
}
```

#### User einloggen

**Über Nginx:**
```bash
curl -X POST http://nuernbergspots.de/share-local/dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

**Direkt (falls Nginx nicht konfiguriert):**
```bash
curl -X POST http://nuernbergspots.de:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

**Erwartete Antwort:**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "name": "Test User"
    }
  }
}
```

**Wichtig:** Speichere den `token` für weitere Requests!

---

### Users

#### Alle User abrufen

```bash
curl http://nuernbergspots.de:3001/api/users
```

#### User nach ID abrufen

```bash
curl http://nuernbergspots.de:3001/api/users/{userId}
```

#### Eigener User (Protected - benötigt Token)

```bash
curl http://nuernbergspots.de:3001/api/users/me \
  -H "Authorization: Bearer {dein-token}"
```

---

### Listings

#### Alle Listings abrufen

```bash
curl http://nuernbergspots.de:3001/api/listings
```

#### Listings mit Filtern

```bash
# Nach Kategorie filtern
curl "http://nuernbergspots.de:3001/api/listings?category=TOOL"

# Nach Typ filtern
curl "http://nuernbergspots.de:3001/api/listings?type=OFFER"

# Suche
curl "http://nuernbergspots.de:3001/api/listings?search=Bohrschrauber"

# Kombiniert
curl "http://nuernbergspots.de:3001/api/listings?category=TOOL&type=OFFER&available=true"
```

#### Listing erstellen (Protected - benötigt Token)

```bash
curl -X POST http://nuernbergspots.de:3001/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {dein-token}" \
  -d '{
    "title": "Bohrschrauber zu verleihen",
    "description": "Professioneller Akku-Bohrschrauber",
    "category": "TOOL",
    "type": "OFFER",
    "location": "Nürnberg",
    "available": true,
    "tags": ["werkzeug", "bohrschrauber"]
  }'
```

---

## Test-Workflow

### Schritt 1: Health Check

**Über Nginx (empfohlen):**
```bash
# Prüfe ob API läuft
curl http://nuernbergspots.de/share-local/dev/health

# Prüfe alle Services
curl http://nuernbergspots.de/share-local/dev/health
```

**Direkt (falls Nginx nicht konfiguriert):**
```bash
# Prüfe ob API läuft
curl http://nuernbergspots.de:3001/health/live

# Prüfe alle Services
curl http://nuernbergspots.de:3001/health
```

### Schritt 2: User registrieren

**Über Nginx:**
```bash
curl -X POST http://nuernbergspots.de/share-local/dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User"
  }'
```

**Direkt:**
```bash
curl -X POST http://nuernbergspots.de:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User"
  }'
```

### Schritt 3: User einloggen (Token holen)

**Über Nginx:**
```bash
curl -X POST http://nuernbergspots.de/share-local/dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

**Direkt:**
```bash
curl -X POST http://nuernbergspots.de:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

**Kopiere den `token` aus der Antwort!**

### Schritt 4: Protected Endpoint testen

**Über Nginx:**
```bash
# Ersetze {dein-token} mit dem Token aus Schritt 3
curl http://nuernbergspots.de/share-local/dev/api/users/me \
  -H "Authorization: Bearer {dein-token}"
```

**Direkt:**
```bash
# Ersetze {dein-token} mit dem Token aus Schritt 3
curl http://nuernbergspots.de:3001/api/users/me \
  -H "Authorization: Bearer {dein-token}"
```

### Schritt 5: Listing erstellen

**Über Nginx:**
```bash
curl -X POST http://nuernbergspots.de/share-local/dev/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {dein-token}" \
  -d '{
    "title": "Test Listing",
    "description": "Test Beschreibung",
    "category": "TOOL",
    "type": "OFFER",
    "location": "Nürnberg",
    "available": true,
    "tags": ["test"]
  }'
```

**Direkt:**
```bash
curl -X POST http://nuernbergspots.de:3001/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {dein-token}" \
  -d '{
    "title": "Test Listing",
    "description": "Test Beschreibung",
    "category": "TOOL",
    "type": "OFFER",
    "location": "Nürnberg",
    "available": true,
    "tags": ["test"]
  }'
```

---

## Troubleshooting

### Problem: "Connection refused"

**Lösung:**
- Prüfe ob Container läuft: `ssh root@87.106.208.51 "docker ps | grep sharelocal-api-dev"`
- Prüfe ob Port 3001 offen ist: `ssh root@87.106.208.51 "netstat -tuln | grep 3001"`

### Problem: "Database connection error"

**Lösung:**
- Prüfe ob PostgreSQL Container läuft: `ssh root@87.106.208.51 "docker ps | grep postgres"`
- Prüfe Container-Logs: `ssh root@87.106.208.51 "docker logs sharelocal-api-dev"`

### Problem: "401 Unauthorized"

**Lösung:**
- Stelle sicher, dass du einen gültigen Token verwendest
- Token muss im Format `Authorization: Bearer {token}` gesendet werden
- Token könnte abgelaufen sein - logge dich neu ein

---

## Nützliche Befehle

### Container-Status prüfen

```bash
ssh root@87.106.208.51 "docker ps | grep sharelocal"
```

### Container-Logs ansehen

```bash
ssh root@87.106.208.51 "docker logs sharelocal-api-dev --tail 50"
```

### Container-Logs live verfolgen

```bash
ssh root@87.106.208.51 "docker logs -f sharelocal-api-dev"
```

### Container neu starten

```bash
ssh root@87.106.208.51 "docker restart sharelocal-api-dev"
```

---

## Beispiel: Kompletter Test-Workflow

```bash
# 1. Health Check
curl http://nuernbergspots.de:3001/health

# 2. Registrieren
TOKEN=$(curl -s -X POST http://nuernbergspots.de:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456","name":"Test User"}' \
  | jq -r '.data.token')

# 3. Eigener User abrufen
curl http://nuernbergspots.de:3001/api/users/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Listing erstellen
curl -X POST http://nuernbergspots.de:3001/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test","description":"Test","category":"TOOL","type":"OFFER","location":"Nürnberg","available":true,"tags":["test"]}'
```

---

## Nginx Setup (falls noch nicht konfiguriert)

Falls die API noch nicht über Nginx erreichbar ist, musst du die Nginx-Konfiguration auf dem Server installieren:

### 1. Nginx-Konfiguration kopieren

```bash
ssh root@87.106.208.51

# Kopiere die Dev-Konfiguration
cp /path/to/repo/infrastructure/nginx/share-local-dev.conf /etc/nginx/sites-available/share-local-dev

# Erstelle Symlink
ln -sf /etc/nginx/sites-available/share-local-dev /etc/nginx/sites-enabled/

# Teste die Konfiguration
nginx -t

# Lade Nginx neu
systemctl reload nginx
```

### 2. Prüfe ob Nginx läuft

```bash
systemctl status nginx
```

### 3. Teste die API über Nginx

```bash
curl http://nuernbergspots.de/share-local/dev/health
```

### 4. Falls Probleme auftreten

```bash
# Prüfe Nginx-Logs
tail -f /var/log/nginx/error.log

# Prüfe ob Container läuft
docker ps | grep sharelocal-api-dev

# Prüfe ob Port 3001 erreichbar ist (lokal)
curl http://localhost:3001/health
```

---

## Weitere Informationen

- **API Dokumentation**: Siehe `packages/api/README.md`
- **HTTP Test Dateien**: Siehe `packages/api/http/api.http` (für REST Client Extension)
- **Protected Routes**: Siehe `packages/api/http/protected-routes.http`
- **Nginx Konfiguration**: Siehe `infrastructure/nginx/share-local-dev.conf`

