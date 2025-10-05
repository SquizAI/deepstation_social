# Scheduled Posts - Quick Start Guide

## Getting Started

### 1. Access the Schedule Page
Navigate to `/dashboard/schedule` or click "Schedule" in the sidebar.

### 2. View Options

#### Calendar View
- See posts distributed across the month
- Drag posts to different dates to reschedule
- Click a date to see all posts for that day
- Hover over posts for quick preview

#### List View
- See all posts in a detailed list
- Expand posts to see platform-specific content
- Quick actions: Edit, Delete, Duplicate, Post Now

### 3. Create a New Post
1. Click "New Post" button
2. Select platforms (LinkedIn, Instagram, Twitter, Discord)
3. Write platform-specific content
4. Upload images (optional)
5. Set scheduled date and time
6. Configure recurring pattern (optional)
7. Save as draft or schedule immediately

## Filtering Posts

### Available Filters
- **Platform**: Filter by social media platform
- **Status**: Draft, Scheduled, Publishing, Published, Failed
- **Search**: Search post content
- **Date Range**: Filter by scheduled date

### Clear Filters
Click "Clear Filters" to reset all filters.

## Bulk Actions

### Select Posts
1. Check boxes next to posts in list view
2. Or click "Select All" to select all visible posts

### Available Bulk Actions
- **Delete Selected**: Remove multiple posts
- **Reschedule Selected**: Change scheduled time for multiple posts
- **Clear Selection**: Deselect all posts

## Recurring Posts

### Create Recurring Post
1. Create a new post
2. Enable "Recurring" option
3. Choose frequency:
   - **Daily**: Every N days
   - **Weekly**: Specific days of week (Mon, Wed, Fri)
   - **Monthly**: Specific day of month

4. Set end condition:
   - **Never**: Repeats indefinitely
   - **On Date**: Ends on specific date
   - **After**: Ends after N occurrences

### Examples

**Weekly Team Update (Every Monday)**
- Frequency: Weekly
- Days: Monday
- Ends: Never

**Monthly Newsletter (First day of month)**
- Frequency: Monthly
- Day: 1
- Ends: After 12 occurrences

**Daily Tips (Weekdays only)**
- Frequency: Weekly
- Days: Mon, Tue, Wed, Thu, Fri
- Ends: On 2025-12-31

## CSV Import/Export

### Export Schedule
1. Click "Export CSV" button
2. Opens download with all posts
3. Use for backup or analysis in Excel

### Import Posts
1. Click "Import" button (if available)
2. Download template for correct format
3. Fill in your posts:
   ```csv
   Platforms,Scheduled For,LinkedIn Content,Twitter Content
   linkedin;twitter,2025-10-15 14:00,Full post here,Short tweet
   ```
4. Upload CSV file
5. Review preview
6. Confirm import

### CSV Format Tips
- Use semicolons (;) to separate multiple values
- Date format: YYYY-MM-DD HH:MM
- Wrap text with commas in quotes
- Use "" to escape quotes in content

## Post Actions

### Individual Post Actions

#### Edit
- Modify post content
- Change platforms
- Update schedule
- Adjust recurring pattern

#### Delete
- Permanently remove post
- Cannot be undone
- Removes all scheduled instances (recurring)

#### Duplicate
- Creates copy as draft
- Preserves content and settings
- Clears schedule (you set new time)

#### Post Now
- Immediately publishes post
- Bypasses schedule
- Available for scheduled posts only

#### Retry
- Retry failed posts
- Only retries failed platforms
- Maximum 3 retry attempts
- Shows retry count

## Status Indicators

### Post Status
- **Draft** (Gray): Not scheduled
- **Scheduled** (Blue): Waiting to publish
- **Publishing** (Orange): Currently publishing
- **Published** (Green): Successfully posted
- **Failed** (Red): Publishing failed

### Status Icons
- ✓ Published successfully
- ✕ Publishing failed
- ⟳ Currently publishing
- 🕐 Scheduled for future
- 📄 Draft (not scheduled)

