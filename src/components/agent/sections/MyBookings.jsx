import React, { useEffect, useState } from 'react';
import { getMyOrders } from '../../../api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getMyOrders();
        setBookings(data);
      } catch (e) {
        setError('Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTicketCounts = (tickets) => {
    if (!tickets || tickets.length === 0) return '-';
    
    const adults = tickets.filter(t => t.title === 'Adult').length;
    const children = tickets.filter(t => t.title === 'Child').length;
    
    const parts = [];
    if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? 's' : ''}`);
    if (children > 0) parts.push(`${children} Child${children > 1 ? 'ren' : ''}`);
    
    return parts.join(', ') || '-';
  };

  const filtered = bookings.filter(b => {
    const statusMatch = filterStatus === 'all' || b.order_status === filterStatus;
    const orderIdMatch = orderIdFilter === '' || b.ID.toString().includes(orderIdFilter);
    return statusMatch && orderIdMatch;
  });

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold">My Bookings</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Desktop View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Order ID
                  <div className="mt-2">
                    <input
                      type="text"
                      value={orderIdFilter}
                      onChange={(e) => setOrderIdFilter(e.target.value)}
                      placeholder="Search..."
                      className="w-full p-1 border rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Tickets
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Status
                  <div className="mt-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full p-1 border rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">All</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Payment Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-400">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center p-6">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-gray-500">
                    {bookings.length === 0 ? 'No bookings found' : 'No bookings match the current filters'}
                  </td>
                </tr>
              ) : (
                filtered.map((booking) => (
                  <tr key={booking.ID} className="hover:bg-gray-200">
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      #{booking.ID}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {getTicketCounts(booking.tickets)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap font-semibold text-green-600">
                      ₹{booking.total_amount?.toFixed(2) ?? '0.00'}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        booking.order_status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : booking.order_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.order_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap capitalize">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        booking.payment_info?.status === 'completed' || booking.payment_info?.status === 'paid'
                          ? 'bg-green-100 text-green-800' 
                          : booking.payment_info?.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.payment_info?.status ?? 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden">
          <div className="p-4 space-y-3">
            <input
              type="text"
              value={orderIdFilter}
              onChange={(e) => setOrderIdFilter(e.target.value)}
              placeholder="Search Order ID..."
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {bookings.length === 0 ? 'No bookings found' : 'No bookings match the current filters'}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(booking => (
                <div key={booking.ID} className="p-4 hover:bg-gray-50">
                  <div className="mb-3">
                    <div className="text-sm text-gray-500">Order ID</div>
                    <div className="font-semibold">#{booking.ID}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-sm text-gray-500">Tickets</div>
                    <div className="font-medium">{getTicketCounts(booking.tickets)}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-sm text-gray-500">Total Amount</div>
                    <div className="font-semibold text-green-600">₹{booking.total_amount?.toFixed(2) ?? '0.00'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-sm text-gray-500">Status</div>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      booking.order_status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : booking.order_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.order_status}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Payment Status</div>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full capitalize ${
                      booking.payment_info?.status === 'completed' || booking.payment_info?.status === 'paid'
                        ? 'bg-green-100 text-green-800' 
                        : booking.payment_info?.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.payment_info?.status ?? 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default MyBookings;