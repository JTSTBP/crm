import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLeads } from './useLeads'
import toast from 'react-hot-toast'

export interface EmailAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string
}

export interface Email {
  id: string
  userId: string
  leadId?: string
  folder: 'Inbox' | 'Sent'
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  attachments: EmailAttachment[]
  status: 'Unread' | 'Read' | 'Sent' | 'Delivered' | 'Opened' | 'Bounced'
  receivedAt?: string
  sentAt?: string
  createdAt: string
  leadName?: string
  companyName?: string
  isImportant?: boolean
  threadId?: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  placeholders: string[]
}

// Demo email data
const demoInboxEmails: Email[] = [
  {
    id: 'inbox-1',
    userId: 'demo-bd-executive',
    leadId: 'demo-lead-1',
    folder: 'Inbox',
    from: 'rajesh@techcorp.com',
    to: ['executive@jobsterritory.com'],
    subject: 'Re: Partnership Opportunity - TechCorp Solutions',
    body: `Hi,

Thank you for reaching out. We are indeed looking for recruitment partners for our upcoming expansion.

Could you please send us your service details and rate card? We have immediate requirements for:
- 5 Senior Software Engineers
- 2 DevOps Engineers
- 1 Engineering Manager

Looking forward to hearing from you.

Best regards,
Rajesh Kumar
CTO, TechCorp Solutions`,
    attachments: [],
    status: 'Unread',
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    leadName: 'Rajesh Kumar',
    companyName: 'TechCorp Solutions',
    isImportant: true
  },
  {
    id: 'inbox-2',
    userId: 'demo-bd-executive',
    leadId: 'demo-lead-2',
    folder: 'Inbox',
    from: 'priya@startuphub.in',
    to: ['executive@jobsterritory.com'],
    subject: 'Proposal Review - StartupHub India',
    body: `Hello,

We have reviewed your proposal for our recruitment needs. The terms look good overall.

However, we would like to discuss the timeline for the leadership positions. Can we schedule a call this week?

Also, could you provide references from similar startups you've worked with?

Thanks,
Priya Sharma
Founder & CEO`,
    attachments: [],
    status: 'Read',
    receivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    leadName: 'Priya Sharma',
    companyName: 'StartupHub India'
  },
  {
    id: 'inbox-3',
    userId: 'demo-bd-executive',
    folder: 'Inbox',
    from: 'hr@globalent.com',
    to: ['executive@jobsterritory.com'],
    subject: 'Urgent: Volume Hiring Requirements',
    body: `Dear Jobs Territory Team,

We have an urgent requirement for volume hiring:
- 50 Software Developers (Various levels)
- 20 Quality Assurance Engineers
- 15 Business Analysts

Timeline: Need to close these positions within 45 days.

Please share your proposal at the earliest.

Regards,
HR Team
Global Enterprises`,
    attachments: [
      {
        id: 'att-1',
        name: 'Job_Descriptions.pdf',
        size: 245760,
        type: 'application/pdf',
        url: '#'
      }
    ],
    status: 'Unread',
    receivedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    companyName: 'Global Enterprises',
    isImportant: true
  },
  {
    id: 'inbox-4',
    userId: 'demo-bd-executive',
    folder: 'Inbox',
    from: 'noreply@linkedin.com',
    to: ['executive@jobsterritory.com'],
    subject: 'New connection request from Amit Verma',
    body: `You have a new connection request on LinkedIn from Amit Verma, VP Technology at Innovation Labs.

View profile: https://linkedin.com/in/amitverma

This could be a potential lead for your recruitment services.`,
    attachments: [],
    status: 'Read',
    receivedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  }
]

const demoSentEmails: Email[] = [
  {
    id: 'sent-1',
    userId: 'demo-bd-executive',
    leadId: 'demo-lead-1',
    folder: 'Sent',
    from: 'executive@jobsterritory.com',
    to: ['rajesh@techcorp.com'],
    subject: 'Partnership Opportunity - TechCorp Solutions',
    body: `Dear Rajesh,

I hope this email finds you well. I'm reaching out from Jobs Territory regarding potential recruitment partnership opportunities with TechCorp Solutions.

We specialize in providing top-tier talent across various industries and would love to discuss how we can support your hiring needs.

Would you be available for a brief call this week to explore how we can add value to your recruitment process?

Best regards,
Executive User
Jobs Territory Team`,
    attachments: [
      {
        id: 'att-sent-1',
        name: 'Jobs_Territory_Brochure.pdf',
        size: 1024000,
        type: 'application/pdf',
        url: '#'
      }
    ],
    status: 'Opened',
    sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    leadName: 'Rajesh Kumar',
    companyName: 'TechCorp Solutions'
  },
  {
    id: 'sent-2',
    userId: 'demo-bd-executive',
    leadId: 'demo-lead-2',
    folder: 'Sent',
    from: 'executive@jobsterritory.com',
    to: ['priya@startuphub.in'],
    subject: 'Recruitment Proposal - Leadership Positions for StartupHub India',
    body: `Dear Priya,

Please find attached our comprehensive recruitment proposal for the leadership positions at StartupHub India.

Key highlights:
- Turn Around Time: 21 days
- Service Fee: 16.67% of CTC
- Replacement Guarantee: 90 days

We're excited about the opportunity to partner with StartupHub India and help you build your dream team.

Please review the proposal and let me know if you have any questions.

Best regards,
Executive User
Jobs Territory Team`,
    attachments: [
      {
        id: 'att-sent-2',
        name: 'StartupHub_Proposal.pdf',
        size: 512000,
        type: 'application/pdf',
        url: '#'
      }
    ],
    status: 'Delivered',
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    leadName: 'Priya Sharma',
    companyName: 'StartupHub India'
  },
  {
    id: 'sent-3',
    userId: 'demo-bd-executive',
    folder: 'Sent',
    from: 'executive@jobsterritory.com',
    to: ['amit@digitalinnovations.com'],
    subject: 'Following up on our conversation - Digital Innovations Ltd',
    body: `Hi Amit,

Thank you for taking the time to speak with me earlier about Digital Innovations Ltd's recruitment needs.

As discussed, I'm attaching our service overview and rate card for your review. We're confident we can help you find the right talent for your IT requirements.

Please let me know if you have any questions or would like to schedule a follow-up meeting.

Looking forward to hearing from you.

Best regards,
Executive User`,
    attachments: [],
    status: 'Sent',
    sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    companyName: 'Digital Innovations Ltd'
  }
]

