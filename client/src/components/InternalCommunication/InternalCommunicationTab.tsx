import React, { useState } from 'react'
import { MessageSquare, BookOpen, Send } from 'lucide-react'
import NoticeBoard from './NoticeBoard'
import ReferenceLibrary from './ReferenceLibrary'
import MessagingTab from './MessagingTab'

const InternalCommunicationTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'notices' | 'library' | 'messages'>('notices')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Internal Communication</h1>
        <p className="text-gray-300 mt-2 text-lg">
          Stay connected with team announcements and access reference materials
        </p>
      </div>

      {/* Sub-navigation */}
      <div className="grid grid-cols-3 gap-1 bg-white/10 rounded-xl p-1">
        <button
          onClick={() => setActiveSubTab('notices')}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeSubTab === 'notices'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="font-medium">Notice Board</span>
        </button>
        <button
          onClick={() => setActiveSubTab('library')}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeSubTab === 'library'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="font-medium">Reference Library</span>
        </button>
        <button
          onClick={() => setActiveSubTab('messages')}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeSubTab === 'messages'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Send className="w-5 h-5" />
          <span className="font-medium">Messages</span>
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'notices' && <NoticeBoard />}
      {activeSubTab === 'library' && <ReferenceLibrary />}
      {activeSubTab === 'messages' && <MessagingTab />}
    </div>
  )
}

export default InternalCommunicationTab
