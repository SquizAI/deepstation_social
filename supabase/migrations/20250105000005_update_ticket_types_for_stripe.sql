-- =====================================================
-- Phase 1: Multi-Tenant Database Foundation
-- Migration 5: Update Ticket Types for Stripe Integration
-- =====================================================

-- Add Stripe-related fields to ticket_types table
ALTER TABLE ticket_types
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payment_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_quantity_selection BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS refund_policy TEXT,
ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;

-- Create indexes for Stripe fields
CREATE INDEX IF NOT EXISTS idx_ticket_types_stripe_product ON ticket_types(stripe_product_id) WHERE stripe_product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_types_stripe_price ON ticket_types(stripe_price_id) WHERE stripe_price_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_types_payment_required ON ticket_types(payment_required) WHERE payment_required = true;

-- Update payment_required based on price
UPDATE ticket_types
SET payment_required = (price > 0)
WHERE payment_required = false;

-- Update RLS policies for ticket_types

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view active ticket types" ON ticket_types;

-- RLS Policy: Anyone can view active ticket types for published events
CREATE POLICY "Anyone can view active ticket types"
  ON ticket_types
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = ticket_types.event_id
      AND events.status = 'published'
    )
  );

-- RLS Policy: Organization members can view all ticket types for their events
CREATE POLICY "Organization members can view org ticket types"
  ON ticket_types
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN organization_members ON organization_members.organization_id = events.organization_id
      WHERE events.id = ticket_types.event_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Organization admins can create ticket types
CREATE POLICY "Organization admins can create ticket types"
  ON ticket_types
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      JOIN organization_members ON organization_members.organization_id = events.organization_id
      WHERE events.id = ticket_types.event_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policy: Organization admins can update ticket types
CREATE POLICY "Organization admins can update ticket types"
  ON ticket_types
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN organization_members ON organization_members.organization_id = events.organization_id
      WHERE events.id = ticket_types.event_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policy: Organization owners can delete ticket types
CREATE POLICY "Organization owners can delete ticket types"
  ON ticket_types
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN organization_members ON organization_members.organization_id = events.organization_id
      WHERE events.id = ticket_types.event_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );

-- Grant permissions
GRANT SELECT ON ticket_types TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON ticket_types TO authenticated;
