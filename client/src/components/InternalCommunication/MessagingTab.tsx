import React, { useState } from 'react'
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Users,
  Send,
  Filter,
  Bell,
  User,
  Calendar,
  Eye,
  Reply,
  Trash2
} from 'lucide-react'
import { useInternalMessages } from '../../hooks/useInternalMessages'
import { useAuth } from '../../contexts/AuthContext'
import ComposeMessageModal from './ComposeMessageModal'
import MessageDetailModal from './MessageDetailModal'
import { format, isToday, isYesterday } from 'date-fns'
import toast from 'react-hot-toast'

const MessagingTab: React.FC = () => {
  const { 
    messages, 
    threads, 
    loading, 
    markAsRead, 
    getUnreadCount,
    getThreadMessages
  } = useInternalMessages()
  
  const { profile } = useAuth()
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [selectedThread, setSelectedThread] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [activeView, setActiveView] = useState<'threads' | 'messages'>('threads')

  const typeOptions = ['All', 'Direct', 'Broadcast']
  const unreadCount = getUnreadCount()

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.senderName.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesType = true
    if (typeFilter === 'Direct') {
      matchesType = message.messageType === 'direct'
    } else if (typeFilter === 'Broadcast') {
      matchesType = message.messageType === 'broadcast'
    }
    
    return matchesSearch && matchesType
  })

  const filteredThreads = threads.filter(thread => {
    const lastMessage = thread.lastMessage
    return lastMessage.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
           thread.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const handleMessageClick = async (message: any) => {
    if (message.recipientId === user?.id && message.status === 'sent') {
      await markAsRead(message.id)
    }
    setSelectedMessage(message)
  }

  const handleThreadClick = (thread: any) => {
    setSelectedThread(thread)
    // Mark thread messages as read if needed
    const threadMessages = getThreadMessages(thread.id)
    threadMessages.forEach(msg => {
      if (msg.recipientId === user?.id && msg.status === 'sent') {
        markAsRead(msg.id)
      }
    })
  }

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return format(date, 'HH:mm')
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM dd')
  }

  const getMessageTypeIcon = (messageType: string) => {
    return messageType === 'broadcast' 
      ? <Users className="w-4 h-4 text-purple-500" />
      : <User className="w-4 h-4 text-blue-500" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-blue-500'
      case 'delivered': return 'text-green-500'
      case 'read': return 'text-purple-500'
      default: return 'text-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Internal Messages</h2>
          <p className="text-gray-300 mt-1">
            {profile?.role === 'BD Executive' 
              ? 'Send messages to Admin and Manager' 
              : 'Communicate with your team members'}
          </p>
        </div>
        <button
          onClick={() => setIsComposeModalOpen(true)}
          className="gradient-primary text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>New Message</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass rounded-xl p-4 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Total Messages</p>
              <p className="text-2xl font-bold text-white mt-1">{messages.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Unread</p>
              <p className="text-2xl font-bold text-white mt-1">{unreadCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500">
              <Bell className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Direct Messages</p>
              <p className="text-2xl font-bold text-white mt-1">
                {messages.filter(m => m.messageType === 'direct').length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-500">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Broadcasts</p>
              <p className="text-2xl font-bold text-white mt-1">
                {messages.filter(m => m.messageType === 'broadcast').length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-1 bg-white/10 rounded-xl p-1">
        <button
          onClick={() => setActiveView('threads')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeView === 'threads'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="font-medium">Conversations</span>
          {threads.filter(t => t.unreadCount > 0).length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {threads.filter(t => t.unreadCount > 0).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveView('messages')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeView === 'messages'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Send className="w-5 h-5" />
          <span className="font-medium">All Messages</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-6 border border-white/30">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-300" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              {typeOptions.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeView === 'threads' ? (
        /* Conversation Threads View */
        <div className="glass rounded-xl border border-white/30 overflow-hidden shadow-xl">
          {filteredThreads.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-white mb-3">No conversations found</h3>
              <p className="text-gray-300 text-lg">
                {searchTerm 
                  ? 'Try adjusting your search term' 
                  : 'Start a new conversation to get started'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredThreads.map((thread) => (
                <div 
                  key={thread.id} 
                  className="p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-[1.01]"
                  onClick={() => handleThreadClick(thread)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center">
                        {thread.lastMessage.messageType === 'broadcast' ? (
                          <Users className="w-6 h-6 text-white" />
                        ) : (
                          <span className="text-white font-semibold">
                            {thread.participants.find(p => p.id !== user?.id)?.name.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-white">
                            {thread.lastMessage.messageType === 'broadcast' 
                              ? `Broadcast from ${thread.lastMessage.senderName}`
                              : thread.participants.find(p => p.id !== user?.id)?.name || 'Unknown'
                            }
                          </h3>
                          {getMessageTypeIcon(thread.lastMessage.messageType)}
                          {thread.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                        
                        <h4 className="text-white font-medium mb-1">{thread.lastMessage.subject}</h4>
                        <p className="text-gray-300 text-sm line-clamp-2">
                          {thread.lastMessage.content.substring(0, 100)}...
                        </p>
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                          <span>From: {thread.lastMessage.senderName}</span>
                          <span>{formatMessageDate(thread.lastMessage.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-gray-400 text-sm">
                        {formatMessageDate(thread.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* All Messages View */
        <div className="glass rounded-xl border border-white/30 overflow-hidden shadow-xl">
          {filteredMessages.length === 0 ? (
            <div className="p-8 text-center">
              <Send className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-white mb-3">No messages found</h3>
              <p className="text-gray-300 text-lg">
                {searchTerm || typeFilter !== 'All'
                  ? 'Try adjusting your search or filters' 
                  : 'No messages yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredMessages.map((message) => (
                <div 
                  key={message.id} 
                  className={`p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-[1.01] ${
                    message.status === 'sent' && message.recipientId === user?.id ? 'bg-blue-500/5' : ''
                  }`}
                  onClick={() => handleMessageClick(message)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex items-center space-x-2 mt-1">
                        {getMessageTypeIcon(message.messageType)}
                        {message.status === 'sent' && message.recipientId === user?.id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`font-semibold ${
                            message.status === 'sent' && message.recipientId === user?.id ? 'text-white' : 'text-gray-300'
                          }`}>
                            {message.messageType === 'broadcast' ? 'Broadcast Message' : message.subject}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            message.messageType === 'broadcast' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {message.messageType === 'broadcast' ? 'To All' : 'Direct'}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                          {message.content.substring(0, 150)}...
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>From: {message.senderName} ({message.senderRole})</span>
                          </div>
                          {message.messageType === 'direct' && message.recipientName && (
                            <div className="flex items-center space-x-1">
                              <Send className="w-3 h-3" />
                              <span>To: {message.recipientName}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatMessageDate(message.createdAt)}</span>
                          </div>
                          <span className={`font-medium ${getStatusColor(message.status)}`}>
                            {message.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMessageClick(message)
                        }}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                        title="View Message"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Reply functionality
                          toast.info('Reply functionality coming soon!')
                        }}
                        className="p-2 text-gray-400 hover:text-green-400 transition-colors hover:bg-white/20 rounded-lg"
                        title="Reply"
                      >
                        <Reply className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isComposeModalOpen && (
        <ComposeMessageModal 
          isOpen={isComposeModalOpen}
          onClose={() => setIsComposeModalOpen(false)}
        />
      )}

      {selectedMessage && (
        <MessageDetailModal 
          message={selectedMessage}
          isOpen={!!selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </div>
  )
}

export default MessagingTab