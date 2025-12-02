import React from 'react'
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  FileText,
  Clock,
  Award,
  Activity
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

import { useLeadsContext } from '../../contexts/leadcontext'
import { useUsers } from '../../hooks/useUsers'

const ManagerDashboard: React.FC = () => {
  const { leads, dashboardStats, fetchDashboardStats } = useLeadsContext();
  const { users } = useUsers();

  React.useEffect(() => {
    fetchDashboardStats();
  }, []);

  const usersWithStats = dashboardStats?.userStats?.map((stat) => {
    const totalLeads = stat.leads || 0;
    const won = stat.won || 0;
    const winRate = totalLeads ? Math.round((won / totalLeads) * 100) : 0;

    return {
      name: stat.name,
      leads: totalLeads,
      proposals: stat.proposals || 0,
      won: won,
      revenue: stat.revenue || 0,
      winRate,
      stageBreakdown: {
        New: stat.newLeads || 0,
        Contacted: stat.contacted || 0,
        Proposal: stat.proposals || 0,
        Negotiation: stat.negotiation || 0,
        Won: won,
        Lost: stat.lost || 0,
      },
    };
  }) || [];

  const stats = {
    totalLeads: dashboardStats?.totalLeads || 0,
    activeDeals:
      (dashboardStats?.stageStats?.["Contacted"] || 0) +
      (dashboardStats?.stageStats?.["Proposal Sent"] || 0) +
      (dashboardStats?.stageStats?.["Negotiation"] || 0),
    won: dashboardStats?.stageStats?.["Won"] || 0,
    revenue: dashboardStats?.totalRevenue || 0,
    conversionRate:
      (dashboardStats?.totalLeads || 0) > 0
        ? Math.round(
          ((dashboardStats?.stageStats?.["Won"] || 0) /
            (dashboardStats?.totalLeads || 1)) *
          100
        )
        : 0,
  };

  // Chart data
  const stageData = [
    { name: "New", count: dashboardStats?.stageStats?.["New"] || 0 },
    {
      name: "Contacted",
      count: dashboardStats?.stageStats?.["Contacted"] || 0,
    },
    {
      name: "Proposal",
      count: dashboardStats?.stageStats?.["Proposal Sent"] || 0,
    },
    {
      name: "Negotiation",
      count: dashboardStats?.stageStats?.["Negotiation"] || 0,
    },
    { name: "Won", count: dashboardStats?.stageStats?.["Won"] || 0 },
    { name: "Lost", count: dashboardStats?.stageStats?.["Lost"] || 0 },
  ];

  const pieColors = [
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#F59E0B",
    "#EF4444",
    "#6B7280",
  ];

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
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Team Performance Dashboard</h1>
        <p className="text-purple-100">
          Monitor your team's progress and identify opportunities
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Deals"
          value={stats.activeDeals}
          icon={<Activity className="w-6 h-6 text-white" />}
          color="bg-emerald-500"
        />
        <StatCard
          title="Deals Won"
          value={stats.won}
          icon={<Award className="w-6 h-6 text-white" />}
          color="bg-purple-500"
          trend="+8% vs last month"
        />
        <StatCard
          title="Revenue"
          value={`₹${(stats.revenue / 100000).toFixed(1)}L`}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-green-500"
          trend="+15% vs last month"
        />
        <StatCard
          title="Conversion"
          value={`${stats.conversionRate}%`}
          icon={<Target className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Chart */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sales Pipeline
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Distribution */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Stage Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stageData.filter((d) => d.count > 0)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="count"
              >
                {stageData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={pieColors[index % pieColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {stageData
              .filter((d) => d.count > 0)
              .map((stage, index) => (
                <div key={stage.name} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: pieColors[index % pieColors.length],
                    }}
                  />
                  <span className="text-sm text-gray-600">
                    {stage.name}: {stage.count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Team Performance
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-600">
                  Executive
                </th>
                <th className="text-center py-3 px-2 font-medium text-gray-600">
                  Leads
                </th>
                <th className="text-center py-3 px-2 font-medium text-gray-600">
                  Proposals
                </th>
                <th className="text-center py-3 px-2 font-medium text-gray-600">
                  Won
                </th>
                <th className="text-center py-3 px-2 font-medium text-gray-600">
                  Conversion
                </th>
                <th className="text-center py-3 px-2 font-medium text-gray-600">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersWithStats.map((exec) => (
                <tr
                  key={exec.name}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {exec.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {exec.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-2 text-gray-600">
                    {exec.leads}
                  </td>
                  <td className="text-center py-3 px-2 text-gray-600">
                    {exec.proposals}
                  </td>
                  <td className="text-center py-3 px-2 text-gray-600">
                    {exec.won}
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className="text-emerald-600 font-medium">
                      {exec.winRate}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-2 font-medium text-gray-900">
                    ₹{(exec.revenue / 100000).toFixed(1)}L
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard