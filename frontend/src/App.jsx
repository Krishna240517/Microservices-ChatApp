import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/useAuthStore";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import HomePage from "./pages/HomePage";

function App() {
  const { user, isCheckingAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="app-loading">
        <span className="spinner large" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" />} />
        <Route path="/verify-otp" element={!user ? <VerifyOtpPage /> : <Navigate to="/" />} />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          className: "toast",
          duration: 3000,
          style: {
            background: "#1e293b",
            color: "#e2e8f0",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
