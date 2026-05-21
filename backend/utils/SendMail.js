const nodemailer = require("nodemailer");
const https = require("https");
const dns = require("dns");

// Force Node.js to prefer IPv4 over IPv6 when resolving DNS lookups.
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

/**
 * Build the HTML email body for the password reset email.
 */
const buildResetEmailHtml = (resetLink) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">Password Reset</h2>
    <p style="color: #666; font-size: 14px;">You requested a password reset. Click the link below to reset your password. This link is valid for 10 minutes.</p>
    <div style="margin: 20px 0;">
      <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
    </div>
    <p style="color: #666; font-size: 12px;">Or copy this link: <a href="${resetLink}">${resetLink}</a></p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email and do not click the link.</p>
  </div>
`;

/**
 * Send email via Brevo (Sendinblue) HTTP API.
 * Works on ALL cloud platforms (Render, Vercel, Railway, etc.)
 * Free tier: 300 emails/day, only requires sender email verification (no domain needed).
 * Uses Node's built-in https module — zero extra dependencies.
 */
const sendViaBrevo = (apiKey, senderEmail, toEmail, subject, html) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { name: "College ERP", email: senderEmail },
      to: [{ email: toEmail }],
      subject,
      htmlContent: html,
    });

    const options = {
      hostname: "api.brevo.com",
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        Accept: "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(
            new Error(`Brevo API error (${res.statusCode}): ${body}`),
          );
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Brevo API request timed out"));
    });
    req.write(payload);
    req.end();
  });
};

/**
 * Send email via Nodemailer SMTP (works locally and on platforms that allow SMTP).
 */
const sendViaNodemailer = async (toEmail, subject, html) => {
  const cleanedEmail = process.env.NODEMAILER_EMAIL.replace(/\s+/g, "");
  const cleanedPass = process.env.NODEMAILER_PASS.replace(/\s+/g, "");

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    family: 4,
    auth: {
      user: cleanedEmail,
      pass: cleanedPass,
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
  });

  await transporter.verify();

  const info = await transporter.sendMail({
    from: cleanedEmail,
    to: toEmail,
    subject,
    html,
  });

  return info;
};

/**
 * Main entry point — automatically selects the best email transport.
 *
 * Priority:
 *   1. If BREVO_API_KEY is set → use Brevo HTTP API (guaranteed to work on Render / Vercel / etc.)
 *   2. Otherwise fall back to Nodemailer SMTP (works locally)
 */
const sendResetMail = async (email, resetToken, type) => {
  try {
    if (!process.env.FRONTEND_API_LINK) {
      throw new Error("FRONTEND_API_LINK is not set");
    }

    const resetLink = `${process.env.FRONTEND_API_LINK}/${type}/update-password/${resetToken}`;
    const subject = "Password Reset Request - College Management System";
    const html = buildResetEmailHtml(resetLink);

    // ── Strategy 1: Brevo HTTP API (cloud-safe, no domain verification needed) ──
    if (process.env.BREVO_API_KEY) {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.NODEMAILER_EMAIL?.replace(/\s+/g, "");
      if (!senderEmail) {
        throw new Error("BREVO_SENDER_EMAIL or NODEMAILER_EMAIL must be set when using Brevo");
      }
      console.log("Sending reset email via Brevo HTTP API to:", email);
      const result = await sendViaBrevo(
        process.env.BREVO_API_KEY,
        senderEmail,
        email,
        subject,
        html,
      );
      console.log("Reset email sent successfully via Brevo:", {
        to: email,
        messageId: result.messageId,
      });
      return result;
    }

    // ── Strategy 2: Nodemailer SMTP (local dev) ──
    if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASS) {
      throw new Error(
        "No email provider configured. Set BREVO_API_KEY (recommended for cloud) or NODEMAILER_EMAIL + NODEMAILER_PASS (for local).",
      );
    }

    console.log("Sending reset email via Nodemailer SMTP to:", email);
    const info = await sendViaNodemailer(email, subject, html);
    console.log("Reset email sent successfully via Nodemailer:", {
      to: email,
      messageId: info.messageId,
    });
    return info;
  } catch (error) {
    console.error("Error sending reset email:", {
      message: error.message,
      code: error.code,
      email: email,
    });
    throw new Error("Could not send reset email: " + error.message);
  }
};

module.exports = sendResetMail;
