import React, { useState } from 'react';
import { setTicketCount } from '../../../api'; // Assuming API function

const TicketCountManagement = () => {
    const [dateMode, setDateMode] = useState('single');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [ticketCounts, setTicketCounts] = useState({
      adult_count: '',
      child_count: ''
    });
    const [message, setMessage] = useState({ text: '', type: '' });
  
    const today = new Date().toISOString().split('T')[0];
  
    const getMaxEndDate = () => {
      if (!startDate) return '';
      const start = new Date(startDate);
      const maxDate = new Date(start);
      maxDate.setMonth(maxDate.getMonth() + 1);
      return maxDate.toISOString().split('T')[0];
    };
  
    const handleDateModeChange = (mode) => {
      setDateMode(mode);
      if (mode === 'single') {
        setEndDate('');
      }
    };
  
    const handleCountChange = (ticketType, value) => {
      setTicketCounts(prev => ({
        ...prev,
        [ticketType]: parseInt(value, 10) || 0
      }));
    };
  
    const generateDateRange = (start, end) => {
      const dateRange = [];
      let currentDate = new Date(start);
      const endDateObj = new Date(end);
  
      while (currentDate <= endDateObj) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        dateRange.push(parseInt(`${year}${month}${day}`, 10));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dateRange;
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      // ... (form validation logic remains the same)
  
      try {
        const dateRange = dateMode === 'single'
          ? [parseInt(startDate.replace(/-/g, ''), 10)]
          : generateDateRange(startDate, endDate);
  
        // Use the centralized API function
        await setTicketCount(dateRange, ticketCounts);
  
        setMessage({
          text: `Successfully updated ticket counts for ${dateRange.length} day(s)`,
          type: 'success'
        });
        setStartDate('');
        setEndDate('');
        
      } catch (error) {
        setMessage({
          text: `An error occurred: ${error.message}`,
          type: 'error'
        });
      }
    };
  
    // ... (rest of the JSX remains the same)
    return (
        <div className="p-3 sm:p-6 max-w-4xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Ticket Count Management</h2>
  
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium">Set Available Ticket Counts</h3>
          </div>
  
          <div className="p-4 sm:p-6 space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <label className="block text-xs font-semibold text-gray-800 mb-2">Select Date Mode</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="single"
                    checked={dateMode === 'single'}
                    onChange={(e) => handleDateModeChange(e.target.value)}
                    className="w-4 h-4 text-accent focus:ring-accent focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700">📅 Single Day</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="multiple"
                    checked={dateMode === 'multiple'}
                    onChange={(e) => handleDateModeChange(e.target.value)}
                    className="w-4 h-4 text-accent focus:ring-accent focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700">📆 Multiple Days</span>
                </label>
              </div>
            </div>
  
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {dateMode === 'single' ? 'Date' : 'Start Date'}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {dateMode === 'multiple' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || today}
                    max={getMaxEndDate()}
                    className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}
            </div>
  
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-xs font-semibold text-gray-800 mb-2">Ticket Counts</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Adult Tickets</label>
                  <div className="flex items-center border rounded gap-2 px-3 py-2 bg-white">
                    <span className="text-gray-400 text-lg">👥</span>
                    <input
                      type="number"
                      value={ticketCounts.adult_count}
                      onChange={(e) => handleCountChange('adult_count', e.target.value)}
                      min="0"
                      className="w-full text-sm border-0 focus:outline-none focus:ring-0 p-0 bg-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Child Tickets</label>
                  <div className="flex items-center border rounded gap-2 px-3 py-2 bg-white">
                    <span className="text-gray-400 text-lg">👥</span>
                    <input
                      type="number"
                      value={ticketCounts.child_count}
                      onChange={(e) => handleCountChange('child_count', e.target.value)}
                      min="0"
                      className="w-full text-sm border-0 focus:outline-none focus:ring-0 p-0 bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
  
            {message.text && (
              <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}
  
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmit}
                className="w-full sm:w-auto px-6 py-2.5 bg-accent text-primary text-sm rounded hover:brightness-95 font-medium transition-all"
              >
                Update Ticket Counts
              </button>
            </div>
          </div>
        </div>
      </div>
    );
};
  
export default TicketCountManagement;
