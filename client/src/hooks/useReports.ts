import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLeads } from './useLeads'
import { useTasks } from './useTasks'

interface OverallMetrics {
  callsMade: number
  proposalsSent: number
  onboarded: number
  pipeline: {
    new: number
    contacted: number
    proposalSent: number
    negotiation: number
  }
  dealsLost: number
  tasksCompleted: number
  tasksPending: number
  revenueForecast: number
  revenueWon: number
  leadSourceBreakdown: Array<{
    source: string
    count: number
    percentage: number
  }>
  industryBreakdown: Array<{
    industry: string
    count: number
    percentage: number
  }>
}

interface UserMetrics {
  id: string
  name: string
  email: string
  callsMade: number
  proposalsSent: number
  leadsOnboarded: number
  pipeline: {
    new: number
    contacted: number
    proposalSent: number
    negotiation: number
  }
  tasksCompleted: number
  tasksPending: number
  conversionRatio: number
  lastActivity: string
  totalLeads: number
  dealsLost: number
  revenue: number
}

interface ReportFilters {
  dateRange: 'today' | 'last7days' | 'last30days' | 'custom'
  customStartDate?: string
  customEndDate?: string
  userId?: string
  stage?: string
  leadSource?: string
  industry?: string
}

interface ActivityItem {
  id: string
  action: string
  user: string
  userId: string
  leadName: string
  leadId?: string
  timestamp: string
  details?: string
  type: 'call' | 'proposal' | 'stage_change' | 'task' | 'lead_created'
}

interface ChartData {
  stageData: Array<{
    name: string
    count: number
    color: string
  }>
  timeSeriesData: Array<{
    date: string
    calls: number
    proposals: number
    leads: number
  }>
  conversionData: Array<{
    name: string
    value: number
    color: string
  }>
  sourceData: Array<{
    name: string
    value: number
    color: string
  }>
  industryData: Array<{
    name: string
    value: number
    color: string
  }>
}

// Demo data for comprehensive reporting
const demoOverallMetrics: OverallMetrics = {
  callsMade: 342,
  proposalsSent: 89,
  onboarded: 23,
  pipeline: {
    new: 45,
    contacted: 32,
    proposalSent: 18,
    negotiation: 12
  },
  dealsLost: 15,
  tasksCompleted: 156,
  tasksPending: 34,
  revenueForecast: 8500000,
  revenueWon: 4200000,
  leadSourceBreakdown: [
    { source: 'LinkedIn', count: 67, percentage: 42 },
    { source: 'Reference', count: 38, percentage: 24 },
    { source: 'Cold Call', count: 29, percentage: 18 },
    { source: 'Campaign', count: 16, percentage: 10 },
    { source: 'Website', count: 10, percentage: 6 }
  ],
  industryBreakdown: [
    { industry: 'Technology', count: 45, percentage: 28 },
    { industry: 'Healthcare', count: 32, percentage: 20 },
    { industry: 'Finance', count: 28, percentage: 18 },
    { industry: 'Manufacturing', count: 25, percentage: 16 },
    { industry: 'Education', count: 18, percentage: 11 },
    { industry: 'Other', count: 12, percentage: 7 }
  ]
}

