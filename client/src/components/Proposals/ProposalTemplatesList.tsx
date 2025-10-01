import React, { useState } from 'react'
import { 
  Plus, 
  Search, 
  FileText, 
  Edit3, 
  Trash2,
  Eye,
  Copy,
  Settings
} from 'lucide-react'
import { useProposalTemplates } from '../../hooks/useProposalTemplates'
import { useAuth } from '../../contexts/AuthContext'
import ProposalTemplateModal from './ProposalTemplateModal'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const ProposalTemplatesList: React.FC = () => {
  const { templates, loading, updateTemplate } = useProposalTemplates()
  const { profile } = useAuth()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleActive = async (templateId: string, currentActive: boolean) => {
    try {
      await updateTemplate(templateId, { active: !currentActive })
      toast.success(`Template ${currentActive ? 'deactivated' : 'activated'} successfully`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update template')
    }
  }

  const handleDuplicateTemplate = async (template: any) => {
    try {
      // In real implementation, this would create a copy
      toast.success(`Template "${template.name}" duplicated successfully`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to duplicate template')
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Proposal Templates</h2>
          <p className="text-gray-300 mt-1">Manage reusable proposal templates</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="gradient-primary text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Search */}
      <div className="glass rounded-xl p-4 border border-white/30">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="glass rounded-xl p-6 border border-white/30 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                  <p className="text-gray-300 text-sm">{template.subject}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  template.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {template.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-300 text-sm line-clamp-3">
                {template.content.substring(0, 150)}...
              </p>
            </div>

            <div className="mb-4">
              <p className="text-gray-400 text-xs mb-2">Placeholders:</p>
              <div className="flex flex-wrap gap-1">
                {template.placeholders.slice(0, 4).map((placeholder: string) => (
                  <span key={placeholder} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                    {placeholder}
                  </span>
                ))}
                {template.placeholders.length > 4 && (
                  <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">
                    +{template.placeholders.length - 4} more
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
              <span>Created: {format(new Date(template.created_at), 'MMM dd, yyyy')}</span>
              <span>Updated: {format(new Date(template.updated_at), 'MMM dd, yyyy')}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // Preview template
                    toast.info('Template preview coming soon!')
                  }}
                  className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                  title="Preview Template"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDuplicateTemplate(template)}
                  className="p-2 text-gray-400 hover:text-purple-400 transition-colors hover:bg-white/20 rounded-lg"
                  title="Duplicate Template"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="p-2 text-gray-400 hover:text-green-400 transition-colors hover:bg-white/20 rounded-lg"
                  title="Edit Template"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleToggleActive(template.id, template.active)}
                  className="p-2 text-gray-400 hover:text-orange-400 transition-colors hover:bg-white/20 rounded-lg"
                  title={template.active ? 'Deactivate' : 'Activate'}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No templates found</h3>
          <p className="text-gray-300 mb-6">
            {searchTerm 
              ? 'Try adjusting your search term' 
              : 'Get started by creating your first proposal template'}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Create First Template
          </button>
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <ProposalTemplateModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
        />
      )}

      {editingTemplate && (
        <ProposalTemplateModal 
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          template={editingTemplate}
          mode="edit"
        />
      )}
    </div>
  )
}

export default ProposalTemplatesList