# Event Platform Migration - Implementation Report

**Migration File:** `008_event_platform.sql`
**Created:** 2025-10-04
**Dependencies:** `007_luma_workshops.sql`

## Overview

This migration transforms DeepStation's workshops feature into a full-featured event management platform (like Luma), supporting ticketing, registrations, check-ins, waitlists, and comprehensive analytics.

---

## What Was Created

### 1. Core Tables

#### `events` (renamed from `workshops`)
- **Purpose:** Core event information
- **New Features Added:**
  - Recurring events support (`recurring_rule`, `parent_event_id`)
  - Guest management (`allows_guests`, `max_guests_per_registration`)
  - Approval workflows (`requires_approval`, `approval_message`)
  - Custom branding (`custom_branding` JSONB)
  - Event types (workshop, conference, meetup, webinar, course, etc.)
  - Virtual event support (`virtual_link`, `virtual_platform`, `recording_url`)
  - SEO-friendly slugs
  - Analytics tracking (`view_count`, `share_count`)

**Backward Compatibility:** Created `workshops` view for existing code

---

#### `ticket_types`
- **Purpose:** Manage multiple ticket tiers per event (GA, VIP, Early Bird, etc.)
- **Key Features:**
  - Flexible pricing (free or paid)
  - Inventory management (unlimited or capped)
  - Sale periods (start/end dates)
  - Per-order limits (min/max tickets)
  - Auto-calculated availability
  - Approval requirements per ticket type
  - Display ordering

**Example Use Cases:**
- Early Bird: $50, limited to 100, sales end 30 days before event
- General Admission: $75, limited to 500
- VIP: $150, limited to 50, requires approval
- Free: $0, unlimited

---

#### `discount_codes`
- **Purpose:** Promotional discount codes
- **Types:**
  - Percentage discounts (with optional max cap)
  - Fixed amount discounts
- **Features:**
  - Usage limits (total and per-user)
  - Validity periods
  - Ticket type restrictions
  - Auto-tracking of redemptions

**Example:**
```sql
-- 20% off, max $50 discount, valid until event date, 100 uses
INSERT INTO discount_codes (event_id, code, discount_type, discount_value, max_discount_amount, max_uses)
VALUES ('event-uuid', 'EARLY20', 'percentage', 20, 50, 100);
```

---

#### `custom_fields`
- **Purpose:** Dynamic registration form fields
- **Supported Types:**
  - Text, textarea, email, phone, number
  - Select, multi-select, radio, checkbox
  - Date, URL, file upload
- **Features:**
  - Validation rules (required, min/max, regex)
  - Help text and placeholders
  - Conditional display per ticket type
  - Display ordering

**Example Use Cases:**
- "Dietary restrictions" (textarea, optional)
- "T-shirt size" (select, required)
- "Company name" (text, required for corporate tickets)
- "LinkedIn URL" (url, optional)

---

#### `registrations` (enhanced from `workshop_attendees`)
- **Purpose:** Event registrations and attendee data
- **New Fields:**
  - `user_id` - Link to authenticated users
  - `ticket_type_id` - Which ticket was purchased
  - `order_id` - Link to payment order
  - `confirmation_code` - 8-character check-in code (auto-generated)
  - `qr_code_data` - QR code content for scanning
  - `custom_responses` - JSONB of answers to custom fields
  - `guest_count` & `guest_names` - Additional guests
  - `approval_status` - pending/approved/rejected workflow
  - UTM tracking fields
  - Reminder and follow-up timestamps

**Auto-Generated:**
- `confirmation_code` - Unique 8-char code (e.g., "A3K9L2M7")
- `qr_code_data` - Format: "EVENT:{event_id}:REG:{confirmation_code}"

**Backward Compatibility:** Created `workshop_attendees` view

---

#### `ticket_orders`
- **Purpose:** Track ticket purchases and payments
- **Features:**
  - Auto-generated order numbers (EVT-20250104-ABC123)
  - Line items stored as JSONB (price history preserved)
  - Payment tracking (Stripe, PayPal, free, etc.)
  - Discount code application
  - Tax calculations
  - Refund tracking
  - IP and user agent logging

**Order Flow:**
1. Order created with `payment_status = 'pending'`
2. Payment completed → status = 'completed'
3. Triggers auto-increment of ticket sales
4. Creates registration records

---

