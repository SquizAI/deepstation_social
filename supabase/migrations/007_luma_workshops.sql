-- Migration: Add Luma Workshops Integration
-- Description: Create tables for syncing and managing workshops from Luma
-- Created: 2025-10-04

-- Create workshops table
CREATE TABLE IF NOT EXISTS public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Luma Integration
  luma_event_id TEXT UNIQUE, -- Unique ID from Luma API
  luma_url TEXT, -- Direct link to Luma event page

  -- Event Details
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT, -- For calendar previews

  -- Date & Time
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',

  -- Location
  location_type TEXT CHECK (location_type IN ('online', 'in-person', 'hybrid')),
  location_name TEXT, -- Venue name
  location_address TEXT, -- Full address
  location_city TEXT,
  location_state TEXT,
  location_country TEXT,

  -- Event Management
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),

  -- Registration
  registration_url TEXT,
  registration_required BOOLEAN DEFAULT true,
  max_capacity INTEGER,
  current_attendees INTEGER DEFAULT 0,
  waitlist_enabled BOOLEAN DEFAULT false,

  -- Pricing
  ticket_price DECIMAL(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  is_free BOOLEAN DEFAULT true,

  -- Media
  cover_image_url TEXT,
  thumbnail_url TEXT,

  -- Organizers (JSON array)
  organizers JSONB DEFAULT '[]'::jsonb,

  -- Tags & Categories
  tags TEXT[] DEFAULT '{}',
  category TEXT,

  -- Sync metadata
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_workshops_user_id ON public.workshops(user_id);
CREATE INDEX idx_workshops_event_date ON public.workshops(event_date);
CREATE INDEX idx_workshops_luma_event_id ON public.workshops(luma_event_id);
CREATE INDEX idx_workshops_status ON public.workshops(status);
CREATE INDEX idx_workshops_visibility ON public.workshops(visibility);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_workshops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workshops_updated_at
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW
  EXECUTE FUNCTION update_workshops_updated_at();

-- Create workshop attendees table
CREATE TABLE IF NOT EXISTS public.workshop_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,

  -- Attendee Info
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  title TEXT,

  -- Registration
  registration_status TEXT DEFAULT 'registered' CHECK (registration_status IN ('registered', 'waitlisted', 'attended', 'no-show', 'cancelled')),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_in_at TIMESTAMP WITH TIME ZONE,

  -- Luma sync
  luma_guest_id TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(workshop_id, email)
);

CREATE INDEX idx_workshop_attendees_workshop_id ON public.workshop_attendees(workshop_id);
CREATE INDEX idx_workshop_attendees_email ON public.workshop_attendees(email);

-- Create Luma sync log table
CREATE TABLE IF NOT EXISTS public.luma_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Sync details
  sync_type TEXT CHECK (sync_type IN ('manual', 'scheduled', 'webhook')),
  sync_status TEXT CHECK (sync_status IN ('success', 'partial', 'failed')),

  -- Results
  events_synced INTEGER DEFAULT 0,
  events_created INTEGER DEFAULT 0,
  events_updated INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_luma_sync_log_user_id ON public.luma_sync_log(user_id);
CREATE INDEX idx_luma_sync_log_created_at ON public.luma_sync_log(created_at);

-- Enable Row Level Security
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.luma_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workshops
CREATE POLICY "Users can view their own workshops"
  ON public.workshops FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public workshops"
  ON public.workshops FOR SELECT
  USING (visibility = 'public' AND status = 'published');

CREATE POLICY "Users can insert their own workshops"
  ON public.workshops FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workshops"
  ON public.workshops FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workshops"
  ON public.workshops FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for workshop_attendees
CREATE POLICY "Users can view attendees of their workshops"
  ON public.workshop_attendees FOR SELECT
  USING (
    workshop_id IN (
      SELECT id FROM public.workshops WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage attendees of their workshops"
  ON public.workshop_attendees FOR ALL
  USING (
    workshop_id IN (
      SELECT id FROM public.workshops WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for luma_sync_log
CREATE POLICY "Users can view their own sync logs"
  ON public.luma_sync_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync logs"
  ON public.luma_sync_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create view for upcoming workshops
CREATE OR REPLACE VIEW public.upcoming_workshops AS
SELECT
  w.*,
  COALESCE(w.current_attendees, 0) as attendee_count,
  CASE
    WHEN w.max_capacity IS NOT NULL THEN
      ((w.current_attendees::float / w.max_capacity::float) * 100)::integer
    ELSE NULL
  END as capacity_percentage
FROM public.workshops w
WHERE w.status = 'published'
  AND w.event_date >= CURRENT_DATE
ORDER BY w.event_date ASC, w.start_time ASC;

-- Add comment
COMMENT ON TABLE public.workshops IS 'Stores workshop events synced from Luma and created manually';
COMMENT ON TABLE public.workshop_attendees IS 'Tracks workshop attendees and registration status';
COMMENT ON TABLE public.luma_sync_log IS 'Logs all Luma sync operations for debugging and monitoring';
