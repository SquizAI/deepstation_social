/**
 * TypeScript types for Event Platform
 * Generated from migration 008_event_platform.sql
 */

export type LocationType = 'online' | 'in-person' | 'hybrid';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type EventVisibility = 'public' | 'private' | 'unlisted';
export type EventType = 'workshop' | 'conference' | 'meetup' | 'webinar' | 'course' | 'networking' | 'other';

export type RegistrationStatus = 'registered' | 'waitlisted' | 'attended' | 'no-show' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentMethod = 'stripe' | 'paypal' | 'free' | string;

export type DiscountType = 'percentage' | 'fixed_amount';
export type FieldType = 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'select' | 'multi_select' | 'checkbox' | 'radio' | 'date' | 'url' | 'file';

export type CheckInMethod = 'qr_code' | 'manual' | 'email_lookup' | 'name_lookup' | 'self_checkin';
export type ReminderType = 'registration_confirmation' | 'event_reminder_1day' | 'event_reminder_1hour' | 'event_starting' | 'follow_up' | 'custom';
export type ReminderStatus = 'scheduled' | 'sent' | 'failed' | 'cancelled';
export type DeliveryMethod = 'email' | 'sms' | 'both';
export type TargetAudience = 'all' | 'registered' | 'waitlisted' | 'attended' | 'no_show' | 'ticket_type';

export type WaitlistStatus = 'waiting' | 'offered' | 'accepted' | 'expired' | 'cancelled';
export type SharePlatform = 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'email' | 'whatsapp' | 'copy_link' | 'other';
export type AvailabilityStatus = 'inactive' | 'not_yet_on_sale' | 'sale_ended' | 'sold_out' | 'available';

export interface Event {
  id: string;
  user_id: string;

  // Luma Integration
  luma_event_id?: string;
  luma_url?: string;

  // Event Details
  title: string;
  description?: string;
  short_description?: string;
  slug?: string;
  event_type: EventType;

  // Date & Time
  event_date: string;
  start_time: string;
  end_time: string;
  timezone: string;

  // Location
  location_type: LocationType;
  location_name?: string;
  location_address?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;

  // Virtual
  virtual_link?: string;
  virtual_platform?: string;
  recording_url?: string;

  // Event Management
  status: EventStatus;
  visibility: EventVisibility;

  // Registration
  registration_url?: string;
  registration_required: boolean;
  max_capacity?: number;
  current_attendees: number;
  waitlist_enabled: boolean;
  allows_guests: boolean;
  max_guests_per_registration: number;
  requires_approval: boolean;
  approval_message?: string;
  confirmation_message?: string;

  // Recurring
  recurring_rule?: string;
  parent_event_id?: string;

  // Pricing (legacy - use ticket_types)
  ticket_price: number;
  currency: string;
  is_free: boolean;

  // Media
  cover_image_url?: string;
  thumbnail_url?: string;

  // Organizers
  organizers: any[];

  // Tags & Categories
  tags: string[];
  category?: string;

  // Branding
  custom_branding: Record<string, any>;

  // Analytics
  featured: boolean;
  view_count: number;
  share_count: number;
  reminder_sent: boolean;

  // Sync metadata
  last_synced_at?: string;
  sync_enabled: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: string;
  event_id: string;

  // Ticket Details
  name: string;
  description?: string;

  // Pricing
  price: number;
  currency: string;
  is_free: boolean; // Generated column

  // Availability
  quantity_total?: number;
  quantity_sold: number;
  quantity_available?: number; // Generated column

  // Sale Period
  sale_starts_at?: string;
  sale_ends_at?: string;
  is_active: boolean;

  // Options
  min_per_order: number;
  max_per_order: number;
  requires_approval: boolean;

