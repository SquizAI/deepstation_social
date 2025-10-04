# DeepStation Workflow Customization Guide

## Overview

DeepStation uses a flexible, easy-to-update workflow system for AI content generation. This guide shows you how to customize the speaker announcement workflow without touching complex code.

---

## Quick Customization

### 1. Change AI Provider

Edit `lib/ai/workflows/speaker-announcement.ts`:

```typescript
export const WORKFLOW_CONFIG = {
  // Choose your AI provider
  provider: 'gemini',  // Options: 'openai', 'gemini', 'anthropic', undefined (auto)
  temperature: 0.7,    // Creativity: 0.0 (focused) to 1.0 (creative)
  maxTokens: 2000,     // Max response length
  ...
}
```

### 2. Update Brand Voice

```typescript
brandVoice: {
  tone: 'professional yet approachable',  // Change this!
  values: ['innovation', 'community'],     // Your core values
  community: {
    size: '3,000+ members',                // Update these stats
    events: '70+ events',
    speakers: '100+ speakers',
    chapters: ['Miami', 'Brazil'],         // Your chapters
    partnership: 'Official OpenAI Partner',
  },
},
```

### 3. Customize Platform Settings

```typescript
platforms: {
  linkedin: {
    characterLimit: 3000,
    targetLength: [1200, 1500],  // Min-max length
    style: 'professional',
    includeHashtags: true,
    hashtagCount: [3, 5],        // Min-max hashtags
  },
  // ... other platforms
}
```

### 4. Edit Content Prompts

Find `generatePlatformPrompt()` function and edit the instructions:

```typescript
const platformInstructions: Record<Platform, string> = {
  linkedin: `
    Create a professional LinkedIn post announcing this speaker.

    Requirements:
    - Length: ${config.targetLength[0]}-${config.targetLength[1]} characters
    - Tone: ${brand.tone}
    - Include: [CUSTOMIZE THIS LIST]

    Focus on:
    1. [YOUR PRIORITY #1]
    2. [YOUR PRIORITY #2]
    3. [YOUR PRIORITY #3]
  `,
  // ... customize for each platform
}
```

---

## Runtime Customization

You can also change settings programmatically:

```typescript
import { customizeWorkflow } from '@/lib/ai/workflows/speaker-announcement';

// Change AI provider
customizeWorkflow({
  aiProvider: 'gemini',
  temperature: 0.8,
});

// Update brand voice
customizeWorkflow({
  brandVoice: {
    tone: 'casual and fun',
    values: ['creativity', 'innovation'],
  },
});

// Change platform settings
customizeWorkflow({
  platformSettings: {
    twitter: {
      includeHashtags: false,
      threadSupport: false,
    },
  },
});
```

---

## Creating New Workflows

### Step 1: Create Workflow File

Create a new file: `lib/ai/workflows/your-workflow.ts`

```typescript
import { generateAIContentWithFallback } from '../providers';

export const YOUR_WORKFLOW_CONFIG = {
  provider: 'openai',
  temperature: 0.7,
  // Your custom settings
};

export async function yourWorkflowFunction(
  input: YourInputType,
  options = {}
) {
  const prompt = `Your custom prompt here with ${input.data}`;

  const response = await generateAIContentWithFallback(prompt, {
    ...YOUR_WORKFLOW_CONFIG,
    ...options,
  });

  return response.content;
}
```

### Step 2: Use the Workflow

```typescript
import { yourWorkflowFunction } from '@/lib/ai/workflows/your-workflow';

const result = await yourWorkflowFunction({
  data: 'your input',
});
```

---

## Agent Configuration

Agents are located in `.claude/agents/`. Each agent has a simple structure:

### Example Agent: `api-integrator.md`

```markdown
---
name: api-integrator
description: Social media API integration specialist
tools: Read, Write, Edit, Bash, Grep, Glob
---

You are a social media API integration expert.

## Your Expertise
- LinkedIn API integration
- Instagram Graph API
- Twitter API v2
- Discord Webhooks

## When to Invoke
Use this agent when implementing:
- Platform-specific posting logic
- Media upload functionality
- API error handling
- Rate limit management

## Code Patterns
[Examples of how to do common tasks]
```

### Updating Agents

1. **Add New Capabilities**: Add sections to the agent's markdown
2. **Change Behavior**: Update the description and expertise sections
3. **Add Tools**: Add tool names to the `tools:` line in frontmatter

---

## Best Practices

### 1. Test Changes Incrementally
```typescript
// Test with one platform first
const linkedin = await generateSpeakerAnnouncementForPlatform(
  speakerData,
  'linkedin',
  { provider: 'gemini' }  // Test new provider
);
```

### 2. Validate Output
```typescript
import { validateAnnouncementContent } from '@/lib/ai/workflows/speaker-announcement';

const validation = validateAnnouncementContent(content, 'twitter');
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### 3. Use Fallbacks
```typescript
// Automatic fallback to other providers if one fails
const content = await generateAIContentWithFallback(prompt, options);
```

### 4. Monitor Usage
```typescript
const response = await generateAIContent(prompt, options);
console.log('Provider used:', response.provider);
console.log('Tokens used:', response.usage);
```

---

## Common Customizations

### Change Character Limits

```typescript
platforms: {
  linkedin: {
    characterLimit: 2500,  // Reduce for shorter posts
    targetLength: [800, 1000],
  }
}
```

### Adjust Creativity

```typescript
// More creative (0.8-1.0)
temperature: 0.9,

// More focused (0.0-0.3)
temperature: 0.2,
```

### Change Tone

```typescript
brandVoice: {
  // Professional
  tone: 'professional and authoritative',

  // Casual
  tone: 'casual and friendly',

  // Inspiring
  tone: 'inspiring and motivational',
}
```

### Add New Platforms

1. Update `Platform` type in `lib/types/oauth.ts`
2. Add platform config to `WORKFLOW_CONFIG.platforms`
3. Add platform instructions to `generatePlatformPrompt()`
4. Update UI components to support new platform

---

## Troubleshooting

### Issue: Content too long/short
**Solution**: Adjust `targetLength` in platform config

### Issue: Wrong tone
**Solution**: Update `brandVoice.tone` and platform instructions

### Issue: API errors
**Solution**: Check API keys in `.env.local`, try different provider

### Issue: Slow generation
**Solution**: Use faster models:
```typescript
import { RECOMMENDED_MODELS } from '@/lib/ai/providers';

const options = {
  model: RECOMMENDED_MODELS.gemini.fast,  // Use fast model
};
```

---

## Environment Variables

Required for AI providers:

```bash
# At least one required
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...
```

The system will auto-select the first available provider if not specified.

---

## Advanced: Custom System Prompts

Override the default system prompt:

```typescript
const result = await generateAIContent(userPrompt, {
  systemPrompt: `You are a creative copywriter for tech startups.
  Write in a casual, engaging style with humor.
  Always include a call-to-action.`,
  temperature: 0.8,
});
```

---

## Support

- **Documentation**: See `/docs` folder
- **Example Workflows**: `lib/ai/workflows/`
- **Agent Templates**: `.claude/agents/`

**Remember**: All workflow configurations are in plain TypeScript/JavaScript. No complex abstractions. Just edit the config objects and you're done!
