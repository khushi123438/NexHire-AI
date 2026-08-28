const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendPasswordResetEmail } = require("../utils/emailService");

// ==========================
// Signup
// ==========================
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "local",
    });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Login
// ==========================
const login = async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Logout
// ==========================
const logout = (req, res) => {

  res.clearCookie("token");

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });

};

// ==========================
// Get Current User
// ==========================
const getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

// ==========================
// Forgot Password - Generate OTP
// ==========================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email address.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No account registered with "${cleanEmail}". Please Sign Up.`,
      });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins validity

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordOtp: otp,
          resetPasswordExpires: expiresAt,
        },
      }
    );

    console.log(`[AUTH] Generated Password Reset OTP for ${user.email}: ${otp}`);

    // Send actual OTP to user's registered email inbox
    let emailSent = false;
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          otp,
        });
        emailSent = true;
      } else {
        console.warn(
          `[EMAIL NOTICE] EMAIL_USER / EMAIL_PASS is not yet configured in Backend/.env. OTP for ${user.email} is: ${otp}`
        );
      }
    } catch (mailErr) {
      console.error("[EMAIL ERROR] Could not dispatch email:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: emailSent
        ? `A 6-digit verification OTP has been sent to ${user.email}. Please check your inbox & spam folder.`
        : `A 6-digit verification OTP has been generated for ${user.email}.`,
      email: user.email,
      expiresInMinutes: 15,
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process forgot password request.",
    });
  }
};

// ==========================
// Verify OTP
// ==========================
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
      resetPasswordOtp: otp.toString().trim(),
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP code. Please request a new one.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP code verified successfully. Set your new password.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify OTP.",
    });
  }
};

// ==========================
// Reset Password with OTP
// ==========================
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
      resetPasswordOtp: otp.toString().trim(),
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP code. Please request a new code.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          resetPasswordOtp: null,
          resetPasswordExpires: null,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successfully! You can now login with your new password.",
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reset password.",
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
};