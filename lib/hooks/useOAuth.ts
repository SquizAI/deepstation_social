'use client';

import { useState, useEffect, useCallback } from 'react';
import { Platform } from '@/lib/types/oauth';

interface PlatformStatus {
  linkedin: boolean;
  instagram: boolean;
  twitter: boolean;
  discord: boolean;
}

interface OAuthStatus {
  userId: string;
  connectedPlatforms: PlatformStatus;
  totalConnected: number;
}

interface UseOAuthReturn {
  status: OAuthStatus | null;
  isLoading: boolean;
  error: string | null;
  isConnected: (platform: Platform) => boolean;
  connect: (platform: Platform) => void;
  disconnect: (platform: Platform) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * React hook for managing OAuth platform connections
 *
 * @example
 * ```tsx
 * function SocialConnections() {
 *   const { status, isConnected, connect, disconnect, isLoading } = useOAuth();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {!isConnected('linkedin') ? (
 *         <button onClick={() => connect('linkedin')}>Connect LinkedIn</button>
 *       ) : (
 *         <button onClick={() => disconnect('linkedin')}>Disconnect LinkedIn</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOAuth(): UseOAuthReturn {
  const [status, setStatus] = useState<OAuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current OAuth connection status
   */
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/status');

      if (!response.ok) {
        throw new Error('Failed to fetch OAuth status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching OAuth status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initial load
   */
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /**
   * Check if a platform is connected
   */
  const isConnected = useCallback(
    (platform: Platform): boolean => {
      return status?.connectedPlatforms[platform] ?? false;
    },
    [status]
  );

  /**
   * Initiate OAuth connection flow for a platform
   */
  const connect = useCallback((platform: Platform) => {
    // Redirect to OAuth connect endpoint
    window.location.href = `/api/auth/connect?platform=${platform}`;
  }, []);

  /**
   * Disconnect a platform
   */
  const disconnect = useCallback(
    async (platform: Platform) => {
      try {
        setError(null);

        const response = await fetch(`/api/auth/disconnect?platform=${platform}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to disconnect ${platform}`);
        }

        // Refresh status after disconnect
        await fetchStatus();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error(`Error disconnecting ${platform}:`, err);
        throw err;
      }
    },
    [fetchStatus]
  );

  /**
   * Manually refresh status
   */
  const refresh = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    isLoading,
    error,
    isConnected,
    connect,
    disconnect,
    refresh,
  };
}
