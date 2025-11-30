# Docker Compose Status - ShareLocal

## Übersicht

Docker Compose Dateien werden **NUR für lokale Entwicklung** verwendet, **NICHT für Server-Deployment**.

---

## Verwendung

### Lokale Entwicklung

```bash
# Development mit Hot Reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production (lokal testen)
docker-compose -f docker-compose.yml -f docker-compose.prd.yml up

# Mit Docker Hub Images (statt lokal bauen)
docker-compose -f docker-compose.yml -f docker-compose.dev.registry.yml up
```

### Server-Deployment

**Wird NICHT verwendet!** Server-Deployment verwendet:
- GitHub Actions CI/CD Workflows
- `docker run` direkt (siehe `.github/workflows/ci-*.yml`)

---

## Dateien-Übersicht

| Datei | Verwendung | Status |
|-------|------------|--------|
| `docker-compose.yml` | Basis-Konfiguration | ✅ Für lokale Entwicklung |
| `docker-compose.dev.yml` | Development Override | ✅ Für lokale Entwicklung |
| `docker-compose.prd.yml` | Production Override | ✅ Für lokale Entwicklung |
| `docker-compose.dev.registry.yml` | Dev mit Docker Hub Images | ✅ Optional |
| `docker-compose.prd.registry.yml` | Prd mit Docker Hub Images | ✅ Optional |

---

## Port-Unterschiede

**Wichtig:** Ports in docker-compose sind anders als CI/CD!

| Service | docker-compose | CI/CD Deployment |
|---------|----------------|-------------------|
| Web Dev | 3000 | 3002 |
| Web Prd | 3000 | 3102 |
| API Dev | 3001 | 3001 |
| API Prd | 3001 | 3101 |

**Warum unterschiedlich?**
- docker-compose: Für lokale Entwicklung (Ports können frei gewählt werden)
- CI/CD: Für Server-Deployment (Ports 3000/3100 bereits belegt, daher 3002/3102)

---

## Environment Variables

### docker-compose.yml (Basis)

```yaml
web:
  build:
    args:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3001}
      NEXT_PUBLIC_BASE_PATH: ${NEXT_PUBLIC_BASE_PATH:-}  # Leer für lokale Entwicklung
  environment:
    PORT: 3000
    NEXT_PUBLIC_BASE_PATH: ${NEXT_PUBLIC_BASE_PATH:-}  # Leer für lokale Entwicklung
```

**Hinweis:** `basePath` ist leer für lokale Entwicklung (läuft auf `/`)

### docker-compose.dev.yml

```yaml
web:
  environment:
    NEXT_PUBLIC_BASE_PATH: /share-local/dev  # ✅ Gesetzt
```

**Hinweis:** Überschreibt basePath für lokale Entwicklung

### docker-compose.prd.yml

```yaml
web:
  build:
    args:
      NEXT_PUBLIC_BASE_PATH: /share-local/prd  # ✅ Gesetzt
  environment:
    NEXT_PUBLIC_BASE_PATH: /share-local/prd  # ✅ Gesetzt
```

---

## Empfehlung

**Behalten:** Docker Compose Dateien sind nützlich für:
- ✅ Lokale Entwicklung
- ✅ Testing
- ✅ Einfaches Setup

**Aber:** Klar dokumentieren, dass sie NICHT für Server-Deployment verwendet werden!

---

## Zusammenfassung

- ✅ Docker Compose Dateien sind korrekt für lokale Entwicklung
- ✅ Port-Unterschiede sind OK (lokal vs. Server)
- ✅ Environment Variables sind korrekt gesetzt
- ✅ CI/CD verwendet `docker run` direkt (nicht docker-compose)

