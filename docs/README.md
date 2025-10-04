# DeepStation Social Media Integration Platform

## Overview
Complete technical documentation for DeepStation's social media automation and integration platform. This system enables OAuth-based authentication, automated speaker announcements, and scheduled posting across LinkedIn, Instagram, X (Twitter), and Discord.

## About DeepStation

**DeepStation** accelerates AI education and innovation through the power of community, empowering engineers, professionals, and enthusiasts to thrive in the AI wave.

### Community Stats
- **70+** Events Hosted
- **3,000+** Community Members
- **100+** Expert Speakers
- **2** Global Chapters (Miami & Brazil)
- **Official OpenAI Academy Launch Partner**

Website: [https://deepstation.ai/](https://deepstation.ai/)

## Documentation Structure

### 1. [OAuth Flow for Login](./oauth-flow.md)
Complete OAuth 2.0 implementation guide for all supported platforms.

**Covers:**
- LinkedIn OAuth 2.0 with 60-day access tokens
- Instagram Graph API via Facebook Login
- X (Twitter) OAuth 2.0 with PKCE
- Discord OAuth 2.0 and webhooks
- Supabase Auth integration
- Token storage and refresh mechanisms
- Security best practices

**Key Features:**
- Multi-platform authentication
- Secure token encryption
- Automatic token refresh
- Row-level security (RLS) policies

### 2. [Speaker Announcement Generator](./speaker-announcement-generator.md)
AI-powered content generation system for speaker announcements.

**Covers:**
- DeepStation brand voice and standards
- Platform-specific templates (LinkedIn, Instagram, X, Discord)
- Speaker form data structure
- AI prompt engineering
- Image generation with brand elements
- Character limit validation
- Review and approval workflow

**Key Features:**
- Auto-generated announcements for all platforms
- Branded speaker card images
- Platform-optimized content
- Analytics and engagement tracking

### 3. [Social Media Integration System](./social-media-integration-system.md)
Technical architecture for direct platform API integration.

**Covers:**
- System architecture and components
- OAuth token management
- Post creation and storage
- Media handling and optimization
- Platform-specific API implementations
- Error handling and retry logic
- Rate limit management
- Multi-platform publishing

**Key Features:**
- Unified publishing interface
- Automatic retry on failure
- Rate limit compliance
- Real-time analytics

### 4. [Posting System with Scheduling](./posting-system-with-scheduling.md)
Advanced scheduling system with timezone support and recurring posts.

**Covers:**
- Database schema for scheduled posts
- Single and bulk scheduling
- Recurring post configuration
- Optimal time suggestions
- Timezone management
- Cron job implementation
- Queue processing
- Error recovery

**Key Features:**
- Schedule posts weeks in advance
- Recurring posts (weekly events, monthly newsletters)
- Bulk scheduling with automatic spacing
- AI-powered optimal time suggestions
- Calendar view for visual planning

## Technology Stack

### Backend
- **Runtime**: Node.js / Deno (for Edge Functions)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Scheduling**: Supabase Edge Functions with Cron

### Frontend
- **Framework**: Next.js (recommended)
- **Language**: TypeScript
- **State Management**: React Context / Zustand
- **UI Components**: shadcn/ui or similar

### APIs & Integrations
- LinkedIn API v2
- Instagram Graph API v23.0+
- X (Twitter) API v2
- Discord API
- Supabase API

### Additional Tools
- **Image Processing**: Canvas API or Sharp
- **Date/Time**: date-fns-tz
- **Recurrence**: RRule library
- **AI Generation**: OpenAI GPT-4 or similar

## Quick Start Guide

### Prerequisites
1. Supabase account and project
2. Developer accounts on:
   - LinkedIn Developer Portal
   - Meta for Developers (Instagram)
   - X Developer Portal
   - Discord Developer Portal

### Setup Steps

1. **Clone and Install**
```bash
npm install @supabase/supabase-js
npm install date-fns-tz rrule
```

2. **Configure Supabase**
   - Run SQL migrations from each documentation file
   - Set up Row Level Security policies
   - Create storage buckets for images
   - Configure Edge Functions for scheduling

3. **Configure OAuth Apps**
   - Follow platform-specific setup in [oauth-flow.md](./oauth-flow.md)
   - Add redirect URLs for each platform
   - Store Client IDs and Secrets in environment variables

4. **Environment Variables**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Instagram (Facebook)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Twitter/X
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Discord
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

5. **Deploy Edge Functions**
```bash
supabase functions deploy process-scheduled-posts
supabase functions schedule process-scheduled-posts --cron "* * * * *"
```

## Platform-Specific Considerations

### LinkedIn
- ✅ 60-day access token lifespan
- ✅ Refresh tokens available
- ⚠️ 500 API calls per day per user
- ✅ Support for images and rich media

### Instagram
- ✅ Graph API for business accounts
- ⚠️ 100 posts per 24 hours limit
- ⚠️ JPEG images only
- ⚠️ Images must be publicly accessible
- ✅ Container-based publishing

### X (Twitter)
- ⚠️ Free tier: 500 posts per month (2025)
- ✅ OAuth 2.0 with PKCE required
- ✅ Thread support
- ✅ Media upload API

### Discord
- ✅ Webhook-based posting (no complex OAuth)
- ✅ Rich embeds and formatting
- ✅ 5 requests per 2 seconds per webhook
- ✅ File attachments supported

## Rate Limits Summary

| Platform  | Limit                    | Window  | Notes                           |
|-----------|--------------------------|---------|----------------------------------|
| LinkedIn  | 500 calls               | 24 hrs  | Per user                        |
| Instagram | 100 posts               | 24 hrs  | Rolling window                  |
| X         | 500 posts               | 30 days | Free tier (2025)                |
| Discord   | 5 requests              | 2 secs  | Per webhook                     |

## Database Schema Overview

```
┌─────────────────────┐
│   auth.users        │
└──────┬──────────────┘
       │
       ├──→ oauth_tokens (LinkedIn, Instagram, Twitter, Discord)
       │
       ├──→ scheduled_posts (Draft, Scheduled, Published)
       │     │
       │     ├──→ recurring_posts (RRULE, next_occurrence)
       │     │
       │     └──→ publishing_queue (Platform-specific)
       │           │
       │           └──→ post_results (Metrics, URLs)
       │
       └──→ social_accounts (Multi-account support)
```

## Security Checklist

- [x] OAuth state parameter for CSRF protection
- [x] Token encryption at rest
- [x] Row Level Security (RLS) enabled
- [x] HTTPS only for all OAuth flows
- [x] Secure token storage in database
- [x] API key rotation policy
- [x] Input validation and sanitization
- [x] Rate limiting on API endpoints
- [x] Audit logging for all publish events

## Testing Strategy

### Unit Tests
- OAuth token management
- Content generation logic
- Scheduling calculations
- Timezone conversions

### Integration Tests
- End-to-end OAuth flow
- Multi-platform publishing
- Scheduled post execution
- Recurring post generation

### Manual Testing
- Test each platform individually
- Verify character limits
- Check image formatting
- Validate timezone handling
- Test error recovery

## Monitoring & Analytics

### Key Metrics to Track
- OAuth success/failure rates
- Post publishing success rates
- Platform-specific engagement
- API rate limit usage
- Scheduler execution time
- Error rates by platform

### Recommended Tools
- Supabase Dashboard for database metrics
- Custom analytics dashboard
- Platform-native analytics
- Error tracking (Sentry, LogRocket)

## Roadmap & Future Enhancements

### Phase 1 (Current)
- [x] OAuth integration for all platforms
- [x] Basic scheduling functionality
- [x] Speaker announcement generation
- [x] Manual posting to platforms

### Phase 2 (Planned)
- [ ] A/B testing for post content
- [ ] Advanced analytics dashboard
- [ ] Template library expansion
- [ ] Multi-user team collaboration
- [ ] Mobile app for approvals

### Phase 3 (Future)
- [ ] AI-powered engagement prediction
- [ ] Automated response to comments
- [ ] Video content support
- [ ] Integration with event management systems
- [ ] White-label solution for other communities

## Support & Contributing

### Getting Help
- Review documentation thoroughly
- Check platform-specific API docs
- Test with sandbox accounts first

### Common Issues
1. **Token Expiration**: Implement automatic refresh
2. **Rate Limits**: Add retry logic with exponential backoff
3. **Image Formats**: Instagram requires JPEG only
4. **Timezone Issues**: Always store in UTC, convert for display

## License
Internal use for DeepStation community

## Changelog

### Version 1.0.0 (2025)
- Initial documentation
- OAuth implementation for 4 platforms
- Scheduling system with recurring posts
- Speaker announcement generator
- Multi-platform publishing

---

**Maintained by**: DeepStation Development Team
**Last Updated**: October 2025
**Contact**: [Contact via deepstation.ai](https://deepstation.ai/)
