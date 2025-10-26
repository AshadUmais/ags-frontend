import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  getTicketCount,
  createOrder,
  getMyOrders,
  processPayment,
  getPaymentStatus
} from '../services/api';

const TICKET_PRICES = {
  adult: {
    price: 120, // Special agent price (20% less than regular)
  },
  child: {
    price: 60, // Special agent price (20% less than regular)
  }
};

// Placeholder for getBaseUrl - replace with your actual implementation
const getBaseUrl = () => 'YOUR_API_BASE_URL';

export default function AgentDashboard() {
  // Navigation state
  const [activeSection, setActiveSection] = useState('book');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Booking state
  const [bookingDate, setBookingDate] = useState('');
  const [tickets, setTickets] = useState({ adult: 0, child: 0 });
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [error, setError] = useState('');
  const [ticketAvailability, setTicketAvailability] = useState({ adult: 0, child: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Bookings list state
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  // Payment state
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // User Management state
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    mobile: '',
    role: '',
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const roleMap = {
    3: 'Classic Member',
    4: 'Silver Member',
    5: 'Gold Member',
    6: 'Platinum Member'
  };

  const roleColors = {
    3: 'bg-gray-100 text-gray-800 border-gray-300',
    4: 'bg-blue-100 text-blue-800 border-blue-300',
    5: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    6: 'bg-purple-100 text-purple-800 border-purple-300'
  };

  const menuItems = [
    { id: 'book', label: 'Book Tickets', icon: '🎫' },
    { id: 'bookings', label: 'My Bookings', icon: '📋' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // Fetch ticket availability when date changes
  useEffect(() => {
    const fetchTicketCount = async () => {
      if (!bookingDate) return;
      try {
        const formattedDate = bookingDate.replace(/-/g, ''); // Convert YYYY-MM-DD to YYYYMMDD
        const count = await getTicketCount(formattedDate);
        setTicketAvailability({
          adult: count.adult_count || 0,
          child: count.child_count || 0,
        });
      } catch (err) {
        setError('Failed to fetch ticket availability');
        console.error(err);
      }
    };
    fetchTicketCount();
  }, [bookingDate]);

  // Fetch bookings when the section changes to 'bookings'
  useEffect(() => {
    if (activeSection === 'bookings') {
      fetchBookings();
    }
  }, [activeSection]);

  // Fetch users when the section changes to 'members'
  useEffect(() => {
    if (activeSection === 'members') {
      fetchUsers();
    }
  }, [activeSection]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const orders = await getMyOrders();
      setBookings(orders);
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${getBaseUrl()}/admin/users`, {
        headers: { 'Authorization': token }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only member roles (3-6)
        const memberUsers = data.filter(user => [3, 4, 5, 6].includes(user.role));
        setUsers(memberUsers);
      } else {
        let errorMessage = `Status: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) errorMessage = errorData.message;
        } catch (e) { }
        setError(`Failed to fetch members: ${errorMessage}`);
      }
    } catch (err) {
      setError(`Error fetching members: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (type, operation) => {
    const currentValue = tickets[type];
    const maxAvailable = ticketAvailability[type];
    
    if (operation === 'add' && currentValue < maxAvailable) {
      setTickets(prev => ({ ...prev, [type]: prev[type] + 1 }));
    } else if (operation === 'subtract' && currentValue > 0) {
      setTickets(prev => ({ ...prev, [type]: prev[type] - 1 }));
    }
  };

  const calculateTotal = () => {
    const adultTotal = tickets.adult * TICKET_PRICES.adult.price;
    const childTotal = tickets.child * TICKET_PRICES.child.price;
    return adultTotal + childTotal;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!bookingDate || !clientName || !clientEmail) {
      setError('Please fill in all required fields');
      return;
    }
    if (tickets.adult === 0 && tickets.child === 0) {
      setError('Please select at least one ticket');
      return;
    }
    if (!cardNumber || !cvv || !expiryDate) {
      setError('Please fill in payment details');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Create order
      const orderData = {
        total_amount: calculateTotal(),
        currency: 'INR',
        ticket_ids: [], // This will be populated by the backend based on the booking date
      };

      const order = await createOrder(orderData);

      // Process payment
      const paymentData = {
        order_id: order.order_id,
        amount: calculateTotal(),
        currency: 'INR',
        card_number: cardNumber,
        cvv: cvv,
        expiry_date: expiryDate,
      };

      const paymentResult = await processPayment(order.order_id, paymentData);

      if (paymentResult.status === 'completed') {
        // Reset form
        setTickets({ adult: 0, child: 0 });
        setBookingDate('');
        setClientName('');
        setClientEmail('');
        setCardNumber('');
        setCvv('');
        setExpiryDate('');
        setError('');
        
        alert('Booking successful! Ticket details will be sent to the client.');
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to process booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      mobile: user.username || '',
      role: user.role !== undefined ? parseInt(user.role) : 3
    });
    setShowEditModal(true);
  };

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserFormData({
      ...userFormData,
      [name]: name === 'role' ? parseInt(value, 10) : value
    });
  };

  const handleUserSubmit = async () => {
    setError('');

    try {
      if (!userFormData.mobile) {
        setError('Mobile number is required');
        return;
      }

      if (!/^[0-9]{10}$/.test(userFormData.mobile)) {
        setError('Please enter a valid 10-digit mobile number');
        return;
      }

      const token = localStorage.getItem('authToken');
      const userId = selectedUser?.id;

      if (!userId) {
        setError('Error: User ID is missing');
        return;
      }

      const payload = {
        role: parseInt(userFormData.role),
        username: userFormData.mobile,
        password: ''
      };

      const response = await fetch(`${getBaseUrl()}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchUsers();
        setShowEditModal(false);
        setSelectedUser(null);
        setError('');
        alert('Subscription updated successfully');
      } else {
        let errorMessage = `Status: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) errorMessage = errorData.message;
        } catch (e) { }
        setError(`Failed to update subscription: ${errorMessage}`);
      }
    } catch (err) {
      setError(`Error updating subscription: ${err.message}`);
    }
  };

  const handleCancelUserEdit = () => {
    setUserFormData({ mobile: '', role: '' });
    setSelectedUser(null);
    setShowEditModal(false);
    setError('');
  };

  const BookingForm = () => (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4 text-primary">Client Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Client Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter client name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Client Email</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter client email"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4 text-primary">Booking Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Select Date</label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              max={format(new Date().setMonth(new Date().getMonth() + 3), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Ticket Selection */}
          <div className="space-y-4">
            {/* Adult Tickets */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                <div>
                  <h3 className="font-medium text-primary">Adult Ticket</h3>
                  <p className="text-sm text-secondary">Age 13+</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                  <div className="text-primary font-semibold text-lg">
                    ₹{TICKET_PRICES.adult.price}
                    <span className="text-xs text-green-600 ml-1">(Agent Price)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('adult', 'subtract')}
                      className="w-8 h-8 rounded-full bg-accent text-primary font-bold flex items-center justify-center hover:brightness-95"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{tickets.adult}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('adult', 'add')}
                      className="w-8 h-8 rounded-full bg-accent text-primary font-bold flex items-center justify-center hover:brightness-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-secondary">
                Available: {ticketAvailability.adult}
              </p>
            </div>

            {/* Child Tickets */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                <div>
                  <h3 className="font-medium text-primary">Child Ticket</h3>
                  <p className="text-sm text-secondary">Age 4-12</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                  <div className="text-primary font-semibold text-lg">
                    ₹{TICKET_PRICES.child.price}
                    <span className="text-xs text-green-600 ml-1">(Agent Price)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('child', 'subtract')}
                      className="w-8 h-8 rounded-full bg-accent text-primary font-bold flex items-center justify-center hover:brightness-95"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{tickets.child}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('child', 'add')}
                      className="w-8 h-8 rounded-full bg-accent text-primary font-bold flex items-center justify-center hover:brightness-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-secondary">
                Available: {ticketAvailability.child}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4 text-primary">Payment Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter card number"
              maxLength="16"
            />
            <p className="text-xs text-secondary mt-1">For testing, use card number starting with 4 for successful payment</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">CVV</label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter CVV"
                maxLength="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Expiry Date</label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="MM/YY"
                maxLength="5"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Total and Submit */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex justify-between items-center mb-4">
          <span className="font-medium text-primary">Total Amount</span>
          <div>
            <span className="text-2xl font-bold text-primary">₹{calculateTotal()}</span>
            <span className="text-xs text-green-600 ml-2">Agent Price</span>
          </div>
        </div>
        <button
          type="submit"
          className="w-full px-4 py-3 bg-accent text-primary rounded-xl shadow hover:brightness-95 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );

  const BookingsList = () => {
    const filteredBookings = filterStatus === 'all' 
      ? bookings 
      : bookings.filter(booking => booking.order_status === filterStatus);

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary">My Bookings</h2>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Bookings</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <p className="text-center py-4 text-secondary">Loading bookings...</p>
            ) : filteredBookings.length === 0 ? (
              <p className="text-center py-4 text-secondary">No bookings found</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-2 text-secondary font-medium">Order ID</th>
                    <th className="pb-2 text-secondary font-medium">Tickets</th>
                    <th className="pb-2 text-secondary font-medium">Total</th>
                    <th className="pb-2 text-secondary font-medium">Status</th>
                    <th className="pb-2 text-secondary font-medium">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="text-sm">
                      <td className="py-3 text-primary font-medium">#{booking.id}</td>
                      <td className="py-3 text-secondary">
                        {booking.tickets.length} ticket(s)
                      </td>
                      <td className="py-3 text-primary font-medium">₹{booking.total_amount}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.order_status === 'confirmed' 
                            ? 'bg-green-100 text-green-700'
                            : booking.order_status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.order_status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.payment_info.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : booking.payment_info.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.payment_info.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  const MemberManagement = () => {
    const filteredUsers = users.filter(user => {
      const searchMatch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = roleFilter === '' || user.role.toString() === roleFilter;
      return searchMatch && roleMatch;
    });

    return (
      <div className="space-y-4">
        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-xl shadow space-y-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by mobile number..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white"
          >
            <option value="">All Subscription Types</option>
            {Object.entries(roleMap).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* User Cards */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-secondary">Loading members...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-secondary">
              {users.length === 0 ? 'No members found' : 'No members match your search'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(user => (
              <div 
                key={user.id} 
                className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm text-secondary mb-1">Mobile Number</p>
                      <p className="text-lg font-semibold text-primary">{user.username}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleColors[user.role] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                      {roleMap[user.role] || 'Unknown'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleSelectUser(user)}
                    className="w-full py-2.5 bg-accent text-primary rounded-xl font-medium hover:brightness-95 transition-all"
                  >
                    Manage Subscription
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-lightPurple">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        } bg-white h-full shadow-lg transition-all duration-300`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b flex items-center justify-between">
          {!isSidebarCollapsed && (
            <h2 className="text-xl font-semibold text-primary">Agent Portal</h2>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 rounded hover:bg-gray-100"
          >
            {isSidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="p-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl mb-2 transition-colors ${
                activeSection === item.id
                  ? 'bg-accent text-primary'
                  : 'text-secondary hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!isSidebarCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-md p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-primary">
              {menuItems.find((item) => item.id === activeSection)?.label}
            </h1>
            <button
              onClick={() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('authRole');
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-accent text-primary rounded-xl shadow hover:brightness-95"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {activeSection === 'book' && (
            <form onSubmit={handleBooking}>
              <BookingForm />
            </form>
          )}
          
          {activeSection === 'bookings' && <BookingsList />}
          
          {activeSection === 'members' && <MemberManagement />}
          
          {activeSection === 'reports' && (
            <div className="bg-white p-4 rounded-xl shadow">
              <h2 className="text-xl font-semibold mb-4 text-primary">Reports</h2>
              <p className="text-secondary">Reports and analytics will be available here.</p>
            </div>
          )}
          
          {activeSection === 'settings' && (
            <div className="bg-white p-4 rounded-xl shadow">
              <h2 className="text-xl font-semibold mb-4 text-primary">Settings</h2>
              <p className="text-secondary">Agent settings and preferences will be available here.</p>
            </div>
          )}
        </main>
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-lg font-semibold text-primary">Manage Subscription</h3>
              <button
                onClick={handleCancelUserEdit}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  name="mobile"
                  value={userFormData.mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                    setUserFormData({ ...userFormData, mobile: value });
                  }}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50 cursor-not-allowed"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  readOnly
                />
                <p className="text-xs text-secondary mt-1">Mobile number cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  <span className="text-red-500">*</span> Subscription Type
                </label>
                <select
                  name="role"
                  value={userFormData.role}
                  onChange={handleUserInputChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white"
                >
                  {Object.entries(roleMap).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancelUserEdit}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium text-secondary hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUserSubmit}
                  className="flex-1 px-4 py-3 bg-accent text-primary rounded-xl font-medium hover:brightness-95 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}