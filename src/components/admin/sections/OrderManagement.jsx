import React, { useState, useEffect } from 'react';
import { getAllOrders } from '../../../api';

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
  // Filter states:
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getAllOrders();
        setOrders(data);
      } catch (error) {
        setMessage({
          text: `Error fetching orders: ${error.message}`,
          type: "error",
        });
      }
    };
    fetchOrders();
  }, []);

  const getTicketSummary = (tickets = []) => {
    let adult = 0,
      child = 0;
    tickets.forEach((t) => {
      if (t.title === "Adult") adult += 1;
      if (t.title === "Child") child += 1;
    });
    return { adult, child };
  };

  const handleExpand = (orderId) =>
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);

  const handleStatusEdit = (order) => {
    setStatusEditId(order.ID);
    setStatusDraft(order.order_status);
  };

  const handleStatusSave = (orderId) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.ID === orderId ? { ...o, order_status: statusDraft } : o
      )
    );
    setStatusEditId(null);
    setMessage({ text: "Order status updated (simulate real API call)", type: "success" });
  };

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    const matchesOrderId = orderIdFilter === "" || String(order.ID).includes(orderIdFilter);
    const matchesUserId = userIdFilter === "" || String(order.user_id).includes(userIdFilter);
    const matchesStatus = statusFilter === "" || order.order_status.toLowerCase().includes(statusFilter.toLowerCase());
    const matchesDate = dateFilter === "" ||
      new Date(order.CreatedAt).toLocaleDateString().includes(dateFilter);
    return matchesOrderId && matchesUserId && matchesStatus && matchesDate;
  });

  return (
    <div className="p-3 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4">Order Management</h2>
      {message.text && (
        <div
          className={`mb-4 p-3 rounded ${message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
            }`}
        >
          {message.text}
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">
                Order ID
                <div className="mt-1">
                  <input
                    type="text"
                    className="w-full p-1 border rounded text-xs"
                    placeholder="Search..."
                    value={orderIdFilter}
                    onChange={e => setOrderIdFilter(e.target.value)}
                  />
                </div>
              </th>
              <th className="px-4 py-2">
                User ID
                <div className="mt-1">
                  <input
                    type="text"
                    className="w-full p-1 border rounded text-xs"
                    placeholder="Search..."
                    value={userIdFilter}
                    onChange={e => setUserIdFilter(e.target.value)}
                  />
                </div>
              </th>
              <th className="px-4 py-2">Total Amount</th>
              <th className="px-4 py-2">
                Status
                <div className="mt-1">
                  <select
                    className="w-full p-1 border rounded text-xs"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="">All</option>
                    {statusOptions.map(opt => (
                      <option value={opt.value} key={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th className="px-4 py-2">
                Created At
                <div className="mt-1">
                  <input
                    type="text"
                    className="w-full p-1 border rounded text-xs"
                    placeholder="YYYY-MM-DD"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                  />
                </div>
              </th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const ticketSummary = getTicketSummary(order.tickets);
              return (
                <React.Fragment key={order.ID}>
                  <tr className="border-b">
                    <td className="px-4 py-2">{order.ID}</td>
                    <td className="px-4 py-2">{order.user_id}</td>
                    <td className="px-4 py-2">₹{order.total_amount}</td>
                    <td className="px-4 py-2">
                      {statusEditId === order.ID ? (
                        <select
                          value={statusDraft}
                          onChange={(e) => setStatusDraft(e.target.value)}
                          className="border px-2 py-1 rounded"
                        >
                          {statusOptions.map((s) => (
                            <option value={s.value} key={s.value}>{s.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize">{order.order_status}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(order.CreatedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-xs"
                        onClick={() => handleExpand(order.ID)}
                      >
                        View Tickets
                      </button>
                      {statusEditId === order.ID ? (
                        <button
                          className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-xs"
                          onClick={() => handleStatusSave(order.ID)}
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600 text-xs"
                          onClick={() => handleStatusEdit(order)}
                        >
                          Update Status
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedOrderId === order.ID && (
                    <tr className="bg-blue-50 border-t">
                      <td colSpan={6} className="px-4 py-3">
                        <div>
                          <b>Booked Tickets:</b>
                          <div className="py-2">
                            <span className="mr-4">
                              Adult: <b className="text-blue-600">{ticketSummary.adult}</b>
                            </span>
                            <span>
                              Child: <b className="text-green-600">{ticketSummary.child}</b>
                            </span>
                          </div>
                          <div>
                            <b>Ticket Details</b>
                            <ul className="ml-4 list-disc">
                              {order.tickets.map((t) => (
                                <li key={t.id}>
                                  #{t.id}: {t.title} | {t.status === "confirmed" ? "Confirmed" : "Pending"} | Date: {String(t.booking_date).replace(/(\d{4})(\d{2})(\d{2})/, "$3/$2/$1")}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagement;
