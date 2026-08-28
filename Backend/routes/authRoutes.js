const express = require("express");
const passport = require("passport");

const {
  signup,
  login,
  logout,
  getProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const generateToken = require("../utils/generateToken");

const router = express.Router();

// Local Authentication
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

router.get("/me", protect, getProfile);

router.get("/google", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: req.query.mode || "login",
  })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  passport.authenticate(
    "google",
    { session: false },
    (err, user, info) => {

      if (info?.message === "already_registered") {
        return res.redirect(
          `${process.env.CLIENT_URL}/auth?error=already_registered`
        );
      }

      if (err || !user) {
        return res.redirect(`${process.env.CLIENT_URL}/auth`);
      }

      const token = generateToken(user._id);

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

 const mode = req.query.state;

if (mode === "signup") {
  return res.redirect(
    `${process.env.CLIENT_URL}/dashboard?signup=success`
  );
}

return res.redirect(
  `${process.env.CLIENT_URL}/dashboard?login=success`

);
    }
  )(req, res, next);
});
module.exports = router;