import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { 
  X, 
  Send, 
  User, 
  Users,
  MessageSquare,
  Paperclip,
  Upload,
  AlertTriangle
} from 'lucide-react'
import { useInternalMessages } from '../../hooks/useInternalMessages'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface ComposeMessageModalProps {
  isOpen: boolean
  onClose: () => void
  replyTo?: any
}

interface MessageFormData {
  recipientId: string
  subject: string
  content: string
}

const ComposeMessageModal: React.FC<ComposeMessageModalProps> = ({ isOpen, onClose, replyTo }) => {
  const { sendMessage, getAvailableRecipients } = useInternalMessages()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<MessageFormData>({
    defaultValues: {
      recipientId: replyTo?.senderId || '',
      subject: replyTo ? `Re: ${replyTo.subject}` : '',
      content: replyTo ? `\n\n--- Original Message ---\nFrom: ${replyTo.senderName}\nSubject: ${replyTo.subject}\n\n${replyTo.content}` : ''
    }
  })

  const availableRecipients = getAvailableRecipients()
  const selectedRecipient = watch('recipientId')

  const onSubmit = async (data: MessageFormData) => {
    if (!data.recipientId) {
      toast.error('Please select a recipient')
      return
    }

    setLoading(true)
    try {
      await sendMessage({
        recipientId: data.recipientId,
        subject: data.subject,
        content: data.content,
        attachments: attachments.map(file => file.name)
      })
      
      toast.success('Message sent successfully!')
      reset()
      setAttachments([])
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024) // 10MB limit
    
    if (validFiles.length !== files.length) {
      toast.error('Some files were too large (max 10MB per file)')
    }
    
    setAttachments(prev => [...prev, ...validFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const getRecipientIcon = (recipientId: string) => {
    return recipientId === 'ALL' 
      ? <Users className="w-4 h-4 text-purple-500" />
      : <User className="w-4 h-4 text-blue-500" />
  }

  const getRecipientDescription = (recipientId: string, recipientRole?: string) => {
    if (recipientId === 'ALL') {
      return 'Message will be sent to all team members'
    }
    return `Direct message to ${recipientRole || 'user'}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
        {/* Header */}
        <div className="gradient-primary p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {replyTo ? 'Reply to Message' : 'Compose New Message'}
                </h2>
                <p className="text-blue-100 mt-1">
                  {profile?.role === 'BD Executive' 
                    ? 'Send message to Admin or Manager'
                    : 'Send message to team members or broadcast to all'}
                </p>
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Recipient Selection */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Send To *
              </label>
              <select
                {...register('recipientId', { required: 'Please select a recipient' })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              >
                <option value="">Select recipient</option>
                {availableRecipients.map(recipient => (
                  <option key={recipient.id} value={recipient.id}>
                    {recipient.name} {recipient.role !== 'Broadcast' && `(${recipient.role})`}
                  </option>
                ))}
              </select>
              {errors.recipientId && (
                <p className="mt-2 text-sm text-red-300">{errors.recipientId.message}</p>
              )}
              
              {selectedRecipient && (
                <div className="mt-3 flex items-center space-x-2 text-sm">
                  {getRecipientIcon(selectedRecipient)}
                  <span className="text-gray-300">
                    {getRecipientDescription(
                      selectedRecipient, 
                      availableRecipients.find(r => r.id === selectedRecipient)?.role
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Permission Notice for BD Executive */}
            {profile?.role === 'BD Executive' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-blue-400" />
                  <h4 className="text-blue-400 font-semibold">Messaging Permissions</h4>
                </div>
                <p className="text-sm text-gray-300">
                  As a BD Executive, you can send messages only to Admin and Manager users. 
                  You cannot send broadcast messages or communicate with other BD Executives.
                </p>
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Subject *
              </label>
              <input
                {...register('subject', { required: 'Subject is required' })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                placeholder="Enter message subject"
              />
              {errors.subject && (
                <p className="mt-2 text-sm text-red-300">{errors.subject.message}</p>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Message *
              </label>
              <textarea
                {...register('content', { required: 'Message content is required' })}
                rows={10}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300 resize-none"
                placeholder="Enter your message..."
              />
              {errors.content && (
                <p className="mt-2 text-sm text-red-300">{errors.content.message}</p>
              )}
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Attachments (Optional)
              </label>
              <div className="space-y-3">
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-white/30 rounded-xl cursor-pointer hover:border-white/50 hover:bg-white/5 transition-all duration-300">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-300 font-medium">Click to upload files</p>
                    <p className="text-gray-400 text-sm">Max 10MB per file</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.xls"
                  />
                </label>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3 border border-white/20">
                        <div className="flex items-center space-x-3">
                          <Paperclip className="w-4 h-4 text-blue-400" />
                          <div>
                            <p className="text-white text-sm font-medium">{file.name}</p>
                            <p className="text-gray-400 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Broadcast Warning */}
            {selectedRecipient === 'ALL' && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-orange-400" />
                  <h4 className="text-orange-400 font-semibold">Broadcast Message</h4>
                </div>
                <p className="text-sm text-gray-300">
                  This message will be sent to all team members including Admin, Manager, and BD Executives. 
                  Please ensure the content is appropriate for company-wide communication.
                </p>
              </div>
            )}

            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-white/30 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ComposeMessageModal