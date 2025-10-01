import React, { useState } from "react";
import {
  Plus,
  CheckSquare,
  Clock,
  Calendar,
  Building2,
  User,
  Filter,
  Search,
  Edit3,
  Trash2,
} from "lucide-react";
import { useTasks } from "../../hooks/useTasks";
import { useAuth } from "../../contexts/AuthContext";
import CreateTaskModal from "./CreateTaskModal";
import EditTaskModal from "./EditTaskModal";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import toast from "react-hot-toast";
import { useLeadsContext } from "../../contexts/leadcontext";

const TasksList: React.FC = () => {
  const { loading } = useTasks();
  const { profile } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const { alltasks: tasks, updateTask, deletetask } = useLeadsContext();

  const statusOptions = ["All", "Pending", "Completed", "Overdue"];
  console.log(tasks);
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.lead?.company_name &&
        task.lead.company_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === "Pending") {
      matchesStatus = !task.completed && !isPast(new Date(task.due_date));
    } else if (statusFilter === "Completed") {
      matchesStatus = task.completed;
    } else if (statusFilter === "Overdue") {
      matchesStatus = !task.completed && isPast(new Date(task.due_date));
    }

    return matchesSearch && matchesStatus;
  });

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
        await deleteTask(taskId);
        toast.success("Task deleted successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete task");
      }
    }
  };

  const getTaskPriority = (dueDate: string, completed: boolean) => {
    if (completed) return "completed";
    const due = new Date(dueDate);
    if (isPast(due)) return "overdue";
    if (isToday(due)) return "today";
    if (isTomorrow(due)) return "tomorrow";
    return "upcoming";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "overdue":
        return "border-l-red-500 bg-red-50";
      case "today":
        return "border-l-orange-500 bg-orange-50";
      case "tomorrow":
        return "border-l-yellow-500 bg-yellow-50";
      case "completed":
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-blue-500 bg-blue-50";
    }
  };

  const formatDueDate = (dueDate: string) => {
    const due = new Date(dueDate);
    if (isToday(due)) return "Today";
    if (isTomorrow(due)) return "Tomorrow";
    return format(due, "MMM dd, yyyy");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  console.log(filteredTasks, "filteredTasks");
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Task Management
          </h1>
          <p className="text-gray-300 mt-2 text-lg">
            {profile?.role === "BD Executive"
              ? "Your assigned tasks"
              : "All team tasks"}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="gradient-primary text-white px-6 py-4 rounded-2xl flex items-center space-x-3 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-300" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
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
              {searchTerm || statusFilter !== "All"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first task"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredTasks.map((task) => {
              const priority = getTaskPriority(task.due_date, task.completed);
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
                          handleToggleComplete(task._id, task.completed)
                        }
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-green-500"
                        }`}
                      >
                        {task.completed && <CheckSquare className="w-3 h-3" />}
                      </button>

                      <div className="flex-1">
                        <h3
                          className={`text-lg font-semibold ${
                            task.completed
                              ? "text-gray-400 line-through"
                              : "text-white"
                          }`}
                        >
                          {task.title}
                        </h3>

                        {task.description && (
                          <p
                            className={`mt-1 ${
                              task.completed ? "text-gray-500" : "text-gray-300"
                            }`}
                          >
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 mt-3 text-sm">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span
                              className={`font-medium ${
                                priority === "overdue"
                                  ? "text-red-400"
                                  : priority === "today"
                                  ? "text-orange-400"
                                  : priority === "tomorrow"
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              {formatDueDate(task.due_date)}
                            </span>
                          </div>

                          {task.lead && (
                            <div className="flex items-center space-x-1">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300">
                                {task.lead_id.company_name}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">
                              {task.user_id?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setEditingTask(task)}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/20 rounded-lg"
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

export default TasksList;
