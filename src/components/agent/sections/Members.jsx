import React, { useEffect, useState } from 'react';
import { getUsers } from '../../../api';

const roleMap = {
  3: 'Classic Member',
  4: 'Silver Member',
  5: 'Gold Member',
  6: 'Platinum Member'
};

const Members = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getUsers();
        const members = (data || []).filter(u => [3,4,5,6].includes(u.role));
        setUsers(members);
      } catch (e) {
        setError('Failed to fetch members');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = users.filter(u => {
    const s = search.trim().toLowerCase();
    const bySearch = s === '' || (u.username || '').toLowerCase().includes(s);
    const byRole = roleFilter === '' || String(u.role) === roleFilter;
    return bySearch && byRole;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow space-y-3">
        <input className="w-full px-3 py-2 border rounded-lg" placeholder="Search by mobile..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="w-full px-3 py-2 border rounded-lg" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Subscription Types</option>
          {Object.entries(roleMap).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">Loading...</div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">No members found</div>
        ) : (
          filtered.map(user => (
            <div key={user.id} className="bg-white rounded-xl shadow border p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Mobile</div>
                <div className="text-lg font-semibold">{user.username}</div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 border">{roleMap[user.role] || 'Unknown'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Members;
