// const express = require("express");
// const router = express.Router();
// const Attendance = require("../models/attendance");
// const authMiddleware = require("../middleware/auth");

// // Get all attendance records (Admin/Manager)
// router.get("/", authMiddleware, async (req, res) => {
//   try {
//     const records = await Attendance.find().populate("user", "name role email");
//     const formatted = records.map((rec) => ({
//       id: rec._id,
//       user_id: rec.user,
//       name: rec.user.name,
//       role: rec.user.role,
//       date: rec.date,
//       lastLogin: rec.loginTime,
//       lastLogout: rec.logoutTime,
//       totalHours: rec.totalHours,
//       status: rec.status,
//       notes: rec.notes || "",
//     }));
//     res.json(formatted);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Clear all attendance records
// router.delete("/clear", async (req, res) => {
//   try {
//     await Attendance.deleteMany({});
//     res.status(200).json({ message: "All attendance records cleared successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to clear attendance", error });
//   }
// });


// module.exports = router;


const express = require("express");
const router = express.Router();
const Attendance = require("../models/attendance");
const authMiddleware = require("../middleware/auth");


// -----------------------------
// 3. Get Today’s Attendance
// -----------------------------
// GET /api/attendance/all
router.get("/all", async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("user_id", "name email") // optional: include user info
      .sort({ date: -1 }); // latest first

    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



router.get("/today/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const record = await Attendance.findOne({ user_id: userId, date: today });

    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------
// 4. Get Monthly Attendance
// -----------------------------
router.get("/monthly/:userId/:month", async (req, res) => {
  try {
    const { userId, month } = req.params; // month = "2025-09"

    const records = await Attendance.find({
      user_id: userId,
      date: { $regex: `^${month}` }, // match all YYYY-MM-DD in that month
    });
  console.log(records)
    const presentDays = records.length;
    const totalHours = records.reduce((sum, r) => sum + r.totalHours, 0);

    res.json({ success: true, presentDays, totalHours, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------
// 5. Clear All Attendance
// -----------------------------
router.delete("/clear", async (req, res) => {
  try {
    await Attendance.deleteMany({});
    res.json({ success: true, message: "All attendance records cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

