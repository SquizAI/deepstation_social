-- Migration: Event Platform - Full Luma-like Event Management
-- Description: Extends workshops table to become a full-featured event platform
-- Created: 2025-10-04
-- Dependencies: 007_luma_workshops.sql

BEGIN;

-- ============================================================================
-- PART 1: Extend Events Table (formerly workshops)
-- ============================================================================

-- Rename workshops to events (keeping backward compatibility via view)
ALTER TABLE public.workshops RENAME TO events;

-- Rename indexes
ALTER INDEX idx_workshops_user_id RENAME TO idx_events_user_id;
ALTER INDEX idx_workshops_event_date RENAME TO idx_events_event_date;
ALTER INDEX idx_workshops_luma_event_id RENAME TO idx_events_luma_event_id;
ALTER INDEX idx_workshops_status RENAME TO idx_events_status;
ALTER INDEX idx_workshops_visibility RENAME TO idx_events_visibility;

-- Rename trigger function
ALTER FUNCTION update_workshops_updated_at() RENAME TO update_events_updated_at;

-- Drop old trigger and recreate with new name
DROP TRIGGER IF EXISTS workshops_updated_at ON public.events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Add new columns to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS recurring_rule TEXT, -- iCal RRULE format for recurring events
  ADD COLUMN IF NOT EXISTS parent_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE, -- For recurring event instances
  ADD COLUMN IF NOT EXISTS allows_guests BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_guests_per_registration INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approval_message TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_message TEXT,
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE, -- URL-friendly identifier
  ADD COLUMN IF NOT EXISTS custom_branding JSONB DEFAULT '{}'::jsonb, -- Colors, logos, etc.
  ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'workshop' CHECK (event_type IN ('workshop', 'conference', 'meetup', 'webinar', 'course', 'networking', 'other')),
  ADD COLUMN IF NOT EXISTS virtual_link TEXT, -- Zoom, Google Meet, etc.
  ADD COLUMN IF NOT EXISTS virtual_platform TEXT, -- 'zoom', 'google_meet', 'teams', etc.
  ADD COLUMN IF NOT EXISTS recording_url TEXT, -- Post-event recording
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- Create index for slug and recurring events
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_parent_event_id ON public.events(parent_event_id);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_events_featured ON public.events(featured) WHERE featured = true;

-- Backward compatibility view
CREATE OR REPLACE VIEW public.workshops AS
SELECT * FROM public.events;

-- ============================================================================
-- PART 2: Ticket Types Table
-- ============================================================================

CREATE TABLE public.ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Ticket Details
  name TEXT NOT NULL, -- e.g., "General Admission", "VIP", "Early Bird"
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
  is_hidden BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_sale_period CHECK (sale_ends_at IS NULL OR sale_starts_at IS NULL OR sale_ends_at > sale_starts_at),
  CONSTRAINT valid_quantity CHECK (quantity_total IS NULL OR quantity_total >= 0),
  CONSTRAINT valid_price CHECK (price >= 0)
);

CREATE INDEX idx_ticket_types_event_id ON public.ticket_types(event_id);
CREATE INDEX idx_ticket_types_is_active ON public.ticket_types(is_active);
CREATE INDEX idx_ticket_types_display_order ON public.ticket_types(display_order);

-- Updated at trigger
CREATE TRIGGER ticket_types_updated_at
  BEFORE UPDATE ON public.ticket_types
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- ============================================================================
-- PART 3: Discount Codes Table
-- ============================================================================

CREATE TABLE public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Code Details
  code TEXT NOT NULL,
  description TEXT,

  -- Discount Type
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_discount_amount DECIMAL(10,2), -- Cap for percentage discounts

  -- Usage Limits
  max_uses INTEGER, -- NULL for unlimited
  current_uses INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,

  -- Validity Period
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,

  -- Applicable Tickets
  applicable_ticket_types UUID[], -- NULL means all tickets

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(event_id, code)
);

