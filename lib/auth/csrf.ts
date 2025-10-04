import crypto from 'crypto';
import { cookies } from 'next/headers';
import { Platform } from './oauth-config';

const CSRF_COOKIE_NAME = 'oauth_state';
const PKCE_COOKIE_NAME = 'oauth_pkce';
const COOKIE_MAX_AGE = 600; // 10 minutes

export interface StateData {
  state: string;
  platform: Platform;
}

export interface PKCEData {
  codeVerifier: string;
  platform: Platform;
}

/**
 * Generate a cryptographically secure random state parameter
 * @returns Random 32+ character string
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Store state parameter in secure HTTP-only cookie
 * @param platform - The social media platform
 * @returns Generated state parameter
 */
export async function storeState(platform: Platform): Promise<string> {
  const state = generateState();
  const cookieStore = await cookies();

  const stateData: StateData = {
    state,
    platform,
  };

  cookieStore.set(CSRF_COOKIE_NAME, JSON.stringify(stateData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return state;
}

/**
 * Store PKCE code verifier in secure HTTP-only cookie (for Twitter)
 * @param platform - The social media platform
 * @param codeVerifier - The PKCE code verifier
 */
export async function storePKCEVerifier(
  platform: Platform,
  codeVerifier: string
): Promise<void> {
  const cookieStore = await cookies();

  const pkceData: PKCEData = {
    codeVerifier,
    platform,
  };

  cookieStore.set(PKCE_COOKIE_NAME, JSON.stringify(pkceData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Validate state parameter and extract platform from cookie
 * @param state - State parameter from OAuth callback
 * @returns Platform if validation succeeds, null otherwise
 */
export async function validateState(state: string): Promise<Platform | null> {
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(CSRF_COOKIE_NAME);

  if (!stateCookie) {
    console.error('No state cookie found');
    return null;
  }

  try {
    const stateData: StateData = JSON.parse(stateCookie.value);

    if (stateData.state !== state) {
      console.error('State mismatch - possible CSRF attack');
      return null;
    }

    // State is valid, delete the cookie
    cookieStore.delete(CSRF_COOKIE_NAME);

    return stateData.platform;
  } catch (error) {
    console.error('Error parsing state cookie:', error);
    return null;
  }
}

/**
 * Get PKCE code verifier from cookie and validate platform
 * @param platform - The social media platform
 * @returns Code verifier if found and platform matches, null otherwise
 */
export async function getPKCEVerifier(platform: Platform): Promise<string | null> {
  const cookieStore = await cookies();
  const pkceCookie = cookieStore.get(PKCE_COOKIE_NAME);

  if (!pkceCookie) {
    console.error('No PKCE cookie found');
    return null;
  }

  try {
    const pkceData: PKCEData = JSON.parse(pkceCookie.value);

    if (pkceData.platform !== platform) {
      console.error('Platform mismatch in PKCE cookie');
      return null;
    }

    // PKCE verifier is valid, delete the cookie
    cookieStore.delete(PKCE_COOKIE_NAME);

    return pkceData.codeVerifier;
  } catch (error) {
    console.error('Error parsing PKCE cookie:', error);
    return null;
  }
}

/**
 * Clean up OAuth cookies (use in case of errors)
 */
export async function cleanupOAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_COOKIE_NAME);
  cookieStore.delete(PKCE_COOKIE_NAME);
}

/**
 * Validate that required environment variables are set for CSRF protection
 * @returns true if environment is properly configured
 */
export function validateCSRFEnvironment(): boolean {
  if (process.env.NODE_ENV === 'production') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl || !appUrl.startsWith('https://')) {
      console.error('NEXT_PUBLIC_APP_URL must be HTTPS in production');
      return false;
    }
  }
  return true;
}