#### `waitlist`
- **Purpose:** Manage waitlists when events are sold out
- **Features:**
  - Auto-assigned position in queue
  - Per-ticket-type or general waitlist
  - Status tracking (waiting → offered → accepted/expired)
  - Response deadlines (24 hours to claim spot)
  - Auto-conversion to registration
  - Auto-promotion when spots open

**Auto-Processing:**
- When registration cancelled → next waitlist person gets offer
- Trigger for email notification (to be implemented)

---

#### `check_ins`
- **Purpose:** Track attendee check-ins at events
- **Methods:**
  - QR code scanning
  - Manual entry
  - Email lookup
  - Name lookup
  - Self check-in
- **Features:**
  - Guest count tracking
  - Staff attribution (who checked them in)
  - Location tracking (which entrance)
  - Device metadata

**Auto-Sync:** Updates `registrations.checked_in_at` and sets status to 'attended'

---

#### `event_reminders`
- **Purpose:** Automated email/SMS reminders
- **Types:**
  - Registration confirmation
  - 1 day before event
  - 1 hour before event
  - Event starting now
  - Post-event follow-up
  - Custom reminders
- **Features:**
  - Template variables support
  - Audience targeting (all, registered, waitlisted, by ticket type)
  - Scheduled via offset or specific time
  - Delivery tracking (sent count, failed count)

**To Implement:** Edge Function to process scheduled reminders

---

#### `event_analytics`
- **Purpose:** Track event page performance
- **Metrics:**
  - Page views and unique visitors
  - Registrations and ticket sales
  - Revenue tracking
  - Traffic sources (direct, social, email, search, referral)
  - Device types (desktop, mobile, tablet)
  - Engagement (time on page, bounce rate)
  - Conversion rate

**Granularity:** Daily and hourly aggregates

---

#### `event_shares`
- **Purpose:** Track social sharing for attribution
- **Platforms:**
  - Twitter, LinkedIn, Facebook, Instagram
  - Email, WhatsApp
  - Copy link
- **Features:**
  - Referral code generation
  - Click tracking
  - Conversion tracking (registrations from share)

---

### 2. Helper Views

#### `event_summary`
Complete event statistics in one query:
- Registration counts (by status)
- Capacity utilization
- Ticket sales
- Revenue totals
- Share and view counts

**Usage:**
```sql
SELECT * FROM event_summary WHERE user_id = auth.uid();
```

---

#### `ticket_availability`
Real-time ticket availability and sales status:
- Quantity sold/available
- Availability status (available, sold_out, not_yet_on_sale, sale_ended, inactive)
- Time until sale starts

**Usage:**
```sql
SELECT * FROM ticket_availability WHERE event_id = 'xxx' AND availability_status = 'available';
```

---

#### `registration_details`
Complete registration info for event owners:
- Attendee details
- Ticket and order info
- Payment status
- Check-in information
- Custom field responses

**Usage:**
```sql
SELECT * FROM registration_details WHERE event_id = 'xxx' ORDER BY registered_at DESC;
```

---

#### `upcoming_events`
All published future events with metrics:
- Registration counts
- Pricing info (starting price)
- Capacity status
- Sold out indicator

**Usage:**
```sql
SELECT * FROM upcoming_events WHERE featured = true LIMIT 10;
```

---

### 3. Helper Functions

#### `generate_confirmation_code()`
Generates unique 8-character alphanumeric codes (no ambiguous chars: O, I, 0, 1)

#### `is_discount_code_valid(code, event_id, user_id)`
Validates discount codes against all rules:
- Active status
- Validity period
- Usage limits (total and per-user)
- Returns boolean

**Usage:**
```typescript
const { data } = await supabase.rpc('is_discount_code_valid', {
  p_code: 'EARLY20',
  p_event_id: eventId,
  p_user_id: userId
});
```

#### `calculate_discount_amount(discount_code_id, subtotal)`
Calculates discount amount with caps applied

**Usage:**
```typescript
const { data } = await supabase.rpc('calculate_discount_amount', {
  p_discount_code_id: discountId,
  p_subtotal: 150.00
});
```

#### `track_event_view(event_id, source, device)`
Tracks event page views and updates analytics

**Usage:**
```typescript
await supabase.rpc('track_event_view', {
  p_event_id: eventId,
  p_source: 'social',
  p_device: 'mobile'
});
```

---

### 4. Automated Triggers

#### Confirmation Code Generation
Auto-generates unique codes and QR data on registration insert

#### Order Number Generation
Auto-generates order numbers: `EVT-YYYYMMDD-XXXXXX`

