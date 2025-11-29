#!/bin/bash
# Deployment Script für ShareLocal mit Registry Images
# Verwendung: ./scripts/deploy-from-registry.sh [dev|prd]
#
# Voraussetzung:
# - Docker Images wurden von GitHub Actions gebaut und zu ghcr.io gepusht
# - GITHUB_REPOSITORY_OWNER Environment Variable gesetzt (oder in .env)
# - Docker Login zu ghcr.io (siehe docs/DEPLOYMENT_REGISTRY.md)

set -e

ENVIRONMENT=${1:-prd}

if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prd" ]; then
    echo "❌ Ungültige Umgebung. Verwende 'dev' oder 'prd'"
    exit 1
fi

echo "🚀 Deploye ShareLocal $ENVIRONMENT Environment (von Registry)..."

# Prüfe ob .env.$ENVIRONMENT existiert
if [ ! -f ".env.$ENVIRONMENT" ]; then
    echo "❌ .env.$ENVIRONMENT nicht gefunden!"
    echo "💡 Kopiere .env.production.example zu .env.$ENVIRONMENT und fülle alle Werte aus"
    exit 1
fi

# Lade Environment Variables
export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)

# Prüfe ob alle erforderlichen Variablen gesetzt sind
if [ -z "$JWT_SECRET" ] || [ -z "$ENCRYPTION_KEY" ] || [ -z "$DATABASE_URL" ]; then
    echo "❌ Fehlende Environment Variables!"
    echo "💡 Stelle sicher, dass JWT_SECRET, ENCRYPTION_KEY und DATABASE_URL gesetzt sind"
    exit 1
fi

# Setze GITHUB_REPOSITORY_OWNER falls nicht gesetzt
if [ -z "$GITHUB_REPOSITORY_OWNER" ]; then
    # Versuche aus .env zu lesen oder verwende Default
    if grep -q "GITHUB_REPOSITORY_OWNER" .env.$ENVIRONMENT; then
        export GITHUB_REPOSITORY_OWNER=$(grep "GITHUB_REPOSITORY_OWNER" .env.$ENVIRONMENT | cut -d '=' -f2)
    else
        echo "⚠️  GITHUB_REPOSITORY_OWNER nicht gesetzt, verwende Default: dengelma9898"
        export GITHUB_REPOSITORY_OWNER=dengelma9898
    fi
fi

# Prüfe Docker Login zu ghcr.io
echo "🔐 Prüfe Docker Login zu ghcr.io..."
if ! docker pull ghcr.io/${GITHUB_REPOSITORY_OWNER}/sharelocal-api:latest > /dev/null 2>&1; then
    echo "❌ Docker Login zu ghcr.io fehlgeschlagen!"
    echo "💡 Führe aus: echo \$GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin"
    echo "   Oder verwende GitHub Personal Access Token (PAT) mit 'read:packages' Berechtigung"
    exit 1
fi
echo "✅ Docker Login erfolgreich"

# Pull Images von Registry
echo "📥 Pull Docker Images von Registry..."
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
echo "📋 Nächste Schritte:"
if [ "$ENVIRONMENT" = "prd" ]; then
    echo "1. Prüfe Logs: docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml logs -f"
    echo "2. Prüfe Container Status: docker compose -f docker-compose.yml -f docker-compose.prd.registry.yml ps"
    echo "3. Teste API: curl http://localhost:3001/health"
    echo "4. Konfiguriere Nginx (siehe docs/IONOS_DEPLOYMENT.md)"
else
    echo "1. Prüfe Logs: docker compose -f docker-compose.yml -f docker-compose.dev.registry.yml logs -f"
    echo "2. Prüfe Container Status: docker compose -f docker-compose.yml -f docker-compose.dev.registry.yml ps"
    echo "3. Teste API: curl http://localhost:3001/health"
    echo "4. Konfiguriere Nginx (siehe docs/DEV_ENVIRONMENT_SETUP.md)"
fi
echo ""
echo "🌐 URLs:"
if [ "$ENVIRONMENT" = "prd" ]; then
    echo "   Web: https://nuernbergspots.de/share-local/prd"
    echo "   API: https://nuernbergspots.de/share-local/prd/api"
else
    echo "   Web: http://nuernbergspots.de/share-local/dev"
    echo "   API: http://nuernbergspots.de/share-local/dev/api"
fi

