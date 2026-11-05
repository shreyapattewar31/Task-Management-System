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

// ─── USERS ────────────────────────────────────────────────────────────────────

// GET /admin/users  — list all non-admin users with optional search + pagination
router.get("/users", async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = { role: "User" };

    if (search.trim()) {
      const re = new RegExp(search.trim(), "i");
      query.$or = [{ name: re }, { email: re }];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -passwordResetToken -passwordResetExpires")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      users,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// PATCH /admin/users/:id  — edit role or active status
router.patch("/users/:id", async (req, res) => {
  try {
    const { role, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Prevent admin from demoting/deactivating themselves
    if (req.params.id === req.user.userId.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot modify your own account here." });
    }

    const updates = {};
    if (role !== undefined) {
      if (!["User", "Admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      updates.role = role;
    }
    if (isActive !== undefined) {
      updates.isActive = Boolean(isActive);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated", user });
  } catch (error) {
    console.error("Admin user patch error:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// DELETE /admin/users/:id  — permanently delete user and their tasks
router.delete("/users/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (req.params.id === req.user.userId.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account." });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove all tasks that belonged to this user
    await Task.deleteMany({ userId: req.params.id });

    res.status(200).json({ message: "User and their tasks deleted" });
  } catch (error) {
    console.error("Admin user delete error:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// ─── TASKS ────────────────────────────────────────────────────────────────────

// GET /admin/tasks  — all tasks with search / filter / sort / pagination
router.get("/tasks", async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      priority = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (search.trim()) {
      query.title = new RegExp(search.trim(), "i");
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const allowedSort = ["createdAt", "dueDate", "priority", "status", "title"];
    const sortField = allowedSort.includes(sortBy) ? sortBy : "createdAt";
    const sortDir = sortOrder === "asc" ? 1 : -1;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate("userId", "name email")
        .populate("assignedBy", "name email")
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(query),
    ]);

    res.status(200).json({
      tasks,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Admin tasks error:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// POST /admin/assign-task  — assign a new task to a user
router.post("/assign-task", async (req, res) => {
  try {
    const { title, description, userId, priority, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "A valid user must be selected" });
    }

    const assignedUser = await User.findOne({ _id: userId, role: "User" });

    if (!assignedUser) {
      return res.status(404).json({ message: "Selected user not found" });
    }

    const allowedPriorities = ["Low", "Medium", "High"];
    const taskPriority = priority || "Medium";

    if (!allowedPriorities.includes(taskPriority)) {
      return res.status(400).json({ message: "Invalid task priority" });
    }

    let parsedDueDate = null;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({ message: "Invalid due date" });
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description || "",
      userId: assignedUser._id,
      assignedBy: req.user.userId,
      priority: taskPriority,
      dueDate: parsedDueDate,
      status: "Pending",
    });

    const populatedTask = await Task.findById(task._id)
      .populate("userId", "name email")
      .populate("assignedBy", "name email");

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
    res.status(500).json({ message: "Failed to assign task" });
  }
});

// PUT /admin/tasks/:id  — admin edits any task
router.put("/tasks/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const { title, description, status, priority, dueDate } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("userId", "name email")
      .populate("assignedBy", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task updated", task });
  } catch (error) {
    console.error("Admin task update error:", error);
    res.status(500).json({ message: "Failed to update task" });
  }
});

// DELETE /admin/tasks/:id  — admin deletes any task
router.delete("/tasks/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Admin task delete error:", error);
    res.status(500).json({ message: "Failed to delete task" });
  }
});

module.exports = router;
