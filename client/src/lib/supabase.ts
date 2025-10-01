import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Only create client if we have valid environment variables
export const supabase = supabaseUrl.startsWith('https://') && supabaseAnonKey !== 'placeholder-key'
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder')

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          role: 'Admin' | 'Manager' | 'BD Executive'
          status: 'Active' | 'Inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          phone?: string | null
          role: 'Admin' | 'Manager' | 'BD Executive'
          status?: 'Active' | 'Inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          role?: 'Admin' | 'Manager' | 'BD Executive'
          status?: 'Active' | 'Inactive'
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          assigned_to: string
          company_name: string
          company_info: string | null
          company_size: string | null
          website_url: string | null
          hiring_needs: string[] | null
          points_of_contact: any[] | null
          lead_source: string | null
          contact_name: string
          contact_email: string
          contact_phone: string
          contact_designation: string | null
          linkedin_link: string | null
          industry_name: string | null
          stage: 'New' | 'Contacted' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost' | 'Onboarded'
          value: number | null
          locked: boolean | null
          locked_by: string | null
          locked_at: string | null
          potential_value: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assigned_to: string
          company_name: string
          company_info?: string | null
          company_size?: string | null
          website_url?: string | null
          hiring_needs?: string[] | null
          points_of_contact?: any[] | null
          lead_source?: string | null
          contact_name: string
          contact_email: string
          contact_phone: string
          contact_designation?: string | null
          linkedin_link?: string | null
          industry_name?: string | null
          stage?: 'New' | 'Contacted' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost' | 'Onboarded'
          value?: number | null
          locked?: boolean | null
          locked_by?: string | null
          locked_at?: string | null
          potential_value?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assigned_to?: string
          company_name?: string
          company_info?: string | null
          company_size?: string | null
          website_url?: string | null
          hiring_needs?: string[] | null
          points_of_contact?: any[] | null
          lead_source?: string | null
          contact_name?: string
          contact_email?: string
          contact_phone?: string
          contact_designation?: string | null
          linkedin_link?: string | null
          industry_name?: string | null
          stage?: 'New' | 'Contacted' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost' | 'Onboarded'
          value?: number | null
          locked?: boolean | null
          locked_by?: string | null
          locked_at?: string | null
          potential_value?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      remarks: {
        Row: {
          id: string
          lead_id: string
          user_id: string
          type: 'text' | 'voice' | 'file'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          user_id: string
          type: 'text' | 'voice' | 'file'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          user_id?: string
          type?: 'text' | 'voice' | 'file'
          content?: string
          created_at?: string
        }
      }
      lead_allocations: {
        Row: {
          id: string
          user_id: string
          date: string
          quota_limit: number
          assigned_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          quota_limit?: number
          assigned_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          quota_limit?: number
          assigned_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      proposal_templates: {
        Row: {
          id: string
          name: string
          subject: string
          content: string
          placeholders: any[]
          created_by: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subject: string
          content: string
          placeholders?: any[]
          created_by: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subject?: string
          content?: string
          placeholders?: any[]
          created_by?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      proposals: {
        Row: {
          id: string
          lead_id: string
          user_id: string
          template_id: string | null
          template_used: string
          rate_card_version: string
          pdf_link: string | null
          content: string | null
          sent_via: 'Email' | 'WhatsApp' | 'Both'
          status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected'
          sent_at: string | null
          email_sent: boolean | null
          whatsapp_sent: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          user_id: string
          template_id?: string | null
          template_used: string
          rate_card_version: string
          pdf_link?: string | null
          content?: string | null
          sent_via?: 'Email' | 'WhatsApp' | 'Both'
          status?: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected'
          sent_at?: string | null
          email_sent?: boolean | null
          whatsapp_sent?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          user_id?: string
          template_id?: string | null
          template_used?: string
          rate_card_version?: string
          pdf_link?: string | null
          content?: string | null
          sent_via?: 'Email' | 'WhatsApp' | 'Both'
          status?: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected'
          sent_at?: string | null
          email_sent?: boolean | null
          whatsapp_sent?: boolean | null
          created_at?: string
        }
      }
      rate_cards: {
        Row: {
          id: string
          version: string
          created_by: string
          items: any[]
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          version: string
          created_by: string
          items: any[]
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          version?: string
          created_by?: string
          items?: any[]
          active?: boolean
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          lead_id: string | null
          title: string
          description: string | null
          due_date: string
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lead_id?: string | null
          title: string
          description?: string | null
          due_date: string
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lead_id?: string | null
          title?: string
          description?: string | null
          due_date?: string
          completed?: boolean
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          lead_id: string | null
          action: string
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lead_id?: string | null
          action: string
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lead_id?: string | null
          action?: string
          details?: string | null
          created_at?: string
        }
      }
    }
  }
}