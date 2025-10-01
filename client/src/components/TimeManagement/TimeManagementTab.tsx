import React, { useState } from 'react'
import { Calendar, Clock, Bell, Users } from 'lucide-react'
import DailyPlanner from './DailyPlanner'
import CalendarSync from './CalendarSync'
import RemindersPanel from './RemindersPanel'
import AttendanceLog from './AttendanceLog'

const TimeManagementTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'planner' | 'calendar' | 'reminders' | 'attendance'>('planner')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Time & Task Management</h1>
        <p className="text-gray-300 mt-2 text-lg">
          Plan, schedule, and track your daily work activities
        </p>
      </div>

      {/* Sub-navigation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 bg-white/10 rounded-xl p-1">
        <button
          onClick={() => setActiveSubTab('planner')}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeSubTab === 'planner'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="font-medium">Daily Planner</span>
        </button>
        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeSubTab === 'calendar'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="font-medium">Calendar Sync</span>
        </button>
        <button
          onClick={() => setActiveSubTab('reminders')}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeSubTab === 'reminders'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span className="font-medium">Reminders</span>
        </button>
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
            activeSubTab === 'attendance'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">Attendance</span>
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'planner' && <DailyPlanner />}
      {activeSubTab === 'calendar' && <CalendarSync />}
      {activeSubTab === 'reminders' && <RemindersPanel />}
      {activeSubTab === 'attendance' && <AttendanceLog />}
    </div>
  )
}

export default TimeManagementTab