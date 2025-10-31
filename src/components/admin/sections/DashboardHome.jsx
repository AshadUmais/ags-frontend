import React from 'react';

const DashboardHome = () => (
  <div className="p-3 sm:p-6">
    <h2 className="text-xl sm:text-2xl font-semibold mb-4">Dashboard Overview</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-base sm:text-lg font-medium mb-2">Total Users</h3>
        <p className="text-2xl sm:text-3xl font-bold text-primary">1,234</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-base sm:text-lg font-medium mb-2">Active Agents</h3>
        <p className="text-2xl sm:text-3xl font-bold text-primary">56</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-base sm:text-lg font-medium mb-2">Total Bookings</h3>
        <p className="text-2xl sm:text-3xl font-bold text-primary">789</p>
      </div>
    </div>
  </div>
);

export default DashboardHome;
