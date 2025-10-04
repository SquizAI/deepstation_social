'use client';

import { Platform } from '@/lib/types/oauth';
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
    gradient: 'from-[#0A66C2] to-[#004182]',
    iconBg: 'bg-gradient-to-br from-[#0A66C2] to-[#004182]',
    borderGlow: 'group-hover:shadow-[0_0_30px_rgba(10,102,194,0.3)]',
  },
  instagram: {
    name: 'Instagram',
    icon: '📸',
    gradient: 'from-purple-500 via-pink-500 to-orange-500',
    iconBg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500',
    borderGlow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]',
  },
  twitter: {
    name: 'X (Twitter)',
    icon: '𝕏',
    gradient: 'from-slate-800 to-black',
    iconBg: 'bg-gradient-to-br from-slate-700 to-black',
    borderGlow: 'group-hover:shadow-[0_0_30px_rgba(100,116,139,0.3)]',
  },
  discord: {
    name: 'Discord',
    icon: '💬',
    gradient: 'from-[#5865F2] to-[#4752C4]',
    iconBg: 'bg-gradient-to-br from-[#5865F2] to-[#4752C4]',
    borderGlow: 'group-hover:shadow-[0_0_30px_rgba(88,101,242,0.3)]',
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
      return (
        <span className="px-3 py-1 bg-slate-500/20 text-slate-300 text-xs font-medium rounded-full border border-slate-500/30">
          Not Connected
        </span>
      );
    }

    if (isExpired) {
      return (
        <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs font-medium rounded-full border border-red-500/30">
          Expired
        </span>
      );
    }

    if (daysUntilExpiration !== undefined && daysUntilExpiration <= 7) {
      return (
        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full border border-yellow-500/30">
          Expiring Soon
        </span>
      );
    }

    return (
      <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded-full border border-green-500/30">
        Connected
      </span>
    );
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
    <div className={`group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:border-white/20 transition-all ${config.borderGlow}`}>
      {/* Card Header */}
      <div className="p-4 sm:p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 ${config.iconBg} rounded-xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg`}>
              {config.icon}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">{config.name}</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {isConnected ? 'Account Connected' : 'Connect your account'}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Connection Details */}
        {isConnected && (
          <div className="space-y-2.5 text-xs sm:text-sm">
            {providerUserId && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">User ID:</span>
                <span className="font-mono text-slate-300 text-xs">{providerUserId.substring(0, 12)}...</span>
              </div>
            )}

            {createdAt && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Connected:</span>
                <span className="font-medium text-white">{formatDate(createdAt)}</span>
              </div>
            )}

            {updatedAt && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Last Updated:</span>
                <span className="font-medium text-white">{formatDate(updatedAt)}</span>
              </div>
            )}

            {expiresAt && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Token Expires:</span>
                <span className={`font-medium ${isExpired ? 'text-red-400' : daysUntilExpiration !== undefined && daysUntilExpiration <= 7 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {isExpired ? 'Expired' : formatDate(expiresAt)}
                </span>
              </div>
            )}

            {!isExpired && daysUntilExpiration !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Days Remaining:</span>
                <span className={`font-bold ${daysUntilExpiration <= 7 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {daysUntilExpiration}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!isConnected ? (
            <button
              onClick={() => onConnect(platform)}
              className={`w-full bg-gradient-to-r ${config.gradient} text-white px-4 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg text-sm sm:text-base`}
            >
              Connect {config.name}
            </button>
          ) : (
            <>
              {isExpired && (
                <button
                  onClick={() => onReconnect(platform)}
                  className={`flex-1 bg-gradient-to-r ${config.gradient} text-white px-4 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg text-sm sm:text-base`}
                >
                  Reconnect
                </button>
              )}
              {!showConfirmDisconnect ? (
                <button
                  onClick={() => setShowConfirmDisconnect(true)}
                  className="flex-1 bg-white/5 border border-white/20 text-slate-300 px-4 py-2.5 rounded-lg font-medium hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition-all text-sm sm:text-base"
                >
                  Disconnect
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2.5 rounded-lg font-medium hover:bg-red-500/30 transition-all text-sm sm:text-base"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowConfirmDisconnect(false)}
                    className="flex-1 bg-white/5 border border-white/10 text-slate-300 px-4 py-2.5 rounded-lg font-medium hover:bg-white/10 transition-all text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Warning Messages */}
        {isExpired && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4">
            <p className="font-semibold text-red-300 text-xs sm:text-sm">Token Expired</p>
            <p className="text-xs text-red-400/80 mt-1">
              Your {config.name} token has expired. Reconnect to continue posting.
            </p>
          </div>
        )}

        {!isExpired && daysUntilExpiration !== undefined && daysUntilExpiration <= 7 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4">
            <p className="font-semibold text-yellow-300 text-xs sm:text-sm">Token Expiring Soon</p>
            <p className="text-xs text-yellow-400/80 mt-1">
              Your {config.name} token expires in {daysUntilExpiration} days. Consider reconnecting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
