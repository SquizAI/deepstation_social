# Multi-Tenant Events SaaS Platform - Implementation Plan

## 🎯 Project Overview

Transform DeepStation into a white-label, multi-tenant events management SaaS platform that allows multiple organizations to:
- Host and manage their own event calendars
- Sell tickets with Stripe integration
- Create beautiful, branded public event pages
- Discover events across the platform
- Manage registrations and attendees

**Current State:** Single-tenant system with basic event functionality
**Target State:** Multi-tenant SaaS with Stripe payments, enhanced UX, and discovery features

---

## 📊 Data Collected from Luma

### Events Scraped (5 total):

1. **OpenAI Academy x DeepStation: Build a Multi-Agent System**
   - Type: Virtual/Online
   - Attendees: 204 going
   - Date: October 6, 2025, 3:00-4:00 PM ET
   - Format: Workshop/Academy session
   - Hosted by: DeepStation, Grant Kurz, Sonali P.

2. **DeepStation - AI Startup Days**
   - Type: In-person
   - Location: The LAB Miami
   - Attendees: 108 going
   - Date: October 14, 2025, 6:00-9:30 PM ET
   - Format: Startup showcase with judges
   - Features: Multiple speakers, networking

3. **DeepStation x MSRIT Bangalore - Launch Event**
   - Type: In-person
   - Location: Ramaiah Institute of Technology, Bangalore, India
   - Approval Required: Yes
   - Format: Launch event/Conference

4. **DeepStation MoonMax AI Film Festival**
   - Type: In-person
   - Location: Miami, Florida
   - Attendees: 91 going
   - Date: November 8, 2025
   - Features: Ticket types, awards, $10,000 in prizes
   - Categories: Best Picture, Best Commercial, Best Story, etc.

5. **Vibe Days**
   - Type: In-person
   - Location: Alan B. Levan | NSU Broward Center, Davie, FL
   - Approval Required: Yes
   - Format: Community builder meetup
   - Focus: Live coding, workshops, networking

---

## 🏗 Architecture Design

### Multi-Tenancy Model: **Organization-based with Shared Database**

```
┌─────────────────────────────────────────────────────────┐
│                   DeepStation Platform                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Organization │  │ Organization │  │ Organization │  │
│  │      A       │  │      B       │  │      C       │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  │
│  │ • Events     │  │ • Events     │  │ • Events     │  │
│  │ • Branding   │  │ • Branding   │  │ • Branding   │  │
│  │ • Tickets    │  │ • Tickets    │  │ • Tickets    │  │
│  │ • Members    │  │ • Members    │  │ • Members    │  │
│  │ • Stripe     │  │ • Stripe     │  │ • Stripe     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- Each organization has its own subdomain: `deepstation.yourplatform.com`
- Shared database with `organization_id` for data isolation
- Row-Level Security (RLS) policies per organization
- Each organization can have multiple admin users
- Stripe Connect for multi-tenant payment processing

---

## 🗄 Database Schema Updates

### New Tables Needed:

#### 1. `organizations` (NEW)
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE, -- Optional: org.platform.com

  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#FFFFFF',
  custom_css JSONB DEFAULT '{}',

  -- Billing
  stripe_account_id TEXT, -- Stripe Connect account
  subscription_tier TEXT DEFAULT 'free', -- free, pro, enterprise
  subscription_status TEXT DEFAULT 'active',

  -- Settings
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Ownership
  owner_id UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. `organization_members` (NEW)
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- owner, admin, member, viewer
  permissions JSONB DEFAULT '{}',

  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id, user_id)
);
```

#### 3. Update `events` table
```sql
ALTER TABLE events
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_events_organization ON events(organization_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own events" ON events;

CREATE POLICY "Users can view events from their organizations"
  ON events FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

#### 4. Update `ticket_types` table
```sql
ALTER TABLE ticket_types
ADD COLUMN stripe_price_id TEXT, -- Stripe Price ID
ADD COLUMN stripe_product_id TEXT; -- Stripe Product ID
```

#### 5. `transactions` (NEW - for Stripe payments)
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  event_id UUID REFERENCES events(id),
  registration_id UUID REFERENCES event_registrations(id),

  -- Stripe data
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_customer_id TEXT,

  -- Transaction details
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending', -- pending, succeeded, failed, refunded

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 💳 Stripe Integration Architecture

### Stripe Connect Setup

```typescript
// lib/stripe/connect.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Create Stripe Connect Account for Organization
 */
