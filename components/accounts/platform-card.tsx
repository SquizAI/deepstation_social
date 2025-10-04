'use client';

import { Platform } from '@/lib/types/oauth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export interface PlatformCardProps {
  platform: Platform;
  isConnected: boolean;
  providerUserId?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isExpired?: boolean;
  daysUntilExpiration?: number;
  onConnect: (platform: Platform) => void;
  onDisconnect: (platform: Platform) => void;
  onReconnect: (platform: Platform) => void;
}

const PLATFORM_CONFIG = {
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-[#0A66C2]',
    hoverColor: 'hover:bg-[#004182]',
    borderColor: 'border-[#0A66C2]',
  },
  instagram: {
    name: 'Instagram',
    icon: '📸',
    color: 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600',
    hoverColor: 'hover:opacity-90',
    borderColor: 'border-pink-600',
  },
  twitter: {
    name: 'X (Twitter)',
    icon: '𝕏',
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-800',
    borderColor: 'border-black',
  },
  discord: {
    name: 'Discord',
    icon: '💬',
    color: 'bg-[#5865F2]',
    hoverColor: 'hover:bg-[#4752C4]',
    borderColor: 'border-[#5865F2]',
  },
};

export function PlatformCard({
  platform,
  isConnected,
  providerUserId,
  expiresAt,
  createdAt,
  updatedAt,
  isExpired,
  daysUntilExpiration,
  onConnect,
  onDisconnect,
  onReconnect,
}: PlatformCardProps) {
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const config = PLATFORM_CONFIG[platform];

  const getStatusBadge = () => {
    if (!isConnected) {
      return <Badge variant="default">Not Connected</Badge>;
    }

    if (isExpired) {
      return <Badge variant="error">Expired</Badge>;
    }

    if (daysUntilExpiration !== undefined && daysUntilExpiration <= 7) {
      return <Badge variant="warning">Expiring Soon</Badge>;
    }

    return <Badge variant="success">Connected</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDisconnect = () => {
    setShowConfirmDisconnect(false);
    onDisconnect(platform);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center text-2xl`}
            >
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{config.name}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {isConnected ? 'Account Connected' : 'Connect your account'}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Details */}
        {isConnected && (
          <div className="space-y-2 text-sm">
            {providerUserId && (
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="font-mono text-xs">{providerUserId.substring(0, 12)}...</span>
              </div>
            )}

            {createdAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Connected:</span>
                <span className="font-medium">{formatDate(createdAt)}</span>
              </div>
            )}

            {updatedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">{formatDate(updatedAt)}</span>
              </div>
            )}

            {expiresAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Token Expires:</span>
                <span className={`font-medium ${isExpired ? 'text-red-600' : daysUntilExpiration !== undefined && daysUntilExpiration <= 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {isExpired ? 'Expired' : formatDate(expiresAt)}
                </span>
              </div>
            )}

            {!isExpired && daysUntilExpiration !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Days Remaining:</span>
                <span className={`font-bold ${daysUntilExpiration <= 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {daysUntilExpiration}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!isConnected ? (
            <Button
              onClick={() => onConnect(platform)}
              className={`w-full ${config.color} ${config.hoverColor} text-white`}
            >
              Connect {config.name}
            </Button>
          ) : (
            <>
              {isExpired && (
                <Button
                  onClick={() => onReconnect(platform)}
                  className={`flex-1 ${config.color} ${config.hoverColor} text-white`}
                >
                  Reconnect
                </Button>
              )}
              {!showConfirmDisconnect ? (
                <Button
                  onClick={() => setShowConfirmDisconnect(true)}
                  variant="outline"
                  className={`flex-1 ${config.borderColor} text-gray-700 hover:bg-red-50`}
                >
                  Disconnect
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                  >
                    Confirm
                  </Button>
                  <Button
                    onClick={() => setShowConfirmDisconnect(false)}
                    variant="ghost"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Warning Messages */}
        {isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
            <p className="font-medium">Token Expired</p>
            <p className="text-xs mt-1">
              Your {config.name} token has expired. Reconnect to continue posting.
            </p>
          </div>
        )}

        {!isExpired && daysUntilExpiration !== undefined && daysUntilExpiration <= 7 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
            <p className="font-medium">Token Expiring Soon</p>
            <p className="text-xs mt-1">
              Your {config.name} token expires in {daysUntilExpiration} days. Consider reconnecting.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
