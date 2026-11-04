const { sendTaskAssignedEmail } = require("../utils/sendEmail");
const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/Users");
const Task = require("../models/Task");

const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

// All routes require Admin authentication
router.use(protect, requireAdmin);

// Get all registered users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({ role: "User" })
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

// Get all tasks with user details
router.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("userId", "name email")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Admin tasks error:", error);

    res.status(500).json({
      message: "Failed to fetch tasks",
    });
  }
});

// Admin assigns a task to a user
router.post("/assign-task", async (req, res) => {
  try {
    const {
      title,
      description,
      userId,
      priority,
      dueDate,
    } = req.body;

    // Validate task title
    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    // Validate selected user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "A valid user must be selected",
      });
    }

    // Verify that the selected user exists
    const assignedUser = await User.findOne({
      _id: userId,
      role: "User",
    });

    if (!assignedUser) {
      return res.status(404).json({
        message: "Selected user not found",
      });
    }

    // Validate priority
    const allowedPriorities = ["Low", "Medium", "High"];

    const taskPriority = priority || "Medium";

    if (!allowedPriorities.includes(taskPriority)) {
      return res.status(400).json({
        message: "Invalid task priority",
      });
    }

    // Validate optional due date
    let parsedDueDate = null;

    if (dueDate) {
      parsedDueDate = new Date(dueDate);

      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          message: "Invalid due date",
        });
      }
    }

    // Create task in MongoDB
    const task = await Task.create({
      title: title.trim(),
      description: description || "",
      userId: assignedUser._id,
      assignedBy: req.user.userId,
      priority: taskPriority,
      dueDate: parsedDueDate,
      status: "Pending",
    });

    // Populate task details
    const populatedTask = await Task.findById(task._id)
      .populate("userId", "name email")
      .populate("assignedBy", "name email");

    // Send email notification after task is saved
    let emailSent = false;

    try {
      await sendTaskAssignedEmail({
        to: assignedUser.email,
        userName: assignedUser.name,
        taskTitle: populatedTask.title,
        description: populatedTask.description,
        priority: populatedTask.priority,
        dueDate: populatedTask.dueDate,
        assignedByName: populatedTask.assignedBy?.name,
      });

      emailSent = true;
    } catch (emailError) {
      // Email failure should not undo the task assignment
      console.error(
        "Task assigned, but email notification failed:",
        emailError.message
      );
    }

    return res.status(201).json({
      message: "Task assigned successfully",
      task: populatedTask,
      emailSent,
    });
  } catch (error) {
    console.error("Assign task error:", error);

    res.status(500).json({
      message: "Failed to assign task",
    });
  }
});

module.exports = router;