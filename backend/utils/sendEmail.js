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

async function sendPasswordResetEmail({ to, userName, resetUrl }) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_APP_PASSWORD) {
    throw new Error("SMTP credentials are missing from the environment.");
  }

  const safeName = escapeHtml(userName || "there");
  const safeUrl = escapeHtml(resetUrl);

  return transporter.sendMail({
    from: `"Task Management System" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: "Reset your password",
    text: [
      `Hello ${userName || "there"},`,
      "",
      "You requested a password reset for your Task Management System account.",
      "",
      `Reset your password using this link (valid for 1 hour):`,
      resetUrl,
      "",
      "If you did not request this, you can safely ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #222;">
        <h2 style="color: #2563eb;">Reset your password</h2>
        <p>Hello ${safeName},</p>
        <p>You requested a password reset for your Task Management System account.</p>
        <p>Click the button below to reset your password. This link is valid for <strong>1 hour</strong>.</p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${safeUrl}"
             style="display: inline-block; padding: 14px 28px; background: #2563eb; color: #fff;
                    text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>

        <p style="color: #64748b; font-size: 13px;">
          If the button doesn't work, copy and paste this URL into your browser:<br/>
          <a href="${safeUrl}" style="color: #2563eb;">${safeUrl}</a>
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

module.exports = { sendTaskAssignedEmail, sendPasswordResetEmail };