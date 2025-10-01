import React, { useState } from 'react'
import { Plus, Bell, Clock, Search, Filter, Edit3, Trash2, CheckCircle, XCircle, SunSnow as Snooze, AlertTriangle, Target, Calendar, MessageSquare, Phone, FileText, CheckSquare } from 'lucide-react'
import { useReminders } from '../../hooks/useReminders'
import CreateReminderModal from './CreateReminderModal'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import toast from 'react-hot-toast'

const RemindersPanel: React.FC = () => {
  const { 
    reminders, 
    loading, 
    updateReminder, 
    snoozeReminder, 
    dismissReminder, 
    completeReminder,
    getActiveReminders,
    getUpcomingReminders
  } = useReminders()
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  const statusOptions = ['All', 'Active', 'Snoozed', 'Completed', 'Dismissed']
  const typeOptions = ['All', 'Task', 'Meeting', 'Follow-up', 'Deadline', 'Custom']
  const priorityOptions = ['All', 'Urgent', 'High', 'Medium', 'Low']

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (reminder.description && reminder.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'All' || reminder.status === statusFilter
    const matchesType = typeFilter === 'All' || reminder.type === typeFilter
    const matchesPriority = priorityFilter === 'All' || reminder.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority
  })

  const activeReminders = getActiveReminders()
  const upcomingReminders = getUpcomingReminders()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Task': return <CheckSquare className="w-4 h-4 text-blue-500" />
      case 'Meeting': return <Calendar className="w-4 h-4 text-purple-500" />
      case 'Follow-up': return <Target className="w-4 h-4 text-green-500" />
      case 'Deadline': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-800'
      case 'Snoozed': return 'bg-yellow-100 text-yellow-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Dismissed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatReminderTime = (timeString: string) => {
    const time = new Date(timeString)
    const now = new Date()
    
    if (isPast(time)) return 'Overdue'
    if (isToday(time)) return `Today at ${format(time, 'HH:mm')}`
    if (isTomorrow(time)) return `Tomorrow at ${format(time, 'HH:mm')}`
    return format(time, 'MMM dd, yyyy HH:mm')
  }

  const handleSnooze = async (reminderId: string) => {
    const snoozeOptions = [
      { label: '15 minutes', minutes: 15 },
      { label: '30 minutes', minutes: 30 },
      { label: '1 hour', minutes: 60 },
      { label: '2 hours', minutes: 120 },
      { label: '1 day', minutes: 24 * 60 }
    ]

    const choice = prompt(`Snooze for how long?\n${snoozeOptions.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n')}`)
    const selectedOption = snoozeOptions[parseInt(choice || '0') - 1]
    
    if (selectedOption) {
      try {
        await snoozeReminder(reminderId, selectedOption.minutes)
        toast.success(`Reminder snoozed for ${selectedOption.label}`)
      } catch (error: any) {
        toast.error('Failed to snooze reminder')
      }
    }
  }

  const handleComplete = async (reminderId: string) => {
    try {
      await completeReminder(reminderId)
      toast.success('Reminder marked as completed')
    } catch (error: any) {
      toast.error('Failed to complete reminder')
    }
  }

  const handleDismiss = async (reminderId: string) => {
    try {
      await dismissReminder(reminderId)
      toast.success('Reminder dismissed')
    } catch (error: any) {
      toast.error('Failed to dismiss reminder')
    }
  }

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
          <h2 className="text-2xl font-bold text-white tracking-tight">Reminders & Notifications</h2>
          <p className="text-gray-300 mt-1">Manage your reminders and stay on top of important tasks</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="gradient-primary text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Create Reminder</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Active Reminders</p>
              <p className="text-3xl font-bold text-white mt-2">{activeReminders.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-red-500">
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Due Today</p>
              <p className="text-3xl font-bold text-white mt-2">
                {reminders.filter(r => r.status === 'Active' && isToday(new Date(r.reminderTime))).length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-orange-500">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Upcoming</p>
              <p className="text-3xl font-bold text-white mt-2">{upcomingReminders.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-500">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Completed</p>
              <p className="text-3xl font-bold text-white mt-2">
                {reminders.filter(r => r.status === 'Completed').length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-green-500">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reminders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-300" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
          >
            {typeOptions.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
          >
            {priorityOptions.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reminders List */}
      <div className="glass rounded-2xl border border-white/30 overflow-hidden shadow-xl">
        {filteredReminders.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-3">No reminders found</h3>
            <p className="text-gray-300 text-lg">
              {searchTerm || statusFilter !== 'All' || typeFilter !== 'All' || priorityFilter !== 'All'
                ? 'Try adjusting your search or filters' 
                : 'Create your first reminder to stay organized'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredReminders.map((reminder) => {
              const isOverdue = isPast(new Date(reminder.reminderTime)) && reminder.status === 'Active'
              const isUrgent = reminder.priority === 'Urgent'
              
              return (
                <div 
                  key={reminder.id} 
                  className={`p-6 hover:bg-white/10 transition-all duration-300 ${
                    isOverdue ? 'bg-red-500/10' : isUrgent ? 'bg-orange-500/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex items-center space-x-2 mt-1">
                        {getTypeIcon(reminder.type)}
                        {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`text-lg font-semibold ${
                            reminder.status === 'Completed' ? 'text-gray-400 line-through' : 'text-white'
                          }`}>
                            {reminder.title}
                          </h3>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(reminder.priority)}`}>
                            {reminder.priority}
                          </span>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reminder.status)}`}>
                            {reminder.status}
                          </span>
                        </div>
                        
                        {reminder.description && (
                          <p className={`mb-3 ${
                            reminder.status === 'Completed' ? 'text-gray-500' : 'text-gray-300'
                          }`}>
                            {reminder.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className={`font-medium ${
                              isOverdue ? 'text-red-400' : 'text-gray-300'
                            }`}>
                              {formatReminderTime(reminder.reminderTime)}
                            </span>
                          </div>
                          
                          {reminder.leadName && (
                            <div className="flex items-center space-x-2">
                              <Target className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300">{reminder.leadName}</span>
                            </div>
                          )}
                          
                          {reminder.recurring !== 'None' && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-purple-400">Repeats {reminder.recurring}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-1">
                            {reminder.notificationMethods.map((method, index) => (
                              <span key={index} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                {method}
                              </span>
                            ))}
                          </div>
                        </div>

                        {reminder.status === 'Snoozed' && reminder.snoozeUntil && (
                          <div className="mt-2 text-sm text-yellow-400">
                            Snoozed until: {format(new Date(reminder.snoozeUntil), 'MMM dd, HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {reminder.status === 'Active' && (
                        <>
                          <button
                            onClick={() => handleSnooze(reminder.id)}
                            className="p-2 text-gray-400 hover:text-yellow-400 transition-colors hover:bg-white/20 rounded-lg"
                            title="Snooze"
                          >
                            <Snooze className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleComplete(reminder.id)}
                            className="p-2 text-gray-400 hover:text-green-400 transition-colors hover:bg-white/20 rounded-lg"
                            title="Mark Complete"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => {
                          // Edit reminder functionality
                          toast.info('Edit reminder functionality coming soon!')
                        }}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                        title="Edit Reminder"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDismiss(reminder.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/20 rounded-lg"
                        title="Dismiss"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Reminder Modal */}
      {isCreateModalOpen && (
        <CreateReminderModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  )
}

export default RemindersPanel