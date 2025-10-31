import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/common/LoginPage";
import AdminLoginPage from "./components/admin/AdminLoginPage";
import AdminDashboard from "./components/admin/AdminDashboard";
import UserDashboard from "./components/user/UserDashboard";
import AgentDashboard from "./components/agent/AgentDashboard";
import PublicApp from "./components/public/PublicApp";

function App() {
  const handleLoginSuccess = (data) => {
    console.log("Logged in:", data);
    
    // Store auth data
    localStorage.setItem("authToken", data.token || "");
    localStorage.setItem("authRole", data.role || "");

    // Redirect based on role
    if (data.role === "admin") {
      window.location.href = "/admin/dashboard";
    } else if (data.role === "User" || data.role === "SilverUser" || data.role === "GoldUser" || data.role === "PlatinumUser") {
      window.location.href = "/user/dashboard";
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
        {/* Public Routes for AGS WonderWorld */}
        <Route path="/public/*" element={<PublicApp />} />
        
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
          path="/user/dashboard" 
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

        {/* Default route redirects to public home */}
        <Route path="/" element={<Navigate to="/public" replace />} />
        
        {/* Fallback route - redirects to public home */}
        <Route path="*" element={<Navigate to="/public" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
