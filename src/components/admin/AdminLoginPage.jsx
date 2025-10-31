import React, { useState } from "react";



export default function AdminLoginPage({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const getBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8080/api';
    }
    return `http://${window.location.hostname}:8080/api`;
  };

  async function handleAdminLogin(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${getBaseUrl()}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ username: email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Login failed");
      }

      if (data.role !== 0) {
        throw new Error("Access denied. Admin credentials required.");
      }

      sessionStorage.setItem("authRole", "admin");
      sessionStorage.setItem("userId", data.user_id);
      sessionStorage.setItem("isAuthenticated", "true");

      onLoginSuccess && onLoginSuccess({
        role: "admin",
        userId: data.user_id,
        status: data.status
      });
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-lightPurple p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-center mb-6">
          <img
            src="https://static.wixstatic.com/media/602df3_7d6aee23192c4640ac4839d4c2a38fe6~mv2.png/v1/fill/w_338,h_95,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/ags%20TEXT.png"
            alt="AGS ParkParadise Logo"
            className="h-16"
          />
        </div>
        <h2 className="text-2xl font-semibold mb-2 text-center text-primary">Admin Login</h2>
        <p className="text-sm text-center text-secondary mb-6">Enter your admin credentials</p>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin}>
          <label className="block text-sm font-medium text-secondary">Username</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 mb-3 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter username"
            disabled={loading}
          />

          <label className="block text-sm font-medium text-secondary">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 mb-4 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your password"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-accent text-primary rounded-xl shadow hover:brightness-95 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in as Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}