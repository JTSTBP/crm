import React, { useState } from 'react'
import { 
  Plus, 
  Search, 
  DollarSign, 
  Edit3, 
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Copy,
  Star,
  TrendingUp,
  Package,
  Filter
} from 'lucide-react'
import { useRateCards, RateCardItem } from '../../hooks/useRateCards'
import { useAuth } from '../../contexts/AuthContext'
import CreateRateCardModal from './CreateRateCardModal'
import RateCardDetailModal from './RateCardDetailModal'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const RateCardsList: React.FC = () => {
  const { rateCards, loading, activateRateCard, deleteRateCard, exportRateCard } = useRateCards()
  const { profile } = useAuth()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedRateCard, setSelectedRateCard] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const categories = ['All', 'IT', 'Non-IT', 'Leadership', 'Volume']

  const filteredRateCards = rateCards.filter(rateCard => {
    const matchesSearch = rateCard.version.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesCategory = true
    if (categoryFilter !== 'All') {
      const items = rateCard.items as RateCardItem[]
      matchesCategory = items.some(item => item.category === categoryFilter)
    }
    
    return matchesSearch && matchesCategory
  })

  const handleActivateRateCard = async (id: string, version: string) => {
    if (window.confirm(`Are you sure you want to activate Rate Card ${version}? This will deactivate all other versions.`)) {
      try {
        await activateRateCard(id)
        toast.success(`Rate Card ${version} activated successfully`)
      } catch (error: any) {
        toast.error(error.message || 'Failed to activate rate card')
      }
    }
  }

  const handleDeleteRateCard = async (id: string, version: string) => {
    if (window.confirm(`Are you sure you want to delete Rate Card ${version}? This action cannot be undone.`)) {
      try {
        await deleteRateCard(id)
        toast.success('Rate card deleted successfully')
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete rate card')
      }
    }
  }

  const handleExportRateCard = (rateCard: any, format: 'csv' | 'excel') => {
    exportRateCard(rateCard, format)
    toast.success(`Rate card exported as ${format.toUpperCase()}`)
  }

  const getActiveRateCard = () => {
    return rateCards.find(rc => rc.active)
  }

  const getTotalItems = (rateCard: any) => {
    const items = rateCard.items as RateCardItem[]
    return items.length
  }

  const getActiveItems = (rateCard: any) => {
    const items = rateCard.items as RateCardItem[]
    return items.filter(item => item.active).length
  }

  const getCategoryBreakdown = (rateCard: any) => {
    const items = rateCard.items as RateCardItem[]
    const breakdown: Record<string, number> = {}
    items.forEach(item => {
      breakdown[item.category] = (breakdown[item.category] || 0) + 1
    })
    return breakdown
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const activeRateCard = getActiveRateCard()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Rate Cards Management</h1>
          <p className="text-gray-300 mt-2 text-lg">
            Manage pricing structures and service rates
          </p>
        </div>
        <div className="flex space-x-4">
          {activeRateCard && (
            <button
              onClick={() => handleExportRateCard(activeRateCard, 'csv')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
            >
              <Download className="w-5 h-5" />
              <span>Export Active</span>
            </button>
          )}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="gradient-primary text-white px-6 py-4 rounded-2xl flex items-center space-x-3 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Create Rate Card</span>
          </button>
        </div>
      </div>

      {/* Active Rate Card Summary */}
      {activeRateCard && (
        <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Active Rate Card: {activeRateCard.version}</h2>
                <p className="text-gray-300">Currently used for all proposals</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedRateCard(activeRateCard)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>View Details</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{getTotalItems(activeRateCard)}</div>
              <div className="text-gray-300 text-sm">Total Items</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{getActiveItems(activeRateCard)}</div>
              <div className="text-gray-300 text-sm">Active Items</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Object.keys(getCategoryBreakdown(activeRateCard)).length}
              </div>
              <div className="text-gray-300 text-sm">Categories</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {format(new Date(activeRateCard.created_at), 'MMM yyyy')}
              </div>
              <div className="text-gray-300 text-sm">Created</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rate cards..."
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
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rate Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRateCards.map((rateCard) => {
          const items = rateCard.items as RateCardItem[]
          const categoryBreakdown = getCategoryBreakdown(rateCard)
          
          return (
            <div 
              key={rateCard.id} 
              className={`glass rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                rateCard.active 
                  ? 'border-green-400/50 bg-green-500/10' 
                  : 'border-white/30'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                    rateCard.active 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                      : 'bg-gradient-to-r from-gray-500 to-gray-600'
                  }`}>
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                      <span>Rate Card {rateCard.version}</span>
                      {rateCard.active && <Star className="w-5 h-5 text-yellow-400" />}
                    </h3>
                    <p className="text-gray-300">
                      {rateCard.active ? 'Currently Active' : 'Inactive Version'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {rateCard.active ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full">
                      INACTIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Rate Card Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-white">{items.length}</div>
                  <div className="text-gray-300 text-xs">Total Items</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-green-400">{items.filter(i => i.active).length}</div>
                  <div className="text-gray-300 text-xs">Active Items</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-blue-400">{Object.keys(categoryBreakdown).length}</div>
                  <div className="text-gray-300 text-xs">Categories</div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="mb-4">
                <p className="text-gray-300 text-sm font-medium mb-2">Categories:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(categoryBreakdown).map(([category, count]) => (
                    <span 
                      key={category}
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
                    >
                      {category}: {count}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Items Preview */}
              <div className="mb-4">
                <p className="text-gray-300 text-sm font-medium mb-2">Sample Items:</p>
                <div className="space-y-2">
                  {items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                      <div>
                        <p className="text-white text-sm font-medium">{item.name}</p>
                        <p className="text-gray-400 text-xs">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 text-sm font-bold">₹{(item.basePrice / 1000).toFixed(0)}K</p>
                        <p className="text-gray-400 text-xs">{item.unit}</p>
                      </div>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-gray-400 text-xs text-center">+{items.length - 3} more items</p>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-400 mb-4">
                <p>Created: {format(new Date(rateCard.created_at), 'MMM dd, yyyy')}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedRateCard(rateCard)}
                    className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleExportRateCard(rateCard, 'csv')}
                    className="p-2 text-gray-400 hover:text-green-400 transition-colors hover:bg-white/20 rounded-lg"
                    title="Export CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => {
                      // Duplicate rate card functionality
                      toast.info('Duplicate rate card functionality coming soon!')
                    }}
                    className="p-2 text-gray-400 hover:text-purple-400 transition-colors hover:bg-white/20 rounded-lg"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex space-x-2">
                  {!rateCard.active && (
                    <button
                      onClick={() => handleActivateRateCard(rateCard.id, rateCard.version)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center space-x-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Activate</span>
                    </button>
                  )}
                  
                  {profile?.role === 'Admin' && (
                    <button
                      onClick={() => handleDeleteRateCard(rateCard.id, rateCard.version)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/20 rounded-lg"
                      title="Delete Rate Card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredRateCards.length === 0 && (
        <div className="glass rounded-2xl border border-white/30 p-12 text-center">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-white mb-3">No rate cards found</h3>
          <p className="text-gray-300 text-lg mb-6">
            {searchTerm || categoryFilter !== 'All' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by creating your first rate card'}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Create First Rate Card
          </button>
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateRateCardModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {selectedRateCard && (
        <RateCardDetailModal 
          rateCard={selectedRateCard}
          isOpen={!!selectedRateCard}
          onClose={() => setSelectedRateCard(null)}
        />
      )}
    </div>
  )
}

export default RateCardsList