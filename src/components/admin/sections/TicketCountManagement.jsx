import React, { useState } from 'react';
import { setTicketCount } from '../../../api';

const TicketCountManagement = () => {
  const [dateMode, setDateMode] = useState('single');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ticketCounts, setTicketCounts] = useState({
    adult_count: '',
    child_count: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

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
    if (value === '') {
      setTicketCounts(prev => ({
        ...prev,
        [ticketType]: ''
      }));
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        setTicketCounts(prev => ({
          ...prev,
          [ticketType]: numValue
        }));
      }
    }
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

    if (!startDate) {
      setMessage({ text: 'Please select a date', type: 'error' });
      return;
    }

    if (dateMode === 'multiple' && !endDate) {
      setMessage({ text: 'Please select an end date', type: 'error' });
      return;
    }

    if (ticketCounts.adult_count === '' || ticketCounts.child_count === '') {
      setMessage({ text: 'Please enter both adult and child ticket counts', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const dateRange = dateMode === 'single'
        ? [parseInt(startDate.replace(/-/g, ''), 10)]
        : generateDateRange(startDate, endDate);

      const counts = {
        adult_count: parseInt(ticketCounts.adult_count, 10),
        child_count: parseInt(ticketCounts.child_count, 10)
      };

      await setTicketCount(dateRange, counts);

      setMessage({
        text: `Successfully updated ticket counts for ${dateRange.length} day(s)`,
        type: 'success'
      });
      setStartDate('');
      setEndDate('');
      setTicketCounts({ adult_count: '', child_count: '' });

    } catch (error) {
      setMessage({
        text: `An error occurred: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-6">

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-medium">Set Available Ticket Counts</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-2">
                Select Date Mode
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="single"
                    checked={dateMode === 'single'}
                    onChange={(e) => handleDateModeChange(e.target.value)}
                    className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700">📅 Single Day</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="multiple"
                    checked={dateMode === 'multiple'}
                    onChange={(e) => handleDateModeChange(e.target.value)}
                    className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700">📆 Multiple Days</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">

          {/* Date Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {dateMode === 'single' ? 'Date' : 'Start Date'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {dateMode === 'multiple' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || today}
                  max={getMaxEndDate()}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>

          {/* Ticket Counts */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Ticket Counts</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adult Tickets</label>
                <input
                  type="number"
                  value={ticketCounts.adult_count}
                  onChange={(e) => handleCountChange('adult_count', e.target.value)}
                  min="0"
                  placeholder="Enter adult ticket count"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Child Tickets</label>
                <input
                  type="number"
                  value={ticketCounts.child_count}
                  onChange={(e) => handleCountChange('child_count', e.target.value)}
                  min="0"
                  placeholder="Enter child ticket count"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-accent text-primary rounded-lg hover:brightness-95 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Ticket Counts'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketCountManagement;