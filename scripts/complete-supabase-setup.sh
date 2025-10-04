#!/bin/bash

# DeepStation Complete Supabase Setup Script
# Runs all remaining migrations on the newly created project

set -e

PROJECT_REF="xhohhxoowqlldbdcpynj"
SUPABASE_URL="https://xhohhxoowqlldbdcpynj.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhob2hoeG9vd3FsbGRiZGNweW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU5OTY4OSwiZXhwIjoyMDc1MTc1Njg5fQ.SNp0GFvhTQ-5RlZs8ZFpSrusiUFGxROe1AoOfPSVTok"
MIGRATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../supabase/migrations" && pwd)"

echo "🚀 Running DeepStation Database Migrations"
echo "=========================================="
echo ""
echo "Project: $PROJECT_REF"
echo "URL: $SUPABASE_URL"
echo ""

# Function to execute SQL via PostgREST
execute_sql() {
    local migration_name=$1
    local sql_file=$2

    echo "📄 Running: $migration_name"

    # Read SQL file
    sql_content=$(cat "$sql_file")

    # Execute via Supabase SQL endpoint
    response=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
        -H "apikey: $SERVICE_KEY" \
        -H "Authorization: Bearer $SERVICE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(jq -Rs . <<< "$sql_content")}")

    if [[ $? -eq 0 ]]; then
        echo "   ✅ $migration_name completed"
    else
        echo "   ❌ $migration_name failed"
        echo "   Response: $response"
        exit 1
    fi
}

# Run remaining migrations
echo "Running migrations..."
echo ""

# Migration 3: Storage Buckets
if [ -f "$MIGRATIONS_DIR/003_storage_buckets.sql" ]; then
    execute_sql "003_storage_buckets" "$MIGRATIONS_DIR/003_storage_buckets.sql"
fi

# Migration 4: Analytics Views
if [ -f "$MIGRATIONS_DIR/004_analytics_views.sql" ]; then
    execute_sql "004_analytics_views" "$MIGRATIONS_DIR/004_analytics_views.sql"
fi

# Migration 5: OAuth Tokens (if separate)
if [ -f "$MIGRATIONS_DIR/20250104_oauth_tokens.sql" ]; then
    execute_sql "20250104_oauth_tokens" "$MIGRATIONS_DIR/20250104_oauth_tokens.sql"
fi

# Migration 6: Speakers Tables
if [ -f "$MIGRATIONS_DIR/20250104_speakers_tables.sql" ]; then
    execute_sql "20250104_speakers_tables" "$MIGRATIONS_DIR/20250104_speakers_tables.sql"
fi

echo ""
echo "✅ All migrations completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "   1. Verify tables in Supabase Dashboard:"
echo "      https://supabase.com/dashboard/project/$PROJECT_REF"
echo "   2. Deploy Edge Functions"
echo "   3. Test locally: npm run dev"
echo "   4. Deploy to Netlify"
echo ""
