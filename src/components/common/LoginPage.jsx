import React, { useState, useEffect } from "react";

const ROLE = {
  USER: "User",
  AGENT: "agent",
  ADMIN: "admin",
};

// Helper function to map role IDs to role names
const mapRoleIdToRoleName = (roleId) => {
  const roleMap = {
    0: "admin",
    1: "agent",
    2: "agentTC",
    3: "User",
    4: "SilverUser",
    5: "GoldUser",
    6: "PlatinumUser"
  };
  return roleMap[roleId] || "user";
};

export default function LoginPage({ onLoginSuccess }) {
  const [role, setRole] = useState(ROLE.USER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // User (mobile + OTP)
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // Agent/Admin (username + password)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpTimer]);

  useEffect(() => {
    setError("");
    setLoading(false);
    setOtpSent(false);
    setOtp("");
    setMobile("");
    setUsername("");
    setPassword("");
    setOtpTimer(0);
  }, [role]);

  const getBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8080/api';
    }
    return `http://${window.location.hostname}:8080/api`;
  };

  const API = {
    SEND_OTP: `${getBaseUrl()}/send-otp`,
    LOGIN_OTP: `${getBaseUrl()}/login-otp`,
    LOGIN: `${getBaseUrl()}/login`,
  };

  async function handleSendOtp(e) {
    e && e.preventDefault();
    setError("");
    setLoading(true);
    setOtpSent(false);

    if (!/^[0-9]{10}$/.test(mobile)) {
      setError("Enter a valid mobile number");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(API.SEND_OTP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ username: mobile })
      });

      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1
        ? await res.json()
        : { message: await res.text() };

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to send OTP");
      }

      setOtpSent(true);
      setOtpTimer(60);
      setError("OTP sent successfully! Please check your phone.");
    } catch (err) {
      setError(err.message || "Network error. Please check if the backend server is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e && e.preventDefault();
    setError("");

    if (!/^[0-9]{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP you received.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API.LOGIN_OTP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({ username: mobile, otp })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "OTP verification failed");
      }

      const finalRole = mapRoleIdToRoleName(data.role);

      sessionStorage.setItem("authRole", finalRole);
      sessionStorage.setItem("userId", data.user_id);
      sessionStorage.setItem("isAuthenticated", "true");

      onLoginSuccess && onLoginSuccess({
        role: finalRole,
        userId: data.user_id,
        status: data.status
      });
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleUsernamePasswordLogin(e) {
    e && e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      const finalRole = mapRoleIdToRoleName(data.role);

      sessionStorage.setItem("authRole", finalRole);
      sessionStorage.setItem("userId", data.user_id);
      sessionStorage.setItem("isAuthenticated", "true");

      onLoginSuccess && onLoginSuccess({
        role: finalRole,
        userId: data.user_id,
        status: data.status
      });
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleResendOtp() {
    if (otpTimer > 0) return;
    handleSendOtp();
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
        <h2 className="text-2xl font-semibold mb-2 text-center text-primary">Sign in</h2>

        {error && (
          <div className={`text-sm mb-4 ${error.includes('successfully') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} p-3 rounded-lg`}>
            {error}
          </div>
        )}

        {role === ROLE.USER && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (otpSent) {
              await handleVerifyOtp(e);
            } else {
              await handleSendOtp(e);
            }
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary">Mobile number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                    setMobile(value);
                    if (otpSent) {
                      setOtpSent(false);
                      setOtp("");
                    }
                  }}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 9876543210"
                  disabled={loading}
                  maxLength={10}
                />
              </div>

              {otpSent && (
                <div>
                  <label className="block text-sm font-medium text-secondary">Enter OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                      setOtp(value);
                    }}
                    className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    disabled={loading}
                  />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="submit"
                disabled={loading || (otpSent && otp.length !== 6) || (!otpSent && mobile.length !== 10)}
                className="flex-1 px-4 py-2 bg-accent text-primary rounded-xl shadow hover:brightness-95 disabled:opacity-50"
              >
                {loading ? "Please wait..." : otpSent ? "Verify OTP" : "Send OTP"}
              </button>

              {otpSent && (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpTimer > 0 || loading}
                  className="px-3 py-2 text-sm rounded-md border text-secondary disabled:opacity-50"
                >
                  {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend"}
                </button>
              )}
            </div>

            <div className="flex justify-end mt-3">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setRole(ROLE.AGENT);
                }}
                className="text-sm font-medium text-gray-700 hover:text-indigo-500 underline transition-colors"
              >
                Login as Agent?
              </a>
            </div>

            <p className="mt-3 text-xs text-secondary">
              By signing in you agree to our terms.
            </p>
          </form>
        )}

        {(role === ROLE.AGENT || role === ROLE.ADMIN) && (
          <form onSubmit={handleUsernamePasswordLogin}>
            <label className="block text-sm font-medium text-secondary">Username</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 mb-3 block w-full px-3 py-2 pl-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your username"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
            </div>

            <label className="block text-sm font-medium text-secondary">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 mb-4 block w-full px-3 py-2 pl-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your password"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-accent text-primary rounded-xl shadow hover:brightness-95 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in as Agent"}
            </button>

            <div className="flex justify-end mt-3">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setRole(ROLE.USER);
                }}
                className="text-sm font-medium text-gray-700 hover:text-indigo-500 underline transition-colors"
              >
                Login as User?
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}