import React, { useState, useCallback, useEffect } from 'react';
import BookTickets from './sections/BookTickets';
import MyBookings from './sections/MyBookings';
import Members from './sections/Members';
import Reports from './sections/Reports';
import Settings from './sections/Settings';
import '../public/Header.css';

const menuItems = [
  { id: 'book', label: 'Book Tickets', icon: '🎫' },
  { id: 'bookings', label: 'My Bookings', icon: '📋' },
  { id: 'members', label: 'Members', icon: '👥' },
  { id: 'reports', label: 'Reports', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function AgentDashboard() {
  const [activeSection, setActiveSection] = useState('book');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case 'book': return <BookTickets />;
      case 'bookings': return <MyBookings />;
      case 'members': return <Members />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <BookTickets />;
    }
  };

  const handleLogout = useCallback(() => {
    sessionStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.href = '/';
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
        setIsMobileMenuOpen(false);
      } else {
        setIsSidebarCollapsed(false);
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white h-full shadow-lg transition-all duration-300 hidden lg:flex flex-col flex-shrink-0`}>
        <div className="p-4 border-b flex items-center justify-between h-20 shrink-0">
          {isSidebarCollapsed ? (
            <div className="w-full flex justify-center">
              <img src="/assets/ags-logo.avif" alt="AGS Logo" className="h-10" />
            </div>
          ) : (
            <img src="/assets/ags-text.avif" alt="AGS WonderWorld" className="h-12" />
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 rounded hover:bg-gray-100 text-gray-600 font-bold text-lg"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? '>' : '<'}
          </button>
        </div>
        <nav className="p-4 flex-1 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl mb-2 transition-colors relative
                ${activeSection === item.id ? 'bg-accent text-primary' : 'text-secondary hover:bg-gray-100'}
                ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              {activeSection === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-r"></div>
              )}
              <span className="text-xl">{item.icon}</span>
              {!isSidebarCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full shadow-lg flex flex-col" onClick={e => e.stopPropagation()} role="menu">
            <div className="p-4 border-b flex items-center justify-between">
              <img src="/assets/ags-text.avif" alt="AGS WonderWorld" className="h-12" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 text-2xl leading-none"
                aria-label="Close mobile menu"
              >
                ×
              </button>
            </div>
            <nav className="p-4 flex-1 overflow-y-auto">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl mb-2 transition-colors relative
                    ${activeSection === item.id ? 'bg-accent text-primary' : 'text-secondary hover:bg-gray-100'}`}
                  role="menuitem"
                >
                  {activeSection === item.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-r"></div>
                  )}
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto flex flex-col">
        <header className="bg-white shadow-md p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => (window.innerWidth < 1024 ? setIsMobileMenuOpen(true) : setIsSidebarCollapsed(!isSidebarCollapsed))}
                className="p-2 rounded-full hover:bg-gray-100 transition text-gray-700 lg:hidden"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-primary">
                {menuItems.find(m => m.id === activeSection)?.label}
              </h1>
            </div>
            <button onClick={handleLogout} className="login-btn">Logout</button>
          </div>
        </header>
        <main className="p-4 flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
}