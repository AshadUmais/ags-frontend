import React, { useState, useEffect } from 'react';
import { getTicketCount, createTickets, getTicketPricing, createOrder, getMyOrders, getOrderDetails } from '../../api';
import Header from '../public/Header';
import html2canvas from 'html2canvas';

// Helper Functions
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const formatDateFromInt = (dateInt) => {
  const dateStr = dateInt.toString();
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return formatDate(`${year}-${month}-${day}`);
};

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getMaxDate = () => {
  const today = new Date();
  today.setMonth(today.getMonth() + 3);
  return today.toISOString().split('T')[0];
};

const MAX_TICKETS_PER_BOOKING = 20;

export default function UserDashboard() {
  const [bookingDate, setBookingDate] = useState('');
  const [tickets, setTickets] = useState({ adult: 0, child: 0 });
  const [ticketAvailability, setTicketAvailability] = useState({ adult: 0, child: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [userTickets, setUserTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketPrices, setTicketPrices] = useState({
    adult: { price: 0 },
    child: { price: 0 }
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchUserTickets = async () => {
      try {
        setLoadingTickets(true);
        const response = await getMyOrders();
        setUserTickets(response || []);
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
      } finally {
        setLoadingTickets(false);
      }
    };
    fetchUserTickets();
  }, []);

  useEffect(() => {
    const fetchTicketAvailability = async () => {
      if (!bookingDate) return;

      try {
        setCheckingAvailability(true);
        setError('');
        const formattedDate = parseInt(bookingDate.replace(/-/g, ''), 10);
        console.log('Formatted date for API:', formattedDate);

        const availability = await getTicketCount(formattedDate);

        setTicketAvailability({
          adult: availability.adult_tickets || 0,
          child: availability.child_tickets || 0
        });

        setTickets(prev => ({
          adult: Math.min(prev.adult, availability.adult || 0),
          child: Math.min(prev.child, availability.child || 0)
        }));

        const priceData = await getTicketPricing(formattedDate);
        console.log('Fetched price data:', priceData);

        setTicketPrices({
          adult: { price: Number(priceData.adult_ticket_price) || 0 },
          child: { price: Number(priceData.child_ticket_price) || 0 }
        });
      } catch (err) {
        const errorMessage = err.message || 'Failed to check ticket availability';
        setError(`${errorMessage}. Please check console for details.`);
        setTicketAvailability({ adult: 0, child: 0 });
        console.error('Failed to fetch availability:', err);
      } finally {
        setCheckingAvailability(false);
      }
    };

    fetchTicketAvailability();
  }, [bookingDate]);

  const getTotalTickets = () => tickets.adult + tickets.child;

  const handleQuantityChange = (type, operation) => {
    const currentValue = tickets[type];
    const maxAvailable = ticketAvailability[type];
    const currentTotal = getTotalTickets();

    if (operation === 'add') {
      if (currentTotal >= MAX_TICKETS_PER_BOOKING) {
        setError(`Maximum ${MAX_TICKETS_PER_BOOKING} tickets allowed per booking`);
        return;
      }
      if (currentValue >= maxAvailable) {
        setError(`Only ${maxAvailable} ${type} tickets available`);
        return;
      }
      setTickets(prev => ({ ...prev, [type]: prev[type] + 1 }));
      setError('');
    } else if (operation === 'subtract' && currentValue > 0) {
      setTickets(prev => ({ ...prev, [type]: prev[type] - 1 }));
      setError('');
    }
  };

  const calculateTotal = () => {
    const adultTotal = tickets.adult * ticketPrices.adult.price;
    const childTotal = tickets.child * ticketPrices.child.price;
    return adultTotal + childTotal;
  };

  const canProceedToNextStep = () => {
    if (bookingStep === 1) {
      return bookingDate && !checkingAvailability;
    }
    if (bookingStep === 2) {
      const totalTickets = getTotalTickets();
      return totalTickets > 0 && totalTickets <= MAX_TICKETS_PER_BOOKING;
    }
    return true;
  };

  const handleNextStep = () => {
    if (bookingStep === 1) {
      if (!bookingDate) {
        setError('Please select a booking date');
        return;
      }
      if (checkingAvailability) {
        setError('Checking availability...');
        return;
      }
      const totalAvailable = ticketAvailability.adult + ticketAvailability.child;
      if (totalAvailable === 0) {
        setError('No tickets available for the selected date. Please choose another date.');
        return;
      }
      setError('');
      setBookingStep(2);
    } else if (bookingStep === 2) {
      const totalTickets = getTotalTickets();
      if (totalTickets === 0) {
        setError('Please select at least one ticket');
        return;
      }
      if (totalTickets > MAX_TICKETS_PER_BOOKING) {
        setError(`Maximum ${MAX_TICKETS_PER_BOOKING} tickets allowed per booking`);
        return;
      }
      if (tickets.adult > ticketAvailability.adult) {
        setError(`Only ${ticketAvailability.adult} adult tickets available`);
        return;
      }
      if (tickets.child > ticketAvailability.child) {
        setError(`Only ${ticketAvailability.child} child tickets available`);
        return;
      }
      setError('');
      setBookingStep(3);
    }
  };

  const handleBooking = async (e) => {
    e?.preventDefault?.();

    try {
      setLoading(true);
      setError('');

      const ticketsRequest = {
        Adult: tickets.adult,
        Child: tickets.child
      };
      const formattedDate = parseInt(bookingDate.replace(/-/g, ''), 10);

      const ticketResponse = await createTickets(ticketsRequest, formattedDate);

      if (!ticketResponse || !ticketResponse.tickets) {
        throw new Error('Invalid ticket creation response');
      }

      // const orderData = {
      //   ticket_ids: ticketResponse.tickets.map(t => t.id),
      //   total_amount: calculateTotal(),
      //   currency: 'INR'
      // };
      // await createOrder(orderData);

      const updatedTickets = await getMyOrders();
      setUserTickets(updatedTickets || []);

      setTickets({ adult: 0, child: 0 });
      setBookingDate('');
      setError('');
      setBookingStep(1);
      setIsBookingModalOpen(false);

      setPaymentSuccess(true);

      setTimeout(() => {
        setPaymentSuccess(false);
        setIsPaymentModalOpen(false);
      }, 5000);
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to process booking. Please try again.');
      setIsPaymentModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = () => {
    setIsPaymentModalOpen(true);
  };

  const handleOrderClick = async (order) => {
  setSelectedOrder(order);
  setIsOrderModalOpen(true);
  setLoadingOrderDetails(true);

  try {
    const orderDetails = await getOrderDetails(order.ID);
    setSelectedOrder(orderDetails);
  } catch (err) {
    console.error('Failed to fetch order details:', err);
    // Optionally show error message to user
  } finally {
    setLoadingOrderDetails(false);
  }
};
  const getOrderTicketCounts = (tickets) => {
    const adultCount = tickets.filter(t => t.title === 'Adult').length;
    const childCount = tickets.filter(t => t.title === 'Child').length;
    return { adultCount, childCount };
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const minDate = getTodayDate();
  const maxDate = getMaxDate();

  return (
    <>
      <Header />
      <div className="min-h-screen p-3 sm:p-4" style={{ paddingTop: '7rem', paddingBottom: '0px', paddingInline: '0px', backgroundColor: 'linear-gradient(135deg, #f8f9fa, #b25affff)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-primary">Hello, {localStorage.getItem("authRole")?.replace("User", " Member") || "User"}!</h1>
              <p className="text-sm text-secondary">Book your tickets here</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsBookingModalOpen(true);
                  setBookingStep(1);
                  setTickets({ adult: 0, child: 0 });
                  setBookingDate('');
                  setError('');
                }}
                className="px-4 py-2 bg-accent text-primary rounded-xl shadow hover:brightness-95"
              >
                Book Tickets
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-center text-primary">My Tickets</h2>
            <p className="text-sm text-center text-secondary mb-6">Your booked tickets</p>
            {loadingTickets ? (
              <div className="text-center py-8 text-secondary">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-2"></div>
                <p>Loading your orders...</p>
              </div>
            ) : userTickets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-secondary mb-4">You don't have any orders yet</p>
                <button
                  onClick={() => {
                    setIsBookingModalOpen(true);
                    setBookingStep(1);
                    setTickets({ adult: 0, child: 0 });
                    setBookingDate('');
                    setError('');
                  }}
                  className="px-6 py-3 bg-accent text-primary rounded-xl shadow-lg hover:brightness-95"
                >
                  Book Your First Ticket
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userTickets.map((order) => {
                  const { adultCount, childCount } = getOrderTicketCounts(order.tickets || []);
                  const bookingDate = order.tickets?.[0]?.booking_date;

                  return (
                    <div
                      key={order.ID}
                      onClick={() => handleOrderClick(order)}
                      className="bg-gradient-to-br from-purple-50 to-blue-50 p-5 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h2 className="font-semibold text-primary text-lg">Booking Id #{order.ID}</h2>
                          <p className="text-sm text-secondary">
                            {bookingDate ? formatDateFromInt(bookingDate) : 'Date N/A'}
                          </p>
                        </div>
                        <div className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(order.order_status)}`}>
                          {order.order_status || 'N/A'}
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        {adultCount > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-secondary">Adult Tickets</span>
                            <span className="font-medium text-primary">{adultCount}</span>
                          </div>
                        )}
                        {childCount > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-secondary">Child Tickets</span>
                            <span className="font-medium text-primary">{childCount}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-purple-200 flex justify-between items-center">
                        <span className="text-sm font-medium text-secondary">Total Amount</span>
                        <span className="text-lg font-bold text-primary">₹{order.total_amount}</span>
                      </div>

                      <div className="mt-3 text-xs text-purple-600 text-center">
                        Click to view details & QR code
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {isBookingModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-primary">Book Tickets</h2>
                <button
                  onClick={() => {
                    setIsBookingModalOpen(false);
                    setBookingStep(1);
                    setTickets({ adult: 0, child: 0 });
                    setBookingDate('');
                    setError('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex justify-between mb-8">
                <div className={`flex-1 text-center ${bookingStep >= 1 ? 'text-primary' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${bookingStep >= 1 ? 'bg-accent text-primary' : 'bg-gray-200'}`}>1</div>
                  <p className="text-xs">Select Date</p>
                </div>
                <div className={`flex-1 text-center ${bookingStep >= 2 ? 'text-primary' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${bookingStep >= 2 ? 'bg-accent text-primary' : 'bg-gray-200'}`}>2</div>
                  <p className="text-xs">Choose Tickets</p>
                </div>
                <div className={`flex-1 text-center ${bookingStep >= 3 ? 'text-primary' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${bookingStep >= 3 ? 'bg-accent text-primary' : 'bg-gray-200'}`}>3</div>
                  <p className="text-xs">Confirm</p>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 mb-4 text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <div className="mb-6">
                {bookingStep === 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <input
                      type="date"
                      min={minDate}
                      max={maxDate}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />

                    {checkingAvailability && (
                      <div className="mt-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                        <p className="mt-2 text-sm text-secondary">Checking availability...</p>
                      </div>
                    )}

                    {!checkingAvailability && error && (
                      <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm text-center">
                        {error}
                      </div>
                    )}

                    {!checkingAvailability && !error && bookingDate && ticketAvailability && (
                      <div className="mt-4">
                        {Number(ticketAvailability.adult) + Number(ticketAvailability.child) > 0 ? (
                          <div className="p-4 bg-accent rounded-lg border border-accent">
                            <p className="text-sm font-medium text-primary mb-2">
                              {formatDate(bookingDate)}
                            </p>
                            <p className="text-xs text-secondary mt-1">
                              Tickets Available
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-sm font-medium text-red-900 mb-1">
                              No tickets available
                            </p>
                            <p className="text-xs text-red-700">
                              Tickets haven't been released for this date yet. Please try another date or contact support.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {bookingStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adult Tickets (₹{ticketPrices.adult.price})
                      </label>
                      <div className="flex items-center space-x-4">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange('adult', 'subtract')}
                          disabled={tickets.adult === 0}
                          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >-</button>
                        <span className="text-2xl font-medium w-6 text-center">{tickets.adult}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange('adult', 'add')}
                          disabled={tickets.adult >= ticketAvailability.adult || getTotalTickets() >= MAX_TICKETS_PER_BOOKING}
                          className="w-6 h-6 rounded-full bg-accent text-primary flex items-center justify-center hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >+</button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Child Tickets (₹{ticketPrices.child.price})
                      </label>
                      <div className="flex items-center space-x-4">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange('child', 'subtract')}
                          disabled={tickets.child === 0}
                          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >-</button>
                        <span className="text-2xl font-medium w-6 text-center">{tickets.child}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange('child', 'add')}
                          disabled={tickets.child >= ticketAvailability.child || getTotalTickets() >= MAX_TICKETS_PER_BOOKING}
                          className="w-6 h-6 rounded-full bg-accent text-primary flex items-center justify-center hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >+</button>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">Max {MAX_TICKETS_PER_BOOKING} tickets per booking</span>
                      </p>
                    </div>
                  </div>
                )}

                {bookingStep === 3 && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium mb-3 text-primary">Booking Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-secondary">Date</span>
                          <span className="font-medium">{formatDate(bookingDate)}</span>
                        </div>
                        {tickets.adult > 0 && (
                          <div className="flex justify-between">
                            <span className="text-secondary">Adult Tickets</span>
                            <span className="font-medium">{tickets.adult} × ₹{ticketPrices.adult.price}</span>
                          </div>
                        )}
                        {tickets.child > 0 && (
                          <div className="flex justify-between">
                            <span className="text-secondary">Child Tickets</span>
                            <span className="font-medium">{tickets.child} × ₹{ticketPrices.child.price}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-300">
                          <span className="font-semibold text-primary">Total Amount</span>
                          <span className="font-semibold text-primary text-lg">₹{calculateTotal()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-3">
                {bookingStep > 1 && (
                  <button
                    onClick={() => {
                      setBookingStep(prev => prev - 1);
                      setError('');
                    }}
                    className="px-6 py-2 text-primary bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Back
                  </button>
                )}
                {!loading ? (
                  <button
                    onClick={(e) => {
                      if (bookingStep === 3) {
                        handleConfirmBooking();
                      } else {
                        handleNextStep();
                      }
                    }}
                    disabled={!canProceedToNextStep()}
                    className={`px-6 py-2 rounded-lg ml-auto transition ${canProceedToNextStep()
                      ? 'bg-accent text-primary hover:brightness-95'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {bookingStep === 3 ? 'Confirm Booking' : 'Next'}
                  </button>
                ) : (
                  <div className="px-6 py-2 bg-gray-200 text-gray-500 rounded-lg ml-auto flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                    Processing...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isOrderModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 pt-20">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden relative">

              {/* Sticky Header with Close and Download buttons */}
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-primary">Booking Details</h2>
                <div className="flex gap-2">
                  <button
                    id="download-ticket-btn"
                    onClick={async () => {
                      const ticketElement = document.getElementById('ticket-content');
                      const logo = document.getElementById('ticket-logo');
                      if (!ticketElement) return;

                      const downloadBtn = document.getElementById('download-ticket-btn');
                      const closeBtn = document.getElementById('close-ticket-btn');

                      try {
                        // Hide buttons and show logo
                        if (downloadBtn) downloadBtn.style.display = 'none';
                        if (closeBtn) closeBtn.style.display = 'none';
                        if (logo) logo.style.display = 'block';

                        // Wait for UI to update
                        await new Promise(resolve => setTimeout(resolve, 100));
                        const canvas = await html2canvas(ticketElement, {
                          backgroundColor: '#ffffff',
                          scale: 2,
                          logging: false,
                          useCORS: true
                        });

                        // Convert to blob and download
                        canvas.toBlob((blob) => {
                          if (blob) {
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `AGSticket-${selectedOrder.order.ID}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                          }

                          // Show buttons and hide logo again
                          if (downloadBtn) downloadBtn.style.display = 'block';
                          if (closeBtn) closeBtn.style.display = 'block';
                          if (logo) logo.style.display = 'none';
                        });
                      } catch (error) {
                        console.error('Error downloading ticket:', error);
                        // Always restore UI on error
                        if (downloadBtn) downloadBtn.style.display = 'block';
                        if (closeBtn) closeBtn.style.display = 'block';
                        if (logo) logo.style.display = 'none';
                        alert('Failed to download ticket. Please try again.');
                      }
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Download ticket"
                  >
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    id="close-ticket-btn"
                    onClick={() => {
                      setIsOrderModalOpen(false);
                      setSelectedOrder(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-6 h-6 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
                <div id="ticket-content" className="p-6">

                  {/* Logo - Hidden in modal, shown in download */}
                  <div id="ticket-logo" className="hidden mb-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <img
                        src="/assets/ags-logo.avif"
                        alt="AGS Logo"
                        className="h-18 w-auto"
                        crossOrigin="anonymous"
                      />
                      <img
                        src="/assets/ags-text.avif"
                        alt="AGS WonderWorld"
                        className="h-16 w-auto"
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>

                  {loadingOrderDetails ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-2"></div>
                      <p className="text-secondary">Loading booking details...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedOrder.qr_code && (
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
                          <div className="flex justify-center mb-3">
                            <img
                              src={`${selectedOrder.qr_code}`}
                              alt="Order QR Code"
                              className="w-48 h-48 bg-white p-2 rounded-lg shadow"
                              crossOrigin="anonymous"
                            />
                          </div>
                          <p className="text-xs text-center text-secondary">
                            Show this QR code at the venue
                          </p>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-primary mb-3">Booking Info</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-secondary text-sm">Booking ID</span>
                            <span className="font-medium">#{selectedOrder.order.ID}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary text-sm">Date</span>
                            <span className="font-medium">
                              {selectedOrder.order.tickets?.[0]?.booking_date
                                ? formatDateFromInt(selectedOrder.order.tickets[0].booking_date)
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary text-sm">Status</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(selectedOrder.order.order_status)}`}>
                              {selectedOrder.order.order_status &&
                                selectedOrder.order.order_status.charAt(0).toUpperCase() +
                                selectedOrder.order.order_status.slice(1).toLowerCase() || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                        <h3 className="font-semibold text-primary">Tickets</h3>
                        {(() => {
                          const tickets = selectedOrder.order?.tickets || [];
                          const adultCount = tickets.filter(t => t.title === "Adult").length;
                          const childCount = tickets.filter(t => t.title === "Child").length;

                          return (
                            <span className="font-semibold text-primary">
                              {adultCount} Adult{adultCount !== 1 ? 's' : ''}, {childCount} Child{childCount !== 1 ? 'ren' : ''}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary">Total Amount Paid</span>
                          <span className="text-2xl font-bold text-primary">₹{selectedOrder.order.total_amount}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Payment Gateway Modal */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              {!paymentSuccess ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-primary mb-2">Payment Gateway</h2>
                    <p className="text-secondary text-sm">Mock Payment Processing</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-secondary">Amount to Pay</span>
                      <span className="text-3xl font-bold text-primary">₹{calculateTotal()}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">Booking Date</span>
                        <span className="font-medium">{formatDate(bookingDate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">Total Tickets</span>
                        <span className="font-medium">{getTotalTickets()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleBooking}
                      disabled={loading}
                      className="w-full px-6 py-3 bg-accent text-primary rounded-xl shadow-lg hover:brightness-95 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                          Processing Payment...
                        </span>
                      ) : (
                        'Pay Now'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsPaymentModalOpen(false);
                        setError('');
                      }}
                      disabled={loading}
                      className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-green-600 mb-2">Payment Successful!</h2>
                  <p className="text-secondary">Your booking has been confirmed</p>
                  <p className="text-sm text-gray-500 mt-4">Redirecting to your tickets...</p>
                </div>
              )}
            </div>
          </div>
        )}

        <style>{`
          @keyframes scale-in {
            0% {
              transform: scale(0);
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }
          .animate-scale-in {
            animation: scale-in 0.5s ease-out;
          }
        `}</style>
      </div>
    </>
  );
}