CREATE INDEX idx_discount_codes_event_id ON public.discount_codes(event_id);
CREATE INDEX idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX idx_discount_codes_is_active ON public.discount_codes(is_active);

-- ============================================================================
-- PART 4: Custom Registration Fields
-- ============================================================================

CREATE TABLE public.custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Field Configuration
  field_name TEXT NOT NULL, -- Internal identifier
  field_label TEXT NOT NULL, -- Display label
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'email', 'phone', 'number', 'select', 'multi_select', 'checkbox', 'radio', 'date', 'url', 'file')),

  -- Options
  field_options JSONB DEFAULT '[]'::jsonb, -- For select/radio/checkbox types
  placeholder TEXT,
  help_text TEXT,

  -- Validation
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB DEFAULT '{}'::jsonb, -- Min/max length, regex, etc.

  -- Display
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,

  -- Applicable Tickets
  applies_to_ticket_types UUID[], -- NULL means all tickets

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_custom_fields_event_id ON public.custom_fields(event_id);
CREATE INDEX idx_custom_fields_display_order ON public.custom_fields(display_order);

-- ============================================================================
-- PART 5: Registrations Table (Enhanced)
-- ============================================================================

-- Rename workshop_attendees to registrations
ALTER TABLE public.workshop_attendees RENAME TO registrations;

-- Rename indexes
ALTER INDEX idx_workshop_attendees_workshop_id RENAME TO idx_registrations_event_id;
ALTER INDEX idx_workshop_attendees_email RENAME TO idx_registrations_email;

-- Rename column
ALTER TABLE public.registrations RENAME COLUMN workshop_id TO event_id;

-- Add new columns
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Linked user account
  ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES public.ticket_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_id UUID, -- Link to ticket order
  ADD COLUMN IF NOT EXISTS confirmation_code TEXT UNIQUE, -- 8-char code for check-in
  ADD COLUMN IF NOT EXISTS qr_code_data TEXT, -- QR code content
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT,
  ADD COLUMN IF NOT EXISTS accessibility_needs TEXT,
  ADD COLUMN IF NOT EXISTS custom_responses JSONB DEFAULT '{}'::jsonb, -- Answers to custom fields
  ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guest_names TEXT[], -- Names of additional guests
  ADD COLUMN IF NOT EXISTS referred_by TEXT, -- Referral source
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS follow_up_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS notes TEXT; -- Admin notes

-- Update registration_status check constraint
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_registration_status_check;
ALTER TABLE public.registrations ADD CONSTRAINT registrations_registration_status_check
  CHECK (registration_status IN ('registered', 'waitlisted', 'attended', 'no-show', 'cancelled'));

-- Create indexes
CREATE INDEX idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX idx_registrations_ticket_type_id ON public.registrations(ticket_type_id);
CREATE INDEX idx_registrations_order_id ON public.registrations(order_id);
CREATE INDEX idx_registrations_confirmation_code ON public.registrations(confirmation_code);
CREATE INDEX idx_registrations_status ON public.registrations(registration_status);
CREATE INDEX idx_registrations_approval_status ON public.registrations(approval_status);

-- Function to generate confirmation code
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No ambiguous characters
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate confirmation code
CREATE OR REPLACE FUNCTION set_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL THEN
    NEW.confirmation_code := generate_confirmation_code();
    NEW.qr_code_data := 'EVENT:' || NEW.event_id || ':REG:' || NEW.confirmation_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER registrations_set_confirmation_code
  BEFORE INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_confirmation_code();

-- Backward compatibility view
CREATE OR REPLACE VIEW public.workshop_attendees AS
SELECT
  id,
  event_id as workshop_id,
  email,
  full_name,
  company,
  title,
  registration_status,
  registered_at,
  checked_in_at,
  luma_guest_id,
  created_at,
  updated_at
FROM public.registrations;

-- ============================================================================
-- PART 6: Ticket Orders Table
-- ============================================================================

