#!/bin/bash

echo "🚀 Kelmah Database Migration Script"
echo "==================================="
echo ""
echo "🔍 This script will fix the 'isPhoneVerified' column error"
echo "✅ Create missing database tables for real data"
echo "🇬🇭 Set up Ghana-specific configurations"
echo ""
echo "📋 You need your TimescaleDB connection string from Render"
echo ""
echo "Example format:"
echo "postgres://username:password@host:port/database"
echo ""
echo "💡 To find this:"
echo "1. Go to your Render Dashboard"
echo "2. Click on your Database" 
echo "3. Go to Connection tab"
echo "4. Copy the 'External Database URL'"
echo ""
echo "⚠️  IMPORTANT: Keep this connection string secure!"
echo ""

read -p "Enter your TimescaleDB connection string: " DATABASE_URL
echo ""

if [ -z "$DATABASE_URL" ]; then
    echo "❌ No database URL provided. Exiting..."
    exit 1
fi

echo "🔄 Setting up environment..."
export DATABASE_URL="$DATABASE_URL"
echo ""

echo "🔧 Running database migration..."
node fix-production-database.js

echo ""
echo "✅ Migration complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Render Dashboard"
echo "2. Restart all your services"
echo "3. Run: npm run test-real-data"
echo ""