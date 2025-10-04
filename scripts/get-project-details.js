#!/usr/bin/env node

/**
 * Get detailed information about a specific project
 */

const https = require('https');

const accessToken = 'sbp_7fe234f01d83baf98e33439358447099d8bf7fc4';
const projectId = process.argv[2];

if (!projectId) {
  console.error('Usage: node get-project-details.js <project-id>');
  process.exit(1);
}

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${projectId}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
};

console.log(`📋 Getting details for project: ${projectId}...\n`);

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      const project = JSON.parse(responseData);

      console.log('Project Details:');
      console.log(JSON.stringify(project, null, 2));
      console.log('');

      if (project.database) {
        console.log('🗄️  Database:');
        console.log(`   Host: ${project.database.host}`);
        console.log(`   Version: ${project.database.version}`);
      }

      if (project.subscription_tier) {
        console.log(`💳 Plan: ${project.subscription_tier}`);
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
