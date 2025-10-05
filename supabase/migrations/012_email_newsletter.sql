-- Email Campaigns and Subscribers Tables
-- Migration: 012_email_newsletter.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Email Campaigns Table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  preview_text TEXT,
  content TEXT NOT NULL,
  template_id TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{"sent": 0, "opened": 0, "clicked": 0, "bounced": 0, "unsubscribed": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Subscribers Table
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  html_content TEXT NOT NULL,
  category TEXT DEFAULT 'custom' CHECK (category IN ('newsletter', 'announcement', 'product', 'event', 'promotional', 'custom')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Recipients Junction Table
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES email_subscribers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, subscriber_id)
);

-- Subscriber Lists/Segments Table
CREATE TABLE IF NOT EXISTS subscriber_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filter_criteria JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- List Subscribers Junction Table
CREATE TABLE IF NOT EXISTS list_subscribers (
  list_id UUID REFERENCES subscriber_lists(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES email_subscribers(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (list_id, subscriber_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_for ON email_campaigns(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_email_subscribers_user_id ON email_subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_status ON email_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_tags ON email_subscribers USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_subscriber_id ON campaign_recipients(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);

CREATE INDEX IF NOT EXISTS idx_subscriber_lists_user_id ON subscriber_lists(user_id);

-- Row Level Security (RLS)
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_campaigns
CREATE POLICY "Users can view their own campaigns"
  ON email_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns"
  ON email_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON email_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON email_campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for email_subscribers
CREATE POLICY "Users can view their own subscribers"
  ON email_subscribers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscribers"
  ON email_subscribers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscribers"
  ON email_subscribers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscribers"
  ON email_subscribers FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for email_templates
CREATE POLICY "Users can view their own templates and defaults"
  ON email_templates FOR SELECT
  USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can create their own templates"
  ON email_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON email_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON email_templates FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for campaign_recipients
CREATE POLICY "Users can view recipients of their campaigns"
  ON campaign_recipients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM email_campaigns
      WHERE email_campaigns.id = campaign_recipients.campaign_id
      AND email_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create recipients for their campaigns"
  ON campaign_recipients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_campaigns
      WHERE email_campaigns.id = campaign_recipients.campaign_id
      AND email_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recipients of their campaigns"
  ON campaign_recipients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM email_campaigns
      WHERE email_campaigns.id = campaign_recipients.campaign_id
      AND email_campaigns.user_id = auth.uid()
    )
  );

-- RLS Policies for subscriber_lists
CREATE POLICY "Users can view their own lists"
  ON subscriber_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lists"
  ON subscriber_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
  ON subscriber_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
  ON subscriber_lists FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for list_subscribers
CREATE POLICY "Users can view their list subscribers"
  ON list_subscribers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriber_lists
      WHERE subscriber_lists.id = list_subscribers.list_id
      AND subscriber_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add subscribers to their lists"
  ON list_subscribers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subscriber_lists
      WHERE subscriber_lists.id = list_subscribers.list_id
      AND subscriber_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove subscribers from their lists"
  ON list_subscribers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM subscriber_lists
      WHERE subscriber_lists.id = list_subscribers.list_id
      AND subscriber_lists.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_subscribers_updated_at
  BEFORE UPDATE ON email_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriber_lists_updated_at
  BEFORE UPDATE ON subscriber_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default email templates
INSERT INTO email_templates (id, user_id, name, description, thumbnail_url, html_content, category, is_default)
VALUES
  (
    uuid_generate_v4(),
    NULL,
    'Newsletter Template',
    'Clean and modern newsletter template',
    '/templates/newsletter-thumb.png',
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;"><tr><td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #d946ef 0%, #9333ea 100%);"><h1 style="margin: 0; color: #ffffff; font-size: 28px;">{{subject}}</h1></td></tr><tr><td style="padding: 40px 30px;"><div style="margin-bottom: 30px;">{{content}}</div></td></tr><tr><td style="padding: 20px 30px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #e0e0e0;"><p style="margin: 0; color: #666; font-size: 14px;">You received this email because you subscribed to DeepStation updates.</p><p style="margin: 10px 0 0 0;"><a href="{{unsubscribe_url}}" style="color: #9333ea; text-decoration: none;">Unsubscribe</a></p></td></tr></table></body></html>',
    'newsletter',
    true
  ),
  (
    uuid_generate_v4(),
    NULL,
    'Announcement Template',
    'Bold announcement template for important updates',
    '/templates/announcement-thumb.png',
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;"><tr><td style="padding: 60px 30px; text-align: center; background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);"><h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 32px; font-weight: bold;">📢 Announcement</h1><p style="margin: 0; color: #e0e0e0; font-size: 16px;">{{preview_text}}</p></td></tr><tr><td style="padding: 50px 40px; text-align: center;"><h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">{{subject}}</h2><div style="color: #666; font-size: 16px; line-height: 1.6; text-align: left;">{{content}}</div></td></tr><tr><td style="padding: 20px 30px; text-align: center; background-color: #f8f9fa;"><p style="margin: 0; color: #666; font-size: 14px;"><a href="{{unsubscribe_url}}" style="color: #9333ea; text-decoration: none;">Unsubscribe</a></p></td></tr></table></body></html>',
    'announcement',
    true
  ),
  (
    uuid_generate_v4(),
    NULL,
    'Event Invitation',
    'Beautiful event invitation template',
    '/templates/event-thumb.png',
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;"><tr><td style="padding: 50px 30px; text-align: center; background: linear-gradient(135deg, #d946ef 0%, #9333ea 100%);"><div style="font-size: 48px; margin-bottom: 15px;">🎉</div><h1 style="margin: 0; color: #ffffff; font-size: 28px;">You''re Invited!</h1></td></tr><tr><td style="padding: 40px 30px; text-align: center;"><h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">{{subject}}</h2><div style="margin-bottom: 30px; color: #666; font-size: 16px; line-height: 1.6;">{{content}}</div><a href="{{event_url}}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #d946ef 0%, #9333ea 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">Register Now</a></td></tr><tr><td style="padding: 20px 30px; text-align: center; background-color: #f8f9fa;"><p style="margin: 0; color: #666; font-size: 14px;"><a href="{{unsubscribe_url}}" style="color: #9333ea; text-decoration: none;">Unsubscribe</a></p></td></tr></table></body></html>',
    'event',
    true
  ),
  (
    uuid_generate_v4(),
    NULL,
    'Product Launch',
    'Sleek product launch announcement',
    '/templates/product-thumb.png',
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;"><tr><td style="padding: 50px 30px; text-align: center; background-color: #1a1a2e;"><h1 style="margin: 0 0 15px 0; color: #ffffff; font-size: 32px; font-weight: bold;">🚀 New Product Launch</h1><p style="margin: 0; color: #d946ef; font-size: 18px; font-weight: bold;">{{preview_text}}</p></td></tr><tr><td style="padding: 40px 30px;"><h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">{{subject}}</h2><div style="margin-bottom: 30px; color: #666; font-size: 16px; line-height: 1.6;">{{content}}</div><div style="text-align: center;"><a href="{{product_url}}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #d946ef 0%, #9333ea 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">Learn More</a></div></td></tr><tr><td style="padding: 20px 30px; text-align: center; background-color: #f8f9fa;"><p style="margin: 0; color: #666; font-size: 14px;"><a href="{{unsubscribe_url}}" style="color: #9333ea; text-decoration: none;">Unsubscribe</a></p></td></tr></table></body></html>',
    'product',
    true
  ),
  (
    uuid_generate_v4(),
    NULL,
    'Promotional Offer',
    'Eye-catching promotional template',
    '/templates/promotional-thumb.png',
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;"><tr><td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);"><h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: bold;">🔥 Special Offer!</h1><p style="margin: 10px 0 0 0; color: #ffffff; font-size: 20px;">{{preview_text}}</p></td></tr><tr><td style="padding: 40px 30px; text-align: center;"><h2 style="margin: 0 0 20px 0; color: #333; font-size: 26px;">{{subject}}</h2><div style="margin-bottom: 30px; color: #666; font-size: 16px; line-height: 1.6;">{{content}}</div><a href="{{offer_url}}" style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">Claim Offer</a><p style="margin: 20px 0 0 0; color: #999; font-size: 14px;">Limited time only!</p></td></tr><tr><td style="padding: 20px 30px; text-align: center; background-color: #f8f9fa;"><p style="margin: 0; color: #666; font-size: 14px;"><a href="{{unsubscribe_url}}" style="color: #dc2626; text-decoration: none;">Unsubscribe</a></p></td></tr></table></body></html>',
    'promotional',
    true
  );

COMMENT ON TABLE email_campaigns IS 'Stores email campaigns/newsletters';
COMMENT ON TABLE email_subscribers IS 'Stores email subscribers';
COMMENT ON TABLE email_templates IS 'Stores email templates';
COMMENT ON TABLE campaign_recipients IS 'Tracks individual campaign recipients and their interactions';
COMMENT ON TABLE subscriber_lists IS 'Stores subscriber lists/segments';
COMMENT ON TABLE list_subscribers IS 'Junction table for lists and subscribers';
