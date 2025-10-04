#!/usr/bin/env node

/**
 * Verify OAuth Setup
 * Checks if all required environment variables and configurations are properly set
 * Run: node scripts/verify-oauth-setup.js
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    log('❌ .env.local file not found', 'red');
    log('   Create it by copying .env.local.example', 'yellow');
    return false;
  }

  log('✅ .env.local file exists', 'green');
  return true;
}

function loadEnvVars() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');

    const vars = {};
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        vars[key] = value;
      }
    });

    return vars;
  } catch (error) {
    log('❌ Error reading .env.local', 'red');
    return {};
  }
}

function checkRequiredVar(vars, name, description, optional = false) {
  const value = vars[name];

  if (!value) {
    if (optional) {
      log(`⚠️  ${name} not set (optional)`, 'yellow');
      log(`   ${description}`, 'yellow');
      return false;
    } else {
      log(`❌ ${name} not set`, 'red');
      log(`   ${description}`, 'yellow');
      return false;
    }
  }

  if (value.includes('your-') || value.includes('generate-')) {
    log(`⚠️  ${name} contains placeholder value`, 'yellow');
    log(`   Current: ${value}`, 'yellow');
    log(`   ${description}`, 'yellow');
    return false;
  }

  log(`✅ ${name} is set`, 'green');
  return true;
}

function checkEncryptionKey(vars) {
  const key = vars.ENCRYPTION_KEY;

  if (!key) {
    log('❌ ENCRYPTION_KEY not set', 'red');
    log('   Generate one with: node scripts/generate-encryption-key.js', 'yellow');
    return false;
  }

  if (key.length !== 32) {
    log(`❌ ENCRYPTION_KEY must be exactly 32 characters (current: ${key.length})`, 'red');
    log('   Generate a new one with: node scripts/generate-encryption-key.js', 'yellow');
    return false;
  }

  if (key.includes('generate-') || key.includes('your-')) {
    log('⚠️  ENCRYPTION_KEY contains placeholder value', 'yellow');
    log('   Generate a real key with: node scripts/generate-encryption-key.js', 'yellow');
    return false;
  }

  log('✅ ENCRYPTION_KEY is valid (32 characters)', 'green');
  return true;
}

function checkFiles() {
  const requiredFiles = [
    'lib/auth/encryption.ts',
    'lib/auth/oauth-config.ts',
    'lib/auth/oauth-tokens.ts',
    'lib/auth/csrf.ts',
    'lib/types/oauth.ts',
    'lib/hooks/useOAuth.ts',
    'app/api/auth/connect/route.ts',
    'app/api/auth/disconnect/route.ts',
    'app/api/auth/status/route.ts',
    'app/auth/callback/route.ts',
    'supabase/migrations/20250104_oauth_tokens.sql',
  ];

  let allExist = true;

  log('\nChecking OAuth implementation files:', 'blue');

  requiredFiles.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`  ✅ ${file}`, 'green');
    } else {
      log(`  ❌ ${file} not found`, 'red');
      allExist = false;
    }
  });

  return allExist;
}

function main() {
  log('\n========================================', 'blue');
  log('OAuth Setup Verification', 'blue');
  log('========================================\n', 'blue');

  // Check .env.local file
  log('1. Checking .env.local file:', 'blue');
  if (!checkEnvFile()) {
    log('\n❌ Setup incomplete. Please create .env.local file first.\n', 'red');
    process.exit(1);
  }

  const vars = loadEnvVars();

  // Check core variables
  log('\n2. Checking core configuration:', 'blue');
  const coreChecks = [
    checkRequiredVar(
      vars,
      'NEXT_PUBLIC_APP_URL',
      'Application URL (use http://localhost:3000 for dev)'
    ),
    checkRequiredVar(
      vars,
      'NEXT_PUBLIC_SUPABASE_URL',
      'Supabase project URL from dashboard'
    ),
    checkRequiredVar(
      vars,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'Supabase anon key from dashboard'
    ),
    checkEncryptionKey(vars),
  ];

  // Check LinkedIn
  log('\n3. Checking LinkedIn OAuth:', 'blue');
  const linkedinChecks = [
    checkRequiredVar(
      vars,
      'LINKEDIN_CLIENT_ID',
      'LinkedIn Client ID from developer portal',
      true
    ),
    checkRequiredVar(
      vars,
      'LINKEDIN_CLIENT_SECRET',
      'LinkedIn Client Secret from developer portal',
      true
    ),
  ];

  // Check Instagram/Facebook
  log('\n4. Checking Instagram/Facebook OAuth:', 'blue');
  const instagramChecks = [
    checkRequiredVar(
      vars,
      'FACEBOOK_APP_ID',
      'Facebook App ID from Meta developers',
      true
    ),
    checkRequiredVar(
      vars,
      'FACEBOOK_APP_SECRET',
      'Facebook App Secret from Meta developers',
      true
    ),
  ];

  // Check Twitter
  log('\n5. Checking Twitter/X OAuth:', 'blue');
  const twitterChecks = [
    checkRequiredVar(
      vars,
      'TWITTER_CLIENT_ID',
      'Twitter Client ID from developer portal',
      true
    ),
    checkRequiredVar(
      vars,
      'TWITTER_CLIENT_SECRET',
      'Twitter Client Secret from developer portal',
      true
    ),
  ];

  // Check Discord
  log('\n6. Checking Discord OAuth:', 'blue');
  const discordChecks = [
    checkRequiredVar(
      vars,
      'DISCORD_CLIENT_ID',
      'Discord Client ID from developer portal',
      true
    ),
    checkRequiredVar(
      vars,
      'DISCORD_CLIENT_SECRET',
      'Discord Client Secret from developer portal',
      true
    ),
  ];

  // Check files
  log('\n7. Checking implementation files:', 'blue');
  const filesExist = checkFiles();

  // Summary
  log('\n========================================', 'blue');
  log('Summary', 'blue');
  log('========================================\n', 'blue');

  const allCoreValid = coreChecks.every((check) => check);
  const hasAtLeastOnePlatform =
    linkedinChecks.some((check) => check) ||
    instagramChecks.some((check) => check) ||
    twitterChecks.some((check) => check) ||
    discordChecks.some((check) => check);

  if (allCoreValid && hasAtLeastOnePlatform && filesExist) {
    log('✅ OAuth setup is complete!', 'green');
    log('\nNext steps:', 'blue');
    log('  1. Run database migration in Supabase', 'yellow');
    log('  2. Configure OAuth apps on each platform', 'yellow');
    log('  3. Test OAuth flow with: npm run dev', 'yellow');
    log('  4. Visit: /api/auth/connect?platform=linkedin', 'yellow');
    log('\nFor detailed instructions, see:', 'blue');
    log('  - /docs/oauth-implementation.md', 'yellow');
    log('  - /docs/oauth-quick-reference.md\n', 'yellow');
    process.exit(0);
  } else {
    log('⚠️  OAuth setup incomplete', 'yellow');

    if (!allCoreValid) {
      log('\n❌ Core configuration issues found', 'red');
      log('   Please fix the errors above', 'yellow');
    }

    if (!hasAtLeastOnePlatform) {
      log('\n⚠️  No social platforms configured', 'yellow');
      log('   Configure at least one platform (LinkedIn, Instagram, Twitter, or Discord)', 'yellow');
    }

    if (!filesExist) {
      log('\n❌ Some implementation files are missing', 'red');
      log('   Re-run the OAuth implementation script', 'yellow');
    }

    log('\nSee /docs/oauth-implementation.md for setup instructions\n', 'blue');
    process.exit(1);
  }
}

main();
