-- =====================================================
-- Phase 1: Multi-Tenant Database Foundation
-- Migration 4: Update Events Table for Multi-Tenancy
-- =====================================================

-- Add organization_id to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index on organization_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_events_organization ON events(organization_id);

-- Backfill organization_id for existing events
-- Create a default "DeepStation" organization if it doesn't exist
DO $$
DECLARE
  deepstation_org_id UUID;
  first_user_id UUID;
BEGIN
  -- Get the first user ID to assign as owner
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;

  -- Check if DeepStation organization exists
  SELECT id INTO deepstation_org_id FROM organizations WHERE slug = 'deepstation';

  -- If not, create it
  IF deepstation_org_id IS NULL AND first_user_id IS NOT NULL THEN
    INSERT INTO organizations (name, slug, description, is_active)
    VALUES (
      'DeepStation',
      'deepstation',
      'AI-powered platform for events, content creation, and automation',
      true
    )
    RETURNING id INTO deepstation_org_id;

    -- Temporarily disable RLS to insert the organization member
    ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;

    -- Add first user as owner
    INSERT INTO organization_members (organization_id, user_id, role, joined_at)
    VALUES (deepstation_org_id, first_user_id, 'owner', NOW())
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- Re-enable RLS
    ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Update all events without organization_id to belong to DeepStation
  IF deepstation_org_id IS NOT NULL THEN
    UPDATE events
    SET organization_id = deepstation_org_id
    WHERE organization_id IS NULL;
  END IF;
END $$;

-- Make organization_id NOT NULL after backfill
-- ALTER TABLE events
-- ALTER COLUMN organization_id SET NOT NULL;
-- Commented out for now - will enable after all events have organization_id

-- Update RLS policies for events to be organization-scoped

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
DROP POLICY IF EXISTS "Users can manage their own events" ON events;

-- RLS Policy: Anyone can view published events from active organizations
CREATE POLICY "Anyone can view published events"
  ON events
  FOR SELECT
  USING (
    status = 'published'
    AND visibility IN ('public', 'unlisted')
    AND EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = events.organization_id
      AND organizations.is_active = true
    )
  );

-- RLS Policy: Organization members can view all their org's events
CREATE POLICY "Organization members can view org events"
  ON events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Organization admins/owners can create events
CREATE POLICY "Organization admins can create events"
  ON events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policy: Organization admins/owners can update events
CREATE POLICY "Organization admins can update events"
  ON events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policy: Organization owners can delete events
CREATE POLICY "Organization owners can delete events"
  ON events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );
