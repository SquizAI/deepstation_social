#!/usr/bin/env node

/**
 * Get API keys for DeepStation project
 */

const https = require('https');

const accessToken = 'sbp_7fe234f01d83baf98e33439358447099d8bf7fc4';
const projectRef = 'xhohhxoowqlldbdcpynj';

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${projectRef}/api-keys`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
};

console.log(`🔑 Getting API keys for DeepStation project...\n`);

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      const keys = JSON.parse(responseData);

      if (Array.isArray(keys)) {
        const anonKey = keys.find(k => k.name === 'anon');
        const serviceKey = keys.find(k => k.name === 'service_role');

        console.log('✅ API Keys Retrieved!\n');
        console.log('='.repeat(80));
        console.log('DEEPSTATION PROJECT CREDENTIALS');
        console.log('='.repeat(80));
        console.log('');
        console.log(`NEXT_PUBLIC_SUPABASE_URL=https://${projectRef}.supabase.co`);
        console.log('');
        if (anonKey) {
          console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey.api_key}`);
        }
        console.log('');
        if (serviceKey) {
          console.log(`SUPABASE_SERVICE_ROLE_KEY=${serviceKey.api_key}`);
        }
        console.log('');
        console.log('='.repeat(80));
        console.log('');
        console.log('🔗 Dashboard: https://supabase.com/dashboard/project/' + projectRef);
      } else {
        console.log('Response:', JSON.stringify(keys, null, 2));
      }
    } catch (error) {
      console.error('Error:', error.message);
      console.error('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
});

req.end();
