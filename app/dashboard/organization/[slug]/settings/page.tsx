'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

export default function OrganizationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [organization, setOrganization] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website_url: '',
    brand_color: '#6366f1',
  });

  useEffect(() => {
    loadOrganization();
  }, [slug]);

  const loadOrganization = async () => {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Get organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_members!inner (
            role,
            user_id
          )
        `)
        .eq('slug', slug)
        .eq('organization_members.user_id', user.id)
        .single();

      if (orgError || !org) {
        setError('Organization not found or you do not have access');
        setLoading(false);
        return;
      }

      // Check if user is owner or admin
      const member = org.organization_members[0];
      if (!member || !['owner', 'admin'].includes(member.role)) {
        setError('You must be an owner or admin to access settings');
        setLoading(false);
        return;
      }

      setOrganization(org);
      setFormData({
        name: org.name,
        description: org.description || '',
        website_url: org.website_url || '',
        brand_color: org.brand_color || '#6366f1',
      });
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading organization:', err);
      setError(err.message || 'Failed to load organization');
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          description: formData.description || null,
          website_url: formData.website_url || null,
          brand_color: formData.brand_color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await loadOrganization();
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: organization.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create onboarding link');
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Error connecting Stripe:', err);
      setError(err.message || 'Failed to connect Stripe account');
      setConnectingStripe(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-fuchsia-400 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error || 'Organization not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Organization Settings</h1>
        <p className="text-gray-400">Manage {organization.name} settings and integrations</p>
      </div>

      {/* Stripe Connect Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Payment Processing</h2>
            <p className="text-sm text-gray-400">
              Connect your Stripe account to accept payments for event tickets
            </p>
          </div>
          {organization.stripe_onboarding_completed ? (
            <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full border border-green-500/30">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-full border border-yellow-500/30">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Not Connected</span>
            </div>
          )}
        </div>

        {organization.stripe_onboarding_completed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <svg className="h-10 w-10 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
              </svg>
              <div className="flex-1">
                <p className="text-white font-medium">Stripe Account Connected</p>
                <p className="text-sm text-gray-400">
                  Account ID: {organization.stripe_account_id}
                </p>
              </div>
              <Button
                onClick={handleConnectStripe}
                variant="outline"
                className="border-white/10 hover:bg-white/5"
                disabled={connectingStripe}
              >
                Manage
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Platform fee: 2.5% of ticket sales • Funds are deposited directly to your Stripe account
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Why connect Stripe?</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Accept credit card payments for event tickets
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Funds deposited directly to your bank account
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Only 2.5% platform fee (plus Stripe's standard fees)
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Automatic refund processing
                </li>
              </ul>
            </div>
            <Button
              onClick={handleConnectStripe}
              className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
              disabled={connectingStripe}
            >
              {connectingStripe ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                  </svg>
                  Connect Stripe Account
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* General Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6 space-y-6">
        <h2 className="text-xl font-semibold text-white">General Settings</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-400 text-sm">
            {success}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name" className="text-white">Organization Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">URL Slug</Label>
          <Input
            value={organization.slug}
            disabled
            className="bg-white/5 border-white/10 text-gray-400"
          />
          <p className="text-xs text-gray-400">Slug cannot be changed after creation</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-white">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website_url" className="text-white">Website URL</Label>
          <Input
            id="website_url"
            type="url"
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand_color" className="text-white">Brand Color</Label>
          <div className="flex items-center gap-3">
            <input
              id="brand_color"
              type="color"
              value={formData.brand_color}
              onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
              className="h-10 w-20 rounded border border-white/10 bg-white/5 cursor-pointer"
            />
            <Input
              value={formData.brand_color}
              onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
              className="bg-white/5 border-white/10 text-white flex-1"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
            className="border-white/10 hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
