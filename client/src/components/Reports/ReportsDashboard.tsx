import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  UserCheck,
  TrendingUp,
  CheckSquare,
  Mail,
  Clock,
  DollarSign,
  Target,
  Phone,
  FileText,
  User,
  Shield,
  Users,
  Briefcase,
  BarChart3,
  Activity,
  Download,
  MessageSquare,
  Trash2,
  PlusCircle,
} from "lucide-react";

import { format, parseISO } from "date-fns";
import { subDays } from "date-fns";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { useUsers } from "../../hooks/useUsers";
import { useEmail } from "../../contexts/EmailContext";
import { useLeadsContext } from "../../contexts/leadcontext";

const ReportsDashboard: React.FC = () => {
  const { loading, toggleUserStatus, deleteUser } = useAuth();
  const { users } = useUsers();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "activity">(
    "overview"
  );

  const {
    leads,
    activities,
    alltasks,
    dashboardStats,
    fetchDashboardStats,
    getAllActivities
  } = useLeadsContext();

  const [filters, setFilters] = useState({
    dateRange: "last30days",
    customStart: "",
    customEnd: "",
    userId: "",
  });

  const [customRange, setCustomRange] = useState<{
    start: string;
    end: string;
  }>({ start: "", end: "" });

  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [allUserCalls, setAllUserCalls] = useState<Record<string, any[]>>({});
  const [callsLoading, setCallsLoading] = useState(false);


  const nonAdmins = users.filter((user) => user.role !== "Admin");

  const handleCustomStartChange = (date: string) => {
    setCustomRange((prev) => ({ ...prev, start: date }));
    setFilters((prev) => ({ ...prev, customStart: date, dateRange: "custom" }));
  };

  const handleCustomEndChange = (date: string) => {
    setCustomRange((prev) => ({ ...prev, end: date }));
    setFilters((prev) => ({ ...prev, customEnd: date, dateRange: "custom" }));
  };

  const handleDateRangeChange = (range: string) => {
    setFilters((prev) => ({ ...prev, dateRange: range }));
    if (range !== "custom") setCustomRange({ start: "", end: "" });
  };

  const updateFilters = (newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Helper function to fetch ALL users' calls in one batch request (OPTIMIZED)
  const fetchAllUserCalls = async (startDate?: string, endDate?: string) => {
    try {
      const url = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem("token");

      let queryParams = "";
      if (startDate && endDate) {
        queryParams = `?startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(`${url}/api/users/calls-batch${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('Batch fetch complete:', data.totalCalls, 'total calls');
      return data.callsByUser || {};
    } catch (error) {
      console.error("Error fetching batch user calls:", error);
      toast.error("Failed to load call data");
      return {};
    }
  };

  // Helper function to apply date filter
  const applyDateFilter = (timestamp: string | { $date: string }) => {
    const callDate = new Date(typeof timestamp === 'string' ? timestamp : timestamp.$date);
    const now = new Date();

    if (filters.dateRange === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return callDate >= today && callDate < tomorrow;
    } else if (filters.dateRange === "last7days") {
      const last7 = subDays(now, 7);
      return callDate >= last7 && callDate <= now;
    } else if (filters.dateRange === "last30days") {
      const last30 = subDays(now, 30);
      return callDate >= last30 && callDate <= now;
    } else if (filters.dateRange === "custom") {
      if (!filters.customStart || !filters.customEnd) return true;
      const start = new Date(filters.customStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.customEnd);
      end.setHours(23, 59, 59, 999);
      return callDate >= start && callDate <= end;
    }
    return true;
  };

  const exportData = (format: "csv" | "excel" | "pdf") => {
    // Implement export logic using dashboardStats
    console.log("Exporting data...", format);
  };

  useEffect(() => {
    const fetchData = async () => {
      let startDate = "";
      let endDate = "";
      const now = new Date();

      if (filters.dateRange === "today") {
        startDate = now.toISOString().split("T")[0];
        endDate = now.toISOString().split("T")[0];
      } else if (filters.dateRange === "last7days") {
        const last7 = subDays(now, 7);
        startDate = last7.toISOString().split("T")[0];
        endDate = now.toISOString().split("T")[0];
      } else if (filters.dateRange === "last30days") {
        const last30 = subDays(now, 30);
        startDate = last30.toISOString().split("T")[0];
        endDate = now.toISOString().split("T")[0];
      } else if (filters.dateRange === "custom") {
        startDate = filters.customStart;
        endDate = filters.customEnd;
      }

      await fetchDashboardStats({
        startDate,
        endDate,
        assignedBy: filters.userId
      });

      setActivitiesLoading(true);
      await getAllActivities();
      setActivitiesLoading(false);
    };

    fetchData();
  }, [filters]);

  // Fetch all users' calls when Team Performance tab is active
  useEffect(() => {
    if (activeTab === "users") {
      const loadAllCalls = async () => {
        setCallsLoading(true);

        // Calculate date range for API
        let startDate = "";
        let endDate = "";
        const now = new Date();

        if (filters.dateRange === "today") {
          startDate = now.toISOString().split("T")[0];
          endDate = now.toISOString().split("T")[0];
        } else if (filters.dateRange === "last7days") {
          const last7 = subDays(now, 7);
          startDate = last7.toISOString().split("T")[0];
          endDate = now.toISOString().split("T")[0];
        } else if (filters.dateRange === "last30days") {
          const last30 = subDays(now, 30);
          startDate = last30.toISOString().split("T")[0];
          endDate = now.toISOString().split("T")[0];
        } else if (filters.dateRange === "custom") {
          startDate = filters.customStart;
          endDate = filters.customEnd;
        }

        const callsByUser = await fetchAllUserCalls(startDate, endDate);
        setAllUserCalls(callsByUser);
        setCallsLoading(false);
      };
      loadAllCalls();
    }
  }, [activeTab, filters.dateRange, filters.customStart, filters.customEnd]);

  const stageColors: Record<string, string> = {
    New: "#3B82F6",
    Contacted: "#EAB308",
    "Proposal Sent": "#8B5CF6",
    Negotiation: "#F59E0B",
    Won: "#10B981",
    Lost: "#EF4444",
  };

  // Generate stageData dynamically
  const stageData = Object.keys(stageColors).map((stageName) => {
    const count = leads.filter((lead: any) => lead.stage === stageName).length;
    return {
      name: stageName,
      count,
      color: stageColors[stageName],
    };
  });

  // Define colors
  const conversionColors = {
    Won: "#10B981",
    Lost: "#EF4444",
    "In Progress": "#3B82F6",
  };

  // Count Won leads
  const wonCount = leads.filter((lead: any) => lead.stage === "Won").length;

  // Count Lost leads
  const lostCount = leads.filter((lead: any) => lead.stage === "Lost").length;

  const inProgressCount = leads.filter(
    (lead: any) => lead.stage === "Negotiation" || lead.stage === "Proposal Sent"
  ).length;

  // Build array
  const conversionData = [
    { name: "Won", value: wonCount, color: conversionColors.Won },
    { name: "Lost", value: lostCount, color: conversionColors.Lost },
    {
      name: "In Progress",
      value: inProgressCount,
      color: conversionColors["In Progress"],
    },
  ];

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: string;
    onClick?: () => void;
  }> = ({ title, value, icon, color, trend, onClick }) => (
    <div
      className={`glass rounded-2xl p-6 border border-white/30 hover:shadow-xl transition-all duration-300 ${onClick ? "cursor-pointer hover:scale-105" : ""
        }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-300 text-sm font-semibold tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <p className="text-emerald-400 text-sm mt-2 flex items-center font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${color} shadow-lg`}>{icon}</div>
      </div>
    </div>
  );

  const roleColors: Record<string, string> = {
    Admin: "bg-gradient-to-r from-yellow-400 to-yellow-600",
    Manager: "bg-gradient-to-r from-blue-400 to-blue-600",
    "BD executive": "bg-gradient-to-r from-green-400 to-green-600",
  };
  const roleIcons = {
    Admin: <Shield className="w-5 h-5" />,
    Manager: <Users className="w-5 h-5" />,
    "BD Executive": <Briefcase className="w-5 h-5" />,
  };

  const UserMetricCard: React.FC<{
    user: any;
    userCalls?: any[];
    loading?: boolean;
  }> = ({ user, userCalls = [], loading = false }) => {
    const role = user.role || "BD Executive";
    const colorClass =
      roleColors[role] || "bg-gradient-to-r from-gray-400 to-gray-600";

    const [showModal, setShowModal] = useState(false);
    const [filteredCalls, setFilteredCalls] = useState<any[]>([]);
    const [totalCalls, setTotalCalls] = useState(0);

    // useEffect(() => {
    //   const getUserCalls = async () => {
    //     try {
    //       const data = await fetchUserCalls(user._id); // API returning populated calls
    //       const now = new Date();
    //       let filteredCalls = data.calls || [];

    //       filteredCalls = filteredCalls.filter((call: any) =>
    //         applyDateFilter(call.timestamp?.$date || call.timestamp)
    //       );

    //       setUserCalls(filteredCalls);
    //     } catch (error) {
    //       console.error("Error fetching user calls:", error);
    //     }
    //   };

    //   getUserCalls();
    // }, [user._id, filters.dateRange, filters.customStart, filters.customEnd]);

    // Apply date filter to passed userCalls prop (no more individual API calls!)
    useEffect(() => {
      setTotalCalls(userCalls.length);

      const filtered = userCalls.filter((call: any) =>
        applyDateFilter(call.timestamp?.$date || call.timestamp)
      );

      const enhanced = filtered.map((call: any) => {
        const contact = call.leadId?.points_of_contact?.find(
          (p: any) => p.phone === call.phone
        );
        return {
          ...call,
          contactStage: contact?.stage || "N/A",
        };
      });

      setFilteredCalls(enhanced);
    }, [userCalls, filters.dateRange, filters.customStart, filters.customEnd]);

    // Show loading skeleton
    if (loading) {
      return (
        <div className="glass rounded-xl p-4 border border-white/30 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-700"></div>
              <div>
                <div className="h-4 w-24 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 w-32 bg-gray-700 rounded mb-1"></div>
                <div className="h-2 w-20 bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="h-6 w-12 bg-gray-700 rounded"></div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="text-center">
                <div className="h-6 w-12 bg-gray-700 rounded mx-auto mb-1"></div>
                <div className="h-3 w-16 bg-gray-700 rounded mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }




    return (
      <>
        <div
          className={`glass rounded-xl p-4 border border-white/30 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02]`}
          onClick={() => setShowModal(true)}
        >
          {/* Card content */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-4">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${colorClass}`}
              >
                {roleIcons[role] || role.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{user.name}</p>
                <p className="text-sm text-gray-300 truncate">{user.email}</p>
                <p className="text-xs text-gray-400 mt-1">{role}</p>
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto pl-[3.25rem] sm:pl-0">
              <p className="text-lg font-bold text-emerald-400">
                {user.leadsOnboarded || "-"}
              </p>
              <p className="text-xs text-gray-400">Onboarded</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold text-blue-400">
                {filteredCalls.length}
              </p>
              <p className="text-xs text-gray-400">
                Calls {totalCalls > 0 && `(${totalCalls} total)`}
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold text-purple-400">
                {user.proposalsSent || "-"}
              </p>
              <p className="text-xs text-gray-400">Proposals</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-green-400">
                {user.conversionRatio || "-"}%
              </p>
              <p className="text-xs text-gray-400">Conversion</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-yellow-400">
                ₹{(user.revenue / 100000).toFixed(1) || "-"}L
              </p>
              <p className="text-xs text-gray-400">Revenue</p>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-2xl p-6 w-11/12 max-w-3xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl text-white font-bold">
                  {user.name} - Calls
                </h2>
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>

              <div className="space-y-3">
                {filteredCalls.length === 0 && (
                  <p className="text-gray-400">
                    No calls made in selected period.
                  </p>
                )}
                {filteredCalls.map((call) => (
                  <div
                    key={call._id}
                    className="p-3 bg-white/5 rounded-xl flex justify-between"
                  >
                    <div>
                      <p className="text-sm text-gray-300">
                        To: {call.leadId?.company_name || call.to} -{" "}
                        {call.phone}
                      </p>
                      <p className="text-xs text-gray-400">
                        User: {call.userId?.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      Stage: {call.contactStage}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(call.timestamp), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    exportData(format);
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  const handleUserFilter = (userId: string) => {
    updateFilters({ userId: userId === filters.userId ? undefined : userId });
  };

  // const formatUpdatedFields = (updatedFields: any, action?: string) => {
  //   if (!updatedFields) return null;

  //   const getDisplayValue = (v: any) => {
  //     if (Array.isArray(v)) {
  //       if (v.length === 0) return "none";
  //       return v
  //         .map(
  //           (item) =>
  //             item?.name || item?.email || item?.content || JSON.stringify(item)
  //         )
  //         .join(", ");
  //     }
  //     if (v && typeof v === "object") {
  //       return (
  //         v.name ||
  //         v.email ||
  //         v.title ||
  //         v.company_name ||
  //         v.content ||
  //         JSON.stringify(v)
  //       );
  //     }
  //     return v ?? "null";
  //   };

  //   const changes = Object.entries(updatedFields)
  //     .filter(
  //       ([key]) => !["points_of_contact", "files", "documents"].includes(key)
  //     )
  //     .map(([key, value]) => {
  //       if (!value) return null;

  //       if (
  //         typeof value === "object" &&
  //         value !== null &&
  //         "old" in value &&
  //         "new" in value
  //       ) {
  //         const oldVal = getDisplayValue(value.old);
  //         const newVal = getDisplayValue(value.new);
  //         if (oldVal === newVal) return null;
  //         return (
  //           <div key={key}>
  //             <strong>{key}</strong> changed from <b>{oldVal}</b> →{" "}
  //             <b>{newVal}</b>
  //           </div>
  //         );
  //       }

  //       if (key === "remark" && typeof value === "object") {
  //         const author = value.profile?.name || "Unknown User";
  //         const content = value.content || "(no content)";
  //         const type = value.type || "text";
  //         return (
  //           <span key={key}>
  //             By <b>{author}</b> — {content} ({type})
  //           </span>
  //         );
  //       }

  //       if (typeof value === "object" && value !== null) {
  //         const displayValue = getDisplayValue(value);
  //         if (displayValue === "{}") return null;
  //         return (
  //           <div key={key}>
  //             <strong>{key}</strong>: {displayValue}
  //           </div>
  //         );
  //       }

  //       return (
  //         <div key={key}>
  //           <strong>{key}</strong>: {String(value)}
  //         </div>
  //       );
  //     })
  //     .filter(Boolean);

  //   if (changes.length === 0 && updatedFields.remarks) {
  //     return <div>New remark added</div>;
  //   }

  //   return changes.length > 0 ? changes : <div>No meaningful changes</div>;
  // };


  const toReadable = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const formatUpdatedFields = (updatedFields: any) => {
    if (!updatedFields) return null;

    const changedKeys = Object.keys(updatedFields).filter(
      (key) => !["files", "documents"].includes(key)
    );

    if (changedKeys.length === 0) {
      return <span>No meaningful changes</span>;
    }

    // Limit to first 5
    const visibleKeys = changedKeys.slice(0, 5);
    const hasMore = changedKeys.length > 5;

    const displayText = visibleKeys
      .map((key) => `${toReadable(key)} changed`)
      .join(", ");

    return (
      <span>
        {displayText}
        {hasMore && ", ..."}
      </span>
    );
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between relative z-10 gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">
              CRM Analytics Dashboard
            </h1>
            <p className="text-blue-100 text-base md:text-lg">
              Comprehensive insights into sales performance and team metrics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <select
              value={filters.dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-xl px-4 py-2 text-white w-full sm:w-auto"
            >
              <option className="bg-gray-700 text-white" value="today">
                Today
              </option>
              <option className="bg-gray-700 text-white" value="last7days">
                Last 7 Days
              </option>
              <option className="bg-gray-700 text-white" value="last30days">
                Last 30 Days
              </option>
              <option className="bg-gray-700 text-white" value="custom">
                Custom Range
              </option>
            </select>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => handleExport("csv")}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors flex-1 sm:flex-none"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleExport("excel")}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors flex-1 sm:flex-none"
              >
                <Download className="w-4 h-4" />
                <span>Excel</span>
              </button>
            </div>
            {filters.dateRange === "custom" && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) => handleCustomStartChange(e.target.value)}
                  className="bg-white/20 border border-white/30 rounded-xl px-2 py-1 text-white w-full sm:w-auto"
                />
                <span className="text-white hidden sm:inline">to</span>
                <span className="text-white sm:hidden">to</span>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) => handleCustomEndChange(e.target.value)}
                  className="bg-white/20 border border-white/30 rounded-xl px-2 py-1 text-white w-full sm:w-auto"
                />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white/10 rounded-xl p-1 overflow-x-auto whitespace-nowrap">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "users", label: "Team Performance", icon: Users },
          { id: "activity", label: "Activity Feed", icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${activeTab === tab.id
              ? "bg-white/20 text-white shadow-lg"
              : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Overall Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Calls Made"
              value={dashboardStats?.totalCalls || 0}
              icon={<Phone className="w-7 h-7 text-white" />}
              color="bg-blue-500"
              trend=""
            />
            <MetricCard
              title="Proposals Sent"
              value={dashboardStats?.stageStats?.["Proposal Sent"] || 0}
              icon={<FileText className="w-7 h-7 text-white" />}
              color="bg-purple-500"
              trend=""
            />
            <MetricCard
              title="Leads Onboarded"
              value={dashboardStats?.stageStats?.["Won"] || 0}
              icon={<UserCheck className="w-7 h-7 text-white" />}
              color="bg-green-500"
              trend=""
            />
            <MetricCard
              title="Total Revenue"
              value={`₹${((dashboardStats?.totalRevenue || 0) / 100000).toFixed(1)}L`}
              icon={<DollarSign className="w-7 h-7 text-white" />}
              color="bg-emerald-500"
              trend=""
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Leads"
              value={dashboardStats?.totalLeads || 0}
              icon={<Target className="w-6 h-6 text-white" />}
              color="bg-blue-400"
            />
            <MetricCard
              title="In Negotiation"
              value={dashboardStats?.stageStats?.["Negotiation"] || 0}
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              color="bg-orange-500"
            />
            <MetricCard
              title="Tasks Completed"
              value={alltasks.filter(t => t.status === 'Completed').length}
              icon={<CheckSquare className="w-6 h-6 text-white" />}
              color="bg-green-400"
            />
            <MetricCard
              title="Total Emails Sent"
              value={dashboardStats?.totalEmails || 0}
              icon={<Mail className="w-6 h-6 text-white" />}
              color="bg-red-500"
            />
          </div>
          <h6 className="text-gray-400 text-sm mt-2 italic">
            *Note: The chart shows all-time data for all leads, filters do not
            apply here.*
          </h6>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {/* Sales Pipeline Chart */}

            <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6">
                Sales Pipeline
              </h2>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#D1D5DB" }}
                    stroke="#6B7280"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#D1D5DB" }}
                    stroke="#6B7280"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "12px",
                      color: "#F9FAFB",
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {/* Notice about chart */}
            </div>

            {/* Conversion Overview */}
            <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6">
                Conversion Overview
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={conversionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {conversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "12px",
                      color: "#F9FAFB",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 gap-2 mt-4">
                {conversionData.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6">
              Activity Timeline
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardStats?.dailyStats || []}>
                <defs>
                  <linearGradient
                    id="callsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="proposalsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="leadsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#D1D5DB" }}
                  stroke="#6B7280"
                  tickFormatter={(value) => format(new Date(value), "MMM dd")}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#D1D5DB" }}
                  stroke="#6B7280"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "12px",
                    color: "#F9FAFB",
                  }}
                  labelFormatter={(value) =>
                    format(new Date(value), "MMM dd, yyyy")
                  }
                />
                <Area
                  type="monotone"
                  dataKey="calls"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#callsGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="proposals"
                  stroke="#8B5CF6"
                  fillOpacity={1}
                  fill="url(#proposalsGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#leadsGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Source & Industry Breakdown */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6">
                Lead Sources
              </h2>
              <div className="space-y-4">
                {overallMetrics.leadSourceBreakdown.map((source, index) => (
                  <div
                    key={source.source}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-300">{source.source}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-medium">
                        {source.count}
                      </span>
                      <span className="text-gray-400 text-sm">
                        ({source.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6">
                Industry Breakdown
              </h2>
              <div className="space-y-4">
                {overallMetrics.industryBreakdown.map((industry, index) => (
                  <div
                    key={industry.industry}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-gray-300">{industry.industry}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-medium">
                        {industry.count}
                      </span>
                      <span className="text-gray-400 text-sm">
                        ({industry.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div> */}
        </>
      )}

      {/* Team Performance Tab */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Team Performance Leaderboard
            </h2>
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <select
                value={filters.userId || ""}
                onChange={(e) => handleUserFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-400 w-full md:w-auto"
              >
                <option className="bg-gray-700 text-white" value="">
                  All Users
                </option>
                {users.map((user) => (
                  <option
                    className="bg-gray-700 text-white"
                    key={user._id}
                    value={user._id}
                  >
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nonAdmins
              .filter((user) =>
                filters.userId ? user._id === filters.userId : true
              )
              .map((user) => (
                <UserMetricCard
                  key={user._id}
                  user={user}
                  userCalls={allUserCalls[user._id] || []}
                  loading={callsLoading}
                />
              ))}
          </div>
        </div>
      )}
      {/* Activity Feed Tab */}
      {activeTab === "activity" && (
        <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl overflow-x-auto">
          <h2 className="text-xl font-bold text-white mb-6">
            Recent Activity Feed
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity._id}
                className="flex items-start space-x-4 p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.action === "update"
                    ? "bg-blue-500"
                    : activity.action === "remark_added"
                      ? "bg-green-500"
                      : activity.action === "remark_deleted"
                        ? "bg-red-500"
                        : activity.action === "create"
                          ? "bg-purple-500"
                          : "bg-gray-500"
                    }`}
                >
                  {activity.action === "update" && (
                    <TrendingUp className="w-5 h-5 text-white" />
                  )}
                  {activity.action === "remark_added" && (
                    <MessageSquare className="w-5 h-5 text-white" />
                  )}
                  {activity.action === "remark_deleted" && (
                    <Trash2 className="w-5 h-5 text-white" />
                  )}
                  {activity.action === "create" && (
                    <PlusCircle className="w-5 h-5 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">
                      <span className="text-blue-400">{activity.entityName}</span>{" "}
                      {activity.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {format(new Date(activity.timestamp), "MMM dd, HH:mm")}
                    </p>
                  </div>

                  <p className="text-sm text-gray-300 mt-1">
                    {activity.entity}
                  </p>


                  {activity.updatedFields && (
                    <div className="mt-2 text-sm text-gray-400 space-y-1">
                      <strong className="text-gray-300">Changes:</strong>
                      <div className="pl-2 space-y-1">
                        {formatUpdatedFields(activity.updatedFields)}
                      </div>
                    </div>
                  )}

                  {activity.remarks && activity.remarks.length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      <strong className="text-gray-300">Remarks:</strong>
                      <ul className="list-disc pl-5">
                        {activity.remarks.map((remark: any) => (
                          <li key={remark._id}>
                            {remark.type}:{" "}
                            {remark.content ||
                              remark.fileUrl ||
                              remark.voiceUrl}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activity.details && (
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.details}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {activitiesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading activities...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">No recent activities yet.</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;
