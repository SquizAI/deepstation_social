-- =====================================================
-- Phase 1: Multi-Tenant Database Foundation
-- Migration 1: Organizations Table
-- =====================================================

-- Create organizations table for multi-tenant support
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#6366f1',
  website_url TEXT,
  description TEXT,
  stripe_account_id TEXT UNIQUE,
  stripe_onboarding_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Create index on slug for fast lookups
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_stripe_account ON organizations(stripe_account_id) WHERE stripe_account_id IS NOT NULL;
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view active organizations
CREATE POLICY "Anyone can view active organizations"
  ON organizations
  FOR SELECT
  USING (is_active = true);

-- RLS Policy: Only organization members can update their organization
-- (This will be enforced after organization_members table is created)
CREATE POLICY "Organization members can update their organization"
  ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policy: Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON organizations TO authenticated, anon;
GRANT INSERT, UPDATE ON organizations TO authenticated;