CREATE TABLE public.ticket_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Order Details
  order_number TEXT UNIQUE NOT NULL, -- e.g., "EVT-20240104-ABC123"
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,

  -- Items (stored for history, even if ticket types change)
  items JSONB NOT NULL, -- Array of {ticket_type_id, quantity, price}

  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  discount_code_id UUID REFERENCES public.discount_codes(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded')),
  payment_method TEXT, -- 'stripe', 'paypal', 'free', etc.
  payment_intent_id TEXT, -- Stripe payment intent
  payment_completed_at TIMESTAMP WITH TIME ZONE,

  -- Refund
  refund_amount DECIMAL(10,2) DEFAULT 0.00,
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_reason TEXT,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ticket_orders_event_id ON public.ticket_orders(event_id);
CREATE INDEX idx_ticket_orders_user_id ON public.ticket_orders(user_id);
CREATE INDEX idx_ticket_orders_email ON public.ticket_orders(email);
CREATE INDEX idx_ticket_orders_order_number ON public.ticket_orders(order_number);
CREATE INDEX idx_ticket_orders_payment_status ON public.ticket_orders(payment_status);
CREATE INDEX idx_ticket_orders_created_at ON public.ticket_orders(created_at DESC);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'EVT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 6));
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_orders_set_order_number
  BEFORE INSERT ON public.ticket_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Link registrations to orders
ALTER TABLE public.registrations
  ADD CONSTRAINT fk_registrations_order
  FOREIGN KEY (order_id) REFERENCES public.ticket_orders(id) ON DELETE SET NULL;

-- ============================================================================
-- PART 7: Waitlist Table
-- ============================================================================

CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES public.ticket_types(id) ON DELETE CASCADE, -- NULL for general waitlist

  -- Contact Info
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,

  -- Waitlist Details
  position INTEGER, -- Position in queue
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  response_deadline TIMESTAMP WITH TIME ZONE, -- Deadline to claim spot

  -- Status
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'offered', 'accepted', 'expired', 'cancelled')),
  offered_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,

  -- Conversion
  converted_to_registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(event_id, ticket_type_id, email)
);

CREATE INDEX idx_waitlist_event_id ON public.waitlist(event_id);
CREATE INDEX idx_waitlist_ticket_type_id ON public.waitlist(ticket_type_id);
CREATE INDEX idx_waitlist_email ON public.waitlist(email);
CREATE INDEX idx_waitlist_status ON public.waitlist(status);
CREATE INDEX idx_waitlist_position ON public.waitlist(position);

-- ============================================================================
-- PART 8: Check-ins Table
-- ============================================================================

CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,

  -- Check-in Details
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Staff member who checked in
  check_in_method TEXT CHECK (check_in_method IN ('qr_code', 'manual', 'email_lookup', 'name_lookup', 'self_checkin')),

  -- Location
  check_in_location TEXT, -- e.g., "Main Entrance", "VIP Door"

  -- Guests
  guests_checked_in INTEGER DEFAULT 0,

  -- Metadata
  notes TEXT,
  device_info JSONB, -- Device used for check-in

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_check_ins_event_id ON public.check_ins(event_id);
CREATE INDEX idx_check_ins_registration_id ON public.check_ins(registration_id);
CREATE INDEX idx_check_ins_checked_in_at ON public.check_ins(checked_in_at);

-- Update registrations.checked_in_at when check-in is created
CREATE OR REPLACE FUNCTION sync_registration_checkin()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.registrations
  SET
    checked_in_at = NEW.checked_in_at,
    registration_status = 'attended'
  WHERE id = NEW.registration_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_ins_sync_registration
  AFTER INSERT ON public.check_ins
  FOR EACH ROW
  EXECUTE FUNCTION sync_registration_checkin();

-- ============================================================================
-- PART 9: Event Reminders Table
-- ============================================================================

CREATE TABLE public.event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Reminder Configuration
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('registration_confirmation', 'event_reminder_1day', 'event_reminder_1hour', 'event_starting', 'follow_up', 'custom')),
  send_at_offset INTEGER, -- Minutes before event (negative for after event)
  custom_send_at TIMESTAMP WITH TIME ZONE, -- For one-off reminders

  -- Content
  subject TEXT NOT NULL,
  message_template TEXT NOT NULL, -- Supports variable substitution

  -- Delivery
  delivery_method TEXT DEFAULT 'email' CHECK (delivery_method IN ('email', 'sms', 'both')),

  -- Targeting
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'registered', 'waitlisted', 'attended', 'no_show', 'ticket_type')),
  target_ticket_types UUID[], -- For ticket_type targeting

  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_reminders_event_id ON public.event_reminders(event_id);
CREATE INDEX idx_event_reminders_status ON public.event_reminders(status);
CREATE INDEX idx_event_reminders_reminder_type ON public.event_reminders(reminder_type);
CREATE INDEX idx_event_reminders_custom_send_at ON public.event_reminders(custom_send_at);

-- ============================================================================
-- PART 10: Event Analytics Table
-- ============================================================================

CREATE TABLE public.event_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Time Period
  date DATE NOT NULL,
  hour INTEGER, -- NULL for daily aggregates, 0-23 for hourly

  -- Metrics
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  registrations_count INTEGER DEFAULT 0,
  waitlist_joins INTEGER DEFAULT 0,
  tickets_sold INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.00,

  -- Traffic Sources
  source_direct INTEGER DEFAULT 0,
  source_social INTEGER DEFAULT 0,
  source_email INTEGER DEFAULT 0,
  source_search INTEGER DEFAULT 0,
  source_referral INTEGER DEFAULT 0,
  source_other INTEGER DEFAULT 0,

  -- Device Types
  device_desktop INTEGER DEFAULT 0,
  device_mobile INTEGER DEFAULT 0,
  device_tablet INTEGER DEFAULT 0,

  -- Engagement
  avg_time_on_page INTEGER, -- Seconds
  bounce_rate DECIMAL(5,2), -- Percentage

  -- Conversion
  conversion_rate DECIMAL(5,2), -- Percentage of visitors who registered

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(event_id, date, hour)
);

CREATE INDEX idx_event_analytics_event_id ON public.event_analytics(event_id);
CREATE INDEX idx_event_analytics_date ON public.event_analytics(date DESC);

-- ============================================================================
-- PART 11: Event Shares Table (Track Social Sharing)
-- ============================================================================

CREATE TABLE public.event_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Share Details
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'email', 'whatsapp', 'copy_link', 'other')),
  shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shared_by_email TEXT,

  -- Tracking
  referral_code TEXT, -- For attribution
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0, -- Registrations from this share

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_shares_event_id ON public.event_shares(event_id);
CREATE INDEX idx_event_shares_platform ON public.event_shares(platform);
CREATE INDEX idx_event_shares_referral_code ON public.event_shares(referral_code);

-- ============================================================================
-- PART 12: Row Level Security Policies
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_shares ENABLE ROW LEVEL SECURITY;

-- Ticket Types Policies
CREATE POLICY "Anyone can view ticket types for published events"
  ON public.ticket_types FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE status = 'published' AND visibility IN ('public', 'unlisted')
    )
    OR
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Event owners can manage ticket types"
  ON public.ticket_types FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Discount Codes Policies
CREATE POLICY "Event owners can view discount codes"
  ON public.discount_codes FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Event owners can manage discount codes"
  ON public.discount_codes FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Custom Fields Policies
CREATE POLICY "Anyone can view custom fields for published events"
  ON public.custom_fields FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE status = 'published' AND visibility IN ('public', 'unlisted')
    )
    OR
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Event owners can manage custom fields"
  ON public.custom_fields FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Registrations Policies (update existing)
DROP POLICY IF EXISTS "Users can view attendees of their workshops" ON public.registrations;
DROP POLICY IF EXISTS "Users can manage attendees of their workshops" ON public.registrations;

