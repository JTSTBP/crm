import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Database } from '../lib/supabase'

type Remark = Database['public']['Tables']['remarks']['Row'] & {
  profile?: Database['public']['Tables']['profiles']['Row']
}

// Demo data for when Supabase is not configured
const demoRemarks: Remark[] = [
  {
    id: '1',
    lead_id: '1',
    user_id: '1',
    type: 'text',
    content: 'Initial contact made. Client seems interested in our services.',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    profile: {
      id: '1',
      user_id: '1',
      full_name: 'John Admin',
      role: 'admin',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  },
  {
    id: '2',
    lead_id: '1',
    user_id: '2',
    type: 'text',
    content: 'Follow-up call scheduled for tomorrow at 2 PM.',
    created_at: '2024-01-16T14:20:00Z',
    updated_at: '2024-01-16T14:20:00Z',
    profile: {
      id: '2',
      user_id: '2',
      full_name: 'Sarah Manager',
      role: 'manager',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  },
  {
    id: '3',
    lead_id: '2',
    user_id: '3',
    type: 'voice',
    content: 'Voice note: Client wants to discuss pricing for bulk hiring.',
    created_at: '2024-01-17T09:15:00Z',
    updated_at: '2024-01-17T09:15:00Z',
    profile: {
      id: '3',
      user_id: '3',
      full_name: 'Mike Executive',
      role: 'bd_executive',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  }
]

// Check if we're in demo mode (placeholder Supabase config)
const isDemoMode = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  return !supabaseUrl || !supabaseKey || 
         supabaseUrl.includes('placeholder') || 
         supabaseKey.includes('placeholder')
}

export const useRemarks = (leadId: string) => {
  const [remarks, setRemarks] = useState<Remark[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchRemarks = async () => {
    if (!leadId) return

    // Use demo data if Supabase is not configured
    if (isDemoMode()) {
      setTimeout(() => {
        const filteredRemarks = demoRemarks.filter(remark => remark.lead_id === leadId)
        setRemarks(filteredRemarks)
        setLoading(false)
      }, 500)
      return
    }

    const { data, error } = await supabase
      .from('remarks')
      .select(`
        *,
        profile:profiles!remarks_user_id_fkey(*)
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching remarks:', error)
    } else {
      setRemarks(data || [])
    }
    setLoading(false)
  }

  const addRemark = async (type: 'text' | 'voice' | 'file', content: string) => {
    if (!user) return

    // Handle demo mode
    if (isDemoMode()) {
      const newRemark: Remark = {
        id: Date.now().toString(),
        lead_id: leadId,
        user_id: user.id,
        type,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile: {
          id: user.id,
          user_id: user.id,
          full_name: user.email?.split('@')[0] || 'User',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
      
      setTimeout(() => {
        setRemarks(prev => [...prev, newRemark])
      }, 300)
      return
    }

    const { error } = await supabase
      .from('remarks')
      .insert([{
        lead_id: leadId,
        user_id: user.id,
        type,
        content
      }])

    if (error) {
      console.error('Error adding remark:', error)
      throw error
    }

    await fetchRemarks()
  }

  useEffect(() => {
    fetchRemarks()
  }, [leadId])

  return {
    remarks,
    loading,
    addRemark,
    refetch: fetchRemarks
  }
}