const demoEmailTemplates: EmailTemplate[] = [
  {
    id: 'template-1',
    name: 'Initial Contact',
    subject: 'Partnership Opportunity - {{company_name}}',
    body: `Dear {{contact_name}},

I hope this email finds you well. I'm reaching out from Jobs Territory regarding potential recruitment partnership opportunities with {{company_name}}.

We specialize in providing top-tier talent across various industries and would love to discuss how we can support your hiring needs.

Would you be available for a brief call this week to explore how we can add value to your recruitment process?

Best regards,
{{consultant_name}}
Jobs Territory Team`,
    placeholders: ['company_name', 'contact_name', 'consultant_name']
  },
  {
    id: 'template-2',
    name: 'Follow-up',
    subject: 'Following up on our conversation - {{company_name}}',
    body: `Hi {{contact_name}},

Thank you for taking the time to speak with me earlier about {{company_name}}'s recruitment needs.

As discussed, I'm attaching our service overview and rate card for your review. We're confident we can help you find the right talent for your {{position_type}} requirements.

Please let me know if you have any questions or would like to schedule a follow-up meeting.

Looking forward to hearing from you.

Best regards,
{{consultant_name}}`,
    placeholders: ['company_name', 'contact_name', 'position_type', 'consultant_name']
  },
  {
    id: 'template-3',
    name: 'Proposal Submission',
    subject: 'Recruitment Proposal - {{position_type}} for {{company_name}}',
    body: `Dear {{contact_name}},

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

export const useEmails = () => {
  const [inboxEmails, setInboxEmails] = useState<Email[]>([])
  const [sentEmails, setSentEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const { user, profile } = useAuth()
  const { leads } = useLeads()

  const fetchEmails = async () => {
    if (!user || !profile) return

    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Filter emails for current user
      const userInboxEmails = demoInboxEmails.filter(email => email.userId === user.id)
      const userSentEmails = demoSentEmails.filter(email => email.userId === user.id)

      // Match emails with leads
      const enrichedInboxEmails = userInboxEmails.map(email => {
        const matchedLead = leads.find(lead => 
          lead.contact_email.toLowerCase() === email.from.toLowerCase()
        )
        return {
          ...email,
          leadId: matchedLead?.id || email.leadId,
          leadName: matchedLead?.contact_name || email.leadName,
          companyName: matchedLead?.company_name || email.companyName
        }
      })

      const enrichedSentEmails = userSentEmails.map(email => {
        const matchedLead = leads.find(lead => 
          email.to.some(recipient => recipient.toLowerCase() === lead.contact_email.toLowerCase())
        )
        return {
          ...email,
          leadId: matchedLead?.id || email.leadId,
          leadName: matchedLead?.contact_name || email.leadName,
          companyName: matchedLead?.company_name || email.companyName
        }
      })

      setInboxEmails(enrichedInboxEmails)
      setSentEmails(enrichedSentEmails)
    } catch (error) {
      console.error('Error fetching emails:', error)
      toast.error('Failed to fetch emails')
    } finally {
      setLoading(false)
    }
  }

  const sendEmail = async (emailData: {
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    body: string
    attachments?: File[]
    leadId?: string
    templateId?: string
  }) => {
    if (!user || !profile) throw new Error('User not authenticated')

    setSending(true)
    try {
      // Simulate sending delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create email record
      const newEmail: Email = {
        id: `sent-${Date.now()}`,
        userId: user.id,
        leadId: emailData.leadId,
        folder: 'Sent',
        from: profile.email,
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        body: emailData.body,
        attachments: emailData.attachments?.map((file, index) => ({
          id: `att-${Date.now()}-${index}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        })) || [],
        status: 'Sent',
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }

      // Find lead info if leadId provided
      if (emailData.leadId) {
        const lead = leads.find(l => l.id === emailData.leadId)
        if (lead) {
          newEmail.leadName = lead.contact_name
          newEmail.companyName = lead.company_name
        }
      }

      setSentEmails(prev => [newEmail, ...prev])

      // Simulate delivery status updates
      setTimeout(() => {
        setSentEmails(prev => 
          prev.map(email => 
            email.id === newEmail.id 
              ? { ...email, status: 'Delivered' }
              : email
          )
        )
      }, 3000)

      setTimeout(() => {
        setSentEmails(prev => 
          prev.map(email => 
            email.id === newEmail.id 
              ? { ...email, status: 'Opened' }
              : email
          )
        )
      }, 8000)

      toast.success('Email sent successfully!')
      return newEmail
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email')
      throw error
    } finally {
      setSending(false)
    }
  }

  const markAsRead = async (emailId: string) => {
    setInboxEmails(prev => 
      prev.map(email => 
        email.id === emailId 
          ? { ...email, status: 'Read' }
          : email
      )
    )
  }

  const deleteEmail = async (emailId: string, folder: 'Inbox' | 'Sent') => {
    if (folder === 'Inbox') {
      setInboxEmails(prev => prev.filter(email => email.id !== emailId))
    } else {
      setSentEmails(prev => prev.filter(email => email.id !== emailId))
    }
    toast.success('Email deleted successfully')
  }

  const getEmailTemplates = (): EmailTemplate[] => {
    return demoEmailTemplates
  }

  const applyTemplate = (template: EmailTemplate, placeholderValues: Record<string, string>) => {
    let subject = template.subject
    let body = template.body

    Object.entries(placeholderValues).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      subject = subject.replace(new RegExp(placeholder, 'g'), value)
      body = body.replace(new RegExp(placeholder, 'g'), value)
    })

    return { subject, body }
  }

  const getUnreadCount = () => {
    return inboxEmails.filter(email => email.status === 'Unread').length
  }

  const searchEmails = (query: string, folder: 'Inbox' | 'Sent') => {
    const emails = folder === 'Inbox' ? inboxEmails : sentEmails
    return emails.filter(email => 
      email.subject.toLowerCase().includes(query.toLowerCase()) ||
      email.from.toLowerCase().includes(query.toLowerCase()) ||
      email.to.some(recipient => recipient.toLowerCase().includes(query.toLowerCase())) ||
      (email.companyName && email.companyName.toLowerCase().includes(query.toLowerCase())) ||
      (email.leadName && email.leadName.toLowerCase().includes(query.toLowerCase()))
    )
  }

  useEffect(() => {
    fetchEmails()
  }, [user, profile, leads])

  return {
    inboxEmails,
    sentEmails,
    loading,
    sending,
    sendEmail,
    markAsRead,
    deleteEmail,
    getEmailTemplates,
    applyTemplate,
    getUnreadCount,
    searchEmails,
    refetch: fetchEmails
  }
}