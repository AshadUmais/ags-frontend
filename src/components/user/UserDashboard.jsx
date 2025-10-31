import React, { useState, useEffect } from 'react';
import { getTicketCount, createTickets, getTicketPricing, getMyTickets, createOrder } from '../../api';

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
  useEffect(() => {
    const fetchUserTickets = async () => {
      try {
        setLoadingTickets(true);
        const response = await getMyTickets();
        setUserTickets(response.tickets || []);
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

      const orderData = {
        ticket_ids: ticketResponse.tickets.map(t => t.id),
        total_amount: calculateTotal(),
        currency: 'INR'
      };
      const orderResponse = await createOrder(orderData);

      const updatedTickets = await getMyTickets();
      setUserTickets(updatedTickets.tickets || []);

      setTickets({ adult: 0, child: 0 });
      setBookingDate('');
      setError('');
      setBookingStep(1);
      setIsBookingModalOpen(false);
      alert('Booking successful! Your tickets have been confirmed.');
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to process booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const minDate = getTodayDate();
  const maxDate = getMaxDate();

  return (
    <div className="min-h-screen bg-lightPurple p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-primary">Welcome {localStorage.getItem("authRole") || "User"}!</h1>
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
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-center text-primary">My Tickets</h2>
          <p className="text-sm text-center text-secondary mb-6">Your booked tickets</p>

          {loadingTickets ? (
            <div className="text-center py-8 text-secondary">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-2"></div>
              <p>Loading your tickets...</p>
            </div>
          ) : userTickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary mb-4">You don't have any tickets yet</p>
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
            <div className="space-y-4">
              {userTickets.map((ticket) => (
                <div key={ticket.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-primary">
                        {ticket.type === 'adult' || ticket.type === 'Adult' ? 'Adult Ticket' : 'Child Ticket'}
                      </h3>
                      <p className="text-sm text-secondary">
                        {ticket.booking_date ? formatDateFromInt(ticket.booking_date) : formatDate(ticket.date)}
                      </p>
                    </div>
                    <div className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700">
                      Valid
                    </div>
                  </div>
                </div>
              ))}
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

                  {/* Loading state */}
                  {checkingAvailability && (
                    <div className="mt-4 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                      <p className="mt-2 text-sm text-secondary">Checking availability...</p>
                    </div>
                  )}

                  {/* Error state */}
                  {!checkingAvailability && error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm text-center">
                      {error}
                    </div>
                  )}

                  {/* Ticket availability */}
                  {!checkingAvailability && !error && bookingDate && ticketAvailability && (
                    <div className="mt-4">
                      {Number(ticketAvailability.adult) + Number(ticketAvailability.child) > 0 ? (
                        <div className="p-4 bg-accent rounded-lg border border-accent">
                          <p className="text-sm font-medium text-primary mb-2">
                            {formatDate(bookingDate)}
                          </p>
                          <p className="text-xs text-secondary mt-1">
                            Max {MAX_TICKETS_PER_BOOKING} tickets per booking
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
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">{getTotalTickets()}</span> / {MAX_TICKETS_PER_BOOKING} tickets selected
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adult Tickets (₹{ticketPrices.adult.price})
                      <span className="text-xs text-gray-500 ml-2">Available: {ticketAvailability.adult}</span>
                    </label>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange('adult', 'subtract')}
                        disabled={tickets.adult === 0}
                        className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >-</button>
                      <span className="text-2xl font-medium w-12 text-center">{tickets.adult}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange('adult', 'add')}
                        disabled={tickets.adult >= ticketAvailability.adult || getTotalTickets() >= MAX_TICKETS_PER_BOOKING}
                        className="w-10 h-10 rounded-full bg-accent text-primary flex items-center justify-center hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >+</button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Child Tickets (₹{ticketPrices.child.price})
                      <span className="text-xs text-gray-500 ml-2">Available: {ticketAvailability.child}</span>
                    </label>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange('child', 'subtract')}
                        disabled={tickets.child === 0}
                        className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >-</button>
                      <span className="text-2xl font-medium w-12 text-center">{tickets.child}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange('child', 'add')}
                        disabled={tickets.child >= ticketAvailability.child || getTotalTickets() >= MAX_TICKETS_PER_BOOKING}
                        className="w-10 h-10 rounded-full bg-accent text-primary flex items-center justify-center hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >+</button>
                    </div>
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
                      handleBooking(e);
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
    </div>
  );
}