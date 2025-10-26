const API_BASE_URL = '/api';  // Using relative URL to work with proxy

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
  'Content-Type': 'application/json',
  'Authorization': localStorage.getItem('authToken'),
});

// Ticket related APIs
export const getTicketCount = async (date) => {
  const response = await fetch(`${API_BASE_URL}/tickets/count?date=${date}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const createTickets = async (ticketData, date) => {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      adult_tickets: ticketData.Adult,
      child_tickets: ticketData.Child,
      date: date
    }),
  });
  return handleResponse(response);
};

export const getMyTickets = async () => {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// Order related APIs
export const createOrder = async (orderData) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(orderData),
  });
  return handleResponse(response);
};

export const getMyOrders = async () => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getOrderById = async (orderId) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// Payment related APIs
export const processPayment = async (orderId, paymentData) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/process-payment`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(paymentData),
  });
  return handleResponse(response);
};

export const getPaymentStatus = async (orderId) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment-status`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};