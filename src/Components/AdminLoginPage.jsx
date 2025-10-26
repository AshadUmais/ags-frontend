import React, { useState, useEffect } from "react";
export default function AdminLoginPage({ onLoginSuccess }) {
  // Admin login state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Check if JWT exists and is valid
  const checkJWTToken = () => {
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("authRole");
    
    if (!token) {
      console.log("No JWT token found");
      return false;
    }

    // Check if token is expired (if it's a JWT token)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.log("JWT token has expired");
        localStorage.removeItem("authToken");
        localStorage.removeItem("authRole");
        return false;
      }
    } catch (e) {
      console.error("Error parsing JWT token:", e);
      return false;
    }

    // Check if role is admin
    if (role !== "admin") {
      console.log("User is not an admin");
      return false;
    }

    return true;
  };

  // Check JWT token on component mount
  useEffect(() => {
    if (checkJWTToken()) {
      console.log("Valid admin JWT token found");
      // Optionally redirect to admin dashboard if already logged in
      onLoginSuccess && onLoginSuccess({ role: "admin", token: localStorage.getItem("authToken") });
    }
  }, [onLoginSuccess]);
  const getBaseUrl = () => {
    // For local development on your computer
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8080/api';
    }

    // For testing on mobile devices on the same network
    // Replace with your computer's actual IP address when testing on mobile
    // Example: return 'http://192.168.1.100:8080/api';
    return `http://${window.location.hostname}:8080/api`;
  };
  // API endpoint
  const API = {
    LOGIN_ADMIN: `${getBaseUrl()}/login`,
  };

  // Function to handle admin login with credentials
  async function handleAdminLogin(e) {
    e && e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API.LOGIN_ADMIN, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          username: email,
          password: password
        })
      });
      
      let data;
      try {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await res.json();
          console.log('Response data:', data);
        } else {
          const text = await res.text();
          console.log('Response text:', text);
          
          if (text.includes('<!DOCTYPE html>')) {
            throw new Error("API endpoint not found. Please check server configuration.");
          }
          
          data = { message: text };
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Failed to parse server response. Please check if the server is running.');
      }

      if (!res.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || data.message || `Login failed (${res.status})`);
      }

      // Save the JWT token
      if (data.token) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("authRole", "admin");
        setError("");
        onLoginSuccess && onLoginSuccess({ role: "admin", token: data.token });
        console.log("Admin JWT Token saved successfully");
      } else {
        throw new Error("No token received from server");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-lightPurple p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-2 text-center text-primary">Admin Sign in</h2>
        <p className="text-sm text-center text-secondary mb-6">Enter your admin credentials</p>

        {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

        <form onSubmit={handleAdminLogin}>
          <label className="block text-sm font-medium text-secondary">Username</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 mb-3 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter username"
          />

          <label className="block text-sm font-medium text-secondary">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 mb-4 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-accent text-primary rounded-xl shadow hover:brightness-95 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in as Admin"}
          </button>

          <p className="mt-3 text-xs text-secondary">
            This is a secure admin login page. Please ensure you have the proper credentials.
          </p>
        </form>
      </div>
    </div>
  );
}
