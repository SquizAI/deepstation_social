# Workflow Settings Implementation

Complete documentation for the Workflow Settings page and integration.

## Overview

The Workflow Settings page provides a centralized location to configure global defaults for all workflows. Settings are organized into five main categories:

1. **AI Model Defaults** - Configure default AI models and parameters
2. **Workflow Execution** - Control workflow behavior and error handling
3. **Platform Defaults** - Set default posting platforms and behaviors
4. **Content Preferences** - Define brand voice and content guidelines
5. **Security & Privacy** - Configure approval workflows and data handling

## Files Created

### 1. Main Settings Page
**Location**: `/app/dashboard/workflows/settings/page.tsx`

Comprehensive settings interface with:
- Organized settings cards
- Real-time validation
- Unsaved changes warning
- Success/error notifications
- Export/Import functionality
- Reset to defaults option

### 2. Utility Library
**Location**: `/lib/workflow-settings.ts`

Provides helper functions for:
- Loading/saving settings
- Getting model configurations
- Applying content preferences
- Building AI prompts with user preferences
- Filtering prohibited words

### 3. Integration Updates
**Location**: `/app/dashboard/workflows/page.tsx`

Added "Settings" button in the workflows page header to navigate to settings.

## Settings Available

### AI Model Defaults

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| Text Generation Model | GPT-4o, GPT-4 Turbo, Claude 3.7, Claude 3.5, Gemini 2.0, Gemini 1.5, Llama 3.1 | GPT-4o | Used for all text generation nodes |
| Image Generation Model | DALL-E 3, DALL-E 2, Stable Diffusion XL, Midjourney, Flux | DALL-E 3 | Used for all image generation nodes |
| Video Generation Model | Runway Gen-3, Pika 1.5, Luma Dream Machine, Sora | Runway | Used for all video generation nodes |
| Temperature | 0.0 - 2.0 | 0.7 | Controls randomness in AI output |
| Max Tokens | 100 - 8000 | 2000 | Maximum length of generated text |
| Top P | 0.0 - 1.0 | 1.0 | Controls diversity via nucleus sampling |

### Workflow Execution Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Default Timeout | Number (30-600s) | 120s | Maximum execution time |
| Retry Attempts | Number (0-10) | 3 | Retries on failure |
| Notification Email | Email | Empty | Alert email for failures |
| Concurrent Limit | Number (1-20) | 5 | Max parallel workflows |

### Platform Defaults

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| Default Platforms | LinkedIn, X, Instagram, Discord | LinkedIn | Platforms selected by default |
| Default Visibility | Public, Private, Connections Only | Public | Post visibility |
| Auto-add Hashtags | Boolean | True | AI suggests hashtags |
| Auto-schedule Times | Boolean | False | AI picks optimal times |

### Content Preferences

| Setting | Type | Description |
|---------|------|-------------|
| Brand Voice | Textarea | Describe brand tone and style |
| Prohibited Words | Text (comma-separated) | Words to avoid in content |
| Emoji Usage | Never, Rarely, Sometimes, Often, Always | Frequency of emojis |
| Content Length | Short, Medium, Long | Default content length |

### Security & Privacy

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Require Approval | Boolean | False | Manual review before posting |
| Moderation Level | None, Basic, Strict | Basic | AI content filtering |
| Data Retention | Number (1-365 days) | 30 | Log retention period |
| Webhook Token | Password | Empty | Security token for webhooks |

## Usage Guide

### Accessing Settings

1. Navigate to `/dashboard/workflows`
2. Click the "Settings" button in the top-right header
3. Or go directly to `/dashboard/workflows/settings`

### Modifying Settings

1. Browse through the organized settings cards
2. Modify any settings as needed
3. Notice the "Unsaved changes" warning at the bottom
4. Click "Save Changes" to persist settings
5. See success notification when saved

### Exporting Settings

1. Click "Export" button in top-right
2. Downloads `workflow-settings.json` file
3. Can be shared with team or used as backup

### Importing Settings

1. Click "Import" button in top-right
2. Select a previously exported JSON file
3. Settings will be loaded (requires saving to persist)

### Resetting to Defaults

1. Click "Reset to Defaults" button
2. Confirm the action
3. All settings revert to factory defaults
4. Must click "Save Changes" to persist reset

## Integration with Workflows

### Loading Settings in Your Code

```typescript
import { loadWorkflowSettings } from '@/lib/workflow-settings';

// Load all settings
const settings = loadWorkflowSettings();

// Access specific settings
console.log(settings.ai.textModel); // 'gpt-4o'
console.log(settings.platforms.defaultPlatforms); // ['linkedin']
```

### Using Helper Functions

```typescript
import {
  getAIModelConfig,
  getPlatformDefaults,
  getBrandVoice,
  buildAIPromptWithPreferences,
  filterProhibitedWords
} from '@/lib/workflow-settings';

// Get AI model configuration
const textConfig = getAIModelConfig('text');
// { model: 'gpt-4o', temperature: 0.7, maxTokens: 2000, topP: 1.0 }

// Get platform defaults
const platforms = getPlatformDefaults();
// { defaultPlatforms: ['linkedin'], visibility: 'public', ... }

// Build AI prompt with preferences
const basePrompt = "Generate a LinkedIn post about AI";
const enhancedPrompt = buildAIPromptWithPreferences(basePrompt);
// Adds brand voice, emoji guidelines, length preferences, etc.

// Filter prohibited words
const result = filterProhibitedWords("This is spam content");
// { clean: "This is *** content", violations: ["spam"] }
```

### Example: Using Settings in a Text Generation Node

```typescript
import { getAIModelConfig, buildAIPromptWithPreferences } from '@/lib/workflow-settings';

async function generateText(prompt: string) {
  const config = getAIModelConfig('text');
  const enhancedPrompt = buildAIPromptWithPreferences(prompt);

  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: config.model,
      prompt: enhancedPrompt,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      top_p: config.topP,
    }),
  });

  return response.json();
}
```

### Example: Checking Approval Requirements

```typescript
import { requiresApproval } from '@/lib/workflow-settings';

async function publishPost(content: string) {
  if (requiresApproval()) {
    // Send to approval queue
    await sendToApprovalQueue(content);
    return { status: 'pending_approval' };
  } else {
    // Publish immediately
    await publishImmediately(content);
    return { status: 'published' };
  }
}
```

## UI Features

### Real-time Validation
- Number inputs validate min/max ranges
- Email inputs validate format
- Settings update immediately on change

### Unsaved Changes Warning
- Browser alert when navigating away with unsaved changes
- Visual indicator at bottom of page
- "Save Changes" button disabled when no changes

### Success/Error Notifications
- Toast notification on successful save
- Error alerts if save fails
- Auto-dismiss after 3 seconds

### Tooltips
- Hover over info icons for detailed explanations
- Explains what each setting does
- Provides usage guidelines

### Responsive Design
- Mobile-friendly layout
- Settings cards stack on smaller screens
- Sticky action bar at bottom

## Storage

Settings are stored in `localStorage` under the key `workflowSettings`.

**Storage Structure**:
```json
{
  "ai": {
    "textModel": "gpt-4o",
    "imageModel": "dall-e-3",
    "videoModel": "runway",
    "temperature": 0.7,
    "maxTokens": 2000,
    "topP": 1.0
  },
  "execution": {
    "timeout": 120,
    "retries": 3,
    "notificationEmail": "",
    "concurrentLimit": 5
  },
  "platforms": {
    "defaultPlatforms": ["linkedin"],
    "visibility": "public",
    "autoHashtags": true,
    "autoSchedule": false
  },
  "content": {
    "brandVoice": "",
    "prohibitedWords": [],
    "emojiUsage": "sometimes",
    "contentLength": "medium"
  },
  "security": {
    "requireApproval": false,
    "moderationLevel": "basic",
    "dataRetention": 30,
    "webhookToken": ""
  }
}
```

## Future Enhancements

### Database Integration
Currently uses localStorage. Can be enhanced to store in Supabase:

```typescript
// Future: Save to database
async function saveSettings(settings: WorkflowSettings) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase
    .from('workflow_settings')
    .upsert({
      user_id: user.id,
      settings: settings,
      updated_at: new Date().toISOString(),
    });
}
```

### Team Settings
Support for team-wide settings:
- Admin can set organization defaults
- Users can override for personal workflows
- Sync settings across team members

### Setting Presets
Pre-configured setting bundles:
- "Conservative" - Lower temperature, strict moderation
- "Creative" - Higher temperature, more emojis
- "Professional" - LinkedIn-focused, formal tone
- "Casual" - Instagram-focused, emojis, short content

### Version History
Track setting changes over time:
- Save history of setting changes
- Allow rollback to previous versions
- See who changed what and when

### Setting Templates
Export/import specific setting categories:
- AI settings only
- Platform settings only
- Content preferences only

## Testing Checklist

- [x] Settings page loads without errors
- [x] All settings can be modified
- [x] Settings persist after page reload
- [x] Unsaved changes warning works
- [x] Export downloads JSON file
- [x] Import loads from JSON file
- [x] Reset to defaults works
- [x] Save button shows loading state
- [x] Success toast appears after save
- [x] Settings helper functions work
- [x] Settings integrate with workflow builder
- [x] Responsive design works on mobile
- [x] Tooltips display correctly
- [x] Navigation from workflows page works

## Technical Details

### Component Structure
```
WorkflowSettingsPage
├── Header (with back button, export/import)
├── Success Toast
├── Settings Cards
│   ├── AI Model Defaults
│   │   └── 6 setting rows
│   ├── Workflow Execution
│   │   └── 4 setting rows
│   ├── Platform Defaults
│   │   └── 4 setting rows
│   ├── Content Preferences
│   │   └── 4 settings
│   └── Security & Privacy
│       └── 4 settings
└── Sticky Action Bar
    ├── Unsaved changes indicator
    ├── Reset to Defaults button
    └── Save Changes button
```

### State Management
- React `useState` for settings state
- `useEffect` for loading from localStorage
- `useEffect` for beforeunload warning
- Local state for UI (saving, toast, etc.)

### Styling
- Dark theme matching DeepStation design
- Purple/fuchsia gradient accents
- Animated background orbs
- Glassmorphism effects on cards
- Consistent spacing and typography

## Support

For questions or issues:
1. Check this documentation
2. Review the code comments in the source files
3. Test with the utility functions in `/lib/workflow-settings.ts`
4. Ensure localStorage is enabled in browser

## Conclusion

The Workflow Settings page provides a powerful, user-friendly interface for configuring global workflow defaults. It integrates seamlessly with the existing DeepStation design and can be extended with database storage and team features in the future.
