'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

export default function SocialConnectionsPage() {
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

    // Check for error in URL params
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(urlError);
    }
  }, [searchParams]);

  const handleConnect = async (platform: Platform) => {
    setSuccessMessage(null);
    setError(null);

    try {
      const checkResponse = await fetch(`/api/auth/connect?platform=${platform}`);

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();
        if (checkResponse.status === 500 && errorData.error?.includes('not configured')) {
          setError(
            `${platform.charAt(0).toUpperCase() + platform.slice(1)} OAuth is not configured yet. Please add your API credentials to .env.local`
          );
          return;
        }
      }

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
        <h2 className="text-2xl font-bold text-white mb-2">Social Media Connections</h2>
        <p className="text-slate-400">
          Connect your social media accounts to enable cross-platform posting
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

          {/* Help Section */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">
              About Social Connections
            </h3>
            <div className="text-xs sm:text-sm text-slate-300 space-y-3">
              <p>
                Connect your social media accounts to enable posting and scheduling across
                platforms.
              </p>
              <ul className="list-disc list-inside space-y-1.5 ml-2 text-slate-400">
                <li>Tokens are securely encrypted and stored</li>
                <li>LinkedIn tokens expire after 60 days</li>
                <li>Instagram tokens expire after 60 days</li>
                <li>Twitter tokens expire after 2 hours (auto-refreshed)</li>
                <li>Discord tokens do not expire</li>
                <li>You'll receive notifications when tokens are about to expire</li>
              </ul>
              <div className="pt-2 border-t border-white/10">
                <p className="text-slate-300">
                  <span className="text-fuchsia-400 font-semibold">Having issues?</span> Try
                  disconnecting and reconnecting your account. If problems persist, contact
                  support.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
