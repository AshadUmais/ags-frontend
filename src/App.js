import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/common/LoginPage";
import AdminLoginPage from "./components/admin/AdminLoginPage";
import AdminDashboard from "./components/admin/AdminDashboard";
import UserDashboard from "./components/user/UserDashboard";
import AgentDashboard from "./components/agent/AgentDashboard";
import PublicApp from "./components/public/PublicApp";
import LoginModal from "./components/common/LoginModal";

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const handleOpenLoginModal = () => {
      setShowLoginModal(true);
    };

    window.addEventListener('openLoginModal', handleOpenLoginModal);

    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal);
    };
  }, []);

  const handleLoginSuccess = (data) => {
    console.log("Logged in:", data);
    
    // Store auth data
    localStorage.setItem("authToken", data.token || "");
    localStorage.setItem("authRole", data.role || "");

    // Close the modal
    setShowLoginModal(false);

    // Dispatch custom event to notify header component
    window.dispatchEvent(new Event('authChange'));

    // Redirect based on role
    if (data.role === "admin") {
      window.location.href = "/admin/dashboard";
    } else if (data.role === "User" || data.role === "SilverUser" || data.role === "GoldUser" || data.role === "PlatinumUser") {
      window.location.href = "/bookings";
    } else if (data.role === "agent") {
      window.location.href = "/agent/dashboard";
    }
  };

  // Protected Route component
  const ProtectedRoute = ({ children, allowedRoles }) => {
    const role = localStorage.getItem("authRole");
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/admin/login" element={<AdminLoginPage onLoginSuccess={handleLoginSuccess} />} />
        
        {/* Protected Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bookings" 
          element={
            <ProtectedRoute allowedRoles={["User", "SilverUser", "GoldUser", "PlatinumUser"]}>
              <UserDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/agent/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["agent"]}>
              <AgentDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Public Routes for AGS WonderWorld - Must be last to catch remaining routes */}
        <Route path="/*" element={<PublicApp />} />
      </Routes>

      {/* Login Modal - Rendered at body level */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </Router>
  );
}

export default App;
