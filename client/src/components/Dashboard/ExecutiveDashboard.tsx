import React, { useEffect } from "react";
import {
  Users,
  FileText,
  TrendingUp,
  Clock,
  Target,
  Phone,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { useLeadsContext } from "../../contexts/leadcontext";
import { format, isToday, isTomorrow, isPast, startOfWeek } from "date-fns";

const ExecutiveDashboard: React.FC = () => {
  const { leads, alltasks, fetchLeads, pagination } = useLeadsContext();

  // Fetch ALL leads when dashboard mounts (no pagination limit)
  useEffect(() => {
    fetchLeads({ limit: 1000 }); // Fetch up to 1000 leads for dashboard stats
  }, []);
  const formatDueDate = (dueDate: string) => {
    const due = new Date(dueDate);
    if (isToday(due)) return "Today";
    if (isTomorrow(due)) return "Tomorrow";
    return format(due, "MMM dd, yyyy");
  };

  // Calculate start of current week (Sunday)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  weekStart.setHours(0, 0, 0, 0);

  const stats = {
    totalLeads: leads.length,
    newLeads: leads.filter((l) => l.stage === "New").length,
    newLeadsThisWeek: leads.filter((l) => {
      const createdDate = new Date(l.createdAt);
      return createdDate >= weekStart;
    }).length,
    contacted: leads.filter((l) => l.stage === "Contacted").length,
    proposals: leads.filter((l) => l.stage === "Proposal Sent").length,
    won: leads.filter((l) => l.stage === "Won").length,
    conversionRate:
      leads.length > 0
        ? Math.round(
          (leads.filter((l) => l.stage === "Won").length / leads.length) * 100
        )
        : 0,
  };

  const recentLeads = leads.slice(0, 5);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: string;
  }> = ({ title, value, icon, color, trend }) => (
    <div className="glass rounded-2xl p-8 border border-white/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-300 text-sm font-semibold tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <p className="text-emerald-400 text-sm mt-3 flex items-center font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  const QuickAction: React.FC<{
    title: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
  }> = ({ title, icon, color, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full p-5 rounded-2xl ${color} text-white font-semibold transition-all duration-300 flex items-center space-x-3 shadow-lg`}
    >
      {icon}
      <span>{title}</span>
    </button>
  );
  const incompleteTasks = alltasks.filter((task) => task.completed === false);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gradient-primary rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

        <h1 className="text-2xl font-bold mb-2">Good morning! 👋</h1>
        <p className="text-blue-100 text-lg">
          You have {stats.newLeadsThisWeek} new leads created this week
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={<Users className="w-7 h-7 text-white" />}
          color="gradient-primary shadow-xl"
        />
        <StatCard
          title="New Leads (This Week)"
          value={stats.newLeadsThisWeek}
          icon={<Target className="w-7 h-7 text-white" />}
          color="gradient-success shadow-xl"
        />
        <StatCard
          title="Proposals Sent"
          value={stats.proposals}
          icon={<FileText className="w-7 h-7 text-white" />}
          color="gradient-secondary shadow-xl"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={<TrendingUp className="w-7 h-7 text-white" />}
          color="bg-gradient-to-r from-orange-500 to-red-500 shadow-xl"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <QuickAction
              title="Make a Call"
              icon={<Phone className="w-5 h-5" />}
              color="bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-xl hover:scale-105"
              onClick={() => { }}
            />
            <QuickAction
              title="Schedule Meeting"
              icon={<Calendar className="w-5 h-5" />}
              color="bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-xl hover:scale-105"
              onClick={() => { }}
            />
            <QuickAction
              title="Send Proposal"
              icon={<FileText className="w-5 h-5" />}
              color="bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-xl hover:scale-105"
              onClick={() => { }}
            />
            <QuickAction
              title="Add Lead"
              icon={<Users className="w-5 h-5" />}
              color="bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-xl hover:scale-105"
              onClick={() => { }}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-6">Recent Leads</h2>
          <div className="glass rounded-2xl border border-white/30 shadow-xl">
            {recentLeads.length > 0 ? (
              <div className="divide-y divide-white/10">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-6 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          {lead.company_name}
                        </h3>
                        <p className="text-sm text-gray-300 font-medium">
                          {lead.industry_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {lead.assignedBy.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex px-3 py-2 text-xs font-bold rounded-full shadow-lg ${lead.stage === "New"
                            ? "bg-blue-100 text-blue-800"
                            : lead.stage === "Contacted"
                              ? "bg-yellow-100 text-yellow-800"
                              : lead.stage === "Proposal Sent"
                                ? "bg-purple-100 text-purple-800"
                                : lead.stage === "Won"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {lead.stage}
                        </span>
                        <p className="text-xs text-gray-400 mt-2 font-medium">
                          {new Date(lead.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">
                  No leads yet. Start by adding your first lead!
                </p>
              </div>
            )}
          </div>

          {/* Today's Tasks */}
          <div className="glass rounded-2xl p-8 border border-white/30 shadow-xl mt-8"> {/* Added mt-8 for spacing */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Today's Tasks</h2>
              <span className="text-sm text-gray-300 font-medium bg-white/20 px-3 py-1 rounded-full">
                {incompleteTasks?.length || 0} pending
              </span>
            </div>
            <div className="space-y-4">
              {alltasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/10"
                >
                  <CheckCircle
                    className={`w-5 h-5 ${task.completed ? "text-green-500" : "text-gray-400"
                      }`}
                  />
                  <div className="flex-1">
                    <p
                      className={`font-semibold ${task.completed ? "text-gray-400 line-through" : "text-white"
                        }`}
                    >
                      {task.title}
                    </p>
                    <p className="text-sm text-gray-300 flex items-center font-medium">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDueDate(task.due_date)} -{" "}
                      {format(new Date(task.due_date), "hh:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
