# Credential Storage System Update - October 2025

## What Was Wrong

The social media connectors (LinkedIn, Instagram, Twitter, Discord) were looking for OAuth tokens using `getValidOAuthToken()`, which only checked the `access_token` and `refresh_token` columns in the database. This function didn't know about the new secure credential storage system that stores user-provided API keys in the `credentials` JSONB column.

**Result**: Even though users could save API credentials through the UI, the publishing system couldn't find them, resulting in "No valid OAuth token found" errors.

## What Was Fixed

### 1. Updated Publishing System (`/lib/publishing/unified-publisher.ts`)

**Before**:
```typescript
// Only checked OAuth tokens
const tokenData = await getValidOAuthToken(userId, platform);
if (!tokenData) {
  return error('No OAuth token found');
}
```

**After**:
```typescript
// Now checks secure credential storage first
const credentials = await getStoredCredentials(userId, platform);

if (!credentials) {
  // Fallback to OAuth for backward compatibility
  const tokenData = await getValidOAuthToken(userId, platform);
}

// Handle both OAuth and API key credentials
if (credentials.credentialType === 'oauth') {
  accessToken = credentials.credentials.accessToken;
} else if (credentials.credentialType === 'api_key') {
  accessToken = credentials.credentials.accessToken ||
               credentials.credentials.apiKey;
}
```

### 2. Added Import for Secure Credentials

```typescript
import { getStoredCredentials } from '@/lib/credentials/get-credentials';
```

## How It Works Now

### Credential Retrieval Hierarchy

For each platform, the system now checks in this order:

1. **User-provided API credentials** (stored in `oauth_tokens.credentials` JSONB)
   - Users can manually add API keys/tokens via Settings → Social Credentials
   - Stored securely with RLS policies
   - Platform-specific format (see guide)

2. **OAuth tokens** (stored in `oauth_tokens.access_token`)
   - Traditional OAuth flow
   - Automatic token refresh
   - Requires OAuth app setup

3. **Environment variables** (fallback for system-level credentials)
   - Only used if no user credentials found
   - Defined in `.env.local`

### Supported Authentication Methods

| Platform | OAuth | API Key | Webhook |
|----------|-------|---------|---------|
| LinkedIn | ✅ | ✅ | - |
| Instagram | ✅ | ✅ | - |
| Twitter/X | ✅ | ✅ | - |
| Discord | - | - | ✅ |
| Resend | - | ✅ | - |
| SendGrid | - | ✅ | - |

## What This Means for Users

### Before the Fix

❌ Users saved API credentials in Settings
❌ Publishing system couldn't find them
❌ Got "No valid OAuth token found" errors
❌ Had to use OAuth flow even if they had API keys

### After the Fix

✅ Users can save API credentials in Settings
✅ Publishing system finds and uses them
✅ Clear error messages: "No credentials found for X. Please connect your account or add API credentials."
✅ Users can choose: OAuth flow OR manual API keys
✅ Higher rate limits (users use their own API quotas)

## Database Schema (Already Implemented)

The `oauth_tokens` table supports both credential types:

```sql
CREATE TABLE oauth_tokens (
  -- Identity
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  platform TEXT, -- 'linkedin', 'instagram', 'twitter', etc.
  credential_type TEXT DEFAULT 'oauth', -- 'oauth' or 'api_key'

  -- OAuth fields
  access_token TEXT, -- Encrypted OAuth token
  refresh_token TEXT,
  provider_user_id TEXT,
  expires_at TIMESTAMP,

  -- API key fields (NEW - already in DB)
  credentials JSONB DEFAULT '{}', -- User-provided API keys
  metadata JSONB DEFAULT '{}',    -- Additional platform data

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  UNIQUE(user_id, platform)
);
```

## Security Features (Already Implemented)

1. **Row Level Security (RLS)**: Users only see their own credentials
2. **Encryption**: `ENCRYPTION_KEY` in `.env.local` (already set)
3. **Credential Masking**: API returns `••••last4chars`
4. **JSONB Storage**: Flexible structure for different platforms

## API Endpoints (Already Implemented)

### Save Credentials
```typescript
POST /api/auth/credentials
{
  "platform": "linkedin",
  "credentials": {
    "accessToken": "your_token",
    "userId": "linkedin_user_id"
  }
}
```

### Get Credentials (Masked)
```typescript
GET /api/auth/credentials?platform=linkedin

Response:
{
  "hasCredentials": true,
  "credentials": {
    "accessToken": "••••5f2a",
    "userId": "linkedin_user_id"
  }
}
```

## Files Modified

### `/lib/publishing/unified-publisher.ts`
- Added import for `getStoredCredentials`
- Updated credential retrieval logic (lines 106-148)
- Now checks both API keys and OAuth tokens
- Better error messages

### New Documentation

1. **`/docs/CREDENTIAL_STORAGE_GUIDE.md`**
   - Complete guide to credential system
   - Platform-specific credential formats
   - Security best practices
   - API reference
   - Troubleshooting guide

2. **`/CREDENTIALS_UPDATE_SUMMARY.md`** (this file)
   - What was fixed
   - How it works now
   - Benefits for users

## Testing

To test the updated system:

1. **Via UI** (Recommended):
   - Go to `/dashboard/settings/social-credentials`
   - Click "Manage Credentials" for any platform
   - Enter API credentials
   - Save
   - Try publishing to that platform

2. **Via API**:
   ```bash
   # Save credentials
   curl -X POST http://localhost:3055/api/auth/credentials \
     -H "Content-Type: application/json" \
     -d '{
       "platform": "linkedin",
       "credentials": {
         "accessToken": "your_token",
         "userId": "your_user_id"
       }
     }'

   # Publish
   curl -X POST http://localhost:3055/api/publishing/publish \
     -H "Content-Type: application/json" \
     -d '{
       "platforms": ["linkedin"],
       "content": { "linkedin": "Test post" }
     }'
   ```

## Benefits

### For Users
- Choose between OAuth or manual API keys
- Use their own API quotas (higher limits)
- No need to set up OAuth apps
- Secure credential storage
- Multi-user support

### For Developers
- Cleaner code separation
- Better error handling
- Backward compatible (still supports old OAuth)
- Flexible credential formats
- Easier platform additions

### For Security
- Database-level RLS
- Encrypted storage
- Credential masking
- No hardcoded tokens
- Environment variable fallback

## Summary

✅ **Credential storage system was already fully implemented**
✅ **Publishing system now uses it correctly**
✅ **All platforms supported**
✅ **Backward compatible with OAuth**
✅ **Secure and production-ready**

The fix ensures that user-provided API credentials are properly retrieved and used by the publishing system. Users can now choose their preferred authentication method (OAuth or API keys) and the system will work with both.
