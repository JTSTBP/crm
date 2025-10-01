import React from 'react'
import { 
  X, 
  MessageSquare, 
  Calendar,
  User,
  Star,
  AlertCircle,
  Bell,
  Edit3,
  Trash2,
  Share2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface NoticeDetailModalProps {
  notice: any
  isOpen: boolean
  onClose: () => void
}

const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({ notice, isOpen, onClose }) => {
  const { profile } = useAuth()

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Targets': return <Star className="w-5 h-5 text-blue-500" />
      case 'Policy': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'General': return <MessageSquare className="w-5 h-5 text-gray-500" />
      case 'News': return <Bell className="w-5 h-5 text-green-500" />
      default: return <MessageSquare className="w-5 h-5 text-gray-500" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Targets': return 'bg-blue-100 text-blue-800'
      case 'Policy': return 'bg-red-100 text-red-800'
      case 'General': return 'bg-gray-100 text-gray-800'
      case 'News': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: notice.title,
        text: notice.content.replace(/<[^>]*>/g, '').substring(0, 200),
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Notice link copied to clipboard')
    }
  }

  const canManageNotice = (profile?.role === 'Admin' || profile?.role === 'Manager') && 
                         notice.createdBy === profile?.id

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
        {/* Header */}
        <div className="gradient-primary p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                {getCategoryIcon(notice.category)}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{notice.title}</h2>
                <div className="flex items-center space-x-4 mt-1 text-blue-100">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(notice.category)}`}>
                    {getCategoryIcon(notice.category)}
                    <span className="ml-1">{notice.category}</span>
                  </span>
                  {notice.isNew && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                      NEW
                    </span>
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
          {/* Notice Metadata */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-300 font-medium">Posted By</p>
                  <p className="text-white font-semibold">{notice.createdByName}</p>
                  <p className="text-gray-400 text-xs">{notice.createdByRole}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-300 font-medium">Posted Date</p>
                  <p className="text-white font-semibold">
                    {format(new Date(notice.createdAt), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {format(new Date(notice.createdAt), 'HH:mm')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-300 font-medium">Category</p>
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(notice.category)}
                    <span className="text-white font-semibold">{notice.category}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notice Content */}
          <div className="bg-white rounded-xl p-6 text-gray-900">
            <div 
              className="prose prose-gray max-w-none"
              dangerouslySetInnerHTML={{ __html: notice.content }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/20 p-6">
          <div className="flex justify-between">
            <div className="flex space-x-3">
              <button
                onClick={handleShare}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
            
            <div className="flex space-x-3">
              {canManageNotice && (
                <>
                  <button
                    onClick={() => {
                      toast.info('Edit notice functionality coming soon!')
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${notice.title}"?`)) {
                        toast.success('Notice deleted successfully')
                        onClose()
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </>
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

export default NoticeDetailModal