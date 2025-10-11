const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/users");
const Attendance = require("../models/attendance");
const authMiddleware = require("../middleware/auth");

const ActivityLog = require("../models/activelogs");

// POST /api/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email is not registered" });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Save login time
    user.lastLogin = new Date();
    user.lastLogout = "";

    await user.save();

    // Handle missed logout from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateStr = yesterday.toISOString().split("T")[0];

    const yesterdayRecord = await Attendance.findOne({
      user_id: user._id,
      date: yesterdayDateStr,
    });

    if (yesterdayRecord) {
      const lastSession =
        yesterdayRecord.sessions[yesterdayRecord.sessions.length - 1];
      if (lastSession && !lastSession.logoutTime) {
        // Set standard logout time at 19:00 yesterday
        const [hours, minutes] = [19, 0];
        const autoLogoutTime = new Date(yesterdayDateStr);
        autoLogoutTime.setHours(hours, minutes, 0, 0);

        lastSession.logoutTime = autoLogoutTime;

        const diffMs =
          new Date(lastSession.logoutTime) - new Date(lastSession.loginTime);
        lastSession.durationHours = diffMs / (1000 * 60 * 60);

        // Recalculate total hours
        yesterdayRecord.totalHours = yesterdayRecord.sessions.reduce(
          (sum, s) => sum + (s.durationHours || 0),
          0
        );

        // Attendance status logic
        const firstLogin = new Date(yesterdayRecord.sessions[0].loginTime);
        const firstLoginHour =
          firstLogin.getHours() + firstLogin.getMinutes() / 60;

        if (yesterdayRecord.totalHours > 6) {
          yesterdayRecord.status = "Present";
        } else if (yesterdayRecord.totalHours >= 4) {
          yesterdayRecord.status = "Half-Day";
        } else {
          yesterdayRecord.status = firstLoginHour > 10 ? "Late" : "Half-Day";
        }

        await yesterdayRecord.save();
      }
    }

    // Skip attendance creation for Admin
    if (user.role !== "Admin") {
      const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
      let record = await Attendance.findOne({ user_id: user._id, date: today });

      if (!record) {
        record = new Attendance({
          user_id: user._id,
          date: today,
          sessions: [],
        });
      }

      record.sessions.push({ loginTime: new Date() });
      record.status = "Present";
      await record.save();
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET, // Use secret from .env
      { expiresIn: "1d" }
    );

    // Return user profile (exclude password)
    const userProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      appPassword: user.appPassword,
      status: user.status,
      phone: user.phone || null,
      created_at: user.created_at,
      updated_at: user.updated_at,
      lastLogin: user.lastLogin,
    };

    res.json({ token, user: userProfile });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const {
      autoLogout,
      lastLoginDate,
      staticLogoutTime = "19:00",
      userIdentifier,
    } = req.body || {};

    // 1️⃣ Find the user
    let user;
    if (autoLogout && userIdentifier) {
      user = await User.findById(userIdentifier);
    } else {
      user = await User.findById(req.user._id);
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    // Skip attendance update for Admin
    if (user.role === "Admin") {
      user.lastLogout = new Date();
      await user.save();
      return res.json({
        message: "Admin logout recorded. No attendance created.",
      });
    }

    // 2️⃣ Determine logout time and record date
    let logoutTime = new Date();
    let recordDate = new Date().toISOString().split("T")[0]; // today

    if (autoLogout && lastLoginDate && staticLogoutTime) {
      const [hours, minutes] = staticLogoutTime.split(":").map(Number);
      const autoDate = new Date(lastLoginDate);
      autoDate.setHours(hours, minutes, 0, 0);
      logoutTime = autoDate;
      recordDate = lastLoginDate;
    }

    user.lastLogout = logoutTime;
    await user.save();

    // 3️⃣ Find the attendance record
    const record = await Attendance.findOne({
      user_id: user._id,
      date: recordDate,
    });
    if (!record) {
      return res.status(400).json({ message: "No login found for this day" });
    }

    // 4️⃣ Update last session
    const lastSession = record.sessions[record.sessions.length - 1];
    if (!lastSession.logoutTime) {
      lastSession.logoutTime = logoutTime;

      const diffMs =
        new Date(lastSession.logoutTime) - new Date(lastSession.loginTime);
      lastSession.durationHours = diffMs / (1000 * 60 * 60);

      // 5️⃣ Recalculate total hours
      record.totalHours = record.sessions.reduce(
        (sum, s) => sum + (s.durationHours || 0),
        0
      );

      // 6️⃣ Attendance Status Logic
      const firstLogin = new Date(record.sessions[0].loginTime);
      const firstLoginHour =
        firstLogin.getHours() + firstLogin.getMinutes() / 60;

      let status;
      if (record.totalHours > 6) {
        status = "Present";
      } else if (record.totalHours >= 4) {
        status = "Half-Day";
      } else {
        status = firstLoginHour > 10 ? "Late" : "Half-Day";
      }

      record.status = status;
      await record.save();
    }

    res.json({
      message: autoLogout
        ? "Auto-logout recorded successfully"
        : "Logout recorded successfully",
      status: record.status,
      totalHours: record.totalHours,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/latest", async (req, res) => {
  try {
    // Fetch latest 20 logs, sorted by timestamp descending
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(20);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
