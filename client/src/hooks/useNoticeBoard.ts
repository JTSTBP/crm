import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface Notice {
  id: string
  title: string
  content: string
  category: 'Targets' | 'Policy' | 'General' | 'News'
  createdBy: string
  createdByName: string
  createdByRole: string
  createdAt: string
  updatedAt: string
  isNew?: boolean
}

// Demo notices data
const demoNotices: Notice[] = [
  {
    id: 'notice-1',
    title: 'Q1 2025 Sales Targets Announced',
    content: `<h3>Q1 2025 Sales Targets</h3>
<p>We're excited to announce our ambitious targets for Q1 2025:</p>
<ul>
<li><strong>Total Revenue Target:</strong> ₹15 Crores</li>
<li><strong>New Leads Target:</strong> 500 leads</li>
<li><strong>Conversion Rate Target:</strong> 25%</li>
<li><strong>Client Onboarding:</strong> 75 new clients</li>
</ul>
<p>Each BD Executive is expected to contribute:</p>
<ul>
<li>100 new leads per month</li>
<li>15 proposals per month</li>
<li>5 successful conversions per month</li>
</ul>
<p><strong>Incentive Structure:</strong></p>
<ul>
<li>Achieving 100% target: ₹50,000 bonus</li>
<li>Exceeding 120% target: ₹1,00,000 bonus + recognition</li>
</ul>
<p>Let's make Q1 2025 our best quarter yet! 🚀</p>`,
    category: 'Targets',
    createdBy: 'demo-admin',
    createdByName: 'Admin User',
    createdByRole: 'Admin',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isNew: true
  },
  {
    id: 'notice-2',
    title: 'Updated Client Communication Policy',
    content: `<h3>Client Communication Guidelines - Effective Immediately</h3>
<p>To maintain our high standards of professionalism, please follow these updated guidelines:</p>

<h4>Email Communication:</h4>
<ul>
<li>Always use company email templates</li>
<li>Response time: Within 4 hours during business hours</li>
<li>CC your manager on important client emails</li>
<li>Use professional signatures with contact details</li>
</ul>

<h4>Phone Communication:</h4>
<ul>
<li>Answer calls within 3 rings</li>
<li>Always introduce yourself with name and company</li>
<li>Log all call details in CRM within 30 minutes</li>
<li>Follow up important calls with email summary</li>
</ul>

<h4>WhatsApp Communication:</h4>
<ul>
<li>Use only for urgent matters or client preference</li>
<li>Maintain professional tone</li>
<li>Share documents via email, not WhatsApp</li>
<li>Log WhatsApp interactions in CRM</li>
</ul>

<p><strong>Non-compliance may result in performance review.</strong></p>`,
    category: 'Policy',
    createdBy: 'demo-manager',
    createdByName: 'Manager User',
    createdByRole: 'Manager',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notice-3',
    title: 'New Rate Card v2.0 Released',
    content: `<h3>Rate Card v2.0 Now Active</h3>
<p>We've updated our service pricing to remain competitive in the market:</p>

<h4>Key Changes:</h4>
<ul>
<li><strong>Software Engineer:</strong> ₹1.5L → ₹1.6L (base price)</li>
<li><strong>Senior Software Engineer:</strong> ₹2.5L → ₹2.7L</li>
<li><strong>Leadership Roles:</strong> Enhanced pricing structure</li>
<li><strong>Volume Hiring:</strong> Better discount tiers</li>
</ul>

<h4>Important Notes:</h4>
<ul>
<li>All new proposals must use Rate Card v2.0</li>
<li>Existing negotiations can continue with v1.0</li>
<li>Update your proposal templates accordingly</li>
</ul>

<p>Training session on new pricing scheduled for Friday 2 PM.</p>`,
    category: 'General',
    createdBy: 'demo-admin',
    createdByName: 'Admin User',
    createdByRole: 'Admin',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notice-4',
    title: 'Holiday Calendar 2025 & Leave Policy',
    content: `<h3>Holiday Calendar 2025</h3>
<p>Please find the official holiday calendar for 2025:</p>

<h4>National Holidays:</h4>
<ul>
<li>Republic Day - January 26</li>
<li>Holi - March 14</li>
<li>Independence Day - August 15</li>
<li>Gandhi Jayanti - October 2</li>
<li>Diwali - October 20-21</li>
<li>Christmas - December 25</li>
</ul>

<h4>Updated Leave Policy:</h4>
<ul>
<li><strong>Annual Leave:</strong> 24 days per year</li>
<li><strong>Sick Leave:</strong> 12 days per year</li>
<li><strong>Casual Leave:</strong> 8 days per year</li>
<li><strong>Maternity/Paternity:</strong> As per government norms</li>
</ul>

<h4>Leave Application Process:</h4>
<ul>
<li>Apply at least 7 days in advance for planned leave</li>
<li>Manager approval required for leaves > 3 days</li>
<li>Update leave calendar and inform team</li>
</ul>`,
    category: 'Policy',
    createdBy: 'demo-admin',
    createdByName: 'Admin User',
    createdByRole: 'Admin',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notice-5',
    title: 'Team Performance - December 2024',
    content: `<h3>Outstanding Performance in December! 🎉</h3>
<p>Congratulations to our entire team for an exceptional December performance:</p>

<h4>Team Achievements:</h4>
<ul>
<li><strong>Total Revenue:</strong> ₹2.8 Crores (140% of target)</li>
<li><strong>New Clients Onboarded:</strong> 28 clients</li>
<li><strong>Conversion Rate:</strong> 32% (highest ever!)</li>
<li><strong>Client Satisfaction:</strong> 4.8/5 average rating</li>
</ul>

<h4>Top Performers:</h4>
<ul>
<li><strong>🥇 Rahul Sharma:</strong> 8 conversions, ₹85L revenue</li>
<li><strong>🥈 Priya Patel:</strong> 7 conversions, ₹72L revenue</li>
<li><strong>🥉 Arjun Kumar:</strong> 6 conversions, ₹68L revenue</li>
</ul>

<p>Special recognition to all team members for their dedication and hard work!</p>
<p><strong>Team celebration dinner scheduled for January 15th at 7 PM.</strong></p>`,
    category: 'News',
    createdBy: 'demo-manager',
    createdByName: 'Manager User',
    createdByRole: 'Manager',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
]

export const useNoticeBoard = () => {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()

  const fetchNotices = async () => {
    if (!user || !profile) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - return demo data
      setTimeout(() => {
        // Mark notices as new if created within last 7 days
        const noticesWithNewFlag = demoNotices.map(notice => ({
          ...notice,
          isNew: new Date(notice.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }))
        setNotices(noticesWithNewFlag)
        setLoading(false)
      }, 500)
      return
    }

    try {
      // In real implementation, this would fetch from a notices table
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('action', 'Notice Posted')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notices:', error)
      } else {
        // Transform activity logs to notices format
        const transformedNotices = (data || []).map(log => ({
          id: log.id,
          title: log.details || 'Notice',
          content: log.details || '',
          category: 'General' as const,
          createdBy: log.user_id,
          createdByName: 'User',
          createdByRole: 'Admin',
          createdAt: log.created_at,
          updatedAt: log.created_at,
          isNew: new Date(log.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }))
        setNotices(transformedNotices)
      }
    } catch (error) {
      console.error('Error fetching notices:', error)
    }
    setLoading(false)
  }

  const createNotice = async (noticeData: Partial<Notice>) => {
    if (!user || !profile) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate creating notice
      const newNotice: Notice = {
        id: `notice-${Date.now()}`,
        title: noticeData.title || '',
        content: noticeData.content || '',
        category: noticeData.category || 'General',
        createdBy: user.id,
        createdByName: profile.name,
        createdByRole: profile.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isNew: true
      }
      
      setNotices(prev => [newNotice, ...prev])
      return
    }

    try {
      // In real implementation, this would create a notice record
      await supabase
        .from('activity_logs')
        .insert([{
          user_id: user.id,
          action: 'Notice Posted',
          details: noticeData.title
        }])

      await fetchNotices()
    } catch (error) {
      console.error('Error creating notice:', error)
      throw error
    }
  }

  const updateNotice = async (id: string, updates: Partial<Notice>) => {
    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate updating notice
      setNotices(prev => prev.map(notice => 
        notice.id === id 
          ? { ...notice, ...updates, updatedAt: new Date().toISOString() }
          : notice
      ))
      return
    }

    try {
      // In real implementation, this would update the notice record
      await fetchNotices()
    } catch (error) {
      console.error('Error updating notice:', error)
      throw error
    }
  }

  const deleteNotice = async (id: string) => {
    if (!user || !profile) return

    // Check permissions - only Admin and Manager can delete notices
    if (profile.role !== 'Admin' && profile.role !== 'Manager') {
      throw new Error('You do not have permission to delete notices')
    }

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate deleting notice
      setNotices(prev => prev.filter(notice => notice.id !== id))
      return
    }

    try {
      // In real implementation, this would delete the notice record
      await fetchNotices()
    } catch (error) {
      console.error('Error deleting notice:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [user, profile])

  return {
    notices,
    loading,
    createNotice,
    updateNotice,
    deleteNotice,
    refetch: fetchNotices
  }
}