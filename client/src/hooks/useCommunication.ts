import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  placeholders: string[]
}

export interface WhatsAppTemplate {
  id: string
  name: string
  content: string
  placeholders: string[]
  type: 'text' | 'document' | 'image'
}

export interface CommunicationLog {
  id: string
  leadId: string
  userId: string
  type: 'email' | 'whatsapp'
  template: string
  content: string
  recipient: string
  status: 'sent' | 'delivered' | 'opened' | 'read' | 'failed'
  timestamp: string
  metadata?: {
    subject?: string
    attachments?: string[]
    mediaUrl?: string
  }
}

// Demo email templates
const demoEmailTemplates: EmailTemplate[] = [
  {
    id: 'email-1',
    name: 'Initial Contact',
    subject: 'Partnership Opportunity - {{company_name}}',
    content: `Dear {{contact_name}},

I hope this email finds you well. I'm reaching out from Jobs Territory regarding potential recruitment partnership opportunities with {{company_name}}.

We specialize in providing top-tier talent across various industries and would love to discuss how we can support your hiring needs.

Would you be available for a brief call this week to explore how we can add value to your recruitment process?

Best regards,
{{consultant_name}}
Jobs Territory Team`,
    placeholders: ['company_name', 'contact_name', 'consultant_name']
  },
  {
    id: 'email-2',
    name: 'Follow-up',
    subject: 'Following up on our conversation - {{company_name}}',
    content: `Hi {{contact_name}},

Thank you for taking the time to speak with me earlier about {{company_name}}'s recruitment needs.

As discussed, I'm attaching our service overview and rate card for your review. We're confident we can help you find the right talent for your {{position_type}} requirements.

Please let me know if you have any questions or would like to schedule a follow-up meeting.

Looking forward to hearing from you.

Best regards,
{{consultant_name}}`,
    placeholders: ['company_name', 'contact_name', 'position_type', 'consultant_name']
  },
  {
    id: 'email-3',
    name: 'Proposal Submission',
    subject: 'Recruitment Proposal - {{position_type}} for {{company_name}}',
    content: `Dear {{contact_name}},

Please find attached our comprehensive recruitment proposal for the {{position_type}} position at {{company_name}}.

Key highlights:
- Turn Around Time: {{tat}} days
- Service Fee: {{service_fee}}
- Replacement Guarantee: {{replacement_guarantee}}

We're excited about the opportunity to partner with {{company_name}} and help you build your dream team.

Please review the proposal and let me know if you have any questions.

Best regards,
{{consultant_name}}
Jobs Territory Team`,
    placeholders: ['company_name', 'contact_name', 'position_type', 'tat', 'service_fee', 'replacement_guarantee', 'consultant_name']
  }
]

// Demo WhatsApp templates
const demoWhatsAppTemplates: WhatsAppTemplate[] = [
  {
    id: 'whatsapp-1',
    name: 'Quick Introduction',
    content: `Hi {{contact_name}}! 👋

This is {{consultant_name}} from Jobs Territory. We specialize in recruitment services and would love to discuss potential partnership opportunities with {{company_name}}.

Would you be interested in a quick call to explore how we can support your hiring needs?`,
    placeholders: ['contact_name', 'consultant_name', 'company_name'],
    type: 'text'
  },
  {
    id: 'whatsapp-2',
    name: 'Proposal Shared',
    content: `Hi {{contact_name}},

I've prepared a customized recruitment proposal for {{company_name}}. 

Key details:
✅ Position: {{position_type}}
✅ TAT: {{tat}} days
✅ Competitive rates with quality guarantee

Would you like me to share the detailed proposal via email or WhatsApp?`,
    placeholders: ['contact_name', 'company_name', 'position_type', 'tat'],
    type: 'text'
  },
  {
    id: 'whatsapp-3',
    name: 'Follow-up Reminder',
    content: `Hi {{contact_name}},

Hope you're doing well! Just following up on our discussion about {{company_name}}'s recruitment needs.

We have some excellent candidates in our pipeline that might be a perfect fit for your requirements.

Let me know when would be a good time to connect! 😊`,
    placeholders: ['contact_name', 'company_name'],
    type: 'text'
  }
]

export const useCommunication = () => {
  const [loading, setLoading] = useState(false)
  const { user, profile } = useAuth()
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([])

  const sendEmail = async (
    leadId: string,
    templateId: string,
    placeholderValues: Record<string, string>,
    customSubject?: string,
    customContent?: string
  ): Promise<void> => {
    if (!user || !profile) throw new Error('User not authenticated')

    setLoading(true)
    try {
      const template = demoEmailTemplates.find(t => t.id === templateId)
      if (!template) throw new Error('Template not found')

      // Replace placeholders in subject and content
      let subject = customSubject || template.subject
      let content = customContent || template.content

      Object.entries(placeholderValues).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`
        subject = subject.replace(new RegExp(placeholder, 'g'), value)
        content = content.replace(new RegExp(placeholder, 'g'), value)
      })

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create communication log
      const log: CommunicationLog = {
        id: `email-${Date.now()}`,
        leadId,
        userId: user.id,
        type: 'email',
        template: template.name,
        content,
        recipient: placeholderValues.contact_email || 'recipient@example.com',
        status: 'sent',
        timestamp: new Date().toISOString(),
        metadata: {
          subject,
          attachments: []
        }
      }

      setCommunicationLogs(prev => [log, ...prev])

      // Simulate status updates
      setTimeout(() => {
        setCommunicationLogs(prev => 
          prev.map(l => l.id === log.id ? { ...l, status: 'delivered' } : l)
        )
      }, 3000)

      setTimeout(() => {
        setCommunicationLogs(prev => 
          prev.map(l => l.id === log.id ? { ...l, status: 'opened' } : l)
        )
      }, 8000)

      toast.success('Email sent successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const sendWhatsApp = async (
    leadId: string,
    templateId: string,
    placeholderValues: Record<string, string>,
    customContent?: string,
    mediaUrl?: string
  ): Promise<void> => {
    if (!user || !profile) throw new Error('User not authenticated')

    setLoading(true)
    try {
      const template = demoWhatsAppTemplates.find(t => t.id === templateId)
      if (!template) throw new Error('Template not found')

      // Replace placeholders in content
      let content = customContent || template.content

      Object.entries(placeholderValues).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`
        content = content.replace(new RegExp(placeholder, 'g'), value)
      })

      // Simulate WhatsApp sending
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Create communication log
      const log: CommunicationLog = {
        id: `whatsapp-${Date.now()}`,
        leadId,
        userId: user.id,
        type: 'whatsapp',
        template: template.name,
        content,
        recipient: placeholderValues.contact_phone || '+1234567890',
        status: 'sent',
        timestamp: new Date().toISOString(),
        metadata: {
          mediaUrl
        }
      }

      setCommunicationLogs(prev => [log, ...prev])

      // Simulate status updates
      setTimeout(() => {
        setCommunicationLogs(prev => 
          prev.map(l => l.id === log.id ? { ...l, status: 'delivered' } : l)
        )
      }, 2000)

      setTimeout(() => {
        setCommunicationLogs(prev => 
          prev.map(l => l.id === log.id ? { ...l, status: 'read' } : l)
        )
      }, 6000)

      toast.success('WhatsApp message sent successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send WhatsApp message')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getCommunicationLogs = (leadId: string): CommunicationLog[] => {
    return communicationLogs.filter(log => log.leadId === leadId)
  }

  const getEmailTemplates = (): EmailTemplate[] => {
    return demoEmailTemplates
  }

  const getWhatsAppTemplates = (): WhatsAppTemplate[] => {
    return demoWhatsAppTemplates
  }

  return {
    loading,
    sendEmail,
    sendWhatsApp,
    getCommunicationLogs,
    getEmailTemplates,
    getWhatsAppTemplates,
    communicationLogs
  }
}