#!/usr/bin/env node

/**
 * List all Supabase projects
 */

const https = require('https');

const accessToken = 'sbp_7fe234f01d83baf98e33439358447099d8bf7fc4';

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: '/v1/projects',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
};

console.log('📋 Listing all Supabase projects...\n');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      const projects = JSON.parse(responseData);

      if (Array.isArray(projects)) {
        console.log(`Found ${projects.length} project(s):\n`);

        projects.forEach((project, index) => {
          console.log(`${index + 1}. ${project.name}`);
          console.log(`   ID: ${project.id}`);
          console.log(`   Ref: ${project.ref || 'N/A'}`);
          console.log(`   Status: ${project.status}`);
          console.log(`   Region: ${project.region}`);
          console.log(`   Organization: ${project.organization_id}`);
          console.log(`   Created: ${new Date(project.created_at).toLocaleDateString()}`);
          console.log('');
        });

        // Show free tier projects
        const freeProjects = projects.filter(p => !p.subscription_tier || p.subscription_tier === 'free');
        console.log(`\n🆓 Free tier projects: ${freeProjects.length}`);
        if (freeProjects.length > 0) {
          freeProjects.forEach(p => {
            console.log(`   - ${p.name} (${p.id})`);
          });
        }
      } else {
        console.error('Unexpected response:', projects);
      }
    } catch (error) {
      console.error('Error parsing response:', error.message);
      console.error('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
});

req.end();
