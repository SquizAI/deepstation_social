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
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Speaker</h1>
        <p className="text-gray-600 mt-2">
          Fill in the speaker details to generate social media announcements
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
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
                      variant="outline"
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
        </Card>

        {/* Social Links */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Social Links (Optional)</h2>
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
        </Card>

        {/* Presentation Details */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Presentation Details</h2>
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
        </Card>

        {/* Event Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Event Information</h2>
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
        </Card>

        {/* Additional Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Additional Information (Optional)</h2>
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
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? 'Creating Speaker...' : 'Generate Announcement'}
          </Button>
        </div>
      </form>
    </div>
  )
}
