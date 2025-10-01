import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { X, CheckSquare, Calendar, Building2 } from "lucide-react";
import { useLeadsContext } from "../../contexts/leadcontext";
import { useLeads } from "../../hooks/useLeads";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { useUsers } from "../../hooks/useUsers";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId?: string;
  refreshTasks: () => void;
}

interface TaskFormData {
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  lead_id?: string;
  user_id?: string;
  type: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  leadId,
  refreshTasks,
}) => {
  const { createTask } = useLeadsContext();
  const { leads } = useLeads();
  const { users } = useUsers();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  function getDefault12HourTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TaskFormData>({
    defaultValues: {
      lead_id: leadId || "",
      user_id: user?.id || "",
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // Tomorrow
      due_time: getDefault12HourTime(),
      type: "email",
    },
  });

  // Mock BD Executives for assignment (in real app, this would come from API)
  const bdExecutives = [
    {
      id: "demo-bd-executive",
      name: "Executive User",
      email: "executive@jobsterritory.com",
    },
    { id: "bd-1", name: "Rahul Sharma", email: "rahul@company.com" },
    { id: "bd-2", name: "Priya Patel", email: "priya@company.com" },
    { id: "bd-3", name: "Arjun Kumar", email: "arjun@company.com" },
    { id: "bd-4", name: "Sneha Singh", email: "sneha@company.com" },
  ];

  const onSubmit = async (data: TaskFormData) => {
    setLoading(true);
    console.log(data, "data");

    // Convert "hh:mm AM/PM" to 24h
    const [time, modifier] = data.due_time.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const combinedDateTime = new Date(
      `${data.due_date}T${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:00`
    ).toISOString();

    try {
      await createTask({
        ...data,
        due_date: combinedDateTime,
        type: data.type,
        user_id: data.user_id || user?.id,
        lead_id: leadId || null,
      });
      toast.success("Task created successfully!");
      if (refreshTasks) {
        await refreshTasks(); // 👈 refresh parent task list
      }
      reset();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Create New Task
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300 text-gray-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Task Title *
            </label>
            <input
              {...register("title", { required: "Task title is required" })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="mt-2 text-sm text-red-300">
                {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300 resize-none"
              placeholder="Enter task description..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Task Type *
            </label>
            <select
              {...register("type", { required: "Task type is required" })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              <option value="email" className="bg-gray-700 text-white">
                Email
              </option>
              <option value="call" className="bg-gray-700 text-white">
                Call
              </option>
              <option value="meeting" className="bg-gray-700 text-white">
                Meeting
              </option>
            </select>
            {errors.type && (
              <p className="mt-2 text-sm text-red-300">{errors.type.message}</p>
            )}
          </div>
          {/* <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Due Date *
            </label>
            <input
              {...register("due_date", { required: "Due date is required" })}
              type="date"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            />
            {errors.due_date && (
              <p className="mt-2 text-sm text-red-300">
                {errors.due_date.message}
              </p>
            )}
          </div> */}
          .
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Due Date *
              </label>
              <input
                {...register("due_date", { required: "Due date is required" })}
                type="date"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              />
              {errors.due_date && (
                <p className="mt-2 text-sm text-red-300">
                  {errors.due_date.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Due Time *
              </label>
              <input
                {...register("due_time", { required: "Due time is required" })}
                type="text"
                placeholder="hh:mm AM/PM"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              />
              {errors.due_time && (
                <p className="mt-2 text-sm text-red-300">
                  {errors.due_time.message}
                </p>
              )}
            </div>
          </div>
          {(profile?.role === "Admin" || profile?.role === "Manager") && (
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Assign To
              </label>
              <select
                {...register("user_id")}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              >
                <option value="">Select assignee</option>
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
          )}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-white/30 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
