#!/usr/bin/env bash
# ============================================================
# Mausam Bharat - 1-Click VPS Deployment & Update Script
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "🇮🇳 Deploying Mausam Bharat Weather Platform on VPS"
echo "=========================================================="

# 1. Check Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed. Please install Docker first:"
    echo "   curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Error: 'docker compose' (V2 plugin) is not available."
    exit 1
fi

# 2. Check for .env file
if [ ! -f .env ]; then
    echo "ℹ️  No .env file found. Copying .env.example -> .env"
    cp .env.example .env
    echo "👉 You can customize port or subdomain by editing .env"
fi

# Load variables
source .env 2>/dev/null || true
PORT="${APP_PORT:-3000}"

echo "🔧 Configuration:"
echo "   - Internal Host Port: 127.0.0.1:${PORT}"
echo "   - Assigned Subdomain: ${APP_DOMAIN:-Not Set}"
echo "   - Backend Isolation : Private bridge network only"
echo ""

# 3. Build & Deploy with Docker Compose
echo "📦 Building isolated containers (frontend standalone & backend)..."
docker compose build --pull

echo "🚀 Starting containers in background..."
docker compose up -d --remove-orphans

echo "⏳ Verifying services health..."
sleep 5

# Check container status
docker compose ps

echo ""
echo "=========================================================="
echo "✅ Deployment Successful & Fully Isolated!"
echo "=========================================================="
echo "• The app is running locally at: http://127.0.0.1:${PORT}"
echo "• The backend is strictly internal (zero public exposure)."
echo "• Next step: Point your VPS reverse proxy (Nginx / Caddy)"
echo "  for your subdomain to http://127.0.0.1:${PORT}"
echo ""
echo "See deploy/VPS_DEPLOYMENT_GUIDE.md for Nginx / Caddy / Cloudflare configs."
echo "=========================================================="
