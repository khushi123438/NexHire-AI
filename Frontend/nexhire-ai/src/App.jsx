import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CareerIntelligence from "./pages/CareerIntelligence";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />

        {/* NexHire AI Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* NexHire AI Career Intelligence Hub */}
        <Route path="/career-intelligence" element={<CareerIntelligence />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;