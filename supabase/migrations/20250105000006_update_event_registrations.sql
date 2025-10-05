-- =====================================================
-- Phase 1: Multi-Tenant Database Foundation
-- Migration 6: Update Event Registrations for Transactions
-- =====================================================

-- Add transaction_id to event_registrations table
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- Add amount_paid field
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0.00;

-- Create index on transaction_id
CREATE INDEX IF NOT EXISTS idx_event_registrations_transaction ON event_registrations(transaction_id) WHERE transaction_id IS NOT NULL;

-- Update RLS policies for event_registrations

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can create registrations" ON event_registrations;

-- RLS Policy: Users can view their own registrations
CREATE POLICY "Users can view their own registrations"
  ON event_registrations
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- RLS Policy: Organization members can view registrations for their events
CREATE POLICY "Organization members can view event registrations"
  ON event_registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN organization_members ON organization_members.organization_id = events.organization_id
      WHERE events.id = event_registrations.event_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Anyone can create registrations (public event signup)
CREATE POLICY "Anyone can create registrations"
  ON event_registrations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.status = 'published'
      AND events.visibility IN ('public', 'unlisted')
    )
  );

-- RLS Policy: Users can update their own registrations
CREATE POLICY "Users can update their own registrations"
  ON event_registrations
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- RLS Policy: Organization admins can update registrations for their events
CREATE POLICY "Organization admins can update event registrations"
  ON event_registrations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN organization_members ON organization_members.organization_id = events.organization_id
      WHERE events.id = event_registrations.event_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policy: Organization owners can delete registrations
CREATE POLICY "Organization owners can delete registrations"
  ON event_registrations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN organization_members ON organization_members.organization_id = events.organization_id
      WHERE events.id = event_registrations.event_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );

-- Function to automatically create transaction when registration payment is completed
CREATE OR REPLACE FUNCTION create_transaction_for_registration()
RETURNS TRIGGER AS $$
DECLARE
  event_org_id UUID;
  ticket_price DECIMAL(10, 2);
BEGIN
  -- Only create transaction if payment_status changed to 'completed' and no transaction exists
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' AND NEW.transaction_id IS NULL THEN
    -- Get organization_id from event
    SELECT organization_id INTO event_org_id
    FROM events
    WHERE id = NEW.event_id;

    -- Get ticket price
    SELECT price INTO ticket_price
    FROM ticket_types
    WHERE id = NEW.ticket_type_id;

    -- Create transaction record
    INSERT INTO transactions (
      organization_id,
      user_id,
      stripe_payment_intent_id,
      amount,
      currency,
      status,
      entity_type,
      entity_id,
      description,
      paid_at
    ) VALUES (
      event_org_id,
      NEW.user_id,
      NEW.payment_intent_id,
      COALESCE(ticket_price, 0.00),
      'usd',
      'succeeded',
      'event_registration',
      NEW.id,
      'Event registration payment',
      NOW()
    )
    RETURNING id INTO NEW.transaction_id;

    -- Update amount_paid
    NEW.amount_paid = COALESCE(ticket_price, 0.00);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create transaction on payment completion
DROP TRIGGER IF EXISTS on_registration_payment_completed ON event_registrations;
CREATE TRIGGER on_registration_payment_completed
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION create_transaction_for_registration();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON event_registrations TO authenticated, anon;
GRANT DELETE ON event_registrations TO authenticated;
