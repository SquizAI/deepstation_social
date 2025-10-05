/**
 * Stripe Checkout API Route
 * Creates checkout session for event ticket purchases
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, dollarsToCents, calculatePlatformFee } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user (optional - guests can also register)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { eventId, ticketTypeId, quantity = 1, email, firstName, lastName } = await request.json();

    if (!eventId || !ticketTypeId) {
      return NextResponse.json(
        { error: 'Event ID and Ticket Type ID required' },
        { status: 400 }
      );
    }

    if (!user && !email) {
      return NextResponse.json({ error: 'Email required for guest checkout' }, { status: 400 });
    }

    // Get event and organization
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        organizations (
          id,
          name,
          stripe_account_id,
          stripe_onboarding_completed
        )
      `)
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if organization has completed Stripe onboarding
    if (!event.organizations?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Event organization has not set up payments' },
        { status: 400 }
      );
    }

    // Get ticket type
    const { data: ticketType, error: ticketError } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('id', ticketTypeId)
      .eq('event_id', eventId)
      .single();

    if (ticketError || !ticketType) {
      return NextResponse.json({ error: 'Ticket type not found' }, { status: 404 });
    }

    // Check if ticket is active and available
    if (!ticketType.is_active) {
      return NextResponse.json({ error: 'Ticket type is not available' }, { status: 400 });
    }

    if (
      ticketType.quantity_available !== null &&
      ticketType.quantity_available < quantity
    ) {
      return NextResponse.json({ error: 'Not enough tickets available' }, { status: 400 });
    }

    // Check quantity limits
    if (quantity < (ticketType.min_per_order || 1)) {
      return NextResponse.json(
        { error: `Minimum ${ticketType.min_per_order} tickets required` },
        { status: 400 }
      );
    }

    if (quantity > (ticketType.max_per_order || 10)) {
      return NextResponse.json(
        { error: `Maximum ${ticketType.max_per_order} tickets allowed` },
        { status: 400 }
      );
    }

    // Calculate amounts
    const ticketPrice = parseFloat(ticketType.price.toString());
    const totalAmount = ticketPrice * quantity;
    const amountInCents = dollarsToCents(totalAmount);
    const platformFee = calculatePlatformFee(amountInCents);

    // For free tickets, create registration directly
    if (amountInCents === 0 || !ticketType.payment_required) {
      const { data: registration, error: regError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user?.id,
          ticket_type_id: ticketTypeId,
          email: user?.email || email,
          first_name: firstName,
          last_name: lastName,
          status: 'confirmed',
          payment_status: 'completed',
        })
        .select('id')
        .single();

      if (regError) {
        console.error('Failed to create registration:', regError);
        return NextResponse.json(
          { error: 'Failed to create registration' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        registrationId: registration.id,
        isFree: true,
      });
    }

    // Create Stripe checkout session for paid tickets
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: ticketType.currency?.toLowerCase() || 'usd',
              product_data: {
                name: ticketType.name,
                description: ticketType.description || `Ticket for ${event.title}`,
                images: event.cover_image_url ? [event.cover_image_url] : undefined,
              },
              unit_amount: dollarsToCents(ticketPrice),
            },
            quantity,
          },
        ],
        customer_email: user?.email || email,
        client_reference_id: user?.id,
        metadata: {
          event_id: eventId,
          ticket_type_id: ticketTypeId,
          quantity: quantity.toString(),
          organization_id: event.organizations.id,
          first_name: firstName || '',
          last_name: lastName || '',
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.slug}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.slug}`,
        payment_intent_data: {
          application_fee_amount: platformFee,
          metadata: {
            event_id: eventId,
            ticket_type_id: ticketTypeId,
            organization_id: event.organizations.id,
          },
        },
      },
      {
        stripeAccount: event.organizations.stripe_account_id, // Connected account
      }
    );

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
