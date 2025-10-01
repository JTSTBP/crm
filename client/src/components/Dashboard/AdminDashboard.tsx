import React from 'react'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign,
  FileText,
  Target,
  Calendar,
  Download
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useLeadsContext } from '../../contexts/leadcontext'


const AdminDashboard: React.FC = () => {
  const { leads } = useLeadsContext()

  const leadsSafe = leads ?? [];

  const stats = {
    totalUsers: 24,
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


  // Sample data for charts
  const revenueData = [
    { month: 'Jan', revenue: 1200000, leads: 45 },
    { month: 'Feb', revenue: 1800000, leads: 52 },
    { month: 'Mar', revenue: 2200000, leads: 48 },
    { month: 'Apr', revenue: 2800000, leads: 61 },
    { month: 'May', revenue: 3200000, leads: 58 },
    { month: 'Jun', revenue: 2900000, leads: 54 },
  ]

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; trend?: string }> = 
    ({ title, value, icon, color, trend }) => (
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
          <div className={`p-3 rounded-xl ${color}`}>
            {icon}
          </div>
        </div>
      </div>
    )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Company Overview</h1>
            <p className="text-emerald-100">Complete system analytics and performance metrics</p>
          </div>
          <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </button>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
                tickFormatter={(value) => `₹${(value/100000).toFixed(0)}L`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: any) => [`₹${(value/100000).toFixed(1)}L`, 'Revenue']}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Generation</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent System Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'New user registration', user: 'Amit Verma', time: '5 minutes ago', type: 'user' },
              { action: 'Lead converted to Won', user: 'Priya Patel', time: '1 hour ago', type: 'success' },
              { action: 'Proposal sent', user: 'Rahul Sharma', time: '2 hours ago', type: 'proposal' },
              { action: 'Rate card updated', user: 'Admin', time: '3 hours ago', type: 'update' },
              { action: 'New lead created', user: 'Sneha Singh', time: '4 hours ago', type: 'lead' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'user' ? 'bg-blue-100' :
                  activity.type === 'success' ? 'bg-green-100' :
                  activity.type === 'proposal' ? 'bg-purple-100' :
                  activity.type === 'update' ? 'bg-orange-100' :
                  'bg-gray-100'
                }`}>
                  {activity.type === 'user' && <Users className="w-5 h-5 text-blue-600" />}
                  {activity.type === 'success' && <Target className="w-5 h-5 text-green-600" />}
                  {activity.type === 'proposal' && <FileText className="w-5 h-5 text-purple-600" />}
                  {activity.type === 'update' && <TrendingUp className="w-5 h-5 text-orange-600" />}
                  {activity.type === 'lead' && <Building2 className="w-5 h-5 text-gray-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">by {activity.user}</p>
                </div>
                <div className="text-sm text-gray-500">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API Response</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">98ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Uptime</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">99.9%</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Monthly Review</p>
                  <p className="text-xs text-gray-600">Tomorrow, 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Q2 Report Due</p>
                  <p className="text-xs text-gray-600">In 3 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard