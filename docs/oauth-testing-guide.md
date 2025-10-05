# OAuth Testing Guide

## Pre-Test Checklist

- [ ] All environment variables configured in `.env.local`
- [ ] Encryption key generated (32 characters)
- [ ] Database migration applied (`oauth_tokens` table exists)
- [ ] Development server running (`npm run dev`)
- [ ] User account created and logged in
- [ ] Platform developer accounts created
- [ ] Redirect URIs configured in platform settings

## Test Plan

### Test 1: LinkedIn OAuth Flow

**Objective:** Verify complete LinkedIn OAuth connection flow

**Steps:**
1. Navigate to `http://localhost:3000/dashboard/settings/social-accounts`
2. Verify LinkedIn card shows "Not Connected" status
3. Click "Connect LinkedIn" button
4. Browser should redirect to `https://www.linkedin.com/oauth/v2/authorization`
5. Log in to LinkedIn if not already logged in
6. Click "Allow" to authorize DeepStation
7. Browser should redirect back to `/dashboard/settings/social-accounts?success=LinkedIn connected successfully`
8. Verify success message displayed
9. Verify LinkedIn card now shows "Connected" status
10. Verify connection details shown:
    - Connected date
    - Token expiration (should be ~60 days from now)
    - Days until expiration

**Expected Results:**
- ✅ Redirect to LinkedIn authorization page
- ✅ Successful authorization
- ✅ Callback handled correctly
- ✅ Token stored in database
- ✅ Success message displayed
- ✅ Connection status updated

**Database Verification:**
```sql
SELECT platform, expires_at, refresh_token IS NOT NULL as has_refresh_token
FROM oauth_tokens
WHERE platform = 'linkedin';
```

**Expected:** 1 row, `has_refresh_token = true`, `expires_at` ~60 days in future

**Console Logs to Check:**
```
[LinkedIn OAuth] Initiation request received
[LinkedIn OAuth] CSRF state generated and stored
[LinkedIn OAuth] Redirecting to LinkedIn authorization page
[LinkedIn OAuth] Callback received
[LinkedIn OAuth] Processing for user: [user_id]
[LinkedIn OAuth] Token exchange successful
[LinkedIn OAuth] Token expires in: 5184000 seconds (60 days)
[LinkedIn OAuth] Successfully connected LinkedIn for user [user_id]
```

### Test 2: Twitter OAuth Flow (with PKCE)

**Objective:** Verify Twitter OAuth with PKCE implementation

**Steps:**
1. Navigate to social accounts page
2. Click "Connect Twitter" button
3. Authorize on Twitter
4. Verify callback and token storage
5. Check that PKCE was used

**Expected Results:**
- ✅ PKCE challenge generated
- ✅ Code verifier stored in cookie
- ✅ Authorization successful
- ✅ Token exchange includes PKCE verifier
- ✅ Short-lived token (2 hours)
- ✅ Refresh token stored

**Console Logs to Check:**
```
[Twitter OAuth] Initiation request received
[Twitter OAuth] PKCE challenge generated and code verifier stored
[Twitter OAuth] Callback received
[Twitter OAuth] PKCE verifier retrieved successfully
[Twitter OAuth] Token expires in: 7200 seconds (2 hours)
```

**Database Verification:**
```sql
SELECT platform, expires_at, refresh_token IS NOT NULL as has_refresh_token
FROM oauth_tokens
WHERE platform = 'twitter';
```

**Expected:** Token expires in ~2 hours, `has_refresh_token = true`

### Test 3: Instagram OAuth Flow

**Objective:** Verify Instagram Business account OAuth

**Prerequisites:**
- Instagram account converted to Business or Creator
- Account linked to Facebook Page

**Steps:**
1. Click "Connect Instagram"
2. Log in to Facebook
3. Select Instagram Business account
4. Grant permissions
5. Verify callback

**Expected Results:**
- ✅ Facebook login page shown
- ✅ Instagram account selection
- ✅ Permissions granted
- ✅ Token stored (60-day expiration)

**Special Checks:**
- Success message mentions "Business account required"
- Token expires in ~60 days
- May or may not have refresh token (long-lived tokens)

**Console Logs:**
```
[Instagram OAuth] Initiation request received
[Instagram OAuth] Note: Business or Creator account required
[Instagram OAuth] Callback received
[Instagram OAuth] Token exchange successful
[Instagram OAuth] Successfully connected Instagram
```

### Test 4: Discord OAuth Flow

**Objective:** Verify Discord OAuth (simplest platform)

**Steps:**
1. Click "Connect Discord"
2. Authorize Discord application
3. Select server permissions
4. Verify connection

**Expected Results:**
- ✅ Discord authorization page
- ✅ Server selection (if applicable)
- ✅ Token stored with far-future expiration
- ✅ Success message mentions webhooks

**Console Logs:**
```
[Discord OAuth] Initiation request received
[Discord OAuth] Callback received
[Discord OAuth] Token exchange successful
[Discord OAuth] Successfully connected Discord
```

**Database Verification:**
```sql
SELECT platform, expires_at
FROM oauth_tokens
WHERE platform = 'discord';
```

**Expected:** Very far future expiration date (Discord tokens don't expire)

### Test 5: CSRF Attack Prevention

**Objective:** Verify state parameter validation prevents CSRF

**Steps:**
1. Initiate LinkedIn OAuth
2. Before completing, copy callback URL
3. Modify `state` parameter in URL
4. Visit modified URL
5. Verify rejection

**Expected Results:**
- ❌ Connection rejected
- ❌ Error: "Invalid authentication request"
- ✅ Cookies cleaned up
- ✅ Redirect to settings with error

**Console Logs:**
```
[LinkedIn OAuth] Invalid state or platform mismatch
```

### Test 6: Token Expiration Warning

**Objective:** Verify expiration warnings shown

**Manual Database Update:**
```sql
-- Set token to expire in 5 days
UPDATE oauth_tokens
SET expires_at = NOW() + INTERVAL '5 days'
WHERE platform = 'linkedin';
```

**Steps:**
1. Refresh social accounts page
2. Verify yellow "Expiring Soon" badge
3. Verify warning message displayed

**Expected Results:**
- ⚠️ Yellow badge shown
- ⚠️ "Expiring Soon" status
- ⚠️ Warning message: "Your LinkedIn token expires in 5 days. Consider reconnecting."

### Test 7: Expired Token Handling

**Objective:** Verify expired token display and reconnect

**Manual Database Update:**
```sql
-- Set token to expired
UPDATE oauth_tokens
SET expires_at = NOW() - INTERVAL '1 day'
WHERE platform = 'linkedin';
```

**Steps:**
1. Refresh page
2. Verify "Expired" status
3. Click "Reconnect" button
4. Complete OAuth flow again
5. Verify token updated

**Expected Results:**
- 🔴 Red "Expired" badge
- 🔴 "Reconnect" button shown
- ✅ Reconnect initiates new OAuth flow
- ✅ Token updated in database

### Test 8: Disconnect Flow

**Objective:** Verify disconnect removes tokens

**Steps:**
1. With a connected platform, click "Disconnect"
2. Click "Confirm" on confirmation dialog
3. Verify success message
4. Verify status changes to "Not Connected"

**Expected Results:**
- ✅ Confirmation dialog shown
- ✅ Token deleted from database
- ✅ Success message displayed
- ✅ Card shows "Not Connected"

**Database Verification:**
```sql
SELECT COUNT(*) FROM oauth_tokens WHERE platform = 'linkedin';
```

**Expected:** 0 rows

### Test 9: Multiple Platforms Connected

**Objective:** Verify all platforms can be connected simultaneously

**Steps:**
1. Connect all 4 platforms (LinkedIn, Twitter, Instagram, Discord)
2. Verify summary cards show correct counts
3. Verify all 4 platform cards show "Connected"

**Expected Results:**
- ✅ "Connected: 4" summary card
- ✅ All 4 platforms show green "Connected" badge
- ✅ Each has unique expiration dates
- ✅ No errors or conflicts

**Database Verification:**
```sql
SELECT platform, COUNT(*)
FROM oauth_tokens
GROUP BY platform;
```

**Expected:** 4 rows, one for each platform

### Test 10: Error Scenarios

#### 10a: User Denies Authorization

**Steps:**
1. Click "Connect LinkedIn"
2. On LinkedIn page, click "Cancel" or "Deny"
3. Verify error handling

**Expected:**
- ❌ Redirect to settings with error
- ❌ Error message: "LinkedIn: access_denied"
- ✅ No token stored in database

#### 10b: Missing Environment Variables

**Steps:**
1. Remove `LINKEDIN_CLIENT_ID` from `.env.local`
2. Restart server
3. Try to connect LinkedIn
4. Verify error

**Expected:**
- ❌ Error: "LinkedIn OAuth is not configured..."
- ✅ No redirect to LinkedIn
- ✅ Clear error message to developer

#### 10c: Invalid Redirect URI

**Steps:**
1. Change redirect URI in LinkedIn app settings
2. Try to connect
3. Verify LinkedIn error

**Expected:**
- ❌ LinkedIn shows "redirect_uri_mismatch" error
- ✅ Error logged in console
- ✅ User redirected back with error

### Test 11: Token Refresh

**Objective:** Verify automatic token refresh

**Manual Database Update:**
```sql
-- Set token to expire in 4 minutes (within refresh buffer)
UPDATE oauth_tokens
SET expires_at = NOW() + INTERVAL '4 minutes'
WHERE platform = 'linkedin' AND refresh_token IS NOT NULL;
```

**Code to Test:**
```typescript
// In an API route
import { getValidOAuthToken } from '@/lib/auth/oauth-tokens';

const token = await getValidOAuthToken(userId, 'linkedin');
// Should trigger refresh automatically
```

**Expected Results:**
- ✅ Refresh token API called
- ✅ New access token received
- ✅ Database updated with new token
- ✅ New expiration date set

**Console Logs:**
```
Token expired for linkedin, attempting refresh...
Refreshing token for linkedin...
Token refreshed successfully for linkedin
```

### Test 12: Concurrent Users

**Objective:** Verify row-level security works

**Steps:**
1. Connect LinkedIn with User A
2. Log in as User B
3. Try to access User A's tokens via API
4. Verify denial

**Database Test:**
```sql
-- As User B, try to access User A's tokens
-- Should return empty due to RLS
SELECT * FROM oauth_tokens WHERE user_id != auth.uid();
```

**Expected:** Empty result set (RLS blocks access)

### Test 13: Token Encryption

**Objective:** Verify tokens are encrypted at rest

**Database Inspection:**
```sql
SELECT access_token FROM oauth_tokens LIMIT 1;
```

**Expected:**
- Token is NOT plain text
- Format: `[hex_iv]:[hex_auth_tag]:[hex_salt]:[hex_encrypted_data]`
- Cannot be used directly without decryption

**Decryption Test:**
```typescript
import { decrypt } from '@/lib/auth/encryption';

const encryptedToken = "..."; // From database
const decrypted = decrypt(encryptedToken);
// Should return original access token
```

### Test 14: Platform Status Endpoint

**Objective:** Test `/api/auth/status` endpoint

**Request:**
```bash
curl http://localhost:3000/api/auth/status \
  -H "Cookie: [your_session_cookie]"
```

**Expected Response:**
```json
{
  "userId": "user-uuid",
  "connectedPlatforms": {
    "linkedin": true,
    "instagram": false,
    "twitter": true,
    "discord": false
  },
  "totalConnected": 2
}
```

### Test 15: Accounts Detail Endpoint

**Objective:** Test `/api/auth/accounts` endpoint

**Request:**
```bash
curl http://localhost:3000/api/auth/accounts \
  -H "Cookie: [your_session_cookie]"
```

**Expected Response:**
```json
{
  "userId": "user-uuid",
  "accounts": [
    {
      "platform": "linkedin",
      "isConnected": true,
      "providerUserId": "...",
      "expiresAt": "2025-12-04T...",
      "createdAt": "2025-10-04T...",
      "updatedAt": "2025-10-04T...",
      "isExpired": false,
      "daysUntilExpiration": 60
    },
    // ... other platforms
  ]
}
```

## Performance Tests

### Test 16: Token Retrieval Speed

**Objective:** Verify token retrieval is fast

```typescript
import { getOAuthToken } from '@/lib/auth/oauth-tokens';

console.time('token-retrieval');
const token = await getOAuthToken(userId, 'linkedin');
console.timeEnd('token-retrieval');
// Should be < 100ms
```

### Test 17: Concurrent OAuth Flows

**Objective:** Multiple users connecting simultaneously

**Steps:**
1. Have 3 users start OAuth flows at same time
2. Verify all complete successfully
3. Check for race conditions

**Expected:**
- ✅ All 3 connections successful
- ✅ No database conflicts
- ✅ Unique state parameters for each

## Security Tests

### Test 18: HTTPS Enforcement (Production)

**Environment:** Production

**Steps:**
1. Try to initiate OAuth over HTTP
2. Verify redirect to HTTPS
3. Check cookie `secure` flag

**Expected:**
- ✅ Redirect to HTTPS
- ✅ Cookies have `secure` flag
- ✅ Error if HTTPS not available

### Test 19: Cookie Security

**Steps:**
1. Inspect state cookie in browser DevTools
2. Verify cookie attributes

**Expected Cookie Attributes:**
- ✅ `httpOnly: true`
- ✅ `sameSite: lax`
- ✅ `secure: true` (in production)
- ✅ `maxAge: 600` (10 minutes)

### Test 20: SQL Injection Prevention

**Steps:**
1. Try to inject SQL in platform parameter
2. Verify sanitization

**Request:**
```bash
curl "http://localhost:3000/api/auth/connect?platform=linkedin';DROP TABLE oauth_tokens;--"
```

**Expected:**
- ❌ Request rejected
- ❌ Error: "Invalid platform"
- ✅ No SQL executed

## Load Tests

### Test 21: Token Refresh Under Load

**Objective:** Test refresh performance with many tokens

**Setup:**
```sql
-- Create 1000 expiring tokens
INSERT INTO oauth_tokens (user_id, platform, access_token, refresh_token, expires_at)
SELECT
  gen_random_uuid(),
  'linkedin',
  'encrypted_token',
  'encrypted_refresh',
  NOW() + INTERVAL '1 minute'
FROM generate_series(1, 1000);
```

**Test:** Trigger refresh for all and measure time

## Browser Compatibility Tests

### Test 22: Cross-Browser OAuth

**Browsers to Test:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Test in Each:**
1. Connect LinkedIn
2. Verify OAuth flow
3. Check cookie storage
4. Verify redirect handling

## Mobile Tests

### Test 23: Mobile OAuth Flow

**Devices to Test:**
- [ ] iOS Safari
- [ ] Android Chrome

**Steps:**
1. Navigate to social accounts page
2. Connect platform
3. Verify mobile-friendly authorization page
4. Complete flow
5. Verify redirect back to app

## Automated Test Script

```bash
#!/bin/bash
# Run automated OAuth tests

echo "Testing OAuth Configuration..."

# Test 1: Check environment variables
if [ -z "$LINKEDIN_CLIENT_ID" ]; then
  echo "❌ LINKEDIN_CLIENT_ID not set"
else
  echo "✅ LinkedIn configured"
fi

# Test 2: Check database
psql -c "SELECT COUNT(*) FROM oauth_tokens;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Database table exists"
else
  echo "❌ Database table missing"
fi

# Test 3: Check encryption key
if [ ${#ENCRYPTION_KEY} -eq 32 ]; then
  echo "✅ Encryption key valid"
else
  echo "❌ Encryption key must be 32 characters"
fi

# More tests...
```

## Test Results Template

### Test Session: [Date]

| Test | Platform | Status | Notes |
|------|----------|--------|-------|
| OAuth Flow | LinkedIn | ✅ | - |
| OAuth Flow | Twitter | ✅ | - |
| OAuth Flow | Instagram | ❌ | Business account error |
| OAuth Flow | Discord | ✅ | - |
| Token Refresh | LinkedIn | ✅ | - |
| CSRF Protection | All | ✅ | - |
| Encryption | All | ✅ | - |
| Disconnect | All | ✅ | - |

**Overall Status:** 87.5% Pass Rate

**Issues Found:**
1. Instagram requires Business account (documentation updated)

**Action Items:**
- [ ] Update Instagram documentation
- [ ] Add Business account check before OAuth

## Continuous Testing

### Daily Checks
- [ ] Test one platform OAuth flow
- [ ] Check token expiration warnings
- [ ] Verify no expired tokens in production

### Weekly Checks
- [ ] Test all platforms
- [ ] Review error logs
- [ ] Check token refresh success rate

### Monthly Checks
- [ ] Full security audit
- [ ] Performance testing
- [ ] Update platform API documentation

## Conclusion

A comprehensive test of the OAuth system should cover:
- ✅ All 4 platforms (LinkedIn, Twitter, Instagram, Discord)
- ✅ Complete OAuth flows
- ✅ Error scenarios
- ✅ Security features (CSRF, encryption, RLS)
- ✅ Token lifecycle (refresh, expiration)
- ✅ UI/UX flows
- ✅ Database integrity
- ✅ Performance under load

Use this guide to validate the OAuth implementation before deploying to production.
