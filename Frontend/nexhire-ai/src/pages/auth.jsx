import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import AuroraBackground from "../components/background/AuroraBackground";
import AnimatedGrid from "../components/background/GridBackground";
import FloatingParticles from "../components/background/Floating";
import API from "../Api";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
const [searchParams] = useSearchParams();

useEffect(() => {
  if (searchParams.get("error") === "already_registered") {
    setMode("login");

    toast.error("This email is already registered. Please login.", {
      id: "already-registered",
      icon: "⚠️",
        duration: 3000,
        style: {
          background: "#151515",
          color: "#fff",
          border: "1px solid rgba(255,215,0,.25)",
          borderRadius: "14px",
          backdropFilter: "blur(12px)",
          padding: "14px 18px",
        },
    });

    // URL clean
    navigate("/auth", { replace: true });
  }
}, [searchParams, navigate]);



  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState(1); // 1: Request OTP, 2: Enter OTP & New Password
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [generatedOtpHint, setGeneratedOtpHint] = useState("");

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignupChange = (e) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value,
    });
  };

 const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await API.post("/auth/login", {
      email: loginData.email,
      password: loginData.password,
    });

    // Save JWT
    localStorage.setItem("token", res.data.token);

    // Save User
    localStorage.setItem(
      "user",
      JSON.stringify(res.data.user)
    );

    toast.success("Welcome back 👋");

    navigate("/dashboard");

  } catch (err) {
    console.log(err.response?.data);

    toast.error(
      err.response?.data?.message || "Login Failed"
    );
  }
};

  const handleSignup = async () => {

    if (signupData.password !== signupData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {

      const res = await API.post("/auth/signup", {
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
      });

      toast.success(
  "Account created successfully 🎉 Please login."
);

      // Login fields auto fill
      setLoginData({
        email: signupData.email,
        password: signupData.password,
      });

      // Signup form clear
      setSignupData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Login page open
      setMode("login");

    } catch (err) {

      toast.error(
        err.response?.data?.message || "Signup Failed"
      );

    }
  };

  // Step 1: Send Forgot Password OTP to Real Email
  const handleSendForgotOtp = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail || !forgotEmail.trim()) {
      return toast.error("Please enter your registered email address.");
    }

    try {
      setIsForgotLoading(true);
      const res = await API.post("/auth/forgot-password", {
        email: forgotEmail.trim(),
      });

      setForgotOtp(""); // Ensure user enters OTP received in their email
      setGeneratedOtpHint("");

      toast.success(
        res.data.message || `OTP sent to ${forgotEmail.trim()}! Please check your email. 📩`,
        { duration: 4500 }
      );
      setForgotStep(2);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to process forgot password request."
      );
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!forgotOtp || !forgotOtp.trim()) {
      return toast.error("Please enter the 6-digit OTP code.");
    }

    if (!newPassword || newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters.");
    }

    if (newPassword !== confirmNewPassword) {
      return toast.error("Passwords do not match.");
    }

    try {
      setIsForgotLoading(true);
      const res = await API.post("/auth/reset-password", {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword,
      });

      toast.success(res.data.message || "Password reset successfully! 🎉");

      // Auto fill login email and reset states
      setLoginData((prev) => ({ ...prev, email: forgotEmail, password: "" }));
      setForgotOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
      setGeneratedOtpHint("");
      setForgotStep(1);
      setMode("login");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to reset password. Please check your OTP."
      );
    } finally {
      setIsForgotLoading(false);
    }
  };
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#010101] text-white">

      <AuroraBackground />

      <AnimatedGrid />

      <FloatingParticles />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-16">

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="
w-full
max-w-6xl
grid
lg:grid-cols-2
rounded-3xl
overflow-hidden
border
border-yellow-500/20
bg-[#141414]/90
backdrop-blur-3xl
shadow-[0_0_80px_rgba(255,215,0,.10)]
"
        >

          {/* LEFT SIDE */}

          <div className="hidden lg:flex flex-col justify-center p-14">

            <div className="flex items-center gap-3">

              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 flex items-center justify-center">

                <Sparkles className="text-black" />

              </div>

              <h1 className="text-4xl font-black text-white">

                NexHire AI

              </h1>

            </div>

            <h2 className="mt-10 text-5xl font-bold leading-tight text-white">

              Your Personal

              <span className="block text-yellow-400">

                AI Interview Coach

              </span>

            </h2>

            <p className="mt-6 text-gray-400 leading-8">

              Practice realistic mock interviews,
              receive AI-powered feedback,
              improve confidence,
              and crack your dream job.

            </p>

            <div className="mt-10 space-y-4">

              {[
                "AI Mock Interviews",
                "Resume Based Questions",
                "Instant Feedback",
                "Performance Analytics",
              ].map((item) => (

                <div
                  key={item}
                  className="flex items-center gap-3"
                >

                  <div className="h-2 w-2 rounded-full bg-yellow-400" />

                  <span className="text-gray-300">

                    {item}

                  </span>

                </div>

              ))}

            </div>

          </div>

          {/* RIGHT SIDE */}

          <div className="p-10 lg:p-14">

            <AnimatePresence mode="wait">

              {mode === "login" && (

                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >

                  <h2 className="text-4xl font-bold text-white">

                    Welcome Back

                  </h2>

                  <p className="mt-3 text-gray-400">

                    Login to continue your interview journey.

                  </p>

                  <div className="mt-8 space-y-5">

                    {/* Email */}

                    <div className="relative">

                      <Mail
                        className="absolute left-4 top-4 text-yellow-400"
                        size={20}
                      />

                      <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={loginData.email}
                        onChange={handleLoginChange}
                        className="w-full h-14 rounded-xl bg-white/[0.05] border border-yellow-500/20 pl-12 pr-4 text-white outline-none focus:border-yellow-400"
                      />

                    </div>

                    {/* Password */}

                    <div className="relative">

                      <Lock
                        className="absolute left-4 top-4 text-yellow-400"
                        size={20}
                      />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        name="password"
                        placeholder="Password"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        className="w-full h-14 rounded-xl bg-white/[0.05] border border-yellow-500/20 pl-12 pr-12 text-white outline-none focus:border-yellow-400"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute right-4 top-4 text-gray-400"
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>

                    </div>

                    <div className="flex justify-between text-sm">

                      <label className="flex items-center gap-2 text-gray-400">

                        <input type="checkbox" />

                        Remember Me

                      </label>

                      <button
                        onClick={() =>
                          setMode("forgot")
                        }
                        className="text-yellow-400"
                      >
                        Forgot Password?
                      </button>

                    </div>
                    <button
                      onClick={handleLogin}
                      className="
    w-full
    h-14
    rounded-xl
    bg-gradient-to-r
    from-yellow-300
    via-yellow-400
    to-yellow-600
    text-black
    font-bold
    hover:scale-[1.02]
    transition
  "
                    >
                      Login
                    </button>

                    <div className="flex items-center gap-4">

                      <div className="flex-1 h-px bg-white/10" />

                      <span className="text-gray-500">
                        OR
                      </span>

                      <div className="flex-1 h-px bg-white/10" />

                    </div>

                    <button
                      onClick={() => {
    window.location.href =
      "http://localhost:5000/api/auth/google?mode=login";
  }}
                      className="
    w-full
    h-14
    rounded-xl
    border
    border-yellow-500/20
    bg-white/[0.05]
    hover:bg-white/[0.08]
    flex
    items-center
    justify-center
    gap-3
    text-white
  "
                    >
                      <FcGoogle size={24} />
                      Continue with Google
                    </button>

                    <p className="text-center text-gray-400">

                      Don't have an account?

                      <button
                        onClick={() => setMode("signup")}
                        className="ml-2 text-yellow-400 font-semibold"
                      >
                        Sign Up
                      </button>

                    </p>

                  </div>

                </motion.div>

              )}

              {mode === "signup" && (

                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >

                  <h2 className="text-4xl font-bold text-white">
                    Create Account
                  </h2>

                  <p className="mt-3 text-gray-400">
                    Start preparing with NexHire AI.
                  </p>

                  <div className="mt-8 space-y-5">

                    <div className="relative">

                      <User
                        className="absolute left-4 top-4 text-yellow-400"
                        size={20}
                      />

                      <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={signupData.name}
                        onChange={handleSignupChange}
                        className="w-full h-14 rounded-xl bg-white/[0.05] border border-yellow-500/20 pl-12 pr-4 text-white outline-none focus:border-yellow-400"
                      />

                    </div>

                    <div className="relative">

                      <Mail
                        className="absolute left-4 top-4 text-yellow-400"
                        size={20}
                      />

                      <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={signupData.email}
                        onChange={handleSignupChange}
                        className="w-full h-14 rounded-xl bg-white/[0.05] border border-yellow-500/20 pl-12 pr-4 text-white outline-none focus:border-yellow-400"
                      />

                    </div>

                    <div className="relative">

                      <Lock
                        className="absolute left-4 top-4 text-yellow-400"
                        size={20}
                      />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        name="password"
                        placeholder="Password"
                        value={signupData.password}
                        onChange={handleSignupChange}
                        className="w-full h-14 rounded-xl bg-white/[0.05] border border-yellow-500/20 pl-12 pr-12 text-white outline-none focus:border-yellow-400"
                      />

                    </div>

                    <div className="relative">

                      <Lock
                        className="absolute left-4 top-4 text-yellow-400"
                        size={20}
                      />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={signupData.confirmPassword}
                        onChange={handleSignupChange}
                        className="w-full h-14 rounded-xl bg-white/[0.05] border border-yellow-500/20 pl-12 pr-4 text-white outline-none focus:border-yellow-400"
                      />

                    </div>
                    <button
                      onClick={handleSignup}
                      className="
    w-full
    h-14
    rounded-xl
    bg-gradient-to-r
    from-yellow-300
    via-yellow-400
    to-yellow-600
    text-black
    font-bold
  "
                    >
                      Create Account
                    </button>

                <button
  onClick={() => {
    window.location.href = "http://localhost:5000/api/auth/google?mode=signup";
  }}
  className="
    w-full
    h-14
    rounded-xl
    border
    border-yellow-500/20
    bg-white/[0.05]
    flex
    items-center
    justify-center
    gap-3
    text-white
  "
>
  <FcGoogle size={24} />
  Sign up with Google
</button>

                    <p className="text-center text-gray-400">

                      Already have an account?

                      <button
                        onClick={() => setMode("login")}
                        className="ml-2 text-yellow-400 font-semibold"
                      >
                        Login
                      </button>

                    </p>

                  </div>

                </motion.div>

              )}

              {mode === "forgot" && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >
                  <button
                    onClick={() => {
                      setMode("login");
                      setForgotStep(1);
                    }}
                    className="flex items-center gap-2 text-yellow-400 text-sm hover:underline"
                  >
                    <ArrowLeft size={16} />
                    Back to Login
                  </button>

                  <div className="mt-4 flex items-center justify-between">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white">
                      {forgotStep === 1 ? "Forgot Password" : "Set New Password"}
                    </h2>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 font-mono font-bold border border-yellow-500/30">
                      Step {forgotStep} of 2
                    </span>
                  </div>

                  <p className="mt-2 text-gray-400 text-sm">
                    {forgotStep === 1
                      ? "Enter your registered email address to receive a secure 6-digit OTP code."
                      : `Enter the 6-digit code sent for "${forgotEmail}" and choose your new password.`}
                  </p>

                  {/* STEP 1: REQUEST OTP */}
                  {forgotStep === 1 && (
                    <form onSubmit={handleSendForgotOtp} className="mt-8 space-y-5">
                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-4 text-yellow-400"
                          size={20}
                        />
                        <input
                          type="email"
                          required
                          placeholder="Registered Email Address"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full h-14 rounded-xl bg-white/[0.05] border border-yellow-500/20 pl-12 pr-4 text-white outline-none focus:border-yellow-400"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isForgotLoading}
                        className="w-full h-14 rounded-xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black font-bold hover:scale-[1.02] transition flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,215,0,0.3)] disabled:opacity-50"
                      >
                        {isForgotLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            Sending OTP Code...
                          </>
                        ) : (
                          <>
                            <KeyRound size={20} />
                            Send 6-Digit OTP Code
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* STEP 2: ENTER OTP & NEW PASSWORD */}
                  {forgotStep === 2 && (
                    <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                      {generatedOtpHint && (
                        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between text-xs text-yellow-300">
                          <span className="flex items-center gap-1.5 font-medium">
                            <KeyRound size={14} className="text-yellow-400" />
                            Your Reset OTP: <strong className="font-mono text-sm tracking-wider text-white">{generatedOtpHint}</strong>
                          </span>
                          <span className="text-[10px] text-gray-400">Valid 15m</span>
                        </div>
                      )}

                      {/* 6-Digit OTP */}
                      <div className="relative">
                        <KeyRound
                          className="absolute left-4 top-4 text-yellow-400"
                          size={20}
                        />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="Enter 6-Digit OTP"
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                          className="w-full h-14 rounded-xl bg-white/[0.05] border border-yellow-500/20 pl-12 pr-4 text-white font-mono text-lg tracking-widest outline-none focus:border-yellow-400"
                        />
                      </div>

                      {/* New Password */}
                      <div className="relative">
                        <Lock
                          className="absolute left-4 top-4 text-yellow-400"
                          size={20}
                        />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          placeholder="New Password (min. 6 chars)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full h-14 rounded-xl bg-white/[0.05] border border-yellow-500/20 pl-12 pr-12 text-white outline-none focus:border-yellow-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-4 text-gray-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>

                      {/* Confirm New Password */}
                      <div className="relative">
                        <Lock
                          className="absolute left-4 top-4 text-yellow-400"
                          size={20}
                        />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          placeholder="Confirm New Password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full h-14 rounded-xl bg-white/[0.05] border border-yellow-500/20 pl-12 pr-4 text-white outline-none focus:border-yellow-400"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isForgotLoading}
                        className="w-full h-14 rounded-xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black font-bold hover:scale-[1.02] transition flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,215,0,0.3)] disabled:opacity-50 mt-2"
                      >
                        {isForgotLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            Resetting Password...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={20} />
                            Reset Password & Login
                          </>
                        )}
                      </button>

                      {/* Resend & Change Email buttons */}
                      <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
                        <button
                          type="button"
                          onClick={handleSendForgotOtp}
                          disabled={isForgotLoading}
                          className="text-yellow-400 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw size={12} /> Resend Code
                        </button>
                        <button
                          type="button"
                          onClick={() => setForgotStep(1)}
                          className="text-gray-400 hover:text-white hover:underline"
                        >
                          Change Email
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}

            </AnimatePresence>

          </div>

        </motion.div>

      </div>

    </div>
  );
}