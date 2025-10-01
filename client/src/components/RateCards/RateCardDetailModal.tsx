import React, { useState } from 'react'
import { 
  X, 
  DollarSign, 
  Edit3, 
  Download,
  Star,
  Package,
  TrendingUp,
  CheckCircle,
  XCircle,
  Calendar,
  User
} from 'lucide-react'
import { useRateCards, RateCardItem } from '../../hooks/useRateCards'
import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface RateCardDetailModalProps {
  rateCard: any
  isOpen: boolean
  onClose: () => void
}

const RateCardDetailModal: React.FC<RateCardDetailModalProps> = ({ rateCard, isOpen, onClose }) => {
  const { exportRateCard, activateRateCard } = useRateCards()
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('items')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const items = rateCard.items as RateCardItem[]
  const categories = ['All', ...new Set(items.map(item => item.category))]
  const statuses = ['All', 'Active', 'Inactive']

  const filteredItems = items.filter(item => {
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter
    const matchesStatus = statusFilter === 'All' || 
                         (statusFilter === 'Active' && item.active) ||
                         (statusFilter === 'Inactive' && !item.active)
    return matchesCategory && matchesStatus
  })

  const getCategoryStats = () => {
    const stats: Record<string, { count: number; avgPrice: number; totalValue: number }> = {}
    
    items.forEach(item => {
      if (!stats[item.category]) {
        stats[item.category] = { count: 0, avgPrice: 0, totalValue: 0 }
      }
      stats[item.category].count++
      stats[item.category].totalValue += item.basePrice
    })

    Object.keys(stats).forEach(category => {
      stats[category].avgPrice = stats[category].totalValue / stats[category].count
    })

    return stats
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'IT': return 'bg-blue-100 text-blue-800'
      case 'Non-IT': return 'bg-green-100 text-green-800'
      case 'Leadership': return 'bg-purple-100 text-purple-800'
      case 'Volume': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleActivate = async () => {
    if (rateCard.active) {
      toast.info('This rate card is already active')
      return
    }

    try {
      await activateRateCard(rateCard.id)
      toast.success(`Rate Card ${rateCard.version} activated successfully`)
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate rate card')
    }
  }

  const handleExport = (format: 'csv' | 'excel') => {
    exportRateCard(rateCard, format)
    toast.success(`Rate card exported as ${format.toUpperCase()}`)
  }

  if (!isOpen) return null

  const categoryStats = getCategoryStats()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
        {/* Header */}
        <div className="gradient-primary p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center space-x-2">
                  <span>Rate Card {rateCard.version}</span>
                  {rateCard.active && <Star className="w-6 h-6 text-yellow-400" />}
                </h2>
                <p className="text-blue-100 mt-1">
                  {rateCard.active ? 'Currently Active Rate Card' : 'Inactive Rate Card'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {rateCard.active ? (
                <span className="px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm font-medium">
                  ACTIVE
                </span>
              ) : (
                <span className="px-3 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-300 text-sm font-medium">
                  INACTIVE
                </span>
              )}
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
              { id: 'items', label: 'Rate Items', icon: Package },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'history', label: 'History', icon: Calendar }
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
          {activeTab === 'items' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Items Table */}
              <div className="bg-white/10 rounded-xl overflow-hidden border border-white/20">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/10 border-b border-white/20">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-white">Position</th>
                        <th className="text-left py-4 px-6 font-semibold text-white">Category</th>
                        <th className="text-left py-4 px-6 font-semibold text-white">Base Price</th>
                        <th className="text-left py-4 px-6 font-semibold text-white">Service Fee</th>
                        <th className="text-left py-4 px-6 font-semibold text-white">Max Discount</th>
                        <th className="text-left py-4 px-6 font-semibold text-white">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-semibold text-white">{item.name}</p>
                              {item.description && (
                                <p className="text-sm text-gray-300">{item.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-semibold text-white">₹{item.basePrice.toLocaleString()}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-white">{item.unit}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-orange-400 font-medium">{item.discountLimit}%</p>
                          </td>
                          <td className="py-4 px-6">
                            {item.active ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Category Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(categoryStats).map(([category, stats]) => (
                  <div key={category} className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{category}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                        {stats.count} items
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-300">
                        Avg Price: <span className="text-white font-medium">₹{(stats.avgPrice / 1000).toFixed(0)}K</span>
                      </p>
                      <p className="text-sm text-gray-300">
                        Total Value: <span className="text-green-400 font-medium">₹{(stats.totalValue / 100000).toFixed(1)}L</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Distribution */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Pricing Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      ₹{Math.min(...items.map(i => i.basePrice)).toLocaleString()}
                    </p>
                    <p className="text-gray-300 text-sm">Minimum Price</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">
                      ₹{Math.round(items.reduce((sum, i) => sum + i.basePrice, 0) / items.length).toLocaleString()}
                    </p>
                    <p className="text-gray-300 text-sm">Average Price</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">
                      ₹{Math.max(...items.map(i => i.basePrice)).toLocaleString()}
                    </p>
                    <p className="text-gray-300 text-sm">Maximum Price</p>
                  </div>
                </div>
              </div>

              {/* Discount Analysis */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Discount Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-400">
                      {Math.min(...items.map(i => i.discountLimit))}%
                    </p>
                    <p className="text-gray-300 text-sm">Min Discount</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">
                      {Math.round(items.reduce((sum, i) => sum + i.discountLimit, 0) / items.length)}%
                    </p>
                    <p className="text-gray-300 text-sm">Avg Discount</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">
                      {Math.max(...items.map(i => i.discountLimit))}%
                    </p>
                    <p className="text-gray-300 text-sm">Max Discount</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Rate Card Information */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Rate Card Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Version</p>
                    <p className="text-white font-semibold">{rateCard.version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Status</p>
                    <p className={`font-semibold ${rateCard.active ? 'text-green-400' : 'text-gray-400'}`}>
                      {rateCard.active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Created Date</p>
                    <p className="text-white font-semibold">
                      {format(new Date(rateCard.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Total Items</p>
                    <p className="text-white font-semibold">{items.length} positions</p>
                  </div>
                </div>
              </div>

              {/* Usage History */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Usage History</h3>
                <div className="space-y-4">
                  {[
                    {
                      action: 'Rate Card Created',
                      user: 'Admin User',
                      timestamp: rateCard.created_at,
                      details: `Created with ${items.length} items across ${Object.keys(categoryStats).length} categories`
                    },
                    ...(rateCard.active ? [{
                      action: 'Rate Card Activated',
                      user: 'Admin User',
                      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                      details: 'Set as active rate card for all proposals'
                    }] : []),
                    {
                      action: 'Used in Proposal',
                      user: 'Rahul Sharma',
                      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                      details: 'Used for TechCorp Solutions proposal'
                    },
                    {
                      action: 'Used in Proposal',
                      user: 'Priya Patel',
                      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                      details: 'Used for StartupHub India proposal'
                    }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                        <Calendar className="w-5 h-5 text-blue-400" />
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
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/20 p-6">
          <div className="flex justify-between">
            <div className="flex space-x-3">
              <button
                onClick={() => handleExport('csv')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              
              <button
                onClick={() => handleExport('excel')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            </div>
            
            <div className="flex space-x-3">
              {!rateCard.active && (
                <button
                  onClick={handleActivate}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Star className="w-4 h-4" />
                  <span>Activate</span>
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

export default RateCardDetailModal