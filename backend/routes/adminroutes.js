const express = require("express");
const User = require("../models/Users");
const Task = require("../models/Task");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

// Every route in this file requires a valid Admin token
router.use(protect, requireAdmin);

// Get all registered users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
});

// Get all tasks from all users
router.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Admin tasks error:", error);
    res.status(500).json({
      message: "Failed to fetch tasks",
    });
  }
});

module.exports = router;