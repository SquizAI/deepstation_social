# Speaker Announcement Generator - Setup Guide

## Overview
The Speaker Announcement Generator automatically creates platform-optimized social media announcements for DeepStation speakers using OpenAI's GPT-4 API.

## Features Created

### 1. Speaker Management System
- **Speaker Form** (`/dashboard/speakers/new`): Comprehensive form for speaker details
- **Speaker List** (`/dashboard/speakers`): View and manage all speakers with search and filtering
- **Speaker Preview** (`/dashboard/speakers/preview/[id]`): View and edit generated announcements

### 2. AI Content Generation
- **Multi-platform support**: LinkedIn, Instagram, Twitter/X, Discord
- **Platform-optimized content**: Character limits, tone, formatting
- **DeepStation brand voice**: Community-focused, professional, inspiring
- **Regeneration capability**: Regenerate individual platform content

### 3. Speaker Card Images
- **HTML templates**: Ready-to-use templates for each platform
- **Platform-specific dimensions**:
  - LinkedIn: 1200x627px
  - Twitter: 1200x675px
  - Instagram: 1080x1080px (square)
  - Discord: 1920x1080px

### 4. Database Schema
- `speakers` table: Store speaker information
- `speaker_announcements` table: Store generated content
- `speaker-images` storage bucket: Store speaker photos and cards
- Row-level security policies for data protection

## Setup Instructions

### 1. Install Dependencies
The OpenAI SDK has already been installed:
```bash
npm install openai
```

### 2. Configure Environment Variables
Add your OpenAI API key to `.env.local`:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
```

To get an API key:
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy and paste it into your `.env.local` file

### 3. Run Database Migration
Apply the database schema:

```bash
# If using Supabase CLI
supabase db push

# Or run the SQL directly in Supabase Dashboard
# Navigate to SQL Editor and execute:
# supabase/migrations/20250104_speakers_tables.sql
```

This will create:
- `speakers` table
- `speaker_announcements` table
- Storage bucket for speaker images
- RLS policies for security
- Indexes for performance

### 4. Create Storage Bucket (if not auto-created)
In Supabase Dashboard:
1. Go to Storage
2. Create new bucket named `speaker-images`
3. Set as public
4. Configure CORS if needed

### 5. Test the System
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:4045/dashboard/speakers

3. Click "Add New Speaker" to test the form

4. Fill in speaker details and submit

5. View generated announcements in the preview page

## File Structure

```
app/
├── dashboard/
│   └── speakers/
│       ├── page.tsx                    # Speaker list page
│       ├── new/
│       │   └── page.tsx                # Speaker form
│       └── preview/
│           └── [id]/
│               └── page.tsx            # Preview & edit page
└── api/
    └── speakers/
        └── generate/
            └── route.ts                # AI generation API

components/
└── ui/
    └── tag-input.tsx                   # Tag input component

lib/
├── ai/
│   └── speaker-announcement.ts         # AI generation logic
├── images/
│   └── speaker-card.ts                 # Speaker card generation
└── types/
    └── speakers.ts                     # TypeScript types

supabase/
└── migrations/
    └── 20250104_speakers_tables.sql   # Database schema
```

## Usage Guide

### Creating a Speaker

1. **Navigate to Speakers Page**
   - Click "Speaker Announcements" in the sidebar
   - Or go to `/dashboard/speakers`

2. **Add New Speaker**
   - Click "Add New Speaker" button
   - Fill in required fields (marked with *)
   - Upload profile photo (optional but recommended)
   - Add social links for better announcements
   - Specify expertise areas using tag input
   - Set event date and location

3. **Generate Announcements**
   - Click "Generate Announcement"
   - System saves speaker to database
   - AI generates content for all platforms
   - Redirects to preview page

### Managing Generated Content

1. **View Announcements**
   - Preview page shows all generated content
   - Switch between platforms using tabs
   - See character counts and platform previews

2. **Edit Content**
   - Click "Edit" button for any platform
   - Modify content as needed
   - Click "Save" to update

3. **Regenerate Content**
   - Click "Regenerate" for any platform
   - AI creates new version
   - Previous content is replaced

4. **Schedule Posts**
   - Click "Schedule Posts" button
   - Redirects to post creation page
   - Content is pre-filled for all platforms
   - Set schedule and publish

### Searching and Filtering

- **Search**: Type speaker name, company, title, or presentation
- **Filter by Location**: Select Miami, Brazil, Virtual, or All
- **Stats**: View speaker counts by location

## AI Prompt Customization

### Platform-Specific Prompts
Located in `lib/ai/speaker-announcement.ts`:

- **LinkedIn**: Professional, business-focused, 1,200-1,500 chars
- **Twitter/X**: Concise threads, 3-4 tweets, 280 chars each
- **Instagram**: Visual, emoji-rich, 1,500-2,000 chars, 20+ hashtags
- **Discord**: Community-focused, detailed, markdown formatted

### Customizing Brand Voice
Edit the `buildPrompt` function to adjust:
- Community stats (3K+ members, 70+ events, etc.)
- Tone and style guidelines
- Required elements (hashtags, CTAs, etc.)
- Platform-specific instructions

## Image Generation

### Current Implementation
- HTML templates provided for all platforms
- Ready for conversion to images using:
  - Server-side: Puppeteer, Playwright
  - Client-side: html2canvas
  - External services: Cloudinary, Imgix, Vercel OG Image

### Integration Options

#### Option 1: Server-side with Puppeteer
```bash
npm install puppeteer
```

Then update `lib/images/speaker-card.ts`:
```typescript
import puppeteer from 'puppeteer';

