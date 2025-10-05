# DeepStation Template System Architecture

## Overview

DeepStation now features a sophisticated, scalable template system inspired by Gamma App. This system allows for:
- **Component-based event sections** - Modular, reusable components
- **AI-powered auto-generation** - Smart content creation for events, workshops, and emails
- **Template management** - Pre-built templates for different event types
- **Multi-channel orchestration** - Coordinated email and social media templates

## Architecture

### 1. Event Section Components

Located in `/components/events/sections/`:

#### Available Components:
- **HeroSection** - Countdown timer, event badges, quick stats
- **AboutSection** - Event description and details
- **SpeakersSection** - Speaker cards with bios and social links
- **BenefitsSection** - What attendees will get (AI-generated)
- **FAQSection** - Frequently asked questions (AI-generated)
- **RegistrationCard** - Sticky registration sidebar with calendar integration

#### Usage:
```tsx
import { HeroSection } from '@/components/events/sections/hero-section'
import { SpeakersSection } from '@/components/events/sections/speakers-section'

<HeroSection event={event} onRegisterClick={handleRegister} />
<SpeakersSection event={event} />
```

### 2. Email Templates

Located in `/components/emails/templates/`:

#### Available Templates:
- **EventConfirmationEmail** - Sent after registration
  - Beautiful gradient design
  - Event details card
  - Registration ID
  - CTA to event page

- **EventReminderEmail** - Sent 24h or 1h before event
  - Urgency-focused design
  - Live countdown
  - Pre-event checklist
  - Quick join links

#### Usage:
```tsx
import { EventConfirmationEmail } from '@/components/emails/templates/event-confirmation-email'
import { render } from '@react-email/render'

const emailHtml = render(
  <EventConfirmationEmail
    event={event}
    attendeeName="John Doe"
    registrationId="REG-123"
  />
)
```

### 3. Template Configuration System

Located in `/lib/templates/`:

#### Template Types:
```typescript
type TemplateType = 'event' | 'workshop' | 'webinar' | 'conference' | 'meetup'

interface EventTemplateConfig {
  id: string
  name: string
  description: string
  type: TemplateType
  sections: TemplateSectionConfig[]
  theme: ThemeConfig
  emails: EmailConfig
  ai_config: AIGenerationConfig
}
```

#### Pre-built Templates:
1. **Default Event Template** - Modern, sophisticated design
2. **Workshop Template** - Hands-on focused with materials section
3. **Webinar Template** - Online presentation optimized
4. **Conference Template** - Multi-day event with sponsors
5. **Meetup Template** - Casual networking events

### 4. AI Content Generation

API endpoint: `/api/templates/generate`

#### Capabilities:
- **Auto-generate event benefits** based on event type and audience
- **Auto-generate FAQs** based on location type and pricing
- **Generate hero content** - titles, subtitles, descriptions
- **Generate social media posts** - LinkedIn, Twitter, Instagram optimized
- **Generate email copy** - Confirmation and reminder templates

#### Request Format:
```typescript
POST /api/templates/generate
{
  "type": "workshop",
  "title": "AI Workflow Automation",
  "target_audience": "developers and product managers",
  "duration_minutes": 120,
  "is_free": false,
  "location_type": "online",
  "tone": "professional",
  "generate_sections": ["benefits", "faq"],
  "include_social_copy": true
}
```

#### Response:
```typescript
{
  "template": {
    "id": "custom-1234567890",
    "name": "AI Workflow Automation Template",
    "type": "workshop",
    "sections": [...],
    "theme": {...},
    "emails": {...},
    "ai_config": {...}
  },
  "generated_content": {
    "hero_content": {
      "title": "AI Workflow Automation",
      "subtitle": "Join our hands-on workshop...",
      "description": "Experience 120 minutes of..."
    },
    "benefits": [
      {
        "icon": "🎯",
        "title": "Hands-On Learning",
        "description": "Practical exercises..."
      }
    ],
    "faqs": [...],
    "social_posts": {
      "linkedin": "...",
      "twitter": "...",
      "instagram": "..."
    }
  }
}
```

## Template Registry

The `TemplateRegistry` class manages all available templates:

```typescript
import { TemplateRegistry } from '@/lib/templates/registry'

// Get a specific template
const template = TemplateRegistry.getTemplate('workshop-template')

// Get all public templates
const publicTemplates = TemplateRegistry.getPublicTemplates()

// Get templates by type
const workshopTemplates = TemplateRegistry.getTemplatesByType('workshop')

// Register a custom template
TemplateRegistry.registerTemplate(myCustomTemplate)
```

## Benefits

### 1. Scalability
- Add new sections without touching core code
- Create unlimited template variations
- Easy to add new event types

### 2. Consistency
- Unified design system across all events
- Consistent email templates
- Brand consistency

### 3. AI-Powered
- Gamma-style auto-generation
- Save hours on content creation
- Optimized for each platform

### 4. Customization
- Each template is fully customizable
- Override individual sections
- Custom themes and colors

### 5. Reusability
- Use same components across multiple events
- Share templates between team members
- Template marketplace ready

## Future Enhancements

### Phase 1 (Current)
- ✅ Component-based sections
- ✅ Email templates
- ✅ Template registry
- ✅ AI generation API

### Phase 2 (Next)
- [ ] Template builder UI (drag-and-drop)
- [ ] Real AI integration (Claude API)
- [ ] Image generation for events
- [ ] Video template support
- [ ] Template marketplace

### Phase 3 (Future)
- [ ] A/B testing for templates
- [ ] Analytics for template performance
- [ ] Multi-language support
- [ ] Advanced AI personalization
- [ ] Template versioning

## How to Create a New Event Type

1. **Define the template config:**
```typescript
export const MY_EVENT_TEMPLATE: EventTemplateConfig = {
  id: 'my-event-template',
  name: 'My Event Template',
  description: 'Description here',
  type: 'my-event-type',
  sections: [...],
  theme: {...},
  emails: {...},
  ai_config: {...}
}
```

2. **Register the template:**
```typescript
TemplateRegistry.registerTemplate(MY_EVENT_TEMPLATE)
```

3. **Create custom sections if needed:**
```typescript
// /components/events/sections/my-custom-section.tsx
export function MyCustomSection({ event }: { event: Event }) {
  return (
    <div>
      {/* Custom content */}
    </div>
  )
}
```

4. **Use in event page:**
```typescript
import { MyCustomSection } from '@/components/events/sections/my-custom-section'

<MyCustomSection event={event} />
```

## Best Practices

1. **Keep sections modular** - Each section should be independent
2. **Use AI generation wisely** - Let AI handle repetitive content
3. **Customize when needed** - Override defaults for special events
4. **Test email templates** - Always preview before sending
5. **Track template performance** - Monitor which templates convert best

## Integration with Event Management

The template system integrates seamlessly with:
- Event creation flow
- Multi-channel broadcasting
- Email automation
- Social media scheduling
- Analytics tracking

## Conclusion

This template system transforms DeepStation into a powerful, scalable event orchestration platform that rivals tools like Gamma, while maintaining complete customization and AI-powered automation.
