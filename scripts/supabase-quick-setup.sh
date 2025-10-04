#!/bin/bash

# DeepStation Supabase Quick Setup Script
# This script guides you through setting up Supabase and runs all migrations

set -e

echo "🚀 DeepStation Supabase Quick Setup"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Supabase CLI not found. Installing...${NC}"
    brew install supabase/tap/supabase
fi

echo -e "${GREEN}✓ Supabase CLI installed${NC}"
echo ""

# Prompt for credentials
echo "Please enter your Supabase project details:"
echo "(You can find these at https://supabase.com/dashboard → Settings → API)"
echo ""

read -p "Project Reference ID (e.g., abcdefghijklmnop): " PROJECT_REF
read -p "Project URL (e.g., https://abcd.supabase.co): " PROJECT_URL
read -p "Anon/Public Key: " ANON_KEY
read -sp "Service Role Key: " SERVICE_KEY
echo ""
echo ""

# Update .env.local
echo -e "${YELLOW}Updating .env.local...${NC}"

if [ -f .env.local ]; then
    # Update existing file
    sed -i '' "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$PROJECT_URL|" .env.local
    sed -i '' "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
    sed -i '' "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" .env.local
else
    # Create new file
    cp .env.local.example .env.local
    sed -i '' "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$PROJECT_URL|" .env.local
    sed -i '' "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
    sed -i '' "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" .env.local
fi

echo -e "${GREEN}✓ Updated .env.local${NC}"
echo ""

# Link project
echo -e "${YELLOW}Linking to Supabase project...${NC}"
supabase link --project-ref "$PROJECT_REF"
echo -e "${GREEN}✓ Project linked${NC}"
echo ""

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
echo "This will create all tables, policies, and functions."
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase db push
    echo -e "${GREEN}✓ Migrations complete${NC}"
else
    echo -e "${YELLOW}Skipped migrations. Run manually: supabase db push${NC}"
fi
echo ""

# Deploy Edge Functions
echo -e "${YELLOW}Deploying Edge Functions...${NC}"
read -p "Deploy process-scheduled-posts function? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Set secrets for Edge Function
    echo "Setting Edge Function secrets..."

    # Get encryption key from .env.local
    ENCRYPTION_KEY=$(grep ENCRYPTION_KEY .env.local | cut -d '=' -f2)

    supabase secrets set \
        SUPABASE_URL="$PROJECT_URL" \
        SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY" \
        ENCRYPTION_KEY="$ENCRYPTION_KEY" \
        --project-ref "$PROJECT_REF"

    # Deploy function
    supabase functions deploy process-scheduled-posts --project-ref "$PROJECT_REF"

    # Schedule cron job (every 5 minutes)
    supabase functions schedule process-scheduled-posts \
        --cron "*/5 * * * *" \
        --project-ref "$PROJECT_REF"

    echo -e "${GREEN}✓ Edge Function deployed and scheduled${NC}"
else
    echo -e "${YELLOW}Skipped Edge Functions${NC}"
fi
echo ""

# Verify setup
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Verification:"
echo "  - Database: $PROJECT_URL"
echo "  - Tables created: oauth_tokens, scheduled_posts, speakers, etc."
echo "  - Storage buckets: post-images, speaker-photos"
echo "  - Edge Function: process-scheduled-posts (runs every 5 min)"
echo ""
echo "Next steps:"
echo "  1. Test locally: npm run dev"
echo "  2. Visit http://localhost:3055"
echo "  3. Create an account and test features"
echo "  4. Deploy to Netlify when ready"
echo ""
echo "Need help? Check SUPABASE_SETUP.md"
