#!/bin/bash
# Server Setup Script für IONOS
# Führt alle notwendigen Server-Setup-Schritte aus

set -e

echo "🔧 ShareLocal Server Setup für IONOS"
echo ""

# Prüfe ob als Root ausgeführt
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Dieses Script benötigt sudo-Rechte"
    echo "💡 Führe aus: sudo ./scripts/setup-server.sh"
    exit 1
fi

# 1. Docker Installation prüfen
echo "1️⃣ Prüfe Docker Installation..."
if ! command -v docker &> /dev/null; then
    echo "📦 Installiere Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "✅ Docker ist bereits installiert: $(docker --version)"
fi

# 2. Docker Compose Installation prüfen
echo ""
echo "2️⃣ Prüfe Docker Compose Installation..."
if ! docker compose version &> /dev/null; then
    echo "📦 Installiere Docker Compose..."
    apt-get update
    apt-get install -y docker-compose-plugin
else
    echo "✅ Docker Compose ist bereits installiert: $(docker compose version)"
fi

# 3. Nginx Installation prüfen
echo ""
echo "3️⃣ Prüfe Nginx Installation..."
if ! command -v nginx &> /dev/null; then
    echo "📦 Installiere Nginx..."
    apt-get update
    apt-get install -y nginx
    systemctl enable nginx
else
    echo "✅ Nginx ist bereits installiert: $(nginx -v 2>&1)"
fi

# 4. Erstelle Verzeichnisse
echo ""
echo "4️⃣ Erstelle Verzeichnisse..."
mkdir -p /opt/sharelocal/{dev,prd,backups}
chown -R $SUDO_USER:$SUDO_USER /opt/sharelocal
echo "✅ Verzeichnisse erstellt: /opt/sharelocal/{dev,prd,backups}"

# 5. Nginx Configs kopieren (falls vorhanden)
echo ""
echo "5️⃣ Konfiguriere Nginx..."
if [ -f "infrastructure/nginx/share-local-dev.conf" ]; then
    cp infrastructure/nginx/share-local-dev.conf /etc/nginx/sites-available/share-local-dev
    cp infrastructure/nginx/share-local-prd.conf /etc/nginx/sites-available/share-local-prd
    
    # Erstelle Symlinks
    ln -sf /etc/nginx/sites-available/share-local-dev /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/share-local-prd /etc/nginx/sites-enabled/
    
    # Teste Nginx Config
    if nginx -t; then
        echo "✅ Nginx Config ist gültig"
        echo "💡 Nginx wird noch nicht neu geladen - prüfe die Configs manuell!"
    else
        echo "⚠️  Nginx Config hat Fehler - bitte prüfe manuell"
    fi
else
    echo "⚠️  Nginx Configs nicht gefunden - kopiere sie manuell"
fi

# 6. Firewall (optional)
echo ""
echo "6️⃣ Prüfe Firewall..."
if command -v ufw &> /dev/null; then
    echo "💡 UFW gefunden - stelle sicher, dass Ports 80, 443, 3000, 3001 offen sind"
    echo "   ufw allow 80/tcp"
    echo "   ufw allow 443/tcp"
    echo "   ufw allow 3000/tcp"
    echo "   ufw allow 3001/tcp"
fi

echo ""
echo "✅ Server Setup abgeschlossen!"
echo ""
echo "📋 Nächste Schritte:"
echo "1. Kopiere Code nach /opt/sharelocal/prd oder /opt/sharelocal/dev"
echo "2. Erstelle .env.$ENVIRONMENT Dateien"
echo "3. Führe ./scripts/deploy-to-server.sh [dev|prd] aus"
echo "4. Konfiguriere Nginx (siehe docs/IONOS_DEPLOYMENT.md)"
echo "5. Starte Nginx: sudo systemctl reload nginx"

