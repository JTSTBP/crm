import React, { useState } from 'react'
import { Zap, Clock, FileText, Settings } from 'lucide-react'
import FollowUpReminders from './FollowUpReminders'
import ProposalNudges from './ProposalNudges'
import AutomationSettings from './AutomationSettings'

const AutomationTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'reminders' | 'nudges' | 'settings'>('reminders')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Automation Center</h1>
              <p className="text-indigo-100 text-lg mt-2">
                Automated follow-ups and intelligent reminders to boost productivity
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="grid grid-cols-3 gap-1 bg-white/10 rounded-xl p-1">
        <button
          onClick={() => setActiveSubTab('reminders')}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeSubTab === 'reminders'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="font-medium">Follow-up Reminders</span>
        </button>
        <button
          onClick={() => setActiveSubTab('nudges')}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeSubTab === 'nudges'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="font-medium">Proposal Nudges</span>
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeSubTab === 'settings'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'reminders' && <FollowUpReminders />}
      {activeSubTab === 'nudges' && <ProposalNudges />}
      {activeSubTab === 'settings' && <AutomationSettings />}
    </div>
  )
}

export default AutomationTab