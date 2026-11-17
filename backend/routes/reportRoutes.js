const express = require("express");
const Task = require("../models/Task");
const User = require("../models/Users");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

/**
 * @swagger
 * /api/reports/user:
 *   get:
 *     summary: Get task statistics for the logged-in user
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User report data
 */
router.get("/user", protect, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [all, byStatus, byPriority, overdue, completedThisMonth] =
      await Promise.all([
        Task.countDocuments({ userId }),
        Task.aggregate([
          { $match: { userId: require("mongoose").Types.ObjectId.createFromHexString(userId.toString()) } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Task.aggregate([
          { $match: { userId: require("mongoose").Types.ObjectId.createFromHexString(userId.toString()) } },
          { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]),
        Task.countDocuments({
          userId,
          dueDate: { $lt: new Date() },
          status: { $ne: "Done" },
        }),
        Task.countDocuments({
          userId,
          status: "Done",
          updatedAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        }),
      ]);

    // Last 6 months task creation trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const trend = await Task.aggregate([
      {
        $match: {
          userId: require("mongoose").Types.ObjectId.createFromHexString(userId.toString()),
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.status(200).json({
      total: all,
      overdue,
      completedThisMonth,
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      byPriority: Object.fromEntries(byPriority.map((p) => [p._id, p.count])),
      trend: trend.map((t) => ({
        label: new Date(t._id.year, t._id.month - 1).toLocaleString("en-US", { month: "short", year: "2-digit" }),
        count: t.count,
      })),
    });
  } catch (err) {
    console.error("User report error:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

/**
 * @swagger
 * /api/reports/admin:
 *   get:
 *     summary: Get system-wide statistics (admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin report data
 */
router.get("/admin", protect, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalTasks,
      byStatus,
      byPriority,
      overdue,
      topUsers,
    ] = await Promise.all([
      User.countDocuments({ role: "User" }),
      Task.countDocuments(),
      Task.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Task.countDocuments({
        dueDate: { $lt: new Date() },
        status: { $ne: "Done" },
      }),
      Task.aggregate([
        { $group: { _id: "$userId", taskCount: { $sum: 1 } } },
        { $sort: { taskCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            name: "$user.name",
            email: "$user.email",
            taskCount: 1,
          },
        },
      ]),
    ]);

    // Last 6 months trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const trend = await Task.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.status(200).json({
      totalUsers,
      totalTasks,
      overdue,
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      byPriority: Object.fromEntries(byPriority.map((p) => [p._id, p.count])),
      topUsers,
      trend: trend.map((t) => ({
        label: new Date(t._id.year, t._id.month - 1).toLocaleString("en-US", { month: "short", year: "2-digit" }),
        count: t.count,
      })),
    });
  } catch (err) {
    console.error("Admin report error:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

module.exports = router;
