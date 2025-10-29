const express = require("express");
const router = express.Router();
const User = require("../models/users");
const CallActivity = require("../models/call");
const authMiddleware = require("../middleware/auth"); // JWT auth middleware

// GET /api/users - Get all users
router.get("/", authMiddleware, async (req, res) => {
  try {
    const users = await User.find().sort({ created_at: -1 });

    res.status(201).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users - Create new user
router.post("/", authMiddleware, async (req, res) => {
  const { name, email, password, role, phone, appPassword } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });
    const user = new User({
      name,
      email,
      password,
      appPassword, // ⚠️ hash this before saving!
      role,
      phone,
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/:id/status - Toggle user status
router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = user.status === "Active" ? "Inactive" : "Active";
    user.updated_at = Date.now();
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id - Update user info
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, email, role, phone, status,appPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.status = status || user.status;
    user.phone = phone || user.phone;
    user.appPassword = appPassword || user.appPassword;
    user.updated_at = Date.now();
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id - Delete user
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/log", async (req, res) => {
  try {
    const { userId, leadId, phone } = req.body;

    if (!userId || !leadId || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create a new call activity record
    const newCall = await CallActivity.create({
      userId,
      leadId,
      phone,
      timestamp: new Date(),
    });

    // Optionally increment total calls for that user
    await User.findByIdAndUpdate(userId, { $inc: { no_of_calls: 1 } });

    res
      .status(201)
      .json({ message: "Call logged successfully", call: newCall });
  } catch (err) {
    console.error("Error logging call:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



router.get("/all", async (req, res) => {
  try {
    // Optionally, you can populate user or lead info
    const calls = await CallActivity.find()
      .sort({ timestamp: -1 }) // latest first
      .populate("userId", "name email") // only name and email from User
      .populate("leadId", "name company"); // if lead is a separate model

    res.status(200).json({ calls });
  } catch (err) {
    console.error("Error fetching call activities:", err);
    res.status(500).json({ message: "Failed to fetch call activities" });
  }
});

router.get("/calls/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const calls = await CallActivity.find({ userId })
        .sort({ timestamp: -1 })
        .populate("leadId", "company_name points_of_contact") // populate company_name from lead
        .populate("userId", "name email");
       res.status(200).json({ calls });
    } catch (err) {
      console.error("Error fetching call activities:", err);
      res.status(500).json({ message: "Failed to fetch call activities" });
    }
});


module.exports = router;
