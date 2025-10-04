export type PresentationType = 'workshop' | 'presentation' | 'panel' | 'fireside-chat'
export type EventLocation = 'Miami' | 'Brazil' | 'Virtual'

export interface SpeakerForm {
  // Personal Information
  fullName: string
  title: string
  company: string
  bio: string
  profilePhoto?: string // URL or file upload

  // Social Links
  linkedin?: string
  twitter?: string
  instagram?: string
  website?: string

  // Presentation Details
  presentationTitle: string
  presentationDescription: string
  presentationType: PresentationType
  expertise: string[] // e.g., ["AI", "Machine Learning", "LLMs"]

  // Event Information
  eventDate: Date
  eventLocation: EventLocation

  // Additional
  highlights?: string[] // Notable achievements
  previousCompanies?: string[]
}

export interface Speaker {
  id: string
  user_id: string
  full_name: string
  title: string
  company: string
  bio: string
  profile_photo_url?: string
  company_logo_url?: string
  linkedin?: string
  twitter?: string
  instagram?: string
  website?: string
  presentation_title: string
  presentation_description: string
  presentation_type: PresentationType
  expertise: string[]
  event_date: string
  event_location: EventLocation
  highlights?: string[]
  previous_companies?: string[]
  created_at: string
  updated_at: string
}

export interface SpeakerAnnouncement {
  id: string
  speaker_id: string
  generated_content: {
    linkedin: string
    instagram: string
    twitter: string
    discord: string
  }
  speaker_card_images?: {
    linkedin: string
    instagram: string
    twitter: string
    discord: string
  }
  status: 'draft' | 'approved' | 'scheduled' | 'published'
  created_at: string
  updated_at: string
}

export interface GenerateAnnouncementParams {
  speakerData: SpeakerForm | Speaker
  platform: 'linkedin' | 'twitter' | 'instagram' | 'discord'
  eventLink?: string
}

export interface AnnouncementGenerationResult {
  content: string
  platform: 'linkedin' | 'twitter' | 'instagram' | 'discord'
  characterCount: number
  withinLimit: boolean
}
