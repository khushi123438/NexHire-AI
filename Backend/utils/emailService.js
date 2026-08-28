let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch (e) {
  console.warn("[EMAIL NOTICE] Nodemailer module is not yet installed. Please run: npm i nodemailer");
}

/**
 * Configure Nodemailer Transporter
 * Supports Gmail SMTP using App Password or generic SMTP
 */
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.warn(
      "[EMAIL WARNING] EMAIL_USER or EMAIL_PASS is not configured in .env. To send real emails to candidate Gmail inbox, please set EMAIL_USER & EMAIL_PASS (Gmail 16-char App Password) in Backend/.env"
    );
  }

  if (!nodemailer) {
    throw new Error("Nodemailer is not installed. Please run 'npm i nodemailer' in Backend directory.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

/**
 * Send Password Reset OTP Email
 */
const sendPasswordResetEmail = async ({ to, name, otp }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"NexHire AI Security" <${process.env.EMAIL_USER || "noreply@nexhire.ai"}>`,
      to,
      subject: "🔒 Password Reset Verification Code - NexHire AI",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0d0d0d; color: #ffffff; padding: 20px; }
            .container { max-width: 520px; margin: 0 auto; background: #151515; border: 1px solid rgba(255, 215, 0, 0.2); border-radius: 20px; padding: 35px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
            .header { text-align: center; margin-bottom: 25px; }
            .title { font-size: 24px; font-weight: 800; color: #ffd700; margin: 0; }
            .subtitle { font-size: 13px; color: #a0a0a0; margin-top: 5px; }
            .otp-box { background: rgba(255, 215, 0, 0.08); border: 2px dashed #ffd700; border-radius: 16px; padding: 20px; text-align: center; margin: 25px 0; }
            .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ffffff; font-family: monospace; }
            .warning { font-size: 12px; color: #ff6b6b; margin-top: 15px; }
            .footer { font-size: 11px; color: #707070; text-align: center; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">NexHire AI</h1>
              <p class="subtitle">Personal AI Interview & Career Platform</p>
            </div>
            
            <p style="font-size: 15px; line-height: 1.6; color: #e0e0e0;">
              Hello <strong>${name || "User"}</strong>,
            </p>
            <p style="font-size: 13px; line-height: 1.6; color: #b0b0b0;">
              We received a request to reset your password. Use the secure 6-digit verification code below to complete your password reset:
            </p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <p style="font-size: 11px; color: #ffd700; margin: 8px 0 0 0; font-weight: 600;">Valid for 15 minutes only</p>
            </div>
            
            <p class="warning">
              ⚠️ If you did not request this password reset, please ignore this email. Your account remains secure.
            </p>
            
            <div class="footer">
              &copy; ${new Date().getFullYear()} NexHire AI. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SUCCESS] Password reset OTP sent to ${to} (MessageID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send email via Nodemailer:", error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
};
