export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'business' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'business' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'business' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          user_id: string | null
          name: string
          representative_name: string
          business_license_url: string
          email: string
          phone: string
          address: string
          website: string | null
          status: 'pending' | 'approved' | 'rejected'
          contract_signed: boolean
          contract_signed_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          representative_name: string
          business_license_url: string
          email: string
          phone: string
          address: string
          website?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          contract_signed?: boolean
          contract_signed_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          representative_name?: string
          business_license_url?: string
          email?: string
          phone?: string
          address?: string
          website?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          contract_signed?: boolean
          contract_signed_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      donations: {
        Row: {
          id: string
          business_id: string
          description: string
          photos: string[]
          expiration_date: string | null
          quantity: number
          pickup_deadline: string
          pickup_location: string
          tax_deduction_needed: boolean
          status: 'pending_review' | 'quote_sent' | 'quote_accepted' | 'matched' | 'pickup_scheduled' | 'completed'
          matched_charity_name: string | null
          matched_at: string | null
          matched_by: string | null
          pickup_scheduled_at: string | null
          completed_at: string | null
          tax_document_url: string | null
          esg_report_url: string | null
          post_donation_media: string[]
          co2_saved: number | null
          meals_served: number | null
          waste_diverted: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          description: string
          photos?: string[]
          expiration_date?: string | null
          quantity: number
          pickup_deadline: string
          pickup_location: string
          tax_deduction_needed?: boolean
          status?: 'pending_review' | 'quote_sent' | 'quote_accepted' | 'matched' | 'pickup_scheduled' | 'completed'
          matched_charity_name?: string | null
          matched_at?: string | null
          matched_by?: string | null
          pickup_scheduled_at?: string | null
          completed_at?: string | null
          tax_document_url?: string | null
          esg_report_url?: string | null
          post_donation_media?: string[]
          co2_saved?: number | null
          meals_served?: number | null
          waste_diverted?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          description?: string
          photos?: string[]
          expiration_date?: string | null
          quantity?: number
          pickup_deadline?: string
          pickup_location?: string
          tax_deduction_needed?: boolean
          status?: 'pending_review' | 'quote_sent' | 'quote_accepted' | 'matched' | 'pickup_scheduled' | 'completed'
          matched_charity_name?: string | null
          matched_at?: string | null
          matched_by?: string | null
          pickup_scheduled_at?: string | null
          completed_at?: string | null
          tax_document_url?: string | null
          esg_report_url?: string | null
          post_donation_media?: string[]
          co2_saved?: number | null
          meals_served?: number | null
          waste_diverted?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          donation_id: string
          amount: number
          payment_terms: string
          status: 'sent' | 'accepted' | 'rejected'
          sent_by: string | null
          accepted_at: string | null
          rejected_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          donation_id: string
          amount: number
          payment_terms: string
          status?: 'sent' | 'accepted' | 'rejected'
          sent_by?: string | null
          accepted_at?: string | null
          rejected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          donation_id?: string
          amount?: number
          payment_terms?: string
          status?: 'sent' | 'accepted' | 'rejected'
          sent_by?: string | null
          accepted_at?: string | null
          rejected_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          read_at: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          read?: boolean
          read_at?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          read_at?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      subscriber_donations: {
        Row: {
          id: string
          business_id: string
          description: string
          donation_date: string
          quantity: number | null
          charity_name: string | null
          esg_report_url: string | null
          supporting_media: string[]
          co2_saved: number | null
          meals_served: number | null
          waste_diverted: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          description: string
          donation_date: string
          quantity?: number | null
          charity_name?: string | null
          esg_report_url?: string | null
          supporting_media?: string[]
          co2_saved?: number | null
          meals_served?: number | null
          waste_diverted?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          description?: string
          donation_date?: string
          quantity?: number | null
          charity_name?: string | null
          esg_report_url?: string | null
          supporting_media?: string[]
          co2_saved?: number | null
          meals_served?: number | null
          waste_diverted?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}