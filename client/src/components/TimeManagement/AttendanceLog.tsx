import React, { useEffect, useState } from "react";
import {
  Clock,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Download,
  Filter,
  User,
  LogIn,
  LogOut,
  Coffee,
} from "lucide-react";
import { useAttendance } from "../../hooks/useAttendance";
import { useAuth } from "../../contexts/AuthContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
} from "date-fns";
import toast from "react-hot-toast";
import { useUsers } from "../../hooks/useUsers";

const AttendanceLog: React.FC = () => {
  const { loading } = useAttendance();

  const {
    clearAllAttendance,
    profile,
    attendanceRecords,
    markAttendance,
    getAttendanceSummary,
    getTodayAttendance,
  } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [userFilter, setUserFilter] = useState("All");
  const { users } = useUsers();

  const todayAttendance = getTodayAttendance();
  const isLoggedIn = todayAttendance?.loginTime && !todayAttendance?.logoutTime;
  const isLoggedOut = todayAttendance?.loginTime && todayAttendance?.logoutTime;
  const [overallSummary, setOverallSummary] = useState(null);

  const isSameMonth = (dateStr: string, month: Date) => {
    const date = new Date(dateStr);
    return (
      date.getMonth() === month.getMonth() &&
      date.getFullYear() === month.getFullYear()
    );
  };

  const filteredRecords = attendanceRecords
    .filter(
      (record) =>
        (userFilter === "All" || record.userId === userFilter) &&
        isSameMonth(record.date, selectedMonth)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  console.log(attendanceRecords, "attendanceRecords");
  const formatHours = (hours: number): string => {
    if (!hours || hours <= 0) return "0h 0m";
    const totalMinutes = Math.floor(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };
  console.log(attendanceRecords, "attendanceRecords", filteredRecords);
  const summary = getAttendanceSummary(filteredRecords);

  const handleMarkAttendance = async (type: "login" | "logout") => {
    try {
      await markAttendance(type);
      toast.success(
        `${type === "login" ? "Logged in" : "Logged out"} successfully!`
      );
    } catch (error: any) {
      toast.error(error.message || `Failed to mark ${type}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Present":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "Absent":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "Half Day":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "Late":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-800";
      case "Absent":
        return "bg-red-100 text-red-800";
      case "Half Day":
        return "bg-yellow-100 text-yellow-800";
      case "Late":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const exportAttendance = () => {
    const csvContent = [
      "Date,User,Login Time,Logout Time,Total Hours,Status,Notes",
      ...filteredRecords.map(
        (record) =>
          `${record.date},${record.name},${record.lastLogin || "N/A"},${
            record.lastLogout || "N/A"
          },${record.totalHours},${record.status},${record.notes || ""}`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${format(selectedMonth, "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Attendance report exported");
  };

  // attandence formate

  // Format login/logout into readable time
  // const formatTime = (date: string | null) => {
  //   if (!date) return "-";
  //   return new Date(date).toLocaleTimeString([], {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   });
  // };
  // Convert UTC timestamp to IST and format as HH:MM
  const formatTime = (date: string | null) => {
    if (!date) return "-";
    const d = new Date(date);

    // IST is UTC + 5:30
    const istOffset = 5.5 * 60; // minutes
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const istTime = new Date(utc + istOffset * 60 * 1000);

    return istTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // 24-hour format
    });
  };

  // Calculate total worked hours
  const calculateHours = (login: string, logout: string) => {
    const diffMs = new Date(logout).getTime() - new Date(login).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const determineStatus = (
    loginTime: string | null,
    logoutTime: string | null
  ) => {
    if (!loginTime) return "Absent";

    const login = new Date(loginTime);
    const start = new Date(login);
    start.setHours(9, 0, 0, 0);
    const halfDay = new Date(login);
    halfDay.setHours(13, 0, 0, 0);

    if (login > halfDay) return "Half Day";
    if (login > start) return "Late";
    return "Present";
  };

  const [monthlySummary, setMonthlySummary] = useState({});
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  console.log(
    monthlySummary,
    "monthlySummary",
    monthlyRecords,
    "monthlyRecords"
  );
  const api_url = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const fetchMonthlySummary = async () => {
      try {
        const month = format(selectedMonth, "yyyy-MM");

        const url = `${api_url}/api/attendance/monthly/all/${month}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
          setMonthlySummary(data.summary || data.summaries); // depends on role
          setMonthlyRecords(data.records || []);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch monthly summary");
      }
    };

    fetchMonthlySummary();
  }, [selectedMonth]);

  useEffect(() => {
    if (Array.isArray(monthlySummary) && monthlySummary.length > 0) {
      const totalUsers = monthlySummary.length;

      const overall = monthlySummary.reduce(
        (acc, user) => {
          acc.presentDays += user.presentDays || 0;
          acc.absentDays += user.absentDays || 0;
          acc.totalHours += user.totalHours || 0;
          acc.halfDays += user.halfDays || 0;
          acc.avgHours += parseFloat(user.avgHours || 0);
          acc.attendancePercentage += parseFloat(
            user.attendancePercentage || 0
          );
          return acc;
        },
        {
          presentDays: 0,
          absentDays: 0,
          totalHours: 0,
          halfDays: 0,
          avgHours: 0,
          attendancePercentage: 0,
        }
      );

      // Compute averages
      overall.avgHours = (overall.avgHours / totalUsers).toFixed(1);
      overall.attendancePercentage = (
        overall.attendancePercentage / totalUsers
      ).toFixed(1);

      setOverallSummary(overall);
    }
  }, [monthlySummary]);
  console.log(overallSummary, "overallSummary");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Attendance Log
          </h2>
          <p className="text-gray-300 mt-1">
            Track working hours and attendance records
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {(profile?.role === "Admin" || profile?.role === "Manager") && (
            <button
              onClick={exportAttendance}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors font-semibold"
            >
              <Download className="w-5 h-5" />
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>

      {overallSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="glass rounded-2xl p-6 border border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-semibold">
                  Present Days
                </p>
                <p className="text-3xl font-bold text-white mt-2">
                  {overallSummary.presentDays}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-green-500">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-semibold">
                  Absent Days
                </p>
                <p className="text-3xl font-bold text-white mt-2">
                  {overallSummary.absentDays}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-red-500">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-semibold">Avg Hours</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {overallSummary.avgHours}h
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-semibold">
                  Total Hours
                </p>
                <p className="text-3xl font-bold text-white mt-2">
                  {overallSummary.totalHours.toFixed(1)}h
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-500">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-semibold">
                  Attendance %
                </p>
                <p className="text-3xl font-bold text-white mt-2">
                  {overallSummary.attendancePercentage}%
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {(profile?.role === "Admin" || profile?.role === "Manager") && (
        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-300" />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              <option value="All" className="bg-gray-700 text-white">
                All
              </option>

              {users.map((user) => (
                <option
                  className="bg-gray-700 text-white"
                  key={user._id}
                  value={user._id}
                >
                  {user.name} - {user.role}
                </option>
              ))}
            </select>
            <input
              type="month"
              value={format(selectedMonth, "yyyy-MM")}
              onChange={(e) => setSelectedMonth(new Date(e.target.value))}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            />
          </div>
        </div>
      )}
      <button
        onClick={clearAllAttendance}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Clear All Attendance
      </button>

      {/* Attendance Records */}
      <div className="glass rounded-2xl border border-white/30 overflow-hidden shadow-xl">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-3">
              No attendance records
            </h3>
            <p className="text-gray-300 text-lg">
              Attendance records will appear here once you start logging in
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10 border-b border-white/20">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Date
                  </th>
                  {(profile?.role === "Admin" ||
                    profile?.role === "Manager") && (
                    <th className="text-left py-4 px-6 font-semibold text-white">
                      User
                    </th>
                  )}
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Login Time
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Logout Time
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Total Hours
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredRecords.map((record) => (
                  <tr
                    key={record}
                    className={`${
                      record.status === "Present"
                        ? "bg-green-500/10"
                        : record.status === "Absent"
                        ? "bg-red-500/10"
                        : record.status === "Half Day"
                        ? "bg-yellow-500/10"
                        : "bg-orange-500/10"
                    }`}
                  >
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span
                          className={`font-medium ${
                            isToday(new Date(record.date))
                              ? "text-blue-400"
                              : "text-white"
                          }`}
                        >
                          {format(new Date(record.date), "MMM dd, yyyy")}
                        </span>
                        {isToday(new Date(record.date)) && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                            TODAY
                          </span>
                        )}
                      </div>
                    </td>

                    {(profile?.role === "Admin" ||
                      profile?.role === "Manager") && (
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">
                              {record.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {record.name}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {record.role}
                            </p>
                          </div>
                        </div>
                      </td>
                    )}

                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <LogIn className="w-4 h-4 text-green-400" />
                        <span className="text-white font-medium">
                          {formatTime(record.lastLogin) || "Not logged in"}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span className="text-white font-medium">
                          {formatTime(record.lastLogout) || "Not logged out"}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-bold">
                          {record.totalHours
                            ? formatHours(record.totalHours)
                            : "-"}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          record.status
                        )}`}
                      >
                        {getStatusIcon(record.status)}
                        <span className="ml-1">{record.status}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-gray-300 text-sm">
                        {record.notes || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attendance Calendar View */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        <h3 className="text-lg font-semibold text-white mb-4">
          Monthly Attendance Calendar
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-gray-300 font-semibold text-sm"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {/* Calendar Days */}
          {eachDayOfInterval({
            start: startOfMonth(selectedMonth),
            end: endOfMonth(selectedMonth),
          }).map((day) => {
            const isCurrentDay = isToday(day); // Check if today

            return (
              <div
                key={day.toISOString()}
                className={`p-2 border border-white/10 rounded-lg text-center transition-all duration-300 ${
                  isCurrentDay
                    ? "bg-green-500/20 border-green-400" // Highlight today
                    : "hover:bg-white/10"
                }`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isCurrentDay ? "text-green-400" : "text-white"
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        {/* <div className="flex items-center justify-center space-x-6 mt-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-gray-300">Present</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span className="text-gray-300">Late</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-300">Half Day</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-gray-300">Absent</span>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default AttendanceLog;
