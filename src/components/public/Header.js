import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authRole, setAuthRole] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're in a dashboard context
  const isDashboardContext = location.pathname.includes('/dashboard');

  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = () => {
      const authToken = localStorage.getItem("authToken");
      const role = localStorage.getItem("authRole");
      const isAuthenticated = sessionStorage.getItem("isAuthenticated");
      setIsLoggedIn(!!(authToken && role && isAuthenticated));
      setAuthRole(role || '');
    };

    // Check initial auth status
    checkAuthStatus();

    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAuthStatus);

    // Listen for custom events when login/logout happens in same tab
    window.addEventListener('authChange', checkAuthStatus);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('authChange', checkAuthStatus);
    };
  }, [location.pathname]); // Re-check when route changes

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLoginClick = () => {
    // Dispatch event to open login modal at app level
    window.dispatchEvent(new Event('openLoginModal'));
    closeMenu();
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear(); // Also clear sessionStorage
    setIsLoggedIn(false);
    setAuthRole('');
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
    closeMenu();
  };

  const handleBookTicketsClick = () => {
    const authToken = localStorage.getItem("authToken");
    const authRole = localStorage.getItem("authRole");
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");
    if (isAuthenticated) {
      // User is logged in, redirect to appropriate dashboard
      if (authRole === "admin") {
        navigate("/admin/dashboard");
      } else if (authRole === "3" || authRole === "SilverUser" || authRole === "GoldUser" || authRole === "PlatinumUser") {
        navigate("/bookings");
      } else if (authRole === "agent") {
        navigate("/agent/dashboard");
      } else {
        // Dispatch event to open login modal at app level
        window.dispatchEvent(new Event('openLoginModal'));
      }
    } else {
      // User is not logged in, dispatch event to open login modal
      window.dispatchEvent(new Event('openLoginModal'));
    }
    closeMenu();
  };

  const isActiveLink = (path) => {
    // Check if current path matches the given path
    const currentPath = location.pathname;
    return currentPath === path || (path === '/' && currentPath === '/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-section">
          <Link to="/" className="logo-link" onClick={closeMenu}>
            <img 
              src="/assets/ags-text.avif" 
              alt="AGS WONDERWORLD" 
              className="logo-image"
              style={{ height: '40px', width: 'auto' }}
            />
          </Link>
        </div>
        
        <nav className={`navigation ${isMenuOpen ? 'nav-open' : ''}`}>
          <ul className="nav-list">
              <>
                <li>
                  <Link 
                    to="/" 
                    className={`nav-link ${isActiveLink('/') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    HOME
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/eat" 
                    className={`nav-link ${isActiveLink('/eat') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    DINE
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/play" 
                    className={`nav-link ${isActiveLink('/play') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    PLAY
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={handleBookTicketsClick}
                    className="nav-link"
                  >
                    BOOK TICKETS
                  </button>
                </li>
                <li>
                  <Link 
                    to="/contact" 
                    className={`nav-link ${isActiveLink('/contact') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    CONTACT
                  </Link>
                </li>
              </>
            
          </ul>
        </nav>

        <div className="header-actions">
          {sessionStorage.getItem("isAuthenticated") ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Welcome, {authRole}</span>
              <button className="login-btn" onClick={handleLogout}>LOGOUT</button>
            </div>
          ) : (
            <button className="login-btn" onClick={handleLoginClick}>LOGIN</button>
          )}
          <button className="menu-toggle" onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;