const nodemailer = require("nodemailer");
const dns = require("dns");

// Force Node.js to prefer IPv4 over IPv6 when resolving DNS lookups.
// This resolves the ENETUNREACH error on host platforms like Render that do not support outbound IPv6.
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const sendResetMail = async (email, resetToken, type) => {

  try {
    // Validate required environment variables
    if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASS) {
      console.error("Missing email configuration:", {
        hasEmail: !!process.env.NODEMAILER_EMAIL,
        hasPass: !!process.env.NODEMAILER_PASS,
      });
      throw new Error(
        "Email configuration is missing (NODEMAILER_EMAIL or NODEMAILER_PASS)",
      );
    }

    if (!process.env.FRONTEND_API_LINK) {
      throw new Error("FRONTEND_API_LINK is not set");
    }

    // Strip all spaces from email and password (useful since Google generates app passwords with spaces for readability)
    const cleanedEmail = process.env.NODEMAILER_EMAIL.replace(/\s+/g, "");
    const cleanedPass = process.env.NODEMAILER_PASS.replace(/\s+/g, "");

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: true,
      auth: {
        user: cleanedEmail,
        pass: cleanedPass,
      },
      connectionTimeout: 10000, // 10 seconds connection timeout
      socketTimeout: 10000,     // 10 seconds socket timeout
    });


    // Verify connection configuration
    await transporter.verify();

    const resetLink = `${process.env.FRONTEND_API_LINK}/${type}/update-password/${resetToken}`;

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL.trim(),
      to: email,
      subject: "Password Reset Request - College Management System",
      html: `
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
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Reset email sent successfully:", {
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