async function htmlToImage(html: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const screenshot = await page.screenshot({ type: 'png' });
  await browser.close();
  return screenshot;
}
```

#### Option 2: Client-side with html2canvas
```bash
npm install html2canvas
```

Then use in component:
```typescript
import html2canvas from 'html2canvas';

const element = document.getElementById('speaker-card');
const canvas = await html2canvas(element);
const blob = await new Promise(resolve => canvas.toBlob(resolve));
```

#### Option 3: External Service
Use services like:
- Cloudinary (Image transformations)
- Imgix (Real-time image processing)
- Vercel OG Image (Open Graph images)
- Bannerbear (Template-based image generation)

## API Usage

### Generate All Platform Announcements
```typescript
POST /api/speakers/generate
{
  "speakerId": "uuid",
  "eventLink": "https://deepstation.ai/events/..."
}
```

### Regenerate Single Platform
```typescript
POST /api/speakers/generate
{
  "speakerId": "uuid",
  "platform": "linkedin",
  "eventLink": "https://deepstation.ai/events/..."
}
```

## Troubleshooting

### OpenAI API Errors

**Error: Invalid API Key**
- Verify `OPENAI_API_KEY` in `.env.local`
- Check key is active in OpenAI dashboard
- Restart dev server after changing env vars

**Error: Rate Limit Exceeded**
- OpenAI has rate limits based on account tier
- Add retry logic (already implemented)
- Consider upgrading OpenAI account

**Error: Content Too Long**
- AI automatically retries with shorter prompts
- Edit content manually if needed
- Adjust character limits in platform config

### Database Errors

**Error: Speaker not found**
- Verify speaker exists in database
- Check user_id matches authenticated user
- Review RLS policies

**Error: Cannot insert speaker**
- Check all required fields are provided
- Verify data types match schema
- Review validation logic

### Image Upload Errors

**Error: Failed to upload image**
- Check Supabase storage bucket exists
- Verify bucket is public
- Review storage policies
- Check file size limits (default 50MB)

## Performance Optimization

### AI Generation
- Parallel generation: All platforms generated simultaneously
- Retry logic: Automatic retry with exponential backoff
- Caching: Consider caching generated content

### Database Queries
- Indexes created on frequently queried fields
- RLS policies optimized for performance
- Consider pagination for large speaker lists

### Image Storage
- Compress images before upload
- Use WebP format for better compression
- Implement lazy loading for images
- Consider CDN for image delivery

## Future Enhancements

### Planned Features
1. **Bulk Speaker Import**: CSV/Excel upload
2. **Template Library**: Save and reuse announcement templates
3. **A/B Testing**: Test different announcement versions
4. **Analytics**: Track announcement performance
5. **Scheduling**: Auto-schedule announcements
6. **Multi-language**: Generate in multiple languages
7. **Image Automation**: Full image generation pipeline
8. **Speaker Portal**: Self-service speaker submission

### Integration Opportunities
- Event management platforms (Eventbrite, Luma)
- CRM systems (HubSpot, Salesforce)
- Email marketing (Mailchimp, SendGrid)
- Calendar integrations (Google Calendar, Outlook)

## Support and Resources

### Documentation
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

### DeepStation Brand Guidelines
- Community stats: 3,000+ members, 70+ events, 100+ speakers
- Locations: Miami, Brazil (expanding worldwide)
- Official OpenAI Academy Launch Partner
- Focus: AI education, innovation, community

### Getting Help
- Check error logs in browser console
- Review Supabase logs for database issues
- Check OpenAI usage dashboard for API issues
- Review this documentation for common issues

## License and Credits

Created for DeepStation AI community platform.
Uses OpenAI GPT-4 for content generation.
Built with Next.js, React, TypeScript, and Supabase.
