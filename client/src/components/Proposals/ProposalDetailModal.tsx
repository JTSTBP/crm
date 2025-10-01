import React, { useState } from 'react'
import { 
  X, 
  FileText, 
  Building2, 
  User, 
  Calendar,
  Mail,
  MessageCircle,
  Download,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  Edit3
} from 'lucide-react'
import { useProposals } from '../../hooks/useProposals'
import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useLeadsContext } from "../../contexts/leadcontext";

interface ProposalDetailModalProps {
  proposal: any
  isOpen: boolean
  onClose: () => void
}

const ProposalDetailModal: React.FC<ProposalDetailModalProps> = ({ proposal, isOpen, onClose }) => {
  const {  sendProposal } = useProposals()
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('details')
  const [loading, setLoading] = useState(false)
    const {updateProposal,
        getAllProposals,
      } = useLeadsContext();

  const handleStatusUpdate = async (newStatus: 'Viewed' | 'Accepted' | 'Rejected') => {
    setLoading(true)
    try {
      await updateProposal(proposal._id, { status: newStatus })
      getAllProposals()
      toast.success(`Proposal marked as ${newStatus.toLowerCase()}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleSendProposal = async (method: 'email' | 'whatsapp' | 'both') => {
    setLoading(true)
    try {
      await sendProposal(proposal._id, method)
      toast.success(`Proposal sent via ${method === 'both' ? 'Email & WhatsApp' : method}!`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send proposal')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Sent': return 'bg-blue-100 text-blue-800'
      case 'Viewed': return 'bg-purple-100 text-purple-800'
      case 'Accepted': return 'bg-green-100 text-green-800'
      case 'Rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <Edit3 className="w-4 h-4" />
      case 'Sent': return <Send className="w-4 h-4" />
      case 'Viewed': return <Eye className="w-4 h-4" />
      case 'Accepted': return <CheckCircle className="w-4 h-4" />
      case 'Rejected': return <XCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
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
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Proposal Details</h2>
                <p className="text-blue-100 mt-1">
                  #{proposal._id.slice(-8)} - {proposal.lead_id?.company_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
                {getStatusIcon(proposal.status)}
                <span className="ml-2">{proposal.status}</span>
              </span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/20">
          <nav className="flex space-x-6 px-6">
            {[
              { id: 'details', label: 'Details', icon: FileText },
              { id: 'content', label: 'Content', icon: Edit3 },
              { id: 'activity', label: 'Activity', icon: Calendar }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-gray-300 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Proposal Information */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Proposal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Proposal ID</p>
                    <p className="text-white font-semibold">#{proposal._id.slice(-8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Template Used</p>
                    <p className="text-white font-semibold">{proposal.template_used}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Rate Card Version</p>
                    <p className="text-white font-semibold">{proposal.rate_card_version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Sent Via</p>
                    <div className="flex items-center space-x-2">
                      {proposal.sent_via === 'Email' && <Mail className="w-4 h-4 text-blue-400" />}
                      {proposal.sent_via === 'WhatsApp' && <MessageCircle className="w-4 h-4 text-green-400" />}
                      {proposal.sent_via === 'Both' && (
                        <>
                          <Mail className="w-4 h-4 text-blue-400" />
                          <MessageCircle className="w-4 h-4 text-green-400" />
                        </>
                      )}
                      <span className="text-white font-semibold">{proposal.sent_via}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Created Date</p>
                    <p className="text-white font-semibold">
                      {format(new Date(proposal.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {proposal.sent_at && (
                    <div>
                      <p className="text-sm text-gray-300 font-medium">Sent Date</p>
                      <p className="text-white font-semibold">
                        {format(new Date(proposal.sent_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Company & Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Company Name</p>
                    <p className="text-white font-semibold">{proposal.lead_id?.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Contact Person</p>
                    <p className="text-white font-semibold">{proposal.lead_id?.contact_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Email</p>
                    <p className="text-white font-semibold">{proposal.lead_id?.contact_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Phone</p>
                    <p className="text-white font-semibold">{proposal.lead_id?.contact_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Lead Stage</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      proposal.lead_id?.stage === 'Won' ? 'bg-green-100 text-green-800' :
                      proposal.lead_id?.stage === 'Negotiation' ? 'bg-orange-100 text-orange-800' :
                      proposal.lead_id?.stage === 'Proposal Sent' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {proposal.lead_id?.stage || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Owner</p>
                    <p className="text-white font-semibold">{proposal.user_id?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {proposal.status === 'Draft' && (
                <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Send Proposal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleSendProposal('email')}
                      disabled={loading}
                      className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl transition-colors font-medium disabled:opacity-50"
                    >
                      <Mail className="w-5 h-5" />
                      <span>Send via Email</span>
                    </button>
                    <button
                      onClick={() => handleSendProposal('whatsapp')}
                      disabled={loading}
                      className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl transition-colors font-medium disabled:opacity-50"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Send via WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleSendProposal('both')}
                      disabled={loading}
                      className="flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-xl transition-colors font-medium disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                      <span>Send Both</span>
                    </button>
                  </div>
                </div>
              )}

              {proposal.status === 'Sent' && (
                <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Update Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleStatusUpdate('Viewed')}
                      disabled={loading}
                      className="flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-xl transition-colors font-medium disabled:opacity-50"
                    >
                      <Eye className="w-5 h-5" />
                      <span>Mark as Viewed</span>
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('Accepted')}
                      disabled={loading}
                      className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl transition-colors font-medium disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Mark as Accepted</span>
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('Rejected')}
                      disabled={loading}
                      className="flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl transition-colors font-medium disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>Mark as Rejected</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Proposal Content</h3>
                {proposal.content ? (
                  <div className="bg-white rounded-xl p-6 text-gray-900">
                    <div className="whitespace-pre-wrap">{proposal.content}</div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-300">No content available</p>
                    <p className="text-sm text-gray-400">Content will be generated when proposal is created from template</p>
                  </div>
                )}
              </div>

              {proposal.pdf_link && (
                <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-4">PDF Document</h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Proposal Document</p>
                      <p className="text-gray-300 text-sm">PDF format</p>
                    </div>
                    <a
                      href={proposal.pdf_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Proposal Timeline</h3>
                <div className="space-y-4">
                  {[
                    {
                      action: 'Proposal Created',
                      user: proposal.user?.name || 'Unknown',
                      timestamp: proposal.created_at,
                      details: `Created using ${proposal.template_used} template`,
                      icon: <FileText className="w-5 h-5 text-blue-500" />
                    },
                    ...(proposal.sent_at ? [{
                      action: 'Proposal Sent',
                      user: proposal.user?.name || 'Unknown',
                      timestamp: proposal.sent_at,
                      details: `Sent via ${proposal.sent_via}`,
                      icon: <Send className="w-5 h-5 text-purple-500" />
                    }] : []),
                    ...(proposal.status === 'Viewed' ? [{
                      action: 'Proposal Viewed',
                      user: proposal.lead?.contact_name || 'Client',
                      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                      details: 'Client opened the proposal',
                      icon: <Eye className="w-5 h-5 text-green-500" />
                    }] : []),
                    ...(proposal.status === 'Accepted' ? [{
                      action: 'Proposal Accepted',
                      user: proposal.lead?.contact_name || 'Client',
                      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                      details: 'Client accepted the proposal',
                      icon: <CheckCircle className="w-5 h-5 text-green-500" />
                    }] : []),
                    ...(proposal.status === 'Rejected' ? [{
                      action: 'Proposal Rejected',
                      user: proposal.lead?.contact_name || 'Client',
                      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                      details: 'Client declined the proposal',
                      icon: <XCircle className="w-5 h-5 text-red-500" />
                    }] : [])
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-white">{activity.action}</h4>
                          <span className="text-xs text-gray-400">
                            {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">{activity.details}</p>
                        <p className="text-xs text-gray-400 mt-1">by {activity.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Communication History */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Communication History</h3>
                <div className="space-y-3">
                  {proposal.email_sent && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">Email Sent</p>
                        <p className="text-blue-300 text-sm">
                          Sent to {proposal.lead?.contact_email} on {proposal.sent_at ? format(new Date(proposal.sent_at), 'MMM dd, yyyy') : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {proposal.whatsapp_sent && (
                    <div className="flex items-center space-x-3 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                      <MessageCircle className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-white font-medium">WhatsApp Sent</p>
                        <p className="text-green-300 text-sm">
                          Sent to {proposal.lead?.contact_phone} on {proposal.sent_at ? format(new Date(proposal.sent_at), 'MMM dd, yyyy') : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {!proposal.email_sent && !proposal.whatsapp_sent && (
                    <div className="text-center py-6">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-300">No communications sent yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/20 p-6">
          <div className="flex justify-between">
            <div className="flex space-x-3">
              {proposal.pdf_link && (
                <a
                  href={proposal.pdf_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </a>
              )}
            </div>
            
            <div className="flex space-x-3">
              {(profile?.role === 'Admin' || proposal.user_id === user?.id) && (
                <button
                  onClick={() => {
                    toast.info('Edit proposal functionality coming soon!')
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
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

export default ProposalDetailModal