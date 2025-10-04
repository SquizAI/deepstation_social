# Speaker Announcement Generator

## Overview
This system generates engaging social media announcements for DeepStation speakers based on their submission form data. The generator creates platform-optimized content that maintains DeepStation's brand voice while highlighting speaker expertise.

## DeepStation Brand Standards

### Brand Voice
- **Educational & Inspiring**: Focus on AI innovation and learning
- **Community-Driven**: Emphasize connection and collaboration
- **Professional yet Accessible**: Expert content in approachable language
- **Global Perspective**: Highlight international community (Miami, Brazil, expanding worldwide)

### Brand Colors
- Primary: Not specified (recommend extracting from deepstation.ai)
- Theme: AI-focused, technology-forward aesthetic

### Key Messaging Points
- 70+ Events Hosted
- 3,000+ Community Members
- 100+ Expert Speakers
- 2 Global Chapters (Miami & Brazil)
- Official OpenAI Academy Launch Partner

## Speaker Form Data Structure

### Required Fields
```typescript
interface SpeakerForm {
  // Personal Information
  fullName: string;
  title: string;
  company: string;
  bio: string;
  profilePhoto: string; // URL or file upload

  // Social Links
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  website?: string;

  // Presentation Details
  presentationTitle: string;
  presentationDescription: string;
  presentationType: 'workshop' | 'presentation' | 'panel' | 'fireside-chat';
  expertise: string[]; // e.g., ["AI", "Machine Learning", "LLMs"]

  // Event Information
  eventDate: Date;
  eventLocation: 'Miami' | 'Brazil' | 'Virtual';

  // Additional
  highlights?: string[]; // Notable achievements
  previousCompanies?: string[];
}
```

## Announcement Templates

### LinkedIn Post Template
```
🎯 Exciting News! {fullName} joins DeepStation {eventLocation}!

{fullName}, {title} at {company}, will share insights on "{presentationTitle}" at our upcoming event.

✨ What to expect:
{presentationDescription}

💡 About {firstName}:
{bio_summary}

{if previousCompanies}
Previously: {previousCompanies.join(', ')}
{endif}

📅 {eventDate}
📍 {eventLocation}

Join {community_size}+ AI enthusiasts learning from industry experts!

#AI #DeepStation #MachineLearning {additional_hashtags}

🔗 Register: [Event Link]
```

**Character Limit**: 3,000 characters
**Optimal Length**: 1,200-1,500 characters
**Hashtag Limit**: 3-5 relevant tags

### Twitter/X Post Template (Thread)
```
Tweet 1/4:
🚀 Thrilled to announce {fullName} speaking at DeepStation {eventLocation}!

{title} at {company}
Topic: "{presentationTitle}"

📅 {eventDate}
🎟️ [Link]

#AI #DeepStation

---

Tweet 2/4:
💡 {firstName} will dive into:
{presentationDescription_shortened}

Perfect for {target_audience}

---

Tweet 3/4:
✨ About {firstName}:
{bio_snippet}

{if highlights}
🏆 {highlights[0]}
{endif}

---

Tweet 4/4:
Join 3,000+ AI enthusiasts in our global community!

📍 Chapters: Miami 🌴 | Brazil 🇧🇷
🎯 70+ events | 100+ speakers

Register: [Link]

@{twitter_handle}
```

**Character Limit**: 280 per tweet
**Thread Length**: 3-5 tweets
**Mentions**: Tag speaker if available

### Instagram Caption Template
```
🎤 SPEAKER ANNOUNCEMENT 🎤

We're excited to welcome {fullName} to DeepStation {eventLocation}!

{emoji} {title} at {company}
{emoji} Topic: "{presentationTitle}"

✨ What you'll learn:
{presentationDescription_bullets}

💼 About {firstName}:
{bio_short}

{if highlights}
🏆 Notable:
• {highlights.join('\n• ')}
{endif}

📅 Save the date: {eventDate}
📍 Location: {eventLocation}

👉 Link in bio to register!

---

DeepStation: Where AI innovation meets community
🌍 3K+ members | 🎯 70+ events | 💡 100+ experts

#AI #MachineLearning #DeepStation #TechCommunity #{eventLocation} #{expertise_tags}
```

**Character Limit**: 2,200 characters
**Hashtag Limit**: 20-30 tags
**Format**: Visual-first with engaging emojis

