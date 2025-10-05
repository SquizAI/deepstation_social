'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    website_url: '',
    brand_color: '#6366f1',
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to create an organization');
        setLoading(false);
        return;
      }

      // Check if slug is available
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', formData.slug)
        .single();

      if (existingOrg) {
        setError('This organization slug is already taken. Please choose another.');
        setLoading(false);
        return;
      }

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          website_url: formData.website_url || null,
          brand_color: formData.brand_color,
          is_active: true,
        })
        .select()
        .single();

      if (orgError) {
        throw orgError;
      }

      // Add user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          joined_at: new Date().toISOString(),
          is_active: true,
        });

      if (memberError) {
        throw memberError;
      }

      // Redirect to organization dashboard
      router.push(`/dashboard/organization/${org.slug}`);
    } catch (err: any) {
      console.error('Error creating organization:', err);
      setError(err.message || 'Failed to create organization');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Organization</h1>
        <p className="text-gray-400">
          Set up your organization to start hosting events and selling tickets
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Organization Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white">
            Organization Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="DeepStation AI"
            required
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
          <p className="text-xs text-gray-400">
            The public name of your organization
          </p>
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug" className="text-white">
            URL Slug *
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">deepstation.ai/</span>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
              placeholder="deepstation-ai"
              required
              pattern="[a-z0-9-]+"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <p className="text-xs text-gray-400">
            Must be lowercase letters, numbers, and hyphens only
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-white">
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="AI-powered platform for events, content creation, and automation"
            rows={3}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
          <p className="text-xs text-gray-400">
            A brief description of your organization
          </p>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website_url" className="text-white">
            Website URL
          </Label>
          <Input
            id="website_url"
            type="url"
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            placeholder="https://deepstation.ai"
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Brand Color */}
        <div className="space-y-2">
          <Label htmlFor="brand_color" className="text-white">
            Brand Color
          </Label>
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
              placeholder="#6366f1"
              pattern="^#[0-9A-Fa-f]{6}$"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 flex-1"
            />
          </div>
          <p className="text-xs text-gray-400">
            Primary color for your organization's branding
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="flex-1 border-white/10 hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              'Create Organization'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
