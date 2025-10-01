import React, { useState } from 'react'
import { FileText, AlertTriangle, CheckCircle, XCircle, User, Building2, Calendar, Send, Eye, SunSnow as Snooze, Target, TrendingUp, Clock, Mail, MessageCircle } from 'lucide-react'
import { useAutomation } from '../../hooks/useAutomation'
import { useAuth } from '../../contexts/AuthContext'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const ProposalNudges: React.FC = () => {
  const { alerts, loading, dismissAlert, snoozeAlert, getAlertsByType } = useAutomation()
  const { profile } = useAuth()
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [userFilter, setUserFilter] = useState('All')

  const proposalAlerts = getAlertsByType('proposal')
  const priorityOptions = ['All', 'Urgent', 'High', 'Medium', 'Low']
  
  // Mock users for filtering
  const users = [
    { id: 'All', name: 'All Users' },
    { id: 'demo-bd-executive', name: 'Executive User' },
    { id: 'demo-bd-1', name: 'Rahul Sharma' },
    { id: 'demo-bd-2', name: 'Priya Patel' },
    { id: 'demo-bd-3', name: 'Arjun Kumar' },
  ]

  const filteredAlerts = proposalAlerts.filter(alert => {
    const matchesPriority = priorityFilter === 'All' || alert.priority === priorityFilter
    const matchesUser = userFilter === 'All' || alert.assignedTo === userFilter
    
    // BD Executives only see their own alerts
    if (profile?.role === 'BD Executive') {
      return matchesUser && alert.assignedTo === profile.id && matchesPriority
    }
    
    return matchesPriority && matchesUser
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Urgent': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'High': return <TrendingUp className="w-4 h-4 text-orange-600" />
      case 'Medium': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'Low': return <CheckCircle className="w-4 h-4 text-green-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const handleDismissAlert = async (alertId: string) => {
    try {
      await dismissAlert(alertId)
      toast.success('Alert dismissed')
    } catch (error: any) {
      toast.error('Failed to dismiss alert')
    }
  }

  const handleSnoozeAlert = async (alertId: string) => {
    const snoozeOptions = [
      { label: '1 hour', hours: 1 },
      { label: '4 hours', hours: 4 },
      { label: '1 day', hours: 24 },
      { label: '3 days', hours: 72 }
    ]

    const choice = prompt(`Snooze for how long?\n${snoozeOptions.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n')}`)
    const selectedOption = snoozeOptions[parseInt(choice || '0') - 1]
    
    if (selectedOption) {
      try {
        await snoozeAlert(alertId, selectedOption.hours)
        toast.success(`Alert snoozed for ${selectedOption.label}`)
      } catch (error: any) {
        toast.error('Failed to snooze alert')
      }
    }
  }

  const handleQuickAction = (alert: any, action: 'followup' | 'email' | 'call') => {
    const actionMessages = {
      followup: `Following up on proposal for ${alert.companyName}...`,
      email: `Opening email to follow up on proposal...`,
      call: `Calling ${alert.companyName} about proposal...`
    }
    
    toast.success(actionMessages[action])
    handleDismissAlert(alert.id)
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
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Pending Follow-ups</p>
              <p className="text-3xl font-bold text-white mt-2">{proposalAlerts.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-500">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Urgent</p>
              <p className="text-3xl font-bold text-white mt-2">
                {proposalAlerts.filter(a => a.priority === 'Urgent').length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-red-500">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">High Priority</p>
              <p className="text-3xl font-bold text-white mt-2">
                {proposalAlerts.filter(a => a.priority === 'High').length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-orange-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Avg Days Pending</p>
              <p className="text-3xl font-bold text-white mt-2">
                {proposalAlerts.length > 0 
                  ? Math.round(proposalAlerts.reduce((sum, a) => sum + a.daysSince, 0) / proposalAlerts.length)
                  : 0}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-500">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-white font-medium">Priority:</label>
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
          
          {(profile?.role === 'Admin' || profile?.role === 'Manager') && (
            <div className="flex items-center space-x-2">
              <label className="text-white font-medium">User:</label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="glass rounded-2xl border border-white/30 overflow-hidden shadow-xl">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-3">All proposals up to date!</h3>
            <p className="text-gray-300 text-lg">
              {proposalAlerts.length === 0 
                ? 'No pending proposal follow-ups. All proposals are being tracked properly!'
                : 'No alerts match your current filters. Try adjusting the filters above.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-6 hover:bg-white/10 transition-all duration-300 ${
                  alert.priority === 'Urgent' ? 'bg-red-500/10' : 
                  alert.priority === 'High' ? 'bg-orange-500/10' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex items-center space-x-2 mt-1">
                      <FileText className="w-5 h-5 text-purple-500" />
                      {alert.priority === 'Urgent' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-white">Proposal Follow-up Required</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(alert.priority)}`}>
                          {getPriorityIcon(alert.priority)}
                          <span className="ml-1">{alert.priority} Priority</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center space-x-3">
                          <Building2 className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-white font-semibold">{alert.companyName}</p>
                            <p className="text-gray-300 text-sm">{alert.leadName}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-white font-semibold">{alert.assignedToName}</p>
                            <p className="text-gray-300 text-sm">Proposal Owner</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white/10 rounded-lg p-3 mb-3 border border-white/20">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Send className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-400 font-medium">
                              Proposal sent {alert.daysSince} days ago
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">
                              Follow-up threshold: {alert.threshold} days
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">
                              Sent: {formatDistanceToNow(new Date(alert.lastActivity), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-3">
                        <p className="text-yellow-400 text-sm font-medium">
                          ⚠️ Proposal status hasn't been updated. Client may need a follow-up call or email.
                        </p>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuickAction(alert, 'call')}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Follow-up Call</span>
                        </button>
                        <button
                          onClick={() => handleQuickAction(alert, 'email')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium"
                        >
                          <Mail className="w-4 h-4" />
                          <span>Follow-up Email</span>
                        </button>
                        <button
                          onClick={() => {
                            toast.info('Opening proposal details...')
                            handleDismissAlert(alert.id)
                          }}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View Proposal</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        // View proposal details
                        toast.info('Opening proposal details...')
                      }}
                      className="p-2 text-gray-400 hover:text-purple-400 transition-colors hover:bg-white/20 rounded-lg"
                      title="View Proposal"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleSnoozeAlert(alert.id)}
                      className="p-2 text-gray-400 hover:text-yellow-400 transition-colors hover:bg-white/20 rounded-lg"
                      title="Snooze Alert"
                    >
                      <Snooze className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/20 rounded-lg"
                      title="Dismiss Alert"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        <h3 className="text-lg font-semibold text-white mb-4">Proposal Follow-up Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">
              {proposalAlerts.filter(a => a.daysSince >= a.threshold * 2).length}
            </div>
            <div className="text-red-300 text-sm">Severely Overdue</div>
          </div>
          
          <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">
              {proposalAlerts.filter(a => a.daysSince >= a.threshold * 1.5 && a.daysSince < a.threshold * 2).length}
            </div>
            <div className="text-orange-300 text-sm">Critical Follow-up</div>
          </div>
          
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {proposalAlerts.filter(a => a.daysSince >= a.threshold && a.daysSince < a.threshold * 1.5).length}
            </div>
            <div className="text-yellow-300 text-sm">Due for Follow-up</div>
          </div>
          
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {proposalAlerts.length > 0 
                ? Math.round(proposalAlerts.reduce((sum, a) => sum + a.daysSince, 0) / proposalAlerts.length)
                : 0}
            </div>
            <div className="text-blue-300 text-sm">Avg Days Pending</div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        <h3 className="text-lg font-semibold text-white mb-4">Proposal Follow-up Best Practices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-white font-medium">Timing Guidelines:</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• First follow-up: 3-5 days after sending</li>
              <li>• Second follow-up: 1 week after first</li>
              <li>• Final follow-up: 2 weeks after second</li>
              <li>• Mark as "Lost" if no response after 3 follow-ups</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-medium">Follow-up Methods:</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Phone call (most effective)</li>
              <li>• Email with additional value</li>
              <li>• WhatsApp for urgent matters</li>
              <li>• LinkedIn message as last resort</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProposalNudges