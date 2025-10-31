import React, { useState, useEffect } from 'react';
import { getAllBookings } from '../../../api';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [filters, setFilters] = useState({
    date: '',
    username: '',
    orderId: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await getAllBookings();
        setBookings(data);
        setFilteredBookings(data);
      } catch (error) {
        setMessage({ text: `Error fetching bookings: ${error.message}`, type: 'error' });
      }
    };
    fetchBookings();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    let result = bookings;
    if (filters.date) {
        const formattedDate = filters.date.replace(/-/g, '');
        result = result.filter(b => b.date.toString().startsWith(formattedDate));
    }
    if (filters.username) {
        result = result.filter(b => b.username.toLowerCase().includes(filters.username.toLowerCase()));
    }
    if (filters.orderId) {
        result = result.filter(b => b.order_id.toString().includes(filters.orderId));
    }
    setFilteredBookings(result);
  }, [filters, bookings]);

  return (
    <div className="p-3 sm:p-6">
    <h2 className="text-xl sm:text-2xl font-semibold mb-4">Booking Management</h2>
    {message.text && (
      <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {message.text}
      </div>
    )}
    <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
                type="date" 
                name="date" 
                value={filters.date} 
                onChange={handleFilterChange} 
                className="p-2 border rounded-md"
            />
            <input 
                type="text" 
                name="username" 
                value={filters.username} 
                onChange={handleFilterChange} 
                placeholder="Filter by Username"
                className="p-2 border rounded-md"
            />
            <input 
                type="text" 
                name="orderId" 
                value={filters.orderId} 
                onChange={handleFilterChange} 
                placeholder="Filter by Order ID"
                className="p-2 border rounded-md"
            />
        </div>
    </div>
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adult Tickets</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Child Tickets</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredBookings.map((booking) => (
            <tr key={booking.order_id}>
              <td className="px-6 py-4 whitespace-nowrap">{booking.date}</td>
              <td className="px-6 py-4 whitespace-nowrap">{booking.username}</td>
              <td className="px-6 py-4 whitespace-nowrap">{booking.order_id}</td>
              <td className="px-6 py-4 whitespace-nowrap">{booking.adult_tickets}</td>
              <td className="px-6 py-4 whitespace-nowrap">{booking.child_tickets}</td>
              <td className="px-6 py-4 whitespace-nowrap">₹{booking.total_price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  );
};

export default BookingManagement;
