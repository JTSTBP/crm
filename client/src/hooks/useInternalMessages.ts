import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface InternalMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  recipientId: string | 'ALL'
  recipientName?: string
  recipientRole?: string
  messageType: 'direct' | 'broadcast'
  subject: string
  content: string
  attachments: string[]
  status: 'sent' | 'delivered' | 'read'
  createdAt: string
  updatedAt: string
}

export interface MessageThread {
  id: string
  participants: Array<{
    id: string
    name: string
    role: string
  }>
  lastMessage: InternalMessage
  unreadCount: number
  createdAt: string
  updatedAt: string
}

// Demo internal messages data
const demoMessages: InternalMessage[] = [
  {
    id: 'msg-1',
    senderId: 'demo-admin',
    senderName: 'Admin User',
    senderRole: 'Admin',
    recipientId: 'ALL',
    messageType: 'broadcast',
    subject: 'Q1 2025 Kickoff Meeting',
    content: `Team,

We're scheduling our Q1 2025 kickoff meeting for next Monday at 10 AM.

Agenda:
- Q1 targets and goals
- New process updates
- Team assignments
- Q&A session

Please confirm your attendance by replying to this message.

Best regards,
Admin Team`,
    attachments: [],
    status: 'sent',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-2',
    senderId: 'demo-bd-executive',
    senderName: 'Executive User',
    senderRole: 'BD Executive',
    recipientId: 'demo-manager',
    recipientName: 'Manager User',
    recipientRole: 'Manager',
    messageType: 'direct',
    subject: 'Question about new rate card',
    content: `Hi Manager,

I have a question about the new rate card v2.0. For the leadership positions, should I use the 16.67% fee structure for all C-level roles, or are there exceptions?

Also, when presenting to clients, should I mention the discount limits upfront or only when they negotiate?

Please advise.

Thanks,
Executive User`,
    attachments: [],
    status: 'delivered',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-3',
    senderId: 'demo-manager',
    senderName: 'Manager User',
    senderRole: 'Manager',
    recipientId: 'demo-bd-executive',
    recipientName: 'Executive User',
    recipientRole: 'BD Executive',
    messageType: 'direct',
    subject: 'Re: Question about new rate card',
    content: `Hi Executive,

Good questions! Here are the clarifications:

1. For C-level roles (CEO, CTO, CFO), use 16.67% fee structure
2. For VP-level roles, you can use either 16.67% or 8.33% based on scope
3. Don't mention discount limits upfront - only when they specifically ask about pricing flexibility

Let me know if you need any other clarifications.

Best,
Manager User`,
    attachments: [],
    status: 'read',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-4',
    senderId: 'demo-bd-1',
    senderName: 'Rahul Sharma',
    senderRole: 'BD Executive',
    recipientId: 'demo-admin',
    recipientName: 'Admin User',
    recipientRole: 'Admin',
    messageType: 'direct',
    subject: 'Client feedback on proposal process',
    content: `Hi Admin,

I wanted to share some feedback from TechCorp Solutions about our proposal process:

Positive:
- They loved our quick turnaround time
- Professional presentation format
- Clear pricing structure

Areas for improvement:
- They suggested adding more candidate samples
- Would like to see our screening process details

Should we update our standard proposal template to include these elements?

Thanks,
Rahul`,
    attachments: [],
    status: 'sent',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  }
]

export const useInternalMessages = () => {
  const [messages, setMessages] = useState<InternalMessage[]>([])
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()

  const fetchMessages = async () => {
    if (!user || !profile) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - return demo data
      setTimeout(() => {
        // Filter messages based on user role and permissions
        let filteredMessages = demoMessages

        // BD Executives only see messages they sent or received
        if (profile.role === 'BD Executive') {
          filteredMessages = demoMessages.filter(msg => 
            msg.senderId === user.id || 
            msg.recipientId === user.id ||
            (msg.recipientId === 'ALL' && (msg.senderRole === 'Admin' || msg.senderRole === 'Manager'))
          )
        }

        setMessages(filteredMessages)
        generateThreads(filteredMessages)
        setLoading(false)
      }, 500)
      return
    }

    try {
      // In real implementation, this would fetch from internal_messages table
      setMessages([])
      setThreads([])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
    setLoading(false)
  }

  const generateThreads = (messageList: InternalMessage[]) => {
    const threadMap = new Map<string, MessageThread>()

    messageList.forEach(message => {
      let threadKey: string
      
      if (message.messageType === 'broadcast') {
        threadKey = `broadcast-${message.senderId}`
      } else {
        // Create consistent thread key for direct messages
        const participants = [message.senderId, message.recipientId].sort()
        threadKey = participants.join('-')
      }

      if (!threadMap.has(threadKey)) {
        const participants = message.messageType === 'broadcast' 
          ? [{ id: message.senderId, name: message.senderName, role: message.senderRole }]
          : [
              { id: message.senderId, name: message.senderName, role: message.senderRole },
              { id: message.recipientId, name: message.recipientName || 'Unknown', role: message.recipientRole || 'Unknown' }
            ]

        threadMap.set(threadKey, {
          id: threadKey,
          participants,
          lastMessage: message,
          unreadCount: message.status === 'sent' && message.recipientId === user?.id ? 1 : 0,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt
        })
      } else {
        const thread = threadMap.get(threadKey)!
        if (new Date(message.createdAt) > new Date(thread.lastMessage.createdAt)) {
          thread.lastMessage = message
          thread.updatedAt = message.updatedAt
        }
        if (message.status === 'sent' && message.recipientId === user?.id) {
          thread.unreadCount++
        }
      }
    })

    setThreads(Array.from(threadMap.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ))
  }

  const sendMessage = async (messageData: {
    recipientId: string | 'ALL'
    subject: string
    content: string
    attachments?: string[]
  }) => {
    if (!user || !profile) throw new Error('User not authenticated')

    // Validate permissions
    if (profile.role === 'BD Executive') {
      if (messageData.recipientId === 'ALL') {
        throw new Error('BD Executives cannot send broadcast messages')
      }
      
      // Check if recipient is Admin or Manager
      const allowedRecipients = ['demo-admin', 'demo-manager'] // In real app, would query for Admin/Manager users
      if (!allowedRecipients.includes(messageData.recipientId)) {
        throw new Error('BD Executives can only send messages to Admin or Manager')
      }
    }

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate sending message
      const newMessage: InternalMessage = {
        id: `msg-${Date.now()}`,
        senderId: user.id,
        senderName: profile.name,
        senderRole: profile.role,
        recipientId: messageData.recipientId,
        recipientName: messageData.recipientId === 'ALL' ? undefined : 'Recipient',
        recipientRole: messageData.recipientId === 'ALL' ? undefined : 'Admin',
        messageType: messageData.recipientId === 'ALL' ? 'broadcast' : 'direct',
        subject: messageData.subject,
        content: messageData.content,
        attachments: messageData.attachments || [],
        status: 'sent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setMessages(prev => [newMessage, ...prev])
      generateThreads([newMessage, ...messages])
      
      // Simulate delivery
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        ))
      }, 1000)

      return newMessage
    }

    try {
      // In real implementation, this would create message record
      await fetchMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  const markAsRead = async (messageId: string) => {
    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate marking as read
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'read' }
          : msg
      ))
      return
    }

    try {
      // In real implementation, this would update message status
      await fetchMessages()
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const getAvailableRecipients = () => {
    if (!profile) return []

    const allUsers = [
      { id: 'demo-admin', name: 'Admin User', role: 'Admin' },
      { id: 'demo-manager', name: 'Manager User', role: 'Manager' },
      { id: 'demo-bd-executive', name: 'Executive User', role: 'BD Executive' },
      { id: 'demo-bd-1', name: 'Rahul Sharma', role: 'BD Executive' },
      { id: 'demo-bd-2', name: 'Priya Patel', role: 'BD Executive' },
      { id: 'demo-bd-3', name: 'Arjun Kumar', role: 'BD Executive' }
    ]

    if (profile.role === 'Admin' || profile.role === 'Manager') {
      // Admin and Manager can send to anyone or broadcast to all
      return [
        { id: 'ALL', name: 'All Users', role: 'Broadcast' },
        ...allUsers.filter(u => u.id !== user?.id)
      ]
    } else {
      // BD Executive can only send to Admin and Manager
      return allUsers.filter(u => 
        (u.role === 'Admin' || u.role === 'Manager') && u.id !== user?.id
      )
    }
  }

  const getUnreadCount = () => {
    return messages.filter(msg => 
      msg.recipientId === user?.id && msg.status === 'sent'
    ).length
  }

  const getThreadMessages = (threadId: string) => {
    return messages.filter(msg => {
      if (msg.messageType === 'broadcast') {
        return threadId === `broadcast-${msg.senderId}`
      } else {
        const participants = [msg.senderId, msg.recipientId].sort()
        return threadId === participants.join('-')
      }
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  useEffect(() => {
    fetchMessages()
  }, [user, profile])

  return {
    messages,
    threads,
    loading,
    sendMessage,
    markAsRead,
    getAvailableRecipients,
    getUnreadCount,
    getThreadMessages,
    refetch: fetchMessages
  }
}