/**
 * DAMEZ BARBERSHOP - SUPABASE DATABASE TYPESCRIPT DEFINITIONS
 * Migration: 001_initial_schema.sql
 * Strict Asia/Jakarta (WIB) Timezone Standards
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'no_show'
  | 'rescheduled'
  | 'cancelled'
  | 'expired'

export type BookingType = 'online' | 'walk_in'

export type PaymentStatus =
  | 'pending'
  | 'settlement'
  | 'capture'
  | 'deny'
  | 'cancel'
  | 'expire'
  | 'failure'
  | 'refund'

export type SettlementMethod = 'none' | 'cash' | 'qris' | 'transfer'

export type BlockedSlotType =
  | 'recurring_break'
  | 'custom_block'
  | 'maintenance'
  | 'holiday'

export type NotificationChannel = 'whatsapp' | 'sms' | 'email'
export type NotificationStatus = 'pending' | 'sent' | 'failed'

export interface Database {
  public: {
    Tables: {
      barbers: {
        Row: {
          id: string
          barber_code: string
          name: string
          nickname: string | null
          title: string
          chair_number: number
          experience_years: number
          specialty: string
          bio: string | null
          avatar_url: string | null
          regular_day_off: number
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barber_code: string
          name: string
          nickname?: string | null
          title?: string
          chair_number: number
          experience_years?: number
          specialty: string
          bio?: string | null
          avatar_url?: string | null
          regular_day_off: number
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barber_code?: string
          name?: string
          nickname?: string | null
          title?: string
          chair_number?: number
          experience_years?: number
          specialty?: string
          bio?: string | null
          avatar_url?: string | null
          regular_day_off?: number
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          id: string
          service_code: string
          name: string
          slug: string
          category: string
          duration_minutes: number
          price_idr: number
          down_payment_idr: number
          description: string | null
          is_recommended: boolean
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_code: string
          name: string
          slug: string
          category: string
          duration_minutes: number
          price_idr: number
          down_payment_idr?: number
          description?: string | null
          is_recommended?: boolean
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_code?: string
          name?: string
          slug?: string
          category?: string
          duration_minutes?: number
          price_idr?: number
          down_payment_idr?: number
          description?: string | null
          is_recommended?: boolean
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          id: string
          barber_id: string | null
          day_of_week: number
          open_time: string
          close_time: string
          is_day_off: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barber_id?: string | null
          day_of_week: number
          open_time?: string
          close_time?: string
          is_day_off?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barber_id?: string | null
          day_of_week?: number
          open_time?: string
          close_time?: string
          is_day_off?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          }
        ]
      }
      blocked_slots: {
        Row: {
          id: string
          barber_id: string | null
          title: string
          slot_type: BlockedSlotType
          day_of_week: number | null
          start_time: string
          end_time: string
          start_datetime: string | null
          end_datetime: string | null
          reason: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barber_id?: string | null
          title: string
          slot_type?: BlockedSlotType
          day_of_week?: number | null
          start_time: string
          end_time: string
          start_datetime?: string | null
          end_datetime?: string | null
          reason?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barber_id?: string | null
          title?: string
          slot_type?: BlockedSlotType
          day_of_week?: number | null
          start_time?: string
          end_time?: string
          start_datetime?: string | null
          end_datetime?: string | null
          reason?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          total_bookings: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          total_bookings?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          total_bookings?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          booking_code: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          customer_email: string | null
          barber_id: string
          booking_date: string
          booking_type: BookingType
          status: BookingStatus
          start_time: string
          end_time: string
          service_duration_minutes: number
          buffer_minutes: number
          booking_range: unknown
          total_price_idr: number
          down_payment_idr: number
          remaining_balance_idr: number
          settlement_method: SettlementMethod
          settlement_paid_at: string | null
          hold_expires_at: string | null
          confirmed_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          rescheduled_from_id: string | null
          rescheduled_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_code: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          barber_id: string
          booking_date: string
          booking_type?: BookingType
          status?: BookingStatus
          start_time: string
          end_time: string
          service_duration_minutes: number
          buffer_minutes?: number
          total_price_idr: number
          down_payment_idr?: number
          remaining_balance_idr?: number
          settlement_method?: SettlementMethod
          settlement_paid_at?: string | null
          hold_expires_at?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          rescheduled_from_id?: string | null
          rescheduled_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_code?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          barber_id?: string
          booking_date?: string
          booking_type?: BookingType
          status?: BookingStatus
          start_time?: string
          end_time?: string
          service_duration_minutes?: number
          buffer_minutes?: number
          total_price_idr?: number
          down_payment_idr?: number
          remaining_balance_idr?: number
          settlement_method?: SettlementMethod
          settlement_paid_at?: string | null
          hold_expires_at?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          rescheduled_from_id?: string | null
          rescheduled_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_rescheduled_from_id_fkey"
            columns: ["rescheduled_from_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
      booking_services: {
        Row: {
          id: string
          booking_id: string
          service_id: string
          price_idr: number
          duration_minutes: number
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          service_id: string
          price_idr: number
          duration_minutes: number
          quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          service_id?: string
          price_idr?: number
          duration_minutes?: number
          quantity?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          order_id: string
          snap_token: string | null
          snap_redirect_url: string | null
          payment_type: string | null
          gross_amount: number
          currency: string
          transaction_status: PaymentStatus
          fraud_status: string | null
          status_code: string | null
          status_message: string | null
          transaction_id: string | null
          payment_amounts: Json | null
          raw_response: Json | null
          signature_key: string | null
          paid_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          order_id: string
          snap_token?: string | null
          snap_redirect_url?: string | null
          payment_type?: string | null
          gross_amount?: number
          currency?: string
          transaction_status?: PaymentStatus
          fraud_status?: string | null
          status_code?: string | null
          status_message?: string | null
          transaction_id?: string | null
          payment_amounts?: Json | null
          raw_response?: Json | null
          signature_key?: string | null
          paid_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          order_id?: string
          snap_token?: string | null
          snap_redirect_url?: string | null
          payment_type?: string | null
          gross_amount?: number
          currency?: string
          transaction_status?: PaymentStatus
          fraud_status?: string | null
          status_code?: string | null
          status_message?: string | null
          transaction_id?: string | null
          payment_amounts?: Json | null
          raw_response?: Json | null
          signature_key?: string | null
          paid_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          id: string
          booking_id: string | null
          recipient_phone: string
          channel: string
          template_name: string
          message_body: string
          status: NotificationStatus
          response_payload: Json | null
          error_message: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id?: string | null
          recipient_phone: string
          channel?: string
          template_name: string
          message_body: string
          status?: NotificationStatus
          response_payload?: Json | null
          error_message?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string | null
          recipient_phone?: string
          channel?: string
          template_name?: string
          message_body?: string
          status?: NotificationStatus
          response_payload?: Json | null
          error_message?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      v_active_holds: {
        Row: {
          booking_id: string
          booking_code: string
          customer_name: string
          customer_phone: string
          barber_id: string
          barber_name: string
          chair_number: number
          booking_date: string
          start_time: string
          end_time: string
          service_duration_minutes: number
          buffer_minutes: number
          hold_expires_at: string
          seconds_remaining: number
          is_expired: boolean
          created_at: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      fn_cleanup_expired_holds: {
        Args: Record<PropertyKey, never>
        Returns: {
          expired_count: number
          released_booking_codes: string[]
        }[]
      }
      fn_create_booking_hold: {
        Args: {
          p_customer_name: string
          p_customer_phone: string
          p_customer_email: string | null
          p_barber_id: string
          p_booking_date: string
          p_start_time: string
          p_end_time: string
          p_service_duration_minutes: number
          p_service_ids: string[]
          p_total_price_idr: number
          p_down_payment_idr?: number
          p_notes?: string | null
        }
        Returns: Json
      }
      fn_trigger_cleanup_expired_holds: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      fn_enforce_booking_hold_ttl: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      booking_status_enum: BookingStatus
      booking_type_enum: BookingType
      payment_status_enum: PaymentStatus
      settlement_method_enum: SettlementMethod
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenient Entity Helper Types
export type Barber = Database['public']['Tables']['barbers']['Row']
export type BarberInsert = Database['public']['Tables']['barbers']['Insert']
export type BarberUpdate = Database['public']['Tables']['barbers']['Update']

export type Service = Database['public']['Tables']['services']['Row']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
export type ServiceUpdate = Database['public']['Tables']['services']['Update']

export type WorkingHour = Database['public']['Tables']['working_hours']['Row']
export type WorkingHourInsert = Database['public']['Tables']['working_hours']['Insert']
export type WorkingHourUpdate = Database['public']['Tables']['working_hours']['Update']

export type BlockedSlot = Database['public']['Tables']['blocked_slots']['Row']
export type BlockedSlotInsert = Database['public']['Tables']['blocked_slots']['Insert']
export type BlockedSlotUpdate = Database['public']['Tables']['blocked_slots']['Update']

export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type Booking = Database['public']['Tables']['bookings']['Row']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']

export type BookingService = Database['public']['Tables']['booking_services']['Row']
export type BookingServiceInsert = Database['public']['Tables']['booking_services']['Insert']
export type BookingServiceUpdate = Database['public']['Tables']['booking_services']['Update']

export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

export type Setting = Database['public']['Tables']['settings']['Row']
export type SettingInsert = Database['public']['Tables']['settings']['Insert']
export type SettingUpdate = Database['public']['Tables']['settings']['Update']

export type NotificationLog = Database['public']['Tables']['notification_logs']['Row']
export type NotificationLogInsert = Database['public']['Tables']['notification_logs']['Insert']
export type NotificationLogUpdate = Database['public']['Tables']['notification_logs']['Update']

export type ActiveHold = Database['public']['Views']['v_active_holds']['Row']

// Domain-Specific System Types
export interface BookingWithDetails extends Booking {
  barber?: Barber
  services?: Service[]
  payments?: Payment[]
}

export interface AvailableSlot {
  slot_id: string
  barber_id: string
  barber_name: string
  chair_number: number
  start_time: string // ISO string with +07:00
  end_time: string   // ISO string with +07:00
  service_duration: number
  buffer_duration: number
  total_window: number
  formatted_time: string // e.g. "14:00 WIB"
}

export interface BookingPolicySetting {
  dp_amount_idr: number
  hold_ttl_minutes: number
  sanitation_buffer_minutes: number
  slot_grid_step_minutes: number
  min_lead_time_minutes: number
  reschedule_cutoff_hours: number
  late_tolerance_minutes: number
}
