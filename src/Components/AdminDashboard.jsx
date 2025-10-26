import React, { useState, useCallback, useEffect } from 'react';
import { format, addDays } from 'date-fns';

const getBaseUrl = () => {
  // For local development on your computer
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8080/api';
  }

  // For testing on mobile devices on the same network
  // Replace with your computer's actual IP address when testing on mobile
  // Example: return 'http://192.168.1.100:8080/api';
  return `http://${window.location.hostname}:8080/api`;
};
// Dashboard components for different sections
const DashboardHome = () => (
  <div className="p-3 sm:p-6">
    <h2 className="text-xl sm:text-2xl font-semibold mb-4">Dashboard Overview</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-base sm:text-lg font-medium mb-2">Total Users</h3>
        <p className="text-2xl sm:text-3xl font-bold text-primary">1,234</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-base sm:text-lg font-medium mb-2">Active Agents</h3>
        <p className="text-2xl sm:text-3xl font-bold text-primary">56</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-base sm:text-lg font-medium mb-2">Total Bookings</h3>
        <p className="text-2xl sm:text-3xl font-bold text-primary">789</p>
      </div>
    </div>
  </div>
);

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    mobile: '',
    password: '',
    role: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [usernameFilter, setUsernameFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const roleMap = {
    0: 'Admin',
    1: 'AgentTC',
    2: 'Agent',
    3: 'Classic Member',
    4: 'Silver Member',
    5: 'Gold Member',
    6: 'Platinum Member'
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${getBaseUrl()}/admin/users`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        let errorMessage = `Status: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) errorMessage = errorData.message;
        } catch (e) { }
        setMessage({ text: `Failed to fetch users: ${errorMessage}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: `Error fetching users: ${error.message}`, type: 'error' });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (isEditing) {
      const roleId = parseInt(formData.role);
      if ([3, 4, 5, 6].includes(roleId)) {
        setFormData(prev => ({ ...prev, password: '' }));
      } else if ([0, 1, 2].includes(roleId)) {
        setFormData(prev => ({ ...prev, mobile: '' }));
      }
    }
  }, [formData.role, isEditing]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username || '',
      mobile: user.username || '',
      password: '',
      role: user.role !== undefined ? parseInt(user.role) : 3
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'role' ? parseInt(value, 10) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      const roleId = parseInt(formData.role);

      if ([0, 1, 2].includes(roleId)) {
        if (!formData.username) {
          setMessage({ text: 'Username is required for AgentTC, Agent, and Admin roles', type: 'error' });
          return;
        }
        if (!formData.password) {
          setMessage({ text: 'Password is required for AgentTC, Agent, and Admin roles', type: 'error' });
          return;
        }
      } else if ([3, 4, 5, 6].includes(roleId)) {
        if (!formData.mobile) {
          setMessage({ text: 'Mobile number is required for User roles', type: 'error' });
          return;
        }
        if (!/^[0-9]{10}$/.test(formData.mobile)) {
          setMessage({ text: 'Please enter a valid 10-digit mobile number', type: 'error' });
          return;
        }
      }

      const token = localStorage.getItem('authToken');
      const method = isEditing ? 'PUT' : 'POST';
      const userId = selectedUser?.id;

      if (isEditing && !userId) {
        setMessage({ text: 'Error: User ID is missing for update operation', type: 'error' });
        return;
      }

      const url = isEditing
        ? `${getBaseUrl()}/admin/users/${userId}`
        : `${getBaseUrl()}/admin/users`;

      const payload = { role: roleId };

      if ([0, 1, 2].includes(roleId)) {
        payload.username = formData.username;
        payload.password = formData.password;
      } else if ([3, 4, 5, 6].includes(roleId)) {
        payload.username = formData.mobile;
        payload.password = '';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchUsers();
        setFormData({ username: '', mobile: '', password: '', role: '' });
        setIsEditing(false);
        setSelectedUser(null);
        setShowForm(false);
        setMessage({
          text: isEditing ? 'User updated successfully' : 'User created successfully',
          type: 'success'
        });
      } else {
        let errorMessage = `Status: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) errorMessage = errorData.message;
        } catch (e) { }
        setMessage({
          text: `Failed to ${isEditing ? 'update' : 'create'} user: ${errorMessage}`,
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: `Error ${isEditing ? 'updating' : 'creating'} user: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleAddNew = () => {
    setFormData({ username: '', mobile: '', password: '', role: '' });
    setIsEditing(false);
    setSelectedUser(null);
    setShowForm(true);
    setMessage({ text: '', type: '' });
  };

  const handleCancel = () => {
    setFormData({ username: '', mobile: '', password: '', role: '' });
    setIsEditing(false);
    setSelectedUser(null);
    setShowForm(false);
    setMessage({ text: '', type: '' });
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${getBaseUrl()}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(null);
          setIsEditing(false);
          setFormData({ username: '', mobile: '', password: '', role: 0 });
          setShowForm(false);
        }
        setMessage({ text: 'User deleted successfully', type: 'success' });
      } else {
        let errorMessage = `Status: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) errorMessage = errorData.message;
        } catch (e) { }
        setMessage({ text: `Failed to delete user: ${errorMessage}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: `Error deleting user: ${error.message}`, type: 'error' });
    }
  };

  const getRoleOptions = () => {
    const allRoles = [
      { value: 0, label: 'Admin' },
      { value: 1, label: 'AgentTC' },
      { value: 2, label: 'Agent' },
      { value: 3, label: 'Classic Member' },
      { value: 4, label: 'Silver Member' },
      { value: 5, label: 'Gold Member' },
      { value: 6, label: 'Platinum Member' }
    ];

    const currentRole = parseInt(formData.role);

    if (isEditing && [3, 4, 5, 6].includes(currentRole)) {
      return allRoles.filter(r => [3, 4, 5, 6].includes(r.value));
    }

    if (isEditing && [0, 1, 2].includes(currentRole)) {
      return allRoles;
    }

    return allRoles.filter(r => [0, 1, 2].includes(r.value));
  };

  const roleOptions = getRoleOptions();
  const isRoleDisabled = isEditing && [0, 1, 2].includes(parseInt(formData.role));
  const currentRole = formData.role !== '' ? parseInt(formData.role) : null;

  const filteredUsers = users.filter(user => {
    const usernameMatch = user.username.toLowerCase().includes(usernameFilter.toLowerCase());
    const roleMatch = roleFilter === '' || user.role.toString() === roleFilter;
    return usernameMatch && roleMatch;
  });

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold">User Management</h2>
        <button
          onClick={handleAddNew}
          className="w-full sm:w-auto px-4 py-2 bg-accent text-primary rounded-lg hover:brightness-95 font-medium"
        >
          Add New User
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {showForm ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium">{isEditing ? 'Edit Membership' : 'Add New Agent'}</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span> User Type:
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={isRoleDisabled}
                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${isRoleDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">-- Select User Type --</option>
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            {!isEditing || (formData.role !== '' && [0, 1, 2].includes(parseInt(formData.role))) ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500">*</span> Username:
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="Enter username"
                    required
                    readOnly={isEditing}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500">*</span> {isEditing ? 'New Password' : 'Password'}:
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> Mobile Number:
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  name="mobile"
                  value={formData.mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                    setFormData({ ...formData, mobile: value });
                  }}
                  className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  required
                  readOnly={isEditing}
                />
              </div>
            )}

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
          {/* Mobile Card View */}
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
                <option value="">All User Types</option>
                {Object.entries(roleMap).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {users.length === 0 ? 'No users found' : 'No users match the current filters'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map(user => (
                  <div key={user.id} className="p-4 hover:bg-gray-50">
                    <div className="mb-3">
                      <div className="text-sm text-gray-500">Username</div>
                      <div className="font-medium">{user.username}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-sm text-gray-500">User Type</div>
                      <div className="capitalize">{roleMap[user.role] || 'Unknown'}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleSelectUser(user)}
                        className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition"
                      >
                        {[3, 4, 5, 6].includes(user.role) ? "Manage Subscription" : "Change Password"}
                      </button>

                      <button
                        onClick={() => handleDelete(user.id)}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-400">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                    <div className="mt-2">
                      <input
                        type="text"
                        value={usernameFilter}
                        onChange={(e) => setUsernameFilter(e.target.value)}
                        placeholder="Search..."
                        className="w-full p-1 border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Type
                    <div className="mt-2">
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full p-1 border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">All</option>
                        {Object.entries(roleMap).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-400">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-200">
                    <td className="px-6 py-4 text-center whitespace-nowrap">{user.username}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap capitalize">{roleMap[user.role] || 'Unknown'}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => handleSelectUser(user)}
                          className="w-[160px] px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition flex items-center justify-center"
                        >
                          {[3, 4, 5, 6].includes(user.role)
                            ? "Manage Subscription"
                            : "Change Password"}
                        </button>

                        <button
                          onClick={() => handleDelete(user.id)}
                          className="px-4 py-1.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                      {users.length === 0 ? 'No users found' : 'No users match the current filters'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const TicketCountManagement = () => {
  const [dateMode, setDateMode] = useState('single');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ticketCounts, setTicketCounts] = useState({
    adult_count: '',
    child_count: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Calculate max date (1 month from start date)
  const getMaxEndDate = () => {
    if (!startDate) return '';
    const start = new Date(startDate);
    const maxDate = new Date(start);
    maxDate.setMonth(maxDate.getMonth() + 1);
    return maxDate.toISOString().split('T')[0];
  };

  const handleDateModeChange = (mode) => {
    setDateMode(mode);
    if (mode === 'single') {
      setEndDate('');
    }
  };

  const handleCountChange = (ticketType, value) => {
    setTicketCounts(prev => ({
      ...prev,
      [ticketType]: parseInt(value, 10) || 0
    }));
  };

  const generateDateRange = (start, end) => {
    const dateRange = [];
    let currentDate = new Date(start);
    const endDate = new Date(end);

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      dateRange.push(parseInt(`${year}${month}${day}`, 10));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateRange;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startDate) {
      setMessage({ text: 'Please select a start date', type: 'error' });
      return;
    }

    if (dateMode === 'multiple' && !endDate) {
      setMessage({ text: 'Please select an end date', type: 'error' });
      return;
    }

    if (dateMode === 'multiple' && new Date(startDate) > new Date(endDate)) {
      setMessage({ text: 'End date must be after start date', type: 'error' });
      return;
    }

    if (dateMode === 'multiple') {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const oneMonthLater = new Date(start);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

      if (end > oneMonthLater) {
        setMessage({ text: 'End date must be within one month from start date', type: 'error' });
        return;
      }
    }

    try {
      const token = localStorage.getItem('authToken');
      const dateRange = dateMode === 'single'
        ? [parseInt(startDate.replace(/-/g, ''), 10)]
        : generateDateRange(startDate, endDate);

      const promises = dateRange.map(date => {
        return fetch(`${getBaseUrl()}/admin/tickets/count`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({
            date: date,
            ...ticketCounts
          })
        });
      });

      const results = await Promise.all(promises);
      const allSuccessful = results.every(res => res.ok);

      if (allSuccessful) {
        setMessage({
          text: `Successfully updated ticket counts for ${dateRange.length} day${dateRange.length > 1 ? 's' : ''}`,
          type: 'success'
        });
        setStartDate('');
        setEndDate('');
      } else {
        setMessage({
          text: 'Some dates could not be updated. Please try again.',
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: 'An error occurred while updating ticket counts',
        type: 'error'
      });
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4">Ticket Count Management</h2>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Set Available Ticket Counts</h3>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <label className="block text-xs font-semibold text-gray-800 mb-2">Select Date Mode</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="single"
                  checked={dateMode === 'single'}
                  onChange={(e) => handleDateModeChange(e.target.value)}
                  className="w-4 h-4 text-accent focus:ring-accent focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-700">📅 Single Day</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="multiple"
                  checked={dateMode === 'multiple'}
                  onChange={(e) => handleDateModeChange(e.target.value)}
                  className="w-4 h-4 text-accent focus:ring-accent focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-700">📆 Multiple Days</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {dateMode === 'single' ? 'Date' : 'Start Date'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {dateMode === 'multiple' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || today}
                  max={getMaxEndDate()}
                  className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <h4 className="text-xs font-semibold text-gray-800 mb-2">Ticket Counts</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Adult Tickets</label>
                <div className="flex items-center border rounded gap-2 px-3 py-2 bg-white">
                  <span className="text-gray-400 text-lg">👥</span>
                  <input
                    type="number"
                    value={ticketCounts.adult_count}
                    onChange={(e) => handleCountChange('adult_count', e.target.value)}
                    min="0"
                    className="w-full text-sm border-0 focus:outline-none focus:ring-0 p-0 bg-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Child Tickets</label>
                <div className="flex items-center border rounded gap-2 px-3 py-2 bg-white">
                  <span className="text-gray-400 text-lg">👥</span>
                  <input
                    type="number"
                    value={ticketCounts.child_count}
                    onChange={(e) => handleCountChange('child_count', e.target.value)}
                    min="0"
                    className="w-full text-sm border-0 focus:outline-none focus:ring-0 p-0 bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {message.text && (
            <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              className="w-full sm:w-auto px-6 py-2.5 bg-accent text-primary text-sm rounded hover:brightness-95 font-medium transition-all"
            >
              Update Ticket Counts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ticket Pricing Management Component
const TicketPricingManagement = () => {
  const [dateMode, setDateMode] = useState('single');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [prices, setPrices] = useState({
    adult_price_role_agent: '',
    child_price_role_agent: '',
    adult_price_role_user: '',
    child_price_role_user: '',
    adult_price_role_silver_user: '',
    child_price_role_silver_user: '',
    adult_price_role_gold_user: '',
    child_price_role_gold_user: '',
    adult_price_role_platinum_user: '',
    child_price_role_platinum_user: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  const today = new Date().toISOString().split('T')[0];

  const getMaxEndDate = () => {
    if (!startDate) return '';
    const start = new Date(startDate);
    const maxDate = new Date(start);
    maxDate.setMonth(maxDate.getMonth() + 1);
    return maxDate.toISOString().split('T')[0];
  };

  const roles = [
    { key: 'agent', label: 'Agent', bgColor: 'bg-slate-270' },
    { key: 'user', label: 'Classic Member', bgColor: 'bg-blue-100' },
    { key: 'silver_user', label: 'Silver Member', bgColor: 'bg-gray-300' },
    { key: 'gold_user', label: 'Gold Member', bgColor: 'bg-yellow-50' },
    { key: 'platinum_user', label: 'Platinum Member', bgColor: 'bg-purple-100' }
  ];

  const handleDateModeChange = (mode) => {
    setDateMode(mode);
    if (mode === 'single') {
      setEndDate('');
    }
  };

  const handlePriceChange = (priceKey, value) => {
    setPrices(prev => ({
      ...prev,
      [priceKey]: parseFloat(value) || 0
    }));
  };

  const generateDateRange = (start, end) => {
    const dateRange = [];
    let currentDate = new Date(start);
    const endDate = new Date(end);

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      dateRange.push(parseInt(`${year}${month}${day}`, 10));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateRange;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startDate) {
      setMessage({ text: 'Please select a start date', type: 'error' });
      return;
    }

    if (dateMode === 'multiple' && !endDate) {
      setMessage({ text: 'Please select an end date', type: 'error' });
      return;
    }

    if (dateMode === 'multiple' && new Date(startDate) > new Date(endDate)) {
      setMessage({ text: 'End date must be after start date', type: 'error' });
      return;
    }

    if (dateMode === 'multiple') {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const oneMonthLater = new Date(start);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

      if (end > oneMonthLater) {
        setMessage({ text: 'End date must be within one month from start date', type: 'error' });
        return;
      }
    }

    try {
      const token = localStorage.getItem('authToken');
      const dateRange = dateMode === 'single'
        ? [parseInt(startDate.replace(/-/g, ''), 10)]
        : generateDateRange(startDate, endDate);
      const filteredPrices = Object.fromEntries(
        Object.entries(prices).filter(([_, value]) => value !== '' && value !== 0 && value !== undefined)
      );
      const promises = dateRange.map(date => {
        return fetch(`${getBaseUrl()}/admin/tickets/price`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({
            date: date,
            ...filteredPrices
          })
        });
      });

      const results = await Promise.all(promises);
      const allSuccessful = results.every(res => res.ok);

      if (allSuccessful) {
        setMessage({
          text: `Successfully updated ticket pricing for ${dateRange.length} day${dateRange.length > 1 ? 's' : ''}`,
          type: 'success'
        });
        setStartDate('');
        setEndDate('');
      } else {
        setMessage({
          text: 'Some dates could not be updated. Please try again.',
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: 'An error occurred while updating ticket pricing',
        type: 'error'
      });
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4">Ticket Pricing Management</h2>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Set Ticket Pricing by User Role</h3>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <label className="block text-xs font-semibold text-gray-800 mb-2">Select Date Mode</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="single"
                  checked={dateMode === 'single'}
                  onChange={(e) => handleDateModeChange(e.target.value)}
                  className="w-4 h-4 text-accent focus:ring-accent focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-700">📅 Single Day</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="multiple"
                  checked={dateMode === 'multiple'}
                  onChange={(e) => handleDateModeChange(e.target.value)}
                  className="w-4 h-4 text-accent focus:ring-accent focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-700">📆 Multiple Days</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {dateMode === 'single' ? 'Date' : 'Start Date'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {dateMode === 'multiple' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || today}
                  max={getMaxEndDate()}
                  className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-800 mb-3">Pricing by User Role</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roles.map(role => (
                <div key={role.key} className={`border rounded-lg p-3 ${role.bgColor} hover:shadow-md transition-shadow`}>
                  <h5 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">{role.label}</h5>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Adult Price</label>
                      <div className="flex items-center border rounded gap-2 px-3 py-2 bg-white focus-within:ring-1 focus-within:ring-primary">
                        <span className="text-gray-400 text-base">₹</span>
                        <input
                          type="number"
                          value={prices[`adult_price_role_${role.key}`]}
                          onChange={(e) => handlePriceChange(`adult_price_role_${role.key}`, e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full text-sm font-bold border-0 focus:outline-none focus:ring-0 p-0 bg-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Child Price</label>
                      <div className="flex items-center border rounded gap-2 px-3 py-2 bg-white focus-within:ring-1 focus-within:ring-primary">
                        <span className="text-gray-400 text-base">₹</span>
                        <input
                          type="number"
                          value={prices[`child_price_role_${role.key}`]}
                          onChange={(e) => handlePriceChange(`child_price_role_${role.key}`, e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full text-sm font-bold border-0 focus:outline-none focus:ring-0 p-0 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {message.text && (
            <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              className="w-full sm:w-auto px-6 py-2.5 bg-accent text-primary text-sm rounded hover:brightness-95 font-medium transition-all"
            >
              Update Ticket Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AgentManagement = () => (
  <div className="p-3 sm:p-6">
    <h2 className="text-xl sm:text-2xl font-semibold mb-4">Agent Management</h2>
    <div className="bg-white rounded-lg shadow">
      <p className="p-4">Agent management section content will go here.</p>
    </div>
  </div>
);

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
  try {
    setLoading(true);

    // Get the token from localStorage (adjust the key name if needed)
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('authToken');

    const response = await fetch(`${getBaseUrl()}/admin/tickets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch bookings');

    const data = await response.json();
    setBookings(data);
    setError(null);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  const formatDate = (dateNum) => {
    const dateStr = dateNum.toString();
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}/${year}`;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    
    try {
      const response = await fetch(`${getBaseUrl()}/admin/tickets/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete booking');
      
      setBookings(bookings.filter(b => b.id !== id));
    } catch (err) {
      alert('Error deleting booking: ' + err.message);
    }
  };

  const handleUpdate = async (id) => {
    try {
      const response = await fetch(`${getBaseUrl()}/admin/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus }),
      });
      if (!response.ok) throw new Error('Failed to update booking');
      
      setBookings(bookings.map(b => 
        b.id === id ? { ...b, status: editStatus } : b
      ));
      setEditingId(null);
      setEditStatus('');
    } catch (err) {
      alert('Error updating booking: ' + err.message);
    }
  };

  const startEdit = (booking) => {
    setEditingId(booking.id);
    setEditStatus(booking.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditStatus('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="animate-pulse text-blue-600 text-xs font-semibold">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Bookings</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button 
                  onClick={fetchBookings}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Booking Management
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage all your bookings in one place</p>
            </div>
            <button 
              onClick={fetchBookings}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg border border-blue-200 font-medium"
            >
              <span className="text-lg">↻</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 font-medium">Total Bookings</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{bookings.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 font-medium">Confirmed</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {bookings.filter(b => b.status === 'confirmed').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-600 font-medium">Pending</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {bookings.filter(b => b.status === 'not').length}
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">User ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Booking Date</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking, index) => (
                  <tr key={booking.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{booking.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{booking.user_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{booking.title}</td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === booking.id ? (
                        <select 
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="border-2 border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="not">Not Confirmed</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700 border border-green-300' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700 border border-red-300' :
                          'bg-yellow-100 text-yellow-700 border border-yellow-300'
                        }`}>
                          {booking.status === 'not' ? '⏳ Not Confirmed' : 
                           booking.status === 'confirmed' ? '✓ Confirmed' : 
                           '✗ Cancelled'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-mono">{formatDate(booking.booking_date)}</td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === booking.id ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleUpdate(booking.id)}
                            className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-xs font-medium shadow-md hover:shadow-lg"
                          >
                            ✓ Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 text-xs font-medium shadow-md hover:shadow-lg"
                          >
                            ✗ Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => startEdit(booking)}
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-xs font-medium shadow-md hover:shadow-lg"
                            title="Edit"
                          >
                            ✎ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-xs font-medium shadow-md hover:shadow-lg"
                            title="Delete"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-lg">Booking #{booking.id}</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.status === 'not' ? '⏳ Pending' : 
                     booking.status === 'confirmed' ? '✓ Confirmed' : 
                     '✗ Cancelled'}
                  </span>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">User ID</span>
                  <span className="text-sm text-gray-900 font-semibold">{booking.user_id}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Title</span>
                  <span className="text-sm text-gray-900 font-semibold">{booking.title}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Booking Date</span>
                  <span className="text-sm text-gray-900 font-mono font-semibold">{formatDate(booking.booking_date)}</span>
                </div>

                {editingId === booking.id && (
                  <div className="py-2">
                    <label className="block text-sm text-gray-600 font-medium mb-2">Update Status</label>
                    <select 
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full border-2 border-blue-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="not">Not Confirmed</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {editingId === booking.id ? (
                    <>
                      <button
                        onClick={() => handleUpdate(booking.id)}
                        className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                      >
                        ✓ Save Changes
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 px-4 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                      >
                        ✗ Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(booking)}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                      >
                        🗑 Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {bookings.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bookings Found</h3>
            <p className="text-gray-500">There are no bookings to display at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editOrderStatus, setEditOrderStatus] = useState('');
  const token = localStorage.getItem('jwt_token') || localStorage.getItem('authToken');
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${getBaseUrl()}/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateNum) => {
    const dateStr = dateNum.toString();
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpdateOrderStatus = async (orderId) => {
    try {
      const response = await fetch(`${getBaseUrl()}/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_status: editOrderStatus })
      });
      if (!response.ok) throw new Error('Failed to update order');
      
      setOrders(orders.map(o => 
        o.ID === orderId ? { ...o, order_status: editOrderStatus } : o
      ));
      setEditingOrderId(null);
      setEditOrderStatus('');
    } catch (err) {
      alert('Error updating order: ' + err.message);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This will also delete all associated tickets.')) return;
    
    try {
      const response = await fetch(`${getBaseUrl()}/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete order');
      
      setOrders(orders.filter(o => o.ID !== orderId));
      if (expandedOrder === orderId) setExpandedOrder(null);
    } catch (err) {
      alert('Error deleting order: ' + err.message);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const startEditOrder = (order) => {
    setEditingOrderId(order.ID);
    setEditOrderStatus(order.order_status);
  };

  const cancelEditOrder = () => {
    setEditingOrderId(null);
    setEditOrderStatus('');
  };

  const countTicketsByType = (tickets) => {
    const adults = tickets.filter(t => t.title === 'Adult').length;
    const children = tickets.filter(t => t.title === 'Child').length;
    return { adults, children };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="animate-pulse text-blue-600 text-xs font-semibold">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Orders</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button 
                  onClick={fetchOrders}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter(o => o.order_status === 'pending').length;
  const completedOrders = orders.filter(o => o.order_status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Order Management
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage all customer orders and payments</p>
            </div>
            <button 
              onClick={fetchOrders}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg border border-blue-200 font-medium"
            >
              <span className="text-lg">↻</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 font-medium">Total Orders</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{orders.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-600 font-medium">Pending Orders</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{pendingOrders}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 font-medium">Completed Orders</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{completedOrders}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600 font-medium">Total Revenue</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold">Order ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">User ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Created At</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Tickets</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Order Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Payment Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order, index) => {
                  const ticketCount = countTicketsByType(order.tickets);
                  return (
                    <React.Fragment key={order.ID}>
                      <tr className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.ID}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{order.user_id}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{formatDateTime(order.CreatedAt)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="flex gap-2">
                            {ticketCount.adults > 0 && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                👤 {ticketCount.adults} Adult{ticketCount.adults > 1 ? 's' : ''}
                              </span>
                            )}
                            {ticketCount.children > 0 && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                👶 {ticketCount.children} Child{ticketCount.children > 1 ? 'ren' : ''}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{order.total_amount}</td>
                        <td className="px-6 py-4 text-sm">
                          {editingOrderId === order.ID ? (
                            <select 
                              value={editOrderStatus}
                              onChange={(e) => setEditOrderStatus(e.target.value)}
                              className="border-2 border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              order.order_status === 'completed' ? 'bg-green-100 text-green-700 border border-green-300' :
                              order.order_status === 'confirmed' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                              order.order_status === 'cancelled' ? 'bg-red-100 text-red-700 border border-red-300' :
                              'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            }`}>
                              {order.order_status === 'pending' ? '⏳ Pending' :
                               order.order_status === 'confirmed' ? '✓ Confirmed' :
                               order.order_status === 'completed' ? '✓✓ Completed' :
                               '✗ Cancelled'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            order.payment_info.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-300' :
                            order.payment_info.status === 'failed' ? 'bg-red-100 text-red-700 border border-red-300' :
                            'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          }`}>
                            {order.payment_info.status === 'pending' ? '💳 Pending' :
                             order.payment_info.status === 'completed' ? '✓ Paid' :
                             '✗ Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {editingOrderId === order.ID ? (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleUpdateOrderStatus(order.ID)}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-xs font-medium shadow-md hover:shadow-lg"
                              >
                                ✓ Save
                              </button>
                              <button
                                onClick={cancelEditOrder}
                                className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 text-xs font-medium shadow-md hover:shadow-lg"
                              >
                                ✗ Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => toggleExpand(order.ID)}
                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 text-xs font-medium shadow-md hover:shadow-lg"
                              >
                                {expandedOrder === order.ID ? '▲ Hide' : '▼ View'}
                              </button>
                              <button
                                onClick={() => startEditOrder(order)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-xs font-medium shadow-md hover:shadow-lg"
                              >
                                ✎ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.ID)}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-xs font-medium shadow-md hover:shadow-lg"
                              >
                                🗑 Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {expandedOrder === order.ID && (
                        <tr>
                          <td colSpan="8" className="px-6 py-4 bg-gray-50">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-gray-900 mb-3">Order Details</h4>
                              
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="px-4 py-2 bg-gray-100 font-semibold text-sm">Tickets ({order.tickets.length})</div>
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left">Ticket ID</th>
                                      <th className="px-4 py-2 text-left">Type</th>
                                      <th className="px-4 py-2 text-left">Booking Date</th>
                                      <th className="px-4 py-2 text-left">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {order.tickets.map(ticket => (
                                      <tr key={ticket.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">#{ticket.id}</td>
                                        <td className="px-4 py-2">{ticket.title}</td>
                                        <td className="px-4 py-2">{formatDate(ticket.booking_date)}</td>
                                        <td className="px-4 py-2">
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            ticket.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                            'bg-yellow-100 text-yellow-700'
                                          }`}>
                                            {ticket.status === 'not' ? 'Not Confirmed' : ticket.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="font-semibold text-sm mb-3">Payment Information</div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-600">Amount:</span>
                                    <span className="ml-2 font-semibold">₹{order.payment_info.amount}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Currency:</span>
                                    <span className="ml-2 font-semibold">{order.payment_info.currency}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Status:</span>
                                    <span className="ml-2 font-semibold capitalize">{order.payment_info.status}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Payment ID:</span>
                                    <span className="ml-2 font-semibold">#{order.payment_info.ID}</span>
                                  </div>
                                </div>
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

        <div className="lg:hidden space-y-4">
          {orders.map((order) => {
            const ticketCount = countTicketsByType(order.tickets);
            return (
              <div key={order.ID} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-lg">Order #{order.ID}</span>
                    <span className="text-white text-sm font-semibold">₹{order.total_amount}</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">User ID</span>
                    <span className="text-sm text-gray-900 font-semibold">{order.user_id}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Created At</span>
                    <span className="text-xs text-gray-900 font-semibold">{formatDateTime(order.CreatedAt)}</span>
                  </div>

                  <div className="py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium block mb-2">Tickets</span>
                    <div className="flex gap-2 flex-wrap">
                      {ticketCount.adults > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          👤 {ticketCount.adults} Adult{ticketCount.adults > 1 ? 's' : ''}
                        </span>
                      )}
                      {ticketCount.children > 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          👶 {ticketCount.children} Child{ticketCount.children > 1 ? 'ren' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Order Status</span>
                    {editingOrderId === order.ID ? (
                      <select 
                        value={editOrderStatus}
                        onChange={(e) => setEditOrderStatus(e.target.value)}
                        className="border-2 border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        order.order_status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.order_status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.order_status === 'pending' ? '⏳ Pending' :
                         order.order_status === 'confirmed' ? '✓ Confirmed' :
                         order.order_status === 'completed' ? '✓✓ Completed' :
                         '✗ Cancelled'}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Payment Status</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      order.payment_info.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.payment_info.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.payment_info.status === 'pending' ? '💳 Pending' :
                       order.payment_info.status === 'completed' ? '✓ Paid' :
                       '✗ Failed'}
                    </span>
                  </div>

                  {expandedOrder === order.ID && (
                    <div className="mt-4 space-y-3 border-t-2 border-gray-200 pt-4">
                      <h4 className="font-semibold text-gray-900">Ticket Details</h4>
                      <div className="space-y-2">
                        {order.tickets.map(ticket => (
                          <div key={ticket.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">Ticket #{ticket.id}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                ticket.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {ticket.status === 'not' ? 'Not Confirmed' : ticket.status}
                              </span>
                            </div>
                            <div className="text-gray-600">
                              <span>{ticket.title}</span>
                              <span className="mx-2">•</span>
                              <span>{formatDate(ticket.booking_date)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3 text-sm">
                        <h5 className="font-semibold mb-2">Payment Info</h5>
                        <div className="space-y-1 text-gray-700">
                          <div>Payment ID: #{order.payment_info.ID}</div>
                          <div>Amount: ₹{order.payment_info.amount} {order.payment_info.currency}</div>
                          <div>Status: <span className="capitalize font-medium">{order.payment_info.status}</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {editingOrderId === order.ID ? (
                      <>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.ID)}
                          className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg text-sm"
                        >
                          ✓ Save Changes
                        </button>
                        <button
                          onClick={cancelEditOrder}
                          className="flex-1 px-4 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg text-sm"
                        >
                          ✗ Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleExpand(order.ID)}
                          className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg text-sm"
                        >
                          {expandedOrder === order.ID ? '▲ Hide Details' : '▼ View Details'}
                        </button>
                        <button
                          onClick={() => startEditOrder(order)}
                          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg text-sm"
                        >
                          ✎ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.ID)}
                          className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg text-sm"
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {orders.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Orders Found</h3>
            <p className="text-gray-500">There are no orders to display at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Settings = () => (
  <div className="p-3 sm:p-6">
    <h2 className="text-xl sm:text-2xl font-semibold mb-4">Settings</h2>
    <div className="bg-white rounded-lg shadow">
      <p className="p-4">Settings section content will go here.</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authRole');
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.href = '/admin/login';
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'agents', label: 'Agent Management', icon: '🤝' },
    { id: 'ticket', label: 'Ticket Management', icon: '📅' },
    { id: 'orders', label: 'Order Management', icon: '🧾' },
    { id: 'ticketCount', label: 'Ticket Count', icon: '🎟️' },
    { id: 'pricing', label: 'Ticket Pricing', icon: '🏷️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardHome />;
      case 'users':
        return <UserManagement />;
      case 'agents':
        return <AgentManagement />;
      case 'ticket':
        return <BookingManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'ticketCount':
        return <TicketCountManagement />;
      case 'pricing':
        return <TicketPricingManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-[#E6E6FA] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`${isSidebarCollapsed ? 'w-16' : 'w-64'
          } bg-white h-full shadow-lg transition-all duration-300 hidden lg:flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b flex items-center justify-between shrink-0">
          {!isSidebarCollapsed && (
            <h2 className="text-xl font-semibold text-[#4A0080]">Admin Panel</h2>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 rounded hover:bg-gray-100 transition"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="p-4 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all ${activeSection === item.id
                ? 'bg-[#FFD700] text-[#4A0080] shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              {!isSidebarCollapsed && (
                <span className="font-medium truncate">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="bg-white w-64 h-full shadow-lg flex flex-col">
            <div className="p-4 border-b flex items-center justify-between shrink-0">
              <h2 className="text-xl font-semibold text-[#4A0080]">Admin Panel</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded hover:bg-gray-100 transition"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <nav className="p-4 flex-1 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all ${activeSection === item.id
                    ? 'bg-[#FFD700] text-[#4A0080] shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-md p-3 sm:p-4 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded hover:bg-gray-100 lg:hidden shrink-0"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-base sm:text-xl font-semibold text-[#4A0080] truncate">
                {menuItems.find((item) => item.id === activeSection)?.label}
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 sm:px-4 bg-[#FFD700] text-[#4A0080] rounded-xl shadow hover:brightness-95 text-sm sm:text-base font-medium shrink-0 transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
}