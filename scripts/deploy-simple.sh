#!/bin/bash
# Einfaches Deployment Script - Pull Images und Starte Container
# Verwendung: ./scripts/deploy-simple.sh [dev|prd]
#
# Voraussetzung:
# - Docker Images wurden von GitHub Actions gebaut und zu Docker Hub gepusht
# - docker-compose.yml und docker-compose.{env}.registry.yml vorhanden
# - .env.{env} Datei mit Environment Variables

set -e

ENVIRONMENT=${1:-prd}

if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prd" ]; then
    echo "❌ Ungültige Umgebung. Verwende 'dev' oder 'prd'"
    exit 1
fi

echo "🚀 Deploye ShareLocal $ENVIRONMENT Environment..."

# Prüfe ob .env.$ENVIRONMENT existiert
if [ ! -f ".env.$ENVIRONMENT" ]; then
    echo "❌ .env.$ENVIRONMENT nicht gefunden!"
    exit 1
fi

# Lade Environment Variables
export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)

# Setze DOCKERHUB_USERNAME falls nicht gesetzt
if [ -z "$DOCKERHUB_USERNAME" ]; then
    if grep -q "DOCKERHUB_USERNAME" .env.$ENVIRONMENT; then
        export DOCKERHUB_USERNAME=$(grep "DOCKERHUB_USERNAME" .env.$ENVIRONMENT | cut -d '=' -f2)
    else
        echo "⚠️  DOCKERHUB_USERNAME nicht gesetzt, verwende Default: dengelma9898"
        export DOCKERHUB_USERNAME=dengelma9898
    fi
fi

# Pull Images von Docker Hub
echo "📥 Pull Docker Images von Docker Hub..."
if [ "$ENVIRONMENT" = "prd" ]; then
    docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml pull
else
    docker compose -f docker-compose.yml -f docker-compose.dev.registry.yml pull
fi

# Starte Database (falls nicht läuft)
echo "🗄️  Starte Database..."
docker compose up -d postgres

# Warte bis Database bereit ist
echo "⏳ Warte auf Database..."
timeout=30
counter=0
until docker compose exec -T postgres pg_isready -U ${POSTGRES_USER:-sharelocal} > /dev/null 2>&1; do
    sleep 1
    counter=$((counter + 1))
    if [ $counter -ge $timeout ]; then
        echo "❌ Database ist nicht bereit nach ${timeout}s"
        exit 1
    fi
done
echo "✅ Database ist bereit"

# Führe Database Migrations aus
echo "🔄 Führe Database Migrations aus..."
if [ "$ENVIRONMENT" = "prd" ]; then
    docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml run --rm api pnpm --filter @sharelocal/database db:push || {
        echo "⚠️  Migration fehlgeschlagen, versuche es mit bestehender Database..."
    }
else
    docker compose -f docker-compose.yml -f docker-compose.dev.registry.yml run --rm api pnpm --filter @sharelocal/database db:push || {
        echo "⚠️  Migration fehlgeschlagen, versuche es mit bestehender Database..."
    }
fi

# Starte Services
echo "🚀 Starte Services..."
if [ "$ENVIRONMENT" = "prd" ]; then
    docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml up -d
else
    docker compose -f docker-compose.yml -f docker-compose.dev.registry.yml up -d
fi

# Warte kurz
sleep 5

# Prüfe Health Checks
echo "🏥 Prüfe Health Checks..."
API_HEALTH=$(curl -s http://localhost:3001/health || echo "FAILED")
if [[ "$API_HEALTH" == *"ok"* ]]; then
    echo "✅ API Health Check: OK"
else
    echo "⚠️  API Health Check: FEHLGESCHLAGEN"
    echo "📋 Logs:"
    if [ "$ENVIRONMENT" = "prd" ]; then
        docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml logs api --tail=20
    else
        docker compose -f docker-compose.yml -f docker-compose.dev.registry.yml logs api --tail=20
    fi
fi

echo ""
echo "✅ Deployment abgeschlossen!"
echo ""
echo "🌐 URLs:"
if [ "$ENVIRONMENT" = "prd" ]; then
    echo "   Web: https://nuernbergspots.de/share-local/prd"
    echo "   API: https://nuernbergspots.de/share-local/prd/api"
else
    echo "   Web: http://nuernbergspots.de/share-local/dev"
    echo "   API: http://nuernbergspots.de/share-local/dev/api"
fi

