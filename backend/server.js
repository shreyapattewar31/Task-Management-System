const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

const Task = require("./models/Task");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminroutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const reportRoutes = require("./routes/reportRoutes");
const swaggerSpec = require("./swagger");
const { sendTaskCompletedWhatsApp } = require("./utils/sendWhatsApp");
const { protect } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://task-management-system-roan-one.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ─── COOP / COEP fix ─────────────────────────────────────────────────────
// Remove COOP / COEP headers that can block Google Sign‑In communication.
// These headers are added by some hosting platforms (Render, Vercel) and
// prevent the Google Identity Services iframe from posting messages back.
app.use((req, res, next) => {
  res.removeHeader('Cross-Origin-Opener-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  next();
});

// ─── Swagger docs ─────────────────────────────────────────────────────────────
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Task Management API Docs",
  })
);

// Raw spec for programmatic access
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ─── Health check ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: API is running
 */
app.get("/", (req, res) => res.status(200).send("Task Management API is running"));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);

// ─── Task routes ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: List current user's tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Pending, "In Progress", Done, "On Hold"] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [Low, Medium, High] }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, dueDate, priority, status, title] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated task list
 *       401:
 *         description: Unauthorized
 */
app.get("/api/tasks", protect, async (req, res) => {
  try {
    const {
      search = "", status = "", priority = "",
      sortBy = "createdAt", sortOrder = "desc",
      page = 1, limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = { userId: req.user.userId };
    if (search.trim()) query.title = new RegExp(search.trim(), "i");
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const allowedSort = ["createdAt", "dueDate", "priority", "status", "title"];
    const sortField = allowedSort.includes(sortBy) ? sortBy : "createdAt";
    const sortDir = sortOrder === "asc" ? 1 : -1;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate("assignedBy", "name email")
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(query),
    ]);

    res.status(200).json({ tasks, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error("Fetch tasks error:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string }
 *               priority: { type: string }
 *               dueDate: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         description: Validation error
 */
app.post("/api/tasks", protect, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const newTask = await Task.create({
      title: title.trim(), description, status, priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: req.user.userId,
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ message: "Failed to create task" });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       200:
 *         description: Task updated
 *       404:
 *         description: Task not found
 */
app.put("/api/tasks/:id", protect, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    // Fetch the task BEFORE updating so we can compare old vs new status
    const existingTask = await Task.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!existingTask) return res.status(404).json({ message: "Task not found" });

    const wasAlreadyDone = existingTask.status === "Done";
    const isNowDone      = status === "Done";

    // Apply the update
    existingTask.title       = title       ?? existingTask.title;
    existingTask.description = description ?? existingTask.description;
    existingTask.status      = status      ?? existingTask.status;
    existingTask.priority    = priority    ?? existingTask.priority;
    existingTask.dueDate     = dueDate !== undefined
      ? (dueDate ? new Date(dueDate) : null)
      : existingTask.dueDate;

    const updatedTask = await existingTask.save();

    // Send WhatsApp only when transitioning INTO Done (not if it was already Done)
    if (isNowDone && !wasAlreadyDone) {
      // Fetch the user's name for the notification message
      const User = require("./models/Users");
      const taskUser = await User.findById(req.user.userId).select("name");

      // Fire and forget — do NOT await, so the API response is instant
      sendTaskCompletedWhatsApp({
        userName:    taskUser?.name || "A user",
        taskTitle:   updatedTask.title,
        priority:    updatedTask.priority || "Medium",
        completedAt: new Date(),
      }).then((result) => {
        if (result.sent) {
          console.log(`WhatsApp notification sent for task "${updatedTask.title}" — msgId: ${result.messageId}`);
        }
      }).catch((err) => {
        // Task is already saved — just log the WhatsApp failure
        console.error(`WhatsApp notification failed for task "${updatedTask.title}":`, err.message);
      });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted
 *       404:
 *         description: Task not found
 */
app.delete("/api/tasks/:id", protect, async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!deletedTask) return res.status(404).json({ message: "Task not found" });
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ─── MongoDB + server ─────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
