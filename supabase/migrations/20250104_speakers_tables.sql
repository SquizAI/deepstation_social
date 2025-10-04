-- Create speakers table
CREATE TABLE IF NOT EXISTS speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  bio TEXT NOT NULL,
  profile_photo_url TEXT,
  linkedin TEXT,
  twitter TEXT,
  instagram TEXT,
  website TEXT,
  presentation_title TEXT NOT NULL,
  presentation_description TEXT NOT NULL,
  presentation_type TEXT NOT NULL CHECK (presentation_type IN ('workshop', 'presentation', 'panel', 'fireside-chat')),
  expertise TEXT[] NOT NULL DEFAULT '{}',
  event_date TIMESTAMPTZ NOT NULL,
  event_location TEXT NOT NULL CHECK (event_location IN ('Miami', 'Brazil', 'Virtual')),
  highlights TEXT[],
  previous_companies TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create speaker_announcements table
CREATE TABLE IF NOT EXISTS speaker_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  speaker_id UUID NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
  generated_content JSONB NOT NULL,
  speaker_card_images JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(speaker_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_speakers_user_id ON speakers(user_id);
CREATE INDEX IF NOT EXISTS idx_speakers_event_date ON speakers(event_date);
CREATE INDEX IF NOT EXISTS idx_speakers_event_location ON speakers(event_location);
CREATE INDEX IF NOT EXISTS idx_speaker_announcements_speaker_id ON speaker_announcements(speaker_id);
CREATE INDEX IF NOT EXISTS idx_speaker_announcements_status ON speaker_announcements(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to speakers table
DROP TRIGGER IF EXISTS update_speakers_updated_at ON speakers;
CREATE TRIGGER update_speakers_updated_at
  BEFORE UPDATE ON speakers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger to speaker_announcements table
DROP TRIGGER IF EXISTS update_speaker_announcements_updated_at ON speaker_announcements;
CREATE TRIGGER update_speaker_announcements_updated_at
  BEFORE UPDATE ON speaker_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaker_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for speakers table
-- Users can view their own speakers
CREATE POLICY "Users can view their own speakers"
  ON speakers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own speakers
CREATE POLICY "Users can insert their own speakers"
  ON speakers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own speakers
CREATE POLICY "Users can update their own speakers"
  ON speakers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own speakers
CREATE POLICY "Users can delete their own speakers"
  ON speakers
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for speaker_announcements table
-- Users can view announcements for their speakers
CREATE POLICY "Users can view announcements for their speakers"
  ON speaker_announcements
  FOR SELECT
  USING (
    speaker_id IN (
      SELECT id FROM speakers WHERE user_id = auth.uid()
    )
  );

-- Users can insert announcements for their speakers
CREATE POLICY "Users can insert announcements for their speakers"
  ON speaker_announcements
  FOR INSERT
  WITH CHECK (
    speaker_id IN (
      SELECT id FROM speakers WHERE user_id = auth.uid()
    )
  );

-- Users can update announcements for their speakers
CREATE POLICY "Users can update announcements for their speakers"
  ON speaker_announcements
  FOR UPDATE
  USING (
    speaker_id IN (
      SELECT id FROM speakers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    speaker_id IN (
      SELECT id FROM speakers WHERE user_id = auth.uid()
    )
  );

-- Users can delete announcements for their speakers
CREATE POLICY "Users can delete announcements for their speakers"
  ON speaker_announcements
  FOR DELETE
  USING (
    speaker_id IN (
      SELECT id FROM speakers WHERE user_id = auth.uid()
    )
  );

-- Create storage bucket for speaker images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('speaker-images', 'speaker-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for speaker-images bucket
CREATE POLICY "Users can upload speaker images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'speaker-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their speaker images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'speaker-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view speaker images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'speaker-images');

CREATE POLICY "Users can delete their speaker images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'speaker-images' AND
    auth.role() = 'authenticated'
  );
