import React, { useState } from 'react'
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  Edit3, 
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  ExternalLink
} from 'lucide-react'
import { useScheduling } from '../../hooks/useScheduling'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import toast from 'react-hot-toast'

interface EventsListProps {
  leadId?: string
  compact?: boolean
}

const EventsList: React.FC<EventsListProps> = ({ leadId, compact = false }) => {
  const { events, loading, updateEvent, deleteEvent } = useScheduling(leadId)
  const [editingEvent, setEditingEvent] = useState<any>(null)

  const handleStatusUpdate = async (eventId: string, status: 'Completed' | 'Cancelled') => {
    try {
      await updateEvent(eventId, { status })
      toast.success(`Event marked as ${status.toLowerCase()}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update event')
    }
  }

  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteEvent(eventId)
        toast.success('Event deleted successfully')
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete event')
      }
    }
  }

  const getEventPriority = (startDateTime: string, status: string) => {
    if (status === 'Completed') return 'completed'
    if (status === 'Cancelled') return 'cancelled'
    
    const eventDate = new Date(startDateTime)
    if (isPast(eventDate)) return 'overdue'
    if (isToday(eventDate)) return 'today'
    if (isTomorrow(eventDate)) return 'tomorrow'
    return 'upcoming'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'border-l-red-500 bg-red-50'
      case 'today': return 'border-l-orange-500 bg-orange-50'
      case 'tomorrow': return 'border-l-yellow-500 bg-yellow-50'
      case 'completed': return 'border-l-green-500 bg-green-50'
      case 'cancelled': return 'border-l-gray-500 bg-gray-50'
      default: return 'border-l-blue-500 bg-blue-50'
    }
  }

  const formatEventDate = (startDateTime: string) => {
    const eventDate = new Date(startDateTime)
    if (isToday(eventDate)) return `Today at ${format(eventDate, 'HH:mm')}`
    if (isTomorrow(eventDate)) return `Tomorrow at ${format(eventDate, 'HH:mm')}`
    return format(eventDate, 'MMM dd, yyyy HH:mm')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-blue-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-2">No scheduled events</p>
        <p className="text-sm text-gray-500">Schedule your first meeting or task</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const priority = getEventPriority(event.startDateTime, event.status)
        const duration = Math.round((new Date(event.endDateTime).getTime() - new Date(event.startDateTime).getTime()) / (1000 * 60))
        
        return (
          <div 
            key={event.id} 
            className={`p-4 rounded-xl border-l-4 ${getPriorityColor(priority)} hover:shadow-md transition-all duration-300 ${
              compact ? 'bg-white/5 border border-white/10' : 'bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className={`font-semibold ${compact ? 'text-white' : 'text-gray-900'} ${
                    event.status === 'Cancelled' ? 'line-through opacity-60' : ''
                  }`}>
                    {event.title}
                  </h4>
                  {getStatusIcon(event.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    event.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {event.status}
                  </span>
                </div>
                
                {event.description && (
                  <p className={`text-sm mb-3 ${compact ? 'text-gray-300' : 'text-gray-600'}`}>
                    {event.description}
                  </p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className={`font-medium ${compact ? 'text-gray-300' : 'text-gray-700'} ${
                      priority === 'overdue' ? 'text-red-600' :
                      priority === 'today' ? 'text-orange-600' :
                      priority === 'tomorrow' ? 'text-yellow-600' : ''
                    }`}>
                      {formatEventDate(event.startDateTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className={compact ? 'text-gray-300' : 'text-gray-700'}>
                      {duration} minutes
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className={compact ? 'text-gray-300' : 'text-gray-700'}>
                      {event.assignedUser?.name || 'Unassigned'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className={compact ? 'text-gray-300' : 'text-gray-700'}>
                      {event.timezone}
                    </span>
                  </div>
                </div>

                {event.meetingLink && (
                  <div className="mt-3">
                    <a
                      href={event.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Meeting</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {event.recurring !== 'None' && (
                  <div className="mt-2">
                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                      <Repeat className="w-3 h-3" />
                      <span>Repeats {event.recurring}</span>
                    </span>
                  </div>
                )}
              </div>
              
              {event.status === 'Pending' && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleStatusUpdate(event.id, 'Completed')}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors hover:bg-green-50 rounded-lg"
                    title="Mark as Completed"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(event.id, 'Cancelled')}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg"
                    title="Cancel Event"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingEvent(event)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded-lg"
                    title="Edit Event"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id, event.title)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default EventsList