# PostgreSQL Container-Namen - Übersicht

## Übersicht

Wenn du unterschiedliche Passwords für Dev und Prd verwendest, brauchst du separate PostgreSQL Container mit unterschiedlichen Namen.

---

## Container-Namen Konvention

### Option 1: Ein Container (einfach)

**Container-Name:** `sharelocal-postgres`

**Verwendung:**
- Production: `postgresql://sharelocal:<password>@sharelocal-postgres:5432/sharelocal?schema=public`
- Development: `postgresql://sharelocal:<password>@sharelocal-postgres:5432/sharelocal_dev?schema=public`

**Vorteil:** Ein Container, einfacher zu verwalten

---

### Option 2: Separate Container (sicherer)

**Production Container-Name:** `sharelocal-postgres-prd`  
**Development Container-Name:** `sharelocal-postgres-dev`

**Verwendung:**
- Production: `postgresql://sharelocal:<password-prd>@sharelocal-postgres-prd:5432/sharelocal?schema=public`
- Development: `postgresql://sharelocal:<password-dev>@sharelocal-postgres-dev:5432/sharelocal_dev?schema=public`

**Vorteil:** Bessere Isolation, separate Volumes

---

## Wichtig: Container-Name in DATABASE_URL

**Der Container-Name in der DATABASE_URL muss exakt mit dem Container-Namen übereinstimmen!**

### Beispiel: Separate Container

**Server Setup:**
```bash
# Production Container
docker run -d --name sharelocal-postgres-prd ...

# Development Container  
docker run -d --name sharelocal-postgres-dev ...
```

**GitHub Secrets:**

✅ **Korrekt:**
```
DATABASE_URL_PRD=postgresql://sharelocal:<password>@sharelocal-postgres-prd:5432/sharelocal?schema=public
DATABASE_URL_DEV=postgresql://sharelocal:<password>@sharelocal-postgres-dev:5432/sharelocal_dev?schema=public
```

❌ **Falsch:**
```
DATABASE_URL_PRD=postgresql://sharelocal:<password>@sharelocal-postgres:5432/sharelocal?schema=public
#                                                              ^^^^^^^^^^^^^^^^^^^^
#                                                              Falscher Name!
```

---

## Container-Namen prüfen

```bash
ssh root@87.106.208.51

# Zeige alle PostgreSQL Container
docker ps | grep postgres

# Beispiel Output:
# CONTAINER ID   IMAGE                NAMES
# abc123def456   postgres:17-alpine   sharelocal-postgres-prd
# def456ghi789   postgres:17-alpine   sharelocal-postgres-dev
```

---

## Troubleshooting

### Problem: "could not translate host name"

**Ursache:** Container-Name in DATABASE_URL stimmt nicht mit tatsächlichem Container-Namen überein

**Lösung:**
1. Prüfe Container-Namen: `docker ps | grep postgres`
2. Passe DATABASE_URL an: Container-Name muss exakt übereinstimmen
3. Prüfe ob Container im gleichen Network ist: `docker network inspect sharelocal-network`

### Problem: "password authentication failed"

**Ursache:** Password in DATABASE_URL stimmt nicht mit Container-Password überein

**Lösung:**
1. Prüfe Container-Password: `docker inspect sharelocal-postgres-prd | grep POSTGRES_PASSWORD`
2. Passe DATABASE_URL an: Password muss exakt übereinstimmen

---

## Empfehlung

**Für MVP:** Option 1 (ein Container) - einfacher  
**Für Production:** Option 2 (separate Container) - sicherer

