import React, { useState, useEffect } from 'react';
import { getTicketCount, createTickets, getTicketPricing, makePayment, getPaymentStatus, getMyOrders, getOrderDetails } from '../../api';
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
  const [currentTransactionId, setCurrentTransactionId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [phonepeScriptLoaded, setPhonepeScriptLoaded] = useState(false);
  const [paymentTimeoutId, setPaymentTimeoutId] = useState(null);

  // Load PhonePe Checkout Script

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://mercury.phonepe.com/web/bundle/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('PhonePe Checkout script loaded successfully');
      setPhonepeScriptLoaded(true);
    };

    script.onerror = () => {
      console.error('Failed to load PhonePe Checkout script');
      setError('Failed to load payment gateway. Please refresh the page.');
    };

    document.body.appendChild(script);
    return () => {
     // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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

  const initiatePayment = async () => {
    if (!phonepeScriptLoaded) {
      setError('Payment gateway not loaded. Please refresh the page.');
      return;
    }

    if (!window.PhonePeCheckout) {
      setError('PhonePe checkout not available. Please refresh the page.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // First create tickets
      const ticketsRequest = {
        Adult: tickets.adult,
        Child: tickets.child
      };
      const formattedDate = parseInt(bookingDate.replace(/-/g, ''), 10);

      const ticketResponse = await createTickets(ticketsRequest, formattedDate);

      if (!ticketResponse || !ticketResponse.tickets) {
        throw new Error('Invalid ticket creation response');
      }
      
      const orderId = ticketResponse.ID;
      console.log('Order ID:', orderId);
      
      const paymentTrans = {
        order_id: orderId,
        pg_type: 0
      };

      const paymentData = await makePayment(paymentTrans);
      console.log('Payment Data:', paymentData);
      
      if (!paymentData.payment_url) {
        throw new Error(paymentData.message || 'Failed to initiate payment');
      }

      // Store transaction ID
      setCurrentTransactionId(orderId);
      setIsBookingModalOpen(false);

      // Set up 5-minute auto-cancel timeout
      const timeoutId = setTimeout(() => {
        console.log('Payment timeout - auto-cancelling after 5 minutes');
        
        // Close the PhonePe iframe if it exists
        try {
          if (window.PhonePeCheckout && window.PhonePeCheckout.close) {
            window.PhonePeCheckout.close();
          }
        } catch (e) {
          console.error('Error closing PhonePe iframe:', e);
        }

        // Reset state
        setError('Payment session expired. Please try booking again.');
        setIsBookingModalOpen(true);
        setLoading(false);
        setCurrentTransactionId(null);
      }, 5 * 60 * 1000); // 5 minutes in milliseconds

      setPaymentTimeoutId(timeoutId);

      // Define callback function
      const callback = (response) => {
        console.log('PhonePe Callback Response:', response);

        try {
          // Clear the timeout when payment completes or is cancelled
          if (timeoutId) {
            clearTimeout(timeoutId);
            setPaymentTimeoutId(null);
          }

          if (response === 'USER_CANCEL') {
            // User cancelled the payment
            console.log('User cancelled payment');
            setError('Payment cancelled by user. Please try again.');
            setIsBookingModalOpen(true);
            setLoading(false);
            setCurrentTransactionId(null);
          } else if (response === 'CONCLUDED') {
            // Transaction concluded - check status
            console.log('Payment concluded, checking status...');
            checkPaymentStatus(orderId).catch(err => {
              console.error('Error in checkPaymentStatus:', err);
              setError('Failed to verify payment. Please check My Tickets section.');
              setLoading(false);
            });
          } else {
            console.log('Unexpected callback response:', response);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error in PhonePe callback:', error);
          setError('An error occurred. Please check My Tickets section.');
          setLoading(false);
        }
      };

      // Open PhonePe PayPage in IFRAME mode
      console.log('Initiating PhonePe transaction with URL:', paymentData.payment_url);
      
      try {
        window.PhonePeCheckout.transact({
          tokenUrl: paymentData.payment_url,
          callback: callback,
          type: 'IFRAME'
        });
        console.log('PhonePe transact called successfully');
      } catch (transactError) {
        console.error('Error calling PhonePe transact:', transactError);
        // Clear timeout if transact fails
        if (timeoutId) {
          clearTimeout(timeoutId);
          setPaymentTimeoutId(null);
        }
        throw new Error('Failed to open payment window: ' + transactError.message);
      }

    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (orderId) => {
  try {
    setLoading(true);

    // getPaymentStatus already returns the JSON object
    const data = await getPaymentStatus(orderId);

    console.log("Payment status response:", data);

    if (data.status === 'COMPLETED') {
      // Payment successful - refresh tickets
      const updatedTickets = await getMyOrders();
      setUserTickets(updatedTickets || []);

      // Fetch the order details for the completed order
      try {
        const orderDetails = await getOrderDetails(orderId);
        
        // Reset booking state
        setTickets({ adult: 0, child: 0 });
        setBookingDate('');
        setBookingStep(1);
        setCurrentTransactionId(null);

        // Open the order modal with the newly booked ticket
        setSelectedOrder(orderDetails);
        setIsOrderModalOpen(true);
        setLoadingOrderDetails(false);
        
        // Optional: Show a brief success message
        alert('Payment successful! Your tickets have been booked.');
      } catch (detailsErr) {
        console.error('Failed to fetch order details:', detailsErr);
        // Still reset state and show generic success
        setTickets({ adult: 0, child: 0 });
        setBookingDate('');
        setBookingStep(1);
        setCurrentTransactionId(null);
        alert('Payment successful! Your tickets have been booked.');
      }
    } 
    else if (
      data.status === 'FAILED' ||
      data.status === 'PAYMENT_ERROR' ||
      data.status === 'PAYMENT_DECLINED'
    ) {
      setError('Payment failed. Please try again.');
    } 
    else {
      setError('Payment status: ' + (data.status || 'PENDING'));
    }

  } catch (err) {
    console.error('Status check error:', err);
    setError('Failed to verify payment status. Please contact support.');
  } finally {
    setLoading(false);
  }
};


  const handleConfirmBooking = () => {
    initiatePayment();
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

  const getUserBackground = () => {
    const authRole = localStorage.getItem("authRole");
    const baseSize = '400% 400%';
    switch (authRole) {
      case "GoldUser":
        return {
          background: 'linear-gradient(45deg, #ffd700, #ffed4e, #fff2a8, #ffd700, #ffb347)',
          backgroundSize: baseSize,
          animation: 'sheenEffect 4s ease-in-out infinite'
        };
      case "SilverUser":
        return {
          background: 'linear-gradient(45deg, #c0c0c0, #e8e8e8, #f5f5f5, #d3d3d3, #c0c0c0)',
          backgroundSize: baseSize,
        };
      case "PlatinumUser":
        return {
          background: 'linear-gradient(45deg, #e8e8e8, #c0c0c0, #a8a8a8, #d3d3d3, #b8b8b8)',
          backgroundSize: baseSize,
          animation: 'sheenEffect 5s ease-in-out infinite'
        };
      default:
        return {
          background: 'linear-gradient(45deg, #8d6aacff, #d09dfdff, #e8e8f8, #c8a8ff)',
          backgroundSize: baseSize,
          animation: 'sheenEffect 5s ease-in-out infinite'
        };
    }
  };

  const minDate = getTodayDate();
  const maxDate = getMaxDate();

  return (
    <>
      <Header />
      <div className="min-h-screen p-3 sm:p-4 shine-effect shine-effect-slow" style={{
        paddingTop: '7rem',
        paddingBottom: '0px',
        paddingInline: '0px',
        ...getUserBackground()
      }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-primary">Hello, {localStorage.getItem("authRole")?.replace(/^(\w+)?User$/, (m, prefix) => `${prefix || "Classic"} Member`) || "Classic Member"}!</h1>
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
                  const { adultCount, childCount } = getOrderTicketCounts(order?.tickets ?? []);
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

        {/* Booking Modal */}
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
                    {bookingStep === 3 ? 'Proceed to Payment' : 'Next'}
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

        {/* Order Details Modal */}
        {isOrderModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 pt-28 pb-4 z-40">
            <div className="bg-white rounded-2xl max-w-xs w-full max-h-full relative flex flex-col shadow-2xl overflow-hidden">

              {/* Sticky Header with Close and Download buttons */}
              <div className="flex justify-between items-center p-3 border-b flex-shrink-0">
                <h2 className="text-base font-semibold text-primary">Booking Details</h2>
                <div className="flex gap-2">
                  <button
                    id="download-ticket-btn"
                    onClick={async () => {
                      const ticketElement = document.getElementById('ticket-content');
                      if (!ticketElement) return;

                      try {
                        setIsDownloading(true);

                        // Create a hidden clone for download
                        const clone = ticketElement.cloneNode(true);
                        clone.style.position = 'absolute';
                        clone.style.left = '-9999px';
                        clone.style.top = '0';
                        clone.style.width = ticketElement.offsetWidth + 'px';
                        document.body.appendChild(clone);

                        // Show logo in clone only
                        const cloneLogo = clone.querySelector('#ticket-logo');
                        if (cloneLogo) {
                          cloneLogo.style.display = 'block';
                          cloneLogo.classList.remove('hidden');
                        }

                        // Wait for images to load
                        await new Promise(resolve => setTimeout(resolve, 100));

                        // Capture the clone
                        const canvas = await html2canvas(clone, {
                          backgroundColor: '#ffffff',
                          scale: 2,
                          logging: false,
                          useCORS: true,
                          allowTaint: true
                        });

                        // Remove clone immediately
                        document.body.removeChild(clone);

                        // Convert to blob and download
                        canvas.toBlob((blob) => {
                          if (blob) {
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `AGS-ticket#${selectedOrder.order.ID}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                          }
                          setIsDownloading(false);
                        });
                      } catch (error) {
                        console.error('Error downloading ticket:', error);
                        alert('Failed to download ticket. Please try again.');
                        setIsDownloading(false);
                      }
                    }}
                    disabled={isDownloading}
                    className={`p-2 rounded-full transition-all ${isDownloading
                        ? 'bg-gray-100 cursor-not-allowed'
                        : 'hover:bg-gray-100 hover:scale-110'
                      }`}
                    aria-label="Download ticket"
                  >
                    {isDownloading ? (
                      <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
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

              {/* Content - Compact, no scrolling */}
              <div className="flex-1 p-3 overflow-hidden">
                <div id="ticket-content" className="space-y-2">

                  {/* Logo - Hidden in modal, shown in download */}
                  <div id="ticket-logo" className="hidden mb-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <img
                        src="/assets/ags-logo.avif"
                        alt="AGS Logo"
                        className="h-12 w-auto"
                        crossOrigin="anonymous"
                      />
                      <img
                        src="/assets/ags-text.avif"
                        alt="AGS WonderWorld"
                        className="h-10 w-auto"
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>

                  {loadingOrderDetails ? (
                    <div className="text-center py-6">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-accent mb-2"></div>
                      <p className="text-secondary text-sm">Loading...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedOrder.qr_code && (
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-2 rounded-xl border border-purple-200 text-center">
                          <img
                            src={`${selectedOrder.qr_code}`}
                            alt="Order QR Code"
                            className="w-24 h-24 mx-auto bg-white p-1 rounded-lg shadow"
                            crossOrigin="anonymous"
                          />
                          <p className="text-xs text-secondary mt-1">
                            Show this QR code at the venue
                          </p>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-lg p-2">
                        <h3 className="font-semibold text-primary mb-1 text-xs">Booking Info</h3>
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-secondary text-xs">ID</span>
                            <span className="font-medium text-xs">#{selectedOrder.order.ID}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-secondary text-xs">Date</span>
                            <span className="font-medium text-xs">
                              {selectedOrder.order.tickets?.[0]?.booking_date
                                ? formatDateFromInt(selectedOrder.order.tickets[0].booking_date)
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-secondary text-xs">Status</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(selectedOrder.order.order_status)}`}>
                              {selectedOrder.order.order_status &&
                                selectedOrder.order.order_status.charAt(0).toUpperCase() +
                                selectedOrder.order.order_status.slice(1).toLowerCase() || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-primary text-xs">Tickets</h3>
                          {(() => {
                            const tickets = selectedOrder.order?.tickets || [];
                            const adultCount = tickets.filter(t => t.title === "Adult").length;
                            const childCount = tickets.filter(t => t.title === "Child").length;
                            return (
                              <span className="font-medium text-xs">
                                {adultCount} Adult, {childCount} Child
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary text-xs">Total Paid</span>
                          <span className="text-lg font-bold text-primary">₹{selectedOrder.order.total_amount}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
          
          @keyframes sheenEffect {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          
          @keyframes shineEffect {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          
          .shine-effect {
            position: relative;
            overflow: hidden;
          }
          
          .shine-effect::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              45deg,
              transparent 30%,
              rgba(255, 255, 255, 0.5) 50%,
              transparent 70%
            );
            transform: translateX(-100%);
            animation: shineEffect 3s ease-in-out infinite;
            pointer-events: none;
            z-index: 1;
          }
          
          .shine-effect-fast::before {
            animation: shineEffect 2s ease-in-out infinite;
          }
          
          .shine-effect-slow::before {
            animation: shineEffect 4s ease-in-out infinite;
          }
        `}</style>
      </div>
    </>
  );
}