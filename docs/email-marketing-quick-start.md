# Email Marketing - Quick Start Guide

## Setup Instructions

### 1. Run Database Migration

First, apply the email marketing database migration:

```bash
# Navigate to your project directory
cd /Users/mattysquarzoni/Documents/Documents\ -\ \ MacBook\ Skynet/Deepstation

# Run the migration using Supabase CLI
supabase db push

# Or manually run the migration in Supabase Dashboard:
# Go to SQL Editor and run the contents of:
# supabase/migrations/012_email_newsletter.sql
```

### 2. Verify Tables Created

Check that the following tables exist in your Supabase database:
- `email_campaigns`
- `email_subscribers`
- `email_templates`
- `campaign_recipients`
- `subscriber_lists`
- `list_subscribers`

### 3. Verify Default Templates

The migration automatically creates 5 default templates. Verify they exist:

```sql
SELECT id, name, category FROM email_templates WHERE is_default = true;
```

You should see:
- Newsletter Template
- Announcement Template
- Event Invitation
- Product Launch
- Promotional Offer

### 4. Access the Email Marketing Page

1. Start your development server:
```bash
npm run dev
```

2. Navigate to: `http://localhost:3000/dashboard/email`

3. You should see the Email Marketing dashboard with:
   - Stats cards showing 0 subscribers and campaigns
   - "Create Campaign" button
   - Navigation tabs for Campaigns, Subscribers, and Templates

## First Steps

### Add Your First Subscriber

1. Click on the "Subscribers" tab
2. Click "Add Subscriber" button
3. Fill in the form:
   - Email: `test@example.com`
   - First Name: `Test`
   - Last Name: `User`
   - Tags: `newsletter, test`
4. Click "Add Subscriber"

### Create Your First Campaign

1. Click "Create Campaign" button
2. Select a template from the dropdown (e.g., "Newsletter Template")
3. Enter a subject line: `Welcome to DeepStation!`
4. Enter preview text: `Thank you for subscribing to our newsletter`
5. Write your content:
```
Hi {{firstName}},

Welcome to DeepStation! We're excited to have you join our community.

**Here's what you can expect:**
- Weekly AI insights and tips
- Exclusive event invitations
- Early access to new features

Stay tuned for more!

Best regards,
The DeepStation Team
```
6. Click "Save as Draft"

### Send a Test Email

1. In the campaign editor, click "Send Test Email"
2. Enter your email address
3. Check your inbox (note: actual sending requires email service setup)

### Schedule or Send Campaign

**To Schedule:**
1. Select a date and time in the schedule section
2. Click "Schedule Campaign"

**To Send Immediately:**
1. Click "Send Now"
2. Confirm the action
3. Campaign will be sent to all active subscribers

## Email Service Setup (Required for Production)

The system uses placeholder logging by default. To actually send emails:

### Option A: Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Install Resend:
```bash
npm install resend
```

4. Add to `.env.local`:
```env
RESEND_API_KEY=re_your_api_key_here
```

5. Uncomment the Resend code in:
   - `/app/api/email/send-test/route.ts`
   - `/app/api/email/send/route.ts`

### Option B: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Install SendGrid:
```bash
npm install @sendgrid/mail
```

4. Add to `.env.local`:
```env
SENDGRID_API_KEY=SG.your_api_key_here
```

5. Update the email sending code in API routes

## Testing the Full Flow

### 1. Import Multiple Subscribers

Create a CSV file `subscribers.csv`:
```csv
email,first_name,last_name,tags
alice@example.com,Alice,Johnson,newsletter;vip
bob@example.com,Bob,Smith,newsletter
charlie@example.com,Charlie,Brown,newsletter;tech
```

1. Go to Subscribers tab
2. Click "Import CSV"
3. Select your CSV file
4. Verify subscribers are imported

### 2. Create and Send Campaign

1. Create a new campaign
2. Choose the "Event Invitation" template
3. Fill in subject and content
4. Preview in desktop and mobile modes
5. Send test email to yourself
6. Once satisfied, send to all subscribers

### 3. View Campaign Stats

1. Go to Campaigns tab
2. Find your sent campaign
3. View stats:
   - Number sent
   - Open rate (requires tracking setup)
   - Click rate (requires tracking setup)

## Template Customization

### Browse Templates

1. Click "Templates" tab
2. Browse by category:
   - Newsletter
   - Announcement
   - Event
   - Product
   - Promotional
3. Click any template to preview
4. Click "Use This Template" to start a campaign

### Create Custom Template

To add your own templates:

```sql
INSERT INTO email_templates (user_id, name, description, html_content, category)
VALUES (
  'your-user-id',
  'My Custom Template',
  'A custom template description',
  '<!DOCTYPE html>...',  -- Your HTML here
  'custom'
);
```

## Subscriber Management

### Bulk Operations

1. Select multiple subscribers using checkboxes
2. Use bulk actions:
   - Unsubscribe selected
   - Delete selected

### Filter Subscribers

Use the status filter to view:
- All subscribers
- Active only
- Unsubscribed

### Search Subscribers

Use the search box to find subscribers by:
- Email address
- First name
- Last name

## Analytics Dashboard

The stats cards show:
1. **Total Subscribers**: All subscribers regardless of status
2. **Total Campaigns**: All campaigns created
3. **Avg. Open Rate**: Average across all sent campaigns
4. **Avg. Click Rate**: Average across all sent campaigns

Industry benchmarks are shown for comparison.

## Personalization Tokens

Use these in your email content:

```
Hello {{firstName}} {{lastName}},

Your email is: {{email}}

Click here to unsubscribe: {{unsubscribe_url}}
```

Available tokens:
- `{{firstName}}` - Subscriber's first name
- `{{lastName}}` - Subscriber's last name
- `{{email}}` - Subscriber's email
- `{{company}}` - Company name (if provided)
- `{{unsubscribe_url}}` - Unsubscribe link

## Troubleshooting

### Migration Failed
```bash
# Reset and retry
supabase db reset
supabase db push
```

### Can't See Templates
```sql
-- Check if templates exist
SELECT * FROM email_templates WHERE is_default = true;

-- If empty, re-run the template insert statements from the migration
```

### Subscribers Not Importing
- Verify CSV has `email` column header (case-insensitive)
- Ensure proper comma separation
- Check for duplicate emails

### Campaign Not Sending
1. Verify email service is configured
2. Check for active subscribers
3. Review browser console for errors
4. Check Supabase logs

## Next Steps

1. **Set up email tracking**: Implement open/click tracking with webhooks
2. **Configure custom domain**: Send emails from your domain
3. **Create segments**: Build targeted subscriber lists
4. **Set up automation**: Create drip campaigns
5. **A/B testing**: Test subject lines and content

## Support Resources

- **Documentation**: `/docs/email-marketing-system.md`
- **Database Schema**: `/supabase/migrations/012_email_newsletter.sql`
- **Components**: `/components/email/`
- **API Routes**: `/app/api/email/`

## Common Use Cases

### Weekly Newsletter
1. Create campaign with Newsletter template
2. Schedule for same day/time each week
3. Send to all active subscribers

### Event Announcement
1. Use Event Invitation template
2. Add event details and registration link
3. Send immediately or schedule before event

### Product Launch
1. Use Product Launch template
2. Segment subscribers by interest tags
3. Send with A/B testing for subject lines

### Promotional Offer
1. Use Promotional template
2. Add time-limited offer details
3. Track clicks to measure conversion

---

**Ready to go?** Start by adding your first subscriber and creating your first campaign!
