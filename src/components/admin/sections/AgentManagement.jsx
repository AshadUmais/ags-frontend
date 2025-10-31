import React, { useState, useEffect } from 'react';
import { getAgents, getAgentTickets, loadAgentWallet } from '../../../api';

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadAmount, setLoadAmount] = useState('');
  const [loadingWallet, setLoadingWallet] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAgents()
      .then(setAgents)
      .catch(err => setError(`Failed to fetch agents: ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

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
      // Refresh agents list to update balances
      const updatedAgents = await getAgents();
      setAgents(updatedAgents);
      // Update selected agent with new balance
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

  return (
    <div className="p-3 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4">Agent Management</h2>
      {error && <div className="mb-4 p-3 rounded bg-red-100 text-red-800">{error}</div>}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="text-center p-6">Loading...</td></tr>
            ) : agents.length === 0 ? (
              <tr><td colSpan={4} className="text-center p-6">No agents found</td></tr>
            ) : (
              agents.map((agent) => (
                <tr key={agent.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{agent.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{agent.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {agent.role === 1 ? 'Agent' : agent.role === 2 ? 'AgentTC' : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {/* <button
                        className="px-3 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 text-xs disabled:opacity-50"
                        onClick={() => handleShowTickets(agent)}
                        disabled={loadingAction}
                      >
                        Booked Tickets
                      </button> */}
                      <button
                        className="px-3 py-1.5 rounded bg-green-500 text-white hover:bg-green-600 text-xs disabled:opacity-50"
                        onClick={() => handleShowWallet(agent)}
                        disabled={loadingAction}
                      >
                        Wallet
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tickets Modal */}
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

      {/* Wallet Modal */}
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
    </div>
  );
};

export default AgentManagement;