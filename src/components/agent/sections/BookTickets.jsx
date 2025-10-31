import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getTicketCount, createTickets, getMyWallet, getTicketPricing } from '../../../api';

const DEFAULT_TICKET_PRICES = {
  adult: { price: 120 },
  child: { price: 60 },
};

const BookTickets = () => {
  const [customerMobile, setCustomerMobile] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [tickets, setTickets] = useState({ adult: 0, child: 0 });
  const [ticketAvailability, setTicketAvailability] = useState({ adult: 0, child: 0 });
  const [prices, setPrices] = useState(DEFAULT_TICKET_PRICES);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentCard, setShowPaymentCard] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [wallet, setWallet] = useState({ balance: 0 });

  // Initialize booking date to today and fetch data
  useEffect(() => {
    if (!bookingDate) {
      const today = format(new Date(), 'yyyy-MM-dd');
      setBookingDate(today);
    }
  }, []);

  // Fetch availability and pricing whenever date changes
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
          // Expecting keys adult_price and child_price (fallback otherwise)
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

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!customerMobile || customerMobile.length !== 10) return setError('Enter 10-digit customer mobile');
    if (!bookingDate) return setError('Select booking date');
    if (tickets.adult === 0 && tickets.child === 0) return setError('Select at least one ticket');

    try {
      setIsLoading(true);
      setError('');
      const ymd = bookingDate.replace(/-/g, '');
      console.log("Sending payload:", {
  adult_count: tickets.adult,
  child_count: tickets.child,
  ticket_date_int: Number(ymd),
});
const ticketsRequest = {
        Adult: tickets.adult,
        Child: tickets.child
      };
      await createTickets(ticketsRequest, Number(ymd));
      // After tickets created, open payment card and load wallet
      try {
        const w = await getMyWallet();
        console.log("Received wallet response:", w);  
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

  return (
    <form onSubmit={handleConfirm} className="space-y-6">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded">{error}</div>}

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4 text-primary">Customer Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            className="px-3 py-2 border rounded-lg"
            placeholder="Customer Mobile (10 digits)"
            value={customerMobile}
            onChange={e => setCustomerMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
          />
          <input
            type="date"
            value={bookingDate}
            onChange={e => setBookingDate(e.target.value)}
            min={format(new Date(), 'yyyy-MM-dd')}
            max={format(new Date().setMonth(new Date().getMonth() + 3), 'yyyy-MM-dd')}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4 text-primary">Booking Details</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-medium text-primary">Adult Ticket</h3>
                <p className="text-sm text-secondary">₹{prices.adult?.price ?? DEFAULT_TICKET_PRICES.adult.price}</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => handleQuantityChange('adult', 'subtract')} className="w-8 h-8 rounded-full bg-accent text-primary font-bold">-</button>
                <span className="w-8 text-center font-medium">{tickets.adult}</span>
                <button type="button" onClick={() => handleQuantityChange('adult', 'add')} className="w-8 h-8 rounded-full bg-accent text-primary font-bold">+</button>
              </div>
            </div>
            <p className="text-sm text-secondary">Available: {ticketAvailability.adult}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-medium text-primary">Child Ticket</h3>
                <p className="text-sm text-secondary">₹{prices.child?.price ?? DEFAULT_TICKET_PRICES.child.price}</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => handleQuantityChange('child', 'subtract')} className="w-8 h-8 rounded-full bg-accent text-primary font-bold">-</button>
                <span className="w-8 text-center font-medium">{tickets.child}</span>
                <button type="button" onClick={() => handleQuantityChange('child', 'add')} className="w-8 h-8 rounded-full bg-accent text-primary font-bold">+</button>
              </div>
            </div>
            <p className="text-sm text-secondary">Available: {ticketAvailability.child}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow flex items-center justify-between">
        <div>
          <span className="text-sm">Total</span>
          <div className="text-2xl font-bold text-primary">₹{calculateTotal()}</div>
        </div>
        <button type="submit" className="px-4 py-3 bg-accent text-primary rounded-xl shadow hover:brightness-95" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Confirm'}
        </button>
      </div>

      {showPaymentCard && (
        <div className="bg-white p-4 rounded-xl shadow border">
          <h3 className="text-lg font-semibold mb-3">Payment</h3>
          <div className="mb-3 text-sm text-gray-600">Tickets: Adult {tickets.adult}, Child {tickets.child} on {bookingDate}</div>
          <div className="mb-4">
            <label className="flex items-center gap-2 mb-2">
              <input type="radio" name="pm" value="wallet" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} />
              <span>Wallet (Balance: ₹{wallet.balance})</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="pm" value="gateway" checked={paymentMethod === 'gateway'} onChange={() => setPaymentMethod('gateway')} />
              <span>Payment Gateway</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" className="px-4 py-2 bg-primary text-white rounded-lg">Pay Now</button>
            <button type="button" className="px-4 py-2 border rounded-lg" onClick={() => setShowPaymentCard(false)}>Close</button>
          </div>
        </div>
      )}
    </form>
  );
};

export default BookTickets;
