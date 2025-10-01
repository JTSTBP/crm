import React, { useEffect, useState } from "react";
import {
  Plus,
  CheckSquare,
  Clock,
  Calendar,
  Filter,
  Search,
  Edit3,
  Trash2,
  RotateCcw,
  Target,
  Phone,
  FileText,
  Users,
  AlertCircle,
} from "lucide-react";
// top of file
import { isAfter } from "date-fns";

import { useTasks } from "../../hooks/useTasks";
import { useAuth } from "../../contexts/AuthContext";
import CreateTaskModal from "../Tasks/CreateTaskModal";
import EditTaskModal from "../Tasks/EditTaskModal";
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  startOfDay,
  endOfDay,
} from "date-fns";
import toast from "react-hot-toast";
import { useLeadsContext } from "../../contexts/leadcontext";

const DailyPlanner: React.FC = () => {
  const { loading, updateTask } = useTasks();
  const { profile } = useAuth();
  const { alltasks: tasks, deletetask, getAllTasks } = useLeadsContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Today");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const filterOptions = [
    "Today",
    "Tomorrow",
    "This Week",
    "Overdue",
    "Completed",
    "All",
  ];
  const priorityOptions = ["All", "High", "Medium", "Low"];

  const getTaskPriority = (dueDate: string, completed: boolean) => {
    if (completed) return "completed";
    const due = new Date(dueDate);
    const now = new Date();
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (isPast(due)) return "overdue";
    if (diffHours <= 2) return "urgent";
    if (isToday(due)) return "today";
    if (isTomorrow(due)) return "tomorrow";
    return "upcoming";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "overdue":
        return "border-l-red-500 bg-red-50";
      case "urgent":
        return "border-l-orange-500 bg-orange-50";
      case "today":
        return "border-l-yellow-500 bg-yellow-50";
      case "tomorrow":
        return "border-l-blue-500 bg-blue-50";
      case "completed":
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const getTaskTypeIcon = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes("call") || titleLower.includes("phone"))
      return <Phone className="w-4 h-4 text-blue-500" />;
    if (titleLower.includes("meeting") || titleLower.includes("demo"))
      return <Users className="w-4 h-4 text-purple-500" />;
    if (titleLower.includes("proposal") || titleLower.includes("send"))
      return <FileText className="w-4 h-4 text-green-500" />;
    if (titleLower.includes("follow") || titleLower.includes("contact"))
      return <Target className="w-4 h-4 text-orange-500" />;
    return <CheckSquare className="w-4 h-4 text-gray-500" />;
  };

