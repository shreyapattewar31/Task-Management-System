/**
 * sendWhatsApp.js – Jalpi WhatsApp Business API integration
 *
 * Sends a WhatsApp notification via Jalpi when a task is marked Done.
 *
 * Required env vars (set on Render):
 *   - JALPI_API_URL          – Base URL, e.g. https://api.jalpi.com/v1/whatsapp
 *   - JALPI_ACCESS_TOKEN     – Bearer token for authentication
 *   - JALPI_PHONE_NUMBER_ID  – The phone-number-id assigned by Jalpi
 *   - JALPI_TEMPLATE_NAME    – Name of the approved template (e.g. task_completed_notify)
 *   - ADMIN_WHATSAPP_NUMBER  – Destination number (E.164 without +)
 *   - JALPI_LANGUAGE_CODE    – Optional language code, defaults to "en"
 */

const fetch = require("node-fetch");

/**
 * Send a WhatsApp message via Jalpi.
 *
 * @param {object} params
 * @param {string} params.userName      - Name of the user who completed the task
 * @param {string} params.taskTitle     - Title of the completed task
 * @param {string} params.priority      - Task priority (Low / Medium / High)
 * @param {Date|string} params.completedAt - When the task was marked Done
 */
async function sendTaskCompletedWhatsApp({ userName, taskTitle, priority, completedAt }) {
  const apiUrl = process.env.JALPI_API_URL;
  const token = process.env.JALPI_ACCESS_TOKEN;
  const phoneId = process.env.JALPI_PHONE_NUMBER_ID;
  const templateName = process.env.JALPI_TEMPLATE_NAME;
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
  const language = process.env.JALPI_LANGUAGE_CODE || "en";

  console.log("DEBUG env:", { apiUrl, token, phoneId, templateName, adminNumber });

  // Guard – skip silently if any credential is missing
  if (!apiUrl || !token || !phoneId || !templateName || !adminNumber) {
    console.warn("⚠️ Jalpi credentials missing — skipping WhatsApp notification.");
    return { sent: false, reason: "missing_credentials" };
  }

  const payload = {
    to: adminNumber,
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: userName },
            { type: "text", text: taskTitle },
            { type: "text", text: priority || "Medium" },
            { type: "text", text: completedAt },
          ],
        },
      ],
    },
  };

  const response = await fetch(`${apiUrl}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    // Surface the error for debugging – do not throw to break the main flow
    console.error("Jalpi WhatsApp notification failed:", data?.error?.message || data);
    return { sent: false, reason: data?.error?.message || "request_failed" };
  }

  return { sent: true, messageId: data?.message_id || data?.id };
}

module.exports = { sendTaskCompletedWhatsApp };