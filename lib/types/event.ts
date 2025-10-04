export interface Event {
  id: string
  user_id: string
  title: string
  slug: string
  description?: string
  short_description?: string
  cover_image_url?: string
  event_date: string
  start_time: string
  end_time: string
  timezone: string
  location_type: 'online' | 'in-person' | 'hybrid'
  location_name?: string
  location_address?: string
  location_city?: string
  location_state?: string
  location_country?: string
  meeting_url?: string
  max_capacity?: number
  current_attendees: number
  is_free: boolean
  ticket_types?: TicketType[]
  registration_questions?: RegistrationQuestion[]
  is_recurring: boolean
  recurrence_pattern?: RecurrencePattern
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  tags?: string[]
  hosts?: EventHost[]
  meta_description?: string
  og_image_url?: string
  allow_waitlist: boolean
  created_at: string
  updated_at: string
}

export interface TicketType {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  quantity_available?: number
  quantity_sold: number
  early_bird_price?: number
  early_bird_deadline?: string
  is_active: boolean
}

export interface RegistrationQuestion {
  id: string
  question: string
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea'
  required: boolean
  options?: string[]
  order: number
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly'
  interval: number
  end_date?: string
  occurrences?: number
}

export interface EventHost {
  id: string
  name: string
  title?: string
  bio?: string
  avatar_url?: string
  social_links?: {
    linkedin?: string
    twitter?: string
    website?: string
  }
}

export interface EventRegistration {
  id: string
  event_id: string
  user_id?: string
  email: string
  full_name: string
  ticket_type_id?: string
  answers: Record<string, string>
  payment_status?: 'pending' | 'completed' | 'failed'
  payment_amount?: number
  check_in_status: 'pending' | 'checked_in'
  check_in_time?: string
  created_at: string
}

export interface EventAnalytics {
  event_id: string
  total_views: number
  unique_visitors: number
  total_registrations: number
  total_revenue: number
  conversion_rate: number
  traffic_sources: Record<string, number>
  registration_timeline: Array<{ date: string; count: number }>
}
