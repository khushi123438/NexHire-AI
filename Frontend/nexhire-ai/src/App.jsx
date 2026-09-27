import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { InterviewProvider } from "./context/InterviewContext";

import Landing from "./pages/Landing";
import Auth from "./pages/auth";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Interview from "./pages/Interview";
import InterviewHistory from "./pages/InterviewHistory";
import InterviewReport from "./pages/InterviewReport";
import Intelligence from "./pages/Intelligence";
import CareerCoach from "./pages/CareerCoach";
import ResumeManager from "./pages/ResumeManager";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <InterviewProvider>
        <Routes>
          {/* Public Landing & Authentication */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected Application Shell */}
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Interview Workspace & Reports */}
            <Route path="/interview" element={<Interview />} />
            <Route path="/interview/history" element={<InterviewHistory />} />
            <Route path="/interview/report" element={<InterviewReport />} />
            <Route path="/interview/:id" element={<Interview />} />

            {/* AI Intelligence Hub */}
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/intelligence/skills" element={<Intelligence />} />
            <Route path="/intelligence/memory" element={<Intelligence />} />

            {/* Career Coach & Study Roadmap */}
            <Route path="/career" element={<CareerCoach />} />
            <Route path="/career/roadmap" element={<CareerCoach />} />
            <Route path="/career/skills" element={<CareerCoach />} />
            <Route path="/career-intelligence" element={<CareerCoach />} />

            {/* Resume Intelligence & Roles */}
            <Route path="/resumes" element={<ResumeManager />} />

            {/* Profile & Settings */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Catch-all fallback redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </InterviewProvider>
    </BrowserRouter>
  );
}

export default App;