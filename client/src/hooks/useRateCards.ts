import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Database } from '../lib/supabase'

type RateCard = Database['public']['Tables']['rate_cards']['Row']

export interface RateCardItem {
  id: string
  name: string
  category: string
  basePrice: number
  discountLimit: number
  unit: string
  description?: string
  active: boolean
}

// Demo rate cards data
const demoRateCards: RateCard[] = [
  {
    id: 'demo-rate-card-1',
    version: 'v2.0',
    created_by: 'demo-admin',
    items: [
      {
        id: '1',
        name: 'Software Engineer',
        category: 'IT',
        basePrice: 150000,
        discountLimit: 15,
        unit: '8.33% of CTC',
        description: 'Full-stack development positions',
        active: true
      },
      {
        id: '2',
        name: 'Senior Software Engineer',
        category: 'IT',
        basePrice: 250000,
        discountLimit: 12,
        unit: '8.33% of CTC',
        description: '5+ years experience',
        active: true
      },
      {
        id: '3',
        name: 'Engineering Manager',
        category: 'Leadership',
        basePrice: 400000,
        discountLimit: 10,
        unit: '16.67% of CTC',
        description: 'Team leadership roles',
        active: true
      },
      {
        id: '4',
        name: 'Data Scientist',
        category: 'IT',
        basePrice: 200000,
        discountLimit: 15,
        unit: '8.33% of CTC',
        description: 'ML/AI specialists',
        active: true
      },
      {
        id: '5',
        name: 'Product Manager',
        category: 'Non-IT',
        basePrice: 300000,
        discountLimit: 12,
        unit: '8.33% of CTC',
        description: 'Product strategy and management',
        active: true
      },
      {
        id: '6',
        name: 'Sales Executive',
        category: 'Non-IT',
        basePrice: 100000,
        discountLimit: 20,
        unit: '8.33% of CTC',
        description: 'Business development roles',
        active: true
      },
      {
        id: '7',
        name: 'HR Manager',
        category: 'Non-IT',
        basePrice: 180000,
        discountLimit: 15,
        unit: '8.33% of CTC',
        description: 'Human resources management',
        active: true
      },
      {
        id: '8',
        name: 'Volume Hiring',
        category: 'Volume',
        basePrice: 50000,
        discountLimit: 25,
        unit: 'Per position',
        description: 'Bulk recruitment (10+ positions)',
        active: true
      }
    ],
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-rate-card-2',
    version: 'v1.0',
    created_by: 'demo-admin',
    items: [
      {
        id: '1',
        name: 'Software Engineer',
        category: 'IT',
        basePrice: 140000,
        discountLimit: 10,
        unit: '8.33% of CTC',
        description: 'Previous version pricing',
        active: false
      },
      {
        id: '2',
        name: 'Senior Software Engineer',
        category: 'IT',
        basePrice: 230000,
        discountLimit: 10,
        unit: '8.33% of CTC',
        description: 'Previous version pricing',
        active: false
      }
    ],
    active: false,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
]

export const useRateCards = () => {
  const [rateCards, setRateCards] = useState<RateCard[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()

  const fetchRateCards = async () => {
    if (!user || !profile) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - return demo data
      setTimeout(() => {
        setRateCards(demoRateCards)
        setLoading(false)
      }, 500)
      return
    }

    try {
      const { data, error } = await supabase
        .from('rate_cards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching rate cards:', error)
      } else {
        setRateCards(data || [])
      }
    } catch (error) {
      console.error('Error fetching rate cards:', error)
    }
    setLoading(false)
  }

  const createRateCard = async (version: string, items: RateCardItem[]) => {
    if (!user) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate creating rate card
      const newRateCard: RateCard = {
        id: `demo-rate-card-${Date.now()}`,
        version,
        created_by: user.id,
        items,
        active: true,
        created_at: new Date().toISOString()
      }
      
      // Deactivate other rate cards
      setRateCards(prev => [
        newRateCard,
        ...prev.map(rc => ({ ...rc, active: false }))
      ])
      return
    }

    try {
      // Deactivate all existing rate cards first
      await supabase
        .from('rate_cards')
        .update({ active: false })
        .neq('id', '')

      // Create new rate card
      const { error } = await supabase
        .from('rate_cards')
        .insert([{
          version,
          created_by: user.id,
          items,
          active: true
        }])

      if (error) {
        console.error('Error creating rate card:', error)
        throw error
      }

      await fetchRateCards()
    } catch (error) {
      console.error('Error creating rate card:', error)
      throw error
    }
  }

  const updateRateCard = async (id: string, updates: Partial<RateCard>) => {
    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate updating rate card
      setRateCards(prev => prev.map(rc => 
        rc.id === id 
          ? { ...rc, ...updates }
          : rc
      ))
      return
    }

    try {
      const { error } = await supabase
        .from('rate_cards')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Error updating rate card:', error)
        throw error
      }

      await fetchRateCards()
    } catch (error) {
      console.error('Error updating rate card:', error)
      throw error
    }
  }

  const activateRateCard = async (id: string) => {
    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate activating rate card
      setRateCards(prev => prev.map(rc => ({
        ...rc,
        active: rc.id === id
      })))
      return
    }

    try {
      // Deactivate all rate cards first
      await supabase
        .from('rate_cards')
        .update({ active: false })
        .neq('id', '')

      // Activate the selected rate card
      await updateRateCard(id, { active: true })
    } catch (error) {
      console.error('Error activating rate card:', error)
      throw error
    }
  }

  const deleteRateCard = async (id: string) => {
    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate deleting rate card
      setRateCards(prev => prev.filter(rc => rc.id !== id))
      return
    }

    try {
      const { error } = await supabase
        .from('rate_cards')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting rate card:', error)
        throw error
      }

      await fetchRateCards()
    } catch (error) {
      console.error('Error deleting rate card:', error)
      throw error
    }
  }

  const getActiveRateCard = (): RateCard | null => {
    return rateCards.find(rc => rc.active) || null
  }

  const exportRateCard = (rateCard: RateCard, format: 'csv' | 'excel') => {
    const items = rateCard.items as RateCardItem[]
    const exportData = items.map(item => ({
      'Position': item.name,
      'Category': item.category,
      'Base Price (₹)': item.basePrice,
      'Service Fee': item.unit,
      'Max Discount (%)': item.discountLimit,
      'Description': item.description || '',
      'Status': item.active ? 'Active' : 'Inactive'
    }))

    const csvContent = [
      `Rate Card Version: ${rateCard.version}`,
      `Created: ${new Date(rateCard.created_at).toLocaleDateString()}`,
      '',
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rate-card-${rateCard.version}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchRateCards()
  }, [user, profile])

  return {
    rateCards,
    loading,
    createRateCard,
    updateRateCard,
    activateRateCard,
    deleteRateCard,
    getActiveRateCard,
    exportRateCard,
    refetch: fetchRateCards
  }
}