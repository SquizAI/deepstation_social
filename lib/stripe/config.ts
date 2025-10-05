/**
 * Stripe Configuration and Utilities
 * For multi-tenant event ticketing with Stripe Connect
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

// Initialize Stripe with API version
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

/**
 * Stripe Connect configuration
 */
export const STRIPE_CONNECT_CONFIG = {
  // Capabilities required for the platform
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },

  // Countries supported (expand as needed)
  supportedCountries: ['US', 'CA', 'GB', 'AU'],

  // Refresh URL after Connect onboarding
  refreshUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments`,

  // Return URL after Connect onboarding
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments?setup=complete`,
};

/**
 * Platform fee percentage (your platform's cut)
 * e.g., 2.5% = 0.025
 */
export const PLATFORM_FEE_PERCENTAGE = 0.025; // 2.5%

/**
 * Calculate platform fee from total amount
 */
export function calculatePlatformFee(amountInCents: number): number {
  return Math.round(amountInCents * PLATFORM_FEE_PERCENTAGE);
}

/**
 * Convert dollars to cents for Stripe
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(amountInCents: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(centsToDollars(amountInCents));
}
