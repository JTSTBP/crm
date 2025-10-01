import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Video, 
  Repeat,
  MapPin,
  FileText,
  Plus
} from 'lucide-react'
import { useScheduling } from '../../hooks/useScheduling'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  lead: any
}

interface ScheduleFormData {
  title: string
  description: string
  startDateTime: string
  duration: number
  assignedTo: string
  recurring: 'None' | 'Daily' | 'Weekly' | 'Monthly'
  meetingPlatform: 'none' | 'google' | 'zoom'
  timezone: string
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, lead }) => {
  const { createEvent, generateMeetingLink, syncWithGoogleCalendar, loading } = useScheduling()
  const { user, profile } = useAuth()
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ScheduleFormData>({
    defaultValues: {
      title: '',
      description: '',
      startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      duration: 60,
      assignedTo: user?.id || '',
      recurring: 'None',
      meetingPlatform: 'none',
      timezone: 'Asia/Kolkata'
    }
  })

  const watchedPlatform = watch('meetingPlatform')

  // Mock BD Executives for assignment
  const bdExecutives = [
    { id: 'demo-bd-executive', name: 'Executive User', email: 'executive@jobsterritory.com' },
    { id: 'bd-1', name: 'Rahul Sharma', email: 'rahul@company.com' },
    { id: 'bd-2', name: 'Priya Patel', email: 'priya@company.com' },
    { id: 'bd-3', name: 'Arjun Kumar', email: 'arjun@company.com' },
    { id: 'bd-4', name: 'Sneha Singh', email: 'sneha@company.com' },
  ]

  const timezones = [
    'Asia/Kolkata',
    'America/New_York',
    'Europe/London',
    'Asia/Singapore',
    'Australia/Sydney'
  ]

  const onSubmit = async (data: ScheduleFormData) => {
    setIsCreatingMeeting(true)
    try {
      const startDateTime = new Date(data.startDateTime)
      const endDateTime = new Date(startDateTime.getTime() + data.duration * 60 * 1000)

      let meetingLink = null
      if (data.meetingPlatform !== 'none') {
        meetingLink = generateMeetingLink(data.meetingPlatform as 'google' | 'zoom')
      }

      const eventData = {
        leadId: lead.id,
        title: data.title,
        description: data.description || null,
        assignedTo: data.assignedTo,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        recurring: data.recurring,
        meetingLink,
        timezone: data.timezone
      }

      const createdEvent = await createEvent(eventData)

      // Simulate Google Calendar sync if Google Meet is selected
      if (data.meetingPlatform === 'google' && createdEvent) {
        await syncWithGoogleCalendar(createdEvent)
        toast.success('Event created and synced with Google Calendar!')
      } else {
        toast.success('Event scheduled successfully!')
      }

      reset()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule event')
    } finally {
      setIsCreatingMeeting(false)
    }
  }

  const handleQuickSchedule = (type: 'call' | 'demo' | 'followup') => {
    const quickTemplates = {
      call: {
        title: `Discovery Call - ${lead.company_name}`,
        description: 'Initial discussion about hiring requirements and company needs',
        duration: 30
      },
      demo: {
        title: `Product Demo - ${lead.company_name}`,
        description: 'Demonstrate our recruitment process and capabilities',
        duration: 45
      },
      followup: {
        title: `Follow-up Meeting - ${lead.company_name}`,
        description: 'Follow-up on previous discussions and next steps',
        duration: 30
      }
    }

    const template = quickTemplates[type]
    reset({
      title: template.title,
      description: template.description,
      duration: template.duration,
      startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      assignedTo: user?.id || '',
      recurring: 'None',
      meetingPlatform: 'google',
      timezone: 'Asia/Kolkata'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Schedule Meeting</h2>
                <p className="text-indigo-100 mt-1">
                  For: {lead.company_name} - {lead.contact_name}
                </p>
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
          {/* Quick Schedule Options */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Quick Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => handleQuickSchedule('call')}
                className="p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-center transition-all duration-300 hover:scale-105"
              >
                <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-white font-medium">Discovery Call</p>
                <p className="text-blue-300 text-sm">30 min</p>
              </button>
              <button
                onClick={() => handleQuickSchedule('demo')}
                className="p-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-center transition-all duration-300 hover:scale-105"
              >
                <Video className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-white font-medium">Product Demo</p>
                <p className="text-purple-300 text-sm">45 min</p>
              </button>
              <button
                onClick={() => handleQuickSchedule('followup')}
                className="p-4 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl text-center transition-all duration-300 hover:scale-105"
              >
                <Clock className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-white font-medium">Follow-up</p>
                <p className="text-green-300 text-sm">30 min</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                <FileText className="w-4 h-4 inline mr-2" />
                Meeting Title *
              </label>
              <input
                {...register('title', { required: 'Meeting title is required' })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white/20 transition-all duration-300"
                placeholder="Enter meeting title"
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
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white/20 transition-all duration-300 resize-none"
                placeholder="Meeting agenda and notes..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date & Time *
                </label>
                <input
                  {...register('startDateTime', { required: 'Date and time is required' })}
                  type="datetime-local"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white/20 transition-all duration-300"
                />
                {errors.startDateTime && (
                  <p className="mt-2 text-sm text-red-300">{errors.startDateTime.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Duration (minutes) *
                </label>
                <select
                  {...register('duration', { required: 'Duration is required' })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white/20 transition-all duration-300"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(profile?.role === 'Admin' || profile?.role === 'Manager') && (
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    <User className="w-4 h-4 inline mr-2" />
                    Assign To
                  </label>
                  <select
                    {...register('assignedTo')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white/20 transition-all duration-300"
                  >
                    {bdExecutives.map(exec => (
                      <option key={exec.id} value={exec.id}>{exec.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Timezone
                </label>
                <select
                  {...register('timezone')}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white/20 transition-all duration-300"
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <Video className="w-4 h-4 inline mr-2" />
                  Meeting Platform
                </label>
                <select
                  {...register('meetingPlatform')}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white/20 transition-all duration-300"
                >
                  <option value="none">No Video Call</option>
                  <option value="google">Google Meet</option>
                  <option value="zoom">Zoom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <Repeat className="w-4 h-4 inline mr-2" />
                  Recurring
                </label>
                <select
                  {...register('recurring')}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white/20 transition-all duration-300"
                >
                  <option value="None">No Repeat</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>

            {watchedPlatform !== 'none' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Video className="w-5 h-5 text-blue-400" />
                  <h4 className="text-blue-400 font-semibold">Meeting Link</h4>
                </div>
                <p className="text-sm text-gray-300">
                  A {watchedPlatform === 'google' ? 'Google Meet' : 'Zoom'} link will be automatically generated and included in the calendar invite.
                </p>
              </div>
            )}

            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
              <h4 className="text-indigo-400 font-semibold mb-2">Meeting Details Preview</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <p><strong>Lead:</strong> {lead.company_name} - {lead.contact_name}</p>
                <p><strong>Contact:</strong> {lead.contact_email} | {lead.contact_phone}</p>
                <p><strong>Industry:</strong> {lead.industry_name || 'Not specified'}</p>
                <p><strong>Current Stage:</strong> {lead.stage}</p>
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
                disabled={loading || isCreatingMeeting}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                {isCreatingMeeting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Schedule Meeting</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ScheduleModal