#### Ticket Sales Increment
When order payment completed:
- Increments `ticket_types.quantity_sold`
- Increments `discount_codes.current_uses`
- Updates `events.current_attendees`

#### Check-in Sync
When check-in created:
- Updates `registrations.checked_in_at`
- Sets `registration_status = 'attended'`

#### Waitlist Processing
When registration cancelled:
- Finds next waitlist person
- Offers them the spot
- Sets 24-hour response deadline

#### Waitlist Position Assignment
Auto-assigns position number when joining waitlist

---

### 5. Row Level Security (RLS)

All tables have RLS enabled with policies:

**Public Access:**
- View published event details
- View ticket types and custom fields for published events
- Create registrations and orders for published events
- Join waitlist for published events

**Event Owners:**
- Full access to their own events
- View/manage registrations, orders, waitlist
- View analytics and shares
- Manage reminders and check-ins

**Attendees:**
- View their own registrations and orders
- Update their own registration (for cancellation)

---

## Frontend Implementation Guide

### 1. Event Creation Flow

```typescript
// Create event
const { data: event } = await supabase
  .from('events')
  .insert({
    title: 'AI Workshop',
    description: '...',
    event_date: '2025-02-15',
    start_time: '14:00',
    end_time: '17:00',
    location_type: 'hybrid',
    slug: 'ai-workshop-feb-2025',
    event_type: 'workshop',
    max_capacity: 100,
    waitlist_enabled: true
  })
  .select()
  .single();

// Create ticket types
const { data: tickets } = await supabase
  .from('ticket_types')
  .insert([
    {
      event_id: event.id,
      name: 'Early Bird',
      price: 49.99,
      quantity_total: 50,
      sale_ends_at: '2025-02-01',
      display_order: 1
    },
    {
      event_id: event.id,
      name: 'General Admission',
      price: 79.99,
      quantity_total: 200,
      display_order: 2
    },
    {
      event_id: event.id,
      name: 'VIP',
      price: 149.99,
      quantity_total: 20,
      requires_approval: true,
      display_order: 3
    }
  ]);

// Create custom fields
const { data: fields } = await supabase
  .from('custom_fields')
  .insert([
    {
      event_id: event.id,
      field_name: 'company',
      field_label: 'Company Name',
      field_type: 'text',
      is_required: true,
      display_order: 1
    },
    {
      event_id: event.id,
      field_name: 'dietary',
      field_label: 'Dietary Restrictions',
      field_type: 'textarea',
      is_required: false,
      display_order: 2
    },
    {
      event_id: event.id,
      field_name: 'tshirt_size',
      field_label: 'T-Shirt Size',
      field_type: 'select',
      field_options: [
        { label: 'Small', value: 'S' },
        { label: 'Medium', value: 'M' },
        { label: 'Large', value: 'L' },
        { label: 'X-Large', value: 'XL' }
      ],
      is_required: true,
      display_order: 3
    }
  ]);

// Create discount code
const { data: discount } = await supabase
  .from('discount_codes')
  .insert({
    event_id: event.id,
    code: 'LAUNCH50',
    discount_type: 'percentage',
    discount_value: 50,
    max_uses: 100,
    valid_until: '2025-02-01'
  });
```

---

### 2. Registration Flow

