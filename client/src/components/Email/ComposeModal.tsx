import React, { useState, useEffect } from 'react'
import { 
  X, 
  Send, 
  Paperclip, 
  FileText, 
  User, 
  Building2,
  Plus,
  Minus,
  Upload
} from 'lucide-react'
import { useEmails, EmailTemplate } from '../../hooks/useEmails'
import { useLeads } from '../../hooks/useLeads'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface ComposeModalProps {
  isOpen: boolean
  onClose: () => void
  replyTo?: any
  leadId?: string
}

interface ComposeFormData {
  to: string[]
  cc: string[]
  bcc: string[]
  subject: string
  body: string
  leadId?: string
  templateId?: string
}

const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, replyTo, leadId }) => {
  const { sendEmail, getEmailTemplates, applyTemplate, sending } = useEmails()
  const { leads } = useLeads()
  const { profile } = useAuth()
  const [formData, setFormData] = useState<ComposeFormData>({
    to: replyTo ? [replyTo.from] : [''],
    cc: [],
    bcc: [],
    subject: replyTo ? `Re: ${replyTo.subject}` : '',
    body: replyTo ? `\n\n--- Original Message ---\nFrom: ${replyTo.from}\nSubject: ${replyTo.subject}\n\n${replyTo.body}` : '',
    leadId: leadId || replyTo?.leadId || ''
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({})
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)

  const emailTemplates = getEmailTemplates()

  useEffect(() => {
    if (selectedTemplate && formData.leadId) {
      const lead = leads.find(l => l.id === formData.leadId)
      if (lead) {
        const defaultValues: Record<string, string> = {
          company_name: lead.company_name || '',
          contact_name: lead.contact_name || '',
          consultant_name: profile?.name || '',
          position_type: 'Software Engineer',
          tat: '15',
          service_fee: '8.33% of CTC',
          replacement_guarantee: '90 days'
        }
        setPlaceholderValues(defaultValues)
      }
    }
  }, [selectedTemplate, formData.leadId, leads, profile])

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    if (formData.leadId) {
      const lead = leads.find(l => l.id === formData.leadId)
      if (lead) {
        const applied = applyTemplate(template, {
          company_name: lead.company_name,
          contact_name: lead.contact_name,
          consultant_name: profile?.name || '',
          position_type: 'Software Engineer',
          tat: '15',
          service_fee: '8.33% of CTC',
          replacement_guarantee: '90 days'
        })
        setFormData(prev => ({
          ...prev,
          subject: applied.subject,
          body: applied.body,
          to: [lead.contact_email]
        }))
      }
    }
  }

  const handlePlaceholderChange = (key: string, value: string) => {
    setPlaceholderValues(prev => ({ ...prev, [key]: value }))
    
    if (selectedTemplate) {
      const applied = applyTemplate(selectedTemplate, { ...placeholderValues, [key]: value })
      setFormData(prev => ({
        ...prev,
        subject: applied.subject,
        body: applied.body
      }))
    }
  }

  const addRecipient = (field: 'to' | 'cc' | 'bcc') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeRecipient = (field: 'to' | 'cc' | 'bcc', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const updateRecipient = (field: 'to' | 'cc' | 'bcc', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((recipient, i) => i === index ? value : recipient)
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => file.size <= 25 * 1024 * 1024) // 25MB limit
    
    if (validFiles.length !== files.length) {
      toast.error('Some files were too large (max 25MB per file)')
    }
    
    setAttachments(prev => [...prev, ...validFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    // Validation
    const validRecipients = formData.to.filter(email => email.trim() && email.includes('@'))
    if (validRecipients.length === 0) {
      toast.error('Please add at least one valid recipient')
      return
    }

    if (!formData.subject.trim()) {
      toast.error('Please add a subject')
      return
    }

    if (!formData.body.trim()) {
      toast.error('Please add email content')
      return
    }

    try {
      await sendEmail({
        to: validRecipients,
        cc: formData.cc.filter(email => email.trim() && email.includes('@')),
        bcc: formData.bcc.filter(email => email.trim() && email.includes('@')),
        subject: formData.subject,
        body: formData.body,
        attachments,
        leadId: formData.leadId || undefined,
        templateId: selectedTemplate?.id
      })
      
      onClose()
      // Reset form
      setFormData({
        to: [''],
        cc: [],
        bcc: [],
        subject: '',
        body: '',
        leadId: ''
      })
      setAttachments([])
      setSelectedTemplate(null)
      setPlaceholderValues({})
    } catch (error) {
      // Error handled in hook
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
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {replyTo ? 'Reply to Email' : 'Compose New Email'}
                </h2>
                <p className="text-blue-100 mt-1">
                  {replyTo ? `Replying to: ${replyTo.subject}` : 'Create and send a new email'}
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
          <div className="space-y-6">
            {/* Template Selection */}
            {!replyTo && (
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Email Template (Optional)
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
            )}

            {/* Lead Selection */}
            {!replyTo && (
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Related Lead (Optional)
                </label>
                <select
                  value={formData.leadId}
                  onChange={(e) => setFormData(prev => ({ ...prev, leadId: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                >
                  <option value="">Select a lead</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.company_name} - {lead.contact_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Placeholder Values */}
            {selectedTemplate && selectedTemplate.placeholders.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Template Values
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
            )}

            {/* Recipients */}
            <div className="space-y-4">
              {/* To Field */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  To *
                </label>
                <div className="space-y-2">
                  {formData.to.map((recipient, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="email"
                        value={recipient}
                        onChange={(e) => updateRecipient('to', index, e.target.value)}
                        className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                        placeholder="Enter email address"
                      />
                      {formData.to.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRecipient('to', index)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addRecipient('to')}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Recipient</span>
                  </button>
                </div>
              </div>

              {/* CC/BCC Toggle */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCc(!showCc)}
                  className="text-gray-300 hover:text-white text-sm font-medium"
                >
                  {showCc ? 'Hide CC' : 'Add CC'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBcc(!showBcc)}
                  className="text-gray-300 hover:text-white text-sm font-medium"
                >
                  {showBcc ? 'Hide BCC' : 'Add BCC'}
                </button>
              </div>

              {/* CC Field */}
              {showCc && (
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    CC
                  </label>
                  <div className="space-y-2">
                    {formData.cc.map((recipient, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="email"
                          value={recipient}
                          onChange={(e) => updateRecipient('cc', index, e.target.value)}
                          className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                          placeholder="Enter CC email address"
                        />
                        <button
                          type="button"
                          onClick={() => removeRecipient('cc', index)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addRecipient('cc')}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add CC</span>
                    </button>
                  </div>
                </div>
              )}

              {/* BCC Field */}
              {showBcc && (
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    BCC
                  </label>
                  <div className="space-y-2">
                    {formData.bcc.map((recipient, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="email"
                          value={recipient}
                          onChange={(e) => updateRecipient('bcc', index, e.target.value)}
                          className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                          placeholder="Enter BCC email address"
                        />
                        <button
                          type="button"
                          onClick={() => removeRecipient('bcc', index)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addRecipient('bcc')}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add BCC</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                placeholder="Enter email subject"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Message *
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                rows={12}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300 resize-none"
                placeholder="Enter your email message..."
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Attachments
              </label>
              <div className="space-y-3">
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-white/30 rounded-xl cursor-pointer hover:border-white/50 hover:bg-white/5 transition-all duration-300">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-300 font-medium">Click to upload files</p>
                    <p className="text-gray-400 text-sm">Max 25MB per file</p>
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

            {/* Actions */}
            <div className="flex space-x-4 pt-6">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-white/30 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                {sending ? (
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
        </div>
      </div>
    </div>
  )
}

export default ComposeModal