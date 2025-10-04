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

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  session: string | null;
  loading: boolean;
  attendanceloading: boolean;
  attendanceRecords: AttendanceRecord[];
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  markAttendance: (type: "login" | "logout") => Promise<void>;
  getAttendanceSummary: (records: AttendanceRecord[]) => AttendanceSummary;
  getTodayAttendance: () => AttendanceRecord | null;
  refetchAttendance: () => Promise<void>;
  getAuthToken: () => string | null;
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

  const url = import.meta.env.VITE_BACKEND_URL;
  const getAuthToken = () => localStorage.getItem("token");

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

  useEffect(() => {
    if (!session) return;

    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        signOut(); // just call intentional logout
      }, 5 * 60 * 1000); // 5 minutes
    };

    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer));

    resetTimer(); // start timer

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
        // call backend to auto logout
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

        // clear local storage
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
     Attendance: Fetch Records
  ------------------------------ */
  const refetchAttendance = useCallback(async () => {
    setAttendanceLoading(true);

    try {
      const res = await axios.get(`${url}/api/attendance/all`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      const records = res.data.records; // <-- use records here

      const transformed = records
        .filter((rec: any) => rec && rec.user_id) // skip null user_id
        .map((rec: any) => ({
          _id: rec._id,
          userId: rec.user_id?._id || "unknown",
          name: rec.user_id?.name || "Unknown User",
          role: rec.user_id?.role || "Unknown",
          date: rec.date,
          lastLogin: rec.sessions?.length
            ? rec.sessions[rec.sessions.length - 1].loginTime
            : null,
          lastLogout: rec.sessions?.length
            ? rec.sessions[rec.sessions.length - 1].logoutTime
            : null,
          totalHours: rec.totalHours || 0,
          status: rec.status || "Present",
        }));

      setAttendanceRecords(transformed);
      console.log("Fetched attendance:", transformed); // check output
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
      // You can also refresh attendance state if you maintain it
    } catch (err) {
      console.error("Error clearing attendance:", err);
      alert("Failed to clear attendance");
    }
  };

  useEffect(() => {
    refetchAttendance();
  }, []);

  /* -----------------------------
     Attendance: Mark login/logout
  ------------------------------ */
  const markAttendance = async (type: "login" | "logout") => {
    try {
      await axios.post(
        `${url}/api/attendance/${type}`,
        {},
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      await refetchAttendance();
    } catch (err: any) {
      console.error(`Failed to mark ${type}:`, err);
      throw err;
    }
  };

  /* -----------------------------
     Attendance: Helpers
  ------------------------------ */
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
  console.log(attendanceRecords, "attendanceRecords rr");
  const getTodayAttendance = (): AttendanceRecord | null => {
    if (!profile) return null;
    const today = new Date().toISOString().split("T")[0];
    return (
      attendanceRecords.find(
        (record) => record.userId === profile.id && record.date === today
      ) || null
    );
  };

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
