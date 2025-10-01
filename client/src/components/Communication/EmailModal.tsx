import React, { useState, useEffect } from 'react'
import { X, Mail, Send, FileText, User, Building2 } from 'lucide-react'
import { useCommunication, EmailTemplate } from '../../hooks/useCommunication'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  lead: any
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, lead }) => {
  const { sendEmail, getEmailTemplates, loading } = useCommunication()
  const { profile } = useAuth()
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)

  const emailTemplates = getEmailTemplates()

  useEffect(() => {
    if (selectedTemplate) {
      // Pre-fill placeholder values with lead data
      const defaultValues: Record<string, string> = {
        company_name: lead.company_name || '',
        contact_name: lead.contact_name || '',
        contact_email: lead.contact_email || '',
        consultant_name: profile?.name || '',
        position_type: 'Software Engineer', // Default value
        tat: '15',
        service_fee: '8.33% of CTC',
        replacement_guarantee: '90 days',
      }

      setPlaceholderValues(defaultValues)
      setSubject(selectedTemplate.subject)
      setContent(selectedTemplate.content)
    }
  }, [selectedTemplate, lead, profile])

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template)
  }

  const handlePlaceholderChange = (key: string, value: string) => {
    setPlaceholderValues(prev => ({ ...prev, [key]: value }))
  }

  const generatePreview = () => {
    let previewSubject = subject
    let previewContent = content

    Object.entries(placeholderValues).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      previewSubject = previewSubject.replace(new RegExp(placeholder, 'g'), value)
      previewContent = previewContent.replace(new RegExp(placeholder, 'g'), value)
    })

    return { subject: previewSubject, content: previewContent }
  }

  const handleSendEmail = async () => {
    if (!selectedTemplate) {
      toast.error('Please select an email template')
      return
    }

    if (!subject.trim() || !content.trim()) {
      toast.error('Subject and content are required')
      return
    }

    try {
      await sendEmail(
        lead.id,
        selectedTemplate.id,
        { ...placeholderValues, contact_email: lead.contact_email },
        subject,
        content
      )
      onClose()
    } catch (error) {
      // Error handled in hook
    }
  }

  const resetForm = () => {
    setSelectedTemplate(null)
    setSubject('')
    setContent('')
    setPlaceholderValues({})
    setShowPreview(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  const preview = generatePreview()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
        {/* Header */}
        <div className="gradient-primary p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Send Email</h2>
                <p className="text-blue-100 mt-1">
                  To: {lead.contact_name} ({lead.contact_email})
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!showPreview ? (
            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Select Email Template
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {emailTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-400 bg-blue-500/20'
                          : 'border-white/20 bg-white/10 hover:border-white/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <h3 className="font-semibold text-white">{template.name}</h3>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {template.subject}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTemplate && (
                <>
                  {/* Placeholder Values */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Fill Template Details
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTemplate.placeholders.map((placeholder) => (
                        <div key={placeholder}>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {placeholder.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                          <input
                            type="text"
                            value={placeholderValues[placeholder] || ''}
                            onChange={(e) => handlePlaceholderChange(placeholder, e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                            placeholder={`Enter ${placeholder.replace(/_/g, ' ')}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                      placeholder="Enter email subject"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Email Content
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300 resize-none"
                      placeholder="Enter email content"
                    />
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 border border-white/30 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
                {selectedTemplate && (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold"
                  >
                    Preview
                  </button>
                )}
                <button
                  onClick={handleSendEmail}
                  disabled={loading || !selectedTemplate}
                  className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Preview Mode */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Email Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                >
                  Edit
                </button>
              </div>

              {/* Preview Content */}
              <div className="bg-white rounded-xl p-6 text-gray-900">
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">From: {profile?.name} ({profile?.email})</span>
                  </div>
                  <div className="flex items-center space-x-3 mb-2">
                    <Building2 className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">To: {lead.contact_name} ({lead.contact_email})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <span className="font-semibold">Subject: {preview.subject}</span>
                  </div>
                </div>
                <div className="whitespace-pre-wrap">{preview.content}</div>
              </div>

              {/* Preview Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-6 py-3 border border-white/30 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 font-semibold"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={loading}
                  className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmailModal