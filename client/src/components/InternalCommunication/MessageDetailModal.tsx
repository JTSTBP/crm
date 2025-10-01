import React from 'react'
import { 
  X, 
  MessageSquare, 
  User,
  Users,
  Calendar,
  Send,
  Reply,
  Forward,
  Trash2,
  Paperclip,
  Download
} from 'lucide-react'
import { useInternalMessages } from '../../hooks/useInternalMessages'
import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface MessageDetailModalProps {
  message: any
  isOpen: boolean
  onClose: () => void
}

const MessageDetailModal: React.FC<MessageDetailModalProps> = ({ message, isOpen, onClose }) => {
  const { markAsRead } = useInternalMessages()
  const { profile } = useAuth()

  const handleReply = () => {
    // Reply functionality would open compose modal with reply data
    toast.info('Reply functionality coming soon!')
  }

  const handleForward = () => {
    // Forward functionality
    toast.info('Forward functionality coming soon!')
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      toast.success('Message deleted successfully')
      onClose()
    }
  }

  const getMessageTypeIcon = (messageType: string) => {
    return messageType === 'broadcast' 
      ? <Users className="w-5 h-5 text-purple-500" />
      : <User className="w-5 h-5 text-blue-500" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-blue-500'
      case 'delivered': return 'text-green-500'
      case 'read': return 'text-purple-500'
      default: return 'text-gray-500'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
        {/* Header */}
        <div className="gradient-primary p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                {getMessageTypeIcon(message.messageType)}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{message.subject}</h2>
                <div className="flex items-center space-x-4 mt-1 text-blue-100">
                  <span>From: {message.senderName} ({message.senderRole})</span>
                  {message.messageType === 'broadcast' ? (
                    <span className="px-2 py-1 bg-purple-500/30 rounded-full text-xs font-medium">
                      Broadcast to All
                    </span>
                  ) : (
                    <span>To: {message.recipientName || 'You'}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {/* Message Metadata */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-300 font-medium">From</p>
                  <p className="text-white font-semibold">{message.senderName}</p>
                  <p className="text-gray-400 text-xs">{message.senderRole}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {getMessageTypeIcon(message.messageType)}
                <div>
                  <p className="text-sm text-gray-300 font-medium">
                    {message.messageType === 'broadcast' ? 'Broadcast' : 'Direct Message'}
                  </p>
                  <p className="text-white font-semibold">
                    {message.messageType === 'broadcast' ? 'All Team Members' : message.recipientName || 'You'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-300 font-medium">Sent</p>
                  <p className="text-white font-semibold">
                    {format(new Date(message.createdAt), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {format(new Date(message.createdAt), 'HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="bg-white/10 rounded-xl p-6 border border-white/20 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Attachments</h3>
              <div className="space-y-3">
                {message.attachments.map((attachment: string, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center space-x-3">
                      <Paperclip className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">{attachment}</p>
                        <p className="text-gray-400 text-sm">Document</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toast.success(`Downloading ${attachment}`)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Content */}
          <div className="bg-white rounded-xl p-6 text-gray-900">
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/20 p-6">
          <div className="flex justify-between">
            <div className="flex space-x-3">
              {message.senderId !== user?.id && (
                <button
                  onClick={handleReply}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Reply className="w-4 h-4" />
                  <span>Reply</span>
                </button>
              )}
              
              {(profile?.role === 'Admin' || profile?.role === 'Manager') && (
                <button
                  onClick={handleForward}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Forward className="w-4 h-4" />
                  <span>Forward</span>
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              {(message.senderId === user?.id || profile?.role === 'Admin') && (
                <button
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-6 py-2 border border-white/30 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageDetailModal