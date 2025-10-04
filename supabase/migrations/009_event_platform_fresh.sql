-- Migration: Event Platform - Full Event Management System
-- Description: Creates a complete event management platform from scratch
-- Created: 2025-10-04

BEGIN;

-- ============================================================================
-- PART 1: Events Table (Main)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,

  -- Date & Time
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',

  -- Location
  location_type TEXT CHECK (location_type IN ('online', 'in-person', 'hybrid')),
  venue_name TEXT,
  venue_address TEXT,
  meeting_url TEXT,
  virtual_platform TEXT, -- 'zoom', 'google_meet', 'teams', etc.

  -- Capacity & Approval
  capacity INTEGER,
  requires_approval BOOLEAN DEFAULT false,
  approval_message TEXT,
  allows_guests BOOLEAN DEFAULT true,
  max_guests_per_registration INTEGER DEFAULT 5,

  -- Branding & Media
  cover_image_url TEXT,
  og_image_url TEXT,
  custom_branding JSONB DEFAULT '{}'::jsonb,

  -- Recurring Events
  is_recurring BOOLEAN DEFAULT false,
  recurring_rule TEXT, -- iCal RRULE format
  parent_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,

  -- Event Type & Status
  event_type TEXT DEFAULT 'workshop' CHECK (event_type IN ('workshop', 'conference', 'meetup', 'webinar', 'course', 'networking', 'other')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),

  -- Engagement
  featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  tags TEXT[],

  -- Post-Event
  recording_url TEXT,
  confirmation_message TEXT,
  reminder_sent BOOLEAN DEFAULT false,

  -- Luma Integration (legacy)
  luma_event_id TEXT UNIQUE,
  luma_event_url TEXT,
  luma_api_event_id TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_luma_event_id ON public.events(luma_event_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events(visibility);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON public.events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(featured) WHERE featured = true;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Backward compatibility view (for workshops)
CREATE OR REPLACE VIEW public.workshops AS
SELECT * FROM public.events;

-- ============================================================================
-- PART 2: Ticket Types Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Ticket Details
  name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  is_free BOOLEAN GENERATED ALWAYS AS (price = 0) STORED,

  -- Availability
  quantity_total INTEGER, -- NULL for unlimited
  quantity_sold INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN quantity_total IS NULL THEN NULL
      ELSE GREATEST(0, quantity_total - quantity_sold)
    END
  ) STORED,

  -- Sale Period
  sale_starts_at TIMESTAMP WITH TIME ZONE,
  sale_ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,

  -- Options
  min_per_order INTEGER DEFAULT 1,
  max_per_order INTEGER DEFAULT 10,
  requires_approval BOOLEAN DEFAULT false,

  -- Display
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON public.ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_is_active ON public.ticket_types(is_active) WHERE is_active = true;

-- ============================================================================
-- PART 3: Event Registrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ticket_type_id UUID REFERENCES public.ticket_types(id) ON DELETE SET NULL,

  -- Contact Info
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,

  -- Registration Details
  num_guests INTEGER DEFAULT 0,
  guest_names TEXT[],
  answers JSONB DEFAULT '{}'::jsonb, -- Answers to custom questions

  -- Status
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waitlisted')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_intent_id TEXT,

  -- Check-in
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by UUID REFERENCES auth.users(id),

  -- Communication
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON public.event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(status);

-- Backward compatibility view
CREATE OR REPLACE VIEW public.workshop_attendees AS
SELECT * FROM public.event_registrations;

-- ============================================================================
-- PART 4: Custom Fields (Registration Questions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'select', 'multiselect', 'checkbox', 'radio', 'email', 'phone', 'number', 'date', 'file')),
  options TEXT[], -- For select, multiselect, radio
  is_required BOOLEAN DEFAULT false,
  placeholder TEXT,
  help_text TEXT,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_event_id ON public.custom_fields(event_id);

-- ============================================================================
-- PART 5: Discount Codes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  code TEXT NOT NULL,
  type TEXT CHECK (type IN ('percentage', 'fixed_amount')),
  value DECIMAL(10,2) NOT NULL,

  -- Limits
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,

  -- Ticket Restrictions
  applies_to_ticket_types UUID[], -- NULL means all tickets

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(event_id, code)
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_event_id ON public.discount_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.discount_codes(code);

-- Auto-uppercase discount codes
CREATE OR REPLACE FUNCTION uppercase_discount_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code = UPPER(NEW.code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER uppercase_discount_code_trigger
  BEFORE INSERT OR UPDATE ON public.discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION uppercase_discount_code();

-- ============================================================================
-- PART 6: Ticket Orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ticket_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,

  order_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Payment
  stripe_payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),

  -- Order Items (JSON array of {ticket_type_id, quantity, price})
  items JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_orders_event_id ON public.ticket_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_orders_registration_id ON public.ticket_orders(registration_id);
CREATE INDEX IF NOT EXISTS idx_ticket_orders_order_number ON public.ticket_orders(order_number);

-- Auto-generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.ticket_orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- ============================================================================
-- PART 7: Waitlist
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,

  -- Ticket preference
  preferred_ticket_type_id UUID REFERENCES public.ticket_types(id),

  -- Status
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'registered', 'expired')),
  notified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,

  position INTEGER, -- Position in waitlist

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(event_id, email)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_event_id ON public.waitlist(event_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON public.waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_position ON public.waitlist(event_id, position);

-- Auto-assign waitlist position
CREATE OR REPLACE FUNCTION assign_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.position IS NULL THEN
    SELECT COALESCE(MAX(position), 0) + 1
    INTO NEW.position
    FROM waitlist
    WHERE event_id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assign_waitlist_position_trigger
  BEFORE INSERT ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION assign_waitlist_position();

-- ============================================================================
-- PART 8: Check-ins
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_in_by UUID REFERENCES auth.users(id),
  check_in_method TEXT CHECK (check_in_method IN ('manual', 'qr_code', 'nfc', 'kiosk')),

  notes TEXT,

  UNIQUE(registration_id) -- One check-in per registration
);

