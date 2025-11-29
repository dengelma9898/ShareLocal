#!/bin/bash
# Deployment Script für ShareLocal auf IONOS Server
# Verwendung: ./scripts/deploy-to-server.sh [dev|prd]

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

# Baue Docker Images
echo "📦 Baue Docker Images..."
if [ "$ENVIRONMENT" = "prd" ]; then
    docker compose -f docker-compose.yml -f docker-compose.prd.yml build
else
    docker compose -f docker-compose.yml -f docker-compose.dev.yml build
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
docker compose run --rm api pnpm --filter @sharelocal/database db:push || {
    echo "⚠️  Migration fehlgeschlagen, versuche es mit bestehender Database..."
}

# Starte Services
echo "🚀 Starte Services..."
if [ "$ENVIRONMENT" = "prd" ]; then
    docker compose -f docker-compose.yml -f docker-compose.prd.yml up -d
else
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
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
    docker compose logs api --tail=20
fi

echo ""
echo "✅ Deployment abgeschlossen!"
echo ""
echo "📋 Nächste Schritte:"
echo "1. Prüfe Logs: docker compose logs -f"
echo "2. Prüfe Container Status: docker compose ps"
echo "3. Teste API: curl http://localhost:3001/health"
echo "4. Konfiguriere Nginx (siehe docs/IONOS_DEPLOYMENT.md)"
echo ""
echo "🌐 URLs:"
if [ "$ENVIRONMENT" = "prd" ]; then
    echo "   Web: https://nuernbergspots.de/share-local/prd"
    echo "   API: https://nuernbergspots.de/share-local/prd/api"
else
    echo "   Web: http://nuernbergspots.de/share-local/dev"
    echo "   API: http://nuernbergspots.de/share-local/dev/api"
fi

