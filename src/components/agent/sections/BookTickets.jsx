import React, { useState, useEffect } from 'react';
import { getTicketCount, createAgentTickets, getMyWallet, getTicketPricing, payByWallet } from '../../../api';

const CalendarIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DEFAULT_TICKET_PRICES = {
  adult: { price: 120 },
  child: { price: 60 },
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
  const [orderId, setOrderId] = useState(null);

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
      
      if (response && response.order_id) {
        setOrderId(response.order_id);
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
    console.log('handlePayment called');
    console.log('Payment method:', paymentMethod);
    console.log('Wallet balance:', wallet.balance);
    console.log('Total:', calculateTotal());
    console.log('Order ID:', orderId);
    
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
        console.log('Calling payByWallet with:', paymentData);
        const response = await payByWallet(paymentData);
        console.log('Payment response:', response);
        
        // On success, close modal and reset form
        setShowPaymentCard(false);
        setCustomerMobile('');
        setTickets({ adult: 0, child: 0 });
        setOrderId(null);
        alert('Payment successful via Wallet!');
        
      } else {
        const paymentData = {
          order_id: orderId,
          pg_type: 2
        };
        console.log('Processing payment gateway:', paymentData);
        alert('Payment gateway integration pending!');
        
        // Close modal
        setShowPaymentCard(false);
        setCustomerMobile('');
        setTickets({ adult: 0, child: 0 });
        setOrderId(null);
      }
      
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <CalendarIcon />
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
              className="px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
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
              
              {/* Error Message in Modal */}
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
                    console.log('Pay Now button clicked');
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
    </div>
  );
};

export default BookTickets;