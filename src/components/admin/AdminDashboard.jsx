import React, { useState, useCallback, useEffect } from 'react';
import DashboardHome from './sections/DashboardHome';
import UserManagement from './sections/UserManagement';
import AgentManagement from './sections/AgentManagement';
import OrderManagement from './sections/OrderManagement';
import TicketCountManagement from './sections/TicketCountManagement';
import TicketPricingManagement from './sections/TicketPricingManagement';

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
    localStorage.removeItem('authToken');
    localStorage.removeItem('authRole');
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.href = '/admin/login';
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // Tailwinds 'lg' breakpoint
        setIsSidebarCollapsed(true);
        setIsMobileMenuOpen(false); // Ensure mobile menu is closed if resizing from desktop
      } else {
        setIsSidebarCollapsed(false); // On desktop, keep sidebar expanded by default
        setIsMobileMenuOpen(false); // Close mobile menu if resized to desktop
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial check on mount
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
             <div className="p-4 border-b flex items-center justify-center h-20 shrink-0">
                {isSidebarCollapsed ? (
                    <img src="https://static.wixstatic.com/media/602df3_3ad5c7c13b304d8fa12412a2775187c9~mv2.png/v1/fill/w_115,h_118,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/AGS%20LOGO.png" alt="AGS Logo" className="h-10" />
                ) : (
                    <img src="https://static.wixstatic.com/media/602df3_7d6aee23192c4640ac4839d4c2a38fe6~mv2.png/v1/fill/w_338,h_95,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/ags%20TEXT.png" alt="AGS ParkParadise Logo" className="h-12" />
                )}
            </div>
            <nav className="p-4 flex-1 overflow-y-auto">
            {menuItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl mb-2 transition-all 
                                ${activeSection === item.id ? 'bg-brand-primary/10 text-brand-primary font-semibold shadow-sm' : 'text-brand-text-light hover:bg-gray-50'} 
                                ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    title={isSidebarCollapsed ? item.label : ''}
                    aria-current={activeSection === item.id ? 'page' : undefined}
                >
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
                        <img src="https://static.wixstatic.com/media/602df3_7d6aee23192c4640ac4839d4c2a38fe6~mv2.png/v1/fill/w_338,h_95,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/ags%20TEXT.png" alt="AGS ParkParadise Logo" className="h-12" />
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
                                className={`w-full flex items-center gap-4 p-3 rounded-xl mb-2 transition-all 
                                            ${activeSection === item.id ? 'bg-brand-primary/10 text-brand-primary font-semibold shadow-sm' : 'text-brand-text-light hover:bg-gray-50'}`}
                                role="menuitem"
                                aria-current={activeSection === item.id ? 'page' : undefined}
                            >
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
                        {/* Toggle sidebar button for desktop, mobile menu button for mobile */}
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
                    <button onClick={handleLogout} className="px-4 py-2 bg-accent text-primary rounded-xl shadow hover:brightness-95" aria-label="Logout">Logout</button>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">{renderContent(activeSection)}</main>
        </div>
    </div>
  );
};