### Discord Announcement Template
```markdown
@everyone 🎉 **NEW SPEAKER ANNOUNCEMENT** 🎉

**{fullName}** is joining us for an incredible session!

**📋 Details:**
• **Speaker:** {fullName}, {title} at {company}
• **Topic:** {presentationTitle}
• **Type:** {presentationType}
• **Date:** {eventDate}
• **Location:** {eventLocation}

**🎯 Session Overview:**
{presentationDescription}

**💡 About {firstName}:**
{bio}

{if previousCompanies}
**Previous Experience:**
{previousCompanies.join(' → ')}
{endif}

{if highlights}
**🏆 Highlights:**
{highlights.map(h => `• ${h}`).join('\n')}
{endif}

**🔗 Connect with {firstName}:**
{social_links}

**📅 RSVP:** [Event Registration Link]

See you there! 🚀
```

**Format**: Markdown with Discord-specific formatting
**Mentions**: Use @everyone or @here for announcements
**Links**: Include clickable registration and social links

## AI Generation Prompts

### Base Prompt Template
```
You are a social media content specialist for DeepStation, a global AI education community with 3,000+ members across Miami and Brazil. We're an official OpenAI Academy Launch Partner focused on AI innovation and community learning.

Generate an engaging {platform} announcement for our upcoming speaker.

Speaker Information:
- Name: {fullName}
- Title: {title}
- Company: {company}
- Bio: {bio}
- Presentation: {presentationTitle}
- Description: {presentationDescription}
- Event Date: {eventDate}
- Location: {eventLocation}
{if highlights}
- Highlights: {highlights.join(', ')}
{endif}

Requirements:
1. Match DeepStation's voice: educational, inspiring, community-driven
2. Highlight speaker's expertise and unique value
3. Create excitement for the presentation topic
4. Include relevant statistics (3K+ members, 70+ events, etc.)
5. Use appropriate hashtags and mentions
6. Stay within {platform} character limits
7. Include clear call-to-action

Brand tone: Professional yet accessible, focused on learning and innovation.

Generate the announcement now:
```

### Platform-Specific Instructions

**LinkedIn:**
- Professional tone
- Longer format (1,200-1,500 chars)
- Emphasize business value and ROI
- Include career-relevant hashtags
- Tag company pages if available

**Twitter/X:**
- Concise and punchy
- Use thread format for depth
- Include engaging hooks
- Tag speaker handle
- Use trending AI hashtags

**Instagram:**
- Visual and engaging language
- Emoji usage for scannability
- Bullet points for readability
- Strong visual description
- Call-out to "link in bio"

**Discord:**
- Community-focused
- Detailed and informative
- Use Discord markdown
- Include all links directly
- Encourage discussion

## Image Generation Requirements

### Branded Speaker Card Specifications

**Dimensions:**
- LinkedIn: 1200x627px
- Twitter: 1200x675px
- Instagram: 1080x1080px (square) or 1080x1350px (portrait)
- Discord: 1920x1080px

**Design Elements:**
```
┌─────────────────────────────┐
│  DeepStation Logo           │
│                             │
│  [Speaker Photo - Circle]   │
│                             │
│  {Full Name}                │
│  {Title} at {Company}       │
│                             │
│  "{Presentation Title}"     │
│                             │
│  📅 {Date} | 📍 {Location}  │
│                             │
│  deepstation.ai             │
└─────────────────────────────┘
```

**Brand Elements:**
- DeepStation logo (top corner or bottom)
- Consistent color scheme
- Professional typography
- Speaker headshot (circular crop)
- Event details overlay
- Social handle (@deepstation)

### Image Template Variables
```javascript
const imageTemplate = {
  background: 'brand_gradient_or_color',
  logo: 'deepstation_logo.svg',
  speakerPhoto: {
    src: form.profilePhoto,
    shape: 'circle',
    size: '200px',
    position: 'center'
  },
  text: {
    name: {
      content: form.fullName,
      font: 'Inter Bold',
      size: '32px',
      color: '#ffffff'
    },
    title: {
      content: `${form.title} at ${form.company}`,
      font: 'Inter Regular',
      size: '18px',
      color: '#cccccc'
    },
    presentation: {
      content: form.presentationTitle,
      font: 'Inter Semibold',
      size: '24px',
      color: '#ffffff',
      maxLines: 2
    },
    details: {
      content: `${formatDate(form.eventDate)} | ${form.eventLocation}`,
      font: 'Inter Regular',
      size: '16px',
      color: '#999999'
    }
  }
};
```

