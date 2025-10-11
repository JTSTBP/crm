import React, { useEffect, useState } from "react";
import {
  Plus,
  CheckSquare,
  Calendar,
  User,
  Edit3,
  Trash2,
  Clock,
} from "lucide-react";
import { useTasks } from "../../hooks/useTasks";
import CreateTaskModal from "../Tasks/CreateTaskModal";
import EditTaskModal from "../Tasks/EditTaskModal";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import toast from "react-hot-toast";
import { useLeadsContext } from "../../contexts/leadcontext";

interface LeadTasksSectionProps {
  leadId: string;
}

const LeadTasksSection: React.FC<LeadTasksSectionProps> = ({ leadId }) => {
  const { loading } = useTasks(leadId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const { getTasksByLead, updateTask, deletetask, getAllActivities } =
    useLeadsContext();
  const [tasks, setTasks] = useState<Remark[]>([]);
  const fetchTasks = async () => {
    const data = await getTasksByLead(leadId);
    const sorted = data.sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );
console.log(sorted, "sorted");
    setTasks(sorted);
  };

  useEffect(() => {
    if (leadId) {
      fetchTasks();
    }
  }, [leadId]);

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      await updateTask(taskId, { completed: !completed });
      getAllActivities()
      fetchTasks();
      toast.success(completed ? "Task marked as pending" : "Task completed!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        console.log(taskId, "tt");
        await deletetask(taskId);
        fetchTasks();
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
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  console.log("tasks:", tasks);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Lead Tasks</h3>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No tasks yet</p>
          <p className="text-sm text-gray-500">
            Create tasks to track follow-ups and activities for this lead
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(tasks ?? []).map((task) => {
            const priority = getTaskPriority(task.due_date, task.completed);
            return (
              <div
                key={task._id}
                className={`p-4 rounded-lg border-l-4 ${getPriorityColor(
                  priority
                )} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
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
                      <h4
                        className={`font-medium ${
                          task.completed
                            ? "text-gray-500 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </h4>

                      {task.description && (
                        <p
                          className={`text-sm mt-1 ${
                            task.completed ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {task.description}
                        </p>
                      )}

                      {/* <div className="flex items-center space-x-4 mt-2 text-xs">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span
                            className={`${
                              priority === "overdue"
                                ? "text-red-600 font-medium"
                                : priority === "today"
                                ? "text-orange-600 font-medium"
                                : priority === "tomorrow"
                                ? "text-yellow-600 font-medium"
                                : "text-gray-500"
                            }`}
                          >
                            {formatDueDate(task.due_date)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-500">
                            {task.user_id?.name}
                          </span>
                        </div>
                      </div> */}
                      <div className="flex items-center space-x-4 mt-2 text-xs">
                        {/* Due Date */}
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span
                            className={`${
                              priority === "overdue"
                                ? "text-red-600 font-medium"
                                : priority === "today"
                                ? "text-orange-600 font-medium"
                                : priority === "tomorrow"
                                ? "text-yellow-600 font-medium"
                                : "text-gray-500"
                            }`}
                          >
                            {formatDueDate(task.due_date)}
                          </span>
                        </div>

                        {/* Assigned User */}
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-500">
                            {task.user_id?.name}
                          </span>
                        </div>

                        {/* Task Type */}
                        <div className="flex items-center space-x-1">
                          <CheckSquare className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-500 capitalize">
                            {task.type}
                          </span>
                        </div>

                        {/* Due Time */}
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-500">
                            {format(new Date(task.due_date), "hh:mm a")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 ml-3">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          leadId={leadId}
          refreshTasks={fetchTasks}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          refreshTasks={fetchTasks}
        />
      )}
    </div>
  );
};

export default LeadTasksSection;
