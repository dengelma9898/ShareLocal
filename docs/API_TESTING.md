# API Testing Guide - ShareLocal

## Übersicht

Diese Anleitung zeigt dir, wie du die deployed API testen kannst.

---

## API Zugriff

**Development Environment:**
- **URL**: `http://nuernbergspots.de:3001` (direkt) oder `http://nuernbergspots.de/share-local/dev/api` (über Nginx, falls konfiguriert)
- **Port**: `3001`

**Production Environment:**
- **URL**: `https://nuernbergspots.de/share-local/prd/api` (über Nginx)
- **Port**: `3001` (intern)

---

## Schnelltest: Health Check

### 1. Einfacher Health Check (API läuft?)

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

```bash
curl http://nuernbergspots.de:3001/health/ready
```

---

## Verfügbare Endpoints

### Root Endpoint

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

```bash
# Prüfe ob API läuft
curl http://nuernbergspots.de:3001/health/live

# Prüfe alle Services
curl http://nuernbergspots.de:3001/health
```

### Schritt 2: User registrieren

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

```bash
# Ersetze {dein-token} mit dem Token aus Schritt 3
curl http://nuernbergspots.de:3001/api/users/me \
  -H "Authorization: Bearer {dein-token}"
```

### Schritt 5: Listing erstellen

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

## Weitere Informationen

- **API Dokumentation**: Siehe `packages/api/README.md`
- **HTTP Test Dateien**: Siehe `packages/api/http/api.http` (für REST Client Extension)
- **Protected Routes**: Siehe `packages/api/http/protected-routes.http`

