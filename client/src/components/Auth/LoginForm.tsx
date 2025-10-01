

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, LogIn, Briefcase } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

interface LoginFormData {
  email: string;
  password: string;
}

const demoCredentials = [
  { role: "Admin", email: "admin@jobsterritory.com", password: "admin123" },
  {
    role: "Manager",
    email: "manager@jobsterritory.com",
    password: "manager123",
  },
  {
    role: "BD Executive",
    email: "executive@jobsterritory.com",
    password: "executive123",
  },
];

const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await signIn(data.email, data.password);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loginWithDemo = (email: string, password: string) => {
    setLoading(true);
    signIn(email, password)
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl shadow-2xl p-8 relative">
          <div className="text-center mb-8">
            <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg pulse-glow">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Jobs Territory CRM
            </h1>
            <p className="text-gray-200 text-lg">
              Welcome back to your workspace
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Email Address
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
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-300">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password", {
                    required: "Password is required",
                  })}
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-4 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-300">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

        
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