CREATE POLICY "Event owners can view all registrations"
  ON public.registrations FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own registrations"
  ON public.registrations FOR SELECT
  USING (
    user_id = auth.uid() OR email = auth.jwt()->>'email'
  );

CREATE POLICY "Anyone can create registrations for published events"
  ON public.registrations FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events
      WHERE status = 'published' AND visibility IN ('public', 'unlisted')
    )
  );

CREATE POLICY "Event owners can manage registrations"
  ON public.registrations FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can cancel their own registrations"
  ON public.registrations FOR UPDATE
  USING (user_id = auth.uid() OR email = auth.jwt()->>'email');

-- Ticket Orders Policies
CREATE POLICY "Event owners can view orders"
  ON public.ticket_orders FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own orders"
  ON public.ticket_orders FOR SELECT
  USING (user_id = auth.uid() OR email = auth.jwt()->>'email');

CREATE POLICY "Anyone can create orders for published events"
  ON public.ticket_orders FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events
      WHERE status = 'published' AND visibility IN ('public', 'unlisted')
    )
  );

CREATE POLICY "Event owners can update orders"
  ON public.ticket_orders FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Waitlist Policies
CREATE POLICY "Event owners can view waitlist"
  ON public.waitlist FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their waitlist entries"
  ON public.waitlist FOR SELECT
  USING (email = auth.jwt()->>'email');

CREATE POLICY "Anyone can join waitlist for published events"
  ON public.waitlist FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events
      WHERE status = 'published' AND visibility IN ('public', 'unlisted')
    )
  );

CREATE POLICY "Event owners can manage waitlist"
  ON public.waitlist FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Check-ins Policies
CREATE POLICY "Event owners and staff can view check-ins"
  ON public.check_ins FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Event owners and staff can create check-ins"
  ON public.check_ins FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Event Reminders Policies
CREATE POLICY "Event owners can manage reminders"
  ON public.event_reminders FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Event Analytics Policies
CREATE POLICY "Event owners can view analytics"
  ON public.event_analytics FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Event Shares Policies
CREATE POLICY "Anyone can create shares for published events"
  ON public.event_shares FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events
      WHERE status = 'published' AND visibility IN ('public', 'unlisted')
    )
  );

CREATE POLICY "Event owners can view shares"
  ON public.event_shares FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 13: Helpful Views
-- ============================================================================

-- Event Summary View
CREATE OR REPLACE VIEW public.event_summary AS
SELECT
  e.id,
  e.user_id,
  e.title,
  e.slug,
  e.event_date,
  e.start_time,
  e.end_time,
  e.timezone,
  e.location_type,
  e.status,
  e.visibility,
  e.event_type,
  e.featured,
  e.cover_image_url,

  -- Registration Stats
  COUNT(DISTINCT r.id) FILTER (WHERE r.registration_status = 'registered') as registered_count,
  COUNT(DISTINCT r.id) FILTER (WHERE r.registration_status = 'attended') as attended_count,
  COUNT(DISTINCT r.id) FILTER (WHERE r.registration_status = 'waitlisted') as waitlisted_count,
  COUNT(DISTINCT r.id) FILTER (WHERE r.registration_status = 'cancelled') as cancelled_count,

  -- Capacity
  e.max_capacity,
  CASE
    WHEN e.max_capacity IS NOT NULL THEN
      ((COUNT(DISTINCT r.id) FILTER (WHERE r.registration_status = 'registered')::float / e.max_capacity::float) * 100)::integer
    ELSE NULL
  END as capacity_percentage,

  -- Ticket Sales
  SUM(tt.quantity_sold) as total_tickets_sold,
  SUM(tt.quantity_total) as total_tickets_available,

  -- Revenue
  COALESCE(SUM(o.total_amount) FILTER (WHERE o.payment_status = 'completed'), 0) as total_revenue,
  COUNT(DISTINCT o.id) FILTER (WHERE o.payment_status = 'completed') as completed_orders,

  -- Engagement
  e.view_count,
  e.share_count,
  COUNT(DISTINCT es.id) as total_shares,

  -- Timestamps
  e.created_at,
  e.updated_at

