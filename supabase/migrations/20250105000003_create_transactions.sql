-- =====================================================
-- Phase 1: Multi-Tenant Database Foundation
-- Migration 3: Transactions Table
-- =====================================================

-- Create transactions table for payment tracking
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Stripe payment details
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_customer_id TEXT,

  -- Transaction details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled')),

  -- Related entity (event registration, etc.)
  entity_type TEXT CHECK (entity_type IN ('event_registration', 'subscription', 'other')),
  entity_id UUID,

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX idx_transactions_org ON transactions(organization_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_stripe_payment ON transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_entity ON transactions(entity_type, entity_id) WHERE entity_type IS NOT NULL;
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policy: Organization owners/admins can view all org transactions
CREATE POLICY "Organization admins can view org transactions"
  ON transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = transactions.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policy: System can insert transactions (via service role)
CREATE POLICY "Service role can insert transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: System can update transactions (via service role)
CREATE POLICY "Service role can update transactions"
  ON transactions
  FOR UPDATE
  USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON transactions TO authenticated;
GRANT ALL ON transactions TO service_role;
