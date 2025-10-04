# Quick Start Guide - Speaker Announcement Generator

## Setup in 5 Minutes

### Step 1: Add OpenAI API Key
1. Get your API key from https://platform.openai.com/api-keys
2. Open `.env.local` in your project root
3. Add this line:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

### Step 2: Run Database Migration
Execute the SQL migration in Supabase:

**Option A - Supabase Dashboard:**
1. Go to your Supabase project
2. Click "SQL Editor"
3. Click "New Query"
4. Copy the contents of `supabase/migrations/20250104_speakers_tables.sql`
5. Paste and click "Run"

**Option B - Supabase CLI:**
```bash
supabase db push
```

### Step 3: Start the App
```bash
npm run dev
```

### Step 4: Create Your First Speaker
1. Open http://localhost:4045/dashboard/speakers
2. Click "Add New Speaker"
3. Fill in the form:
   - Name: John Doe
   - Title: AI Research Scientist
   - Company: OpenAI
   - Bio: Expert in large language models...
   - Presentation Title: Building with GPT-4
   - Presentation Description: Learn how to...
   - Event Date: Select a date
   - Location: Miami
4. Click "Generate Announcement"

### Step 5: View Generated Content
- AI will generate announcements for all 4 platforms
- Review and edit as needed
- Click "Schedule Posts" to publish

## That's It!

You now have a working speaker announcement generator.

## What You Can Do

### Create Speakers
- Add speaker details
- Upload photos
- Set event information
- Tag expertise areas

### Generate Announcements
- AI creates platform-optimized content
- LinkedIn: Professional announcements
- Instagram: Visual, engaging posts
- Twitter: Concise threads
- Discord: Community updates

### Manage Content
- Edit generated text
- Regenerate individual platforms
- View platform previews
- Schedule or publish posts

### Search & Filter
- Search by name, company, or topic
- Filter by location
- View speaker stats

## File Locations

**Created Pages:**
- `/app/dashboard/speakers` - Speaker list
- `/app/dashboard/speakers/new` - Add speaker form
- `/app/dashboard/speakers/preview/[id]` - View/edit announcements

**Created Libraries:**
- `/lib/ai/speaker-announcement.ts` - AI generation
- `/lib/images/speaker-card.ts` - Image templates
- `/lib/types/speakers.ts` - TypeScript types

**Created Components:**
- `/components/ui/tag-input.tsx` - Tag input field

**Database:**
- `speakers` table - Speaker data
- `speaker_announcements` table - Generated content
- `speaker-images` bucket - Photos and cards

## API Endpoint

```typescript
POST /api/speakers/generate
{
  "speakerId": "uuid",
  "platform": "linkedin", // optional, omit for all
  "eventLink": "https://..." // optional
}
```

## Environment Variables Required

```bash
# Required
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Costs

**OpenAI API:**
- ~$0.01 per speaker (all 4 platforms with GPT-4o)
- ~$0.002 per speaker (with GPT-3.5-turbo)

**Supabase:**
- Free tier covers typical usage
- Storage: Minimal (photos only)

## Need Help?

1. Check `docs/SPEAKER_ANNOUNCEMENT_SETUP.md` for detailed docs
2. Review `SPEAKER_ANNOUNCEMENT_IMPLEMENTATION.md` for technical details
3. Look at error messages in browser console
4. Verify environment variables are set

## Common Issues

**"OpenAI API Error"**
→ Check your API key in `.env.local`

**"Speaker not found"**
→ Run the database migration

**"Cannot upload image"**
→ Check storage bucket exists in Supabase

**"Unauthorized"**
→ Make sure you're logged in

## What's Next?

### Test the System
1. Create a few sample speakers
2. Generate announcements
3. Try editing content
4. Test regeneration
5. Schedule some posts

### Customize
1. Edit prompts in `lib/ai/speaker-announcement.ts`
2. Adjust character limits
3. Modify platform templates
4. Update brand voice

### Extend
1. Add image generation service
2. Implement bulk import
3. Create template library
4. Add analytics tracking

## Features Included

✅ Multi-platform content generation (LinkedIn, Instagram, Twitter, Discord)
✅ AI-powered with OpenAI GPT-4
✅ Platform-specific optimization
✅ Character limit validation
✅ DeepStation brand voice
✅ Speaker photo upload
✅ Search and filtering
✅ Edit and regenerate
✅ Integration with post scheduler
✅ TypeScript type safety
✅ Row-level security
✅ Responsive design

## Pro Tips

1. **Better Results:** Add more speaker details (highlights, previous companies)
2. **Save Time:** Use regenerate for specific platforms instead of editing
3. **Consistency:** Let AI generate first, then minor edits only
4. **Images:** Upload speaker photos for better visual content
5. **Schedule:** Generate multiple speakers, then batch schedule

Enjoy your automated speaker announcements!
