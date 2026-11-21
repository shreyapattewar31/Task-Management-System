/**
 * sendWhatsApp.js – Jalpi WhatsApp Business API integration
 *
 * Sends a WhatsApp notification via Jalpi when a task is marked Done.
 *
 * Required env vars (set on Render):
 *   - JALPI_API_URL          – Base URL, e.g. https://app.jalpi.com/api/v1/sendTemplateMessage
 *   - JALPI_ACCESS_TOKEN     – Your Instance API Key
 *   - JALPI_TEMPLATE_NAME    – Name of the approved template (e.g. task_completed_notify)
 *   - ADMIN_WHATSAPP_NUMBER  – Destination number (E.164 without +)
 *   - JALPI_LANGUAGE_CODE    – Optional language code, defaults to "en_US"
 */

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
  const templateName = process.env.JALPI_TEMPLATE_NAME;
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
  const language = process.env.JALPI_LANGUAGE_CODE || "en_US";

  // Guard – skip silently if any credential is missing
  if (!apiUrl || !token || !templateName || !adminNumber) {
    console.warn("⚠️ Jalpi credentials missing — skipping WhatsApp notification.");
    return { sent: false, reason: "missing_credentials" };
  }

  const payload = {
    key: token,
    to: adminNumber,
    languageCode: language,
    TemplateName: templateName,
    headertype: "text",
    headertext: "Task Completed",
    BodyParameter: [
      { type: "text", text: userName },
      { type: "text", text: taskTitle },
      { type: "text", text: priority || "Medium" },
      { type: "text", text: completedAt },
    ],
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Jalpi WhatsApp notification failed:", data?.ErrorMessage || data);
    return { sent: false, reason: data?.ErrorMessage || "request_failed" };
  }

  if (data.ErrorCode !== "000") {
    console.error("Jalpi WhatsApp notification failed:", data?.ErrorMessage || data);
    return { sent: false, reason: data?.ErrorMessage || "api_error" };
  }

  return { sent: true, messageId: data?.Data?.[0]?.MaskId || data?.Data?.[0]?.Key };
}

module.exports = { sendTaskCompletedWhatsApp };