FROM public.events e
LEFT JOIN public.registrations r ON e.id = r.event_id
LEFT JOIN public.ticket_types tt ON e.id = tt.event_id
LEFT JOIN public.ticket_orders o ON e.id = o.event_id
LEFT JOIN public.event_shares es ON e.id = es.event_id
GROUP BY e.id;

-- Ticket Availability View
CREATE OR REPLACE VIEW public.ticket_availability AS
SELECT
  tt.id as ticket_type_id,
  tt.event_id,
  e.title as event_title,
  e.event_date,
  tt.name as ticket_name,
  tt.price,
  tt.currency,
  tt.quantity_total,
  tt.quantity_sold,
  tt.quantity_available,
  tt.is_active,
  tt.sale_starts_at,
  tt.sale_ends_at,

  -- Availability Status
  CASE
    WHEN tt.is_active = false THEN 'inactive'
    WHEN tt.sale_starts_at IS NOT NULL AND NOW() < tt.sale_starts_at THEN 'not_yet_on_sale'
    WHEN tt.sale_ends_at IS NOT NULL AND NOW() > tt.sale_ends_at THEN 'sale_ended'
    WHEN tt.quantity_available IS NOT NULL AND tt.quantity_available <= 0 THEN 'sold_out'
    ELSE 'available'
  END as availability_status,

  -- Time until sale
  CASE
    WHEN tt.sale_starts_at IS NOT NULL AND NOW() < tt.sale_starts_at THEN
      EXTRACT(EPOCH FROM (tt.sale_starts_at - NOW()))::integer
    ELSE NULL
  END as seconds_until_sale_start

FROM public.ticket_types tt
JOIN public.events e ON tt.event_id = e.id
WHERE e.status = 'published';

-- Registration Details View (for event owners)
CREATE OR REPLACE VIEW public.registration_details AS
SELECT
  r.id,
  r.event_id,
  e.title as event_title,
  r.email,
  r.full_name,
  r.company,
  r.phone,
  r.registration_status,
  r.approval_status,
  r.ticket_type_id,
  tt.name as ticket_type_name,
  tt.price as ticket_price,
  r.order_id,
  o.order_number,
  o.payment_status,
  o.total_amount as order_total,
  r.confirmation_code,
  r.guest_count,
  r.custom_responses,
  r.registered_at,
  r.checked_in_at,
  ci.checked_in_by,
  ci.check_in_method,
  r.created_at

FROM public.registrations r
JOIN public.events e ON r.event_id = e.id
LEFT JOIN public.ticket_types tt ON r.ticket_type_id = tt.id
LEFT JOIN public.ticket_orders o ON r.order_id = o.id
LEFT JOIN public.check_ins ci ON r.id = ci.registration_id;

-- Upcoming Events View (updated from workshops)
DROP VIEW IF EXISTS public.upcoming_workshops;
CREATE OR REPLACE VIEW public.upcoming_events AS
SELECT
  e.*,
  COUNT(DISTINCT r.id) FILTER (WHERE r.registration_status = 'registered') as registered_count,
  COUNT(DISTINCT tt.id) as ticket_types_count,
  MIN(tt.price) FILTER (WHERE tt.is_active = true) as starting_price,
  CASE
    WHEN e.max_capacity IS NOT NULL THEN
      ((COUNT(DISTINCT r.id) FILTER (WHERE r.registration_status = 'registered')::float / e.max_capacity::float) * 100)::integer
    ELSE NULL
  END as capacity_percentage,

  -- Check if sold out
  CASE
    WHEN e.max_capacity IS NOT NULL AND
         COUNT(DISTINCT r.id) FILTER (WHERE r.registration_status = 'registered') >= e.max_capacity
    THEN true
    ELSE false
  END as is_sold_out

FROM public.events e
LEFT JOIN public.registrations r ON e.id = r.event_id
LEFT JOIN public.ticket_types tt ON e.id = tt.event_id
WHERE e.status = 'published'
  AND e.event_date >= CURRENT_DATE
GROUP BY e.id
ORDER BY e.event_date ASC, e.start_time ASC;

-- ============================================================================
-- PART 14: Helper Functions
-- ============================================================================

-- Function to check if discount code is valid
CREATE OR REPLACE FUNCTION is_discount_code_valid(
  p_code TEXT,
  p_event_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_discount_code public.discount_codes;
  v_user_usage_count INTEGER;
BEGIN
  -- Get discount code
  SELECT * INTO v_discount_code
  FROM public.discount_codes
  WHERE code = p_code
    AND event_id = p_event_id
    AND is_active = true;

  -- Code doesn't exist or not active
  IF v_discount_code IS NULL THEN
    RETURN false;
  END IF;

  -- Check validity period
  IF v_discount_code.valid_from IS NOT NULL AND NOW() < v_discount_code.valid_from THEN
    RETURN false;
  END IF;

  IF v_discount_code.valid_until IS NOT NULL AND NOW() > v_discount_code.valid_until THEN
    RETURN false;
  END IF;

  -- Check max uses
  IF v_discount_code.max_uses IS NOT NULL AND
     v_discount_code.current_uses >= v_discount_code.max_uses THEN
    RETURN false;
  END IF;

  -- Check per-user limit
  IF p_user_id IS NOT NULL AND v_discount_code.max_uses_per_user IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage_count
    FROM public.ticket_orders
    WHERE event_id = p_event_id
      AND user_id = p_user_id
      AND discount_code_id = v_discount_code.id
      AND payment_status = 'completed';

    IF v_user_usage_count >= v_discount_code.max_uses_per_user THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate discount amount
CREATE OR REPLACE FUNCTION calculate_discount_amount(
  p_discount_code_id UUID,
  p_subtotal DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_discount public.discount_codes;
  v_discount_amount DECIMAL;
BEGIN
  SELECT * INTO v_discount
  FROM public.discount_codes
  WHERE id = p_discount_code_id;

  IF v_discount IS NULL THEN
    RETURN 0;
  END IF;

  IF v_discount.discount_type = 'percentage' THEN
    v_discount_amount := (p_subtotal * v_discount.discount_value / 100);

    -- Apply max discount cap if set
    IF v_discount.max_discount_amount IS NOT NULL THEN
      v_discount_amount := LEAST(v_discount_amount, v_discount.max_discount_amount);
    END IF;
  ELSE
    -- Fixed amount
    v_discount_amount := LEAST(v_discount.discount_value, p_subtotal);
  END IF;

  RETURN ROUND(v_discount_amount, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment ticket sales
CREATE OR REPLACE FUNCTION increment_ticket_sales()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND
     (OLD IS NULL OR OLD.payment_status != 'completed') THEN

    -- Increment ticket sales for each item in the order
    UPDATE public.ticket_types
    SET quantity_sold = quantity_sold + (item->>'quantity')::integer
    FROM jsonb_array_elements(NEW.items) as item
    WHERE id = (item->>'ticket_type_id')::uuid;

    -- Increment discount code usage
    IF NEW.discount_code_id IS NOT NULL THEN
      UPDATE public.discount_codes
      SET current_uses = current_uses + 1
      WHERE id = NEW.discount_code_id;
    END IF;

    -- Update event attendee count
    UPDATE public.events
    SET current_attendees = (
      SELECT COUNT(*)
      FROM public.registrations
      WHERE event_id = NEW.event_id
        AND registration_status = 'registered'
    )
    WHERE id = NEW.event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_orders_increment_sales
  AFTER INSERT OR UPDATE ON public.ticket_orders
  FOR EACH ROW
  EXECUTE FUNCTION increment_ticket_sales();

-- Function to auto-process waitlist when capacity opens
CREATE OR REPLACE FUNCTION process_waitlist_on_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  v_event public.events;
  v_waitlist_entry public.waitlist;
BEGIN
  -- Only process if registration was cancelled
  IF NEW.registration_status = 'cancelled' AND
     OLD.registration_status != 'cancelled' THEN

    -- Get event details
    SELECT * INTO v_event
    FROM public.events
    WHERE id = NEW.event_id;

    -- Check if event has capacity and waitlist enabled
    IF v_event.waitlist_enabled AND v_event.max_capacity IS NOT NULL THEN

      -- Get next person in waitlist
      SELECT * INTO v_waitlist_entry
      FROM public.waitlist
      WHERE event_id = NEW.event_id
        AND status = 'waiting'
      ORDER BY position ASC, created_at ASC
      LIMIT 1;

      IF v_waitlist_entry IS NOT NULL THEN
        -- Update waitlist entry to offered
        UPDATE public.waitlist
        SET
          status = 'offered',
          offered_at = NOW(),
          response_deadline = NOW() + INTERVAL '24 hours'
        WHERE id = v_waitlist_entry.id;

        -- TODO: Trigger notification email
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER registrations_process_waitlist
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION process_waitlist_on_cancellation();

-- Function to auto-assign waitlist positions
CREATE OR REPLACE FUNCTION assign_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.position IS NULL THEN
    SELECT COALESCE(MAX(position), 0) + 1
    INTO NEW.position
    FROM public.waitlist
    WHERE event_id = NEW.event_id
      AND (ticket_type_id = NEW.ticket_type_id OR
           (ticket_type_id IS NULL AND NEW.ticket_type_id IS NULL));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER waitlist_assign_position
  BEFORE INSERT ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION assign_waitlist_position();

-- Function to track event views
CREATE OR REPLACE FUNCTION track_event_view(
  p_event_id UUID,
  p_source TEXT DEFAULT 'direct',
  p_device TEXT DEFAULT 'desktop'
)
RETURNS void AS $$
BEGIN
  -- Increment event view count
  UPDATE public.events
  SET view_count = view_count + 1
  WHERE id = p_event_id;

  -- Update daily analytics
  INSERT INTO public.event_analytics (event_id, date, page_views, unique_visitors)
  VALUES (p_event_id, CURRENT_DATE, 1, 1)
  ON CONFLICT (event_id, date, hour) DO UPDATE
  SET
    page_views = public.event_analytics.page_views + 1,
    unique_visitors = public.event_analytics.unique_visitors + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 15: Comments and Documentation
-- ============================================================================

COMMENT ON TABLE public.events IS 'Core events table (formerly workshops) - stores all event information';
COMMENT ON TABLE public.ticket_types IS 'Different ticket types/tiers for events (GA, VIP, Early Bird, etc.)';
COMMENT ON TABLE public.discount_codes IS 'Promotional discount codes for ticket purchases';
COMMENT ON TABLE public.custom_fields IS 'Custom registration form fields per event';
COMMENT ON TABLE public.registrations IS 'Event registrations and attendee information';
COMMENT ON TABLE public.ticket_orders IS 'Ticket purchase orders with payment information';
COMMENT ON TABLE public.waitlist IS 'Waitlist entries when events are sold out';
COMMENT ON TABLE public.check_ins IS 'Check-in records for event attendees';
COMMENT ON TABLE public.event_reminders IS 'Automated email/SMS reminders for events';
COMMENT ON TABLE public.event_analytics IS 'Event page views and conversion analytics';
COMMENT ON TABLE public.event_shares IS 'Social sharing tracking for attribution';

COMMENT ON VIEW public.event_summary IS 'Aggregate statistics and metrics for each event';
COMMENT ON VIEW public.ticket_availability IS 'Real-time ticket availability and sales status';
COMMENT ON VIEW public.registration_details IS 'Complete registration information for event owners';
COMMENT ON VIEW public.upcoming_events IS 'All published future events with key metrics';

COMMIT;
