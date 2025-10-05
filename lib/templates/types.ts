export type TemplateType = 'event' | 'workshop' | 'webinar' | 'conference' | 'meetup'

export type SectionType =
  | 'hero'
  | 'about'
  | 'speakers'
  | 'benefits'
  | 'agenda'
  | 'faq'
  | 'testimonials'
  | 'sponsors'
  | 'gallery'
  | 'pricing'
  | 'registration'
  | 'custom'

export interface TemplateSectionConfig {
  type: SectionType
  enabled: boolean
  order: number
  customData?: Record<string, any>
  ai_generated?: boolean
}

export interface EventTemplateConfig {
  id: string
  name: string
  description: string
  type: TemplateType
  thumbnail_url?: string

  // Section configuration
  sections: TemplateSectionConfig[]

  // Style configuration
  theme: {
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    fontFamily: string
  }

  // Email configuration
  emails: {
    confirmation: boolean
    reminder_24h: boolean
    reminder_1h: boolean
    thank_you: boolean
    custom_emails?: Array<{
      name: string
      template_id: string
      trigger: 'manual' | 'auto'
      send_at?: string
    }>
  }

  // AI Generation settings
  ai_config?: {
    auto_generate_benefits: boolean
    auto_generate_faq: boolean
    auto_generate_description: boolean
    auto_generate_social_posts: boolean
    tone: 'professional' | 'casual' | 'enthusiastic' | 'formal'
    target_audience?: string
  }

  created_at: string
  updated_at: string
  created_by?: string
  is_public: boolean
}

export interface WorkshopTemplateConfig extends EventTemplateConfig {
  type: 'workshop'
  workshop_specific: {
    materials_included: boolean
    prerequisite_skills?: string[]
    max_participants?: number
    hands_on_percentage: number
  }
}

export interface WebinarTemplateConfig extends EventTemplateConfig {
  type: 'webinar'
  webinar_specific: {
    recording_available: boolean
    q_and_a_enabled: boolean
    polls_enabled: boolean
    chat_enabled: boolean
  }
}

export type AnyTemplateConfig = EventTemplateConfig | WorkshopTemplateConfig | WebinarTemplateConfig

// Template generation requests
export interface TemplateGenerationRequest {
  type: TemplateType
  title: string
  description?: string
  target_audience?: string
  duration_minutes?: number
  is_free: boolean
  location_type: 'online' | 'in-person' | 'hybrid'

  // AI generation preferences
  generate_sections?: SectionType[]
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'formal'
  include_images?: boolean
  include_social_copy?: boolean
}

export interface TemplateGenerationResponse {
  template: AnyTemplateConfig
  generated_content: {
    hero_content?: {
      title: string
      subtitle: string
      description: string
    }
    benefits?: Array<{
      icon: string
      title: string
      description: string
    }>
    faqs?: Array<{
      question: string
      answer: string
    }>
    social_posts?: {
      linkedin?: string
      twitter?: string
      instagram?: string
    }
    email_templates?: {
      confirmation?: string
      reminder?: string
    }
  }
  images?: {
    hero_image_url?: string
    og_image_url?: string
    section_images?: Record<string, string>
  }
}
