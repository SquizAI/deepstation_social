#!/usr/bin/env node

/**
 * Pause a Supabase project
 */

const https = require('https');

const accessToken = 'sbp_7fe234f01d83baf98e33439358447099d8bf7fc4';
const projectRef = process.argv[2];

if (!projectRef) {
  console.error('Usage: node pause-project.js <project-ref>');
  process.exit(1);
}

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${projectRef}/pause`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
};

console.log(`⏸️  Pausing project: ${projectRef}...\n`);

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);

    if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204) {
      console.log('✅ Project paused successfully!');
    } else {
      try {
        const response = JSON.parse(responseData);
        console.error('❌ Failed to pause project');
        console.error('Response:', JSON.stringify(response, null, 2));
      } catch {
        console.error('Response:', responseData);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
  process.exit(1);
});

req.end();