export async function createConnectAccount(organizationId: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  // Save account.id to organizations.stripe_account_id
  return account;
}

/**
 * Create Product and Price for Ticket Type
 */
export async function createTicketProduct(
  ticketType: TicketType,
  connectedAccountId: string
) {
  // Create product
  const product = await stripe.products.create(
    {
      name: ticketType.name,
      description: ticketType.description,
    },
    { stripeAccount: connectedAccountId }
  );

  // Create price
  const price = await stripe.prices.create(
    {
      product: product.id,
      unit_amount: Math.round(ticketType.price * 100), // Convert to cents
      currency: ticketType.currency.toLowerCase(),
    },
    { stripeAccount: connectedAccountId }
  );

  return { product, price };
}
```

### Checkout Flow

```typescript
// app/api/checkout/route.ts
export async function POST(request: Request) {
  const { ticketTypeId, quantity, eventId } = await request.json();

  // Get organization's Stripe account
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_account_id')
    .eq('id', organizationId)
    .single();

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      line_items: [
        {
          price: ticketType.stripe_price_id,
          quantity,
        },
      ],
      success_url: `${baseUrl}/events/${eventSlug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/events/${eventSlug}`,
      metadata: {
        eventId,
        ticketTypeId,
        organizationId,
      },
    },
    {
      stripeAccount: org.stripe_account_id,
    }
  );

  return Response.json({ url: session.url });
}
```

---

## 🎨 Frontend Components to Build

### 1. Calendar Views

#### `/app/events/page.tsx` - Main Calendar Page
```typescript
/**
 * Features:
 * - Monthly/Weekly/List view toggle
 * - Filter by category, location, type
 * - Search functionality
 * - Featured events carousel
 * - "Upcoming", "This Week", "This Month" sections
 */
```

#### `/app/events/discover/page.tsx` - Discovery Page
```typescript
/**
 * Features:
 * - AI-powered recommendations
 * - Trending events
 * - Events near you (geolocation)
 * - Category browsing
 * - Social proof (X people attending)
 */
```

### 2. Event Detail Pages

#### `/app/events/[slug]/page.tsx` - Public Event Page
```typescript
/**
 * Improvements over Luma:
 * - Hero section with gradient and event image
 * - Sticky CTA button (Register/Buy Tickets)
 * - Interactive agenda with speaker bios
 * - Google Maps embed for location
 * - Similar events section
 * - Share functionality
 * - Add to calendar (ICS download)
 * - Public header showing organization branding
 */
```

### 3. Checkout Flow

#### `/app/events/[slug]/checkout/page.tsx`
```typescript
/**
 * Features:
 * - Ticket selection (multiple types)
 * - Guest information form
 * - Stripe Elements integration
 * - Order summary
 * - Promo code field
 * - Terms & conditions
 */
```

### 4. Dashboard Components

#### `/app/dashboard/my-events/page.tsx`
```typescript
/**
 * Organization Admin Dashboard:
 * - Create new event
 * - Edit existing events
 * - View registrations
 * - Export attendee list
 * - Check-in interface
 * - Analytics (views, registrations, revenue)
 */
```

---

## 🔧 Implementation Phases & Sub-Agents

### **Phase 1: Database & Multi-Tenancy Foundation**
**Agent:** `supabase-architect`

**Tasks:**
1. Create `organizations` table with RLS policies
2. Create `organization_members` table with RLS policies
3. Create `transactions` table for payment tracking
4. Update `events` table with `organization_id` column
5. Update `ticket_types` table with Stripe fields
6. Update `event_registrations` table to link to transactions
7. Create database functions for organization management
8. Set up RLS policies for all tables based on organization membership

**SQL Migrations:**
- `20250101_create_organizations.sql`
- `20250101_create_organization_members.sql`
- `20250101_create_transactions.sql`
- `20250101_update_events_for_multitenancy.sql`
- `20250101_update_ticket_types_stripe.sql`

---

### **Phase 2: Import Luma Events Data**
**Agent:** `general-purpose`

**Tasks:**
1. Create DeepStation organization in database
2. Transform scraped Luma data to match our schema
3. Import all 5 events into Supabase
4. Download and upload event cover images to Supabase Storage
5. Create default ticket types for events that have them
6. Set up event hosts/speakers data

**Script:** `scripts/import-luma-events.ts`

---

### **Phase 3: Stripe Integration**
**Agent:** `api-integrator`

**Tasks:**
1. Install Stripe SDK: `npm install stripe @stripe/stripe-js`
2. Create Stripe Connect onboarding flow
3. Build `/app/api/stripe/connect/route.ts` for account creation
4. Build `/app/api/stripe/products/route.ts` for product/price creation
5. Build `/app/api/checkout/route.ts` for checkout sessions
6. Build `/app/api/webhooks/stripe/route.ts` for payment confirmations
7. Create Stripe Connect dashboard link
8. Handle refunds and cancellations

**Environment Variables:**
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

### **Phase 4: Organization Management UI**
**Agent:** `frontend-builder`

**Tasks:**
1. Build `/app/dashboard/organization/settings/page.tsx`
   - Update organization name, branding, colors
   - Upload logo
   - Manage subdomain
2. Build `/app/dashboard/organization/members/page.tsx`
   - Invite team members
   - Manage roles & permissions
   - Remove members
3. Build `/app/dashboard/organization/billing/page.tsx`
   - Connect Stripe account
   - View subscription status
   - Billing history
4. Create organization switcher component (multi-org support)

**Components:**
- `components/organization/organization-settings-form.tsx`
- `components/organization/member-list.tsx`
- `components/organization/stripe-connect-button.tsx`
- `components/organization/organization-switcher.tsx`

---

### **Phase 5: Enhanced Event Management Dashboard**
**Agent:** `frontend-builder`

**Tasks:**
1. Build `/app/dashboard/events/new/page.tsx`
   - Rich text editor for description
   - Multiple ticket types
   - Custom registration questions
   - Advanced settings (capacity, approval, guests)
2. Build `/app/dashboard/events/[id]/edit/page.tsx`
3. Build `/app/dashboard/events/[id]/registrations/page.tsx`
   - Filter and search registrations
   - Export to CSV
   - Check-in interface
   - Send bulk emails
4. Build `/app/dashboard/events/[id]/analytics/page.tsx`
   - Views over time
   - Conversion rate
   - Revenue breakdown
   - Geographic distribution

**Components:**
- `components/events/event-form.tsx`
- `components/events/ticket-type-builder.tsx`
- `components/events/registration-table.tsx`
- `components/events/check-in-scanner.tsx`
- `components/events/analytics-dashboard.tsx`

---

### **Phase 6: Calendar & Discovery Frontend**
**Agent:** `frontend-builder`

**Tasks:**
1. Build `/app/events/page.tsx` - Main calendar page
   - Install: `npm install @fullcalendar/react @fullcalendar/daygrid`
   - Monthly/Weekly/List views
   - Filter sidebar (category, location, date)
   - Search with autocomplete
2. Build `/app/events/discover/page.tsx`
   - Featured events carousel
   - Trending section
   - Categories grid
   - Near you (with geolocation permission)
3. Build `/app/events/[slug]/page.tsx` - Improved public page
   - Hero with gradient overlay
   - Sticky register button
   - Interactive agenda
   - Google Maps embed
   - Social sharing
   - Add to calendar (ICS)

**Components:**
- `components/calendar/event-calendar.tsx`
- `components/calendar/calendar-filters.tsx`
- `components/discovery/featured-carousel.tsx`
- `components/discovery/trending-events.tsx`
- `components/events/public-event-hero.tsx`
- `components/events/event-agenda.tsx`
- `components/events/event-map.tsx`
- `components/events/share-buttons.tsx`

---

### **Phase 7: Checkout & Payment Flow**
**Agent:** `frontend-builder` + `api-integrator`

**Tasks:**
1. Build `/app/events/[slug]/checkout/page.tsx`
   - Ticket selection with quantity
   - Guest information form
   - Stripe Elements integration
   - Order summary
   - Promo codes
2. Build `/app/api/checkout/route.ts`
   - Create Stripe Checkout Session
   - Handle organization's connected account
3. Build `/app/events/[slug]/success/page.tsx`
   - Thank you page
   - Ticket/confirmation details
   - Add to calendar
   - Share on social media
4. Build `/app/api/webhooks/stripe/route.ts`
   - Handle payment_intent.succeeded
   - Create registration in database
   - Send confirmation email
   - Update ticket quantities

**Components:**
- `components/checkout/ticket-selector.tsx`
- `components/checkout/guest-form.tsx`
- `components/checkout/stripe-checkout-form.tsx`
- `components/checkout/order-summary.tsx`
- `components/checkout/success-confirmation.tsx`

---

### **Phase 8: Public Branding & Headers**
**Agent:** `frontend-builder`

**Tasks:**
1. Create public event page header component
   - Show organization logo
   - Organization name
   - Link back to organization calendar
   - Minimal, clean design
2. Build custom subdomain routing
   - `app/[subdomain]/events/[slug]/page.tsx`
   - Dynamic organization theming based on subdomain
3. Apply organization branding:
   - Primary/secondary colors
   - Custom CSS
   - Logo in header
4. Build organization public calendar page
   - `/[subdomain]/events` shows all org events

**Components:**
- `components/public/branded-header.tsx`
- `components/public/organization-theme-provider.tsx`
- `app/[subdomain]/layout.tsx` (subdomain routing)

---

### **Phase 9: Email Notifications**
**Agent:** `api-integrator`

**Tasks:**
1. Set up email service (Resend or SendGrid)
2. Build confirmation email template
3. Build reminder email template (24h before event)
4. Build ticket email with QR code
5. Build API route for sending emails
6. Create email preferences for users

**Email Templates:**
- Registration confirmation
- Payment receipt
- Event reminder (24h, 1h before)
- Event updates/changes
- Cancellation notification

---

### **Phase 10: Advanced Features**
**Agent:** `general-purpose`

**Tasks:**
1. QR code check-in system
   - Generate QR codes for tickets
   - Build mobile-friendly check-in scanner
2. Waitlist management
   - Auto-promote when spots open
3. Recurring events
   - RRULE support for series
4. Event cloning
   - Duplicate event with one click
5. Analytics & Reporting
   - Revenue reports
   - Attendee insights
   - Popular events

---

## 📁 File Structure

```
/app
  /events
    /page.tsx                    # Calendar view
    /discover/page.tsx           # Discovery page
    /[slug]
      /page.tsx                  # Public event detail
      /checkout/page.tsx         # Checkout flow
      /success/page.tsx          # Post-purchase
  /dashboard
    /events
      /page.tsx                  # Events list
      /new/page.tsx              # Create event
      /[id]
        /edit/page.tsx           # Edit event
        /registrations/page.tsx  # Manage attendees
        /analytics/page.tsx      # Event analytics
    /organization
      /settings/page.tsx         # Org settings
      /members/page.tsx          # Team management
      /billing/page.tsx          # Stripe & subscription
  /api
    /organizations/route.ts
    /events/route.ts
    /checkout/route.ts
    /webhooks/stripe/route.ts
    /stripe
      /connect/route.ts
      /products/route.ts
  /[subdomain]                   # Multi-tenant routing
    /events/[slug]/page.tsx

