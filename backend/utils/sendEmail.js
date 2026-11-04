const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: (process.env.SMTP_APP_PASSWORD || "").replace(/\s/g, ""),
  },
});

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendTaskAssignedEmail({
  to,
  userName,
  taskTitle,
  description,
  priority,
  dueDate,
  assignedByName,
}) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_APP_PASSWORD) {
    throw new Error("SMTP credentials are missing from the environment.");
  }

  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString("en-IN")
    : "Not specified";

  const safeName = escapeHtml(userName || "there");
  const safeTitle = escapeHtml(taskTitle);
  const safeDescription = escapeHtml(description || "No description provided.");
  const safePriority = escapeHtml(priority || "Medium");
  const safeDueDate = escapeHtml(formattedDueDate);
  const safeAssignedBy = escapeHtml(assignedByName || "Admin");

  return transporter.sendMail({
    from: `"Task Management System" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: `New task assigned: ${taskTitle}`,
    text: [
      `Hello ${userName || "there"},`,
      "",
      `A new task has been assigned to you by ${assignedByName || "Admin"}.`,
      "",
      `Task: ${taskTitle}`,
      `Description: ${description || "No description provided."}`,
      `Priority: ${priority || "Medium"}`,
      `Due date: ${formattedDueDate}`,
      "",
      "Please log in to your Task Management System to view the task.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #222;">
        <h2 style="color: #2563eb;">A new task has been assigned</h2>
        <p>Hello ${safeName},</p>
        <p>
          <strong>${safeAssignedBy}</strong> assigned a new task to you.
        </p>

        <div style="padding: 16px; border: 1px solid #ddd; border-radius: 8px;">
          <h3>${safeTitle}</h3>
          <p>${safeDescription}</p>
          <p><strong>Priority:</strong> ${safePriority}</p>
          <p><strong>Due date:</strong> ${safeDueDate}</p>
        </div>

        <p>Please log in to your Task Management System to view the task.</p>
      </div>
    `,
  });
}

module.exports = { sendTaskAssignedEmail };