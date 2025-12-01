# Manuelle Migration-Ausführung

## Problem: Migrationen wurden nie ausgeführt

Wenn `_prisma_migrations` leer ist, wurden die Migrationen noch nie ausgeführt.

## Lösung 1: Migrationen direkt in der Datenbank ausführen

Falls die Migration-Dateien im Container fehlen, können wir die Migration direkt ausführen:

```bash
# Migration-SQL direkt ausführen
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -f - <<'EOF'
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ListingCategory" AS ENUM ('TOOL', 'PLANT', 'SKILL', 'PRODUCT', 'TIME', 'OTHER');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('OFFER', 'REQUEST');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ListingCategory" NOT NULL,
    "type" "ListingType" NOT NULL,
    "userId" TEXT NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "pricePerDay" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'EUR',
    "available" BOOLEAN NOT NULL DEFAULT true,
    "images" TEXT[],
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "listings_userId_idx" ON "listings"("userId");

-- CreateIndex
CREATE INDEX "listings_category_idx" ON "listings"("category");

-- CreateIndex
CREATE INDEX "listings_type_idx" ON "listings"("type");

-- CreateIndex
CREATE INDEX "listings_available_idx" ON "listings"("available");

-- CreateIndex
CREATE INDEX "listings_createdAt_idx" ON "listings"("createdAt");

-- CreateIndex
CREATE INDEX "listings_latitude_longitude_idx" ON "listings"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "conversations_listingId_idx" ON "conversations"("listingId");

-- CreateIndex
CREATE INDEX "conversations_updatedAt_idx" ON "conversations"("updatedAt");

-- CreateIndex
CREATE INDEX "conversation_participants_userId_idx" ON "conversation_participants"("userId");

-- CreateIndex
CREATE INDEX "conversation_participants_conversationId_idx" ON "conversation_participants"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON "conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migration in History registrieren
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES (
    '20251125212522_init',
    'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    NOW(),
    '20251125212522_init',
    NULL,
    NULL,
    NOW(),
    1
);
EOF
```

**Aber:** Das ist kompliziert. Besser: Migration-Datei direkt ausführen.

## Lösung 2: Migration-Datei direkt ausführen (Einfacher)

```bash
# Migration-Datei lokal kopieren und ausführen
# 1. Migration-Datei vom lokalen System in Container kopieren
docker cp packages/database/prisma/migrations/20251125212522_init/migration.sql sharelocal-postgres-dev:/tmp/migration.sql

# 2. Migration ausführen
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -f /tmp/migration.sql

# 3. Migration in History registrieren (manuell)
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES ('20251125212522_init', 'manual', NOW(), '20251125212522_init', NOW(), 1);"

# 4. Tabellen prüfen
docker exec sharelocal-postgres-dev psql -U sharelocal -d sharelocal_dev -c "\dt"
```

## Lösung 3: Container neu bauen (Beste Lösung)

Falls Migration-Dateien im Container fehlen, Container neu bauen:

```bash
# CI-Pipeline erneut ausführen oder manuell:
# 1. Container stoppen
docker stop sharelocal-api-dev
docker rm sharelocal-api-dev

# 2. Neues Image pullen (wird automatisch gebaut)
docker pull dengelma/sharelocal-api-dev:latest

# 3. Container neu starten (Migrationen werden im CI ausgeführt)
# Oder manuell Migrationen ausführen
```

## Empfohlene Lösung

**Für jetzt:** Lösung 2 (Migration-Datei direkt ausführen) - schnellste Lösung

**Für später:** Lösung 3 (Container neu bauen) - sauberste Lösung

