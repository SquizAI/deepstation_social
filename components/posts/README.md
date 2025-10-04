# Post Editor Components

This directory contains the post creation and scheduling components for DeepStation's social media management system.

## Components

### PostEditor (`post-editor.tsx`)
Multi-platform post composer with real-time character counting and validation.

**Features:**
- Tabbed interface for LinkedIn, Instagram, Twitter, and Discord
- Real-time character counting with visual indicators
- Platform-specific character limits enforcement
- Image upload support with preview
- Auto-save draft functionality
- Platform-specific tips and best practices
- Character limit warnings (yellow at 90%, red when exceeded)

**Usage:**
```tsx
<PostEditor
  onSave={handleSaveDraft}
  initialContent={existingContent}
  onChange={handleContentChange}
  images={uploadedImages}
  onImageUpload={handleImageUpload}
  onImageRemove={handleImageRemove}
/>
```

### PlatformPreview (`platform-preview.tsx`)
Real-time preview showing how posts will appear on each platform.

**Features:**
- Platform-specific styling and layouts
- Live preview as user types
- Image preview integration
- Authentic platform UI mockups

**Usage:**
```tsx
<PlatformPreview
  platform="linkedin"
  content={postContent.linkedin}
  imageUrl={images.linkedin}
/>
```

### SchedulePicker (`schedule-picker.tsx`)
Advanced scheduling interface with timezone support and recurring options.

**Features:**
- Date and time selection
- Timezone selector (ET, CT, MT, PT, BRT)
- Recurring post options (daily, weekly, monthly)
- Weekly day selection for recurring posts
- Optimal posting times suggestions
- "Post Now" and "Schedule" actions
- Date validation (prevents past dates)

**Usage:**
```tsx
<SchedulePicker
  onSchedule={handleSchedule}
  onPostNow={handlePostNow}
/>
```

## Character Limits

| Platform  | Limit  |
|-----------|--------|
| LinkedIn  | 3,000  |
| Instagram | 2,200  |
| Twitter   | 280    |
| Discord   | 4,000  |

## Platform-Specific Guidelines

### LinkedIn
- Professional tone
- 3-5 hashtags recommended
- Best time: 9:00 AM - 10:00 AM (weekdays)
- Tag company pages for better reach

### Instagram
- Visual and engaging language
- 20-30 hashtags recommended
- Best time: 11:00 AM - 1:00 PM
- Lead with compelling hook

### Twitter
- Concise and punchy
- Use threads for longer content
- Best time: 12:00 PM - 3:00 PM
- Tag relevant accounts

### Discord
- Community-focused
- Use markdown formatting
- Best time: 6:00 PM - 9:00 PM
- Include @everyone or @here for announcements

## Image Requirements

### File Types
- JPEG, PNG, GIF, WebP
- Maximum size: 10MB

### Platform Dimensions
- **LinkedIn**: 1200x627px
- **Twitter**: 1200x675px
- **Instagram**: 1080x1080px (square) or 1080x1350px (portrait)
- **Discord**: 1920x1080px

## API Integration

Posts are published via the `/api/publish` endpoint which handles:
- OAuth token management
- Platform-specific API calls
- Error handling and retry logic
- Publishing status updates

## Database Schema

### scheduled_posts table
```sql
{
  id: uuid
  user_id: uuid
  content: jsonb (PostContent)
  images: jsonb (PostImage[])
  platforms: text[]
  scheduled_for: timestamp
  timezone: text
  recurring: jsonb (RecurringOptions)
  status: enum('draft', 'scheduled', 'publishing', 'published', 'failed')
  published_at: timestamp
  publish_results: jsonb
  created_at: timestamp
  updated_at: timestamp
}
```

## Types

See `/lib/types/posts.ts` for TypeScript type definitions:
- `Platform`
- `PostContent`
- `PostImage`
- `RecurringOptions`
- `ScheduledPost`

## Utilities

### Validation (`/lib/utils/validation.ts`)
- Content validation
- Character counting
- Image validation
- URL validation
- Hashtag extraction

### Timezone (`/lib/utils/timezone.ts`)
- Timezone conversion
- Date formatting
- Optimal posting times
- Recurring schedule calculation

## Example Workflow

1. User selects platforms (only connected accounts available)
2. User composes content in tabbed editor
3. Real-time preview shows how post will appear
4. User uploads images (optional)
5. User schedules post or posts immediately
6. System validates content and character limits
7. Post is saved to database
8. For immediate posts, publish API is called
9. For scheduled posts, cron job will trigger at scheduled time
10. Results are tracked in publish_results field
