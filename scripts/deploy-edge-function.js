#!/usr/bin/env node

/**
 * Deploy Edge Function to Supabase
 * Uses Supabase Management API to deploy Edge Functions
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const config = {
  projectRef: 'xhohhxoowqlldbdcpynj',
  accessToken: 'sbp_7fe234f01d83baf98e33439358447099d8bf7fc4',
};

const functionName = 'process-scheduled-posts';
const functionPath = path.join(
  __dirname,
  '..',
  'supabase',
  'functions',
  functionName,
  'index.ts'
);

console.log('🚀 Deploying Edge Function to Supabase...\n');
console.log(`   Function: ${functionName}`);
console.log(`   Project: ${config.projectRef}\n`);

// Read function code
if (!fs.existsSync(functionPath)) {
  console.error(`❌ Function file not found: ${functionPath}`);
  process.exit(1);
}

const functionCode = fs.readFileSync(functionPath, 'utf-8');

// Create function via API
const data = JSON.stringify({
  slug: functionName,
  name: functionName,
  body: functionCode,
  verify_jwt: false,
  import_map: false,
});

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${config.projectRef}/functions`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${config.accessToken}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Edge Function deployed successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. Configure cron schedule in Supabase Dashboard');
      console.log('   2. Set up environment variables in Dashboard');
      console.log('   3. Test the function');
    } else if (res.statusCode === 409) {
      console.log('⚠️  Function already exists, updating...');
      updateFunction();
    } else {
      console.error(`❌ Deployment failed - Status: ${res.statusCode}`);
      try {
        const error = JSON.parse(responseData);
        console.error(`   Error: ${error.message || JSON.stringify(error)}`);
      } catch {
        console.error(`   Response: ${responseData}`);
      }
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Network error:', error.message);
  process.exit(1);
});

req.write(data);
req.end();

function updateFunction() {
  const updateData = JSON.stringify({
    body: functionCode,
    verify_jwt: false,
  });

  const updateOptions = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${config.projectRef}/functions/${functionName}`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(updateData),
    },
  };

  const updateReq = https.request(updateOptions, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Edge Function updated successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Verify function in Supabase Dashboard');
        console.log('   2. Test the function');
      } else {
        console.error(`❌ Update failed - Status: ${res.statusCode}`);
        try {
          const error = JSON.parse(responseData);
          console.error(`   Error: ${error.message || JSON.stringify(error)}`);
        } catch {
          console.error(`   Response: ${responseData}`);
        }
        process.exit(1);
      }
    });
  });

  updateReq.on('error', (error) => {
    console.error('❌ Network error:', error.message);
    process.exit(1);
  });

  updateReq.write(updateData);
  updateReq.end();
}