```typescript
// Step 1: Get available tickets
const { data: availableTickets } = await supabase
  .from('ticket_availability')
  .select('*')
  .eq('event_id', eventId)
  .eq('availability_status', 'available');

// Step 2: Validate discount code (optional)
if (discountCode) {
  const { data: isValid } = await supabase.rpc('is_discount_code_valid', {
    p_code: discountCode,
    p_event_id: eventId,
    p_user_id: userId
  });

  if (!isValid) {
    throw new Error('Invalid discount code');
  }
}

// Step 3: Calculate totals
const subtotal = selectedTickets.reduce((sum, t) => sum + (t.price * t.quantity), 0);

let discountAmount = 0;
if (discountCodeId) {
  const { data } = await supabase.rpc('calculate_discount_amount', {
    p_discount_code_id: discountCodeId,
    p_subtotal: subtotal
  });
  discountAmount = data;
}

const total = subtotal - discountAmount;

// Step 4: Create order
const { data: order } = await supabase
  .from('ticket_orders')
  .insert({
    event_id: eventId,
    user_id: userId,
    email: userEmail,
    full_name: userName,
    items: selectedTickets.map(t => ({
      ticket_type_id: t.id,
      quantity: t.quantity,
      price: t.price
    })),
    subtotal,
    discount_code_id: discountCodeId,
    discount_amount: discountAmount,
    total_amount: total,
    currency: 'USD',
    payment_status: 'pending'
  })
  .select()
  .single();

// Step 5: Process payment (Stripe, etc.)
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(total * 100), // cents
  currency: 'usd',
  metadata: {
    order_id: order.id,
    event_id: eventId
  }
});

// Step 6: On payment success, update order and create registrations
if (paymentSucceeded) {
  await supabase
    .from('ticket_orders')
    .update({
      payment_status: 'completed',
      payment_intent_id: paymentIntent.id,
      payment_completed_at: new Date().toISOString()
    })
    .eq('id', order.id);

  // Create registration for each ticket
  const registrations = selectedTickets.flatMap(ticket =>
    Array.from({ length: ticket.quantity }, () => ({
      event_id: eventId,
      user_id: userId,
      ticket_type_id: ticket.id,
      order_id: order.id,
      email: userEmail,
      full_name: userName,
      company: customResponses.company,
      phone: customResponses.phone,
      custom_responses: customResponses,
      registration_status: 'registered',
      utm_source: utmParams.source,
      utm_medium: utmParams.medium,
      utm_campaign: utmParams.campaign
    }))
  );

  const { data: newRegistrations } = await supabase
    .from('registrations')
    .insert(registrations)
    .select();

  // Send confirmation emails with QR codes
  for (const reg of newRegistrations) {
    await sendConfirmationEmail(reg.email, {
      eventTitle: event.title,
      confirmationCode: reg.confirmation_code,
      qrCodeData: reg.qr_code_data
    });
  }
}
```

---

### 3. Check-in Flow

```typescript
// Option A: QR Code Scan
const qrData = "EVENT:uuid-here:REG:A3K9L2M7";
const [_, eventId, __, confirmationCode] = qrData.split(':');

const { data: registration } = await supabase
  .from('registrations')
  .select('*, events(*)')
  .eq('event_id', eventId)
  .eq('confirmation_code', confirmationCode)
  .single();

if (!registration) {
  throw new Error('Invalid QR code');
}

if (registration.checked_in_at) {
  throw new Error('Already checked in');
}

// Create check-in
const { data: checkIn } = await supabase
  .from('check_ins')
  .insert({
    event_id: eventId,
    registration_id: registration.id,
    checked_in_by: staffUserId,
    check_in_method: 'qr_code',
    check_in_location: 'Main Entrance',
    guests_checked_in: registration.guest_count
  });

// Option B: Email Lookup
const { data: registrations } = await supabase
  .from('registrations')
  .select('*')
  .eq('event_id', eventId)
  .eq('email', searchEmail);

// Display list and allow staff to select correct one
```

---

### 4. Analytics Dashboard

```typescript
// Get event summary
const { data: summary } = await supabase
  .from('event_summary')
  .select('*')
  .eq('id', eventId)
  .single();

console.log({
  registered: summary.registered_count,
  attended: summary.attended_count,
  revenue: summary.total_revenue,
  capacity: summary.capacity_percentage
});

// Get daily analytics
const { data: analytics } = await supabase
  .from('event_analytics')
  .select('*')
  .eq('event_id', eventId)
  .order('date', { ascending: false })
  .limit(30);

// Plot registrations over time
const { data: dailyRegistrations } = await supabase
  .from('registrations')
  .select('registered_at')
  .eq('event_id', eventId)
  .order('registered_at');

// Traffic sources
const { data: shares } = await supabase
  .from('event_shares')
  .select('platform, count(*)')
  .eq('event_id', eventId)
  .group('platform');
```

---

### 5. Waitlist Management

```typescript
// Join waitlist
const { data: waitlistEntry } = await supabase
  .from('waitlist')
  .insert({
    event_id: eventId,
    ticket_type_id: ticketTypeId, // or null for general
    email: userEmail,
    full_name: userName,
    phone: userPhone
  })
  .select()
  .single();

console.log(`You're #${waitlistEntry.position} in line`);

// View waitlist (event owner)
const { data: waitlist } = await supabase
  .from('waitlist')
  .select('*, events(title)')
  .eq('event_id', eventId)
  .eq('status', 'waiting')
  .order('position');

// Offer spot to next person
const { data: next } = await supabase
  .from('waitlist')
  .update({
    status: 'offered',
    offered_at: new Date().toISOString(),
    response_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  })
  .eq('id', nextPersonId)
  .select()
  .single();

// Send offer email
await sendWaitlistOfferEmail(next.email, {
  eventTitle: event.title,
  deadline: next.response_deadline,
  acceptUrl: `${baseUrl}/events/${eventSlug}/waitlist/accept/${next.id}`
});
```

---

## Important Notes

### 1. Backward Compatibility
- `workshops` table renamed to `events`
- Views created for `workshops` and `workshop_attendees`
- Existing code will continue to work
- Migrate to new table names over time

### 2. Payment Integration
- Migration includes order structure but not payment processing
- Implement Stripe/PayPal webhooks to update `payment_status`
- Handle refunds via API and update `refund_amount`

### 3. Email/SMS Notifications
- Reminder system structure is in place
- Need Edge Function to process scheduled reminders
- Templates should support variables: `{event_title}`, `{attendee_name}`, `{confirmation_code}`, etc.

### 4. QR Code Generation
- Frontend should generate QR codes from `qr_code_data` field
- Use libraries like `qrcode` or `react-qr-code`
- Include in confirmation emails and tickets

### 5. Recurring Events
- `recurring_rule` uses iCal RRULE format
- `parent_event_id` links instances to parent
- Need frontend logic to generate instances from rule

### 6. File Uploads
- Custom fields support `file` type
- Use Supabase Storage for uploads
- Store URLs in `custom_responses` JSONB

### 7. Performance Considerations
- All foreign keys have indexes
- Views use efficient joins
- For large events (1000+ attendees), consider pagination
- Use `select('id, email, full_name')` to limit returned fields

### 8. Testing Checklist
- [ ] Create event with multiple ticket types
- [ ] Apply discount code at checkout
- [ ] Test sold-out scenario and waitlist
- [ ] Verify check-in flow (QR and manual)
- [ ] Test guest registration
- [ ] Verify approval workflow
- [ ] Test recurring events
- [ ] Check analytics tracking
- [ ] Verify RLS policies (can't see other users' data)
- [ ] Test refund flow

---

## Next Steps

1. **Run Migration:**
   ```bash
   supabase db push
   ```

2. **Create Edge Functions:**
   - `process-event-reminders` - Cron job to send scheduled reminders
   - `process-waitlist-offers` - Expire unclaimed offers
   - `generate-event-analytics` - Aggregate daily stats

3. **Update Frontend:**
   - Event creation wizard
   - Ticket purchase flow
   - Check-in app (mobile-friendly)
   - Analytics dashboard
   - Email templates

4. **Configure Storage:**
   - `event-covers` bucket for event images
   - `custom-field-uploads` bucket for file uploads
   - Set appropriate RLS policies

5. **Set Up Webhooks:**
   - Stripe webhook for payment events
   - Luma webhook for external event sync (if applicable)

6. **Add Monitoring:**
   - Track failed payment attempts
   - Monitor reminder delivery rates
   - Alert on high waitlist growth

---

## API Examples

### Query Events
```typescript
// Public upcoming events
const { data } = await supabase
  .from('upcoming_events')
  .select('*')
  .eq('location_type', 'online')
  .limit(10);

// My events (as organizer)
const { data } = await supabase
  .from('event_summary')
  .select('*')
  .eq('user_id', userId)
  .order('event_date', { ascending: false });
```

### Query Registrations
```typescript
// My registrations (as attendee)
const { data } = await supabase
  .from('registration_details')
  .select('*')
  .eq('email', userEmail)
  .order('event_date');

// Event attendees (as organizer)
const { data } = await supabase
  .from('registration_details')
  .select('*')
  .eq('event_id', eventId)
  .order('registered_at', { ascending: false });
```

### Track Page View
```typescript
// On event page load
await supabase.rpc('track_event_view', {
  p_event_id: eventId,
  p_source: router.query.utm_source || 'direct',
  p_device: isMobile ? 'mobile' : 'desktop'
});
```

---

## Database Schema Diagram

```
events (workshops)
├── ticket_types
│   └── registrations
│       └── check_ins
├── discount_codes
├── custom_fields
├── ticket_orders
│   └── registrations
├── waitlist
├── event_reminders
├── event_analytics
└── event_shares
```

---

## Support

For questions or issues:
1. Check RLS policies if queries return empty
2. Verify foreign key relationships
3. Check trigger logs in `luma_sync_log` (if using Luma integration)
4. Review generated confirmation codes and order numbers

---

**Migration Status:** Ready for deployment
**Breaking Changes:** None (backward compatible views provided)
**Estimated Migration Time:** < 30 seconds
