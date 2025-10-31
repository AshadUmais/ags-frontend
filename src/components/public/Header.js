import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLoginClick = () => {
    navigate('/login');
    closeMenu();
  };

  const isActiveLink = (path) => {
    // Adjust path checking for nested routes
    const currentPath = location.pathname.replace('/public', '');
    return currentPath === path || (path === '/' && currentPath === '');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-section">
          <Link to="/public" className="logo-link" onClick={closeMenu}>
            <div className="text-logo">
              <span className="logo-main">AGS</span>
              <span className="logo-sub">WONDERWORLD</span>
            </div>
          </Link>
        </div>
        
        <nav className={`navigation ${isMenuOpen ? 'nav-open' : ''}`}>
          <ul className="nav-list">
            <li>
              <Link 
                to="/public" 
                className={`nav-link ${isActiveLink('/') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                HOME
              </Link>
            </li>
            <li>
              <Link 
                to="/public/eat" 
                className={`nav-link ${isActiveLink('/eat') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                EAT
              </Link>
            </li>
            <li>
              <a href="#play" className="nav-link" onClick={closeMenu}>PLAY</a>
            </li>
            <li>
              <a href="#book" className="nav-link" onClick={closeMenu}>BOOK TICKETS</a>
            </li>
            <li>
              <a href="#about" className="nav-link" onClick={closeMenu}>ABOUT</a>
            </li>
            <li>
              <Link 
                to="/public/contact" 
                className={`nav-link ${isActiveLink('/contact') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                CONTACT
              </Link>
            </li>
          </ul>
        </nav>

        <div className="header-actions">
          <button className="login-btn" onClick={handleLoginClick}>LOGIN</button>
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