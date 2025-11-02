import React, { useState, useEffect } from 'react';
import { getAgents, getAgentTickets, loadAgentWallet, createUser, updateUser, getAgentOrder } from '../../../api';

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadAmount, setLoadAmount] = useState('');
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [usernameFilter, setUsernameFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [createdAtFilter, setCreatedAtFilter] = useState('');
  const [selectedOrderDate, setSelectedOrderDate] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const roleMap = {
    1: 'Agent',
    2: 'Ticket Checker'
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const data = await getAgents();
      setAgents(data);
    } catch (err) {
      setError(`Failed to fetch agents: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const getTodayDateForInput = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const convertDateToYYYYMMDD = (dateString) => {
    if (!dateString) return getTodayDate();
    return dateString.replace(/-/g, '');
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-';
    const str = String(dateString);
    if (str.length === 8) {
      return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
    }
    return dateString;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTicketCounts = (tickets) => {
    if (!tickets || tickets.length === 0) return '-';
    
    const adults = tickets.filter(t => t.title === 'Adult').length;
    const children = tickets.filter(t => t.title === 'Child').length;
    
    const parts = [];
    if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? 's' : ''}`);
    if (children > 0) parts.push(`${children} Child${children > 1 ? 'ren' : ''}`);
    
    return parts.join(', ') || '-';
  };

  const handleShowOrders = async (agent) => {
    setSelectedAgent(agent);
    setLoadingAction(true);
    setShowOrdersModal(true);
    setError('');
    setOrders([]);
    const todayDate = getTodayDateForInput();
    setSelectedOrderDate(todayDate);
    
    try {
      const formattedDate = getTodayDate();
      const data = await getAgentOrder(agent.id, formattedDate);
      setOrders(data || []);
    } catch (err) {
      setOrders([]);
      setError(`Failed to fetch orders: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleOrderDateChange = async (dateString) => {
    setSelectedOrderDate(dateString);
    if (!dateString || !selectedAgent) return;
    
    setLoadingAction(true);
    setError('');
    
    try {
      const formattedDate = convertDateToYYYYMMDD(dateString);
      const data = await getAgentOrder(selectedAgent.id, formattedDate);
      setOrders(data || []);
    } catch (err) {
      setOrders([]);
      setError(`Failed to fetch orders: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleShowTickets = async (agent) => {
    setSelectedAgent(agent);
    setLoadingAction(true);
    setShowTicketsModal(true);
    setError('');
    try {
      const data = await getAgentTickets(agent.id);
      setTickets(data);
    } catch (err) {
      setTickets([]);
      setError(`Failed to fetch tickets: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleShowWallet = (agent) => {
    setSelectedAgent(agent);
    setShowWalletModal(true);
    setError('');
  };

  const handleLoadWallet = async () => {
    if (!loadAmount || parseFloat(loadAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoadingWallet(true);
    setError('');
    try {
      await loadAgentWallet(selectedAgent.id, parseFloat(loadAmount));
      const updatedAgents = await getAgents();
      setAgents(updatedAgents);
      const updatedAgent = updatedAgents.find(a => a.id === selectedAgent.id);
      if (updatedAgent) {
        setSelectedAgent(updatedAgent);
      }
      setLoadAmount('');
    } catch (err) {
      setError(`Failed to load wallet: ${err.message}`);
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleCloseWalletModal = () => {
    setShowWalletModal(false);
    setLoadAmount('');
    setError('');
  };

  const handleCloseTicketsModal = () => {
    setShowTicketsModal(false);
    setError('');
  };

  const handleCloseOrdersModal = () => {
    setShowOrdersModal(false);
    setError('');
    setOrderIdFilter('');
    setUserIdFilter('');
    setBookingDateFilter('');
    setCreatedAtFilter('');
    setSelectedOrderDate('');
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
    setMessage({ text: '', type: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'role' ? parseInt(value, 10) : value
    });
  };

  const validateForm = () => {
    if (!formData.username) {
      setMessage({ text: 'Username is required', type: 'error' });
      return false;
    }
    if (!isEditing && !formData.password) {
      setMessage({ text: 'Password is required', type: 'error' });
      return false;
    }
    if (!formData.role) {
      setMessage({ text: 'Role is required', type: 'error' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!validateForm()) return;

    const payload = {
      username: formData.username,
      role: parseInt(formData.role)
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      if (isEditing) {
        await updateUser(selectedAgent.id, payload);
      } else {
        await createUser(payload);
      }

      await fetchAgents();
      resetForm();
      setMessage({
        text: isEditing ? 'Agent updated successfully' : 'Agent created successfully',
        type: 'success'
      });
    } catch (error) {
      setMessage({
        text: `Error ${isEditing ? 'updating' : 'creating'} agent: ${error.message}`,
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setFormData({ username: '', password: '', role: '' });
    setIsEditing(false);
    setSelectedAgent(null);
    setShowForm(false);
  };

  const handleCancel = () => {
    resetForm();
    setMessage({ text: '', type: '' });
  };

  const handleShowPasswordModal = (agent) => {
    setSelectedAgent(agent);
    setShowPasswordModal(true);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setMessage({ text: '', type: '' });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const handlePasswordSubmit = async () => {
    if (!passwordData.newPassword) {
      setMessage({ text: 'New password is required', type: 'error' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    try {
      await updateUser(selectedAgent.id, {
        username: selectedAgent.username,
        role: selectedAgent.role,
        password: passwordData.newPassword
      });
      
      setMessage({ text: 'Password updated successfully', type: 'success' });
      setShowPasswordModal(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ text: `Error updating password: ${error.message}`, type: 'error' });
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setMessage({ text: '', type: '' });
  };

  const filteredAgents = agents.filter(agent => {
    const usernameMatch = agent.username.toLowerCase().includes(usernameFilter.toLowerCase());
    const roleMatch = roleFilter === '' || agent.role.toString() === roleFilter;
    return usernameMatch && roleMatch;
  });

  const filteredOrders = orders.filter(order => {
    const orderIdMatch = orderIdFilter === '' || order.ID.toString().includes(orderIdFilter);
    const userIdMatch = userIdFilter === '' || order.user_id.toString().includes(userIdFilter);
    
    let bookingDateMatch = true;
    if (bookingDateFilter) {
      const filterDate = bookingDateFilter.replace(/-/g, '');
      const orderDate = order.tickets?.[0]?.booking_date?.toString() || '';
      bookingDateMatch = orderDate.includes(filterDate);
    }
    
    let createdAtMatch = true;
    if (createdAtFilter) {
      const orderCreatedDate = order.CreatedAt ? new Date(order.CreatedAt).toISOString().split('T')[0] : '';
      createdAtMatch = orderCreatedDate === createdAtFilter;
    }
    
    return orderIdMatch && userIdMatch && bookingDateMatch && createdAtMatch;
  });

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold">Agent Management</h2>
        {!showForm && (
          <button
            onClick={handleAddNew}
            className="w-full sm:w-auto px-4 py-2 bg-accent text-primary rounded-lg hover:brightness-95 font-medium"
          >
            Add New Agent
          </button>
        )}
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {showForm ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium">{isEditing ? 'Edit Agent' : 'Add New Agent'}</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span> Role:
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">-- Select Role --</option>
                <option value="1">Agent</option>
                <option value="2">Ticket Checker</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span> Username:
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter username"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span> {isEditing ? 'New Password (optional)' : 'Password'}:
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                required={!isEditing}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-accent text-primary rounded-lg hover:brightness-95"
              >
                {isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Username
                    <div className="mt-2">
                      <input
                        type="text"
                        value={usernameFilter}
                        onChange={(e) => setUsernameFilter(e.target.value)}
                        placeholder="Search..."
                        className="w-full p-1 border rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Role
                    <div className="mt-2">
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full p-1 border rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">All</option>
                        {Object.entries(roleMap).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-400">
                {loading ? (
                  <tr><td colSpan={3} className="text-center p-6">Loading...</td></tr>
                ) : filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center p-6 text-gray-500">
                      {agents.length === 0 ? 'No agents found' : 'No agents match the current filters'}
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-200">
                      <td className="px-6 py-4 text-center whitespace-nowrap">{agent.username}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {roleMap[agent.role] || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex justify-center items-center space-x-2">
                          <button
                            className="px-3 py-1.5 rounded bg-green-500 text-white hover:bg-green-600 text-sm disabled:opacity-50"
                            onClick={() => handleShowWallet(agent)}
                            disabled={loadingAction}
                          >
                            Wallet
                          </button>
                          <button
                            className="px-3 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm disabled:opacity-50"
                            onClick={() => handleShowPasswordModal(agent)}
                            disabled={loadingAction}
                          >
                            Change Password
                          </button>
                          <button
                            onClick={() => handleShowOrders(agent)}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50"
                            disabled={loadingAction}
                          >
                            View Orders
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden">
            <div className="p-4 space-y-3">
              <input
                type="text"
                value={usernameFilter}
                onChange={(e) => setUsernameFilter(e.target.value)}
                placeholder="Search username..."
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Roles</option>
                {Object.entries(roleMap).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {filteredAgents.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {agents.length === 0 ? 'No agents found' : 'No agents match the current filters'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredAgents.map(agent => (
                  <div key={agent.id} className="p-4 hover:bg-gray-50">
                    <div className="mb-3">
                      <div className="text-sm text-gray-500">Username</div>
                      <div className="font-medium">{agent.username}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-sm text-gray-500">Role</div>
                      <div className="capitalize">{roleMap[agent.role] || 'Unknown'}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleShowWallet(agent)}
                        className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-green-500 text-white hover:bg-green-600"
                      >
                        Wallet
                      </button>
                      <button
                        onClick={() => handleShowPasswordModal(agent)}
                        className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                      >
                        Change Password
                      </button>
                      <button
                        onClick={() => handleShowOrders(agent)}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                      >
                        View Orders
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showTicketsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-40">
          <div className="bg-white rounded shadow-lg w-full max-w-2xl p-6 relative max-h-96 overflow-y-auto">
            <button onClick={handleCloseTicketsModal} className="absolute top-2 right-4 text-xl">&times;</button>
            <h3 className="text-lg font-semibold mb-4">Tickets for: {selectedAgent?.username}</h3>
            {loadingAction ? (
              <div>Loading tickets…</div>
            ) : tickets && tickets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Adult Tickets</th>
                      <th className="p-2 text-left">Child Tickets</th>
                      <th className="p-2 text-left">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td className="p-2 whitespace-nowrap">{ticket.date}</td>
                        <td className="p-2 whitespace-nowrap">{ticket.adult_tickets}</td>
                        <td className="p-2 whitespace-nowrap">{ticket.child_tickets}</td>
                        <td className="p-2 whitespace-nowrap">₹{ticket.total_price?.toFixed(2) ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>No tickets found for this agent.</div>
            )}
          </div>
        </div>
      )}

      {showOrdersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-lg font-semibold">
                  Orders for: <span className="text-blue-600">{selectedAgent?.username}</span>
                </h3>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Select Date:</label>
                    <input
                      type="date"
                      value={selectedOrderDate}
                      onChange={(e) => handleOrderDateChange(e.target.value)}
                      className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                  <button onClick={handleCloseOrdersModal} className="text-2xl text-gray-500 hover:text-gray-700">&times;</button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {loadingAction ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : (
                <>
                  <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                          <tr>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
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
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
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
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
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
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
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
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                              Total Amount
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                              Tickets
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredOrders.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center p-6 text-gray-500">
                                {orders.length === 0 ? 'No orders found for today' : 'No orders match the current filters'}
                              </td>
                            </tr>
                          ) : (
                            filteredOrders.map((order) => (
                              <tr key={order.ID} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-center whitespace-nowrap text-sm">
                                  #{order.ID}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap text-sm">
                                  {order.user_id}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap text-sm">
                                  {formatDateForDisplay(order.tickets?.[0]?.booking_date)}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap text-sm">
                                  {formatDateTime(order.CreatedAt)}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap text-sm font-semibold text-green-600">
                                  ₹{order.total_amount?.toFixed(2) ?? '0.00'}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    order.order_status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {order.order_status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap text-sm">
                                  {getTicketCounts(order.tickets)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="sm:hidden">
                    <div className="space-y-3 mb-4">
                      <input
                        type="text"
                        placeholder="Search Order ID..."
                        value={orderIdFilter}
                        onChange={(e) => setOrderIdFilter(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        placeholder="Search User ID..."
                        value={userIdFilter}
                        onChange={(e) => setUserIdFilter(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="date"
                        placeholder="Booking Date"
                        value={bookingDateFilter}
                        onChange={(e) => setBookingDateFilter(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="date"
                        placeholder="Created At"
                        value={createdAtFilter}
                        onChange={(e) => setCreatedAtFilter(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {filteredOrders.length === 0 ? (
                      <div className="text-center p-6 text-gray-500">
                        {orders.length === 0 ? 'No orders found for today' : 'No orders match the current filters'}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredOrders.map((order) => (
                          <div key={order.ID} className="border rounded-lg p-4 bg-gray-50">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs text-gray-500">Order ID</div>
                                <div className="font-semibold">#{order.ID}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">User ID</div>
                                <div className="font-medium">{order.user_id}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Booking Date</div>
                                <div className="text-sm">{formatDateForDisplay(order.tickets?.[0]?.booking_date)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Created At</div>
                                <div className="text-sm">{formatDateTime(order.CreatedAt)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Total Amount</div>
                                <div className="font-semibold text-green-600">₹{order.total_amount?.toFixed(2) ?? '0.00'}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Status</div>
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                  order.order_status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {order.order_status}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <div className="text-xs text-gray-500 mb-1">Tickets</div>
                                <div className="font-medium text-sm">{getTicketCounts(order.tickets)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-40">
          <div className="bg-white rounded shadow-lg w-full max-w-md p-6 relative max-h-96 overflow-y-auto">
            <button onClick={handleCloseWalletModal} className="absolute top-2 right-4 text-xl">&times;</button>
            <h3 className="text-lg font-semibold mb-4">Wallet for: {selectedAgent?.username}</h3>
            <div>
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600 mb-1">Current Balance</div>
                <div className="text-2xl font-bold text-green-600">
                  ₹{selectedAgent?.balance?.toFixed(2) ?? '0.00'}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold mb-3">Load Wallet</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={loadAmount}
                      onChange={(e) => setLoadAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter amount"
                      disabled={loadingWallet}
                    />
                  </div>
                  <button
                    onClick={handleLoadWallet}
                    disabled={loadingWallet || !loadAmount}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingWallet ? 'Loading...' : 'Load Wallet'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 relative">
            <h3 className="text-lg font-semibold mb-4">
              Change Password for <span className="text-blue-600">{selectedAgent?.username}</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password:
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password:
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleClosePasswordModal}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:brightness-95"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManagement;