import React, { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus } from '../../../api';

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [statusEditId, setStatusEditId] = useState(null);
  const [statusDraft, setStatusDraft] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  // Filter states
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [bookingDateFilter, setBookingDateFilter] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      setMessage({
        text: `Error fetching orders: ${error.message}`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTicketSummary = (tickets = []) => {
    let adult = 0, child = 0;
    tickets.forEach((t) => {
      if (t.title === "Adult") adult += 1;
      if (t.title === "Child") child += 1;
    });
    return { adult, child };
  };

  const formatBookingDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const str = String(dateStr);
    if (str.length === 8) {
      return `${str.substring(6, 8)}/${str.substring(4, 6)}/${str.substring(0, 4)}`;
    }
    return dateStr;
  };

  const getBookingDate = (tickets = []) => {
    if (tickets.length > 0 && tickets[0].booking_date) {
      return formatBookingDate(tickets[0].booking_date);
    }
    return "N/A";
  };

  const getBookingDateForFilter = (tickets = []) => {
    if (tickets.length > 0 && tickets[0].booking_date) {
      const str = String(tickets[0].booking_date);
      if (str.length === 8) {
        return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
      }
    }
    return "";
  };

  const handleExpand = (orderId) =>
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);

  const handleStatusEdit = (order) => {
    setStatusEditId(order.ID);
    setStatusDraft(order.order_status);
  };

  const handleStatusSave = async (orderId) => {
    setLoading(true);
    try {
      await updateOrderStatus(orderId, statusDraft);
      setOrders((prev) =>
        prev.map((o) =>
          o.ID === orderId ? { ...o, order_status: statusDraft } : o
        )
      );
      setStatusEditId(null);
      setMessage({ text: "Order status updated successfully", type: "success" });
    } catch (error) {
      setMessage({ text: `Error updating status: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    const matchesOrderId = orderIdFilter === "" || String(order.ID).includes(orderIdFilter);
    const matchesUserId = userIdFilter === "" || String(order.user_id).includes(userIdFilter);
    const matchesStatus = statusFilter === "" || order.order_status.toLowerCase() === statusFilter.toLowerCase();
    const matchesCreatedBy = createdByFilter === "" || String(order.created_by).includes(createdByFilter);

    let matchesCreatedAt = true;
    if (createdAtFilter) {
      const filterDate = new Date(createdAtFilter).toISOString().split('T')[0];
      const orderDate = new Date(order.CreatedAt).toISOString().split('T')[0];
      matchesCreatedAt = orderDate === filterDate;
    }

    let matchesBookingDate = true;
    if (bookingDateFilter) {
      const orderBookingDate = getBookingDateForFilter(order.tickets);
      matchesBookingDate = orderBookingDate === bookingDateFilter;
    }

    return matchesOrderId && matchesUserId && matchesStatus && matchesCreatedAt && matchesBookingDate && matchesCreatedBy;
  });

  return (
    <div className="p-3 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4">Order Management</h2>

      {message.text && (
        <div
          className={`mb-4 p-3 rounded-lg ${message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
            }`}
        >
          {message.text}
        </div>
      )}

      {/* Desktop View */}
      <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
        <div className="w-full">
          <table className="table-fixed w-full border-collapse divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
              <tr>
                <th className="w-[8%] px-2 py-2 text-center font-medium uppercase tracking-wider">
                  Order ID
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full p-1 border rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Search..."
                      value={orderIdFilter}
                      onChange={(e) => setOrderIdFilter(e.target.value)}
                    />
                  </div>
                </th>
                <th className="w-[10%] px-2 py-2 text-center font-medium uppercase tracking-wider">
                  User ID
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full p-1 border rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Search..."
                      value={userIdFilter}
                      onChange={(e) => setUserIdFilter(e.target.value)}
                    />
                  </div>
                </th>
                <th className="w-[12%] px-2 py-2 text-center font-medium uppercase tracking-wider">
                  Created By
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full p-1 border rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Search..."
                      value={createdByFilter}
                      onChange={(e) => setCreatedByFilter(e.target.value)}
                    />
                  </div>
                </th>
                <th className="w-[13%] px-2 py-2 text-center font-medium uppercase tracking-wider">
                  Booking Date
                  <div className="mt-2">
                    <input
                      type="date"
                      className="w-full p-1 border rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={bookingDateFilter}
                      onChange={(e) => setBookingDateFilter(e.target.value)}
                    />
                  </div>
                </th>
                <th className="w-[13%] px-2 py-2 text-center font-medium uppercase tracking-wider">
                  Created At
                  <div className="mt-2">
                    <input
                      type="date"
                      className="w-full p-1 border rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={createdAtFilter}
                      onChange={(e) => setCreatedAtFilter(e.target.value)}
                    />
                  </div>
                </th>
                <th className="w-[10%] px-2 py-2 text-center font-medium uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="w-[14%] px-2 py-2 text-center font-medium uppercase tracking-wider">
                  Status
                  <div className="mt-2">
                    <select
                      className="w-full p-1 border rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All</option>
                      {statusOptions.map((opt) => (
                        <option value={opt.value} key={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
                <th className="w-[10%] px-2 py-2 text-center font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-400 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    {orders.length === 0 ? 'No orders found' : 'No orders match the current filters'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const ticketSummary = getTicketSummary(order.tickets);
                  const isExpanded = expandedOrderId === order.ID;

                  return (
                    <React.Fragment key={order.ID}>
                      <tr className="hover:bg-gray-100">
                        <td className="px-2 py-3 text-center break-words">{order.ID}</td>
                        <td className="px-2 py-3 text-center break-words">{order.user_id}</td>
                        <td className="px-2 py-3 text-center break-words">{order.created_by || 'N/A'}</td>
                        <td className="px-2 py-3 text-center break-words">
                          {getBookingDate(order.tickets)}
                        </td>
                        <td className="px-2 py-3 text-center break-words">
                          {new Date(order.CreatedAt).toLocaleString()}
                        </td>
                        <td className="px-2 py-3 text-center font-semibold text-green-600 break-words">
                          ₹{order.total_amount}
                        </td>
                        <td className="px-2 py-3 text-center break-words">
                          {statusEditId === order.ID ? (
                            <select
                              value={statusDraft}
                              onChange={(e) => setStatusDraft(e.target.value)}
                              className="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                              disabled={loading}
                            >
                              {statusOptions.map((s) => (
                                <option value={s.value} key={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${order.order_status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : order.order_status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : order.order_status === 'completed'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                            >
                              {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <div className="flex justify-center items-center space-x-1">
                            <button
                              className="px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-xs font-medium transition disabled:opacity-50"
                              onClick={() => handleExpand(order.ID)}
                              disabled={loading}
                            >
                              {isExpanded ? 'Hide' : 'View'}
                            </button>
                            {statusEditId === order.ID ? (
                              <button
                                className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-xs font-medium transition disabled:opacity-50"
                                onClick={() => handleStatusSave(order.ID)}
                                disabled={loading}
                              >
                                {loading ? 'Saving...' : 'Save'}
                              </button>
                            ) : (
                              <button
                                className="px-2 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600 text-xs font-medium transition disabled:opacity-50"
                                onClick={() => handleStatusEdit(order)}
                                disabled={loading}
                              >
                                Update
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-gradient-to-r from-blue-50 to-purple-50">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="bg-white rounded-lg p-4 shadow-inner">
                              <h4 className="text-lg font-semibold mb-3 text-gray-800">
                                Ticket Summary
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                                  <div className="text-sm text-gray-600 mb-1">Adult Tickets</div>
                                  <div className="text-3xl font-bold text-blue-600">
                                    {ticketSummary.adult}
                                  </div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                                  <div className="text-sm text-gray-600 mb-1">Child Tickets</div>
                                  <div className="text-3xl font-bold text-green-600">
                                    {ticketSummary.child}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 space-y-3">
            <input
              type="text"
              value={orderIdFilter}
              onChange={(e) => setOrderIdFilter(e.target.value)}
              placeholder="Search Order ID..."
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              placeholder="Search User ID..."
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              value={createdByFilter}
              onChange={(e) => setCreatedByFilter(e.target.value)}
              placeholder="Search Created By..."
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="date"
              value={bookingDateFilter}
              onChange={(e) => setBookingDateFilter(e.target.value)}
              placeholder="Filter by Booking Date"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="date"
              value={createdAtFilter}
              onChange={(e) => setCreatedAtFilter(e.target.value)}
              placeholder="Filter by Created Date"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {orders.length === 0 ? 'No orders found' : 'No orders match the current filters'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredOrders.map((order) => {
                const ticketSummary = getTicketSummary(order.tickets);
                const isExpanded = expandedOrderId === order.ID;

                return (
                  <div key={order.ID} className="p-4 hover:bg-gray-50">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs text-gray-500">Order ID</div>
                          <div className="font-semibold text-lg">#{order.ID}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.order_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.order_status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                          }`}>
                          {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500">User ID</div>
                          <div className="font-medium">{order.user_id}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Created By</div>
                          <div className="font-medium">{order.created_by || 'N/A'}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500">Total Amount</div>
                          <div className="font-semibold text-green-600">₹{order.total_amount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Booking Date</div>
                          <div className="font-medium">{getBookingDate(order.tickets)}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500">Created At</div>
                        <div className="font-medium text-sm">{new Date(order.CreatedAt).toLocaleString()}</div>
                      </div>

                      {isExpanded && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mt-3">
                          <h4 className="font-semibold mb-3 text-gray-800">Ticket Summary</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                              <div className="text-xs text-gray-600 mb-1">Adult</div>
                              <div className="text-2xl font-bold text-blue-600">{ticketSummary.adult}</div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                              <div className="text-xs text-gray-600 mb-1">Child</div>
                              <div className="text-2xl font-bold text-green-600">{ticketSummary.child}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2 pt-2">
                        <button
                          onClick={() => handleExpand(order.ID)}
                          className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50"
                          disabled={loading}
                        >
                          {isExpanded ? 'Hide' : 'View'} Tickets
                        </button>
                        {statusEditId === order.ID ? (
                          <div className="space-y-2">
                            <select
                              value={statusDraft}
                              onChange={(e) => setStatusDraft(e.target.value)}
                              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              disabled={loading}
                            >
                              {statusOptions.map((s) => (
                                <option value={s.value} key={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleStatusSave(order.ID)}
                              className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                              disabled={loading}
                            >
                              {loading ? 'Saving...' : 'Save Status'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStatusEdit(order)}
                            className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition disabled:opacity-50"
                            disabled={loading}
                          >
                            Update Status
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;