import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Database } from '../lib/supabase'

type ProposalTemplate = Database['public']['Tables']['proposal_templates']['Row']

// Demo templates data
const demoTemplates: ProposalTemplate[] = [
  {
    id: 'demo-template-1',
    name: 'Standard IT Position',
    subject: 'Proposal for {{position_type}} - {{client_name}}',
    content: `Dear {{client_name}},

Thank you for your interest in our recruitment services. We are pleased to present our proposal for the {{position_type}} position.

**Position Details:**
- Position: {{position_type}}
- Experience Level: {{experience_level}}
- Location: {{location}}
- Turn Around Time: {{tat}} days

**Commercial Terms:**
- Service Fee: {{service_fee}}
- Payment Terms: {{payment_terms}}
- Replacement Guarantee: {{replacement_guarantee}}

We look forward to partnering with you for your hiring needs.

Best regards,
{{consultant_name}}
Jobs Territory Team`,
    placeholders: ['client_name', 'position_type', 'experience_level', 'location', 'tat', 'service_fee', 'payment_terms', 'replacement_guarantee', 'consultant_name'],
    created_by: 'demo-admin',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'demo-template-2',
    name: 'Leadership Position',
    subject: 'Executive Search Proposal - {{position_type}} for {{client_name}}',
    content: `Dear {{client_name}},

We are excited to present our executive search proposal for the {{position_type}} position at your organization.

**Executive Search Details:**
- Position: {{position_type}}
- Reporting Level: {{reporting_level}}
- Industry Focus: {{industry_focus}}
- Search Timeline: {{search_timeline}} weeks

**Our Approach:**
- Comprehensive market mapping
- Targeted headhunting approach
- Thorough candidate assessment
- Reference verification

**Investment:**
- Search Fee: {{search_fee}}
- Payment Schedule: {{payment_schedule}}
- Success Guarantee: {{success_guarantee}}

We are committed to finding the right leadership talent for your organization.

Warm regards,
{{consultant_name}}
Jobs Territory Executive Search Team`,
    placeholders: ['client_name', 'position_type', 'reporting_level', 'industry_focus', 'search_timeline', 'search_fee', 'payment_schedule', 'success_guarantee', 'consultant_name'],
    created_by: 'demo-admin',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const useProposalTemplates = () => {
  const [templates, setTemplates] = useState<ProposalTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()

  const fetchTemplates = async () => {
    if (!user || !profile) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - return demo data
      setTimeout(() => {
        setTemplates(demoTemplates)
        setLoading(false)
      }, 500)
      return
    }

    try {
      const { data, error } = await supabase
        .from('proposal_templates')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching templates:', error)
      } else {
        setTemplates(data || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
    setLoading(false)
  }

  const createTemplate = async (templateData: Partial<ProposalTemplate>) => {
    if (!user) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate creating template
      const newTemplate: ProposalTemplate = {
        id: `demo-template-${Date.now()}`,
        name: templateData.name || '',
        subject: templateData.subject || '',
        content: templateData.content || '',
        placeholders: templateData.placeholders || [],
        created_by: user.id,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setTemplates(prev => [newTemplate, ...prev])
      return
    }

    try {
      const { error } = await supabase
        .from('proposal_templates')
        .insert([{ ...templateData, created_by: user.id }])

      if (error) {
        console.error('Error creating template:', error)
        throw error
      }

      await fetchTemplates()
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  }

  const updateTemplate = async (id: string, updates: Partial<ProposalTemplate>) => {
    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate updating template
      setTemplates(prev => prev.map(template => 
        template.id === id 
          ? { ...template, ...updates, updated_at: new Date().toISOString() }
          : template
      ))
      return
    }

    try {
      const { error } = await supabase
        .from('proposal_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        console.error('Error updating template:', error)
        throw error
      }

      await fetchTemplates()
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  }

  const generateProposal = (template: ProposalTemplate, placeholderValues: Record<string, string>) => {
    let content = template.content
    let subject = template.subject

    // Replace placeholders in content
    Object.entries(placeholderValues).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      content = content.replace(new RegExp(placeholder, 'g'), value)
      subject = subject.replace(new RegExp(placeholder, 'g'), value)
    })

    return { content, subject }
  }

  useEffect(() => {
    fetchTemplates()
  }, [user, profile])

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    generateProposal,
    refetch: fetchTemplates
  }
}