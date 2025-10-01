import React, { useState } from 'react'
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, Video, Users, MapPin, ExternalLink, Settings, FolderSync as Sync, CheckCircle, AlertCircle } from 'lucide-react'
import { useScheduling } from '../../hooks/useScheduling'
import ScheduleModal from '../Scheduling/ScheduleModal'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns'
import toast from 'react-hot-toast'

const CalendarSync: React.FC = () => {
  const { events, loading } = useScheduling()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.startDateTime), date)
    )
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsScheduleModalOpen(true)
  }

  const handleGoogleCalendarSync = async () => {
    // Simulate Google Calendar OAuth flow
    toast.loading('Connecting to Google Calendar...', { duration: 2000 })
    
    setTimeout(() => {
      setIsGoogleConnected(true)
      toast.success('Google Calendar connected successfully!')
    }, 2000)
  }

  const handleSyncEvents = async () => {
    if (!isGoogleConnected) {
      toast.error('Please connect to Google Calendar first')
      return
    }

    toast.loading('Syncing events...', { duration: 1500 })
    
    setTimeout(() => {
      toast.success('Events synced successfully!')
    }, 1500)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getEventColor = (event: any) => {
    switch (event.status) {
      case 'Completed': return 'bg-green-500'
      case 'Cancelled': return 'bg-red-500'
      default: return 'bg-blue-500'
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Calendar Sync</h2>
          <p className="text-gray-300 mt-1">Manage your schedule and sync with Google Calendar</p>
        </div>
        <div className="flex items-center space-x-4">
          {!isGoogleConnected ? (
            <button
              onClick={handleGoogleCalendarSync}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors font-semibold"
            >
              <Calendar className="w-5 h-5" />
              <span>Connect Google Calendar</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm font-medium">Google Calendar Connected</span>
              </div>
              <button
                onClick={handleSyncEvents}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Sync className="w-4 h-4" />
                <span>Sync</span>
              </button>
            </div>
          )}
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="gradient-primary text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-white/10 rounded-xl p-1">
          {['month', 'week', 'day'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                viewMode === mode
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-bold text-white">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        {viewMode === 'month' && (
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-3 text-center text-gray-300 font-semibold text-sm">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {monthDays.map((day) => {
              const dayEvents = getEventsForDate(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isCurrentDay = isToday(day)
              
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-[100px] p-2 border border-white/10 rounded-lg cursor-pointer transition-all duration-300 hover:bg-white/10 ${
                    isCurrentDay ? 'bg-blue-500/20 border-blue-400' :
                    !isCurrentMonth ? 'opacity-50' : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentDay ? 'text-blue-400' :
                    isCurrentMonth ? 'text-white' : 'text-gray-500'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded text-white truncate ${getEventColor(event)}`}
                        title={event.title}
                      >
                        {format(new Date(event.startDateTime), 'HH:mm')} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-400">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {viewMode === 'week' && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Week View</h3>
            <p className="text-gray-300">Week view coming soon!</p>
          </div>
        )}

        {viewMode === 'day' && (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Day View</h3>
            <p className="text-gray-300">Day view coming soon!</p>
          </div>
        )}
      </div>

      {/* Today's Events */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        <h3 className="text-lg font-semibold text-white mb-4">Today's Schedule</h3>
        {getEventsForDate(new Date()).length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-300">No events scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {getEventsForDate(new Date()).map((event) => (
              <div key={event.id} className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${getEventColor(event)}`}></div>
                    <div>
                      <h4 className="font-semibold text-white">{event.title}</h4>
                      <p className="text-gray-300 text-sm">{event.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(new Date(event.startDateTime), 'HH:mm')} - 
                            {format(new Date(event.endDateTime), 'HH:mm')}
                          </span>
                        </div>
                        {event.meetingLink && (
                          <div className="flex items-center space-x-1">
                            <Video className="w-3 h-3" />
                            <span>Video call</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{event.timezone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {event.meetingLink && (
                      <a
                        href={event.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      event.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Google Calendar Integration Status */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        <h3 className="text-lg font-semibold text-white mb-4">Integration Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isGoogleConnected ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                {isGoogleConnected ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-white">Google Calendar</h4>
                <p className="text-gray-300 text-sm">
                  {isGoogleConnected ? 'Connected and syncing' : 'Not connected'}
                </p>
              </div>
            </div>
            
            {isGoogleConnected ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Last Sync:</span>
                  <span className="text-white">2 minutes ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Events Synced:</span>
                  <span className="text-white">{events.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className="text-green-400">Active</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                Connect your Google Calendar to sync events automatically
              </p>
            )}
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <h4 className="font-semibold text-white mb-3">Sync Settings</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                />
                <span className="text-white text-sm">Two-way sync</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                />
                <span className="text-white text-sm">Auto-create meeting links</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={false}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                />
                <span className="text-white text-sm">Sync personal events</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <ScheduleModal 
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false)
            setSelectedDate(null)
          }}
          lead={null}
        />
      )}
    </div>
  )
}

export default CalendarSync