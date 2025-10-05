# Email Marketing System Documentation

## Overview

The Email Marketing System is a comprehensive newsletter and campaign management platform built into DeepStation. It allows users to create beautiful emails, manage subscribers, and send targeted campaigns.

## Features

### 1. Campaign Management
- Create, edit, and delete email campaigns
- Draft, scheduled, and sent campaign tracking
- Campaign duplication for quick reuse
- Real-time statistics (open rate, click rate, etc.)
- Template-based or custom HTML emails

### 2. Email Editor
- Rich content editor with personalization tokens
- Subject line and preview text
- Template selector with 5 pre-designed templates
- Desktop and mobile preview modes
- Test email sending
- Draft saving
- Campaign scheduling
- Immediate sending

### 3. Subscriber Management
- Add individual subscribers
- CSV import for bulk subscriber addition
- Search and filter subscribers
- Tag-based organization
- Bulk operations (unsubscribe, delete)
- Status tracking (active, unsubscribed, bounced, complained)

### 4. Template Gallery
- 5 pre-designed professional templates:
  - Newsletter Template (clean and modern)
  - Announcement Template (bold updates)
  - Event Invitation (beautiful event template)
  - Product Launch (sleek product announcement)
  - Promotional Offer (eye-catching deals)
- Category filtering
- Template preview with live rendering
- One-click template selection

### 5. Analytics Dashboard
- Total subscribers count
- Active subscribers tracking
- Total campaigns sent
- Average open rate
- Average click rate
- Industry benchmarks

## Database Schema

### email_campaigns
Stores all email campaigns with their content and status.

```sql
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  preview_text TEXT,
  content TEXT NOT NULL,
  template_id TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### email_subscribers
Manages the subscriber list with contact information and status.

```sql
CREATE TABLE email_subscribers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  tags TEXT[],
  metadata JSONB,
  status TEXT DEFAULT 'active',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);
```

### email_templates
Stores reusable email templates with HTML content.

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  html_content TEXT NOT NULL,
  category TEXT DEFAULT 'custom',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### campaign_recipients
Tracks individual recipient interactions with campaigns.

```sql
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id),
  subscriber_id UUID REFERENCES email_subscribers(id),
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, subscriber_id)
);
```

### subscriber_lists
Create subscriber segments for targeted campaigns.

```sql
CREATE TABLE subscriber_lists (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  filter_criteria JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## File Structure

```
app/
├── dashboard/
│   └── email/
│       └── page.tsx                 # Main email marketing page
├── api/
│   └── email/
│       ├── send/
│       │   └── route.ts            # Campaign sending API
│       └── send-test/
│           └── route.ts            # Test email API

components/
└── email/
    ├── email-editor.tsx            # Campaign editor component
    ├── email-preview.tsx           # Email preview component
    ├── campaign-list.tsx           # Campaign management component
    ├── subscriber-manager.tsx      # Subscriber management component
    └── template-gallery.tsx        # Template selection component

supabase/
└── migrations/
    └── 012_email_newsletter.sql    # Database migration
```

## Component Details

### EmailEditor
The main campaign creation and editing interface.

**Props:**
- `campaign`: Campaign object (null for new campaigns)
- `onSave`: Callback when campaign is saved
- `onCancel`: Callback when editing is cancelled

**Features:**
- Template selection
- Subject line (with character count)
- Preview text
- Personalization token insertion
- Content editor
- Recipient type selection
- Schedule picker
- Multiple action buttons (test, draft, schedule, send)

### EmailPreview
Real-time email preview with desktop/mobile modes.

**Props:**
- `subject`: Email subject
- `previewText`: Preview text
- `content`: Email content
- `templateId`: Selected template ID
- `mode`: 'desktop' | 'mobile'

**Features:**
- Email client mockup header
- Template rendering with variable replacement
- Responsive preview switching
- Loading states

### CampaignList
Display and manage all campaigns.

**Props:**
- `campaigns`: Array of campaign objects
- `onEdit`: Callback when campaign is edited
- `onRefresh`: Callback to refresh campaign list

**Features:**
- Status filtering (all, draft, scheduled, sent)
- Campaign cards with stats
- Edit, duplicate, and delete actions
- Status badges
- Performance metrics

### SubscriberManager
Comprehensive subscriber management interface.

**Props:**
- `subscribers`: Array of subscriber objects
- `onRefresh`: Callback to refresh subscriber list

**Features:**
- Search functionality
- Status filtering
- Add individual subscriber modal
- CSV import modal
- Bulk selection and actions
- Subscriber table with sorting

### TemplateGallery
Browse and select email templates.

**Props:**
- `onSelectTemplate`: Callback when template is selected

**Features:**
- Category filtering
- Template preview cards
- Full-screen template preview
- SVG thumbnails
- Category badges

## Personalization Tokens

The following tokens can be used in email content and will be replaced with subscriber data:

- `{{firstName}}` - Subscriber's first name
- `{{lastName}}` - Subscriber's last name
- `{{email}}` - Subscriber's email address
- `{{company}}` - Subscriber's company (from metadata)
- `{{subject}}` - Email subject line
- `{{preview_text}}` - Email preview text
- `{{content}}` - Main email content
- `{{unsubscribe_url}}` - Unsubscribe link
- `{{event_url}}` - Event registration link
- `{{product_url}}` - Product page link
- `{{offer_url}}` - Promotional offer link

## API Endpoints

### POST /api/email/send-test
Send a test email to verify campaign before sending.

**Request Body:**
```json
{
  "email": "test@example.com",
  "subject": "Test Subject",
  "content": "Test content",
  "template_id": "uuid-here" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

### POST /api/email/send
Send campaign to all active subscribers.

**Request Body:**
```json
{
  "campaign_id": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Campaign sent successfully",
  "stats": {
    "total": 100,
    "sent": 98,
    "failed": 2
  }
}
```

## Email Service Integration

The current implementation uses placeholder logging for email sending. To integrate with a real email service provider:

### Option 1: Resend (Recommended)

1. Install Resend:
```bash
npm install resend
```

2. Add API key to `.env.local`:
```
RESEND_API_KEY=your_api_key_here
```

3. Update `/app/api/email/send/route.ts`:
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'DeepStation <noreply@deepstation.ai>',
  to: subscriber.email,
  subject: campaign.subject,
  html: personalizedContent,
})
```

### Option 2: SendGrid

1. Install SendGrid:
```bash
npm install @sendgrid/mail
```

2. Add API key to `.env.local`:
```
SENDGRID_API_KEY=your_api_key_here
```

3. Update email sending code accordingly.

### Option 3: AWS SES

1. Install AWS SDK:
```bash
npm install @aws-sdk/client-ses
```

2. Configure AWS credentials
3. Update email sending code

## CSV Import Format

When importing subscribers via CSV, use this format:

```csv
email,first_name,last_name,tags
john@example.com,John,Doe,newsletter;vip
jane@example.com,Jane,Smith,newsletter
bob@example.com,Bob,Johnson,tech;newsletter
```

**Requirements:**
- First row must be headers
- `email` column is required
- `tags` should be semicolon-separated if multiple

## Security & Permissions

All tables have Row Level Security (RLS) enabled:

1. Users can only access their own campaigns
2. Users can only manage their own subscribers
3. Users can view default templates and their own custom templates
4. Campaign recipients are accessible only to campaign owners

## Future Enhancements

### Planned Features:
1. **A/B Testing**: Test subject lines and content variations
2. **Automation**: Drip campaigns and triggered emails
3. **Advanced Segmentation**: Dynamic subscriber lists based on behavior
4. **Email Tracking**: Open and click tracking with webhooks
5. **Drag-and-Drop Editor**: Visual email builder
6. **Advanced Analytics**: Engagement metrics, conversion tracking
7. **Custom Domains**: Send from custom domain
8. **Bounce Handling**: Automatic bounce detection and cleanup
9. **Unsubscribe Pages**: Branded unsubscribe management
10. **Email Validation**: Real-time email validation on import

## Usage Examples

### Creating a New Campaign

1. Navigate to Email Marketing in the sidebar
2. Click "Create Campaign" button
3. Select a template or start from blank
4. Enter subject line and preview text
5. Write your email content
6. Insert personalization tokens as needed
7. Preview in desktop and mobile modes
8. Send test email to verify
9. Save as draft or schedule/send immediately

### Importing Subscribers

1. Go to the Subscribers tab
2. Click "Import CSV" button
3. Select your CSV file (must have email column)
4. System will import all valid email addresses
5. Duplicates are automatically skipped

### Scheduling a Campaign

1. Create or edit a campaign
2. Select date and time in the schedule section
3. Click "Schedule Campaign"
4. Campaign will be sent automatically at scheduled time

## Troubleshooting

### Emails Not Sending
- Verify email service API keys are configured
- Check subscriber list has active subscribers
- Ensure campaign status is not already 'sent'
- Review server logs for detailed error messages

### Template Not Rendering
- Verify template HTML is valid
- Check that all required variables are defined
- Review browser console for JavaScript errors

### CSV Import Failing
- Ensure CSV has 'email' column header
- Check for proper comma separation
- Verify file encoding is UTF-8
- Ensure no special characters in headers

## Support

For questions or issues with the email marketing system:
1. Check this documentation
2. Review the code comments
3. Check Supabase logs for database errors
4. Review browser console for frontend errors
5. Contact DeepStation support team

---

**Version:** 1.0.0
**Last Updated:** 2025-01-04
**Maintainer:** DeepStation Development Team
