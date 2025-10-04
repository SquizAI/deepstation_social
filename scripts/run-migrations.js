#!/usr/bin/env node

/**
 * Run all Supabase migrations
 * Executes SQL migration files in order
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const config = {
  projectRef: 'xhohhxoowqlldbdcpynj',
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhob2hoeG9vd3FsbGRiZGNweW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU5OTY4OSwiZXhwIjoyMDc1MTc1Njg5fQ.SNp0GFvhTQ-5RlZs8ZFpSrusiUFGxROe1AoOfPSVTok',
  accessToken: 'sbp_7fe234f01d83baf98e33439358447099d8bf7fc4',
};

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

const migrations = [
  // '001_initial_schema.sql',  // Already completed
  // '002_row_level_security.sql',  // Already completed
  // '003_storage_buckets.sql',  // Handled by setup-storage-buckets.js
  '004_analytics_views.sql',
  '20250104_oauth_tokens.sql',
  '20250104_speakers_tables.sql',
];

async function executeSql(sql, migrationName) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${config.projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`   ✅ ${migrationName}`);
          resolve();
        } else {
          console.error(`   ❌ ${migrationName} - Status: ${res.statusCode}`);
          try {
            const error = JSON.parse(responseData);
            console.error(`   Error: ${error.message || JSON.stringify(error)}`);
          } catch {
            console.error(`   Response: ${responseData}`);
          }
          reject(new Error(`Migration ${migrationName} failed`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`   ❌ ${migrationName} - Network error:`, error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function runMigrations() {
  console.log('🚀 Running database migrations...\n');
  console.log(`   Project: ${config.projectRef}`);
  console.log(`   Total migrations: ${migrations.length}\n`);

  for (const migration of migrations) {
    const migrationPath = path.join(migrationsDir, migration);

    if (!fs.existsSync(migrationPath)) {
      console.log(`   ⏭️  ${migration} - File not found, skipping`);
      continue;
    }

    try {
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      await executeSql(sql, migration);
    } catch (error) {
      console.error(`\n❌ Migration failed: ${migration}`);
      console.error(`   Error: ${error.message}`);
      console.log('\nStopping migration process.');
      process.exit(1);
    }
  }

  console.log('\n✅ All migrations completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Verify tables in Supabase Dashboard');
  console.log('   2. Deploy Edge Functions');
  console.log('   3. Test the application locally: npm run dev');
}

runMigrations().catch(error => {
  console.error('\n❌ Migration process failed:', error.message);
  process.exit(1);
});
