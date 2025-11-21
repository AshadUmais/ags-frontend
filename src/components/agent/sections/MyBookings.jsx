import React, { useEffect, useState } from 'react';
import { getMyOrders, getOrderDetails } from '../../../api';
import html2canvas from 'html2canvas';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  /** Fetch User's Bookings */
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

  /** Filter tickets display */
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

  /** Format booking date */
  const formatDateFromInt = (dateInt) => {
    if (!dateInt) return 'N/A';
    const s = dateInt.toString();
    const y = s.slice(0, 4);
    const m = s.slice(4, 6);
    const d = s.slice(6, 8);
    return new Date(`${y}-${m}-${d}`).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  /** Colors for status label */
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  /** Row click → open modal + load full order */
  const handleRowClick = async (id) => {
    try {
      setIsOrderModalOpen(true);
      setLoadingOrderDetails(true);

      const fullOrder = await getOrderDetails(id);
      setSelectedOrder(fullOrder);
    } catch (err) {
      console.error(err);
      setError('Failed to load ticket');
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  /** Download ticket image */
  const handleDownload = async () => {
    const ticketElement = document.getElementById('mybookings-ticket');
    if (!ticketElement) return;
    try {
      setIsDownloading(true);

      const clone = ticketElement.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = ticketElement.offsetWidth + "px";
      document.body.appendChild(clone);

      await new Promise(res => setTimeout(res, 100));

      const canvas = await html2canvas(clone, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      document.body.removeChild(clone);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `AGS-ticket-${selectedOrder.order.ID}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });

      setIsDownloading(false);
    } catch (err) {
      console.error(err);
      alert("Failed to download ticket");
      setIsDownloading(false);
    }
  };

  /** Share Ticket (Mobile + Desktop WhatsApp) */
  const handleShareWhatsApp = async () => {
    const ticketElement = document.getElementById('mybookings-ticket');
    if (!ticketElement || !selectedOrder) return;

    try {
      setIsSharing(true);

      const clone = ticketElement.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = ticketElement.offsetWidth + 'px';
      document.body.appendChild(clone);

      await new Promise(resolve => setTimeout(resolve, 120));

      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      document.body.removeChild(clone);

      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) return;

      const file = new File(
        [blob],
        `AGS-ticket-${selectedOrder.order.ID}.png`,
        { type: 'image/png' }
      );

      const message = `Your AGS WonderWorld Ticket\nBooking #${selectedOrder.order.ID}\nDate: ${formatDateFromInt(selectedOrder.order.tickets[0]?.booking_date)}\nTotal: ₹${selectedOrder.order.total_amount}`;

      // Mobile share support
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "AGS Ticket",
          text: message
        });
        setIsSharing(false);
        return;
      }

      // Desktop fallback → WhatsApp web
      const urlMsg = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${urlMsg}`, "_blank");

      setIsSharing(false);

    } catch (err) {
      console.error("Share error:", err);
      alert("Failed to share ticket");
      setIsSharing(false);
    }
  };

  // ================================================
  //                  RENDER UI
  // ================================================

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold">My Bookings</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">

        {/* DESKTOP TABLE */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase">
                  Order ID
                  <div className="mt-2">
                    <input
                      type="text"
                      value={orderIdFilter}
                      onChange={e => setOrderIdFilter(e.target.value)}
                      placeholder="Search..."
                      className="w-full p-1 border rounded-md text-xs text-gray-700"
                    />
                  </div>
                </th>

                <th className="px-6 py-3 text-center text-xs font-medium uppercase">Tickets</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase">Amount</th>

                <th className="px-6 py-3 text-center text-xs font-medium uppercase">
                  Status
                  <div className="mt-2">
                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="w-full p-1 border rounded-md text-xs text-gray-700"
                    >
                      <option value="all">All</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </th>

                <th className="px-6 py-3 text-center text-xs font-medium uppercase">Payment</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-400">
              {loading ? (
                <tr><td colSpan={5} className="text-center p-6">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-6 text-gray-500">
                  No matching bookings
                </td></tr>
              ) : (
                filtered.map(booking => (
                  <tr
                    key={booking.ID}
                    onClick={() => handleRowClick(booking.ID)}
                    className="hover:bg-gray-200 cursor-pointer"
                  >
                    <td className="px-6 py-4 text-center">#{booking.ID}</td>

                    <td className="px-6 py-4 text-center">{getTicketCounts(booking.tickets)}</td>

                    <td className="px-6 py-4 text-center text-green-700 font-semibold">
                      ₹{booking.total_amount?.toFixed(2)}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.order_status)}`}>
                        {booking.order_status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center capitalize">
                      {booking.payment_info?.status ?? "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>



        {/* MOBILE LIST */}
        <div className="sm:hidden">
          <div className="p-4 space-y-3">
            <input
              type="text"
              value={orderIdFilter}
              onChange={e => setOrderIdFilter(e.target.value)}
              placeholder="Search Order ID..."
              className="w-full p-2 border rounded-lg"
            />

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No bookings</div>
          ) : (
            filtered.map(booking => (
              <div
                key={booking.ID}
                className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => handleRowClick(booking.ID)}
              >
                <div className="text-sm text-gray-500">Order ID</div>
                <div className="font-semibold">#{booking.ID}</div>

                <div className="mt-2">
                  <div className="text-sm text-gray-500">Tickets</div>
                  <div>{getTicketCounts(booking.tickets)}</div>
                </div>

                <div className="mt-2">
                  <div className="text-sm text-gray-500">Amount</div>
                  <div className="text-green-700 font-semibold">₹{booking.total_amount}</div>
                </div>
              </div>
            ))
          )}
        </div>



      </div>

      {/* ===================== TICKET MODAL ===================== */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 pt-24 pb-4 z-40">
          <div className="bg-white rounded-2xl max-w-xs w-full max-h-full flex flex-col shadow-xl overflow-hidden">

            {/* Header */}
            <div className="flex justify-between items-center p-3 border-b">
              <h2 className="text-base font-semibold text-primary">Booking Details</h2>

              <div className="flex gap-2">

                {/* SHARE */}
                <button
                  onClick={handleShareWhatsApp}
                  disabled={isSharing}
                  className={`p-2 rounded-full ${isSharing ? 'opacity-50' : 'hover:bg-green-100'}`}
                >
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                  </svg>
                </button>

                {/* DOWNLOAD */}
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`p-2 rounded-full ${isDownloading ? 'opacity-50' : 'hover:bg-gray-100'}`}
                >
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>

                {/* CLOSE */}
                <button
                  onClick={() => {
                    setIsOrderModalOpen(false);
                    setSelectedOrder(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg
                    className="w-6 h-6 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

              </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-3 overflow-hidden">
              <div id="mybookings-ticket" className="space-y-2">

                {loadingOrderDetails ? (
                  <div className="text-center py-6">
                    <div className="animate-spin h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading...</p>
                  </div>
                ) : selectedOrder ? (
                  <>
                    {/* QR */}
                    {selectedOrder.qr_code && (
                      <div className="bg-purple-50 p-2 rounded-xl text-center">
                        <img
                          src={selectedOrder.qr_code}
                          className="w-24 h-24 mx-auto bg-white p-1 rounded-lg shadow"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Show this QR code at the venue
                        </p>
                      </div>
                    )}

                    {/* Booking Info */}
                    <div className="bg-gray-50 rounded-lg p-2">
                      <h3 className="font-semibold text-primary mb-1 text-xs">Booking Info</h3>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>ID</span><span>#{selectedOrder.order.ID}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Date</span>
                          <span>{formatDateFromInt(selectedOrder.order.tickets[0]?.booking_date)}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Status</span>
                          <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusColor(selectedOrder.order.order_status)}`}>
                            {selectedOrder.order.order_status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tickets Count */}
                    <div className="bg-gray-50 rounded-lg p-2 text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium">Tickets</span>
                        <span>
                          {selectedOrder.order.tickets.filter(t => t.title === 'Adult').length} Adult,{" "}
                          {selectedOrder.order.tickets.filter(t => t.title === 'Child').length} Child
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="bg-blue-100 rounded-lg p-2 flex justify-between">
                      <span className="text-primary font-semibold text-xs">Total Paid</span>
                      <span className="font-bold text-primary text-lg">
                        ₹{selectedOrder.order.total_amount}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">Failed to load ticket</div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MyBookings;