const filteredTasks = tasks
  .filter((task) => {
    const taskDate = new Date(task.due_date);
    const taskPriority = getTaskPriority(task.due_date, task.completed);

    const matchesSearch =
      !searchTerm ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesFilter = true;
    switch (filterType) {
      case "Today":
        matchesFilter = isToday(taskDate) || isAfter(taskDate, new Date());
        break;
      case "Tomorrow":
        matchesFilter = isTomorrow(taskDate);
        break;
      case "This Week":
        const weekStart = startOfDay(new Date());
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        matchesFilter = taskDate >= weekStart && taskDate <= weekEnd;
        break;
      case "Overdue":
        matchesFilter = !task.completed && isPast(taskDate);
        break;
      case "Completed":
        matchesFilter = task.completed;
        break;
    }

    const matchesPriority =
      priorityFilter === "All" || taskPriority === priorityFilter.toLowerCase();

    return matchesSearch && matchesFilter && matchesPriority;
  })
  .sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const todayTasks = tasks.filter((task) => isToday(new Date(task.due_date)));
  const overdueTasks = tasks.filter(
    (task) => !task.completed && isPast(new Date(task.due_date))
  );
  const completedToday = tasks.filter(
    (task) => task.completed && isToday(new Date(task.due_date))
  );

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      await updateTask(taskId, { completed: !completed });
      toast.success(completed ? "Task marked as pending" : "Task completed!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deletetask(taskId);
        getAllTasks();
        toast.success("Task deleted successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete task");
      }
    }
  };

  const handleRescheduleTask = async (taskId: string) => {
    const newDate = prompt("Enter new due date (YYYY-MM-DD):");
    if (newDate) {
      try {
        await updateTask(taskId, { due_date: new Date(newDate).toISOString() });
        toast.success("Task rescheduled successfully");
      } catch (error: any) {
        toast.error("Failed to reschedule task");
      }
    }
  };

  const createQuickTask = async (
    type: "call" | "meeting" | "proposal" | "followup"
  ) => {
    const quickTasks = {
      call: {
        title: "Make follow-up call",
        description: "Call potential client to discuss requirements",
      },
      meeting: {
        title: "Schedule client meeting",
        description: "Set up discovery meeting with prospect",
      },
      proposal: {
        title: "Send proposal",
        description: "Prepare and send recruitment proposal",
      },
      followup: {
        title: "Follow-up on proposal",
        description: "Check status of sent proposal",
      },
    };

    const taskData = quickTasks[type];
    try {
      // This would use the createTask function from useTasks
      toast.success(`Quick ${type} task created!`);
      setIsCreateModalOpen(true);
    } catch (error: any) {
      toast.error("Failed to create quick task");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">
                Today's Tasks
              </p>
              <p className="text-3xl font-bold text-white mt-2">
                {todayTasks.length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-500">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">
                Completed Today
              </p>
              <p className="text-3xl font-bold text-white mt-2">
                {completedToday.length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-green-500">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Overdue</p>
              <p className="text-3xl font-bold text-white mt-2">
                {overdueTasks.length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-red-500">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">
                Completion Rate
              </p>
              <p className="text-3xl font-bold text-white mt-2">
                {todayTasks.length > 0
                  ? Math.round(
                      (completedToday.length / todayTasks.length) * 100
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-500">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        <h3 className="text-lg font-semibold text-white mb-4">
          Quick Task Creation
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => createQuickTask("call")}
            className="p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-center transition-all duration-300 hover:scale-105"
          >
            <Phone className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-white font-medium">Schedule Call</p>
          </button>
          <button
            onClick={() => createQuickTask("meeting")}
            className="p-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-center transition-all duration-300 hover:scale-105"
          >
            <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-white font-medium">Plan Meeting</p>
          </button>
          <button
            onClick={() => createQuickTask("proposal")}
            className="p-4 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl text-center transition-all duration-300 hover:scale-105"
          >
            <FileText className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-white font-medium">Send Proposal</p>
          </button>
          <button
            onClick={() => createQuickTask("followup")}
            className="p-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-xl text-center transition-all duration-300 hover:scale-105"
          >
            <Target className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-white font-medium">Follow-up</p>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-6 border border-white/30">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-300" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              >
                {filterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="gradient-primary text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="glass rounded-2xl border border-white/30 overflow-hidden shadow-xl">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center">
            <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-3">
              No tasks found
            </h3>
            <p className="text-gray-300 text-lg">
              {searchTerm || filterType !== "All"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first task"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredTasks.map((task) => {
              const priority = getTaskPriority(task.due_date, task.completed);
              const timeUntilDue =
                new Date(task.due_date).getTime() - new Date().getTime();
              const hoursUntilDue = Math.round(timeUntilDue / (1000 * 60 * 60));

              return (
                <div
                  key={task.id}
                  className={`p-6 hover:bg-white/10 transition-all duration-300 border-l-4 ${getPriorityColor(
                    priority
                  )}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <button
                        onClick={() =>
                          handleToggleComplete(task.id, task.completed)
                        }
                        className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-green-500"
                        }`}
                      >
                        {task.completed && <CheckSquare className="w-4 h-4" />}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getTaskTypeIcon(task.title)}
                          <h3
                            className={`text-lg font-semibold ${
                              task.completed
                                ? "text-gray-400 line-through"
                                : "text-white"
                            }`}
                          >
                            {task.title}
                          </h3>
                          {priority === "urgent" && (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                              URGENT
                            </span>
                          )}
                          {priority === "overdue" && (
                            <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                              OVERDUE
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p
                            className={`mb-3 ${
                              task.completed ? "text-gray-500" : "text-gray-300"
                            }`}
                          >
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span
                              className={`font-medium ${
                                priority === "overdue"
                                  ? "text-red-400"
                                  : priority === "urgent"
                                  ? "text-orange-400"
                                  : priority === "today"
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              {format(
                                new Date(task.due_date),
                                "MMM dd, yyyy HH:mm"
                              )}
                            </span>
                          </div>

                          {!task.completed &&
                            hoursUntilDue > 0 &&
                            hoursUntilDue <= 24 && (
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-400 font-medium">
                                  {hoursUntilDue}h remaining
                                </span>
                              </div>
                            )}

                          {task.lead && (
                            <div className="flex items-center space-x-2">
                              <Target className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300">
                                {task.lead.company_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleRescheduleTask(task.id)}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                        title="Reschedule"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingTask(task)}
                        className="p-2 text-gray-400 hover:text-purple-400 transition-colors hover:bg-white/20 rounded-lg"
                        title="Edit Task"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/20 rounded-lg"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
};

export default DailyPlanner;
