#!/usr/bin/env node

/**
 * Create DeepStation Supabase Project
 */

const https = require('https');
const crypto = require('crypto');

const config = {
  accessToken: 'sbp_7fe234f01d83baf98e33439358447099d8bf7fc4',
  organizationId: 'xjcsyrtdzeuogokjzjgu',
  projectName: 'deepstation-production',
  region: 'us-east-1',
  plan: 'free', // Start with free, can upgrade later
  dbPassword: crypto.randomBytes(32).toString('base64').slice(0, 32),
};

const data = JSON.stringify({
  organization_id: config.organizationId,
  name: config.projectName,
  region: config.region,
  plan: config.plan,
  db_pass: config.dbPassword,
});

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: '/v1/projects',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${config.accessToken}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

console.log('🚀 Creating DeepStation Supabase project...');
console.log(`   Name: ${config.projectName}`);
console.log(`   Organization: ${config.organizationId}`);
console.log(`   Region: ${config.region}`);
console.log(`   Plan: ${config.plan}`);
console.log('');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);

    try {
      const response = JSON.parse(responseData);

      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ Project created successfully!');
        console.log('');
        console.log('📋 Project Details:');
        console.log(`   Project ID: ${response.id}`);
        console.log(`   Project Ref: ${response.ref}`);
        console.log(`   Project URL: https://${response.ref}.supabase.co`);
        console.log(`   Database Password: ${config.dbPassword}`);
        console.log('');
        console.log('⏳ Project is being provisioned... (2-3 minutes)');
        console.log('');
        console.log('🔗 View in dashboard:');
        console.log(`   https://supabase.com/dashboard/project/${response.ref}`);
      } else {
        console.error('❌ Failed to create project');
        console.error('Response:', JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.error('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.write(data);
req.end();
