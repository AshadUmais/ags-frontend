import React, { useState, useCallback, useEffect } from 'react';
import DashboardHome from './sections/DashboardHome';
import UserManagement from './sections/UserManagement';
import AgentManagement from './sections/AgentManagement';
import OrderManagement from './sections/OrderManagement';
import TicketCountManagement from './sections/TicketCountManagement';
import TicketPricingManagement from './sections/TicketPricingManagement';
import '../public/Header.css';

const Settings = () => (
  <div className="p-3 sm:p-6">
    <h2 className="text-xl sm:text-2xl font-semibold mb-4">Settings</h2>
    <div className="bg-white rounded-lg shadow">
      <p className="p-4">Settings section content will go here.</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authRole');
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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'agents', label: 'Agent Management', icon: '🤝' },
    { id: 'orders', label: 'Order Management', icon: '🧾' },
    { id: 'ticketCount', label: 'Ticket Count', icon: '🎟️' },
    { id: 'pricing', label: 'Ticket Pricing', icon: '🏷️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const renderContent = (activeSection) => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardHome />;
      case 'users':
        return <UserManagement />;
      case 'agents':
        return <AgentManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'ticketCount':
        return <TicketCountManagement />;
      case 'pricing':
        return <TicketPricingManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-neutral overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className={`bg-white h-full shadow-lg transition-all duration-300 flex-shrink-0
                       ${isSidebarCollapsed ? 'w-20' : 'w-64'} hidden lg:flex flex-col`}>
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
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl mb-2 transition-all relative
                          ${activeSection === item.id ? 'bg-brand-primary/10 text-brand-primary font-semibold shadow-sm' : 'text-brand-text-light hover:bg-gray-50'} 
                          ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? item.label : ''}
              aria-current={activeSection === item.id ? 'page' : undefined}
            >
              {activeSection === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-r"></div>
              )}
              <span className="text-2xl shrink-0">{item.icon}</span>
              {!isSidebarCollapsed && <span className="font-medium truncate">{item.label}</span>}
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
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 text-2xl leading-none" aria-label="Close mobile menu">×</button>
            </div>
            <nav className="p-4 flex-1 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl mb-2 transition-all relative
                              ${activeSection === item.id ? 'bg-brand-primary/10 text-brand-primary font-semibold shadow-sm' : 'text-brand-text-light hover:bg-gray-50'}`}
                  role="menuitem"
                  aria-current={activeSection === item.id ? 'page' : undefined}
                >
                  {activeSection === item.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-r"></div>
                  )}
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <span className="font-medium truncate">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-md p-3 sm:p-4 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => (window.innerWidth < 1024 ? setIsMobileMenuOpen(true) : setIsSidebarCollapsed(!isSidebarCollapsed))}
                className="p-2 rounded-full hover:bg-gray-100 transition text-brand-text-light"
                aria-label={window.innerWidth < 1024 ? 'Open mobile menu' : (isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-brand-text">
                {menuItems.find((item) => item.id === activeSection)?.label}
              </h1>
            </div>
            <button onClick={handleLogout} className="login-btn" aria-label="Logout">Logout</button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{renderContent(activeSection)}</main>
      </div>
    </div>
  );
}