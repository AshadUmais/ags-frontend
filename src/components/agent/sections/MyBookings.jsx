import React, { useEffect, useState } from 'react';
import { getMyOrders } from '../../../api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
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

  const filtered = filterStatus === 'all' ? bookings : bookings.filter(b => b.order_status === filterStatus);

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-primary">My Bookings</h2>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm">
          <option value="all">All</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-secondary">No bookings found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-2">Order ID</th>
                <th className="pb-2">Tickets</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(b => (
                <tr key={b.id} className="text-sm">
                  <td className="py-3">#{b.id}</td>
                  <td className="py-3">{b.tickets?.length ?? 0} ticket(s)</td>
                  <td className="py-3">₹{b.total_amount}</td>
                  <td className="py-3 capitalize">{b.order_status}</td>
                  <td className="py-3 capitalize">{b.payment_info?.status ?? 'n/a'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
