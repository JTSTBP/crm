import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { 
  X, 
  Bell, 
  Calendar, 
  Clock,
  Target,
  AlertTriangle,
  CheckSquare,
  Users,
  FileText,
  Phone,
  Repeat
} from 'lucide-react'
import { useReminders } from '../../hooks/useReminders'
import { useLeads } from '../../hooks/useLeads'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface CreateReminderModalProps {
  isOpen: boolean
  onClose: () => void
  leadId?: string
  taskId?: string
}

interface ReminderFormData {
  title: string
  description: string
  reminderTime: string
  type: 'Task' | 'Meeting' | 'Follow-up' | 'Deadline' | 'Custom'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  leadId?: string
  taskId?: string
  recurring: 'None' | 'Daily' | 'Weekly' | 'Monthly'
  notificationMethods: ('In-app' | 'Email' | 'WhatsApp')[]
}

const CreateReminderModal: React.FC<CreateReminderModalProps> = ({ 
  isOpen, 
  onClose, 
  leadId, 
  taskId 
}) => {
  const { createReminder } = useReminders()
  const { leads } = useLeads()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedNotificationMethods, setSelectedNotificationMethods] = useState<('In-app' | 'Email' | 'WhatsApp')[]>(['In-app'])

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ReminderFormData>({
    defaultValues: {
      leadId: leadId || '',
      taskId: taskId || '',
      type: 'Custom',
      priority: 'Medium',
      recurring: 'None',
      reminderTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16) // 1 hour from now
    }
  })

  const watchedType = watch('type')

  const typeIcons = {
    'Task': <CheckSquare className="w-5 h-5 text-blue-500" />,
    'Meeting': <Users className="w-5 h-5 text-purple-500" />,
    'Follow-up': <Target className="w-5 h-5 text-green-500" />,
    'Deadline': <AlertTriangle className="w-5 h-5 text-red-500" />,
    'Custom': <Bell className="w-5 h-5 text-gray-500" />
  }

  const priorityColors = {
    'Low': 'border-green-400 bg-green-500/20',
    'Medium': 'border-yellow-400 bg-yellow-500/20',
    'High': 'border-orange-400 bg-orange-500/20',
    'Urgent': 'border-red-400 bg-red-500/20'
  }

  const toggleNotificationMethod = (method: 'In-app' | 'Email' | 'WhatsApp') => {
    setSelectedNotificationMethods(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
    )
  }

  const onSubmit = async (data: ReminderFormData) => {
    if (selectedNotificationMethods.length === 0) {
      toast.error('Please select at least one notification method')
      return
    }

    setLoading(true)
    try {
      await createReminder({
        ...data,
        reminderTime: new Date(data.reminderTime).toISOString(),
        notificationMethods: selectedNotificationMethods,
        leadId: data.leadId || undefined,
        taskId: data.taskId || undefined
      })
      
      toast.success('Reminder created successfully!')
      reset()
      setSelectedNotificationMethods(['In-app'])
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create reminder')
    } finally {
      setLoading(false)
    }
  }

  const loadQuickTemplate = (type: 'call' | 'meeting' | 'proposal' | 'followup') => {
    const templates = {
      call: {
        title: 'Make follow-up call',
        description: 'Call client to discuss requirements and next steps',
        type: 'Follow-up' as const,
        priority: 'High' as const
      },
      meeting: {
        title: 'Attend scheduled meeting',
        description: 'Join client meeting to present proposal',
        type: 'Meeting' as const,
        priority: 'High' as const
      },
      proposal: {
        title: 'Send proposal deadline',
        description: 'Deadline to send recruitment proposal to client',
        type: 'Deadline' as const,
        priority: 'Urgent' as const
      },
      followup: {
        title: 'Follow up on proposal',
        description: 'Check status of sent proposal and get feedback',
        type: 'Follow-up' as const,
        priority: 'Medium' as const
      }
    }

    const template = templates[type]
    reset({
      ...template,
      leadId: leadId || '',
      taskId: taskId || '',
      recurring: 'None',
      reminderTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
    })
    
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} template loaded!`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
        {/* Header */}
        <div className="gradient-primary p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Create Reminder</h2>
                <p className="text-blue-100 mt-1">Set up notifications for important tasks</p>
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
          {/* Quick Templates */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Quick Templates</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => loadQuickTemplate('call')}
                className="p-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl text-center transition-all duration-300 hover:scale-105"
              >
                <Phone className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-green-300 text-sm font-medium">Call</p>
              </button>
              <button
                type="button"
                onClick={() => loadQuickTemplate('meeting')}
                className="p-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-center transition-all duration-300 hover:scale-105"
              >
                <Users className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <p className="text-purple-300 text-sm font-medium">Meeting</p>
              </button>
              <button
                type="button"
                onClick={() => loadQuickTemplate('proposal')}
                className="p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-center transition-all duration-300 hover:scale-105"
              >
                <FileText className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-red-300 text-sm font-medium">Proposal</p>
              </button>
              <button
                type="button"
                onClick={() => loadQuickTemplate('followup')}
                className="p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-center transition-all duration-300 hover:scale-105"
              >
                <Target className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-blue-300 text-sm font-medium">Follow-up</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Reminder Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                placeholder="Enter reminder title"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-300">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300 resize-none"
                placeholder="Enter reminder description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Reminder Date & Time *
                </label>
                <input
                  {...register('reminderTime', { required: 'Reminder time is required' })}
                  type="datetime-local"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                />
                {errors.reminderTime && (
                  <p className="mt-2 text-sm text-red-300">{errors.reminderTime.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Recurring
                </label>
                <select
                  {...register('recurring')}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                >
                  <option value="None">No Repeat</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Reminder Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(typeIcons).map(([type, icon]) => (
                  <label key={type} className="cursor-pointer">
                    <input
                      {...register('type')}
                      type="radio"
                      value={type}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-xl border-2 transition-all duration-300 text-center ${
                      watchedType === type
                        ? 'border-blue-400 bg-blue-500/20'
                        : 'border-white/20 bg-white/10 hover:border-white/40'
                    }`}>
                      <div className="flex justify-center mb-2">{icon}</div>
                      <p className="text-white text-sm font-medium">{type}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Priority Level
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(priorityColors).map(([priority, colorClass]) => (
                  <label key={priority} className="cursor-pointer">
                    <input
                      {...register('priority')}
                      type="radio"
                      value={priority}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-xl border-2 transition-all duration-300 text-center ${colorClass}`}>
                      <p className="text-white font-medium">{priority}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Related Lead (Optional)
              </label>
              <select
                {...register('leadId')}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              >
                <option value="">No related lead</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>
                    {lead.company_name} - {lead.contact_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Notification Methods *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {['In-app', 'Email', 'WhatsApp'].map((method) => (
                  <label key={method} className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedNotificationMethods.includes(method as any)}
                      onChange={() => toggleNotificationMethod(method as any)}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-xl border-2 transition-all duration-300 text-center ${
                      selectedNotificationMethods.includes(method as any)
                        ? 'border-blue-400 bg-blue-500/20'
                        : 'border-white/20 bg-white/10 hover:border-white/40'
                    }`}>
                      <div className="flex justify-center mb-2">
                        {method === 'In-app' && <Bell className="w-5 h-5 text-blue-400" />}
                        {method === 'Email' && <FileText className="w-5 h-5 text-purple-400" />}
                        {method === 'WhatsApp' && <Phone className="w-5 h-5 text-green-400" />}
                      </div>
                      <p className="text-white text-sm font-medium">{method}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h4 className="text-blue-400 font-semibold mb-2">Reminder Settings:</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <p><strong>In-app:</strong> Browser notification and dashboard alert</p>
                <p><strong>Email:</strong> Email notification to your registered email</p>
                <p><strong>WhatsApp:</strong> WhatsApp message (if phone number provided)</p>
                <p><strong>Recurring:</strong> Reminder will repeat based on selected frequency</p>
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
                disabled={loading || selectedNotificationMethods.length === 0}
                className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Creating...' : 'Create Reminder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateReminderModal