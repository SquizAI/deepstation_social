'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProfileData {
  full_name: string;
  email: string;
  bio: string;
  company: string;
  website: string;
  location: string;
  avatar_url: string;
}

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    bio: '',
    company: '',
    website: '',
    location: '',
    avatar_url: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);

      // Get user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setProfile({
        full_name: profileData?.full_name || '',
        email: user.email || '',
        bio: profileData?.bio || '',
        company: profileData?.company || '',
        website: profileData?.website || '',
        location: profileData?.location || '',
        avatar_url: profileData?.avatar_url || '',
      });

      if (profileData?.avatar_url) {
        setAvatarPreview(profileData.avatar_url);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-photos').getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      let avatarUrl = profile.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(user.id);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            full_name: profile.full_name,
            bio: profile.bio,
            company: profile.company,
            website: profile.website,
            location: profile.location,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (error) {
        throw error;
      }

      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
      setAvatarFile(null);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="h-32 bg-white/10 rounded"></div>
          <div className="h-32 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-300'
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">
              {message.type === 'success' ? '✓' : '⚠'}
            </span>
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar Upload */}
        <div>
          <Label className="text-slate-300 mb-3 block">Profile Photo</Label>
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <label
                htmlFor="avatar-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-slate-300 hover:bg-white/10 transition-all cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Upload Photo
              </label>
              <p className="text-xs text-slate-400 mt-2">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <Label htmlFor="full_name" className="text-slate-300">
            Full Name
          </Label>
          <Input
            id="full_name"
            type="text"
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-slate-500"
            placeholder="Enter your full name"
          />
        </div>

        {/* Email (Read-only) */}
        <div>
          <Label htmlFor="email" className="text-slate-300">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            disabled
            className="mt-2 bg-white/5 border-white/20 text-slate-400 cursor-not-allowed"
          />
          <p className="text-xs text-slate-500 mt-1">
            Email cannot be changed. Contact support if needed.
          </p>
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio" className="text-slate-300">
            Bio
          </Label>
          <Textarea
            id="bio"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={4}
            className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-slate-500 resize-none"
            placeholder="Tell us about yourself..."
          />
        </div>

        {/* Company */}
        <div>
          <Label htmlFor="company" className="text-slate-300">
            Company
          </Label>
          <Input
            id="company"
            type="text"
            value={profile.company}
            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
            className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-slate-500"
            placeholder="Your company name"
          />
        </div>

        {/* Website */}
        <div>
          <Label htmlFor="website" className="text-slate-300">
            Website
          </Label>
          <Input
            id="website"
            type="url"
            value={profile.website}
            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
            className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-slate-500"
            placeholder="https://example.com"
          />
        </div>

        {/* Location */}
        <div>
          <Label htmlFor="location" className="text-slate-300">
            Location
          </Label>
          <Input
            id="location"
            type="text"
            value={profile.location}
            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-slate-500"
            placeholder="City, Country"
          />
        </div>

        {/* Save Button */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
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
              'Save Changes'
            )}
          </Button>
          <Button
            type="button"
            onClick={loadProfile}
            variant="outline"
            className="border-white/20 text-slate-300 hover:bg-white/5"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
