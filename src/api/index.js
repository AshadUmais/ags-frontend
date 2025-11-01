const API_BASE_URL = 'http://localhost:8080/api';  // Using relative URL to work with proxy

// Helper function to handle responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Something went wrong');
  }
  return response.json();
};

// Authentication headers
const getAuthHeaders = () => ({
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
});

// Ticket related APIs
export const getTicketCount = async (date) => {
  const response = await fetch(`${API_BASE_URL}/tickets/count?date=${date}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  console.log(response);
  return handleResponse(response);
};

export const createTickets = async (ticketData, date) => {
  
  const requestBody = {
    tickets: ticketData,
    booking_date: date,
  };
  console.log('Final request body:', JSON.stringify(requestBody, null, 2));
  console.log(requestBody)
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(requestBody),
  });
  return handleResponse(response);
};

export const getMyTickets = async () => {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse(response);
};

// Order related APIs
export const createOrder = async (orderData) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(orderData),
  });
  return handleResponse(response);
};

export const getMyOrders = async () => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse(response);
};

export const getOrderById = async (orderId) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse(response);
};

// Payment related APIs
export const processPayment = async (orderId, paymentData) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/process-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(paymentData),
  });
  return handleResponse(response);
};

export const getPaymentStatus = async (orderId) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment-status`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse(response);
};

// Admin user management
export const getUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  return handleResponse(response);
};

export const getMembers = async () => {
  const response = await fetch(`${API_BASE_URL}/agent/users`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  return handleResponse(response);
};

export const createUser = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const updateUser = async (userId, payload) => {
  console.log(userId);
  console.log(payload);
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const upgradeMember = async (userId, payload) => {
  const response = await fetch(`${API_BASE_URL}/agent/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const deleteUser = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(response);
};

// Admin ticket management
export const setTicketCount = async (dates, counts) => {
  const promises = dates.map(date => {
    return fetch(`${API_BASE_URL}/admin/tickets/count`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        date: date,
        ...counts
      })
    });
  });
  const results = await Promise.all(promises);
  // Ensure all promises were successful
  if (results.some(res => !res.ok)) {
    throw new Error('One or more ticket count updates failed.');
  }
  return Promise.all(results.map(res => res.json()));
};

export const setTicketPrice = async (dates, prices) => {
  const promises = dates.map(date => {
    return fetch(`${API_BASE_URL}/admin/tickets/price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        date: date,
        ...prices
      })
    });
  });
  const results = await Promise.all(promises);
  if (results.some(res => !res.ok)) {
    throw new Error('One or more ticket price updates failed.');
  }
  return Promise.all(results.map(res => res.json()));
};

export const getAllBookings = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse(response);
};

export const getAllOrders = async () => {
    const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleResponse(response);
};

export const getAgents = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/agents/`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse(response);
};

export const getAgentTickets = async (agentId) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse(response);
};

export const getAgentWallet = async (agentId) => {
  const response = await fetch(`${API_BASE_URL}/admin/agents/${agentId}/load_wallet`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse(response);
};

export const loadAgentWallet = async (agentId, amount) => {
  const response = await fetch(`${API_BASE_URL}/admin/agents/${agentId}/load_wallet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ amount: amount })
  });
  return handleResponse(response);
};

// Wallet APIs (agent)
export const getMyWallet = async () => {
  const response = await fetch(`${API_BASE_URL}/agent/wallet/balance`, {
    credentials: 'include',
  });
  console.log(response);
  return handleResponse(response);
};

// Ticket pricing (by date)
export const getTicketPricing = async (date) => {
  const response = await fetch(`${API_BASE_URL}/tickets/price?date=${date}`, {
    credentials: 'include',
  });
  console.log(response);
  return handleResponse(response);
};

export const loadWallet = async (userId, amount) => {
  const response = await fetch(`${API_BASE_URL}/load-wallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add your auth headers if needed
    },
    body: JSON.stringify({
      userId: userId,
      amount: amount
    })
  });
    
  if (!response.ok) {
    throw new Error('Failed to load wallet');
  }
  
  return response.json();
};