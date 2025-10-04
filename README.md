<div align="center">

<!-- Add your custom hero image here -->
<!-- ![DeepStation Hero](./docs/images/hero.png) -->

# 🚀 DeepStation

### AI-Powered Social Media Automation Platform

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy)

**The open-source platform that simplifies social media management across LinkedIn, Instagram, X, and Discord.**

[Quick Start](#-quick-start) • [Features](#-features) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## ⚡ Why DeepStation?

Managing multiple social media platforms is time-consuming and complex. DeepStation solves this by providing:

- 🤖 **AI-Powered Content** - Generate platform-optimized posts with GPT-4, Gemini, or Claude
- 📅 **Smart Scheduling** - Schedule once, publish everywhere with timezone intelligence
- 📊 **Unified Analytics** - Track performance across all platforms in one dashboard
- 🎤 **Speaker Announcements** - Create beautiful announcements with AI-generated content and branded cards
- 🔒 **Enterprise Security** - OAuth 2.0, AES-256 encryption, and row-level security

Built for communities, agencies, and content creators who need powerful automation without the complexity.

---

## 📋 Table of Contents

- [Why DeepStation?](#-why-deepstation)
- [Features](#-features)
- [Demo](#-demo)
- [Quick Start](#-quick-start)
- [Tech Stack](#-tech-stack)
- [Documentation](#-documentation)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Roadmap](#️-roadmap)
- [License](#-license)

---

## 🌟 Features

<table>
<tr>
<td width="50%">

### 📱 Multi-Platform Publishing
Publish to **LinkedIn**, **Instagram**, **X (Twitter)**, and **Discord** simultaneously with platform-specific optimizations.

**Highlights:**
- One post, four platforms
- Platform-specific character limits
- Automatic hashtag optimization
- Rich media support (images, videos)
- Draft and preview before posting

</td>
<td width="50%">

### ⏰ Smart Scheduling
Set it and forget it with intelligent scheduling that respects timezones and optimal posting times.

**Highlights:**
- Multi-timezone support
- Recurring posts (daily, weekly, monthly)
- Optimal time recommendations
- Queue management
- Automatic retry on failures

</td>
</tr>
<tr>
<td width="50%">

### 🎤 AI-Powered Content
Choose from **GPT-4**, **Gemini**, or **Claude** to generate engaging, platform-optimized content.

**Highlights:**
- Speaker announcement generator
- Branded visual cards
- Platform-specific tone and style
- Custom prompt templates
- One-click content generation

</td>
<td width="50%">

### 📊 Analytics Dashboard
Understand what works with comprehensive analytics across all platforms.

**Highlights:**
- Engagement tracking (likes, shares, comments)
- Best posting times heatmap
- Platform performance comparison
- Export to CSV
- Real-time metrics

</td>
</tr>
<tr>
<td width="50%">

### 🔐 Enterprise Security
Built with security-first mindset for peace of mind.

**Highlights:**
- OAuth 2.0 with PKCE
- AES-256-GCM token encryption
- Row-level database security
- HTTPS everywhere
- Automatic token refresh

</td>
<td width="50%">

### 🎨 Beautiful UI
Modern, responsive design that works on desktop and mobile.

**Highlights:**
- Dark mode support
- Responsive grid layouts
- Real-time previews
- Intuitive navigation
- Accessibility-focused

</td>
</tr>
</table>

---

## 🎬 Demo

```bash
# Install and start in under 2 minutes
git clone https://github.com/yourusername/deepstation.git
cd deepstation
npm install
cp .env.local.example .env.local
# Add your API keys to .env.local
npm run dev
```

**What you can do:**
1. ✅ Connect your social media accounts via OAuth
2. ✅ Create and schedule a post to all platforms
3. ✅ Generate an AI-powered speaker announcement
4. ✅ View analytics across all platforms
5. ✅ Set up recurring posts with custom schedules

---

## 🚀 Tech Stack

<table>
<tr>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" width="48" height="48" alt="Next.js" />
<br><strong>Next.js 15</strong>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="48" height="48" alt="React" />
<br><strong>React 19</strong>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="48" height="48" alt="TypeScript" />
<br><strong>TypeScript</strong>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="48" height="48" alt="Tailwind" />
<br><strong>Tailwind CSS</strong>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="48" height="48" alt="PostgreSQL" />
<br><strong>Supabase</strong>
</td>
</tr>
</table>

**Core Technologies:**
- **Frontend Framework**: Next.js 15 with App Router, React 19, TypeScript 5.9
- **Styling**: Tailwind CSS 4 with custom design system
- **Database**: Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime)
- **AI Providers**: OpenAI GPT-4, Google Gemini, Anthropic Claude
- **Charts & Viz**: Recharts for analytics dashboards
- **Deployment**: Netlify with automatic deployments
- **Platform APIs**: LinkedIn API, Instagram Graph API, X (Twitter) API v2, Discord Webhooks

---

## ⚡ Quick Start

Get up and running in **5 minutes** with these simple steps:

### 📦 Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/deepstation.git
cd deepstation

# Install dependencies
npm install
```

### 🔑 Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.local.example .env.local
```

**Required API Keys:**
- ✅ [Supabase](https://supabase.com) - Database & Auth (Free tier available)
- ✅ [OpenAI](https://platform.openai.com) or [Gemini](https://ai.google.dev) or [Anthropic](https://console.anthropic.com) - AI Content Generation
- ✅ [LinkedIn](https://www.linkedin.com/developers/) - OAuth credentials
- ✅ [Facebook](https://developers.facebook.com/) - For Instagram integration
- ✅ [X (Twitter)](https://developer.twitter.com/) - API credentials
- ✅ [Discord](https://discord.com/developers/) - Webhook URL

<details>
<summary>📝 Click to see full .env.local template</summary>

```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3055

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth Credentials
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-secret
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-secret

# AI Provider (choose one or more)
OPENAI_API_KEY=sk-your-openai-key
GEMINI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Security
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
```

</details>

### 🗄️ Step 3: Set Up Database

Run the Supabase migrations in order:

```bash
# Option 1: Using Supabase CLI (recommended)
supabase db push

# Option 2: Manual via Supabase Dashboard SQL Editor
# Run migrations in order from supabase/migrations/ folder
```

<details>
<summary>📊 Click to see database schema overview</summary>

**Core Tables:**
- `oauth_tokens` - Encrypted OAuth credentials
- `scheduled_posts` - Post queue with scheduling
- `post_results` - Publishing results & metrics
- `recurring_posts` - Recurring post templates
- `speakers` - Speaker database
- `speaker_announcements` - Generated announcements

**Views:**
- `post_analytics` - Aggregated metrics
- `platform_performance` - Platform stats

</details>

### 🚀 Step 4: Deploy Edge Functions (Optional)

```bash
# Deploy the scheduled post processor
supabase functions deploy process-scheduled-posts

# Set up cron job (runs every 5 minutes)
supabase functions schedule process-scheduled-posts --cron "*/5 * * * *"
```

### 🎉 Step 5: Start Development

```bash
npm run dev
```

**🌐 Open your browser:** http://localhost:3055

**What's next?**
1. 🔗 Connect your social media accounts
2. ✍️ Create your first post
3. 📅 Schedule it across all platforms
4. 📊 View your analytics dashboard

---

## 📖 Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - Complete Netlify deployment instructions
- **[PRD](./PRD.md)** - Product requirements and roadmap
- **[OAuth Setup](./docs/oauth-flow.md)** - OAuth implementation details
- **[Publishing Guide](./docs/social-media-integration-system.md)** - Platform integration
- **[Scheduling System](./docs/posting-system-with-scheduling.md)** - Scheduling architecture
- **[Speaker Announcements](./docs/speaker-announcement-generator.md)** - AI content generation

---

## 🏗️ Project Structure

```
deepstation/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Auth pages (login, signup)
│   ├── api/                      # API routes
│   ├── auth/                     # OAuth callbacks
│   └── dashboard/                # Main application
│       ├── accounts/             # Connected accounts
│       ├── analytics/            # Analytics dashboard
│       ├── posts/                # Post management
│       └── speakers/             # Speaker announcements
├── components/                   # React components
│   ├── accounts/                 # Account management
│   ├── analytics/                # Analytics charts
│   ├── auth/                     # Authentication
│   ├── layout/                   # Navigation, sidebar
│   ├── posts/                    # Post editor, previews
│   └── ui/                       # Base UI components
├── lib/                          # Business logic
│   ├── ai/                       # OpenAI integration
│   ├── analytics/                # Analytics services
│   ├── auth/                     # OAuth, encryption
│   ├── hooks/                    # React hooks
│   ├── images/                   # Image generation
│   ├── media/                    # Media optimization
│   ├── publishing/               # Platform publishers
│   ├── scheduling/               # Scheduling system
│   ├── supabase/                 # Supabase clients
│   ├── types/                    # TypeScript types
│   └── utils/                    # Utilities
├── supabase/                     # Supabase config
│   ├── functions/                # Edge Functions
│   └── migrations/               # Database migrations
└── docs/                         # Documentation
```

---

## 🎯 Key Features Explained

### Multi-Platform Publishing

Post to all platforms simultaneously with platform-specific content:

```typescript
import { publishToAllPlatforms } from '@/lib/publishing';

await publishToAllPlatforms({
  userId: 'user-123',
  platforms: ['linkedin', 'twitter', 'instagram', 'discord'],
  content: {
    linkedin: 'Professional post for LinkedIn...',
    twitter: 'Short tweet! 🚀',
    instagram: 'Visual caption with #hashtags',
    discord: '@everyone Community update!'
  },
  images: ['https://cdn.example.com/image.jpg']
});
```

### Scheduling

Schedule posts with timezone support:

```typescript
import { schedulePost } from '@/lib/scheduling';

await schedulePost({
  content: {...},
  scheduledFor: new Date('2025-01-15T14:00:00'),
  timezone: 'America/New_York',
  platforms: ['linkedin', 'twitter'],
  recurring: {
    frequency: 'weekly',
    days: ['monday', 'wednesday', 'friday']
  }
});
```

### Speaker Announcements

Generate AI content in one click:

```typescript
import { generateSpeakerAnnouncement } from '@/lib/ai/speaker-announcement';

const announcements = await generateSpeakerAnnouncement({
  fullName: 'Jane Doe',
  title: 'AI Research Scientist',
  company: 'OpenAI',
  bio: 'Leading researcher in NLP...',
  presentationTitle: 'The Future of AI',
  eventDate: new Date('2025-02-15'),
  eventLocation: 'Miami'
});

// Returns platform-optimized content for LinkedIn, Twitter, Instagram, Discord
```

---

## 🔧 Development

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

---

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Netlify deployment instructions.

**Quick Deploy:**

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy)

---

## 📊 Database Schema

### Core Tables

- **`oauth_tokens`** - Encrypted OAuth tokens
- **`scheduled_posts`** - Scheduled and draft posts
- **`post_results`** - Publishing results and metrics
- **`recurring_posts`** - Recurring post templates
- **`speakers`** - Speaker information
- **`speaker_announcements`** - Generated announcements

### Views

- **`post_analytics`** - Aggregated post metrics
- **`platform_performance`** - Platform-specific stats

---

## 🤝 Contributing

We ❤️ contributions! DeepStation is built by the community, for the community.

### 🌟 Ways to Contribute

- 🐛 **Report Bugs** - Found an issue? [Open a bug report](https://github.com/yourusername/deepstation/issues/new?template=bug_report.md)
- 💡 **Suggest Features** - Have an idea? [Request a feature](https://github.com/yourusername/deepstation/issues/new?template=feature_request.md)
- 📝 **Improve Docs** - Documentation can always be better
- 🎨 **Design** - Help with UI/UX improvements
- 💻 **Code** - Pick an issue and submit a PR

### 🚀 Quick Contribution Guide

```bash
# 1. Fork and clone your fork
git clone https://github.com/YOUR_USERNAME/deepstation.git

# 2. Create a feature branch
git checkout -b feature/amazing-feature

# 3. Make your changes and commit
git add .
git commit -m 'feat: add amazing feature'

# 4. Push to your fork
git push origin feature/amazing-feature

# 5. Open a Pull Request
# Visit GitHub and click "Compare & pull request"
```

**Commit Convention:**
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### 🎯 Good First Issues

Looking for a place to start? Check out our [good first issues](https://github.com/yourusername/deepstation/labels/good%20first%20issue).

---

## 📄 License

ISC License - see [LICENSE](./LICENSE) file for details

---

## 🙏 Acknowledgments

- **DeepStation Community** - 3,000+ members, 70+ events, 100+ speakers
- **OpenAI** - AI-powered content generation
- **Supabase** - Backend infrastructure
- **Netlify** - Hosting and deployment

---

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/yourusername/deepstation/issues)
- **Community**: Join DeepStation Discord

---

## 🗺️ Roadmap

<table>
<tr>
<td width="50%">

### ✅ Completed

- ✅ **Multi-platform Publishing** - LinkedIn, Instagram, X, Discord
- ✅ **Smart Scheduling** - Timezone-aware, recurring posts
- ✅ **Analytics Dashboard** - Comprehensive metrics tracking
- ✅ **AI Content Generation** - GPT-4, Gemini, Claude support
- ✅ **Speaker Announcements** - Automated announcement system
- ✅ **OAuth Integration** - Secure authentication
- ✅ **Image Optimization** - Automatic resizing & formatting
- ✅ **Draft Management** - Save and edit before posting

</td>
<td width="50%">

### 🚀 Coming Soon

- 🔄 **Team Collaboration** - Multi-user support with roles
- 🔄 **Approval Workflows** - Review before publishing
- 🔄 **Video Support** - Upload and schedule videos
- 🔄 **A/B Testing** - Test different post variations
- 🔄 **Advanced Analytics** - Sentiment analysis, reach prediction
- 🔄 **More Platforms** - TikTok, YouTube, Threads
- 🔄 **Bulk Import** - CSV/Excel import for bulk scheduling
- 🔄 **API Access** - Public API for integrations
- 🔄 **Mobile App** - Native iOS & Android apps
- 🔄 **AI Improvements** - Custom brand voice, image generation

</td>
</tr>
</table>

**📊 Progress:** ![Progress](https://progress-bar.dev/75/?title=Overall&width=200)

[Vote on features](https://github.com/yourusername/deepstation/discussions/categories/feature-requests) | [View full roadmap](https://github.com/yourusername/deepstation/projects)

---

## 📊 Project Stats

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/yourusername/deepstation?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/deepstation?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/yourusername/deepstation?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/deepstation)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/deepstation)
![GitHub last commit](https://img.shields.io/github/last-commit/yourusername/deepstation)
![GitHub contributors](https://img.shields.io/github/contributors/yourusername/deepstation)

</div>

---

## 💰 Cost Breakdown

<table>
<tr>
<td align="center" width="33%">

### 🆓 Free Tier
**Perfect for development & small teams**

**Services:**
- Supabase: Free (500MB DB)
- Netlify: Free (100GB/mo)
- AI: Pay-per-use (~$5-10/mo)

**Total:** ~$5-10/month

</td>
<td align="center" width="33%">

### 💼 Starter
**For growing communities**

**Services:**
- Supabase Pro: $25/mo
- Netlify Pro: $19/mo
- AI Usage: ~$20-30/mo

**Total:** ~$65-75/month

</td>
<td align="center" width="33%">

### 🚀 Scale
**For large organizations**

**Services:**
- Supabase Pro: $25/mo
- Netlify Pro: $19/mo
- AI Usage: ~$50-100/mo

**Total:** ~$95-145/month

</td>
</tr>
</table>

💡 **Pro Tip:** Start on free tier, scale as you grow. All features available on all tiers!

---

## ⚡ Performance

- **Page Load**: <2 seconds
- **API Response**: <500ms average
- **Scheduler**: Runs every 5 minutes
- **Success Rate**: >95% publishing success

---

## 🔒 Security

- ✅ OAuth 2.0 with PKCE
- ✅ AES-256-GCM token encryption
- ✅ Row-level security in database
- ✅ HTTPS everywhere
- ✅ CSRF protection
- ✅ Environment-based secrets
- ✅ Regular dependency updates

---

## 💬 Community & Support

<table>
<tr>
<td align="center">
<a href="https://discord.gg/deepstation"><img src="https://img.shields.io/badge/Discord-Join%20Us-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"/></a>
<br><strong>Join our Discord</strong>
<br>Get help & discuss features
</td>
<td align="center">
<a href="https://github.com/yourusername/deepstation/discussions"><img src="https://img.shields.io/badge/GitHub-Discussions-181717?style=for-the-badge&logo=github&logoColor=white" alt="Discussions"/></a>
<br><strong>GitHub Discussions</strong>
<br>Ask questions & share ideas
</td>
<td align="center">
<a href="https://twitter.com/deepstation"><img src="https://img.shields.io/badge/Twitter-Follow-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter"/></a>
<br><strong>Follow us on X</strong>
<br>Stay updated with news
</td>
</tr>
</table>

---

## ❓ FAQ

<details>
<summary><strong>Can I use this for commercial purposes?</strong></summary>
<br>
Yes! DeepStation is licensed under ISC, which allows commercial use.
</details>

<details>
<summary><strong>Do I need all AI providers?</strong></summary>
<br>
No, you only need one AI provider (OpenAI, Gemini, or Claude) for content generation. You can use multiple if you want options.
</details>

<details>
<summary><strong>Is my data secure?</strong></summary>
<br>
Yes! We use OAuth 2.0 for authentication and AES-256-GCM encryption for storing sensitive tokens. Your data never leaves your Supabase instance.
</details>

<details>
<summary><strong>Can I self-host this?</strong></summary>
<br>
Absolutely! DeepStation is fully self-hostable. You own your data and infrastructure.
</details>

<details>
<summary><strong>What platforms are supported?</strong></summary>
<br>
Currently: LinkedIn, Instagram (via Facebook), X (Twitter), and Discord. More platforms coming soon!
</details>

<details>
<summary><strong>How much does it cost to run?</strong></summary>
<br>
You can start completely free with Supabase and Netlify's free tiers. Production costs range from $65-145/month depending on usage.
</details>

---

## 🌟 Star History

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/deepstation&type=Date)](https://star-history.com/#yourusername/deepstation&Date)

**If DeepStation helps you, consider giving it a star! ⭐**

</div>

---

## 🙏 Acknowledgments

This project wouldn't be possible without:

- **[DeepStation Community](https://deepstation.ai)** - 3,000+ members, 70+ events, 100+ speakers
- **[Supabase](https://supabase.com)** - Amazing open-source Firebase alternative
- **[Next.js](https://nextjs.org)** - The React framework for production
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **AI Providers** - OpenAI, Google, Anthropic for powering content generation
- **All our contributors** - Thank you for making DeepStation better!

---

## 📄 License

DeepStation is open-source software licensed under the **ISC License**.

```
Copyright (c) 2025 DeepStation

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.
```

See [LICENSE](./LICENSE) for full details.

---

<div align="center">

### Built with ❤️ by the community, for the community

**Make social media management effortless**

[![Get Started](https://img.shields.io/badge/Get%20Started-Quick%20Start-blue?style=for-the-badge)](#-quick-start)
[![Documentation](https://img.shields.io/badge/Read-Documentation-green?style=for-the-badge)](./docs/)
[![Website](https://img.shields.io/badge/Visit-DeepStation.ai-orange?style=for-the-badge)](https://deepstation.ai)

**Don't forget to star ⭐ this repository if you find it useful!**

[Report Bug](https://github.com/yourusername/deepstation/issues) • [Request Feature](https://github.com/yourusername/deepstation/issues) • [Contribute](CONTRIBUTING.md)

---

**Made with 🚀 by [DeepStation](https://deepstation.ai) • Follow us on [X](https://twitter.com/deepstation) • Join our [Discord](https://discord.gg/deepstation)**

</div>
