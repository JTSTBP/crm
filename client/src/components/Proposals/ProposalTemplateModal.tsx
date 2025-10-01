import React, { useState } from 'react'
import { X, FileText, Plus, Minus } from 'lucide-react'
import { useProposalTemplates } from '../../hooks/useProposalTemplates'
import toast from 'react-hot-toast'

interface ProposalTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  template?: any
  mode: 'create' | 'edit' | 'generate'
  leadData?: any
}

const ProposalTemplateModal: React.FC<ProposalTemplateModalProps> = ({ 
  isOpen, 
  onClose, 
  template, 
  mode,
  leadData 
}) => {
  const { createTemplate, updateTemplate, generateProposal } = useProposalTemplates()
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    content: template?.content || '',
    placeholders: template?.placeholders || ['client_name']
  })
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({})
  const [generatedProposal, setGeneratedProposal] = useState<{ content: string; subject: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'create') {
        await createTemplate(formData)
        toast.success('Template created successfully!')
      } else if (mode === 'edit') {
        await updateTemplate(template.id, formData)
        toast.success('Template updated successfully!')
      } else if (mode === 'generate') {
        const proposal = generateProposal(template, placeholderValues)
        setGeneratedProposal(proposal)
        return
      }
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const addPlaceholder = () => {
    setFormData(prev => ({
      ...prev,
      placeholders: [...prev.placeholders, '']
    }))
  }

  const removePlaceholder = (index: number) => {
    setFormData(prev => ({
      ...prev,
      placeholders: prev.placeholders.filter((_, i) => i !== index)
    }))
  }

  const updatePlaceholder = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      placeholders: prev.placeholders.map((p, i) => i === index ? value : p)
    }))
  }

  const sendProposal = async (method: 'email' | 'whatsapp') => {
    if (!generatedProposal) return
    
    // Simulate sending proposal
    toast.success(`Proposal sent via ${method === 'email' ? 'Email' : 'WhatsApp'}!`)
    onClose()
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
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {mode === 'create' ? 'Create Template' : 
                   mode === 'edit' ? 'Edit Template' : 
                   'Generate Proposal'}
                </h2>
                <p className="text-blue-100 mt-1">
                  {mode === 'generate' ? `Using template: ${template?.name}` : 'Proposal template management'}
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
          {mode === 'generate' && generatedProposal ? (
            /* Generated Proposal View */
            <div className="space-y-6">
              <div className="bg-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-2">Subject</h3>
                <p className="text-gray-300">{generatedProposal.subject}</p>
              </div>

              <div className="bg-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-2">Content</h3>
                <div className="text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {generatedProposal.content}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => sendProposal('email')}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Send via Email
                </button>
                <button
                  onClick={() => sendProposal('whatsapp')}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Send via WhatsApp
                </button>
                <button
                  onClick={() => setGeneratedProposal(null)}
                  className="px-6 py-3 border border-white/30 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 font-semibold"
                >
                  Back to Edit
                </button>
              </div>
            </div>
          ) : (
            /* Template Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {mode !== 'generate' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                      placeholder="Enter template name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Subject Template
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                      placeholder="e.g., Proposal for {{position_type}} - {{client_name}}"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Content Template
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={12}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300 resize-none"
                      placeholder="Enter your proposal template content with placeholders like {{client_name}}, {{position_type}}, etc."
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-white">
                        Placeholders
                      </label>
                      <button
                        type="button"
                        onClick={addPlaceholder}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Placeholder</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.placeholders.map((placeholder, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={placeholder}
                            onChange={(e) => updatePlaceholder(index, e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                            placeholder="placeholder_name"
                          />
                          {formData.placeholders.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePlaceholder(index)}
                              className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {mode === 'generate' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Fill Placeholder Values</h3>
                  {template.placeholders.map((placeholder: string) => (
                    <div key={placeholder}>
                      <label className="block text-sm font-semibold text-white mb-2">
                        {placeholder.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </label>
                      <input
                        type="text"
                        value={placeholderValues[placeholder] || ''}
                        onChange={(e) => setPlaceholderValues(prev => ({
                          ...prev,
                          [placeholder]: e.target.value
                        }))}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                        placeholder={`Enter ${placeholder.replace(/_/g, ' ')}`}
                      />
                    </div>
                  ))}
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
                  className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? 'Processing...' : 
                   mode === 'create' ? 'Create Template' :
                   mode === 'edit' ? 'Update Template' :
                   'Generate Proposal'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProposalTemplateModal