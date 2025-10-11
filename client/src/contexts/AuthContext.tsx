

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import axios from "axios";

/* -----------------------------
   Interfaces
------------------------------ */
interface Profile {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "BD Executive";
  status: "Active";
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  _id: string;
  userId: string;
  name: string;
  role: string;
  date: string;
  lastLogin: string | null;
  lastLogout: string | null;
  totalHours: number;
  status: "Present" | "Absent" | "Half Day" | "Late";
  notes?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  lateDays: number;
  avgHours: number;
  totalHours: number;
  attendancePercentage: number;
}

interface UserType {
  _id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "BD Executive";
  status: "Active" | "Inactive";
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  session: string | null;
  loading: boolean;
  attendanceloading: boolean;
  attendanceRecords: AttendanceRecord[];
  users: UserType[];
  usersLoading: boolean;
  // Auth
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAuthToken: () => string | null;
  // Attendance
  markAttendance: (type: "login" | "logout") => Promise<void>;
  getAttendanceSummary: (records: AttendanceRecord[]) => AttendanceSummary;
  getTodayAttendance: () => AttendanceRecord | null;
  refetchAttendance: () => Promise<void>;
  clearAllAttendance: () => Promise<void>;
  // Users management
  fetchUsers: () => Promise<void>;
  createUser: (data: any) => Promise<void>;
  updateUser: (id: string, data: any) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

/* -----------------------------
   Context Setup
------------------------------ */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [attendanceloading, setAttendanceLoading] = useState(false);

