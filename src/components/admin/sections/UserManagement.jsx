import React, { useState, useCallback, useEffect } from 'react';
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser
  } from '../../../api';
  

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
      1: 'Agent',
      2: 'AgentTC',
      3: 'Classic Member',
      4: 'Silver Member',
      5: 'Gold Member',
      6: 'Platinum Member'
    };
  
    const isUserRole = (roleId) => [3, 4, 5, 6].includes(roleId);
    const isAgentRole = (roleId) => [0, 1, 2].includes(roleId);
  
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
        console.log("data", data);
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
        if (isUserRole(roleId)) {
          setFormData(prev => ({ ...prev, password: '' }));
        } else if (isAgentRole(roleId)) {
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
  
    const validateForm = () => {
      const roleId = parseInt(formData.role);
  
      if (isAgentRole(roleId)) {
        if (!formData.username) {
          setMessage({ text: 'Username is required for AgentTC, Agent, and Admin roles', type: 'error' });
          return false;
        }
        if (!isEditing && !formData.password) {
          setMessage({ text: 'Password is required for AgentTC, Agent, and Admin roles', type: 'error' });
          return false;
        }
      } else if (isUserRole(roleId)) {
        if (!formData.mobile) {
          setMessage({ text: 'Mobile number is required for User roles', type: 'error' });
          return false;
        }
        if (!/^[0-9]{10}$/.test(formData.mobile)) {
          setMessage({ text: 'Please enter a valid 10-digit mobile number', type: 'error' });
          return false;
        }
      }
  
      return true;
    };
  
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
      
        if (!validateForm()) return;
      
        const roleId = parseInt(formData.role);
        const userId = selectedUser?.id;
      
        if (isEditing && !userId) {
          setMessage({ text: 'Error: User ID is missing for update operation', type: 'error' });
          return;
        }
      
        const payload = { role: roleId };
      
        if (isAgentRole(roleId)) {
          payload.username = formData.username;
          if (formData.password) { // Only include password if it's provided
            payload.password = formData.password;
          }
        } else if (isUserRole(roleId)) {
          payload.username = formData.mobile;
          payload.password = '';
        }
      console.log(`Updating user with ID ${userId}:`, payload);
        try {
          if (isEditing) {
            await updateUser(userId, payload);
          } else {
            await createUser(payload);
          }
      
          await fetchUsers();
          resetForm();
          setMessage({
            text: isEditing ? 'User updated successfully' : 'User created successfully',
            type: 'success'
          });
        } catch (error) {
          setMessage({
            text: `Error ${isEditing ? 'updating' : 'creating'} user: ${error.message}`,
            type: 'error'
          });
        }
      };
      
  
    const resetForm = () => {
      setFormData({ username: '', mobile: '', password: '', role: '' });
      setIsEditing(false);
      setSelectedUser(null);
      setShowForm(false);
    };
  
    const handleAddNew = () => {
      resetForm();
      setShowForm(true);
      setMessage({ text: '', type: '' });
    };
  
    const handleCancel = () => {
      resetForm();
      setMessage({ text: '', type: '' });
    };
  
    const handleDelete = async (userId) => {
      if (!window.confirm('Are you sure you want to delete this user?')) return;
  
      try {
        await deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        if (selectedUser?.id === userId) {
          resetForm();
        }
        setMessage({ text: 'User deleted successfully', type: 'success' });
      } catch (error) {
        setMessage({ text: `Error deleting user: ${error.message}`, type: 'error' });
      }
    };
  
    const getRoleOptions = () => {
      const allRoles = [
        { value: 1, label: 'AgentTC' },
        { value: 2, label: 'Agent' },
        { value: 3, label: 'Classic Member' },
        { value: 4, label: 'Silver Member' },
        { value: 5, label: 'Gold Member' },
        { value: 6, label: 'Platinum Member' }
      ];
  
      const currentRole = parseInt(formData.role);
  
      if (isEditing && isUserRole(currentRole)) {
        return allRoles.filter(r => isUserRole(r.value));
      }
  
      if (isEditing && isAgentRole(currentRole)) {
        return allRoles.filter(r => isAgentRole(r.value));
      }
  
      return allRoles;
    };
  
    const filteredUsers = users.filter(user => {
      const usernameMatch = user.username.toLowerCase().includes(usernameFilter.toLowerCase());
      const roleMatch = roleFilter === '' || user.role.toString() === roleFilter;
      return usernameMatch && roleMatch;
    });
  
    const isRoleDisabled = isEditing && isAgentRole(parseInt(formData.role));
    const roleId = formData.role !== '' ? parseInt(formData.role) : null;
  
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
              <div className="p-4 border-b">
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
                    {getRoleOptions().map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
    
                {(!isEditing || (roleId !== null && isAgentRole(roleId))) ? (
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
                        placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                        required={!isEditing}
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
                            {isUserRole(user.role) ? "Manage Subscription" : "Change Password"}
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
                        User Type
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
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-200">
                        <td className="px-6 py-4 text-center whitespace-nowrap">{user.username}</td>
                        <td className="px-6 py-4 text-center whitespace-nowrap capitalize">{roleMap[user.role] || 'Unknown'}</td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex justify-center items-center space-x-2">
                            <button
                              onClick={() => handleSelectUser(user)}
                              className="w-[160px] px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition"
                            >
                              {isUserRole(user.role) ? "Manage Subscription" : "Change Password"}
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

export default UserManagement;
