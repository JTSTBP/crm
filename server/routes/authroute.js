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

    const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

    

    let record = await Attendance.findOne({ user_id: user._id, date: today });

    if (!record) {
      record = new Attendance({ user_id: user._id, date: today, sessions: [] });
    }

    // Add new session with loginTime
    record.sessions.push({ loginTime: new Date() });
    record.status = "Present";

    await record.save();

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

// routes/auth.js


router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    user.lastLogout = now;
    await user.save();

    const today = new Date().toISOString().split("T")[0];
    const record = await Attendance.findOne({ user_id: user._id, date: today });

    if (!record) {
      return res.status(400).json({ message: "No login found for today" });
    }

    const lastSession = record.sessions[record.sessions.length - 1];
    if (!lastSession.logoutTime) {
      lastSession.logoutTime = now;

      const diffMs =
        new Date(lastSession.logoutTime) - new Date(lastSession.loginTime);
      const diffHours = diffMs / (1000 * 60 * 60);
      lastSession.durationHours = diffHours;

      // Recalculate total hours
      record.totalHours = record.sessions.reduce(
        (sum, s) => sum + (s.durationHours || 0),
        0
      );

      // --- Attendance Status Logic ---
      const firstLogin = new Date(record.sessions[0].loginTime);
      const firstLoginHour =
        firstLogin.getHours() + firstLogin.getMinutes() / 60;

      let status;

      if (record.totalHours > 6) {
        console.log(status, "1");
        status = "Present";
      } else if (record.totalHours >= 4 && record.totalHours <= 6) {
        status = "Half-Day";
        console.log(status, "2");
      } else {
        // Less than 4 hours, check first login
        if (firstLoginHour > 10) {
          status = "Late";
          console.log(status, "3");
        } else {
          status = "Half-Day";
          console.log(status, "4"); // optional: you can also mark "Late" here
        }
      }

      record.status = status;
      await record.save();
    }

    res.json({
      message: "Logout recorded successfully",
      status: record.status,
      totalHours: record.totalHours,
    });
  } catch (err) {
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