const demoUserMetrics: UserMetrics[] = [
  {
    id: 'demo-bd-executive',
    name: 'Executive User',
    email: 'executive@jobsterritory.com',
    callsMade: 89,
    proposalsSent: 23,
    leadsOnboarded: 6,
    pipeline: { new: 12, contacted: 8, proposalSent: 5, negotiation: 3 },
    tasksCompleted: 42,
    tasksPending: 8,
    conversionRatio: 75,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    totalLeads: 28,
    dealsLost: 2,
    revenue: 1200000
  },
  {
    id: 'demo-bd-1',
    name: 'Rahul Sharma',
    email: 'rahul@jobsterritory.com',
    callsMade: 95,
    proposalsSent: 28,
    leadsOnboarded: 8,
    pipeline: { new: 15, contacted: 10, proposalSent: 6, negotiation: 4 },
    tasksCompleted: 48,
    tasksPending: 12,
    conversionRatio: 80,
    lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    totalLeads: 35,
    dealsLost: 3,
    revenue: 1500000
  },
  {
    id: 'demo-bd-2',
    name: 'Priya Patel',
    email: 'priya@jobsterritory.com',
    callsMade: 78,
    proposalsSent: 19,
    leadsOnboarded: 5,
    pipeline: { new: 9, contacted: 7, proposalSent: 4, negotiation: 2 },
    tasksCompleted: 35,
    tasksPending: 7,
    conversionRatio: 71,
    lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    totalLeads: 22,
    dealsLost: 2,
    revenue: 950000
  },
  {
    id: 'demo-bd-3',
    name: 'Arjun Kumar',
    email: 'arjun@jobsterritory.com',
    callsMade: 80,
    proposalsSent: 19,
    leadsOnboarded: 4,
    pipeline: { new: 9, contacted: 7, proposalSent: 3, negotiation: 3 },
    tasksCompleted: 31,
    tasksPending: 7,
    conversionRatio: 67,
    lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    totalLeads: 22,
    dealsLost: 4,
    revenue: 800000
  }
]

const demoChartData: ChartData = {
  stageData: [
    { name: 'New', count: 45, color: '#3B82F6' },
    { name: 'Contacted', count: 32, color: '#EAB308' },
    { name: 'Proposal Sent', count: 18, color: '#8B5CF6' },
    { name: 'Negotiation', count: 12, color: '#F59E0B' },
    { name: 'Won', count: 23, color: '#10B981' },
    { name: 'Lost', count: 15, color: '#EF4444' }
  ],
  timeSeriesData: [
    { date: '2024-01-01', calls: 45, proposals: 12, leads: 8 },
    { date: '2024-01-02', calls: 52, proposals: 15, leads: 10 },
    { date: '2024-01-03', calls: 48, proposals: 13, leads: 9 },
    { date: '2024-01-04', calls: 58, proposals: 18, leads: 12 },
    { date: '2024-01-05', calls: 62, proposals: 16, leads: 11 },
    { date: '2024-01-06', calls: 55, proposals: 14, leads: 9 },
    { date: '2024-01-07', calls: 68, proposals: 21, leads: 15 }
  ],
  conversionData: [
    { name: 'Won', value: 23, color: '#10B981' },
    { name: 'Lost', value: 15, color: '#EF4444' },
    { name: 'In Progress', value: 107, color: '#3B82F6' }
  ],
  sourceData: [
    { name: 'LinkedIn', value: 67, color: '#0077B5' },
    { name: 'Reference', value: 38, color: '#10B981' },
    { name: 'Cold Call', value: 29, color: '#F59E0B' },
    { name: 'Campaign', value: 16, color: '#8B5CF6' },
    { name: 'Website', value: 10, color: '#EF4444' }
  ],
  industryData: [
    { name: 'Technology', value: 45, color: '#3B82F6' },
    { name: 'Healthcare', value: 32, color: '#10B981' },
    { name: 'Finance', value: 28, color: '#F59E0B' },
    { name: 'Manufacturing', value: 25, color: '#8B5CF6' },
    { name: 'Education', value: 18, color: '#EF4444' },
    { name: 'Other', value: 12, color: '#6B7280' }
  ]
}

const demoActivityFeed: ActivityItem[] = [
  {
    id: '1',
    action: 'Stage Updated',
    user: 'Rahul Sharma',
    userId: 'demo-bd-1',
    leadName: 'TechCorp Solutions',
    leadId: 'demo-lead-1',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    details: 'Changed to Proposal Sent',
    type: 'stage_change'
  },
  {
    id: '2',
    action: 'Proposal Sent',
    user: 'Priya Patel',
    userId: 'demo-bd-2',
    leadName: 'StartupHub India',
    leadId: 'demo-lead-2',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    details: 'Sent via Email',
    type: 'proposal'
  },
  {
    id: '3',
    action: 'Call Made',
    user: 'Arjun Kumar',
    userId: 'demo-bd-3',
    leadName: 'Digital Innovations Ltd',
    leadId: 'demo-lead-3',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    details: 'Follow-up call completed',
    type: 'call'
  },
  {
    id: '4',
    action: 'Lead Created',
    user: 'Executive User',
    userId: 'demo-bd-executive',
    leadName: 'Global Enterprises',
    leadId: 'demo-lead-4',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    details: 'New lead from LinkedIn',
    type: 'lead_created'
  },
  {
    id: '5',
    action: 'Task Completed',
    user: 'Rahul Sharma',
    userId: 'demo-bd-1',
    leadName: 'TechCorp Solutions',
    leadId: 'demo-lead-1',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    details: 'Follow-up task completed',
    type: 'task'
  },
  {
    id: '6',
    action: 'Proposal Sent',
    user: 'Executive User',
    userId: 'demo-bd-executive',
    leadName: 'Innovation Labs',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    details: 'Sent via WhatsApp',
    type: 'proposal'
  },
  {
    id: '7',
    action: 'Stage Updated',
    user: 'Priya Patel',
    userId: 'demo-bd-2',
    leadName: 'Future Tech Corp',
    timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    details: 'Changed to Won',
    type: 'stage_change'
  },
  {
    id: '8',
    action: 'Call Made',
    user: 'Arjun Kumar',
    userId: 'demo-bd-3',
    leadName: 'Smart Solutions Inc',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    details: 'Initial contact call',
    type: 'call'
  }
]

