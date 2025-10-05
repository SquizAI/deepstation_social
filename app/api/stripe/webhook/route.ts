/**
 * Stripe Webhook Handler
 * Processes Stripe events for payment completion, refunds, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Use service role for webhook to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);

  const metadata = session.metadata;
  if (!metadata) {
    console.error('No metadata in checkout session');
    return;
  }

  const {
    event_id,
    ticket_type_id,
    quantity,
    organization_id,
    first_name,
    last_name,
  } = metadata;

  // Create event registration
  const { data: registration, error: regError } = await supabase
    .from('event_registrations')
    .insert({
      event_id,
      user_id: session.client_reference_id,
      ticket_type_id,
      email: session.customer_email,
      first_name: first_name || '',
      last_name: last_name || '',
      status: 'confirmed',
      payment_status: 'completed',
      payment_intent_id: session.payment_intent as string,
    })
    .select('id')
    .single();

  if (regError) {
    console.error('Failed to create registration:', regError);
    return;
  }

  // Get ticket price for transaction
  const { data: ticketType } = await supabase
    .from('ticket_types')
    .select('price')
    .eq('id', ticket_type_id)
    .single();

  const amount = ticketType ? parseFloat(ticketType.price.toString()) * parseInt(quantity) : 0;

  // Create transaction record
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      organization_id,
      user_id: session.client_reference_id,
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_customer_id: session.customer as string,
      amount,
      currency: session.currency || 'usd',
      status: 'succeeded',
      entity_type: 'event_registration',
      entity_id: registration.id,
      description: `Event ticket purchase`,
      paid_at: new Date().toISOString(),
    });

  if (txError) {
    console.error('Failed to create transaction:', txError);
  }

  // Update ticket quantity sold
  await supabase.rpc('increment_ticket_sold', {
    ticket_id: ticket_type_id,
    amount: parseInt(quantity),
  });

  console.log('Registration created:', registration.id);
}

/**
 * Handle successful payment intent
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  // Update transaction status
  await supabase
    .from('transactions')
    .update({
      status: 'succeeded',
      stripe_charge_id: paymentIntent.latest_charge as string,
      paid_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  // Update transaction and registration status
  await supabase
    .from('transactions')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  await supabase
    .from('event_registrations')
    .update({ payment_status: 'failed' })
    .eq('payment_intent_id', paymentIntent.id);
}

/**
 * Handle charge refund
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id);

  // Update transaction status
  await supabase
    .from('transactions')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
    })
    .eq('stripe_charge_id', charge.id);

  // Update registration status
  await supabase
    .from('event_registrations')
    .update({
      payment_status: 'refunded',
      status: 'cancelled',
    })
    .eq('payment_intent_id', charge.payment_intent as string);
}

/**
 * Handle Stripe Connect account updates
 */
async function handleAccountUpdated(account: Stripe.Account) {
  console.log('Account updated:', account.id);

  // Check if account is fully onboarded
  const isOnboarded = account.charges_enabled && account.payouts_enabled;

  // Update organization
  await supabase
    .from('organizations')
    .update({ stripe_onboarding_completed: isOnboarded })
    .eq('stripe_account_id', account.id);
}
