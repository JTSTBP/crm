import React, { useState } from 'react'
import { Settings, Clock, FileText, Save, RotateCcw, AlertTriangle, CheckCircle, Bell, Mail, Smartphone, ToggleLeft as Toggle, TrendingUp, Target } from 'lucide-react'
import { useAutomation } from '../../hooks/useAutomation'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const AutomationSettings: React.FC = () => {
  const { configs, loading, updateConfig, logAutomationActivity } = useAutomation()
  const { profile } = useAuth()
  const [localConfigs, setLocalConfigs] = useState(configs)
  const [hasChanges, setHasChanges] = useState(false)

  // Only Admin and Manager can modify settings
  const canModifySettings = profile?.role === 'Admin' || profile?.role === 'Manager'

  const followUpConfig = localConfigs.find(config => config.type === 'followUp') || {
    id: 'followUp',
    type: 'followUp' as const,
    daysThreshold: 3,
    enabled: true,
    createdBy: '',
    createdAt: '',
    updatedAt: ''
  }

  const proposalConfig = localConfigs.find(config => config.type === 'proposal') || {
    id: 'proposal',
    type: 'proposal' as const,
    daysThreshold: 7,
    enabled: true,
    createdBy: '',
    createdAt: '',
    updatedAt: ''
  }

  const updateLocalConfig = (type: 'followUp' | 'proposal', field: string, value: any) => {
    if (!canModifySettings) {
      toast.error('You do not have permission to modify automation settings')
      return
    }

    setLocalConfigs(prev => prev.map(config => 
      config.type === type 
        ? { ...config, [field]: value }
        : config
    ))
    setHasChanges(true)
  }

  const handleSaveChanges = async () => {
    if (!canModifySettings) {
      toast.error('You do not have permission to save automation settings')
      return
    }

    try {
      for (const config of localConfigs) {
        await updateConfig(config.id, {
          daysThreshold: config.daysThreshold,
          enabled: config.enabled
        })
      }
      
      await logAutomationActivity(
        'Automation Settings Updated',
        `Follow-up: ${followUpConfig.daysThreshold} days, Proposal: ${proposalConfig.daysThreshold} days`
      )
      
      setHasChanges(false)
      toast.success('Automation settings saved successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings')
    }
  }

  const handleResetToDefaults = () => {
    if (!canModifySettings) {
      toast.error('You do not have permission to reset automation settings')
      return
    }

    setLocalConfigs(prev => prev.map(config => ({
      ...config,
      daysThreshold: config.type === 'followUp' ? 3 : 7,
      enabled: true
    })))
    setHasChanges(true)
    toast.info('Settings reset to defaults. Click Save to apply changes.')
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Automation Settings</h2>
          <p className="text-gray-300 mt-1">Configure automated reminders and follow-up thresholds</p>
        </div>
        {canModifySettings && hasChanges && (
          <div className="flex space-x-3">
            <button
              onClick={handleResetToDefaults}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSaveChanges}
              className="gradient-primary text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
            >
              <Save className="w-5 h-5" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      {/* Permission Notice for BD Executive */}
      {!canModifySettings && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-blue-400" />
            <h4 className="text-blue-400 font-semibold">View Only Access</h4>
          </div>
          <p className="text-gray-300 text-sm mt-2">
            You can view automation settings but cannot modify them. Contact your Admin or Manager to request changes.
          </p>
        </div>
      )}

      {/* Follow-up Reminders Settings */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Follow-up Reminders</h3>
            <p className="text-gray-300">Automatically remind team members to follow up on inactive leads</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Days Threshold
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={followUpConfig.daysThreshold}
                  onChange={(e) => updateLocalConfig('followUp', 'daysThreshold', Number(e.target.value))}
                  disabled={!canModifySettings}
                  className="w-24 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300 disabled:opacity-50"
                />
                <span className="text-gray-300">days without activity</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Send reminder if no activity (calls, emails, remarks) for this many days
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={followUpConfig.enabled}
                  onChange={(e) => updateLocalConfig('followUp', 'enabled', e.target.checked)}
                  disabled={!canModifySettings}
                  className="w-5 h-5 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-white font-medium">Enable Follow-up Reminders</span>
              </label>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <h4 className="text-white font-semibold mb-3">How it works:</h4>
            <ul className="text-gray-300 text-sm space-y-2">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>System monitors lead activity (calls, emails, remarks)</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Alerts generated when threshold is exceeded</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Notifications sent to assigned BD Executive</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Excludes leads in final stages (Won, Lost, Onboarded)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Proposal Nudges Settings */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Proposal Follow-up Nudges</h3>
            <p className="text-gray-300">Automatically remind team to follow up on sent proposals</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Days Threshold
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={proposalConfig.daysThreshold}
                  onChange={(e) => updateLocalConfig('proposal', 'daysThreshold', Number(e.target.value))}
                  disabled={!canModifySettings}
                  className="w-24 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 transition-all duration-300 disabled:opacity-50"
                />
                <span className="text-gray-300">days without status update</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Send nudge if proposal status hasn't changed (Viewed/Accepted/Rejected)
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={proposalConfig.enabled}
                  onChange={(e) => updateLocalConfig('proposal', 'enabled', e.target.checked)}
                  disabled={!canModifySettings}
                  className="w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 disabled:opacity-50"
                />
                <span className="text-white font-medium">Enable Proposal Nudges</span>
              </label>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <h4 className="text-white font-semibold mb-3">How it works:</h4>
            <ul className="text-gray-300 text-sm space-y-2">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Tracks proposals with "Sent" status</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Monitors for status updates (Viewed/Accepted/Rejected)</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Generates alerts when threshold is exceeded</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Notifies proposal owner to follow up</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Notification Preferences</h3>
            <p className="text-gray-300">Configure how automation alerts are delivered</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3 mb-3">
              <Bell className="w-6 h-6 text-blue-400" />
              <h4 className="text-white font-semibold">In-App Notifications</h4>
            </div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={true}
                disabled={!canModifySettings}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-gray-300 text-sm">Show alerts in dashboard</span>
            </label>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3 mb-3">
              <Mail className="w-6 h-6 text-purple-400" />
              <h4 className="text-white font-semibold">Email Notifications</h4>
            </div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={false}
                disabled={!canModifySettings}
                className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 disabled:opacity-50"
              />
              <span className="text-gray-300 text-sm">Send email alerts</span>
            </label>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3 mb-3">
              <Smartphone className="w-6 h-6 text-green-400" />
              <h4 className="text-white font-semibold">WhatsApp Notifications</h4>
            </div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={false}
                disabled={!canModifySettings}
                className="w-4 h-4 text-green-600 bg-white/10 border-white/20 rounded focus:ring-green-500 disabled:opacity-50"
              />
              <span className="text-gray-300 text-sm">Send WhatsApp alerts</span>
            </label>
          </div>
        </div>
      </div>

      {/* Current Configuration Summary */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        <h3 className="text-lg font-semibold text-white mb-4">Current Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-blue-400 font-semibold">Follow-up Reminders</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                followUpConfig.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {followUpConfig.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Threshold:</span>
                <span className="text-white font-medium">{followUpConfig.daysThreshold} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Applies to:</span>
                <span className="text-white font-medium">Active leads only</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Notification:</span>
                <span className="text-white font-medium">In-app + Email</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-purple-400 font-semibold">Proposal Nudges</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                proposalConfig.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {proposalConfig.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Threshold:</span>
                <span className="text-white font-medium">{proposalConfig.daysThreshold} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Applies to:</span>
                <span className="text-white font-medium">Sent proposals only</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Notification:</span>
                <span className="text-white font-medium">In-app + Email</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Impact */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        <h3 className="text-lg font-semibold text-white mb-4">Automation Impact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-2">Improved Response Time</h4>
            <p className="text-gray-300 text-sm">
              Automated reminders ensure no lead goes unattended for too long
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-2">Higher Conversion</h4>
            <p className="text-gray-300 text-sm">
              Timely follow-ups increase the chances of converting leads to clients
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-2">Better Organization</h4>
            <p className="text-gray-300 text-sm">
              Never miss important follow-ups or proposal deadlines
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AutomationSettings