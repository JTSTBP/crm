import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Database } from '../lib/supabase'

type Proposal = Database['public']['Tables']['proposals']['Row'] & {
  lead?: Database['public']['Tables']['leads']['Row']
  user?: Database['public']['Tables']['profiles']['Row']
  template?: Database['public']['Tables']['proposal_templates']['Row']
}

// Demo proposals data
const demoProposals: Proposal[] = [
  {
    id: 'demo-proposal-1',
    lead_id: 'demo-lead-1',
    user_id: 'demo-bd-executive',
    template_id: 'demo-template-1',
    template_used: 'Standard IT Position',
    rate_card_version: 'v1.0',
    pdf_link: null,
    content: 'Detailed proposal content for TechCorp Solutions...',
    sent_via: 'Email',
    status: 'Sent',
    sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    email_sent: true,
    whatsapp_sent: false,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lead: {
      id: 'demo-lead-1',
      company_name: 'TechCorp Solutions',
      contact_name: 'Rajesh Kumar',
      contact_email: 'rajesh@techcorp.com',
      contact_phone: '+91 98765 43210',
      stage: 'Proposal Sent',
      assigned_to: 'demo-bd-executive'
    },
    user: {
      id: 'demo-bd-executive',
      name: 'Executive User',
      email: 'executive@jobsterritory.com',
      role: 'BD Executive'
    }
  },
  {
    id: 'demo-proposal-2',
    lead_id: 'demo-lead-2',
    user_id: 'demo-bd-executive',
    template_id: 'demo-template-2',
    template_used: 'Leadership Position',
    rate_card_version: 'v1.0',
    pdf_link: 'https://example.com/proposal-2.pdf',
    content: 'Executive search proposal for StartupHub India...',
    sent_via: 'Both',
    status: 'Viewed',
    sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    email_sent: true,
    whatsapp_sent: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lead: {
      id: 'demo-lead-2',
      company_name: 'StartupHub India',
      contact_name: 'Priya Sharma',
      contact_email: 'priya@startuphub.in',
      contact_phone: '+91 87654 32109',
      stage: 'Negotiation',
      assigned_to: 'demo-bd-executive'
    },
    user: {
      id: 'demo-bd-executive',
      name: 'Executive User',
      email: 'executive@jobsterritory.com',
      role: 'BD Executive'
    }
  },
  {
    id: 'demo-proposal-3',
    lead_id: 'demo-lead-3',
    user_id: 'demo-bd-1',
    template_id: 'demo-template-1',
    template_used: 'Standard IT Position',
    rate_card_version: 'v1.0',
    pdf_link: null,
    content: 'Proposal for Digital Innovations Ltd...',
    sent_via: 'WhatsApp',
    status: 'Accepted',
    sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    email_sent: false,
    whatsapp_sent: true,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    lead: {
      id: 'demo-lead-3',
      company_name: 'Digital Innovations Ltd',
      contact_name: 'Amit Patel',
      contact_email: 'amit@digitalinnovations.com',
      contact_phone: '+91 76543 21098',
      stage: 'Won',
      assigned_to: 'demo-bd-1'
    },
    user: {
      id: 'demo-bd-1',
      name: 'Rahul Sharma',
      email: 'rahul@jobsterritory.com',
      role: 'BD Executive'
    }
  }
]

export const useProposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()

  const fetchProposals = async () => {
    if (!user || !profile) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - return demo data
      setTimeout(() => {
        let filteredProposals = demoProposals
        
        // BD Executives only see their proposals
        if (profile.role === 'BD Executive') {
          filteredProposals = demoProposals.filter(proposal => proposal.user_id === user.id)
        }
        
        setProposals(filteredProposals)
        setLoading(false)
      }, 500)
      return
    }

    try {
      let query = supabase
        .from('proposals')
        .select(`
          *,
          lead:leads!proposals_lead_id_fkey(*),
          user:profiles!proposals_user_id_fkey(*),
          template:proposal_templates!proposals_template_id_fkey(*)
        `)

      // BD Executives only see their proposals
      if (profile.role === 'BD Executive') {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching proposals:', error)
      } else {
        setProposals(data || [])
      }
    } catch (error) {
      console.error('Error fetching proposals:', error)
    }
    setLoading(false)
  }

  const createProposal = async (proposalData: Partial<Proposal>) => {
    if (!user) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate creating proposal
      const newProposal: Proposal = {
        id: `demo-proposal-${Date.now()}`,
        lead_id: proposalData.lead_id || '',
        user_id: proposalData.user_id || user.id,
        template_id: proposalData.template_id || null,
        template_used: proposalData.template_used || '',
        rate_card_version: proposalData.rate_card_version || 'v1.0',
        pdf_link: proposalData.pdf_link || null,
        content: proposalData.content || null,
        sent_via: proposalData.sent_via || 'Email',
        status: proposalData.status || 'Draft',
        sent_at: proposalData.sent_at || null,
        email_sent: proposalData.email_sent || false,
        whatsapp_sent: proposalData.whatsapp_sent || false,
        created_at: new Date().toISOString(),
        user: profile
      }
      
      setProposals(prev => [newProposal, ...prev])
      return newProposal
    }

    try {
      const { data, error } = await supabase
        .from('proposals')
        .insert([{ ...proposalData, user_id: proposalData.user_id || user.id }])
        .select()
        .single()

      if (error) {
        console.error('Error creating proposal:', error)
        throw error
      }

      await fetchProposals()
      return data
    } catch (error) {
      console.error('Error creating proposal:', error)
      throw error
    }
  }

  const updateProposal = async (id: string, updates: Partial<Proposal>) => {
    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate updating proposal
      setProposals(prev => prev.map(proposal => 
        proposal.id === id 
          ? { ...proposal, ...updates }
          : proposal
      ))
      return
    }

    try {
      const { error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Error updating proposal:', error)
        throw error
      }

      await fetchProposals()
    } catch (error) {
      console.error('Error updating proposal:', error)
      throw error
    }
  }

  const deleteProposal = async (id: string) => {
    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate deleting proposal
      setProposals(prev => prev.filter(proposal => proposal.id !== id))
      return
    }

    try {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting proposal:', error)
        throw error
      }

      await fetchProposals()
    } catch (error) {
      console.error('Error deleting proposal:', error)
      throw error
    }
  }

  const sendProposal = async (
    proposalId: string, 
    method: 'email' | 'whatsapp' | 'both',
    customContent?: string
  ) => {
    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate sending proposal
      const updates: any = {
        status: 'Sent',
        sent_at: new Date().toISOString()
      }

      if (method === 'email' || method === 'both') {
        updates.email_sent = true
      }
      if (method === 'whatsapp' || method === 'both') {
        updates.whatsapp_sent = true
      }
      if (method === 'both') {
        updates.sent_via = 'Both'
      } else {
        updates.sent_via = method === 'email' ? 'Email' : 'WhatsApp'
      }

      setProposals(prev => prev.map(proposal => 
        proposal.id === proposalId 
          ? { ...proposal, ...updates }
          : proposal
      ))

      // Simulate status progression
      setTimeout(() => {
        setProposals(prev => prev.map(proposal => 
          proposal.id === proposalId 
            ? { ...proposal, status: 'Viewed' }
            : proposal
        ))
      }, 5000)

      return
    }

    try {
      const updates: any = {
        status: 'Sent',
        sent_at: new Date().toISOString()
      }

      if (method === 'email' || method === 'both') {
        updates.email_sent = true
      }
      if (method === 'whatsapp' || method === 'both') {
        updates.whatsapp_sent = true
      }
      if (method === 'both') {
        updates.sent_via = 'Both'
      } else {
        updates.sent_via = method === 'email' ? 'Email' : 'WhatsApp'
      }

      if (customContent) {
        updates.content = customContent
      }

      const { error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', proposalId)

      if (error) {
        console.error('Error sending proposal:', error)
        throw error
      }

      await fetchProposals()
    } catch (error) {
      console.error('Error sending proposal:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchProposals()
  }, [user, profile])

  return {
    proposals,
    loading,
    createProposal,
    updateProposal,
    deleteProposal,
    sendProposal,
    refetch: fetchProposals
  }
}