## Platform Colors
- **LinkedIn**: Blue (#0A66C2)
- **Instagram**: Pink/Red (#E4405F)
- **Twitter**: Light Blue (#1DA1F2)
- **Discord**: Purple (#5865F2)

## Time Display

### Scheduled Time Formats
- **Absolute**: Oct 15, 2:00 PM EDT
- **Relative**: in 2d 5h (2 days, 5 hours)
- **Countdown**: Updates in real-time
- **Past Due**: Shows "Past due" for missed posts

## Analytics Preview

### View Post Performance
- Impressions count
- Engagement metrics
- Click-through rate
- Expected vs actual engagement
- Platform-specific breakdown

### Access Analytics
1. Expand post in list view
2. View publish results section
3. Click platform post URL to see on platform

## Tips & Best Practices

### Scheduling
1. **Best Times**: Schedule posts during peak engagement hours
2. **Timezone**: Always set correct timezone
3. **Buffer**: Allow 5-10 min buffer for processing
4. **Test**: Use "Post Now" to test before scheduling

### Recurring Posts
1. **Start Date**: Set first occurrence carefully
2. **Review**: Check generated instances before activating
3. **Monitor**: Regularly check recurring post status
4. **Update**: Modify template to update future posts

### CSV Import
1. **Template**: Always use the provided template
2. **Validate**: Check preview before importing
3. **Small Batches**: Import in batches of 50-100
4. **Backup**: Export before bulk import

### Content Management
1. **Drafts**: Use drafts for work-in-progress
2. **Duplicate**: Clone successful posts for reuse
3. **Archive**: Delete old posts to keep list clean
4. **Search**: Use search to find specific posts quickly

## Troubleshooting

### Post Failed to Publish
1. Check OAuth connection for platform
2. Verify content meets platform requirements
3. Check image URLs are accessible
4. Click "Retry" to attempt again
5. Review error message for details

### Recurring Post Not Generating
1. Verify recurring post is active
2. Check next_occurrence date
3. Ensure occurrence limit not reached
4. Verify end date hasn't passed

### CSV Import Errors
1. Check CSV format matches template
2. Verify date format (YYYY-MM-DD HH:MM)
3. Ensure required fields present
4. Check platform names are valid
5. Review error messages in preview

### Calendar Not Updating
1. Refresh the page
2. Check date range filters
3. Verify posts have scheduled_for date
4. Clear browser cache if needed

## Keyboard Shortcuts

### Navigation
- `Tab`: Move between elements
- `Enter`: Activate buttons
- `Esc`: Close modals

### Selection (List View)
- `Ctrl/Cmd + A`: Select all
- `Shift + Click`: Select range
- `Ctrl/Cmd + Click`: Toggle selection

## Mobile Usage

### Touch Gestures
- **Tap**: Select post
- **Long Press**: Show actions menu
- **Swipe**: Navigate calendar month
- **Pull Down**: Refresh posts

### Mobile View
- Simplified layout
- Bottom sheet for actions
- Optimized for small screens
- Touch-friendly buttons

## API Integration

### Programmatic Access
Use the API endpoints for custom integrations:

```javascript
// Fetch posts
GET /api/scheduled-posts?status=scheduled

// Create post
POST /api/scheduled-posts
{
  content: { linkedin: "Post content" },
  platforms: ["linkedin"],
  scheduled_for: "2025-10-15T14:00:00Z"
}

// Bulk delete
DELETE /api/scheduled-posts/bulk
{
  postIds: ["id1", "id2"]
}
```

## Support

### Get Help
- Check documentation
- Review error messages
- Contact support team
- Submit bug reports

### Feature Requests
- Use feedback form
- Describe use case
- Provide examples
- Vote on existing requests

---

## Quick Reference Card

### Essential Actions
| Action | Steps |
|--------|-------|
| Schedule Post | New Post → Content → Time → Save |
| Bulk Delete | Select → Delete Selected |
| Export CSV | Export CSV button → Download |
| Import CSV | Import → Template → Upload → Confirm |
| Retry Failed | Expand post → Retry button |
| Drag Reschedule | Calendar View → Drag to new date |

### Status Flow
```
Draft → Scheduled → Publishing → Published
                              ↘ Failed → Retry
```

### Recurring Pattern Syntax
```json
{
  "frequency": "weekly",
  "interval": 1,
  "daysOfWeek": [1, 3, 5],
  "endDate": "2025-12-31"
}
```

---

**Need Help?** Contact support or check the full documentation.
