import React, { useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  MessageSquare, 
  Calendar,
  User,
  Edit3,
  Trash2,
  Eye,
  Bell,
  Star,
  AlertCircle
} from 'lucide-react'
import { useNoticeBoard } from '../../hooks/useNoticeBoard'
import { useAuth } from '../../contexts/AuthContext'
import CreateNoticeModal from './CreateNoticeModal'
import NoticeDetailModal from './NoticeDetailModal'
import { format, isToday, isYesterday } from 'date-fns'
import toast from 'react-hot-toast'

const NoticeBoard: React.FC = () => {
  const { notices, loading, deleteNotice } = useNoticeBoard()
  const { profile } = useAuth()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')

  const categories = ['All', 'Targets', 'Policy', 'General', 'News']
  const dateRanges = ['All', 'Today', 'This Week', 'This Month']

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || notice.category === categoryFilter
    
    let matchesDate = true
    if (dateFilter !== 'All') {
      const noticeDate = new Date(notice.createdAt)
      const now = new Date()
      
      switch (dateFilter) {
        case 'Today':
          matchesDate = isToday(noticeDate)
          break
        case 'This Week':
          matchesDate = noticeDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'This Month':
          matchesDate = noticeDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }
    }
    
    return matchesSearch && matchesCategory && matchesDate
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Targets': return 'bg-blue-100 text-blue-800'
      case 'Policy': return 'bg-red-100 text-red-800'
      case 'General': return 'bg-gray-100 text-gray-800'
      case 'News': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Targets': return <Star className="w-4 h-4" />
      case 'Policy': return <AlertCircle className="w-4 h-4" />
      case 'General': return <MessageSquare className="w-4 h-4" />
      case 'News': return <Bell className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const formatNoticeDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return `Today at ${format(date, 'HH:mm')}`
    if (isYesterday(date)) return `Yesterday at ${format(date, 'HH:mm')}`
    return format(date, 'MMM dd, yyyy HH:mm')
  }

  const handleDeleteNotice = async (noticeId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteNotice(noticeId)
        toast.success('Notice deleted successfully')
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete notice')
      }
    }
  }

  // Only Admin and Manager can manage notices
  const canManageNotices = profile?.role === 'Admin' || profile?.role === 'Manager'

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
          <h2 className="text-2xl font-bold text-white tracking-tight">Notice Board</h2>
          <p className="text-gray-300 mt-1">Company announcements, policies, and important updates</p>
        </div>
        {canManageNotices && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="gradient-primary text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Create Notice</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass rounded-xl p-4 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Total Notices</p>
              <p className="text-2xl font-bold text-white mt-1">{notices.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">New This Week</p>
              <p className="text-2xl font-bold text-white mt-1">
                {notices.filter(n => n.isNew).length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-500">
              <Bell className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Policies</p>
              <p className="text-2xl font-bold text-white mt-1">
                {notices.filter(n => n.category === 'Policy').length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-500">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Targets</p>
              <p className="text-2xl font-bold text-white mt-1">
                {notices.filter(n => n.category === 'Targets').length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500">
              <Star className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-6 border border-white/30 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-300" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
          >
            {dateRanges.map(range => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notices List */}
      <div className="glass rounded-xl border border-white/30 overflow-hidden shadow-xl">
        {filteredNotices.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-3">No notices found</h3>
            <p className="text-gray-300 text-lg">
              {searchTerm || categoryFilter !== 'All' || dateFilter !== 'All'
                ? 'Try adjusting your search or filters' 
                : 'No notices have been posted yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredNotices.map((notice) => (
              <div 
                key={notice.id} 
                className="p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-[1.01]"
                onClick={() => setSelectedNotice(notice)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{notice.title}</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(notice.category)}`}>
                        {getCategoryIcon(notice.category)}
                        <span className="ml-1">{notice.category}</span>
                      </span>
                      {notice.isNew && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
                    
                    <div 
                      className="text-gray-300 text-sm line-clamp-3 mb-3"
                      dangerouslySetInnerHTML={{ 
                        __html: notice.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...' 
                      }}
                    />
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{notice.createdByName} ({notice.createdByRole})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatNoticeDate(notice.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedNotice(notice)
                      }}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                      title="View Notice"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {canManageNotices && notice.createdBy === profile?.id && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Edit functionality
                            toast.info('Edit notice functionality coming soon!')
                          }}
                          className="p-2 text-gray-400 hover:text-purple-400 transition-colors hover:bg-white/20 rounded-lg"
                          title="Edit Notice"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNotice(notice.id, notice.title)
                          }}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/20 rounded-lg"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateNoticeModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {selectedNotice && (
        <NoticeDetailModal 
          notice={selectedNotice}
          isOpen={!!selectedNotice}
          onClose={() => setSelectedNotice(null)}
        />
      )}
    </div>
  )
}

export default NoticeBoard