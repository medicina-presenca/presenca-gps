#!/bin/bash

# Presença GPS - Setup Script
# This script helps you set up the project locally

set -e

echo "🚀 Presença GPS - Setup"
echo "======================="
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Error: Node.js 20+ is required. Current version: $(node -v)"
    exit 1
fi
echo "✓ Node.js version: $(node -v)"

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    echo "⚠️  Warning: MySQL client not found. Make sure MySQL server is running."
else
    echo "✓ MySQL client found"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file and set your configuration:"
    echo "   - DATABASE_URL"
    echo "   - JWT_SECRET"
    echo "   - ALLOWED_EMAIL_DOMAINS"
    echo ""
    read -p "Press Enter after editing .env file..."
else
    echo "✓ .env file exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"

# Check database connection
echo ""
echo "🔍 Checking database connection..."
if npm run db:push 2>&1 | grep -q "error"; then
    echo "❌ Database connection failed. Please check DATABASE_URL in .env"
    exit 1
fi
echo "✓ Database connected and tables created"

# Seed allowed domains
echo ""
echo "🌱 Seeding allowed email domains..."
npx tsx scripts/seed.ts
echo "✓ Domains seeded"

# Build project
echo ""
echo "🔨 Building project..."
npm run build
echo "✓ Project built successfully"

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Start development: npm run dev"
echo "   2. Frontend: http://localhost:5173"
echo "   3. Backend: http://localhost:3000"
echo ""
echo "   Or for production:"
echo "   npm start"
echo ""
