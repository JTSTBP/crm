import React from "react";
import {
  Users,
  Building2,
  TrendingUp,
  MessageSquare,
  Trash2,
  PlusCircle,
  DollarSign,
  FileText,
  Target,
  Calendar,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useLeadsContext } from "../../contexts/leadcontext";
import { useUsers } from "../../hooks/useUsers";

const AdminDashboard: React.FC = () => {
  const { leads, activities } = useLeadsContext();
  const { users } = useUsers();

  const leadsSafe = leads ?? [];

  const stats = {
    totalUsers: users.length,
    totalLeads: leadsSafe.length,
    totalRevenue: leadsSafe
      .filter((l) => l.stage === "Won")
      .reduce((sum, l) => sum + (l.value ?? 0), 0),
    activeProposals: leadsSafe.filter((l) => l.stage === "Proposal Sent")
      .length,
    conversionRate:
      leadsSafe.length > 0
        ? Math.round(
            (leadsSafe.filter((l) => l.stage === "Won").length /
              leadsSafe.length) *
              100
          )
        : 0,
    avgDealSize:
      leadsSafe.filter((l) => l.stage === "Won").length > 0
        ? Math.round(
            leadsSafe
              .filter((l) => l.stage === "Won")
              .reduce((sum, l) => sum + (l.value ?? 0), 0) /
              leadsSafe.filter((l) => l.stage === "Won").length
          )
        : 0,
  };

  const revenueData = (() => {
    // Create an object to store totals per month
    const monthlyStats = {};

    leadsSafe.forEach((lead) => {
      const createdAt = new Date(lead.createdAt?.$date || lead.createdAt);
      const month = createdAt.toLocaleString("default", { month: "short" }); // e.g., "Jan"

      if (!monthlyStats[month]) {
        monthlyStats[month] = { revenue: 0, leads: 0 };
      }

      // Count all leads created in this month
      monthlyStats[month].leads += 1;

      // Add revenue only for "Won" deals
      if (lead.stage === "Won") {
        monthlyStats[month].revenue += lead.value ?? 0;
      }
    });

    // Convert the monthly object into a sorted array (Jan–Dec order)
    const monthOrder = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return monthOrder
      .filter((m) => monthlyStats[m]) // keep only months that exist in data
      .map((month) => ({
        month,
        revenue: monthlyStats[month].revenue,
        leads: monthlyStats[month].leads,
      }));
  })();

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



  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: string;
  }> = ({ title, value, icon, color, trend }) => (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className="text-emerald-600 text-sm mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Company Overview</h1>
            <p className="text-emerald-100">
              Complete system analytics and performance metrics
            </p>
          </div>
          {/* <button
            onClick={handleExportReport}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </button> */}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={<Building2 className="w-6 h-6 text-white" />}
          color="bg-emerald-500"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(stats.totalRevenue / 1000000).toFixed(1)}Cr`}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-green-500"
          trend="+23% vs last quarter"
        />
        <StatCard
          title="Active Proposals"
          value={stats.activeProposals}
          icon={<FileText className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={<Target className="w-6 h-6 text-white" />}
          color="bg-orange-500"
          trend="+5% vs last quarter"
        />
        <StatCard
          title="Avg Deal Size"
          value={`₹${(stats.avgDealSize / 100000).toFixed(1)}L`}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="bg-pink-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
                tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: any) => [
                  `₹${(value / 100000).toFixed(1)}L`,
                  "Revenue",
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#revenueGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Generation Trend */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Lead Generation
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: "#10B981", strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: "#10B981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Overview */}
      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed (Dynamic) */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity Feed
          </h2>

          <div
            className="space-y-4 max-h-96 overflow-y-auto"
            style={{ overflowX: "hidden" }}
          >
            {activities.map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                {/* Activity Icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.action === "update"
                      ? "bg-blue-100"
                      : activity.action === "remark_added"
                      ? "bg-green-100"
                      : activity.action === "remark_deleted"
                      ? "bg-red-100"
                      : activity.action === "create"
                      ? "bg-purple-100"
                      : "bg-gray-100"
                  }`}
                >
                  {activity.action === "update" && (
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  )}
                  {activity.action === "remark_added" && (
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  )}
                  {activity.action === "remark_deleted" && (
                    <Trash2 className="w-5 h-5 text-red-600" />
                  )}
                  {activity.action === "create" && (
                    <PlusCircle className="w-5 h-5 text-purple-600" />
                  )}
                </div>

                {/* Activity Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      <span className="text-blue-600">{activity.user}</span>{" "}
                      {activity.action.toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {format(new Date(activity.timestamp), "MMM dd, HH:mm")}
                    </p>
                  </div>

                  {/* Lead name */}
                  <p className="text-sm text-gray-700 mt-1">
                    {activity.leadName}
                  </p>

                  {/* Updated Fields */}
                  {activity.updatedFields && (
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <strong className="text-gray-800">Changes:</strong>
                      <div className="pl-2 space-y-1">
                        {formatUpdatedFields(activity.updatedFields)}
                      </div>
                    </div>
                  )}

                  {/* Remarks */}
                  {activity.remarks && activity.remarks.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      <strong className="text-gray-800">Remarks:</strong>
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

                  {/* Additional Details */}
                  {activity.details && (
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.details}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No recent activities yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Health
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API Response</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  98ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Uptime</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  99.9%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upcoming
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Monthly Review
                  </p>
                  <p className="text-xs text-gray-600">Tomorrow, 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Q2 Report Due
                  </p>
                  <p className="text-xs text-gray-600">In 3 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
