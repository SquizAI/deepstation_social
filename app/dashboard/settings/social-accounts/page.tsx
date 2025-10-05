'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Platform } from '@/lib/types/oauth';
import { PlatformCard } from '@/components/accounts/platform-card';
import { useOAuth } from '@/lib/hooks/useOAuth';

interface PlatformAccountData {
  platform: Platform;
  isConnected: boolean;
  providerUserId?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isExpired?: boolean;
  daysUntilExpiration?: number;
}

interface AccountsResponse {
  userId: string;
  accounts: PlatformAccountData[];
}

export default function SocialAccountsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<PlatformAccountData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { connect, disconnect } = useOAuth();

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/accounts');

      if (!response.ok) {
        throw new Error('Failed to fetch account data');
      }

      const data: AccountsResponse = await response.json();
      setAccounts(data.accounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();

    // Check for success or error messages from OAuth callbacks
    const success = searchParams.get('success');
    const urlError = searchParams.get('error');

    if (success) {
      setSuccessMessage(success);
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    if (urlError) {
      setError(urlError);
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const handleConnect = async (platform: Platform) => {
    setSuccessMessage(null);
    setError(null);

    try {
      // Check if platform is configured before redirecting
      const checkResponse = await fetch(`/api/auth/connect?platform=${platform}`);

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();
        if (checkResponse.status === 401) {
          setError('Please log in first before connecting social accounts');
          return;
        }
        if (errorData.error?.includes('not configured')) {
          setError(
            `${platform.charAt(0).toUpperCase() + platform.slice(1)} OAuth is not configured. Please add API credentials to environment variables.`
          );
          return;
        }
      }

      // Initiate OAuth flow
      connect(platform);
    } catch (err) {
      setError('Failed to initiate OAuth connection. Please try again.');
      console.error('Connection error:', err);
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    try {
      setSuccessMessage(null);
      setError(null);
      await disconnect(platform);
      setSuccessMessage(
        `${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected successfully`
      );
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
      console.error('Error disconnecting:', err);
    }
  };

  const handleReconnect = (platform: Platform) => {
    setSuccessMessage(null);
    setError(null);
    handleConnect(platform);
  };

  const connectedCount = accounts.filter((acc) => acc.isConnected).length;
  const expiredCount = accounts.filter((acc) => acc.isExpired).length;
  const expiringCount = accounts.filter(
    (acc) =>
      !acc.isExpired &&
      acc.daysUntilExpiration !== undefined &&
      acc.daysUntilExpiration <= 7
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Social Media Accounts</h2>
        <p className="text-slate-400">
          Connect your social media accounts to enable automated posting and scheduling across platforms
        </p>
      </div>

      {/* Connection Status Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
          <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {connectedCount}
          </div>
          <div className="text-xs sm:text-sm text-slate-400 mt-1">Connected</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
          <div className="text-2xl sm:text-3xl font-bold text-slate-400">
            {4 - connectedCount}
          </div>
          <div className="text-xs sm:text-sm text-slate-400 mt-1">Available</div>
        </div>
        {expiredCount > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-red-500/20 rounded-xl p-4 hover:border-red-500/40 transition-all">
            <div className="text-2xl sm:text-3xl font-bold text-red-400">{expiredCount}</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1">Expired</div>
          </div>
        )}
        {expiringCount > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-4 hover:border-yellow-500/40 transition-all">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
              {expiringCount}
            </div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1">Expiring Soon</div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start backdrop-blur-sm">
          <div className="flex-shrink-0 text-green-400 mr-3 text-xl">✓</div>
          <div className="flex-1">
            <h3 className="font-medium text-green-300">Success</h3>
            <p className="text-sm text-green-400/80 mt-1">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-400 hover:text-green-300 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start backdrop-blur-sm">
          <div className="flex-shrink-0 text-red-400 mr-3 text-xl">⚠</div>
          <div className="flex-1">
            <h3 className="font-medium text-red-300">Error</h3>
            <p className="text-sm text-red-400/80 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl h-48 sm:h-64 animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        <>
          {/* Connected Platforms Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Available Platforms</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {accounts.map((account) => (
                <PlatformCard
                  key={account.platform}
                  platform={account.platform}
                  isConnected={account.isConnected}
                  providerUserId={account.providerUserId}
                  expiresAt={account.expiresAt}
                  createdAt={account.createdAt}
                  updatedAt={account.updatedAt}
                  isExpired={account.isExpired}
                  daysUntilExpiration={account.daysUntilExpiration}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onReconnect={handleReconnect}
                />
              ))}
            </div>
          </div>

          {/* Platform Limits & Information */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">
              Platform Rate Limits & Information
            </h3>
            <div className="text-xs sm:text-sm text-slate-300 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 className="font-semibold text-blue-400 mb-2">LinkedIn</h4>
                  <ul className="space-y-1 text-slate-400">
                    <li>• 500 API calls per day per user</li>
                    <li>• Access tokens valid for 60 days</li>
                    <li>• Refresh tokens valid for 1 year</li>
                    <li>• Auto-refresh enabled</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 className="font-semibold text-pink-400 mb-2">Instagram</h4>
                  <ul className="space-y-1 text-slate-400">
                    <li>• 100 posts per 24 hours</li>
                    <li>• Requires Business account</li>
                    <li>• Access tokens valid for 60 days</li>
                    <li>• Container-based publishing</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 className="font-semibold text-slate-300 mb-2">X (Twitter)</h4>
                  <ul className="space-y-1 text-slate-400">
                    <li>• 500 posts per month (Free tier)</li>
                    <li>• OAuth 2.0 with PKCE</li>
                    <li>• Access tokens valid for 2 hours</li>
                    <li>• Auto-refresh enabled</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 className="font-semibold text-indigo-400 mb-2">Discord</h4>
                  <ul className="space-y-1 text-slate-400">
                    <li>• No rate limits via webhooks</li>
                    <li>• Tokens do not expire</li>
                    <li>• Post to channels via webhooks</li>
                    <li>• Instant delivery</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">
              Security & Best Practices
            </h3>
            <div className="text-xs sm:text-sm text-slate-300 space-y-3">
              <p>
                All OAuth connections are secured using industry-standard protocols with end-to-end encryption.
              </p>
              <ul className="list-disc list-inside space-y-1.5 ml-2 text-slate-400">
                <li>Tokens are encrypted at rest using AES-256-GCM</li>
                <li>CSRF protection with state validation on all OAuth flows</li>
                <li>Automatic token refresh before expiration</li>
                <li>Row-level security policies prevent unauthorized access</li>
                <li>HTTPS-only connections in production</li>
                <li>Audit logs for all authentication events</li>
              </ul>
              <div className="pt-2 border-t border-white/10">
                <p className="text-slate-300">
                  <span className="text-fuchsia-400 font-semibold">Need Help?</span> If you experience
                  connection issues, try disconnecting and reconnecting your account. Ensure your social
                  media account has the proper permissions enabled. Contact support if problems persist.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
