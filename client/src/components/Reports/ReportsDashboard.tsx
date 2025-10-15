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
  Phone,
  FileText,
  UserCheck,
  TrendingUp,
  UserX,
  CheckSquare,
  Clock,
  DollarSign,
  Award,
  Download,
  Filter,
  Calendar,
  Users,
  Activity,
  Building2,
  Target,
  Eye,
  Crown,
  Zap,
  BarChart3,
  Shield,
  User,
  Briefcase,
  MessageSquare,
  Edit,
  Trash,
  Trash2,
  PlusCircle,
} from "lucide-react";

import { useReports } from "../../hooks/useReports";
import { format } from "date-fns";
import { isToday, subDays, isWithinInterval } from "date-fns";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { useUsers } from "../../hooks/useUsers";
import { useEmail } from "../../contexts/EmailContext";
import { useLeadsContext } from "../../contexts/leadcontext";

const ReportsDashboard: React.FC = () => {
  const {
    overallMetrics,
    userMetrics,
    chartData,
    activityFeed,
    filters,
    updateFilters,
    exportData,
    getUserDetails,
  } = useReports();
  const { loading, toggleUserStatus, deleteUser } = useAuth();
  const { users } = useUsers();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "activity">(
    "overview"
  );
  const [activitiesgiv,setActivitiesgiv]=useState([])
  const [callcount, setCallCount] = useState(0);
  const { fetchAllCallActivities } = useEmail();

  const { leads, activities } = useLeadsContext();

  const proposalSentLeads = leads.filter(
    (lead) => lead.stage === "Proposal Sent"
  );

  const nonAdmins = users.filter((user) => user.role !== "Admin");

 
  const [proposalSentCount, setProposalSentCount] = useState(0);

  useEffect(() => {
    const getData = async () => {
      const allCalls = await fetchAllCallActivities();
      // ✅ make sure this API exists

      const now = new Date();
      let filteredCalls = allCalls;
      let filteredLeads = leads;
      let filteredActivities = activities;

      // ✅ Filter Calls by Date Range
      if (filters.dateRange === "today") {
        filteredCalls = allCalls.filter((call: any) =>
          isToday(new Date(call.timestamp))
        );
      } else if (filters.dateRange === "last7days") {
        filteredCalls = allCalls.filter((call: any) =>
          isWithinInterval(new Date(call.timestamp), {
            start: subDays(now, 7),
            end: now,
          })
        );
      } else if (filters.dateRange === "last30days") {
        filteredCalls = allCalls.filter((call: any) =>
          isWithinInterval(new Date(call.timestamp), {
            start: subDays(now, 30),
            end: now,
          })
        );
      }

      // ✅ Filter by User (if selected)
      if (filters.userId) {
        filteredCalls = filteredCalls.filter(
          (call: any) => call.userId?._id === filters.userId
        );
        filteredLeads = filteredLeads.filter(
          (lead: any) => lead.assignedBy?._id === filters.userId
        );
      }

      // ✅ Proposal Sent Leads Filter with fallback (stageProposalUpd → updatedAt)
      const proposalSentLeads = filteredLeads.filter((lead: any) => {
        if (lead.stage !== "Proposal Sent") return false;

        const dateToCheck = lead.stageProposalUpd || lead.updatedAt;
        if (!dateToCheck) return false;

        if (filters.dateRange === "today") {
          return isToday(new Date(dateToCheck));
        } else if (filters.dateRange === "last7days") {
          return isWithinInterval(new Date(dateToCheck), {
            start: subDays(now, 7),
            end: now,
          });
        } else if (filters.dateRange === "last30days") {
          return isWithinInterval(new Date(dateToCheck), {
            start: subDays(now, 30),
            end: now,
          });
        }

        return true;
      });

      // ✅ Filter Activities by Date Range
      if (filters.dateRange === "today") {
        filteredActivities = activities.filter((activity: any) =>
          isToday(new Date(activity.timestamp?.$date || activity.timestamp))
        );
      } else if (filters.dateRange === "last7days") {
        filteredActivities = activities.filter((activity: any) =>
          isWithinInterval(
            new Date(activity.timestamp?.$date || activity.timestamp),
            {
              start: subDays(now, 7),
              end: now,
            }
          )
        );
      } else if (filters.dateRange === "last30days") {
        filteredActivities = activities.filter((activity: any) =>
          isWithinInterval(
            new Date(activity.timestamp?.$date || activity.timestamp),
            {
              start: subDays(now, 30),
              end: now,
            }
          )
        );
      }

      // ✅ Update State
      setCallCount(filteredCalls.length);
      setProposalSentCount(proposalSentLeads.length);
      setActivitiesgiv(filteredActivities);

      console.log("Filtered Activities:", filteredActivities);

      console.log("Filtered Calls:", filteredCalls);
      console.log("Filtered Proposal Sent Leads:", proposalSentLeads);
    };

    getData();
  }, [filters.dateRange, filters.userId]);

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: string;
    onClick?: () => void;
  }> = ({ title, value, icon, color, trend, onClick }) => (
    <div
      className={`glass rounded-2xl p-6 border border-white/30 hover:shadow-xl transition-all duration-300 ${
        onClick ? "cursor-pointer hover:scale-105" : ""
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
  console.log(activitiesgiv, "act");

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

  const UserMetricCard: React.FC<{ user: any }> = ({ user }) => {
    const role = user.role || "BD Executive";
    const colorClass =
      roleColors[role] || "bg-gradient-to-r from-gray-400 to-gray-600";

    return (
      <div
        className={`glass rounded-xl p-4 border border-white/30 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
          selectedUser === user._id ? "ring-2 ring-blue-400" : ""
        }`}
        onClick={() =>
          setSelectedUser(selectedUser === user._id ? null : user._id)
        }
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${colorClass}`}
            >
              {roleIcons[role] || role.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-white">{user.name}</p>
              <p className="text-sm text-gray-300">{user.email}</p>
              <p className="text-xs text-gray-400 mt-1">{role}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-400">
              {user.leadsOnboarded || "-"}
            </p>
            <p className="text-xs text-gray-400">Onboarded</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-lg font-semibold text-blue-400">
              {user.no_of_calls}
            </p>
            <p className="text-xs text-gray-400">Calls</p>
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
    );
  };

  const handleDateRangeChange = (range: string) => {
    updateFilters({ dateRange: range as any });
  };

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    exportData(format);
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  const handleUserFilter = (userId: string) => {
    updateFilters({ userId: userId === filters.userId ? undefined : userId });
  };

  const formatUpdatedFields = (updatedFields: any, action?: string) => {
    if (!updatedFields) return null;

    const getDisplayValue = (v: any) => {
      if (Array.isArray(v)) {
        if (v.length === 0) return "none";
        return v
          .map(
            (item) =>
              item?.name || item?.email || item?.content || JSON.stringify(item)
          )
          .join(", ");
      }
      if (v && typeof v === "object") {
        return (
          v.name ||
          v.email ||
          v.title ||
          v.company_name ||
          v.content ||
          JSON.stringify(v)
        );
      }
      return v ?? "null";
    };

    const changes = Object.entries(updatedFields)
      .filter(
        ([key]) => !["points_of_contact", "files", "documents"].includes(key)
      )
      .map(([key, value]) => {
        if (!value) return null;

        if (
          typeof value === "object" &&
          value !== null &&
          "old" in value &&
          "new" in value
        ) {
          const oldVal = getDisplayValue(value.old);
          const newVal = getDisplayValue(value.new);
          if (oldVal === newVal) return null;
          return (
            <div key={key}>
              <strong>{key}</strong> changed from <b>{oldVal}</b> →{" "}
              <b>{newVal}</b>
            </div>
          );
        }

        if (key === "remark" && typeof value === "object") {
          const author = value.profile?.name || "Unknown User";
          const content = value.content || "(no content)";
          const type = value.type || "text";
          return (
            <span key={key}>
              By <b>{author}</b> — {content} ({type})
            </span>
          );
        }

        if (typeof value === "object" && value !== null) {
          const displayValue = getDisplayValue(value);
          if (displayValue === "{}") return null;
          return (
            <div key={key}>
              <strong>{key}</strong>: {displayValue}
            </div>
          );
        }

        return (
          <div key={key}>
            <strong>{key}</strong>: {String(value)}
          </div>
        );
      })
      .filter(Boolean);

    if (changes.length === 0 && updatedFields.remarks) {
      return <div>New remark added</div>;
    }

    return changes.length > 0 ? changes : <div>No meaningful changes</div>;
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">
              CRM Analytics Dashboard
            </h1>
            <p className="text-blue-100 text-lg">
              Comprehensive insights into sales performance and team metrics
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={filters.dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-xl px-4 py-2 text-white"
            >
              <option value="today">Today</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport("csv")}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleExport("excel")}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white/10 rounded-xl p-1">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "users", label: "Team Performance", icon: Users },
          { id: "activity", label: "Activity Feed", icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
              activeTab === tab.id
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
              value={callcount}
              icon={<Phone className="w-7 h-7 text-white" />}
              color="bg-blue-500"
              trend="+12% vs last period"
            />
            <MetricCard
              title="Proposals Sent"
              value={proposalSentCount}
              icon={<FileText className="w-7 h-7 text-white" />}
              color="bg-purple-500"
              trend="+8% vs last period"
            />
            <MetricCard
              title="Leads Onboarded"
              value={overallMetrics.onboarded}
              icon={<UserCheck className="w-7 h-7 text-white" />}
              color="bg-green-500"
              trend="+15% vs last period"
            />
            <MetricCard
              title="Revenue Won"
              value={`₹${(overallMetrics.revenueWon / 1000000).toFixed(1)}Cr`}
              icon={<DollarSign className="w-7 h-7 text-white" />}
              color="bg-emerald-500"
              trend="+23% vs last period"
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Pipeline (New)"
              value={overallMetrics.pipeline.new}
              icon={<Target className="w-6 h-6 text-white" />}
              color="bg-blue-400"
            />
            <MetricCard
              title="In Negotiation"
              value={overallMetrics.pipeline.negotiation}
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              color="bg-orange-500"
            />
            <MetricCard
              title="Tasks Completed"
              value={overallMetrics.tasksCompleted}
              icon={<CheckSquare className="w-6 h-6 text-white" />}
              color="bg-green-400"
            />
            <MetricCard
              title="Deals Lost"
              value={overallMetrics.dealsLost}
              icon={<UserX className="w-6 h-6 text-white" />}
              color="bg-red-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sales Pipeline Chart */}
            <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6">
                Sales Pipeline
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.stageData}>
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
            </div>

            {/* Conversion Overview */}
            <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6">
                Conversion Overview
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.conversionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.conversionData.map((entry, index) => (
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
                {chartData.conversionData.map((item, index) => (
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
              <AreaChart data={chartData.timeSeriesData}>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
          </div>
        </>
      )}

      {/* Team Performance Tab */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Team Performance Leaderboard
            </h2>
            <div className="flex items-center space-x-4">
              <select
                value={filters.userId || ""}
                onChange={(e) => handleUserFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-400"
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {nonAdmins
              .filter((user) =>
                filters.userId ? user._id === filters.userId : true
              )
              .map((user) => (
                <UserMetricCard key={user._id} user={user} />
              ))}
          </div>
        </div>
      )}

      {/* Activity Feed Tab */}
      {/* {activeTab === "activity" && (
        <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">
            Recent Activity Feed
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activityFeed.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === "call"
                      ? "bg-blue-500"
                      : activity.type === "proposal"
                      ? "bg-purple-500"
                      : activity.type === "stage_change"
                      ? "bg-green-500"
                      : activity.type === "task"
                      ? "bg-orange-500"
                      : "bg-gray-500"
                  }`}
                >
                  {activity.type === "call" && (
                    <Phone className="w-5 h-5 text-white" />
                  )}
                  {activity.type === "proposal" && (
                    <FileText className="w-5 h-5 text-white" />
                  )}
                  {activity.type === "stage_change" && (
                    <TrendingUp className="w-5 h-5 text-white" />
                  )}
                  {activity.type === "task" && (
                    <CheckSquare className="w-5 h-5 text-white" />
                  )}
                  {activity.type === "lead_created" && (
                    <Building2 className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">
                      <span className="text-blue-400">{activity.user}</span>{" "}
                      {activity.action.toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {format(new Date(activity.timestamp), "MMM dd, HH:mm")}
                    </p>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">
                    {activity.leadName}
                  </p>
                  {activity.details && (
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Activity Feed Tab */}
      {activeTab === "activity" && (
        <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">
            Recent Activity Feed
          </h2>
          <div
            className="space-y-4 max-h-96 overflow-y-auto"
            style={{ overflowX: "hidden" }}
          >
            {activitiesgiv.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.action === "update"
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
                      <span className="text-blue-400">{activity.user}</span>{" "}
                      {activity.action.toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {format(new Date(activity.timestamp), "MMM dd, HH:mm")}
                    </p>
                  </div>

                  <p className="text-sm text-gray-300 mt-1">
                    {activity.leadName}
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

            {activitiesgiv.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">No recent activities yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;
