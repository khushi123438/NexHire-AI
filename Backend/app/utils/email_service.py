import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

async def send_password_reset_email(to: str, name: str, otp: str) -> dict:
    """
    Send Password Reset OTP Email with identical responsive HTML template
    """
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASS")

    if not email_user or not email_pass:
        print("[EMAIL WARNING] EMAIL_USER or EMAIL_PASS is not configured in .env. To send real emails, set EMAIL_USER & EMAIL_PASS in .env")
        return {"success": False, "message": "Email credentials not configured"}

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "🔒 Password Reset Verification Code - NexHire AI"
        msg["From"] = f'"NexHire AI Security" <{email_user}>'
        msg["To"] = to

        current_year = datetime.now().year
        candidate_name = name or "User"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0d0d0d; color: #ffffff; padding: 20px; }}
            .container {{ max-width: 520px; margin: 0 auto; background: #151515; border: 1px solid rgba(255, 215, 0, 0.2); border-radius: 20px; padding: 35px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }}
            .header {{ text-align: center; margin-bottom: 25px; }}
            .title {{ font-size: 24px; font-weight: 800; color: #ffd700; margin: 0; }}
            .subtitle {{ font-size: 13px; color: #a0a0a0; margin-top: 5px; }}
            .otp-box {{ background: rgba(255, 215, 0, 0.08); border: 2px dashed #ffd700; border-radius: 16px; padding: 20px; text-align: center; margin: 25px 0; }}
            .otp-code {{ font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ffffff; font-family: monospace; }}
            .warning {{ font-size: 12px; color: #ff6b6b; margin-top: 15px; }}
            .footer {{ font-size: 11px; color: #707070; text-align: center; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">NexHire AI</h1>
              <p class="subtitle">Personal AI Interview & Career Platform</p>
            </div>
            
            <p style="font-size: 15px; line-height: 1.6; color: #e0e0e0;">
              Hello <strong>{candidate_name}</strong>,
            </p>
            <p style="font-size: 13px; line-height: 1.6; color: #b0b0b0;">
              We received a request to reset your password. Use the secure 6-digit verification code below to complete your password reset:
            </p>
            
            <div class="otp-box">
              <div class="otp-code">{otp}</div>
              <p style="font-size: 11px; color: #ffd700; margin: 8px 0 0 0; font-weight: 600;">Valid for 15 minutes only</p>
            </div>
            
            <p class="warning">
              ⚠️ If you did not request this password reset, please ignore this email. Your account remains secure.
            </p>
            
            <div class="footer">
              &copy; {current_year} NexHire AI. All rights reserved.
            </div>
          </div>
        </body>
        </html>
        """

        part = MIMEText(html_content, "html")
        msg.attach(part)

        # Connect and send via Gmail SMTP or standard SSL/TLS
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(email_user, email_pass)
            server.sendmail(email_user, to, msg.as_string())

        print(f"[EMAIL SUCCESS] Password reset OTP sent to {to}")
        return {"success": True}
    except Exception as error:
        print(f"[EMAIL ERROR] Failed to send email: {error}")
        return {"success": False, "error": str(error)}
