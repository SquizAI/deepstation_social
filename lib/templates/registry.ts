import type { EventTemplateConfig, WorkshopTemplateConfig, WebinarTemplateConfig } from './types'

export const DEFAULT_EVENT_TEMPLATE: EventTemplateConfig = {
  id: 'default-event',
  name: 'Modern Event Template',
  description: 'A sophisticated, modern event landing page with all essential sections',
  type: 'event',
  sections: [
    { type: 'hero', enabled: true, order: 1, ai_generated: false },
    { type: 'about', enabled: true, order: 2, ai_generated: false },
    { type: 'benefits', enabled: true, order: 3, ai_generated: true },
    { type: 'speakers', enabled: true, order: 4, ai_generated: false },
    { type: 'faq', enabled: true, order: 5, ai_generated: true },
    { type: 'registration', enabled: true, order: 6, ai_generated: false },
  ],
  theme: {
    primaryColor: '#d946ef',
    secondaryColor: '#9333ea',
    backgroundColor: '#0a0513',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  emails: {
    confirmation: true,
    reminder_24h: true,
    reminder_1h: true,
    thank_you: true,
  },
  ai_config: {
    auto_generate_benefits: true,
    auto_generate_faq: true,
    auto_generate_description: false,
    auto_generate_social_posts: true,
    tone: 'professional',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_public: true,
}

export const WORKSHOP_TEMPLATE: WorkshopTemplateConfig = {
  ...DEFAULT_EVENT_TEMPLATE,
  id: 'workshop-template',
  name: 'Hands-On Workshop Template',
  description: 'Perfect for interactive workshops with materials and exercises',
  type: 'workshop',
  sections: [
    { type: 'hero', enabled: true, order: 1, ai_generated: false },
    { type: 'about', enabled: true, order: 2, ai_generated: false },
    { type: 'benefits', enabled: true, order: 3, ai_generated: true },
    { type: 'agenda', enabled: true, order: 4, ai_generated: true },
    { type: 'speakers', enabled: true, order: 5, ai_generated: false },
    { type: 'faq', enabled: true, order: 6, ai_generated: true },
    { type: 'pricing', enabled: true, order: 7, ai_generated: false },
    { type: 'registration', enabled: true, order: 8, ai_generated: false },
  ],
  workshop_specific: {
    materials_included: true,
    prerequisite_skills: ['Basic understanding of the topic'],
    max_participants: 50,
    hands_on_percentage: 70,
  },
}

export const WEBINAR_TEMPLATE: WebinarTemplateConfig = {
  ...DEFAULT_EVENT_TEMPLATE,
  id: 'webinar-template',
  name: 'Professional Webinar Template',
  description: 'Designed for online presentations and Q&A sessions',
  type: 'webinar',
  sections: [
    { type: 'hero', enabled: true, order: 1, ai_generated: false },
    { type: 'about', enabled: true, order: 2, ai_generated: false },
    { type: 'benefits', enabled: true, order: 3, ai_generated: true },
    { type: 'speakers', enabled: true, order: 4, ai_generated: false },
    { type: 'faq', enabled: true, order: 5, ai_generated: true },
    { type: 'registration', enabled: true, order: 6, ai_generated: false },
  ],
  webinar_specific: {
    recording_available: true,
    q_and_a_enabled: true,
    polls_enabled: true,
    chat_enabled: true,
  },
}

export const CONFERENCE_TEMPLATE: EventTemplateConfig = {
  ...DEFAULT_EVENT_TEMPLATE,
  id: 'conference-template',
  name: 'Multi-Day Conference Template',
  description: 'Comprehensive template for large-scale conferences',
  type: 'conference',
  sections: [
    { type: 'hero', enabled: true, order: 1, ai_generated: false },
    { type: 'about', enabled: true, order: 2, ai_generated: false },
    { type: 'agenda', enabled: true, order: 3, ai_generated: true },
    { type: 'speakers', enabled: true, order: 4, ai_generated: false },
    { type: 'sponsors', enabled: true, order: 5, ai_generated: false },
    { type: 'pricing', enabled: true, order: 6, ai_generated: false },
    { type: 'faq', enabled: true, order: 7, ai_generated: true },
    { type: 'registration', enabled: true, order: 8, ai_generated: false },
  ],
}

export const MEETUP_TEMPLATE: EventTemplateConfig = {
  ...DEFAULT_EVENT_TEMPLATE,
  id: 'meetup-template',
  name: 'Casual Meetup Template',
  description: 'Simple, friendly template for casual networking events',
  type: 'meetup',
  sections: [
    { type: 'hero', enabled: true, order: 1, ai_generated: false },
    { type: 'about', enabled: true, order: 2, ai_generated: false },
    { type: 'benefits', enabled: true, order: 3, ai_generated: true },
    { type: 'faq', enabled: true, order: 4, ai_generated: true },
    { type: 'registration', enabled: true, order: 5, ai_generated: false },
  ],
  ai_config: {
    auto_generate_benefits: true,
    auto_generate_faq: true,
    auto_generate_description: false,
    auto_generate_social_posts: true,
    tone: 'casual',
  },
}

export class TemplateRegistry {
  private static templates: Map<string, EventTemplateConfig> = new Map([
    ['default-event', DEFAULT_EVENT_TEMPLATE],
    ['workshop-template', WORKSHOP_TEMPLATE],
    ['webinar-template', WEBINAR_TEMPLATE],
    ['conference-template', CONFERENCE_TEMPLATE],
    ['meetup-template', MEETUP_TEMPLATE],
  ])

  static getTemplate(id: string): EventTemplateConfig | undefined {
    return this.templates.get(id)
  }

  static getAllTemplates(): EventTemplateConfig[] {
    return Array.from(this.templates.values())
  }

  static getPublicTemplates(): EventTemplateConfig[] {
    return Array.from(this.templates.values()).filter((t) => t.is_public)
  }

  static getTemplatesByType(type: EventTemplateConfig['type']): EventTemplateConfig[] {
    return Array.from(this.templates.values()).filter((t) => t.type === type)
  }

  static registerTemplate(template: EventTemplateConfig): void {
    this.templates.set(template.id, template)
  }

  static removeTemplate(id: string): boolean {
    return this.templates.delete(id)
  }
}
