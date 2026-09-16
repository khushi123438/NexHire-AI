import { Sparkles, LogOut, Compass, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../Api";

export default function DashboardHeader({ userName }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/auth");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,.35)]">
          <Sparkles className="text-black" size={28} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Hi, {userName} 👋
            </h1>
          </div>
          <p className="text-gray-400 text-xs md:text-sm">
            Adaptive AI Interview Intelligence & Career Coaching
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
       

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-700 transition text-white font-semibold text-xs md:text-sm shadow-lg"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}