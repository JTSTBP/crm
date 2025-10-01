import React, { useState } from 'react'
import { FileText, Settings } from 'lucide-react'
import ProposalsList from './ProposalsList'
import ProposalTemplatesList from './ProposalTemplatesList'

const ProposalsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'proposals' | 'templates'>('proposals')

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex space-x-1 bg-white/10 rounded-xl p-1">
        <button
          onClick={() => setActiveSubTab('proposals')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeSubTab === 'proposals'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="font-medium">All Proposals</span>
        </button>
        <button
          onClick={() => setActiveSubTab('templates')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeSubTab === 'templates'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Templates</span>
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'proposals' && <ProposalsList />}
      {activeSubTab === 'templates' && <ProposalTemplatesList />}
    </div>
  )
}

export default ProposalsTab