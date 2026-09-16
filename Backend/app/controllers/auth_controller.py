import os
import random
import bcrypt
import re
from datetime import datetime, timedelta
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import RedirectResponse
from app.config.db import get_db
from app.utils.generate_token import generate_token
from app.utils.email_service import send_password_reset_email
from app.utils.helpers import serialize_doc
from app.config.oauth import get_google_auth_url, exchange_google_code_for_user

CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:5173")

async def signup_handler(req_data: dict, response: Response) -> dict:
    name = (req_data.get("name") or "").strip()
    email = (req_data.get("email") or "").strip().lower()
    password = req_data.get("password") or ""

    if not name or not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "All fields are required."}
        )

    db = get_db()
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "User already exists."}
        )

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")

    new_user_doc = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "provider": "local",
        "avatar": "",
        "googleId": None,
        "role": "user",
        "isVerified": False,
        "resume": "",
        "skills": [],
        "resetPasswordOtp": None,
        "resetPasswordExpires": None,
        "lastLogin": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }

    res = await db.users.insert_one(new_user_doc)
    user_id = str(res.inserted_id)

    token = generate_token(user_id)

    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        secure=False
    )

    return {
        "success": True,
        "message": "Account created successfully.",
        "token": token,
        "user": {
            "id": user_id,
            "name": name,
            "email": email
        }
    }

async def login_handler(req_data: dict, response: Response) -> dict:
    email = (req_data.get("email") or "").strip().lower()
    password = req_data.get("password") or ""

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Email and password are required."}
        )

    db = get_db()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Invalid credentials."}
        )

    is_match = bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8"))
    if not is_match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Invalid credentials."}
        )

    user_id = str(user["_id"])
    token = generate_token(user_id)

    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        secure=False
    )

    return {
        "success": True,
        "message": "Login successful.",
        "token": token,
        "user": {
            "id": user_id,
            "name": user.get("name", ""),
            "email": user.get("email", "")
        }
    }

def logout_handler(response: Response) -> dict:
    response.delete_cookie(key="token")
    return {
        "success": True,
        "message": "Logged out successfully."
    }

def get_profile_handler(current_user: dict) -> dict:
    return {
        "success": True,
        "user": current_user
    }

async def forgot_password_handler(req_data: dict) -> dict:
    email = (req_data.get("email") or "").strip().lower()

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Please enter your email address."}
        )

    db = get_db()
    user = await db.users.find_one({"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": f'No account registered with "{email}". Please Sign Up.'}
        )

    otp = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=15)

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "resetPasswordOtp": otp,
            "resetPasswordExpires": expires_at,
            "updatedAt": datetime.utcnow()
        }}
    )

    print(f"[AUTH] Generated Password Reset OTP for {user['email']}: {otp}")

    email_sent = False
    try:
        if os.getenv("EMAIL_USER") and os.getenv("EMAIL_PASS"):
            mail_res = await send_password_reset_email(to=user["email"], name=user.get("name", "User"), otp=otp)
            email_sent = mail_res.get("success", False)
        else:
            print(f"[EMAIL NOTICE] EMAIL_USER / EMAIL_PASS is not configured in .env. OTP for {user['email']} is: {otp}")
    except Exception as mail_err:
        print(f"[EMAIL ERROR] Could not dispatch email: {mail_err}")

    msg = f"A 6-digit verification OTP has been sent to {user['email']}. Please check your inbox & spam folder." if email_sent else f"A 6-digit verification OTP has been generated for {user['email']}."

    return {
        "success": True,
        "message": msg,
        "email": user["email"],
        "expiresInMinutes": 15
    }

async def verify_otp_handler(req_data: dict) -> dict:
    email = (req_data.get("email") or "").strip().lower()
    otp = str(req_data.get("otp") or "").strip()

    if not email or not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Email and OTP are required."}
        )

    db = get_db()
    user = await db.users.find_one({
        "email": {"$regex": f"^{re.escape(email)}$", "$options": "i"},
        "resetPasswordOtp": otp,
        "resetPasswordExpires": {"$gt": datetime.utcnow()}
    })

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Invalid or expired OTP code. Please request a new one."}
        )

    return {
        "success": True,
        "message": "OTP code verified successfully. Set your new password."
    }

async def reset_password_handler(req_data: dict) -> dict:
    email = (req_data.get("email") or "").strip().lower()
    otp = str(req_data.get("otp") or "").strip()
    new_password = req_data.get("newPassword") or ""

    if not email or not otp or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Email, OTP, and new password are required."}
        )

    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Password must be at least 6 characters long."}
        )

    db = get_db()
    user = await db.users.find_one({
        "email": {"$regex": f"^{re.escape(email)}$", "$options": "i"},
        "resetPasswordOtp": otp,
        "resetPasswordExpires": {"$gt": datetime.utcnow()}
    })

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Invalid or expired OTP code. Please request a new code."}
        )

    hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "password": hashed_password,
            "resetPasswordOtp": None,
            "resetPasswordExpires": None,
            "updatedAt": datetime.utcnow()
        }}
    )

    return {
        "success": True,
        "message": "Password reset successfully! You can now login with your new password."
    }

async def google_auth_handler(mode: str = "login"):
    auth_url = get_google_auth_url(mode)
    return RedirectResponse(url=auth_url)

async def google_callback_handler(code: str, state: str = "login"):
    db = get_db()
    try:
        profile = await exchange_google_code_for_user(code)
        email = profile.get("email", "").lower()
        name = profile.get("name", "Google User")
        google_id = profile.get("sub", "")
        avatar = profile.get("picture", "")

        user = await db.users.find_one({"email": email})

        if state == "signup":
            if user:
                return RedirectResponse(url=f"{CLIENT_URL}/auth?error=already_registered")
            new_user = {
                "name": name,
                "email": email,
                "googleId": google_id,
                "provider": "google",
                "avatar": avatar,
                "role": "user",
                "isVerified": True,
                "resume": "",
                "skills": [],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            res = await db.users.insert_one(new_user)
            user_id = str(res.inserted_id)
            token = generate_token(user_id)

            redirect = RedirectResponse(url=f"{CLIENT_URL}/dashboard?signup=success")
            redirect.set_cookie(key="token", value=token, httponly=True, samesite="lax", max_age=7*24*60*60, secure=False)
            return redirect

        # Mode = login
        if not user:
            new_user = {
                "name": name,
                "email": email,
                "googleId": google_id,
                "provider": "google",
                "avatar": avatar,
                "role": "user",
                "isVerified": True,
                "resume": "",
                "skills": [],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            res = await db.users.insert_one(new_user)
            user_id = str(res.inserted_id)
        else:
            user_id = str(user["_id"])

        token = generate_token(user_id)
        redirect = RedirectResponse(url=f"{CLIENT_URL}/dashboard?login=success")
        redirect.set_cookie(key="token", value=token, httponly=True, samesite="lax", max_age=7*24*60*60, secure=False)
        return redirect

    except Exception as e:
        print(f"[Google OAuth Callback Error]: {e}")
        return RedirectResponse(url=f"{CLIENT_URL}/auth")