  // Display
  display_order: number;
  is_hidden: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface DiscountCode {
  id: string;
  event_id: string;

  // Code Details
  code: string;
  description?: string;

  // Discount Type
  discount_type: DiscountType;
  discount_value: number;
  max_discount_amount?: number;

  // Usage Limits
  max_uses?: number;
  current_uses: number;
  max_uses_per_user: number;

  // Validity Period
  valid_from: string;
  valid_until?: string;

  // Applicable Tickets
  applicable_ticket_types?: string[];

  // Status
  is_active: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CustomField {
  id: string;
  event_id: string;

  // Field Configuration
  field_name: string;
  field_label: string;
  field_type: FieldType;

  // Options
  field_options: Array<{ label: string; value: string }>;
  placeholder?: string;
  help_text?: string;

  // Validation
  is_required: boolean;
  validation_rules: Record<string, any>;

  // Display
  display_order: number;
  is_visible: boolean;

  // Applicable Tickets
  applies_to_ticket_types?: string[];

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id?: string;
  ticket_type_id?: string;
  order_id?: string;

  // Attendee Info
  email: string;
  full_name?: string;
  company?: string;
  title?: string;
  phone?: string;
  dietary_restrictions?: string;
  accessibility_needs?: string;

  // Registration
  registration_status: RegistrationStatus;
  approval_status: ApprovalStatus;
  registered_at: string;
  checked_in_at?: string;

  // Check-in
  confirmation_code: string;
  qr_code_data: string;

  // Guests
  guest_count: number;
  guest_names?: string[];

  // Custom Responses
  custom_responses: Record<string, any>;

  // Attribution
  referred_by?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;

  // Approval
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;

  // Cancellation
  cancelled_at?: string;
  cancellation_reason?: string;

  // Reminders
  reminder_sent_at?: string;
  follow_up_sent_at?: string;

  // Luma sync
  luma_guest_id?: string;

  // Metadata
  notes?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TicketOrder {
  id: string;
  event_id: string;
  user_id?: string;

  // Order Details
  order_number: string;
  email: string;
  full_name: string;

  // Items
  items: Array<{
    ticket_type_id: string;
    quantity: number;
    price: number;
  }>;

  // Pricing
  subtotal: number;
  discount_code_id?: string;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;

  // Payment
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  payment_intent_id?: string;
  payment_completed_at?: string;

  // Refund
  refund_amount: number;
  refunded_at?: string;
  refund_reason?: string;

  // Metadata
  ip_address?: string;
  user_agent?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Waitlist {
  id: string;
  event_id: string;
  ticket_type_id?: string;

  // Contact Info
  email: string;
  full_name?: string;
  phone?: string;

  // Waitlist Details
  position?: number;
  notification_sent: boolean;
  notification_sent_at?: string;
  response_deadline?: string;

  // Status
  status: WaitlistStatus;
  offered_at?: string;
  accepted_at?: string;

  // Conversion
  converted_to_registration_id?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  event_id: string;
  registration_id: string;

  // Check-in Details
  checked_in_at: string;
  checked_in_by?: string;
  check_in_method: CheckInMethod;

  // Location
  check_in_location?: string;

  // Guests
  guests_checked_in: number;

  // Metadata
  notes?: string;
  device_info?: Record<string, any>;

  // Timestamps
  created_at: string;
}

export interface EventReminder {
  id: string;
  event_id: string;

  // Reminder Configuration
  reminder_type: ReminderType;
  send_at_offset?: number; // Minutes before event
  custom_send_at?: string;

  // Content
  subject: string;
  message_template: string;

  // Delivery
  delivery_method: DeliveryMethod;

  // Targeting
  target_audience: TargetAudience;
  target_ticket_types?: string[];

  // Status
  status: ReminderStatus;
  sent_at?: string;
  sent_count: number;
  failed_count: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EventAnalytics {
  id: string;
  event_id: string;

  // Time Period
  date: string;
  hour?: number;

  // Metrics
  page_views: number;
  unique_visitors: number;
  registrations_count: number;
  waitlist_joins: number;
  tickets_sold: number;
  revenue: number;

  // Traffic Sources
  source_direct: number;
  source_social: number;
  source_email: number;
  source_search: number;
  source_referral: number;
  source_other: number;

  // Device Types
  device_desktop: number;
  device_mobile: number;
  device_tablet: number;

  // Engagement
  avg_time_on_page?: number; // Seconds
  bounce_rate?: number; // Percentage

  // Conversion
  conversion_rate?: number; // Percentage

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EventShare {
  id: string;
  event_id: string;

  // Share Details
  platform: SharePlatform;
  shared_by?: string;
  shared_by_email?: string;

  // Tracking
  referral_code?: string;
  click_count: number;
  conversion_count: number;

  // Timestamps
  created_at: string;
}

// ============================================================================
// Views
// ============================================================================

export interface EventSummary extends Event {
  registered_count: number;
  attended_count: number;
  waitlisted_count: number;
  cancelled_count: number;
  capacity_percentage?: number;
  total_tickets_sold: number;
  total_tickets_available?: number;
  total_revenue: number;
  completed_orders: number;
  total_shares: number;
}

export interface TicketAvailability extends TicketType {
  event_title: string;
  event_date: string;
  ticket_name: string;
  availability_status: AvailabilityStatus;
  seconds_until_sale_start?: number;
}

export interface RegistrationDetails extends Registration {
  event_title: string;
  ticket_type_name?: string;
  ticket_price?: number;
  order_number?: string;
  payment_status?: PaymentStatus;
  order_total?: number;
  checked_in_by?: string;
  check_in_method?: CheckInMethod;
}

export interface UpcomingEvent extends Event {
  registered_count: number;
  ticket_types_count: number;
  starting_price?: number;
  capacity_percentage?: number;
  is_sold_out: boolean;
}

// ============================================================================
// RPC Functions
// ============================================================================

export interface RPCFunctions {
  is_discount_code_valid: {
    args: {
      p_code: string;
      p_event_id: string;
      p_user_id?: string;
    };
    returns: boolean;
  };

  calculate_discount_amount: {
    args: {
      p_discount_code_id: string;
      p_subtotal: number;
    };
    returns: number;
  };

  track_event_view: {
    args: {
      p_event_id: string;
      p_source?: string;
      p_device?: string;
    };
    returns: void;
  };
}

// ============================================================================
// Helper Types
// ============================================================================

export interface CreateEventInput {
  title: string;
  description?: string;
  short_description?: string;
  slug?: string;
  event_type?: EventType;
  event_date: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  location_type: LocationType;
  location_name?: string;
  location_address?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  virtual_link?: string;
  virtual_platform?: string;
  status?: EventStatus;
  visibility?: EventVisibility;
  max_capacity?: number;
  waitlist_enabled?: boolean;
  allows_guests?: boolean;
  max_guests_per_registration?: number;
  requires_approval?: boolean;
  approval_message?: string;
  confirmation_message?: string;
  cover_image_url?: string;
  thumbnail_url?: string;
  organizers?: any[];
  tags?: string[];
  category?: string;
  custom_branding?: Record<string, any>;
  featured?: boolean;
}

export interface CreateTicketTypeInput {
  event_id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  quantity_total?: number;
  sale_starts_at?: string;
  sale_ends_at?: string;
  min_per_order?: number;
  max_per_order?: number;
  requires_approval?: boolean;
  display_order?: number;
  is_hidden?: boolean;
}

export interface CreateRegistrationInput {
  event_id: string;
  user_id?: string;
  ticket_type_id?: string;
  email: string;
  full_name?: string;
  company?: string;
  title?: string;
  phone?: string;
  dietary_restrictions?: string;
  accessibility_needs?: string;
  custom_responses?: Record<string, any>;
  guest_count?: number;
  guest_names?: string[];
  referred_by?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface CreateOrderInput {
  event_id: string;
  user_id?: string;
  email: string;
  full_name: string;
  items: Array<{
    ticket_type_id: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discount_code_id?: string;
  discount_amount?: number;
  tax_amount?: number;
  total_amount: number;
  currency?: string;
  payment_method?: PaymentMethod;
  ip_address?: string;
  user_agent?: string;
}

// ============================================================================
// Database Schema Type (for Supabase client)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'current_attendees' | 'view_count' | 'share_count' | 'reminder_sent'>;
        Update: Partial<Omit<Event, 'id' | 'created_at'>>;
      };
      ticket_types: {
        Row: TicketType;
        Insert: Omit<TicketType, 'id' | 'created_at' | 'updated_at' | 'quantity_sold' | 'is_free' | 'quantity_available'>;
        Update: Partial<Omit<TicketType, 'id' | 'created_at' | 'is_free' | 'quantity_available'>>;
      };
      discount_codes: {
        Row: DiscountCode;
        Insert: Omit<DiscountCode, 'id' | 'created_at' | 'updated_at' | 'current_uses'>;
        Update: Partial<Omit<DiscountCode, 'id' | 'created_at'>>;
      };
      custom_fields: {
        Row: CustomField;
        Insert: Omit<CustomField, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CustomField, 'id' | 'created_at'>>;
      };
      registrations: {
        Row: Registration;
        Insert: Omit<Registration, 'id' | 'created_at' | 'updated_at' | 'confirmation_code' | 'qr_code_data'>;
        Update: Partial<Omit<Registration, 'id' | 'created_at' | 'confirmation_code' | 'qr_code_data'>>;
      };
      ticket_orders: {
        Row: TicketOrder;
        Insert: Omit<TicketOrder, 'id' | 'created_at' | 'updated_at' | 'order_number'>;
        Update: Partial<Omit<TicketOrder, 'id' | 'created_at' | 'order_number'>>;
      };
      waitlist: {
        Row: Waitlist;
        Insert: Omit<Waitlist, 'id' | 'created_at' | 'updated_at' | 'position'>;
        Update: Partial<Omit<Waitlist, 'id' | 'created_at' | 'position'>>;
      };
      check_ins: {
        Row: CheckIn;
        Insert: Omit<CheckIn, 'id' | 'created_at'>;
        Update: Partial<Omit<CheckIn, 'id' | 'created_at'>>;
      };
      event_reminders: {
        Row: EventReminder;
        Insert: Omit<EventReminder, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<EventReminder, 'id' | 'created_at'>>;
      };
      event_analytics: {
        Row: EventAnalytics;
        Insert: Omit<EventAnalytics, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<EventAnalytics, 'id' | 'created_at'>>;
      };
      event_shares: {
        Row: EventShare;
        Insert: Omit<EventShare, 'id' | 'created_at'>;
        Update: Partial<Omit<EventShare, 'id' | 'created_at'>>;
      };
    };
    Views: {
      event_summary: {
        Row: EventSummary;
      };
      ticket_availability: {
        Row: TicketAvailability;
      };
      registration_details: {
        Row: RegistrationDetails;
      };
      upcoming_events: {
        Row: UpcomingEvent;
      };
    };
    Functions: RPCFunctions;
  };
}
