#!/usr/bin/env python3

"""
Run Supabase migrations using Python client
"""

import os
from pathlib import Path
from supabase import create_client, Client

# Configuration
SUPABASE_URL = "https://xhohhxoowqlldbdcpynj.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhob2hoeG9vd3FsbGRiZGNweW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU5OTY4OSwiZXhwIjoyMDc1MTc1Njg5fQ.SNp0GFvhTQ-5RlZs8ZFpSrusiUFGxROe1AoOfPSVTok"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Migrations directory
migrations_dir = Path(__file__).parent.parent / "supabase" / "migrations"

# Migrations to run (skip already completed ones)
migrations = [
    "003_storage_buckets.sql",
    "004_analytics_views.sql",
    "20250104_oauth_tokens.sql",
    "20250104_speakers_tables.sql",
]

def run_migration(filename: str) -> bool:
    """Run a single migration file"""
    filepath = migrations_dir / filename

    if not filepath.exists():
        print(f"   ⏭️  {filename} - File not found, skipping")
        return True

    try:
        with open(filepath, 'r') as f:
            sql = f.read()

        # Execute the SQL
        result = supabase.rpc('exec_sql', {'query': sql}).execute()

        print(f"   ✅ {filename}")
        return True

    except Exception as e:
        print(f"   ❌ {filename} - Error: {str(e)}")
        return False

def main():
    print("🚀 Running database migrations...\n")
    print(f"   Project: xhohhxoowqlldbdcpynj")
    print(f"   Total migrations: {len(migrations)}\n")

    for migration in migrations:
        success = run_migration(migration)
        if not success:
            print(f"\n❌ Migration failed: {migration}")
            print("Stopping migration process.")
            return 1

    print("\n✅ All migrations completed successfully!")
    print("\n📋 Next steps:")
    print("   1. Verify tables in Supabase Dashboard")
    print("   2. Deploy Edge Functions")
    print("   3. Test the application locally: npm run dev")
    return 0

if __name__ == "__main__":
    exit(main())
