import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, FileText, Building2, User } from 'lucide-react'
import { useProposals } from '../../hooks/useProposals'
import { useProposalTemplates } from '../../hooks/useProposalTemplates'
import { useLeads } from '../../hooks/useLeads'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { useLeadsContext } from '../../contexts/leadcontext'

interface CreateProposalModalProps {
  isOpen: boolean
  onClose: () => void
  leadId?: string
}

interface ProposalFormData {
  lead_id: string
  template_id: string
  rate_card_version: string
  sent_via: 'Email' | 'WhatsApp' | 'Both'
  status: 'Draft' | 'Sent'
}

const CreateProposalModal: React.FC<CreateProposalModalProps> = ({ isOpen, onClose, leadId }) => {
  // const { createProposal } = useProposals()
  const { templates } = useProposalTemplates()
  const { leads } = useLeads()
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false)
  const {
      createProposal,
      proposals,
      getAllProposals,
    } = useLeadsContext();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProposalFormData>({
    defaultValues: {
      lead_id: leadId || '',
      template_id: '',
      rate_card_version: 'v1.0',
      sent_via: 'Email',
      status: 'Draft'
    }
  })
console.log(profile,"pro")
  const onSubmit = async (data: ProposalFormData) => {
    setLoading(true)
    try {
      const selectedTemplate = templates.find(t => t.id === data.template_id)
      
      await createProposal({
        ...data,
        template_used: leadId || "Unknown Template",
        user_id: profile?.id,
      });
      getAllProposals()
      
      toast.success('Proposal created successfully!')
      reset()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create proposal')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Create Proposal</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300 text-gray-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              <Building2 className="w-4 h-4 inline mr-2" />
              Select Lead/Company *
            </label>
            <select
              {...register('lead_id', { required: 'Please select a lead' })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              <option value="">Choose a lead</option>
              {leads.map(lead => (
                <option key={lead._id} value={lead._id}>
                  {lead.company_name} - {lead.contact_name}
                </option>
              ))}
            </select>
            {errors.lead_id && (
              <p className="mt-2 text-sm text-red-300">{errors.lead_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              <FileText className="w-4 h-4 inline mr-2" />
              Proposal Template *
            </label>
            <select
              {...register('template_id', { required: 'Please select a template' })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              <option value="">Choose a template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {errors.template_id && (
              <p className="mt-2 text-sm text-red-300">{errors.template_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Rate Card Version
            </label>
            <select
              {...register('rate_card_version')}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              <option value="v1.0">v1.0 - Current</option>
              <option value="v0.9">v0.9 - Previous</option>
              <option value="v0.8">v0.8 - Legacy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Send Via
            </label>
            <select
              {...register('sent_via')}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              <option value="Email">Email</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Both">Both Email & WhatsApp</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Initial Status
            </label>
            <select
              {...register('status')}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Send Immediately</option>
            </select>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <h4 className="text-blue-400 font-semibold mb-2">Proposal Workflow:</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p><strong>Draft:</strong> Proposal created but not sent</p>
              <p><strong>Sent:</strong> Proposal delivered to client</p>
              <p><strong>Viewed:</strong> Client has opened the proposal</p>
              <p><strong>Accepted:</strong> Client accepted the proposal</p>
              <p><strong>Rejected:</strong> Client declined the proposal</p>
            </div>
          </div>

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
              {loading ? 'Creating...' : 'Create Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProposalModal