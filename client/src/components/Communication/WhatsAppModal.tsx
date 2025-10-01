import React, { useState, useEffect } from 'react'
import { X, MessageCircle, Send, FileText, Image, File } from 'lucide-react'
import { useCommunication, WhatsAppTemplate } from '../../hooks/useCommunication'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface WhatsAppModalProps {
  isOpen: boolean
  onClose: () => void
  lead: any
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose, lead }) => {
  const { sendWhatsApp, getWhatsAppTemplates, loading } = useCommunication()
  const { profile } = useAuth()
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null)
  const [content, setContent] = useState('')
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)

  const whatsappTemplates = getWhatsAppTemplates()

  useEffect(() => {
    if (selectedTemplate) {
      // Pre-fill placeholder values with lead data
      const defaultValues: Record<string, string> = {
        company_name: lead.company_name || '',
        contact_name: lead.contact_name || '',
        contact_phone: lead.contact_phone || '',
        consultant_name: profile?.name || '',
        position_type: 'Software Engineer', // Default value
        tat: '15',
      }

      setPlaceholderValues(defaultValues)
      setContent(selectedTemplate.content)
    }
  }, [selectedTemplate, lead, profile])

  const handleTemplateSelect = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template)
  }

  const handlePlaceholderChange = (key: string, value: string) => {
    setPlaceholderValues(prev => ({ ...prev, [key]: value }))
  }

  const generatePreview = () => {
    let previewContent = content

    Object.entries(placeholderValues).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      previewContent = previewContent.replace(new RegExp(placeholder, 'g'), value)
    })

    return previewContent
  }

  const handleSendWhatsApp = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a WhatsApp template')
      return
    }

    if (!content.trim()) {
      toast.error('Message content is required')
      return
    }

    try {
      const mediaUrl = mediaFile ? URL.createObjectURL(mediaFile) : undefined
      await sendWhatsApp(
        lead.id,
        selectedTemplate.id,
        { ...placeholderValues, contact_phone: lead.contact_phone },
        content,
        mediaUrl
      )
      onClose()
    } catch (error) {
      // Error handled in hook
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 16MB for WhatsApp)
      if (file.size > 16 * 1024 * 1024) {
        toast.error('File size must be less than 16MB')
        return
      }
      setMediaFile(file)
    }
  }

  const resetForm = () => {
    setSelectedTemplate(null)
    setContent('')
    setPlaceholderValues({})
    setShowPreview(false)
    setMediaFile(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  const preview = generatePreview()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Send WhatsApp Message</h2>
                <p className="text-green-100 mt-1">
                  To: {lead.contact_name} ({lead.contact_phone})
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
                  Select WhatsApp Template
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {whatsappTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedTemplate?.id === template.id
                          ? 'border-green-400 bg-green-500/20'
                          : 'border-white/20 bg-white/10 hover:border-white/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          {template.type === 'text' && <FileText className="w-5 h-5 text-green-400" />}
                          {template.type === 'image' && <Image className="w-5 h-5 text-green-400" />}
                          {template.type === 'document' && <File className="w-5 h-5 text-green-400" />}
                          <h3 className="font-semibold text-white">{template.name}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-3">
                        {template.content}
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
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:bg-white/20 transition-all duration-300"
                            placeholder={`Enter ${placeholder.replace(/_/g, ' ')}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Message Content
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:bg-white/20 transition-all duration-300 resize-none"
                      placeholder="Enter your WhatsApp message"
                    />
                  </div>

                  {/* Media Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Attach Media (Optional)
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl cursor-pointer transition-colors">
                        <File className="w-5 h-5 text-gray-300" />
                        <span className="text-gray-300">Choose File</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,video/*,.pdf,.doc,.docx"
                          onChange={handleFileUpload}
                        />
                      </label>
                      {mediaFile && (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                          <span className="text-green-400 text-sm">{mediaFile.name}</span>
                          <button
                            onClick={() => setMediaFile(null)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Supported: Images, Videos, PDF, Documents (Max 16MB)
                    </p>
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
                  onClick={handleSendWhatsApp}
                  disabled={loading || !selectedTemplate}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
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
            </div>
          ) : (
            /* Preview Mode */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">WhatsApp Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                >
                  Edit
                </button>
              </div>

              {/* WhatsApp-style Preview */}
              <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-xl p-4">
                <div className="bg-white rounded-lg p-4 shadow-sm max-w-sm ml-auto">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {profile?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{profile?.name}</span>
                  </div>
                  
                  {mediaFile && (
                    <div className="mb-3 p-2 bg-gray-100 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <File className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{mediaFile.name}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="whitespace-pre-wrap text-gray-800 text-sm">
                    {preview}
                  </div>
                  
                  <div className="flex justify-end mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
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
                  onClick={handleSendWhatsApp}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WhatsAppModal