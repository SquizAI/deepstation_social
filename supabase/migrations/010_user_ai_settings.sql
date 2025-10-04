-- User AI Settings Table
-- Stores per-user AI model preferences for different components

CREATE TABLE IF NOT EXISTS public.user_ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- AI Model Preferences for different components
  voice_assistant_model TEXT DEFAULT 'claude-sonnet-4-5-20250929',
  workflow_builder_model TEXT DEFAULT 'claude-sonnet-4-5-20250929',
  post_generator_model TEXT DEFAULT 'claude-sonnet-4-5-20250929',
  speaker_assistant_model TEXT DEFAULT 'claude-sonnet-4-5-20250929',
  event_assistant_model TEXT DEFAULT 'claude-sonnet-4-5-20250929',

  -- Transcription preferences
  transcription_provider TEXT DEFAULT 'deepgram',
  transcription_model TEXT DEFAULT 'nova-3',

  -- Voice synthesis preferences (for future use)
  voice_provider TEXT DEFAULT 'browser',
  voice_model TEXT DEFAULT 'default',

  -- General AI settings
  max_tokens INTEGER DEFAULT 150,
  temperature DECIMAL(3,2) DEFAULT 1.0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one settings row per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_ai_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own AI settings"
  ON public.user_ai_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI settings"
  ON public.user_ai_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI settings"
  ON public.user_ai_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_ai_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_ai_settings_timestamp
  BEFORE UPDATE ON public.user_ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_ai_settings_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_ai_settings_user_id ON public.user_ai_settings(user_id);

-- Create helper function to get or create user settings
CREATE OR REPLACE FUNCTION get_or_create_user_ai_settings(p_user_id UUID)
RETURNS public.user_ai_settings AS $$
DECLARE
  v_settings public.user_ai_settings;
BEGIN
  -- Try to get existing settings
  SELECT * INTO v_settings
  FROM public.user_ai_settings
  WHERE user_id = p_user_id;

  -- If not found, create default settings
  IF NOT FOUND THEN
    INSERT INTO public.user_ai_settings (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_settings;
  END IF;

  RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
