import React, { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  UserX,
  UserCheck,
  Users,
  Mail,
  Phone,
  Shield,
} from "lucide-react";
import { useUsers } from "../../hooks/useUsers";
import CreateUserModal from "./CreateUserModal";
import EditUserModal from "./EditUserModal";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { KeyRound } from "lucide-react";
import { FiCopy } from "react-icons/fi";
const UserManagement: React.FC = () => {
  const { users, loading, toggleUserStatus, deleteUser, profile } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const url = import.meta.env.VITE_BACKEND_URL;
  console.log(selectedUser, "selectedUser");
  const roles = ["All", "Admin", "Manager", "BD Executive"];
  const statuses = ["All", "Active", "Inactive"];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "All" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "All" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleChangePassword = (userId, newPassword) => {
    if (!newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }

    fetch(`${url}/api/users/${userId}/change-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          // Backend sent an error response (e.g., 400, 404, 500)
          throw new Error(data.message || "Something went wrong");
        }

        // Success case
        toast.success(data.message);
        setShowPasswordModal(false);
        setNewPassword("");
      })
      .catch((err) => {
        console.error("Password change error:", err);
        toast.error(err.message || "Error updating password");
      });
  };

  const handleToggleStatus = async (
    userId: string,
    currentStatus: "Active" | "Inactive"
  ) => {
    try {
      await toggleUserStatus(userId, currentStatus);
      toast.success(
        `User ${
          currentStatus === "Active" ? "deactivated" : "activated"
        } successfully`
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${userName}? This action cannot be undone.`
      )
    ) {
      try {
        await deleteUser(userId);
      } catch (error: any) {
        toast.error(error.message || "Failed to delete user");
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Manager":
        return "bg-purple-100 text-purple-800";
      case "BD Executive":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "Active"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            User Management
          </h2>
          <p className="text-gray-300 mt-1">
            Manage system users and their permissions
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="gradient-primary text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass overflow-auto rounded-xl p-6 border border-white/30 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              autoComplete="off"
              name="search"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-300" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-xl border border-white/30 shadow-xl">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No users found
            </h3>
            <p className="text-gray-300">
              {searchTerm || roleFilter !== "All" || statusFilter !== "All"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first user"}
            </p>
          </div>
        ) : (
          <div className="o overflow-x-auto w-full">
            <table className="min-w-full">
              <thead className="bg-white/10 border-b border-white/20 whitespace-nowrap">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    User
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Contact
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Role
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Created
                  </th>
                  {profile?.role === "Admin" && (
                    <th className="text-left py-4 px-6 font-semibold text-white">
                      View User
                    </th>
                  )}

                  <th className="text-right py-4 px-6 font-semibold text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-semibold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-300">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                          user.role
                        )}`}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          user.status
                        )}`}
                      >
                        {user.status === "Active" ? (
                          <UserCheck className="w-3 h-3 mr-1" />
                        ) : (
                          <UserX className="w-3 h-3 mr-1" />
                        )}
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300 text-sm">
                      {format(new Date(user.created_at), "MMM dd, yyyy")}
                    </td>
                    {profile?.role === "Admin" && (
                      <td className="flex items-center gap-2">
                        {user._id ? (
                          <>
                            <span
                              className="text-gray-300 text-sm cursor-pointer"
                              title={user._id}
                            >
                              {user._id.slice(0, 8)}... {/* short preview */}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(user._id);
                                toast.success("User ID copied!");
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="Copy User ID"
                            >
                              <FiCopy size={16} />
                            </button>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                    )}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                          title="Edit User"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleToggleStatus(user._id, user.status)
                          }
                          className={`p-2 transition-colors hover:bg-white/20 rounded-lg ${
                            user.status === "Active"
                              ? "text-gray-400 hover:text-orange-400"
                              : "text-gray-400 hover:text-green-400"
                          }`}
                          title={
                            user.status === "Active"
                              ? "Deactivate User"
                              : "Activate User"
                          }
                        >
                          {user.status === "Active" ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id, user.name)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/20 rounded-lg"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPasswordModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-yellow-400 transition-colors hover:bg-white/20 rounded-lg"
                          title="Change Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* change password */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 w-96">
            <h2 className="text-lg font-semibold text-white mb-4">
              Change Password
            </h2>

            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              autoComplete="new-password"
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none mb-4"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword("");
                }}
                className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleChangePassword(selectedUser._id, newPassword)
                }
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
};

export default UserManagement;