CREATE INDEX IF NOT EXISTS idx_check_ins_event_id ON public.check_ins(event_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_registration_id ON public.check_ins(registration_id);

-- ============================================================================
-- PART 9: Event Reminders (Scheduled)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  reminder_type TEXT CHECK (reminder_type IN ('confirmation', '24h_before', '1h_before', 'custom')),
  send_at TIMESTAMP WITH TIME ZONE NOT NULL,

  subject TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  -- Recipients (NULL means all registrants)
  recipient_ids UUID[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON public.event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_send_at ON public.event_reminders(send_at) WHERE status = 'pending';

-- ============================================================================
-- PART 10: Event Analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Metrics
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),

  -- Revenue
  total_revenue DECIMAL(10,2) DEFAULT 0,
  tickets_sold INTEGER DEFAULT 0,

  -- Traffic Sources
  referrer_data JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,

  UNIQUE(event_id, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_event_analytics_event_id ON public.event_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_event_analytics_recorded_at ON public.event_analytics(recorded_at);

-- ============================================================================
-- PART 11: Event Shares (Social Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  platform TEXT CHECK (platform IN ('twitter', 'facebook', 'linkedin', 'email', 'copy_link', 'whatsapp')),
  shared_by UUID REFERENCES auth.users(id),

  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_shares_event_id ON public.event_shares(event_id);
CREATE INDEX IF NOT EXISTS idx_event_shares_platform ON public.event_shares(platform);

-- Update share count on insert
CREATE OR REPLACE FUNCTION increment_share_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET share_count = share_count + 1
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_share_count_trigger
  AFTER INSERT ON public.event_shares
  FOR EACH ROW
  EXECUTE FUNCTION increment_share_count();

-- ============================================================================
-- PART 12: Useful Views
-- ============================================================================

-- Event Summary View
CREATE OR REPLACE VIEW public.event_summary AS
SELECT
  e.*,
  COUNT(DISTINCT er.id) as total_registrations,
  COUNT(DISTINCT CASE WHEN er.checked_in_at IS NOT NULL THEN er.id END) as checked_in_count,
  COALESCE(SUM(tt.price * tt.quantity_sold), 0) as total_revenue,
  COALESCE(SUM(tt.quantity_sold), 0) as total_tickets_sold
FROM events e
LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'confirmed'
LEFT JOIN ticket_types tt ON e.id = tt.event_id
GROUP BY e.id;

-- Ticket Availability View
CREATE OR REPLACE VIEW public.ticket_availability AS
SELECT
  tt.*,
  e.title as event_title,
  e.event_date,
  CASE
    WHEN tt.quantity_total IS NULL THEN true
    WHEN tt.quantity_available > 0 THEN true
    ELSE false
  END as is_available,
  CASE
    WHEN tt.sale_ends_at IS NOT NULL AND tt.sale_ends_at < NOW() THEN false
    WHEN tt.sale_starts_at IS NOT NULL AND tt.sale_starts_at > NOW() THEN false
    ELSE tt.is_active
  END as can_purchase
FROM ticket_types tt
JOIN events e ON tt.event_id = e.id;

-- Registration Details View
CREATE OR REPLACE VIEW public.registration_details AS
SELECT
  er.*,
  e.title as event_title,
  e.event_date,
  e.start_time,
  e.end_time,
  tt.name as ticket_name,
  tt.price as ticket_price,
  CASE WHEN ci.id IS NOT NULL THEN true ELSE false END as is_checked_in
FROM event_registrations er
JOIN events e ON er.event_id = e.id
LEFT JOIN ticket_types tt ON er.ticket_type_id = tt.id
LEFT JOIN check_ins ci ON er.id = ci.registration_id;

-- Upcoming Events View
CREATE OR REPLACE VIEW public.upcoming_events AS
SELECT * FROM events
WHERE event_date >= CURRENT_DATE
  AND status = 'published'
  AND visibility = 'public'
ORDER BY event_date ASC, start_time ASC;

-- ============================================================================
-- PART 13: Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_shares ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view published public events" ON public.events
  FOR SELECT USING (
    visibility = 'public' AND status = 'published'
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can create their own events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" ON public.events
  FOR DELETE USING (auth.uid() = user_id);

-- Ticket types policies
CREATE POLICY "Anyone can view active ticket types for published events" ON public.ticket_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND e.visibility = 'public'
      AND e.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Event owners can manage ticket types" ON public.ticket_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid()
    )
  );

-- Registrations policies
CREATE POLICY "Users can view their own registrations" ON public.event_registrations
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can register for events" ON public.event_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own registrations" ON public.event_registrations
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid()
    )
  );

-- Similar policies for other tables...
CREATE POLICY "Event owners manage custom fields" ON public.custom_fields
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid())
  );

CREATE POLICY "Event owners manage discount codes" ON public.discount_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid())
  );

CREATE POLICY "Event owners view orders" ON public.ticket_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Event owners manage waitlist" ON public.waitlist
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid())
  );

CREATE POLICY "Event owners manage check-ins" ON public.check_ins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid())
  );

CREATE POLICY "Event owners manage reminders" ON public.event_reminders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid())
  );

CREATE POLICY "Event owners view analytics" ON public.event_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can share events" ON public.event_shares
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Event owners view shares" ON public.event_shares
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid())
  );

COMMIT;
