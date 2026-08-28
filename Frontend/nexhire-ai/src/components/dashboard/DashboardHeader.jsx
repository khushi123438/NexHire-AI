import { Sparkles, LogOut } from "lucide-react";
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
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Hi, {userName} 👋
          </h1>
          <p className="text-gray-400">
            Welcome back to NexHire AI Interview Coach
          </p>
        </div>
      </div>

     <div>
  <button
    onClick={handleLogout}
    className="
      flex
      items-center
      gap-2
      px-5
      py-3
      rounded-xl
      bg-red-600
      hover:bg-red-700
      transition
      text-white
      font-semibold
      shadow-lg
    "
  >
    <LogOut size={18} />
    Logout
  </button>
</div>
    </div>
  );
}