#!/bin/bash
# Migration Verification Script
# Führt manuelle Verifizierung der Migrationen durch
# Kann lokal oder auf dem Server ausgeführt werden

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Migration Verification Script"
echo "=================================="
echo ""

# Configuration
CONTAINER_NAME="${CONTAINER_NAME:-sharelocal-api-dev}"
IMAGE_NAME="${IMAGE_NAME:-dengelma/sharelocal-api-dev:latest}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-sharelocal-postgres-dev}"
DB_NAME="${DB_NAME:-sharelocal_dev}"
DB_USER="${DB_USER:-sharelocal}"

# Check if running in CI or locally
if [ -n "$CI" ]; then
    echo "📋 Running in CI environment"
    NETWORK_FLAG="--network sharelocal-network"
else
    echo "📋 Running locally"
    NETWORK_FLAG=""
fi

echo ""
echo "1️⃣ Checking migration files in container..."
echo "-------------------------------------------"

if docker run --rm $NETWORK_FLAG --user root $IMAGE_NAME \
    sh -c "ls -la packages/database/prisma/migrations/ 2>&1"; then
    echo -e "${GREEN}✅ Migration files found in container${NC}"
else
    echo -e "${RED}❌ Migration files NOT found in container${NC}"
    echo "   This means the Docker image was built without migration files"
    echo "   Solution: Rebuild the Docker image"
    exit 1
fi

echo ""
echo "2️⃣ Checking migration status..."
echo "--------------------------------"

if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set - skipping migration status check${NC}"
else
    if docker run --rm $NETWORK_FLAG --user root \
        -e DATABASE_URL="$DATABASE_URL" \
        $IMAGE_NAME \
        sh -c "npm install -g prisma@^5.19.0 && npx prisma migrate status --schema=./packages/database/prisma/schema.prisma"; then
        echo -e "${GREEN}✅ Migration status check completed${NC}"
    else
        echo -e "${RED}❌ Migration status check failed${NC}"
        exit 1
    fi
fi

echo ""
echo "3️⃣ Checking tables in database..."
echo "----------------------------------"

if docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -c "\dt" 2>&1 | grep -E "(users|listings|conversations|messages|conversation_participants)"; then
    echo -e "${GREEN}✅ Required tables found in database${NC}"
else
    echo -e "${RED}❌ Required tables NOT found in database${NC}"
    echo ""
    echo "Checking migration history..."
    docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -c "SELECT migration_name, finished_at, success FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;" 2>&1 || true
    exit 1
fi

echo ""
echo "4️⃣ Checking migration history..."
echo "----------------------------------"

MIGRATION_COUNT=$(docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM _prisma_migrations;" 2>&1 | tr -d ' ')

if [ "$MIGRATION_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ Migration history found ($MIGRATION_COUNT migrations)${NC}"
    docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -c "SELECT migration_name, finished_at, success FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;" 2>&1
else
    echo -e "${YELLOW}⚠️  No migrations in history - migrations might not have been executed${NC}"
fi

echo ""
echo -e "${GREEN}✅ Verification completed successfully${NC}"