/components
  /calendar
    /event-calendar.tsx
    /calendar-filters.tsx
  /discovery
    /featured-carousel.tsx
    /trending-events.tsx
  /events
    /event-card.tsx
    /event-form.tsx
    /ticket-type-builder.tsx
    /public-event-hero.tsx
    /event-agenda.tsx
  /checkout
    /ticket-selector.tsx
    /stripe-checkout-form.tsx
    /order-summary.tsx
  /organization
    /organization-settings-form.tsx
    /member-list.tsx
    /stripe-connect-button.tsx
  /public
    /branded-header.tsx
    /organization-theme-provider.tsx

/lib
  /stripe
    /connect.ts                  # Stripe Connect helpers
    /checkout.ts                 # Checkout session creation
    /webhooks.ts                 # Webhook handling
  /events
    /registration.ts             # Registration logic
    /tickets.ts                  # Ticket management
  /organizations
    /members.ts                  # Membership management
    /branding.ts                 # Theming helpers

/supabase/migrations
  /20250101_create_organizations.sql
  /20250101_create_organization_members.sql
  /20250101_create_transactions.sql
  /20250101_update_events_for_multitenancy.sql
```

---

## 🚀 Execution Order & Agent Chain

### Step 1: Database Foundation
```bash
Agent: supabase-architect
Task: Create all database tables, RLS policies, and migrations
```

### Step 2: Import Data
```bash
Agent: general-purpose
Task: Import DeepStation events from Luma scrape data
```

### Step 3: Stripe Backend
```bash
Agent: api-integrator
Task: Build Stripe Connect integration and payment APIs
```

### Step 4: Organization Management
```bash
Agent: frontend-builder
Task: Build organization settings, members, billing UI
```

### Step 5: Event Management Dashboard
```bash
Agent: frontend-builder
Task: Build enhanced event creation and management interfaces
```

### Step 6: Public Calendar & Discovery
```bash
Agent: frontend-builder
Task: Build calendar views and discovery features
```

### Step 7: Checkout Flow
```bash
Agents: frontend-builder + api-integrator (parallel)
Task: Build complete checkout and payment processing
```

### Step 8: Public Pages & Branding
```bash
Agent: frontend-builder
Task: Build public event pages with org branding
```

### Step 9: Email & Notifications
```bash
Agent: api-integrator
Task: Set up transactional emails and notifications
```

### Step 10: Polish & Advanced Features
```bash
Agent: general-purpose
Task: QR codes, analytics, recurring events, etc.
```

---

## 📊 Success Metrics

**Technical:**
- [ ] Multi-tenant database with RLS working
- [ ] Stripe Connect accounts can be created
- [ ] Payments processed through connected accounts
- [ ] All 5 Luma events imported successfully
- [ ] Calendar view shows all events
- [ ] Public event pages load with org branding
- [ ] Checkout flow completes end-to-end
- [ ] Email confirmations sent automatically

**UX Improvements over Luma:**
- [ ] Better visual design (gradients, modern UI)
- [ ] Faster page loads
- [ ] More intuitive checkout
- [ ] Better mobile experience
- [ ] Rich text event descriptions
- [ ] Interactive agendas
- [ ] Built-in analytics
- [ ] White-label branding

**Business:**
- [ ] Multiple organizations can sign up
- [ ] Each org gets their own subdomain
- [ ] Revenue flows to org's Stripe account
- [ ] Platform fee deducted automatically
- [ ] Subscription tiers working (free/pro/enterprise)

---

## 🔐 Security Considerations

1. **RLS Policies:** Every table must have organization-scoped RLS
2. **Stripe Webhooks:** Verify webhook signatures
3. **API Routes:** Check organization membership before mutations
4. **Payment Flow:** Use Stripe Checkout (PCI compliant)
5. **Data Isolation:** Users only see data from their organizations
6. **Subdomain Security:** Validate subdomain before loading organization

---

## 🎯 Next Actions

Ready to execute! The plan is comprehensive and broken down into manageable phases with specific Claude Code sub-agents assigned to each phase.

**To begin, we should:**
1. ✅ Run the `supabase-architect` agent for Phase 1 (Database Foundation)
2. Run the `general-purpose` agent for Phase 2 (Import Luma Events)
3. Chain the remaining agents in sequence

Each phase builds on the previous one, creating a complete multi-tenant events SaaS platform that's significantly better than Luma while maintaining familiar concepts.
