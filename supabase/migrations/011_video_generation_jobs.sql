-- Video Generation Jobs Table
-- Tracks async video generation requests for background processing

CREATE TABLE IF NOT EXISTS public.video_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request details
  prompt TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}', -- resolution, duration, aspectRatio, style, etc.

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- Results
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER, -- seconds
  resolution TEXT,
  has_audio BOOLEAN DEFAULT false,

  -- Metadata
  error_message TEXT,
  cost DECIMAL(10, 4),
  generation_time_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_video_jobs_user_id ON public.video_generation_jobs(user_id);
CREATE INDEX idx_video_jobs_status ON public.video_generation_jobs(status);
CREATE INDEX idx_video_jobs_created_at ON public.video_generation_jobs(created_at DESC);

-- RLS Policies
ALTER TABLE public.video_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own video generation jobs
CREATE POLICY "Users can view own video jobs"
  ON public.video_generation_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own video generation jobs
CREATE POLICY "Users can create own video jobs"
  ON public.video_generation_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own video generation jobs (for polling/status updates)
CREATE POLICY "Users can update own video jobs"
  ON public.video_generation_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_video_job_timestamp
  BEFORE UPDATE ON public.video_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_video_job_updated_at();

-- Grant permissions
GRANT ALL ON public.video_generation_jobs TO authenticated;
GRANT ALL ON public.video_generation_jobs TO service_role;
