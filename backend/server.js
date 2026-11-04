
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Task = require("./models/Task");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminroutes");
const { protect } = require("./middleware/auth");
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: "https://task-management-system-roan-one.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//authenticate routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
// Test route
app.get("/", (req, res) => {
  res.send("Task Management API is running");
});

// Get tasks belonging to the logged-in user
app.get("/api/tasks", protect, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Fetch tasks error:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// Create a task for the logged-in user
app.post("/api/tasks", protect, async (req, res) => {
  try {
    const { title, description, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    const newTask = await Task.create({
      title: title.trim(),
      description,
      status,
      userId: req.user.userId,
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ message: "Failed to create task" });
  }
});

// Update only a task owned by the logged-in user
app.put("/api/tasks/:id", protect, async (req, res) => {
  try {
    const { title, description, status } = req.body;

    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
      },
      { title, description, status },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete only a task owned by the logged-in user
app.delete("/api/tasks/:id", protect, async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!deletedTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: error.message });
  }
});
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

