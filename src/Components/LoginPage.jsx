import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
const ROLE = {
  USER: "User",
  AGENT: "agent",
  ADMIN: "admin",
};

// Helper function to map role IDs to role names
const mapRoleIdToRoleName = (roleId) => {
  const roleMap = {
    0: "admin",
    1: "agentTC", // AgentTC
    2: "agent", // Agent  
    3: "User", 
    4: "SilverUser",
    5: "GoldUser",
    6: "PlatinumUser"
  };
  return roleMap[roleId] || "user"; // Default to "user" if role not found
};

export default function LoginPage({ onLoginSuccess }) {
  const [role, setRole] = useState(ROLE.USER);

  // Common state
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

  // Clear all states when component mounts or role changes
  useEffect(() => {
    const clearState = () => {
      setError("");
      setLoading(false);
      setOtpSent(false);
      setOtp("");
      setMobile("");
      setUsername("");
      setPassword("");
      setOtpTimer(0);
    };

    // Clear on mount and role change
    clearState();

    // Also clear if we detect we just logged out (no auth token)
    const checkAndClearSession = () => {
      if (!localStorage.getItem("authToken")) {
        clearState();
      }
    };

    window.addEventListener('storage', checkAndClearSession);
    checkAndClearSession(); // Check immediately

    return () => {
      window.removeEventListener('storage', checkAndClearSession);
    };
  }, [role]);

  // Function to get the base URL for API calls
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

  const API = {
    SEND_OTP: `${getBaseUrl()}/send-otp`,
    LOGIN_OTP: `${getBaseUrl()}/login-otp`,
    LOGIN: `${getBaseUrl()}/login`,
  };

  async function handleSendOtp(e) {
    console.log('handleSendOtp called');
    e && e.preventDefault();
    console.log('Default prevented');

    setError("");
    setLoading(true);
    setOtpSent(false); // Reset OTP sent state

    if (!/^[0-9]{10}$/.test(mobile)) {
      console.log('Invalid mobile number:', mobile);
      setError("Enter a valid mobile number");
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to send OTP');
      console.log('API URL:', API.SEND_OTP);
      const payload = { username: mobile };
      console.log('Request payload:', payload);

      const res = await fetch(API.SEND_OTP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', res.status);
      let data;

      try {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await res.json();
          console.log('Response data:', data);
        } else {
          const text = await res.text();
          console.log('Response text:', text);
          data = { message: text };
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Failed to parse server response');
      }

      if (!res.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || data.message || `Failed to send OTP (${res.status})`);
      }

      console.log('OTP sent successfully');
      setOtpSent(true);
      setOtpTimer(60);
      setError("");
      // Show success message
      setError("OTP sent successfully! Please check your phone.");
    } catch (err) {
      console.error('Error sending OTP:', err);
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
      console.log('Verifying OTP with payload:', {
        username: mobile,
        otp: otp
      });

      const res = await fetch(API.LOGIN_OTP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          username: mobile,
          otp: otp
        })
      });

      console.log('OTP verification response status:', res.status);
      const data = await res.json();
      console.log('OTP verification response:', data);
      if (!res.ok) throw new Error(data.error || data.message || "OTP verification failed");
      
      localStorage.setItem("authToken", data.token || "");
      
      let finalRole = "user"; // Default fallback
      
      try {
        const decoded = jwtDecode(data.token);
        console.log("Decoded JWT:", decoded);

        // Adjust the key based on what your backend sends inside the token
        const roleIdFromToken = decoded.role || decoded.user_role || decoded.userType;

        if (roleIdFromToken !== undefined && roleIdFromToken !== null) {
          // Map the role ID to role name
          finalRole = mapRoleIdToRoleName(roleIdFromToken);
          localStorage.setItem("authRole", finalRole);
          console.log("Role ID decoded from token:", roleIdFromToken, "Mapped to:", finalRole);
        } else {
          console.warn("No role field found in token payload:", decoded);
          // Fallback to API-provided mapping
          if (data.role !== undefined && data.role !== null) {
            finalRole = mapRoleIdToRoleName(data.role);
            localStorage.setItem("authRole", finalRole);
            console.log('User role from API:', data.role, 'Mapped to:', finalRole);
          }
        }
      } catch (err) {
        console.error("Failed to decode JWT token:", err);
        // Fallback to API-provided mapping (if decoding fails)
        if (data.role !== undefined && data.role !== null) {
          finalRole = mapRoleIdToRoleName(data.role);
          localStorage.setItem("authRole", finalRole);
        }
      }
      
      onLoginSuccess && onLoginSuccess({ role: finalRole, token: data.token });
    } catch (err) {
      setError(err.message || "Network error");
    }
    finally {
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
      // The backend uses the same endpoint for both agent and admin
      const res = await fetch(API.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("authToken", data.token || "");
      
      let finalRole = role.toLowerCase(); // Default to selected role
      
      // Try to decode JWT and get role from token
      try {
        const decoded = jwtDecode(data.token);
        console.log("Decoded JWT:", decoded);
        
        const roleIdFromToken = decoded.role || decoded.user_role || decoded.userType;
        
        if (roleIdFromToken !== undefined && roleIdFromToken !== null) {
          finalRole = mapRoleIdToRoleName(roleIdFromToken);
          console.log("Role ID decoded from token:", roleIdFromToken, "Mapped to:", finalRole);
        }
      } catch (err) {
        console.error("Failed to decode JWT token:", err);
      }
      
      localStorage.setItem("authRole", finalRole);
      setError("");
      onLoginSuccess && onLoginSuccess({ role: finalRole, token: data.token });
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
        <h2 className="text-2xl font-semibold mb-2 text-center text-primary">Sign in</h2>
        {/* <p className="text-sm text-center text-secondary mb-6">Choose your role and sign in</p> */}

        {/* <div className="flex gap-2 justify-center mb-6">
          <RoleButton active={role === ROLE.USER} onClick={() => setRole(ROLE.USER)}>User</RoleButton>
          <RoleButton active={role === ROLE.AGENT} onClick={() => setRole(ROLE.AGENT)}>Agent</RoleButton>
          <RoleButton active={role === ROLE.ADMIN} onClick={() => setRole(ROLE.ADMIN)}>Admin</RoleButton>
        </div> */}

        {error && (
          <div className={`text-sm mb-4 ${error.includes('successfully') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} p-3 rounded-lg`}>
            {error}
          </div>
        )}

        {role === ROLE.USER && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            console.log('Form submitted');
            try {
              if (otpSent) {
                console.log('Handling OTP verification');
                await handleVerifyOtp(e);
              } else {
                console.log('Handling OTP send');
                await handleSendOtp(e);
              }
            } catch (err) {
              console.error('Form submission error:', err);
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
                      setOtpSent(false); // Reset OTP state when mobile number changes
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
                      console.log('OTP entered:', value);
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
                className={`text-sm font-medium transition-colors ${role === ROLE.AGENT
                  ? "text-indigo-600"
                  : "text-gray-700 hover:text-indigo-500 underline"
                  }`}
              >
                Login as Agent?
              </a>
            </div>

            <p className="mt-3 text-xs text-secondary">
              By signing in you agree to our terms. This demo expects your backend to implement send-otp and verify-otp endpoints.
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
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-accent text-primary rounded-xl shadow hover:brightness-95 disabled:opacity-50"
            >
              {loading ? "Signing in..." : role === ROLE.AGENT ? "Sign in as Agent" : "Sign in as Admin"}
            </button>
            <div className="flex justify-end mt-3">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setRole(ROLE.USER);
                }}
                className={`text-sm font-medium transition-colors ${role === ROLE.USER
                  ? "text-indigo-600"
                  : "text-gray-700 hover:text-indigo-500 underline"
                  }`}
              >
                Login as User?
              </a>
            </div>

            <p className="mt-3 text-xs text-secondary">
              Make sure your backend provides separate endpoints for agent and admin logins.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function RoleButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-2xl font-medium transition-shadow ${active ? "bg-primary text-accent shadow-lg" : "bg-white text-secondary border"
        }`}
    >
      {children}
    </button>
  );
}