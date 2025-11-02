import React, { useState, useEffect } from 'react';
import {
  getUsers,
  upgradeMember,
  deleteUser
} from '../../../api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [usernameFilter, setUsernameFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState('');

  const roleMap = {
    3: 'Classic Member',
    4: 'Silver Member',
    5: 'Gold Member',
    6: 'Platinum Member',
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data || []);
      setMessage({ text: '', type: '' });
    } catch (error) {
      setMessage({ text: `Error fetching members: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user) => {
    setSelectedUser(user);
    setSelectedNewRole(user.role.toString());
    setShowModal(true);
  };

  const handleUpgradeConfirm = async () => {
    if (!selectedUser || !selectedNewRole) return;

    try {
      const roleId = parseInt(selectedNewRole);
      const payload = { role: roleId };
      await upgradeMember(selectedUser.id, payload);
      setMessage({ text: 'Member subscription upgraded successfully!', type: 'success' });
      setShowModal(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (error) {
      setMessage({ text: `Error upgrading member: ${error.message}`, type: 'error' });
    }
  };

  const filteredUsers = users.filter((user) => {
    const usernameMatch = user.username.toLowerCase().includes(usernameFilter.toLowerCase());
    const roleMatch = roleFilter === '' || user.role.toString() === roleFilter;
    return usernameMatch && roleMatch;
  });

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold">Members Management</h2>
      </div>

      {message.text && (
        <div
          className={`mb-4 p-3 rounded-lg ${message.type === 'success'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
            }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Mobile filters */}
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
              <option value="">All Memberships</option>
              {Object.entries(roleMap).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {users.length === 0
                ? loading
                  ? 'Loading members...'
                  : 'No members found'
                : 'No members match the current filters'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 hover:bg-gray-50">
                  <div className="mb-3">
                    <div className="text-sm text-gray-500">Mobile Number</div>
                    <div className="font-medium">{user.username}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-sm text-gray-500">Membership Type</div>
                    <div className="capitalize">{roleMap[user.role] || 'Unknown'}</div>
                  </div>
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition"
                  >
                    Manage Subscription
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Mobile Number
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
                  Membership Type
                  <div className="mt-2">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full p-1 border rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">All</option>
                      {Object.entries(roleMap).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-400">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-200">
                  <td className="px-6 py-4 text-center whitespace-nowrap">{user.username}</td>
                  <td className="px-6 py-4 text-center whitespace-nowrap capitalize">
                    {roleMap[user.role] || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="w-[180px] px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition"
                    >
                      Manage Subscription
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    {users.length === 0
                      ? loading
                        ? 'Loading members...'
                        : 'No members found'
                      : 'No members match the current filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 relative">
            <h3 className="text-lg font-semibold mb-4">
              Upgrade Subscription for <span className="text-blue-600">{selectedUser.username}</span>
            </h3>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New Membership Level:
            </label>
            <select
              value={selectedNewRole}
              onChange={(e) => setSelectedNewRole(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            >
              <option value="">Select Membership</option>
              {Object.entries(roleMap)
                .filter(([value]) => value !== selectedUser.role.toString()) // hide current role
                .map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgradeConfirm}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:brightness-95"
              >
                Confirm Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;