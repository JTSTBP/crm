import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Database } from '../lib/supabase'

export interface ScheduledEvent {
  id: string
  leadId: string
  title: string
  description: string | null
  assignedTo: string
  startDateTime: string
  endDateTime: string
  status: 'Pending' | 'Completed' | 'Cancelled'
  createdBy: string
  recurring: 'None' | 'Daily' | 'Weekly' | 'Monthly'
  meetingLink: string | null
  timezone: string
  createdAt: string
  updatedAt: string
  assignedUser?: {
    id: string
    name: string
    email: string
  }
  createdByUser?: {
    id: string
    name: string
    email: string
  }
}

// Demo scheduled events data
const demoScheduledEvents: ScheduledEvent[] = [
  {
    id: 'demo-event-1',
    leadId: 'demo-lead-1',
    title: 'Initial Discovery Call',
    description: 'Discuss hiring requirements and company culture',
    assignedTo: 'demo-bd-executive',
    startDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    createdBy: 'demo-manager',
    recurring: 'None',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    timezone: 'Asia/Kolkata',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedUser: {
      id: 'demo-bd-executive',
      name: 'Executive User',
      email: 'executive@jobsterritory.com'
    },
    createdByUser: {
      id: 'demo-manager',
      name: 'Manager User',
      email: 'manager@jobsterritory.com'
    }
  },
  {
    id: 'demo-event-2',
    leadId: 'demo-lead-2',
    title: 'Proposal Presentation',
    description: 'Present recruitment proposal and discuss terms',
    assignedTo: 'demo-bd-executive',
    startDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    status: 'Pending',
    createdBy: 'demo-bd-executive',
    recurring: 'None',
    meetingLink: 'https://zoom.us/j/123456789',
    timezone: 'Asia/Kolkata',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignedUser: {
      id: 'demo-bd-executive',
      name: 'Executive User',
      email: 'executive@jobsterritory.com'
    },
    createdByUser: {
      id: 'demo-bd-executive',
      name: 'Executive User',
      email: 'executive@jobsterritory.com'
    }
  }
]

export const useScheduling = (leadId?: string) => {
  const [events, setEvents] = useState<ScheduledEvent[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()

  const fetchEvents = async () => {
    if (!user || !profile) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - return demo data
      setTimeout(() => {
        let filteredEvents = demoScheduledEvents
        
        // Filter by lead if specified
        if (leadId) {
          filteredEvents = demoScheduledEvents.filter(event => event.leadId === leadId)
        }
        
        // BD Executives only see their assigned events
        if (profile.role === 'BD Executive') {
          filteredEvents = filteredEvents.filter(event => event.assignedTo === user.id)
        }
        
        setEvents(filteredEvents)
        setLoading(false)
      }, 500)
      return
    }

    try {
      let query = supabase
        .from('scheduled_events')
        .select(`
          *,
          assignedUser:profiles!scheduled_events_assigned_to_fkey(*),
          createdByUser:profiles!scheduled_events_created_by_fkey(*)
        `)

      // Filter by lead if specified
      if (leadId) {
        query = query.eq('lead_id', leadId)
      }

      // BD Executives only see their assigned events
      if (profile.role === 'BD Executive') {
        query = query.eq('assigned_to', user.id)
      }

      const { data, error } = await query.order('start_date_time', { ascending: true })

      if (error) {
        console.error('Error fetching events:', error)
      } else {
        setEvents(data || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
    setLoading(false)
  }

  const createEvent = async (eventData: Partial<ScheduledEvent>) => {
    if (!user) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate creating event
      const newEvent: ScheduledEvent = {
        id: `demo-event-${Date.now()}`,
        leadId: eventData.leadId || '',
        title: eventData.title || '',
        description: eventData.description || null,
        assignedTo: eventData.assignedTo || user.id,
        startDateTime: eventData.startDateTime || new Date().toISOString(),
        endDateTime: eventData.endDateTime || new Date().toISOString(),
        status: 'Pending',
        createdBy: user.id,
        recurring: eventData.recurring || 'None',
        meetingLink: eventData.meetingLink || null,
        timezone: eventData.timezone || 'Asia/Kolkata',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedUser: profile,
        createdByUser: profile
      }
      
      setEvents(prev => [newEvent, ...prev])
      
      // Simulate Google Calendar integration
      if (eventData.meetingLink) {
        console.log('Google Calendar event created:', newEvent)
      }
      
      return newEvent
    }

    try {
      const { data, error } = await supabase
        .from('scheduled_events')
        .insert([{ 
          ...eventData, 
          created_by: user.id,
          assigned_to: eventData.assignedTo || user.id
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating event:', error)
        throw error
      }

      // Log activity
      await logSchedulingActivity('Event Scheduled', eventData.title, eventData.leadId)
      
      await fetchEvents()
      return data
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  }

  const updateEvent = async (id: string, updates: Partial<ScheduledEvent>) => {
    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate updating event
      setEvents(prev => prev.map(event => 
        event.id === id 
          ? { ...event, ...updates, updatedAt: new Date().toISOString() }
          : event
      ))
      return
    }

    try {
      const { error } = await supabase
        .from('scheduled_events')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        console.error('Error updating event:', error)
        throw error
      }

      // Log activity if status changed
      if (updates.status) {
        await logSchedulingActivity('Event Status Updated', `Changed to ${updates.status}`)
      }

      await fetchEvents()
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  }

  const deleteEvent = async (id: string) => {
    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate deleting event
      setEvents(prev => prev.filter(event => event.id !== id))
      return
    }

    try {
      const { error } = await supabase
        .from('scheduled_events')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting event:', error)
        throw error
      }

      await fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  }

  const generateMeetingLink = (platform: 'google' | 'zoom'): string => {
    // Simulate meeting link generation
    if (platform === 'google') {
      return `https://meet.google.com/${Math.random().toString(36).substring(2, 15)}`
    } else {
      return `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`
    }
  }

  const logSchedulingActivity = async (action: string, details?: string, leadId?: string) => {
    if (!user) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - just log to console
      console.log('Scheduling activity logged:', { action, details, leadId })
      return
    }

    try {
      await supabase
        .from('activity_logs')
        .insert([{
          user_id: user.id,
          lead_id: leadId || null,
          action,
          details: details || null
        }])
    } catch (error) {
      console.error('Error logging scheduling activity:', error)
    }
  }

  const syncWithGoogleCalendar = async (event: ScheduledEvent) => {
    // Simulate Google Calendar integration
    console.log('Syncing with Google Calendar:', event)
    
    // In real implementation, this would:
    // 1. Use Google Calendar API
    // 2. Create calendar event
    // 3. Send invites to participants
    // 4. Return calendar event ID
    
    return `gcal_${event.id}`
  }

  useEffect(() => {
    fetchEvents()
  }, [user, profile, leadId])

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    generateMeetingLink,
    syncWithGoogleCalendar,
    refetch: fetchEvents
  }
}