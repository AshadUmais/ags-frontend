import React, { useState } from 'react';
import BookTickets from './sections/BookTickets';
import MyBookings from './sections/MyBookings';
import Members from './sections/Members';
import Reports from './sections/Reports';
import Settings from './sections/Settings';

  const menuItems = [
    { id: 'book', label: 'Book Tickets', icon: '🎫' },
    { id: 'bookings', label: 'My Bookings', icon: '📋' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

export default function AgentDashboard() {
  const [activeSection, setActiveSection] = useState('book');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  return (
    <div className="flex h-screen bg-lightPurple">
      <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white h-full shadow-lg transition-all duration-300`}>
        <div className="p-4 border-b flex items-center justify-between">
          {!isSidebarCollapsed && (<h2 className="text-xl font-semibold text-primary">Agent Portal</h2>)}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1 rounded hover:bg-gray-100">{isSidebarCollapsed ? '→' : '←'}</button>
        </div>
        <nav className="p-4">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 p-2 rounded-xl mb-2 transition-colors ${activeSection === item.id ? 'bg-accent text-primary' : 'text-secondary hover:bg-gray-100'}`}>
              <span className="text-xl">{item.icon}</span>
              {!isSidebarCollapsed && (<span className="font-medium">{item.label}</span>)}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-md p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-primary">{menuItems.find(m => m.id === activeSection)?.label}</h1>
            <button onClick={() => { localStorage.removeItem('authToken'); localStorage.removeItem('authRole'); window.location.href = '/'; }} className="px-4 py-2 bg-accent text-primary rounded-xl shadow hover:brightness-95">Logout</button>
          </div>
        </header>
        <main className="p-4">{renderContent()}</main>
          </div>
    </div>
  );
}