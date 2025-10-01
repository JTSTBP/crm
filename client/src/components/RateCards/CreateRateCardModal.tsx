import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, DollarSign, Plus, Minus, Package, TrendingUp } from 'lucide-react'
import { useRateCards, RateCardItem } from '../../hooks/useRateCards'
import toast from 'react-hot-toast'

interface CreateRateCardModalProps {
  isOpen: boolean
  onClose: () => void
}

interface RateCardFormData {
  version: string
}

const CreateRateCardModal: React.FC<CreateRateCardModalProps> = ({ isOpen, onClose }) => {
  const { createRateCard } = useRateCards()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<RateCardItem[]>([
    {
      id: '1',
      name: '',
      category: 'IT',
      basePrice: 0,
      discountLimit: 10,
      unit: '8.33% of CTC',
      description: '',
      active: true
    }
  ])

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RateCardFormData>()

  const categories = ['IT', 'Non-IT', 'Leadership', 'Volume']
  const units = ['8.33% of CTC', '16.67% of CTC', 'Per position', 'Fixed amount', 'Monthly retainer']

  const addItem = () => {
    const newItem: RateCardItem = {
      id: Date.now().toString(),
      name: '',
      category: 'IT',
      basePrice: 0,
      discountLimit: 10,
      unit: '8.33% of CTC',
      description: '',
      active: true
    }
    setItems([...items, newItem])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof RateCardItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  const onSubmit = async (data: RateCardFormData) => {
    // Validate items
    const validItems = items.filter(item => item.name.trim() && item.basePrice > 0)
    
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item')
      return
    }

    setLoading(true)
    try {
      await createRateCard(data.version, validItems)
      toast.success('Rate card created successfully!')
      reset()
      setItems([{
        id: '1',
        name: '',
        category: 'IT',
        basePrice: 0,
        discountLimit: 10,
        unit: '8.33% of CTC',
        description: '',
        active: true
      }])
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create rate card')
    } finally {
      setLoading(false)
    }
  }

  const loadPresetTemplate = (template: 'standard' | 'leadership' | 'volume') => {
    const templates = {
      standard: [
        { name: 'Software Engineer', category: 'IT', basePrice: 150000, discountLimit: 15, unit: '8.33% of CTC', description: 'Full-stack development positions' },
        { name: 'Senior Software Engineer', category: 'IT', basePrice: 250000, discountLimit: 12, unit: '8.33% of CTC', description: '5+ years experience' },
        { name: 'Data Scientist', category: 'IT', basePrice: 200000, discountLimit: 15, unit: '8.33% of CTC', description: 'ML/AI specialists' },
        { name: 'Product Manager', category: 'Non-IT', basePrice: 300000, discountLimit: 12, unit: '8.33% of CTC', description: 'Product strategy and management' },
        { name: 'Sales Executive', category: 'Non-IT', basePrice: 100000, discountLimit: 20, unit: '8.33% of CTC', description: 'Business development roles' }
      ],
      leadership: [
        { name: 'Engineering Manager', category: 'Leadership', basePrice: 400000, discountLimit: 10, unit: '16.67% of CTC', description: 'Team leadership roles' },
        { name: 'VP Engineering', category: 'Leadership', basePrice: 800000, discountLimit: 8, unit: '16.67% of CTC', description: 'Senior leadership positions' },
        { name: 'CTO', category: 'Leadership', basePrice: 1500000, discountLimit: 5, unit: '16.67% of CTC', description: 'C-level technology leadership' }
      ],
      volume: [
        { name: 'Volume Hiring (10-50 positions)', category: 'Volume', basePrice: 50000, discountLimit: 25, unit: 'Per position', description: 'Bulk recruitment services' },
        { name: 'Campus Hiring', category: 'Volume', basePrice: 30000, discountLimit: 30, unit: 'Per position', description: 'Fresh graduate recruitment' },
        { name: 'Contract Staffing', category: 'Volume', basePrice: 25000, discountLimit: 20, unit: 'Monthly per resource', description: 'Temporary staffing solutions' }
      ]
    }

    const templateItems = templates[template].map((item, index) => ({
      ...item,
      id: (index + 1).toString(),
      active: true
    }))

    setItems(templateItems)
    toast.success(`${template.charAt(0).toUpperCase() + template.slice(1)} template loaded!`)
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
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Create New Rate Card</h2>
                <p className="text-blue-100 mt-1">Define pricing structure for your services</p>
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Rate Card Version */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Rate Card Version *
              </label>
              <input
                {...register('version', { 
                  required: 'Version is required',
                  pattern: {
                    value: /^v\d+\.\d+$/,
                    message: 'Version must be in format v1.0, v2.1, etc.'
                  }
                })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                placeholder="e.g., v2.0"
              />
              {errors.version && (
                <p className="mt-2 text-sm text-red-300">{errors.version.message}</p>
              )}
            </div>

            {/* Quick Templates */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h3 className="text-blue-400 font-semibold mb-3">Quick Start Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => loadPresetTemplate('standard')}
                  className="p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-center transition-colors"
                >
                  <Package className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-blue-300 text-sm font-medium">Standard Positions</p>
                </button>
                <button
                  type="button"
                  onClick={() => loadPresetTemplate('leadership')}
                  className="p-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-center transition-colors"
                >
                  <TrendingUp className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-purple-300 text-sm font-medium">Leadership Roles</p>
                </button>
                <button
                  type="button"
                  onClick={() => loadPresetTemplate('volume')}
                  className="p-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-center transition-colors"
                >
                  <Package className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <p className="text-green-300 text-sm font-medium">Volume Hiring</p>
                </button>
              </div>
            </div>

            {/* Rate Card Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-white">
                  Rate Card Items *
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">Item {index + 1}</h4>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Position Name *</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 text-sm"
                          placeholder="e.g., Software Engineer"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Category *</label>
                        <select
                          value={item.category}
                          onChange={(e) => updateItem(index, 'category', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-400 text-sm"
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Base Price (₹) *</label>
                        <input
                          type="number"
                          value={item.basePrice || ''}
                          onChange={(e) => updateItem(index, 'basePrice', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 text-sm"
                          placeholder="150000"
                          min="0"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Service Fee Unit *</label>
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-400 text-sm"
                        >
                          {units.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Max Discount (%) *</label>
                        <input
                          type="number"
                          value={item.discountLimit || ''}
                          onChange={(e) => updateItem(index, 'discountLimit', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 text-sm"
                          placeholder="10"
                          min="0"
                          max="50"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Description</label>
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 text-sm"
                          placeholder="Brief description"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.active}
                          onChange={(e) => updateItem(index, 'active', e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                        />
                        <span className="text-white text-sm">Active item</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <h4 className="text-green-400 font-semibold mb-2">Rate Card Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-300">Total Items:</span>
                  <span className="text-white ml-2 font-medium">{items.length}</span>
                </div>
                <div>
                  <span className="text-gray-300">Active Items:</span>
                  <span className="text-green-400 ml-2 font-medium">{items.filter(i => i.active).length}</span>
                </div>
                <div>
                  <span className="text-gray-300">Categories:</span>
                  <span className="text-blue-400 ml-2 font-medium">
                    {new Set(items.map(i => i.category)).size}
                  </span>
                </div>
                <div>
                  <span className="text-gray-300">Avg Price:</span>
                  <span className="text-purple-400 ml-2 font-medium">
                    ₹{items.length > 0 ? Math.round(items.reduce((sum, i) => sum + i.basePrice, 0) / items.length / 1000) : 0}K
                  </span>
                </div>
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
                disabled={loading || items.filter(i => i.name.trim() && i.basePrice > 0).length === 0}
                className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Creating...' : 'Create Rate Card'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateRateCardModal