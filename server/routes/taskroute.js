const express = require("express");
const router = express.Router();
const Task = require("../models/task");

// Create a task
router.post("/", async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/lead/:leadId", async (req, res) => {
  try {
    const { leadId } = req.params;

    // fetch tasks for this lead
    const tasks = await Task.find({ lead_id: leadId })
      .populate("user_id", "name email") // optional: populate user details
      .populate("lead_id", "company_name contact_name"); // optional: populate lead details

    res.status(200).json(tasks);
  } catch (err) {
    console.error("Error fetching tasks by lead:", err);
    res.status(500).json({ message: "Server error while fetching tasks" });
  }
});

// GET all tasks, optionally filtered by user_id
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    let query = {};
    if (userId) {
      query = { user_id: userId }; // filter tasks for this user
    }

    const tasks = await Task.find(query)
      .populate("user_id", "name email") // optional: populate user details
      .populate("lead_id", "company_name contact_name"); // optional: populate lead details
    res.status(200).json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ message: "Server error while fetching tasks" });
  }
});


// ✅ Update task by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // { new: true } makes sure it returns the updated document
    const updatedTask = await Task.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(400).json({ message: err.message });
  }
});

// Delete lead
router.delete("/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Lead deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
