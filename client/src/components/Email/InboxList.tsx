import React from 'react'
import { 
  Mail, 
  MailOpen, 
  Paperclip, 
  Star, 
  Building2,
  Calendar,
  Eye,
  Reply,
  Forward,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { useEmails } from '../../hooks/useEmails'
import { format, isToday, isYesterday } from 'date-fns'
import toast from 'react-hot-toast'

interface InboxListProps {
  searchTerm: string
  onEmailSelect: (email: any) => void
}

const InboxList: React.FC<InboxListProps> = ({ searchTerm, onEmailSelect }) => {
  const { inboxEmails, loading, markAsRead, deleteEmail, searchEmails } = useEmails()

  const filteredEmails = searchTerm 
    ? searchEmails(searchTerm, 'Inbox')
    : inboxEmails

  const handleMarkAsRead = async (emailId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await markAsRead(emailId)
    } catch (error: any) {
      toast.error('Failed to mark as read')
    }
  }

  const handleDeleteEmail = async (emailId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (window.confirm('Are you sure you want to delete this email?')) {
      try {
        await deleteEmail(emailId, 'Inbox')
      } catch (error: any) {
        toast.error('Failed to delete email')
      }
    }
  }

  const formatEmailDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return format(date, 'HH:mm')
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM dd')
  }

  const getStatusIcon = (status: string, isImportant?: boolean) => {
    if (isImportant) {
      return <Star className="w-4 h-4 text-yellow-500" />
    }
    return status === 'Unread' 
      ? <Mail className="w-4 h-4 text-blue-500" />
      : <MailOpen className="w-4 h-4 text-gray-400" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl border border-white/30 overflow-hidden shadow-xl">
      {filteredEmails.length === 0 ? (
        <div className="p-8 text-center">
          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-white mb-3">
            {searchTerm ? 'No emails found' : 'Inbox is empty'}
          </h3>
          <p className="text-gray-300 text-lg">
            {searchTerm 
              ? 'Try adjusting your search term' 
              : 'New emails will appear here when received'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {filteredEmails.map((email) => (
            <div 
              key={email.id} 
              className={`p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-[1.01] ${
                email.status === 'Unread' ? 'bg-blue-500/5' : ''
              }`}
              onClick={() => {
                if (email.status === 'Unread') {
                  markAsRead(email.id)
                }
                onEmailSelect(email)
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(email.status, email.isImportant)}
                    {email.attachments.length > 0 && (
                      <Paperclip className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <p className={`font-semibold ${
                          email.status === 'Unread' ? 'text-white' : 'text-gray-300'
                        }`}>
                          {email.leadName || email.from}
                        </p>
                        {email.companyName && (
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400 text-sm">{email.companyName}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400 text-sm font-medium">
                          {formatEmailDate(email.receivedAt || email.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className={`text-lg mb-2 ${
                      email.status === 'Unread' ? 'text-white font-semibold' : 'text-gray-300 font-medium'
                    }`}>
                      {email.subject}
                    </h3>
                    
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {email.body.substring(0, 150)}...
                    </p>

                    <div className="flex items-center space-x-4 mt-3 text-xs">
                      <span className="text-gray-500">From: {email.from}</span>
                      {email.attachments.length > 0 && (
                        <span className="text-blue-400 flex items-center space-x-1">
                          <Paperclip className="w-3 h-3" />
                          <span>{email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}</span>
                        </span>
                      )}
                      {email.isImportant && (
                        <span className="text-yellow-500 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Important</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {email.status === 'Unread' && (
                    <button
                      onClick={(e) => handleMarkAsRead(email.id, e)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                      title="Mark as Read"
                    >
                      <MailOpen className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Reply functionality
                      toast.info('Reply functionality available in email detail view')
                    }}
                    className="p-2 text-gray-400 hover:text-green-400 transition-colors hover:bg-white/20 rounded-lg"
                    title="Reply"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Forward functionality
                      toast.info('Forward functionality coming soon')
                    }}
                    className="p-2 text-gray-400 hover:text-purple-400 transition-colors hover:bg-white/20 rounded-lg"
                    title="Forward"
                  >
                    <Forward className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteEmail(email.id, e)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/20 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default InboxList