/**
 * OAuth Type Definitions for DeepStation
 */

export type Platform = 'linkedin' | 'instagram' | 'twitter' | 'discord';

export interface OAuthToken {
  id: string;
  user_id: string;
  platform: Platform;
  provider_user_id?: string;
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  providerUserId?: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
}

export interface StateData {
  state: string;
  platform: Platform;
}

export interface PKCEData {
  codeVerifier: string;
  platform: Platform;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface PlatformStatus {
  linkedin: boolean;
  instagram: boolean;
  twitter: boolean;
  discord: boolean;
}

export interface OAuthStatusResponse {
  userId: string;
  connectedPlatforms: PlatformStatus;
  totalConnected: number;
}

export interface OAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

export type OAuthErrorCode =
  | 'access_denied'
  | 'invalid_request'
  | 'unauthorized_client'
  | 'invalid_grant'
  | 'unsupported_grant_type'
  | 'invalid_scope'
  | 'server_error'
  | 'temporarily_unavailable';

export interface PlatformLimits {
  linkedin: {
    apiCallsPerDay: 500;
    tokenLifespanDays: 60;
    refreshTokenLifespanDays: 365;
  };
  instagram: {
    postsPerDay: 100;
    tokenLifespanDays: 60;
  };
  twitter: {
    postsPerMonth: 500; // Free tier 2025
    tokenLifespanHours: 2;
  };
  discord: {
    unlimited: true;
  };
}

export const PLATFORM_LIMITS: PlatformLimits = {
  linkedin: {
    apiCallsPerDay: 500,
    tokenLifespanDays: 60,
    refreshTokenLifespanDays: 365,
  },
  instagram: {
    postsPerDay: 100,
    tokenLifespanDays: 60,
  },
  twitter: {
    postsPerMonth: 500,
    tokenLifespanHours: 2,
  },
  discord: {
    unlimited: true,
  },
};
