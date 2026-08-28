import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";

import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />

    <Toaster
      position="top-right"
      containerStyle={{
        top: 24,
        right: 24,
        zIndex: 999999,
      }}
      toastOptions={{
        duration: 3500,
        style: {
          background: "rgba(18, 18, 18, 0.92)",
          color: "#ffffff",
          border: "1px solid rgba(255, 215, 0, 0.3)",
          borderRadius: "14px",
          backdropFilter: "blur(16px)",
          padding: "12px 18px",
          fontSize: "13px",
          fontWeight: "600",
          boxShadow: "0 10px 35px rgba(0, 0, 0, 0.65), 0 0 15px rgba(255, 215, 0, 0.15)",
        },
        success: {
          iconTheme: {
            primary: "#EAB308",
            secondary: "#0A0A0A",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: "#0A0A0A",
          },
        },
      }}
    />
  </StrictMode>
);