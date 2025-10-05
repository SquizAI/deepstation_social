/**
 * Stripe Connect Onboarding API Route
 * Creates or retrieves Stripe Connect account link for organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, STRIPE_CONNECT_CONFIG } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Verify user is owner/admin of this organization
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_account_id, name, slug')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    let stripeAccountId = organization.stripe_account_id;

    // Create Stripe Connect account if doesn't exist
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'standard', // Standard Connect for full control
        country: 'US', // Default to US, can be changed during onboarding
        email: user.email,
        capabilities: STRIPE_CONNECT_CONFIG.capabilities,
        business_profile: {
          name: organization.name,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/${organization.slug}`,
        },
        metadata: {
          organization_id: organizationId,
          organization_slug: organization.slug,
        },
      });

      stripeAccountId = account.id;

      // Save Stripe account ID to database
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', organizationId);

      if (updateError) {
        console.error('Failed to save Stripe account ID:', updateError);
        return NextResponse.json(
          { error: 'Failed to save payment settings' },
          { status: 500 }
        );
      }
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: STRIPE_CONNECT_CONFIG.refreshUrl,
      return_url: STRIPE_CONNECT_CONFIG.returnUrl,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      url: accountLink.url,
      stripeAccountId,
    });
  } catch (error) {
    console.error('Stripe Connect onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to create onboarding link' },
      { status: 500 }
    );
  }
}