## Implementation Code Examples

### Text Generation Function
```typescript
interface GenerateAnnouncementParams {
  speakerData: SpeakerForm;
  platform: 'linkedin' | 'twitter' | 'instagram' | 'discord';
  eventLink: string;
}

async function generateAnnouncement(
  params: GenerateAnnouncementParams
): Promise<string> {
  const { speakerData, platform, eventLink } = params;

  // Build AI prompt
  const prompt = buildPrompt(speakerData, platform);

  // Call AI service (OpenAI, Anthropic, etc.)
  const response = await aiService.generate({
    prompt,
    maxTokens: getMaxTokensForPlatform(platform),
    temperature: 0.7,
    model: 'gpt-4'
  });

  // Post-process
  let announcement = response.text;
  announcement = replaceVariables(announcement, {
    eventLink,
    ...speakerData
  });

  // Validate length
  if (!validateLength(announcement, platform)) {
    announcement = await regenerateWithShorterPrompt(speakerData, platform);
  }

  return announcement;
}

function validateLength(text: string, platform: string): boolean {
  const limits = {
    linkedin: 3000,
    twitter: 280,
    instagram: 2200,
    discord: 4000
  };

  return text.length <= limits[platform];
}
```

### Image Generation Function
```typescript
async function generateSpeakerCard(
  speakerData: SpeakerForm,
  platform: string
): Promise<Buffer> {
  const dimensions = getPlatformDimensions(platform);

  // Using canvas or image generation library
  const canvas = createCanvas(dimensions.width, dimensions.height);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, dimensions.height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  // Load and draw speaker photo
  const photo = await loadImage(speakerData.profilePhoto);
  drawCircularImage(ctx, photo, {
    x: dimensions.width / 2,
    y: 200,
    radius: 100
  });

  // Add text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(speakerData.fullName, dimensions.width / 2, 350);

  ctx.font = '18px Inter';
  ctx.fillStyle = '#cccccc';
  ctx.fillText(
    `${speakerData.title} at ${speakerData.company}`,
    dimensions.width / 2,
    380
  );

  // Add presentation title
  ctx.font = '24px Inter';
  ctx.fillStyle = '#ffffff';
  wrapText(
    ctx,
    `"${speakerData.presentationTitle}"`,
    dimensions.width / 2,
    450,
    dimensions.width - 100
  );

  // Add logo
  const logo = await loadImage('./assets/deepstation-logo.svg');
  ctx.drawImage(logo, 50, 50, 150, 50);

  return canvas.toBuffer('image/png');
}
```

### Complete Workflow
```typescript
async function createSpeakerAnnouncement(
  speakerForm: SpeakerForm,
  platforms: string[]
): Promise<SocialMediaPost[]> {
  const posts: SocialMediaPost[] = [];
  const eventLink = await createEventLink(speakerForm.eventDate);

  for (const platform of platforms) {
    // Generate text
    const text = await generateAnnouncement({
      speakerData: speakerForm,
      platform,
      eventLink
    });

    // Generate image
    const image = await generateSpeakerCard(speakerForm, platform);

    // Store for review/scheduling
    posts.push({
      platform,
      text,
      image,
      speakerId: speakerForm.id,
      status: 'draft',
      createdAt: new Date()
    });
  }

  return posts;
}
```

## Review & Approval Workflow

1. **Auto-Generation**: System generates draft posts for all platforms
2. **Preview**: Show formatted preview with character counts
3. **Edit**: Allow manual editing of text and image
4. **Approval**: Require admin approval before scheduling
5. **Schedule**: Set publication date/time per platform

## Best Practices

1. **Personalization**: Always reference specific speaker achievements
2. **Value Proposition**: Clearly state what attendees will learn
3. **Social Proof**: Include community statistics
4. **Clear CTA**: Make registration link prominent
5. **Timing**: Announce 2-4 weeks before event
6. **Follow-up**: Create reminder posts 1 week and 1 day before
7. **Tagging**: Always tag speaker (with permission)
8. **Accessibility**: Include alt text for images

## Monitoring & Analytics

Track for each announcement:
- Engagement rate (likes, comments, shares)
- Click-through rate to registration
- Conversion rate (registrations from post)
- Reach and impressions
- Best performing platform
- Optimal posting time

Use insights to refine future announcements.
