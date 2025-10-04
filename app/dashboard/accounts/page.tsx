'use client';

import { useEffect, useState } from 'react';
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

export default function ConnectedAccountsPage() {
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
  }, []);

  const handleConnect = (platform: Platform) => {
    setSuccessMessage(null);
    setError(null);
    connect(platform);
  };

  const handleDisconnect = async (platform: Platform) => {
    try {
      setSuccessMessage(null);
      setError(null);
      await disconnect(platform);
      setSuccessMessage(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected successfully`);
      // Refresh the accounts list
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
      console.error('Error disconnecting:', err);
    }
  };

  const handleReconnect = (platform: Platform) => {
    setSuccessMessage(null);
    setError(null);
    connect(platform);
  };

  const connectedCount = accounts.filter((acc) => acc.isConnected).length;
  const expiredCount = accounts.filter((acc) => acc.isExpired).length;
  const expiringCount = accounts.filter(
    (acc) => !acc.isExpired && acc.daysUntilExpiration !== undefined && acc.daysUntilExpiration <= 7
  ).length;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Connected Accounts</h1>
        <p className="text-gray-600">
          Manage your social media platform connections for posting and scheduling
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{connectedCount}</div>
          <div className="text-sm text-gray-600">Connected Accounts</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-400">{4 - connectedCount}</div>
          <div className="text-sm text-gray-600">Not Connected</div>
        </div>
        {expiredCount > 0 && (
          <div className="bg-white border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{expiredCount}</div>
            <div className="text-sm text-gray-600">Expired Tokens</div>
          </div>
        )}
        {expiringCount > 0 && (
          <div className="bg-white border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{expiringCount}</div>
            <div className="text-sm text-gray-600">Expiring Soon</div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <div className="flex-shrink-0 text-green-600 mr-3 text-xl">✓</div>
          <div>
            <h3 className="font-medium text-green-900">Success</h3>
            <p className="text-sm text-green-700 mt-1">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <div className="flex-shrink-0 text-red-600 mr-3 text-xl">⚠</div>
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Platform Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              About Connected Accounts
            </h2>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                Connect your social media accounts to enable posting and scheduling across platforms.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Tokens are securely encrypted and stored</li>
                <li>LinkedIn and Instagram tokens expire after 60 days</li>
                <li>Twitter tokens expire after 2 hours (auto-refreshed)</li>
                <li>Discord tokens do not expire</li>
                <li>You'll be notified when tokens are about to expire</li>
              </ul>
              <p className="mt-3">
                <strong>Having issues?</strong> Try disconnecting and reconnecting your account.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
