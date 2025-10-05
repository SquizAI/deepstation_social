'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { TagInput } from '@/components/ui/tag-input'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import type { SpeakerForm, PresentationType, EventLocation } from '@/lib/types/speakers'

export default function NewSpeakerPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [isExtractingLogo, setIsExtractingLogo] = React.useState(false)
  const [companyWebsite, setCompanyWebsite] = React.useState('')
  const [companyLogoUrl, setCompanyLogoUrl] = React.useState('')

  const [formData, setFormData] = React.useState<SpeakerForm>({
    fullName: '',
    title: '',
    company: '',
    bio: '',
    profilePhoto: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    website: '',
    presentationTitle: '',
    presentationDescription: '',
    presentationType: 'presentation',
    expertise: [],
    eventDate: new Date(),
    eventLocation: 'Miami',
    highlights: [],
    previousCompanies: []
  })

  const handleInputChange = (field: keyof SpeakerForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleExtractLogo = async () => {
    if (!companyWebsite.trim()) {
      setError('Please enter a company website URL first')
      return
    }

    setIsExtractingLogo(true)
    setError(null)

    try {
      const response = await fetch('/api/scrape/logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: companyWebsite,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to extract logo')
      }

      // Update form with extracted data
      if (result.data?.bestLogoUrl) {
        setCompanyLogoUrl(result.data.bestLogoUrl)
      }

      if (result.data?.companyName && !formData.company) {
        handleInputChange('company', result.data.companyName)
      }

      if (result.data?.description && !formData.bio) {
        handleInputChange('bio', result.data.description)
      }

      // Show success message
      setError(null)
    } catch (err) {
      console.error('Error extracting logo:', err)
      setError(err instanceof Error ? err.message : 'Failed to extract logo')
    } finally {
      setIsExtractingLogo(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null

    const supabase = createClient()
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `speaker-photos/${fileName}`

    const { data, error } = await supabase.storage
      .from('speaker-images')
      .upload(filePath, imageFile)

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`)
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from('speaker-images').getPublicUrl(filePath)

    return publicUrl
  }

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      setError('Full name is required')
      return false
    }
    if (!formData.title.trim()) {
      setError('Title is required')
      return false
    }
    if (!formData.company.trim()) {
      setError('Company is required')
      return false
    }
    if (!formData.bio.trim()) {
      setError('Bio is required')
      return false
    }
    if (!formData.presentationTitle.trim()) {
      setError('Presentation title is required')
      return false
    }
    if (!formData.presentationDescription.trim()) {
      setError('Presentation description is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to create a speaker')
      }

      // Upload image if provided
      let profilePhotoUrl = formData.profilePhoto
      if (imageFile) {
        profilePhotoUrl = (await uploadImage()) || ''
      }

      // Insert speaker into database
      const { data: speaker, error: insertError } = await supabase
        .from('speakers')
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          title: formData.title,
          company: formData.company,
          bio: formData.bio,
          profile_photo_url: profilePhotoUrl,
          company_logo_url: companyLogoUrl || null,
          linkedin: formData.linkedin || null,
          twitter: formData.twitter || null,
          instagram: formData.instagram || null,
          website: formData.website || null,
          presentation_title: formData.presentationTitle,
          presentation_description: formData.presentationDescription,
          presentation_type: formData.presentationType,
          expertise: formData.expertise,
          event_date: formData.eventDate.toISOString(),
          event_location: formData.eventLocation,
          highlights: formData.highlights && formData.highlights.length > 0 ? formData.highlights : null,
          previous_companies:
            formData.previousCompanies && formData.previousCompanies.length > 0
              ? formData.previousCompanies
              : null
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to save speaker: ${insertError.message}`)
      }

      // Navigate to preview page to generate announcements
      router.push(`/dashboard/speakers/preview/${speaker.id}`)
    } catch (err) {
      console.error('Error creating speaker:', err)
      setError(err instanceof Error ? err.message : 'Failed to create speaker')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-4 sm:p-6 lg:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-fuchsia-500/10 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      <div className="relative max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Add New Speaker</h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Fill in the speaker details to generate social media announcements
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-red-300">{error}</p>
          </div>
        )}

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Personal Information */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
          <h2 className="text-xl font-semibold text-white mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="AI Research Scientist"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company">
                Company <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="OpenAI"
                required
              />
            </div>

            <div>
              <Label htmlFor="companyWebsite" className="text-slate-300">
                Company Website (Optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="companyWebsite"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://company.com"
                  type="url"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={handleExtractLogo}
                  disabled={isExtractingLogo || !companyWebsite.trim()}
                  className="bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isExtractingLogo ? 'Extracting...' : 'Extract Logo'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter the company website to automatically extract the logo and brand information
              </p>
            </div>

            {companyLogoUrl && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <Label className="text-slate-300">Extracted Company Logo</Label>
                <div className="mt-3 flex items-center gap-4">
                  <div className="w-24 h-24 bg-white/10 border border-white/20 rounded-lg p-2 flex items-center justify-center">
                    <img
                      src={companyLogoUrl}
                      alt="Company logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-emerald-400">Logo successfully extracted</p>
                    <button
                      type="button"
                      onClick={() => setCompanyLogoUrl('')}
                      className="bg-white/5 border border-white/10 text-slate-300 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-white/10 transition-all"
                    >
                      Remove Logo
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="bio">
                Bio <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Brief professional bio..."
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.bio.length} characters
              </p>
            </div>

            <div>
              <Label htmlFor="profilePhoto">Profile Photo</Label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Input
                    id="profilePhoto"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
          <h2 className="text-xl font-semibold text-white mb-4">Social Links (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="linkedin">LinkedIn Profile</Label>
              <Input
                id="linkedin"
                value={formData.linkedin}
                onChange={(e) => handleInputChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div>
              <Label htmlFor="twitter">Twitter/X Handle</Label>
              <Input
                id="twitter"
                value={formData.twitter}
                onChange={(e) => handleInputChange('twitter', e.target.value)}
                placeholder="@username"
              />
            </div>

            <div>
              <Label htmlFor="instagram">Instagram Handle</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                placeholder="@username"
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Presentation Details */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
          <h2 className="text-xl font-semibold text-white mb-4">Presentation Details</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="presentationTitle">
                Presentation Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="presentationTitle"
                value={formData.presentationTitle}
                onChange={(e) => handleInputChange('presentationTitle', e.target.value)}
                placeholder="Building Production-Ready AI Applications"
                required
              />
            </div>

            <div>
              <Label htmlFor="presentationDescription">
                Presentation Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="presentationDescription"
                value={formData.presentationDescription}
                onChange={(e) =>
                  handleInputChange('presentationDescription', e.target.value)
                }
                placeholder="What will attendees learn from this presentation?"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="presentationType">Presentation Type</Label>
                <Select
                  id="presentationType"
                  value={formData.presentationType}
                  onChange={(e) =>
                    handleInputChange('presentationType', e.target.value as PresentationType)
                  }
                >
                  <option value="presentation">Presentation</option>
                  <option value="workshop">Workshop</option>
                  <option value="panel">Panel Discussion</option>
                  <option value="fireside-chat">Fireside Chat</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="expertise">Expertise Areas</Label>
                <TagInput
                  value={formData.expertise}
                  onChange={(tags) => handleInputChange('expertise', tags)}
                  placeholder="Add expertise tags (e.g., AI, Machine Learning)"
                  maxTags={10}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Event Information */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
          <h2 className="text-xl font-semibold text-white mb-4">Event Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eventDate">Event Date</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate.toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('eventDate', new Date(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="eventLocation">Event Location</Label>
              <Select
                id="eventLocation"
                value={formData.eventLocation}
                onChange={(e) =>
                  handleInputChange('eventLocation', e.target.value as EventLocation)
                }
              >
                <option value="Miami">Miami</option>
                <option value="Brazil">Brazil</option>
                <option value="Virtual">Virtual</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
          <h2 className="text-xl font-semibold text-white mb-4">Additional Information (Optional)</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="highlights">Notable Highlights</Label>
              <TagInput
                value={formData.highlights || []}
                onChange={(tags) => handleInputChange('highlights', tags)}
                placeholder="Add notable achievements"
              />
            </div>

            <div>
              <Label htmlFor="previousCompanies">Previous Companies</Label>
              <TagInput
                value={formData.previousCompanies || []}
                onChange={(tags) => handleInputChange('previousCompanies', tags)}
                placeholder="Add previous companies"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-white/5 border border-white/10 text-slate-300 px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-fuchsia-600 hover:to-purple-700 transition-all shadow-lg shadow-fuchsia-500/25 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Speaker...' : 'Generate Announcement'}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}
