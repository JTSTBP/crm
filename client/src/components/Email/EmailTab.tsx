import React, { useState } from 'react'
import { Mail, Inbox, Send, Edit3, Search, Filter } from 'lucide-react'
import { useEmails } from '../../hooks/useEmails'
import InboxList from './InboxList'
import SentList from './SentList'
import ComposeModal from './ComposeModal'
import EmailDetailModal from './EmailDetailModal'

const EmailTab: React.FC = () => {
  const { getUnreadCount } = useEmails()
  const [activeSubTab, setActiveSubTab] = useState<'inbox' | 'sent'>('inbox')
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const unreadCount = getUnreadCount()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Email Center</h1>
          <p className="text-gray-300 mt-2 text-lg">
            Manage all your email communications in one place
          </p>
        </div>
        <button
          onClick={() => setIsComposeModalOpen(true)}
          className="gradient-primary text-white px-6 py-4 rounded-2xl flex items-center space-x-3 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
        >
          <Edit3 className="w-5 h-5" />
          <span>Compose Email</span>
        </button>
      </div>

      {/* Search */}
      <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
          />
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex space-x-1 bg-white/10 rounded-xl p-1">
        <button
          onClick={() => setActiveSubTab('inbox')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeSubTab === 'inbox'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Inbox className="w-5 h-5" />
          <span className="font-medium">Inbox</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('sent')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeSubTab === 'sent'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Send className="w-5 h-5" />
          <span className="font-medium">Sent</span>
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'inbox' && (
        <InboxList 
          searchTerm={searchTerm}
          onEmailSelect={setSelectedEmail}
        />
      )}
      {activeSubTab === 'sent' && (
        <SentList 
          searchTerm={searchTerm}
          onEmailSelect={setSelectedEmail}
        />
      )}

      {/* Modals */}
      {isComposeModalOpen && (
        <ComposeModal 
          isOpen={isComposeModalOpen}
          onClose={() => setIsComposeModalOpen(false)}
        />
      )}

      {selectedEmail && (
        <EmailDetailModal 
          email={selectedEmail}
          isOpen={!!selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onReply={() => {
            setSelectedEmail(null)
            setIsComposeModalOpen(true)
          }}
        />
      )}
    </div>
  )
}

export default EmailTab