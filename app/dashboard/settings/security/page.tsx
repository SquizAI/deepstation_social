'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SecurityPage() {
  const supabase = createClient();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setIsChangingPassword(false);
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      setIsChangingPassword(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Failed to update password. Please try again.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      setMessage({ type: 'success', text: 'Signed out from all devices' });
    } catch (error) {
      console.error('Error signing out:', error);
      setMessage({ type: 'error', text: 'Failed to sign out from all devices' });
    }
  };

  const sessions = [
    {
      id: '1',
      device: 'Chrome on MacOS',
      location: 'Miami, FL',
      lastActive: '2 minutes ago',
      current: true,
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'Miami, FL',
      lastActive: '2 hours ago',
      current: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Security Settings</h2>
        <p className="text-slate-400">Manage your account security and authentication</p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-300'
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">{message.type === 'success' ? '✓' : '⚠'}</span>
            <p className="text-sm">{message.text}</p>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto hover:opacity-80 transition-opacity"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <Label htmlFor="current-password" className="text-slate-300">
              Current Password
            </Label>
            <Input
              id="current-password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-slate-500"
              placeholder="Enter current password"
              required
            />
          </div>
          <div>
            <Label htmlFor="new-password" className="text-slate-300">
              New Password
            </Label>
            <Input
              id="new-password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-slate-500"
              placeholder="Enter new password (min 8 characters)"
              required
            />
          </div>
          <div>
            <Label htmlFor="confirm-password" className="text-slate-300">
              Confirm New Password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-slate-500"
              placeholder="Confirm new password"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isChangingPassword}
            className="bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:opacity-90 transition-opacity"
          >
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-slate-400">
              Add an extra layer of security to your account
            </p>
          </div>
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full border border-yellow-500/30">
            Not Enabled
          </span>
        </div>
        <Button
          variant="default"
          className="border-white/20 text-slate-300 hover:bg-white/5"
        >
          Enable Two-Factor Auth
        </Button>
      </div>

      {/* Active Sessions */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Active Sessions</h3>
            <p className="text-sm text-slate-400">Manage devices where you're signed in</p>
          </div>
          <Button
            onClick={handleSignOutAllDevices}
            variant="default"
            className="border-red-500/30 text-red-300 hover:bg-red-500/10"
          >
            Sign Out All
          </Button>
        </div>
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-fuchsia-500/20 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-fuchsia-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{session.device}</span>
                    {session.current && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs font-medium rounded-full border border-green-500/30">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">{session.location}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Last active: {session.lastActive}
                  </div>
                </div>
              </div>
              {!session.current && (
                <Button
                  variant="default"
                  size="sm"
                  className="border-white/20 text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300"
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Account Security Tips */}
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-2">Security Best Practices</h3>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Use a strong, unique password with at least 12 characters</li>
              <li>• Enable two-factor authentication for added security</li>
              <li>• Regularly review active sessions and revoke unknown devices</li>
              <li>• Never share your password or 2FA codes with anyone</li>
              <li>• Update your password every 3-6 months</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-300 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 border border-red-500/20 rounded-lg">
            <div>
              <div className="text-sm font-medium text-white mb-1">Delete Account</div>
              <div className="text-xs text-slate-400">
                Permanently delete your account and all data. This action cannot be undone.
              </div>
            </div>
            <Button
              variant="default"
              className="border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
