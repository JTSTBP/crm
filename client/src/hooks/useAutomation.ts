import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLeads } from './useLeads'
import { useProposals } from './useProposals'

export interface AutomationConfig {
  id: string
  type: 'followUp' | 'proposal'
  daysThreshold: number
  enabled: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface AutomationAlert {
  id: string
  type: 'followUp' | 'proposal'
  leadId: string
  leadName: string
  companyName: string
  assignedTo: string
  assignedToName: string
  daysSince: number
  threshold: number
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  lastActivity: string
  createdAt: string
}

// Demo automation configs
const demoConfigs: AutomationConfig[] = [
  {
    id: 'config-1',
    type: 'followUp',
    daysThreshold: 3,
    enabled: true,
    createdBy: 'demo-admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'config-2',
    type: 'proposal',
    daysThreshold: 7,
    enabled: true,
    createdBy: 'demo-admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const useAutomation = () => {
  const [configs, setConfigs] = useState<AutomationConfig[]>([])
  const [alerts, setAlerts] = useState<AutomationAlert[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()
  const { leads } = useLeads()
  const { proposals } = useProposals()

  const fetchConfigs = async () => {
    if (!user || !profile) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - return demo data
      setTimeout(() => {
        setConfigs(demoConfigs)
        generateAlerts(demoConfigs)
        setLoading(false)
      }, 500)
      return
    }

    try {
      // In real implementation, this would fetch from automation_configs table
      setConfigs([])
      generateAlerts([])
    } catch (error) {
      console.error('Error fetching automation configs:', error)
    }
    setLoading(false)
  }

  const generateAlerts = (configList: AutomationConfig[]) => {
    const generatedAlerts: AutomationAlert[] = []
    const now = new Date()

    // Get active configs
    const activeConfigs = configList.filter(config => config.enabled)

    // Generate follow-up alerts
    const followUpConfig = activeConfigs.find(config => config.type === 'followUp')
    if (followUpConfig && Array.isArray(leads)) {
      leads.forEach(lead => {
        const lastUpdate = new Date(lead.updated_at)
        const daysSince = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))

        // Check if lead needs follow-up (not in final stages and no recent activity)
        if (!['Won', 'Lost', 'Onboarded'].includes(lead.stage) && daysSince >= followUpConfig.daysThreshold) {
          const priority = daysSince >= followUpConfig.daysThreshold * 2 ? 'Urgent' :
            daysSince >= followUpConfig.daysThreshold * 1.5 ? 'High' :
              daysSince >= followUpConfig.daysThreshold ? 'Medium' : 'Low'

          generatedAlerts.push({
            id: `followup-${lead.id}`,
            type: 'followUp',
            leadId: lead.id,
            leadName: lead.contact_name,
            companyName: lead.company_name,
            assignedTo: lead.assigned_to,
            assignedToName: lead.profile?.name || 'Unknown',
            daysSince,
            threshold: followUpConfig.daysThreshold,
            priority,
            lastActivity: lead.updated_at,
            createdAt: new Date().toISOString()
          })
        }
      })
    }

    // Generate proposal follow-up alerts
    const proposalConfig = activeConfigs.find(config => config.type === 'proposal')
    if (proposalConfig && Array.isArray(proposals)) {
      proposals.forEach(proposal => {
        if (proposal.status === 'Sent' && proposal.sent_at) {
          const sentDate = new Date(proposal.sent_at)
          const daysSince = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24))

          if (daysSince >= proposalConfig.daysThreshold) {
            const priority = daysSince >= proposalConfig.daysThreshold * 2 ? 'Urgent' :
              daysSince >= proposalConfig.daysThreshold * 1.5 ? 'High' :
                'Medium'

            generatedAlerts.push({
              id: `proposal-${proposal.id}`,
              type: 'proposal',
              leadId: proposal.lead_id,
              leadName: proposal.lead?.contact_name || 'Unknown',
              companyName: proposal.lead?.company_name || 'Unknown',
              assignedTo: proposal.user_id,
              assignedToName: proposal.user?.name || 'Unknown',
              daysSince,
              threshold: proposalConfig.daysThreshold,
              priority,
              lastActivity: proposal.sent_at,
              createdAt: new Date().toISOString()
            })
          }
        }
      })
    }

    setAlerts(generatedAlerts)
  }

  const updateConfig = async (id: string, updates: Partial<AutomationConfig>) => {
    if (!user || !profile || (profile.role !== 'Admin' && profile.role !== 'Manager')) {
      throw new Error('Only Admin and Manager can update automation settings')
    }

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate updating config
      setConfigs(prev => prev.map(config =>
        config.id === id
          ? { ...config, ...updates, updatedAt: new Date().toISOString() }
          : config
      ))

      // Regenerate alerts with new config
      const updatedConfigs = configs.map(config =>
        config.id === id ? { ...config, ...updates } : config
      )
      generateAlerts(updatedConfigs)
      return
    }

    try {
      // In real implementation, this would update automation_configs table
      await fetchConfigs()
    } catch (error) {
      console.error('Error updating automation config:', error)
      throw error
    }
  }

  const createConfig = async (configData: Partial<AutomationConfig>) => {
    if (!user || !profile || (profile.role !== 'Admin' && profile.role !== 'Manager')) {
      throw new Error('Only Admin and Manager can create automation settings')
    }

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate creating config
      const newConfig: AutomationConfig = {
        id: `config-${Date.now()}`,
        type: configData.type || 'followUp',
        daysThreshold: configData.daysThreshold || 3,
        enabled: configData.enabled !== false,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setConfigs(prev => [...prev, newConfig])
      generateAlerts([...configs, newConfig])
      return
    }

    try {
      // In real implementation, this would create automation_configs record
      await fetchConfigs()
    } catch (error) {
      console.error('Error creating automation config:', error)
      throw error
    }
  }

  const dismissAlert = async (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  const snoozeAlert = async (alertId: string, hours: number) => {
    // In real implementation, this would update the alert's snooze time
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  const getAlertsByUser = (userId: string) => {
    return alerts.filter(alert => alert.assignedTo === userId)
  }

  const getAlertsByType = (type: 'followUp' | 'proposal') => {
    return alerts.filter(alert => alert.type === type)
  }

  const getUrgentAlerts = () => {
    return alerts.filter(alert => alert.priority === 'Urgent')
  }

  const logAutomationActivity = async (action: string, details: string) => {
    if (!user) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - just log to console
      console.log('Automation activity logged:', { action, details })
      return
    }

    try {
      await supabase
        .from('activity_logs')
        .insert([{
          user_id: user.id,
          action,
          details
        }])
    } catch (error) {
      console.error('Error logging automation activity:', error)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [user, profile, leads, proposals])

  // Regenerate alerts when leads or proposals change
  useEffect(() => {
    if (configs.length > 0) {
      generateAlerts(configs)
    }
  }, [leads, proposals, configs])

  return {
    configs,
    alerts,
    loading,
    updateConfig,
    createConfig,
    dismissAlert,
    snoozeAlert,
    getAlertsByUser,
    getAlertsByType,
    getUrgentAlerts,
    logAutomationActivity,
    refetch: fetchConfigs
  }
}