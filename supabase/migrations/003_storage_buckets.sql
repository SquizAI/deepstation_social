-- Migration: Storage Buckets Configuration
-- Description: Creates storage buckets for post images and speaker photos with RLS policies
-- Phase: 1.6 (Content Management)

BEGIN;

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Create post-images bucket (public access for CDN delivery)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create speaker-photos bucket (public access for speaker profiles)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'speaker-photos',
  'speaker-photos',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES - POST IMAGES
-- =============================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload images to their own folder
-- Folder structure: post-images/{user_id}/{filename}
CREATE POLICY "Users can upload own images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Public read access to all post images
-- Allows CDN and public viewing of shared content
CREATE POLICY "Public can view images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'post-images');

-- Policy: Users can update their own images (metadata, etc.)
CREATE POLICY "Users can update own images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- STORAGE POLICIES - SPEAKER PHOTOS
-- =============================================

-- Policy: Users can upload speaker photos to their own folder
-- Folder structure: speaker-photos/{user_id}/{filename}
CREATE POLICY "Users can upload own speaker photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'speaker-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Public read access to all speaker photos
-- Allows public viewing of speaker profiles
CREATE POLICY "Public can view speaker photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'speaker-photos');

-- Policy: Users can update their own speaker photos
CREATE POLICY "Users can update own speaker photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'speaker-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own speaker photos
CREATE POLICY "Users can delete own speaker photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'speaker-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- HELPER FUNCTION FOR FILE PATH VALIDATION
-- =============================================

-- Function: Validate storage file path structure
-- Ensures files are uploaded to correct user folder
CREATE OR REPLACE FUNCTION storage.validate_user_folder(
  path text,
  user_id uuid
)
RETURNS boolean AS $$
BEGIN
  -- Extract user_id from path (first folder)
  -- Expected format: {user_id}/{filename} or {user_id}/{subfolder}/{filename}
  RETURN (storage.foldername(path))[1] = user_id::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- CLEANUP FUNCTION FOR ORPHANED FILES
-- =============================================

-- Function: Clean up orphaned storage files
-- Removes files that are no longer referenced by any posts
CREATE OR REPLACE FUNCTION storage.cleanup_orphaned_post_images()
RETURNS void AS $$
BEGIN
  -- This function can be called periodically to remove unused images
  -- Implementation would check scheduled_posts.images array and remove unreferenced files
  -- Note: Actual implementation should be done via Edge Function for better control
  RAISE NOTICE 'Orphaned file cleanup should be implemented via Edge Function';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- INDEXES FOR STORAGE PERFORMANCE
-- =============================================

-- Index on bucket_id for faster policy checks
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id
  ON storage.objects(bucket_id);

-- Index on name for faster file lookups
CREATE INDEX IF NOT EXISTS idx_storage_objects_name
  ON storage.objects(name);

-- Composite index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_user
  ON storage.objects(bucket_id, (storage.foldername(name))[1]);

COMMIT;

-- =============================================
-- USAGE EXAMPLES
-- =============================================

-- Upload image (client-side):
-- const { data, error } = await supabase.storage
--   .from('post-images')
--   .upload(`${userId}/my-image.jpg`, file)

-- Get public URL:
-- const { data } = supabase.storage
--   .from('post-images')
--   .getPublicUrl(`${userId}/my-image.jpg`)

-- Delete image:
-- const { error } = await supabase.storage
--   .from('post-images')
--   .remove([`${userId}/my-image.jpg`])

-- List user's images:
-- const { data, error } = await supabase.storage
--   .from('post-images')
--   .list(`${userId}/`)
