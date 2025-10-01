import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface Reminder {
  id: string
  userId: string
  title: string
  description?: string
  reminderTime: string
  type: 'Task' | 'Meeting' | 'Follow-up' | 'Deadline' | 'Custom'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  status: 'Active' | 'Snoozed' | 'Completed' | 'Dismissed'
  leadId?: string
  taskId?: string
  recurring: 'None' | 'Daily' | 'Weekly' | 'Monthly'
  notificationMethods: ('In-app' | 'Email' | 'WhatsApp')[]
  snoozeUntil?: string
  createdAt: string
  updatedAt: string
  leadName?: string
  companyName?: string
}

// Demo reminders data
const demoReminders: Reminder[] = [
  {
    id: 'reminder-1',
    userId: 'demo-bd-executive',
    title: 'Follow up with TechCorp Solutions',
    description: 'Call to discuss their hiring requirements for senior developers',
    reminderTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    type: 'Follow-up',
    priority: 'High',
    status: 'Active',
    leadId: 'demo-lead-1',
    recurring: 'None',
    notificationMethods: ['In-app', 'Email'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    leadName: 'Rajesh Kumar',
    companyName: 'TechCorp Solutions'
  },
  {
    id: 'reminder-2',
    userId: 'demo-bd-executive',
    title: 'Send proposal to StartupHub India',
    description: 'Prepare and send recruitment proposal for their volume hiring needs',
    reminderTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    type: 'Task',
    priority: 'Medium',
    status: 'Active',
    leadId: 'demo-lead-2',
    recurring: 'None',
    notificationMethods: ['In-app'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    leadName: 'Priya Sharma',
    companyName: 'StartupHub India'
  },
  {
    id: 'reminder-3',
    userId: 'demo-bd-executive',
    title: 'Weekly team meeting',
    description: 'Attend weekly team sync meeting',
    reminderTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'Meeting',
    priority: 'Medium',
    status: 'Active',
    recurring: 'Weekly',
    notificationMethods: ['In-app', 'Email'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'reminder-4',
    userId: 'demo-bd-executive',
    title: 'Update rate card review',
    description: 'Review and provide feedback on new rate card proposals',
    reminderTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    type: 'Deadline',
    priority: 'Urgent',
    status: 'Snoozed',
    recurring: 'None',
    notificationMethods: ['In-app', 'Email', 'WhatsApp'],
    snoozeUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const useReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()

  const fetchReminders = async () => {
    if (!user || !profile) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - return demo data
      setTimeout(() => {
        let filteredReminders = demoReminders
        
        // BD Executives only see their own reminders
        if (profile.role === 'BD Executive') {
          filteredReminders = demoReminders.filter(reminder => reminder.userId === user.id)
        }
        
        setReminders(filteredReminders)
        setLoading(false)
      }, 500)
      return
    }

    try {
      // In real implementation, this would fetch from reminders table
      setReminders([])
    } catch (error) {
      console.error('Error fetching reminders:', error)
    }
    setLoading(false)
  }

  const createReminder = async (reminderData: Partial<Reminder>) => {
    if (!user || !profile) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate creating reminder
      const newReminder: Reminder = {
        id: `reminder-${Date.now()}`,
        userId: user.id,
        title: reminderData.title || '',
        description: reminderData.description || '',
        reminderTime: reminderData.reminderTime || new Date().toISOString(),
        type: reminderData.type || 'Custom',
        priority: reminderData.priority || 'Medium',
        status: 'Active',
        leadId: reminderData.leadId,
        taskId: reminderData.taskId,
        recurring: reminderData.recurring || 'None',
        notificationMethods: reminderData.notificationMethods || ['In-app'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setReminders(prev => [newReminder, ...prev])
      return
    }

    try {
      // In real implementation, this would create reminder record
      await fetchReminders()
    } catch (error) {
      console.error('Error creating reminder:', error)
      throw error
    }
  }

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate updating reminder
      setReminders(prev => prev.map(reminder => 
        reminder.id === id 
          ? { ...reminder, ...updates, updatedAt: new Date().toISOString() }
          : reminder
      ))
      return
    }

    try {
      // In real implementation, this would update reminder record
      await fetchReminders()
    } catch (error) {
      console.error('Error updating reminder:', error)
      throw error
    }
  }

  const snoozeReminder = async (id: string, snoozeMinutes: number) => {
    const snoozeUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString()
    await updateReminder(id, { 
      status: 'Snoozed', 
      snoozeUntil 
    })
  }

  const dismissReminder = async (id: string) => {
    await updateReminder(id, { status: 'Dismissed' })
  }

  const completeReminder = async (id: string) => {
    await updateReminder(id, { status: 'Completed' })
  }

  const getActiveReminders = (): Reminder[] => {
    const now = new Date()
    return reminders.filter(reminder => {
      if (reminder.status === 'Dismissed' || reminder.status === 'Completed') return false
      if (reminder.status === 'Snoozed' && reminder.snoozeUntil) {
        return new Date(reminder.snoozeUntil) <= now
      }
      return reminder.status === 'Active' && new Date(reminder.reminderTime) <= now
    })
  }

  const getUpcomingReminders = (): Reminder[] => {
    const now = new Date()
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    return reminders.filter(reminder => {
      if (reminder.status !== 'Active') return false
      const reminderDate = new Date(reminder.reminderTime)
      return reminderDate > now && reminderDate <= next24Hours
    })
  }

  const triggerNotification = (reminder: Reminder) => {
    // Simulate notification triggering
    if (reminder.notificationMethods.includes('In-app')) {
      // Show in-app notification
      console.log('In-app notification:', reminder.title)
    }
    
    if (reminder.notificationMethods.includes('Email')) {
      // Send email notification
      console.log('Email notification sent for:', reminder.title)
    }
    
    if (reminder.notificationMethods.includes('WhatsApp')) {
      // Send WhatsApp notification
      console.log('WhatsApp notification sent for:', reminder.title)
    }
  }

  // Check for due reminders every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const activeReminders = getActiveReminders()
      activeReminders.forEach(reminder => {
        triggerNotification(reminder)
      })
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [reminders])

  useEffect(() => {
    fetchReminders()
  }, [user, profile])

  return {
    reminders,
    loading,
    createReminder,
    updateReminder,
    snoozeReminder,
    dismissReminder,
    completeReminder,
    getActiveReminders,
    getUpcomingReminders,
    refetch: fetchReminders
  }
}