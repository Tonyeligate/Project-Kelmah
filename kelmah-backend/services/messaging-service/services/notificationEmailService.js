/**
 * Notification Email Service
 * Sends email notifications based on notification type and user preferences.
 * Uses nodemailer with SMTP (shared config pattern from auth-service).
 */

const nodemailer = require("nodemailer");

// SMTP config — reuse same env vars as auth-service
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
const EMAIL_FROM =
  process.env.FROM_EMAIL || process.env.EMAIL_FROM || "noreply@kelmah.com";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://kelmah-frontend.vercel.app";

let transporter = null;

/**
 * Lazily initialize the SMTP transporter.
 * Returns null if SMTP credentials are not configured (graceful no-op).
 */
function getTransporter() {
  if (transporter) return transporter;

  if (!SMTP_USER || !SMTP_PASS) {
    console.warn(
      "Notification email: SMTP credentials not configured — email notifications disabled.",
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: process.env.NODE_ENV !== "development" },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    rateDelta: 20000,
    rateLimit: 3,
  });

  return transporter;
}

// Notification type → email subject & icon mapping
const TYPE_META = {
  message_received: {
    subject: "New Message",
    emoji: "💬",
    color: "#1976d2",
  },
  job_application: {
    subject: "New Job Application",
    emoji: "📋",
    color: "#2e7d32",
  },
  job_offer: {
    subject: "Job Offer Received",
    emoji: "🎉",
    color: "#ed6c02",
  },
  contract_update: {
    subject: "Contract Update",
    emoji: "📝",
    color: "#9c27b0",
  },
  payment_received: {
    subject: "Payment Received",
    emoji: "💰",
    color: "#2e7d32",
  },
  system_alert: {
    subject: "System Alert",
    emoji: "⚠️",
    color: "#d32f2f",
  },
  profile_update: {
    subject: "Profile Update",
    emoji: "👤",
    color: "#0288d1",
  },
  review_received: {
    subject: "New Review",
    emoji: "⭐",
    color: "#f9a825",
  },
};

/**
 * Build HTML email body for a notification.
 */
function buildEmailHtml(user, notification) {
  const meta = TYPE_META[notification.type] || TYPE_META.system_alert;
  const firstName = user.firstName || "User";
  const actionLink = notification.actionUrl
    ? `${FRONTEND_URL}${notification.actionUrl}`
    : FRONTEND_URL;

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#C5A55A 0%,#E8D5A3 100%);padding:24px 32px;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Kelmah</h1>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:#333;">Hi ${firstName},</p>
        <div style="background:#f8f9fa;border-left:4px solid ${meta.color};border-radius:8px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:14px;color:#666;">${meta.emoji} ${meta.subject}</p>
          <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#222;">${notification.title}</p>
          <p style="margin:0;font-size:14px;color:#555;">${notification.content}</p>
        </div>
        <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr>
            <td style="background:${meta.color};border-radius:8px;padding:12px 28px;">
              <a href="${actionLink}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">View Details</a>
            </td>
          </tr>
        </table>
        <p style="margin:0;font-size:12px;color:#999;">If the button doesn't work, copy this link: ${actionLink}</p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background:#f8f9fa;padding:16px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#999;">You received this because you enabled email notifications on Kelmah.</p>
        <p style="margin:4px 0 0;font-size:12px;color:#999;">
          <a href="${FRONTEND_URL}/notifications/settings" style="color:${meta.color};">Manage preferences</a>
        </p>
        <p style="margin:8px 0 0;font-size:11px;color:#bbb;">&copy; ${new Date().getFullYear()} Kelmah. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send a notification email to a user.
 * @param {{ email: string, firstName?: string }} user - recipient with email
 * @param {Object} notification - Notification document (type, title, content, actionUrl)
 * @returns {Promise<boolean>} true if sent, false if skipped
 */
async function sendNotificationEmail(user, notification) {
  const transport = getTransporter();
  if (!transport) return false;

  if (!user?.email) {
    console.warn("Notification email: no recipient email provided — skipping.");
    return false;
  }

  const meta = TYPE_META[notification.type] || TYPE_META.system_alert;

  try {
    await transport.sendMail({
      from: `"Kelmah" <${EMAIL_FROM}>`,
      to: user.email,
      subject: `${meta.emoji} ${meta.subject}: ${notification.title}`,
      html: buildEmailHtml(user, notification),
      headers: {
        "X-Mailer": "Kelmah Notification Service",
        "X-Priority": notification.priority === "high" ? "1" : "3",
      },
    });
    return true;
  } catch (error) {
    console.error(
      `Notification email failed for ${user.email}:`,
      error.message,
    );
    return false;
  }
}

module.exports = { sendNotificationEmail };
