/**
 * Send a WhatsApp notification via Meta WhatsApp Cloud API.
 *
 * Uses the pre-approved "task_completed_notify" template:
 *
 *   ✅ Task Completed
 *   User: {{1}}
 *   Task: {{2}}
 *   Priority: {{3}}
 *   Completed at: {{4}}
 */

const GRAPH_API = "https://graph.facebook.com/v21.0";

/**
 * @param {object} params
 * @param {string} params.userName      - Name of the user who completed the task
 * @param {string} params.taskTitle     - Title of the completed task
 * @param {string} params.priority      - Task priority (Low / Medium / High)
 * @param {Date|string} params.completedAt - When the task was marked Done
 */
async function sendTaskCompletedWhatsApp({ userName, taskTitle, priority, completedAt }) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token         = process.env.WHATSAPP_ACCESS_TOKEN;
  const adminNumber   = process.env.ADMIN_WHATSAPP_NUMBER;
  const templateName  = process.env.WHATSAPP_TEMPLATE_NAME || "task_completed_notify";

  // Guard — skip silently if credentials are missing
  if (!phoneNumberId || !token || !adminNumber) {
    console.warn("WhatsApp credentials missing — skipping notification.");
    return { sent: false, reason: "missing_credentials" };
  }

  const formattedDate = new Date(completedAt).toLocaleString("en-IN", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const body = {
    messaging_product: "whatsapp",
    to:   adminNumber,
    type: "template",
    template: {
      name:     templateName,
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: userName    },
            { type: "text", text: taskTitle   },
            { type: "text", text: priority || "Medium" },
            { type: "text", text: formattedDate },
          ],
        },
      ],
    },
  };

  const response = await fetch(
    `${GRAPH_API}/${phoneNumberId}/messages`,
    {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    // Throw so the caller can log it — but the task save should not be affected
    throw new Error(
      data?.error?.message || `WhatsApp API error ${response.status}`
    );
  }

  return { sent: true, messageId: data?.messages?.[0]?.id };
}

module.exports = { sendTaskCompletedWhatsApp };