  const [users, setUsers] = useState<UserType[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const url = import.meta.env.VITE_BACKEND_URL;

  const getAuthToken = () => localStorage.getItem("token");
  const API_URL = `${url}/api/users`;

  /* -----------------------------
     Restore session on mount
  ------------------------------ */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedProfile = localStorage.getItem("profile");
    if (token && storedProfile) {
      setSession(token);
      setProfile(JSON.parse(storedProfile));
      setUser({ email: JSON.parse(storedProfile).email });
    }
    setLoading(false);
  }, []);

  /* -----------------------------
     Auth: Sign In
  ------------------------------ */
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${url}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "lastLoginDate",
        new Date().toISOString().split("T")[0]
      );
      localStorage.setItem("profile", JSON.stringify(data.user));

      setSession(data.token);
      setProfile(data.user);
      setUser({ email: data.user.email });

      toast.success("Login successful!");
      await refetchAttendance(); // fetch attendance after login
      await fetchUsers(); // fetch users after login
    } catch (error: any) {
      toast.error(error.message || "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
     Auth: Sign Out
  ------------------------------ */
  const signOut = async () => {
    setLoading(true);
    try {
      await fetch(`${url}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session}` },
      });
      setUser(null);
      setProfile(null);
      setSession(null);
      localStorage.removeItem("token");
      localStorage.removeItem("profile");
      toast.success("Logged out successfully!");
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
     Auto logout / session timer
  ------------------------------ */
  useEffect(() => {
    if (!session) return;

    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => signOut(), 5 * 60 * 1000); // 5 min
    };

    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [session]);

  useEffect(() => {
    const runAutoLogout = async () => {
      const profile = localStorage.getItem("profile");
      const token = localStorage.getItem("token");
      if (!profile || !token) return;

      const user = JSON.parse(profile);
      const lastLoginDate = new Date(user.lastLogin)
        .toISOString()
        .split("T")[0];
      const today = new Date().toISOString().split("T")[0];

      if (lastLoginDate !== today) {
        await fetch(`${url}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userIdentifier: user.id,
            autoLogout: true,
            lastLoginDate,
            staticLogoutTime: "22:00",
          }),
        });

        localStorage.removeItem("profile");
        localStorage.removeItem("token");
        setProfile(null);
        setSession(null);
        setUser(null);
        toast.success("Auto-logout processed for previous day");
      }
    };
    runAutoLogout();
  }, []);

  /* -----------------------------
     Attendance
  ------------------------------ */
  const refetchAttendance = useCallback(async () => {
    setAttendanceLoading(true);
    try {
      const res = await axios.get(`${url}/api/attendance/all`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const records = res.data.records;
      console.log(records,"rr")
      const transformed = records
        .filter((rec: any) => rec && rec.user_id)
        .map((rec: any) => ({
          _id: rec._id,
          userId: rec.user_id?._id || "unknown",
          name: rec.user_id?.name || "Unknown User",
          role: rec.user_id?.role || "Unknown",
          date: rec.date,
          lastLogin: rec.sessions?.length
            ? rec.sessions[0].loginTime // ✅ first session = initial login
            : null,
          lastLogout: rec.sessions?.length
            ? rec.sessions[rec.sessions.length - 1].logoutTime
            : null,
          totalHours: rec.totalHours || 0,
          status: rec.status || "Present",
        }));
      setAttendanceRecords(transformed);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      setAttendanceLoading(false);
    }
  }, [url]);

  const clearAllAttendance = async () => {
    try {
      const res = await axios.delete(`${url}/api/attendance/clear`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      alert(res.data.message);
      await refetchAttendance();
    } catch (err) {
      console.error("Error clearing attendance:", err);
      alert("Failed to clear attendance");
    }
  };

  const markAttendance = async (type: "login" | "logout") => {
    try {
      await axios.post(
        `${url}/api/attendance/${type}`,
        {},
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }
      );
      await refetchAttendance();
    } catch (err) {
      console.error(`Failed to mark ${type}:`, err);
      throw err;
    }
  };

  const getAttendanceSummary = (
    records: AttendanceRecord[]
  ): AttendanceSummary => {
    const totalDays = records.length;
    const presentDays = records.filter((r) => r.status === "Present").length;
    const absentDays = records.filter((r) => r.status === "Absent").length;
    const halfDays = records.filter((r) => r.status === "Half Day").length;
    const lateDays = records.filter((r) => r.status === "Late").length;
    const totalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const avgHours = totalDays > 0 ? totalHours / totalDays : 0;
    const attendancePercentage =
      totalDays > 0
        ? Math.round(
            ((presentDays + lateDays + halfDays * 0.5) / totalDays) * 100
          )
        : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      halfDays,
      lateDays,
      avgHours: Math.round(avgHours * 100) / 100,
      totalHours: Math.round(totalHours * 100) / 100,
      attendancePercentage,
    };
  };

  const getTodayAttendance = (): AttendanceRecord | null => {
    if (!profile) return null;
    const today = new Date().toISOString().split("T")[0];
    return (
      attendanceRecords.find(
        (record) => record.userId === profile.id && record.date === today
      ) || null
    );
  };

  useEffect(() => {
    refetchAttendance();
  }, []);

  /* -----------------------------
     Users Management
  ------------------------------ */
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const createUser = async (data: any) => {
    try {
      await axios.post(API_URL, data, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      await fetchUsers();
      toast.success("User created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    }
  };

  const updateUser = async (id: string, data: any) => {
    try {
      const res = await axios.put(`${API_URL}/${id}`, data, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setUsers((prev) => prev.map((u) => (u._id === id ? res.data : u)));
      toast.success("User updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    }
  };

  const toggleUserStatus = async (id: string) => {
    try {
      const res = await axios.patch(`${API_URL}/${id}/status`, null, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setUsers((prev) => prev.map((u) => (u._id === id ? res.data : u)));
      toast.success("User status updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle status");
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success("User deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  useEffect(() => {
    if (session) fetchUsers();
  }, [session]);

  /* -----------------------------
     Provider
  ------------------------------ */
  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signOut,
        getAuthToken,
        attendanceRecords,
        attendanceloading,
        markAttendance,
        getAttendanceSummary,
        getTodayAttendance,
        refetchAttendance,
        clearAllAttendance,
        users,
        usersLoading,
        fetchUsers,
        createUser,
        updateUser,
        toggleUserStatus,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
