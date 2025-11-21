import React, { useState, useEffect, useRef } from 'react';
import { getTicketCount, createAgentTickets, getMyWallet, getTicketPricing, makePayment, getPaymentStatus, getOrderDetails } from '../../../api';
import html2canvas from 'html2canvas';

const CalendarIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DEFAULT_TICKET_PRICES = {
  adult: { price: 120 },
  child: { price: 60 },
};

const formatDateFromInt = (dateInt) => {
  const dateStr = dateInt.toString();
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const date = new Date(`${year}-${month}-${day}`);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
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

const BookTickets = () => {
  const [customerMobile, setCustomerMobile] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tickets, setTickets] = useState({ adult: 0, child: 0 });
  const [ticketAvailability, setTicketAvailability] = useState({ adult: 0, child: 0 });
  const [prices, setPrices] = useState(DEFAULT_TICKET_PRICES);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentCard, setShowPaymentCard] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [wallet, setWallet] = useState({ balance: 0 });
  const [orderId, setOrderId] = useState();
  const [phonepeScriptLoaded, setPhonepeScriptLoaded] = useState(false);
  const [paymentTimeoutId, setPaymentTimeoutId] = useState(null);
  const [showTicketGenerating, setShowTicketGenerating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const dateInputRef = useRef(null);
  // Load PhonePe Checkout Script
  useEffect(() => {
    if (window._phonePeLoaded) {
      setPhonepeScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://mercury.phonepe.com/web/bundle/checkout.js";
    script.async = true;

    script.onload = () => {
      window._phonePeLoaded = true;
      setPhonepeScriptLoaded(true);
    };

    script.onerror = () => {
      setError("Failed to load PhonePe payment script.");
    };

    document.body.appendChild(script);
  }, []);

  const formatDate = (date, formatStr = 'yyyy-MM-dd') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    if (formatStr === 'yyyy-MM-dd') return `${year}-${month}-${day}`;
    if (formatStr === 'dd MMM yyyy') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${months[d.getMonth()]} ${year}`;
    }
    return `${year}-${month}-${day}`;
  };

  const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  useEffect(() => {
    if (!bookingDate) {
      const today = formatDate(new Date());
      setBookingDate(today);
    }
  }, []);

  useEffect(() => {
    const fetchMeta = async () => {
      if (!bookingDate) return;
      try {
        setError('');
        const ymd = bookingDate.replace(/-/g, '');
        const count = await getTicketCount(ymd);
        setTicketAvailability({ adult: count.adult_tickets || 0, child: count.child_tickets || 0 });
        try {
          const pricing = await getTicketPricing(ymd);
          const nextPrices = {
            adult: { price: pricing.adult_ticket_price ?? DEFAULT_TICKET_PRICES.adult.price },
            child: { price: pricing.child_ticket_price ?? DEFAULT_TICKET_PRICES.child.price },
          };
          setPrices(nextPrices);
        } catch (_) {
          setPrices(DEFAULT_TICKET_PRICES);
        }
      } catch (e) {
        setError('Failed to fetch availability');
      }
    };
    fetchMeta();
  }, [bookingDate]);

  const handleQuantityChange = (type, op) => {
    const maxAvail = ticketAvailability[type];
    setTickets(prev => {
      const next = { ...prev };
      if (op === 'add' && next[type] < maxAvail) next[type] += 1;
      if (op === 'subtract' && next[type] > 0) next[type] -= 1;
      return next;
    });
  };

  const calculateTotal = () => (tickets.adult * (prices.adult?.price || 0)) + (tickets.child * (prices.child?.price || 0));

  const getDateDisplayText = () => {
    const today = formatDate(new Date());
    if (bookingDate === today) {
      return 'Today';
    }
    return formatDate(new Date(bookingDate), 'dd MMM yyyy');
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!customerMobile || customerMobile.length !== 10) return setError('Enter 10-digit customer mobile');
    if (!bookingDate) return setError('Select booking date');
    if (tickets.adult === 0 && tickets.child === 0) return setError('Select at least one ticket');

    try {
      setIsLoading(true);
      setError('');
      const ymd = bookingDate.replace(/-/g, '');
      const ticketsRequest = {
        Adult: tickets.adult,
        Child: tickets.child
      };
      const response = await createAgentTickets(ticketsRequest, Number(ymd), customerMobile);

      if (response && response.ID) {
        setOrderId(response.ID);
      }

      try {
        const w = await getMyWallet();
        setWallet({ balance: Number(w.wallet.balance) || 0 });
      } catch (_) {
        setWallet({ balance: 0 });
      }
      setShowPaymentCard(true);
    } catch (err) {
      setError(err.message || 'Failed to create tickets.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === 'wallet' && wallet.balance < calculateTotal()) {
      setError('Insufficient wallet balance');
      return;
    }

    if (!orderId) {
      setError('Order ID not found. Please try again.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      if (paymentMethod === 'wallet') {
        const paymentData = {
          order_id: orderId,
          pg_type: 1
        };
        await makePayment(paymentData);

        // Close payment modal and show generating ticket animation
        setShowPaymentCard(false);
        setShowTicketGenerating(true);

        // Fetch order details and open ticket modal
        try {
          const orderDetails = await getOrderDetails(orderId);

          // Reset form
          setCustomerMobile('');
          setTickets({ adult: 0, child: 0 });
          setOrderId(null);

          // Clear loading and show ticket
          setShowTicketGenerating(false);
          setSelectedOrder(orderDetails);
          setIsOrderModalOpen(true);
          setLoadingOrderDetails(false);
        } catch (detailsErr) {
          console.error('Failed to fetch order details:', detailsErr);
          setShowTicketGenerating(false);
          setError('Payment successful! But failed to load ticket. Please check My Tickets.');
          setCustomerMobile('');
          setTickets({ adult: 0, child: 0 });
          setOrderId(null);
        }

      } else {
        // Payment Gateway
        initiatePhonePePayment();
      }

    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      setShowTicketGenerating(false);
    } finally {
      setIsLoading(false);
    }
  };

  const initiatePhonePePayment = async () => {
    if (!phonepeScriptLoaded) {
      setError('Payment gateway not loaded. Please refresh the page.');
      return;
    }

    if (!window.PhonePeCheckout) {
      setError('PhonePe checkout not available. Please refresh the page.');
      return;
    }

    try {
      const paymentTrans = {
        order_id: orderId,
        pg_type: 0
      };

      const paymentData = await makePayment(paymentTrans);
      console.log('Payment Data:', paymentData);

      if (!paymentData.payment_url) {
        throw new Error(paymentData.message || 'Failed to initiate payment');
      }

      setShowPaymentCard(false);

      // Set up 5-minute auto-cancel timeout
      const timeoutId = setTimeout(() => {
        console.log('Payment timeout - auto-cancelling after 5 minutes');

        try {
          if (window.PhonePeCheckout && window.PhonePeCheckout.close) {
            window.PhonePeCheckout?.destroy?.();
          }
        } catch (e) {
          console.error('Error closing PhonePe iframe:', e);
        }

        setError('Payment session expired. Please try booking again.');
        setIsLoading(false);
        setShowTicketGenerating(false);
      }, 5 * 60 * 1000);

      setPaymentTimeoutId(timeoutId);

      // Define callback function
      window.handlePhonePeCallback = function (response) {
        console.log('PhonePe Callback Response:', response);

        try {
          if (timeoutId) {
            clearTimeout(timeoutId);
            setPaymentTimeoutId(null);
          }

          if (response === 'USER_CANCEL') {
            console.log('User cancelled payment');
            setError('Payment cancelled by user. Please try again.');
            setIsLoading(false);
            setShowTicketGenerating(false);
          } else if (response === 'CONCLUDED') {
            console.log('Payment concluded, checking status...');
            setShowTicketGenerating(true);

            checkPaymentStatus(orderId).catch(err => {
              console.error('Error in checkPaymentStatus:', err);
              setError('Failed to verify payment. Please check with customer.');
              setIsLoading(false);
              setShowTicketGenerating(false);
            });
          } else {
            console.log('Unexpected callback response:', response);
            setIsLoading(false);
            setShowTicketGenerating(false);
          }
        } catch (error) {
          console.error('Error in PhonePe callback:', error);
          setError('An error occurred. Please verify payment status.');
          setIsLoading(false);
          setShowTicketGenerating(false);
        }
      };

      // Open PhonePe PayPage
      console.log('Initiating PhonePe transaction with URL:', paymentData.payment_url);

      try {
        window.PhonePeCheckout.transact({
          tokenUrl: paymentData.payment_url,
          callback: window.handlePhonePeCallback,
          type: 'IFRAME'
        });
        console.log('PhonePe transact called successfully');
      } catch (transactError) {
        console.error('Error calling PhonePe transact:', transactError);
        if (timeoutId) {
          clearTimeout(timeoutId);
          setPaymentTimeoutId(null);
        }
        throw new Error('Failed to open payment window: ' + transactError.message);
      }

    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
      setIsLoading(false);
      setShowTicketGenerating(false);
    }
  };

  const checkPaymentStatus = async (orderId) => {
    try {
      const data = await getPaymentStatus(orderId);
      console.log("Payment status response:", data);

      if (data.status === 'COMPLETED') {
        try {
          const orderDetails = await getOrderDetails(orderId);

          // Reset form
          setCustomerMobile('');
          setTickets({ adult: 0, child: 0 });
          setOrderId(null);

          // Clear loading states
          setIsLoading(false);
          setShowTicketGenerating(false);

          // Open ticket modal
          setSelectedOrder(orderDetails);
          setIsOrderModalOpen(true);
          setLoadingOrderDetails(false);

        } catch (detailsErr) {
          console.error('Failed to fetch order details:', detailsErr);
          setCustomerMobile('');
          setTickets({ adult: 0, child: 0 });
          setOrderId(null);
          setIsLoading(false);
          setShowTicketGenerating(false);
          setError('Payment successful! But failed to load ticket.');
        }
      }
      else if (
        data.status === 'FAILED' ||
        data.status === 'PAYMENT_ERROR' ||
        data.status === 'PAYMENT_DECLINED'
      ) {
        setIsLoading(false);
        setShowTicketGenerating(false);
        setError('Payment failed. Please try again.');
      }
      else {
        setIsLoading(false);
        setShowTicketGenerating(false);
        setError('Payment status: ' + (data.status || 'PENDING'));
      }

    } catch (err) {
      console.error('Status check error:', err);
      setIsLoading(false);
      setShowTicketGenerating(false);
      setError('Failed to verify payment status. Please contact support.');
    }
  };

  const handleShareWhatsApp = async () => {
    const ticketElement = document.getElementById('agent-ticket-content');
    if (!ticketElement || !customerMobile) return;

    try {
      setIsDownloading(true);

      // Create a hidden clone for download
      const clone = ticketElement.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = ticketElement.offsetWidth + 'px';
      document.body.appendChild(clone);

      // Show logo in clone
      const cloneLogo = clone.querySelector('#ticket-logo');
      if (cloneLogo) {
        cloneLogo.style.display = 'block';
        cloneLogo.classList.remove('hidden');
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the clone
      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      document.body.removeChild(clone);

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `AGS-ticket-${selectedOrder.order.ID}.png`, { type: 'image/png' });

          // Check if Web Share API is available
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
              files: [file],
              title: 'AGS WonderWorld Ticket',
              text: `Your booking #${selectedOrder.order.ID} ticket for AGS WonderWorld`
            })
              .then(() => console.log('Shared successfully'))
              .catch((error) => {
                console.log('Error sharing:', error);
                // Fallback to WhatsApp Web URL
                fallbackToWhatsAppWeb();
              });
          } else {
            // Fallback to WhatsApp Web URL
            fallbackToWhatsAppWeb();
          }
        }
        setIsDownloading(false);
      });
    } catch (error) {
      console.error('Error sharing ticket:', error);
      alert('Failed to share ticket. Please try downloading instead.');
      setIsDownloading(false);
    }
  };

  const fallbackToWhatsAppWeb = () => {
    const message = `Hi! Your AGS WonderWorld ticket (Booking #${selectedOrder.order.ID}) has been confirmed for ${selectedOrder.order.tickets?.[0]?.booking_date ? formatDateFromInt(selectedOrder.order.tickets[0].booking_date) : 'your selected date'}. Total Amount: ₹${selectedOrder.order.total_amount}. Show the QR code at the entrance. Enjoy your visit!`;
    const whatsappUrl = `https://wa.me/${customerMobile}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="h-full flex flex-col p-3 sm:p-6 overflow-hidden">
      {/* Date Picker at Top */}
      <div className="flex-shrink-0 mb-4 sm:mb-6 flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-semibold text-primary">Book Tickets</h1>
        <div className="bg-white p-2 sm:p-3 rounded-xl shadow flex items-center gap-2 sm:gap-3">
          <span className="text-sm sm:text-lg font-semibold text-primary">{getDateDisplayText()}</span>
          <button
            type="button"
            onClick={() => {
              const inp = dateInputRef.current;
              if (!inp) return;

              // Best: Chrome/Edge support this
              if (inp.showPicker) {
                inp.showPicker();
              } else {
                // Fallback for Safari/Firefox
                inp.focus();
                inp.click();
              }
            }}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <CalendarIcon />
            <input
              ref={dateInputRef}
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={formatDate(new Date())}
              max={formatDate(addMonths(new Date(), 3))}
              className="absolute opacity-0 w-0 h-0 p-0 m-0 pointer-events-none"
            />
          </button>
        </div>
      </div>

      {/* Date Picker Dropdown */}
      {showDatePicker && (
        <div className="flex-shrink-0 mb-4 flex justify-end">
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow">
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => {
                setBookingDate(e.target.value);
                setShowDatePicker(false);
              }}
              min={formatDate(new Date())}
              max={formatDate(addMonths(new Date(), 3))}
              className="px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-primary
                   text-sm sm:text-base"
            />
          </div>
        </div>
      )}
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 sm:space-y-6 pb-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm sm:text-base">{error}</div>}

          {/* Customer Details */}
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-primary">Customer Details</h2>
            <input
              className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base"
              placeholder="Customer Mobile (10 digits)"
              value={customerMobile}
              onChange={e => setCustomerMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
            />
          </div>

          {/* Booking Details */}
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-primary">Booking Details</h2>
            <div className="space-y-3 sm:space-y-4">
              {/* Adult Ticket */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-medium text-primary text-sm sm:text-base">Adult Ticket</h3>
                    <p className="text-xs sm:text-sm text-secondary">₹{prices.adult?.price ?? DEFAULT_TICKET_PRICES.adult.price}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('adult', 'subtract')}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent text-primary font-bold text-sm sm:text-base"
                    >
                      -
                    </button>
                    <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">{tickets.adult}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('adult', 'add')}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent text-primary font-bold text-sm sm:text-base"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-secondary">Available: {ticketAvailability.adult}</p>
              </div>

              {/* Child Ticket */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-medium text-primary text-sm sm:text-base">Child Ticket</h3>
                    <p className="text-xs sm:text-sm text-secondary">₹{prices.child?.price ?? DEFAULT_TICKET_PRICES.child.price}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('child', 'subtract')}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent text-primary font-bold text-sm sm:text-base"
                    >
                      -
                    </button>
                    <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">{tickets.child}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('child', 'add')}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent text-primary font-bold text-sm sm:text-base"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-secondary">Available: {ticketAvailability.child}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Total Section at Bottom */}
      <div className="flex-shrink-0 mt-4 sm:mt-6 bg-white p-3 sm:p-4 rounded-xl shadow flex items-center justify-between">
        <div>
          <span className="text-xs sm:text-sm text-secondary">Total</span>
          <div className="text-xl sm:text-2xl font-bold text-primary">₹{calculateTotal()}</div>
        </div>
        <button
          type="button"
          onClick={handleConfirm}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-accent text-primary rounded-xl shadow hover:brightness-95 font-semibold text-sm sm:text-base disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Confirm'}
        </button>
      </div>

      {/* Payment Modal */}
      {showPaymentCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-primary">Payment Details</h3>

              {error && <div className="mb-3 p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}

              {/* Ticket Summary */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                <h4 className="font-semibold mb-2 text-primary text-sm sm:text-base">Booking Summary</h4>
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary">Customer Mobile:</span>
                    <span className="font-medium">{customerMobile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Date:</span>
                    <span className="font-medium">{formatDate(new Date(bookingDate), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Adult Tickets:</span>
                    <span className="font-medium">{tickets.adult} × ₹{prices.adult?.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Child Tickets:</span>
                    <span className="font-medium">{tickets.child} × ₹{prices.child?.price}</span>
                  </div>
                  {orderId && (
                    <div className="flex justify-between">
                      <span className="text-secondary">Order ID:</span>
                      <span className="font-medium">#{orderId}</span>
                    </div>
                  )}
                  <div className="border-t mt-2 pt-2 flex justify-between">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-base sm:text-lg text-primary">₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-3 sm:mb-4">
                <h4 className="font-semibold mb-2 sm:mb-3 text-primary text-sm sm:text-base">Select Payment Method</h4>
                <label className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 p-2 sm:p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="pm"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={() => setPaymentMethod('wallet')}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-sm sm:text-base">Wallet</span>
                    <div className="text-xs sm:text-sm text-secondary">Balance: ₹{wallet.balance}</div>
                    {paymentMethod === 'wallet' && wallet.balance < calculateTotal() && (
                      <div className="text-xs text-red-600 mt-1">Insufficient balance</div>
                    )}
                  </div>
                </label>
                <label className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="pm"
                    value="gateway"
                    checked={paymentMethod === 'gateway'}
                    onChange={() => setPaymentMethod('gateway')}
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-sm sm:text-base">Payment Gateway</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-primary text-white rounded-lg font-semibold hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm sm:text-base"
                  disabled={isLoading || (paymentMethod === 'wallet' && wallet.balance < calculateTotal())}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePayment();
                  }}
                >
                  {isLoading ? 'Processing...' : 'Pay Now'}
                </button>
                <button
                  type="button"
                  className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition text-sm sm:text-base"
                  onClick={() => setShowPaymentCard(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Generating Loading Overlay */}
      {showTicketGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center shadow-xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Payment Successful!</h3>
            <p className="text-gray-600">Generating your ticket...</p>
          </div>
        </div>
      )}

      {/* Order Details Modal (Ticket Modal) */}
      {isOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 pt-28 pb-4 z-40">
          <div className="bg-white rounded-2xl max-w-xs w-full max-h-full relative flex flex-col shadow-2xl overflow-hidden">

            {/* Sticky Header with Close, Download and Share buttons */}
            <div className="flex justify-between items-center p-3 border-b flex-shrink-0">
              <h2 className="text-base font-semibold text-primary">Booking Details</h2>
              <div className="flex gap-2">
                {/* Share WhatsApp Button */}
                <button
                  onClick={handleShareWhatsApp}
                  disabled={isDownloading || !customerMobile}
                  className={`p-2 rounded-full transition-all ${isDownloading || !customerMobile
                    ? 'bg-gray-100 cursor-not-allowed'
                    : 'hover:bg-green-100 hover:scale-110'
                    }`}
                  title={!customerMobile ? "Customer mobile required" : "Share via WhatsApp"}
                >
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </button>

                {/* Download Button */}
                <button
                  onClick={async () => {
                    const ticketElement = document.getElementById('agent-ticket-content');
                    if (!ticketElement) return;

                    try {
                      setIsDownloading(true);

                      const clone = ticketElement.cloneNode(true);
                      clone.style.position = 'absolute';
                      clone.style.left = '-9999px';
                      clone.style.top = '0';
                      clone.style.width = ticketElement.offsetWidth + 'px';
                      document.body.appendChild(clone);

                      const cloneLogo = clone.querySelector('#ticket-logo');
                      if (cloneLogo) {
                        cloneLogo.style.display = 'block';
                        cloneLogo.classList.remove('hidden');
                      }

                      await new Promise(resolve => setTimeout(resolve, 100));

                      const canvas = await html2canvas(clone, {
                        backgroundColor: '#ffffff',
                        scale: 2,
                        logging: false,
                        useCORS: true,
                        allowTaint: true
                      });

                      document.body.removeChild(clone);

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
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setIsOrderModalOpen(false);
                    setSelectedOrder(null);
                    setCustomerMobile('');
                    setTickets({ adult: 0, child: 0 });
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
              <div id="agent-ticket-content" className="space-y-2">

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
                          <span className="text-secondary text-xs">Customer</span>
                          <span className="font-medium text-xs">{customerMobile || 'N/A'}</span>
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
    </div>
  );
};

export default BookTickets;