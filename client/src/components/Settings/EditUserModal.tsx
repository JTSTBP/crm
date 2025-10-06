import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Edit3, Mail, Phone, User, Shield, Eye, EyeOff } from "lucide-react";
import { useUsers } from "../../hooks/useUsers";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

interface EditUserModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  appPassword?: string;
  role: "Admin" | "Manager" | "BD Executive";
  status: "Active" | "Inactive";
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showAppPassword, setShowAppPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>();

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        appPassword: user.appPassword || "",
        status: user.status,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    try {
      await updateUser(user._id, data);
     
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
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
              <Edit3 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Edit User
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
              <User className="w-4 h-4 inline mr-2" />
              Full Name *
            </label>
            <input
              {...register("name", {
                required: "Name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters",
                },
              })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-300">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address *
            </label>
            <input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              type="email"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-300">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              <Phone className="w-4 h-4 inline mr-2" />
              Phone Number
            </label>
            <input
              {...register("phone", {
                pattern: {
                  value: /^[\+]?[1-9][\d]{7,14}$/,
                  message: "Phone must be 8-15 digits",
                },
              })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <p className="mt-2 text-sm text-red-300">
                {errors.phone.message}
              </p>
            )}
          </div>
          {/* app password */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              App Password (for Email Integration)
            </label>
            <div className="relative">
              <input
                type={showAppPassword ? "text" : "password"}
                {...register("appPassword")}
                placeholder="Optional App Password"
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/\s/g, ""); // remove spaces immediately
                }}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowAppPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showAppPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Optional — used for future email integration.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              <Shield className="w-4 h-4 inline mr-2" />
              Role *
            </label>
            <select
              {...register("role", { required: "Role is required" })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              <option value="BD Executive">BD Executive</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
            {errors.role && (
              <p className="mt-2 text-sm text-red-300">{errors.role.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Status
            </label>
            <select
              {...register("status")}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <h4 className="text-blue-400 font-semibold mb-2">
              Role Permissions:
            </h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p>
                <strong>Admin:</strong> Full system access, user management,
                settings
              </p>
              <p>
                <strong>Manager:</strong> Team oversight, reports, lead
                management
              </p>
              <p>
                <strong>BD Executive:</strong> Lead management, proposals, tasks
              </p>
            </div>
          </div>

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
              {loading ? "Updating..." : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