export const useReports = () => {
  const [overallMetrics, setOverallMetrics] = useState<OverallMetrics>(demoOverallMetrics)
  const [userMetrics, setUserMetrics] = useState<UserMetrics[]>(demoUserMetrics)
  const [chartData, setChartData] = useState<ChartData>(demoChartData)
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>(demoActivityFeed)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'last30days'
  })
  const { user, profile } = useAuth()
  const { leads } = useLeads()
  const { tasks } = useTasks()

  const fetchReports = async () => {
    if (!user || !profile) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - calculate metrics from demo data
      setTimeout(() => {
        const calculatedOverallMetrics = calculateOverallMetricsFromData(leads, tasks, filters)
        const calculatedUserMetrics = calculateUserMetricsFromData(leads, tasks, filters)
        const calculatedChartData = calculateChartDataFromData(leads, tasks, filters)
        
        setOverallMetrics(calculatedOverallMetrics)
        setUserMetrics(calculatedUserMetrics)
        setChartData(calculatedChartData)
        setLoading(false)
      }, 500)
      return
    }

    try {
      // In real implementation, this would fetch aggregated data from the backend
      const calculatedOverallMetrics = calculateOverallMetricsFromData(leads, tasks, filters)
      const calculatedUserMetrics = calculateUserMetricsFromData(leads, tasks, filters)
      const calculatedChartData = calculateChartDataFromData(leads, tasks, filters)
      
      setOverallMetrics(calculatedOverallMetrics)
      setUserMetrics(calculatedUserMetrics)
      setChartData(calculatedChartData)
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
    setLoading(false)
  }

  const calculateOverallMetricsFromData = (leads: any[], tasks: any[], filters: ReportFilters): OverallMetrics => {
    const filteredLeads = filterDataByDateRange(leads, filters)
    const filteredTasks = filterDataByDateRange(tasks, filters)

    // Calculate pipeline metrics
    const pipeline = {
      new: filteredLeads.filter(l => l.stage === 'New').length,
      contacted: filteredLeads.filter(l => l.stage === 'Contacted').length,
      proposalSent: filteredLeads.filter(l => l.stage === 'Proposal Sent').length,
      negotiation: filteredLeads.filter(l => l.stage === 'Negotiation').length
    }

    // Calculate other metrics
    const onboarded = filteredLeads.filter(l => ['Onboarded', 'Won'].includes(l.stage)).length
    const dealsLost = filteredLeads.filter(l => l.stage === 'Lost').length
    const tasksCompleted = filteredTasks.filter(t => t.completed).length
    const tasksPending = filteredTasks.filter(t => !t.completed).length

    // Calculate revenue metrics
    const revenueWon = filteredLeads
      .filter(l => ['Onboarded', 'Won'].includes(l.stage))
      .reduce((sum, l) => sum + (l.value || 0), 0)
    
    const revenueForecast = filteredLeads
      .filter(l => ['Contacted', 'Proposal Sent', 'Negotiation'].includes(l.stage))
      .reduce((sum, l) => sum + (l.potential_value || l.value || 0), 0)

    // Calculate lead source breakdown
    const sourceMap = new Map()
    filteredLeads.forEach(lead => {
      const source = lead.lead_source || 'Unknown'
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
    })
    
    const leadSourceBreakdown = Array.from(sourceMap.entries()).map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / filteredLeads.length) * 100)
    }))

    // Calculate industry breakdown
    const industryMap = new Map()
    filteredLeads.forEach(lead => {
      const industry = lead.industry_name || 'Unknown'
      industryMap.set(industry, (industryMap.get(industry) || 0) + 1)
    })
    
    const industryBreakdown = Array.from(industryMap.entries()).map(([industry, count]) => ({
      industry,
      count,
      percentage: Math.round((count / filteredLeads.length) * 100)
    }))

    return {
      callsMade: Math.floor(Math.random() * 400) + 200, // Simulated
      proposalsSent: Math.floor(Math.random() * 100) + 50, // Simulated
      onboarded,
      pipeline,
      dealsLost,
      tasksCompleted,
      tasksPending,
      revenueForecast,
      revenueWon,
      leadSourceBreakdown,
      industryBreakdown
    }
  }

  const calculateUserMetricsFromData = (leads: any[], tasks: any[], filters: ReportFilters): UserMetrics[] => {
    // Group data by user
    const userMap = new Map()
    
    // Initialize with demo users
    demoUserMetrics.forEach(user => {
      userMap.set(user.id, { ...user })
    })

    // Calculate metrics from actual data if available
    leads.forEach(lead => {
      const userId = lead.assigned_to
      if (userMap.has(userId)) {
        const user = userMap.get(userId)
        user.totalLeads = (user.totalLeads || 0) + 1
        
        if (['Onboarded', 'Won'].includes(lead.stage)) {
          user.leadsOnboarded = (user.leadsOnboarded || 0) + 1
          user.revenue = (user.revenue || 0) + (lead.value || 0)
        }
        
        if (lead.stage === 'Lost') {
          user.dealsLost = (user.dealsLost || 0) + 1
        }
        
        // Update pipeline
        if (!user.pipeline) user.pipeline = { new: 0, contacted: 0, proposalSent: 0, negotiation: 0 }
        if (lead.stage === 'New') user.pipeline.new++
        if (lead.stage === 'Contacted') user.pipeline.contacted++
        if (lead.stage === 'Proposal Sent') user.pipeline.proposalSent++
        if (lead.stage === 'Negotiation') user.pipeline.negotiation++
      }
    })

    tasks.forEach(task => {
      const userId = task.user_id
      if (userMap.has(userId)) {
        const user = userMap.get(userId)
        if (task.completed) {
          user.tasksCompleted = (user.tasksCompleted || 0) + 1
        } else {
          user.tasksPending = (user.tasksPending || 0) + 1
        }
      }
    })

    // Calculate conversion ratios
    userMap.forEach((user, userId) => {
      const totalDeals = user.leadsOnboarded + user.dealsLost
      user.conversionRatio = totalDeals > 0 ? Math.round((user.leadsOnboarded / totalDeals) * 100) : 0
    })

    return Array.from(userMap.values()).sort((a, b) => b.leadsOnboarded - a.leadsOnboarded)
  }

  const calculateChartDataFromData = (leads: any[], tasks: any[], filters: ReportFilters): ChartData => {
    const filteredLeads = filterDataByDateRange(leads, filters)

    // Stage data
    const stageData = [
      { name: 'New', count: filteredLeads.filter(l => l.stage === 'New').length, color: '#3B82F6' },
      { name: 'Contacted', count: filteredLeads.filter(l => l.stage === 'Contacted').length, color: '#EAB308' },
      { name: 'Proposal Sent', count: filteredLeads.filter(l => l.stage === 'Proposal Sent').length, color: '#8B5CF6' },
      { name: 'Negotiation', count: filteredLeads.filter(l => l.stage === 'Negotiation').length, color: '#F59E0B' },
      { name: 'Won', count: filteredLeads.filter(l => ['Won', 'Onboarded'].includes(l.stage)).length, color: '#10B981' },
      { name: 'Lost', count: filteredLeads.filter(l => l.stage === 'Lost').length, color: '#EF4444' }
    ]

    // Use demo data for other charts
    return {
      stageData,
      timeSeriesData: demoChartData.timeSeriesData,
      conversionData: demoChartData.conversionData,
      sourceData: demoChartData.sourceData,
      industryData: demoChartData.industryData
    }
  }

  const filterDataByDateRange = (data: any[], filters: ReportFilters) => {
    const now = new Date()
    let startDate: Date

    switch (filters.dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'last7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        startDate = filters.customStartDate ? new Date(filters.customStartDate) : new Date(0)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    return data.filter(item => {
      const itemDate = new Date(item.created_at || item.updated_at)
      return itemDate >= startDate
    })
  }

  const updateFilters = (newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const exportData = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = {
      overallMetrics,
      userMetrics,
      activityFeed,
      chartData,
      filters,
      exportDate: new Date().toISOString(),
      totalLeads: leads.length,
      totalTasks: tasks.length
    }

    let content: string
    let mimeType: string
    let extension: string

    switch (format) {
      case 'csv':
        // Convert to CSV format
        const csvRows = [
          'User,Calls Made,Proposals Sent,Leads Onboarded,Tasks Completed,Conversion Rate,Revenue',
          ...userMetrics.map(user => 
            `${user.name},${user.callsMade},${user.proposalsSent},${user.leadsOnboarded},${user.tasksCompleted},${user.conversionRatio}%,₹${user.revenue}`
          )
        ]
        content = csvRows.join('\n')
        mimeType = 'text/csv'
        extension = 'csv'
        break
      
      case 'excel':
        // For demo, export as JSON (in real app, would generate Excel file)
        content = JSON.stringify(exportData, null, 2)
        mimeType = 'application/json'
        extension = 'json'
        break
      
      case 'pdf':
        // For demo, export as JSON (in real app, would generate PDF)
        content = JSON.stringify(exportData, null, 2)
        mimeType = 'application/json'
        extension = 'json'
        break
      
      default:
        content = JSON.stringify(exportData, null, 2)
        mimeType = 'application/json'
        extension = 'json'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crm-report-${new Date().toISOString().split('T')[0]}.${extension}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getUserDetails = (userId: string) => {
    return userMetrics.find(user => user.id === userId)
  }

  const getFilteredActivityFeed = () => {
    let filtered = activityFeed

    if (filters.userId) {
      filtered = filtered.filter(activity => activity.userId === filters.userId)
    }

    return filtered.slice(0, 20) // Limit to recent 20 activities
  }

  useEffect(() => {
    fetchReports()
  }, [user, profile, leads, tasks, filters])

  return {
    overallMetrics,
    userMetrics,
    chartData,
    activityFeed: getFilteredActivityFeed(),
    loading,
    filters,
    updateFilters,
    exportData,
    getUserDetails,
    refetch: fetchReports
  }
}