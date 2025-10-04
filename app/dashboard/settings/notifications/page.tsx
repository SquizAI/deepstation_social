'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

interface NotificationPreferences {
  post_published: boolean;
  token_expiration: boolean;
  weekly_digest: boolean;
  speaker_reminders: boolean;
}

export default function NotificationsPage() {
  const supabase = createClient();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    post_published: true,
    token_expiration: true,
    weekly_digest: true,
    speaker_reminders: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          post_published: data.post_published,
          token_expiration: data.token_expiration,
          weekly_digest: data.weekly_digest,
          speaker_reminders: data.speaker_reminders,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load notification preferences' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase.from('notification_preferences').upsert(
        {
          user_id: user.id,
          post_published: preferences.post_published,
          token_expiration: preferences.token_expiration,
          weekly_digest: preferences.weekly_digest,
          speaker_reminders: preferences.speaker_reminders,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({
        type: 'error',
        text: 'Failed to save preferences. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="h-20 bg-white/10 rounded"></div>
          <div className="h-20 bg-white/10 rounded"></div>
          <div className="h-20 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  const notificationSettings = [
    {
      key: 'post_published' as const,
      title: 'Post Published',
      description: 'Receive email notifications when your posts are successfully published',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      key: 'token_expiration' as const,
      title: 'Token Expiration Warnings',
      description: 'Get notified when your OAuth tokens are about to expire (7 days before)',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    {
      key: 'weekly_digest' as const,
      title: 'Weekly Analytics Digest',
      description: 'Receive a weekly summary of your post performance and engagement metrics',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      key: 'speaker_reminders' as const,
      title: 'Speaker Event Reminders',
      description: 'Get reminders about upcoming speaker events and announcements',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Email Notifications</h2>
        <p className="text-slate-400">
          Manage your email notification preferences and stay updated
        </p>
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

      {/* Notification Settings */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl divide-y divide-white/10">
        {notificationSettings.map((setting) => (
          <div key={setting.key} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0 w-10 h-10 bg-fuchsia-500/20 rounded-lg flex items-center justify-center text-fuchsia-400">
                  {setting.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white mb-1">
                    {setting.title}
                  </h3>
                  <p className="text-sm text-slate-400">{setting.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(setting.key)}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 focus:ring-offset-slate-900
                  ${preferences[setting.key] ? 'bg-fuchsia-500' : 'bg-slate-700'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                    transition duration-200 ease-in-out
                    ${preferences[setting.key] ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-2">
              Email Delivery Information
            </h3>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Notifications are sent to your registered email address</li>
              <li>• You can unsubscribe from specific types of notifications at any time</li>
              <li>• Critical security alerts will always be sent regardless of preferences</li>
              <li>
                • Weekly digests are sent every Monday at 9:00 AM in your local timezone
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:opacity-90 transition-opacity"
        >
          {isSaving ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
        <Button
          onClick={loadPreferences}
          variant="outline"
          className="border-white/20 text-slate-300 hover:bg-white/5"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
