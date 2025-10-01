import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface AttendanceRecord {
  id: string
  userId: string
  userName: string
  userRole: string
  date: string
  loginTime: string | null
  logoutTime: string | null
  totalHours: number
  status: 'Present' | 'Absent' | 'Half Day' | 'Late'
  breakTime?: number
  overtime?: number
  notes?: string
}

export interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  halfDays: number
  lateDays: number
  avgHours: number
  totalHours: number
  attendancePercentage: number
}

// Demo attendance data
const demoAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'att-1',
    userId: 'demo-bd-executive',
    userName: 'Executive User',
    userRole: 'BD Executive',
    date: new Date().toISOString().split('T')[0],
    loginTime: '09:15:00',
    logoutTime: null,
    totalHours: 0,
    status: 'Present'
  },
  {
    id: 'att-2',
    userId: 'demo-bd-executive',
    userName: 'Executive User',
    userRole: 'BD Executive',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    loginTime: '09:00:00',
    logoutTime: '18:30:00',
    totalHours: 9.5,
    status: 'Present',
    breakTime: 60,
    overtime: 30
  },
  {
    id: 'att-3',
    userId: 'demo-bd-executive',
    userName: 'Executive User',
    userRole: 'BD Executive',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    loginTime: '10:15:00',
    logoutTime: '18:00:00',
    totalHours: 7.75,
    status: 'Late',
    notes: 'Traffic delay'
  },
  {
    id: 'att-4',
    userId: 'demo-bd-1',
    userName: 'Rahul Sharma',
    userRole: 'BD Executive',
    date: new Date().toISOString().split('T')[0],
    loginTime: '08:45:00',
    logoutTime: null,
    totalHours: 0,
    status: 'Present'
  },
  {
    id: 'att-5',
    userId: 'demo-bd-2',
    userName: 'Priya Patel',
    userRole: 'BD Executive',
    date: new Date().toISOString().split('T')[0],
    loginTime: null,
    logoutTime: null,
    totalHours: 0,
    status: 'Absent'
  }
]

export const useAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()

  const fetchAttendance = async (userId?: string, dateRange?: { start: string; end: string }) => {
    if (!user || !profile) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - return demo data
      setTimeout(() => {
        let filteredRecords = demoAttendanceRecords
        
        // Filter by user if specified
        if (userId) {
          filteredRecords = demoAttendanceRecords.filter(record => record.userId === userId)
        } else if (profile.role === 'BD Executive') {
          // BD Executives only see their own attendance
          filteredRecords = demoAttendanceRecords.filter(record => record.userId === user.id)
        }
        
        // Filter by date range if specified
        if (dateRange) {
          filteredRecords = filteredRecords.filter(record => 
            record.date >= dateRange.start && record.date <= dateRange.end
          )
        }
        
        setAttendanceRecords(filteredRecords)
        setLoading(false)
      }, 500)
      return
    }

    try {
      // In real implementation, this would fetch from attendance table
      setAttendanceRecords([])
    } catch (error) {
      console.error('Error fetching attendance:', error)
    }
    setLoading(false)
  }

  const markAttendance = async (type: 'login' | 'logout') => {
    if (!user || !profile) return

    const today = new Date().toISOString().split('T')[0]
    const currentTime = new Date().toTimeString().split(' ')[0]

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate marking attendance
      setAttendanceRecords(prev => {
        const existingRecord = prev.find(record => 
          record.userId === user.id && record.date === today
        )

        if (existingRecord) {
          // Update existing record
          return prev.map(record => 
            record.id === existingRecord.id
              ? {
                  ...record,
                  [type === 'login' ? 'loginTime' : 'logoutTime']: currentTime,
                  totalHours: type === 'logout' && record.loginTime 
                    ? calculateHours(record.loginTime, currentTime)
                    : record.totalHours,
                  status: determineStatus(
                    type === 'login' ? currentTime : record.loginTime,
                    type === 'logout' ? currentTime : record.logoutTime
                  )
                }
              : record
          )
        } else if (type === 'login') {
          // Create new record
          const newRecord: AttendanceRecord = {
            id: `att-${Date.now()}`,
            userId: user.id,
            userName: profile.name,
            userRole: profile.role,
            date: today,
            loginTime: currentTime,
            logoutTime: null,
            totalHours: 0,
            status: determineStatus(currentTime, null)
          }
          return [newRecord, ...prev]
        }
        
        return prev
      })
      return
    }

    try {
      // In real implementation, this would update attendance table
      await fetchAttendance()
    } catch (error) {
      console.error('Error marking attendance:', error)
      throw error
    }
  }

  const calculateHours = (loginTime: string, logoutTime: string): number => {
    const login = new Date(`2000-01-01T${loginTime}`)
    const logout = new Date(`2000-01-01T${logoutTime}`)
    return Math.round(((logout.getTime() - login.getTime()) / (1000 * 60 * 60)) * 100) / 100
  }

  const determineStatus = (loginTime: string | null, logoutTime: string | null): 'Present' | 'Absent' | 'Half Day' | 'Late' => {
    if (!loginTime) return 'Absent'
    
    const login = new Date(`2000-01-01T${loginTime}`)
    const standardStart = new Date('2000-01-01T09:00:00')
    const halfDayThreshold = new Date('2000-01-01T13:00:00')
    
    if (login > halfDayThreshold) return 'Half Day'
    if (login > standardStart) return 'Late'
    return 'Present'
  }

  const getAttendanceSummary = (records: AttendanceRecord[]): AttendanceSummary => {
    const totalDays = records.length
    const presentDays = records.filter(r => r.status === 'Present').length
    const absentDays = records.filter(r => r.status === 'Absent').length
    const halfDays = records.filter(r => r.status === 'Half Day').length
    const lateDays = records.filter(r => r.status === 'Late').length
    const totalHours = records.reduce((sum, r) => sum + r.totalHours, 0)
    const avgHours = totalDays > 0 ? totalHours / totalDays : 0
    const attendancePercentage = totalDays > 0 ? Math.round(((presentDays + lateDays + halfDays * 0.5) / totalDays) * 100) : 0

    return {
      totalDays,
      presentDays,
      absentDays,
      halfDays,
      lateDays,
      avgHours: Math.round(avgHours * 100) / 100,
      totalHours: Math.round(totalHours * 100) / 100,
      attendancePercentage
    }
  }

  const getTodayAttendance = (): AttendanceRecord | null => {
    const today = new Date().toISOString().split('T')[0]
    return attendanceRecords.find(record => 
      record.userId === user?.id && record.date === today
    ) || null
  }

  useEffect(() => {
    fetchAttendance()
  }, [user, profile])

  return {
    attendanceRecords,
    loading,
    markAttendance,
    fetchAttendance,
    getAttendanceSummary,
    getTodayAttendance,
    refetch: fetchAttendance
  }
}