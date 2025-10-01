const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/activelogs");

router.get("/activities", async (req, res) => {
  try {
    const logs = await ActivityLog.find()
    // optional: lead details
      .sort({ timestamp: -1 }); // latest first

    res.status(200).json(logs);
  } catch (err) {
    console.error("Error fetching activities:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
