// frontend/src/services/api.js

const API_BASE_URL = import.meta.env.VITE_API_URL || '/montealto/api';

export const getAuthToken = () => localStorage.getItem('pousada_admin_token');
export const setAuthToken = (token) => localStorage.setItem('pousada_admin_token', token);
export const removeAuthToken = () => localStorage.removeItem('pousada_admin_token');

export const getAuthUser = () => {
  const user = localStorage.getItem('pousada_admin_user');
  return user ? JSON.parse(user) : null;
};
export const setAuthUser = (user) => localStorage.setItem('pousada_admin_user', JSON.stringify(user));
export const removeAuthUser = () => localStorage.removeItem('pousada_admin_user');

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro na requisição');
    }
    return data;
  } catch (err) {
    console.warn(`API request error on ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  getMe: () => request('/auth/me'),

  // Accommodations
  getAccommodations: (publicOnly = true) => request(publicOnly ? '/accommodations' : '/accommodations/admin'),
  getAccommodationBySlug: (slug) => request(`/accommodations/${slug}`),
  checkAvailability: (check_in, check_out, guests = 1, pets = false) => request('/accommodations/check-availability', {
    method: 'POST',
    body: JSON.stringify({ check_in, check_out, guests, pets })
  }),
  createAccommodation: (data) => request('/accommodations', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateAccommodation: (id, data) => request(`/accommodations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteAccommodation: (id) => request(`/accommodations/${id}`, {
    method: 'DELETE'
  }),
  addAccommodationPhoto: (id, photo_url, is_cover = 0) => request(`/accommodations/${id}/photos`, {
    method: 'POST',
    body: JSON.stringify({ photo_url, is_cover })
  }),
  deleteAccommodationPhoto: (photoId) => request(`/accommodations/photos/${photoId}`, {
    method: 'DELETE'
  }),
  setCoverPhoto: (id, photoId) => request(`/accommodations/${id}/cover/${photoId}`, {
    method: 'PUT'
  }),

  // Reservations
  getReservations: () => request('/reservations'),
  getReservationsCalendar: (month) => request(`/reservations/calendar?month=${month || ''}`),
  createPublicReservation: (data) => request('/reservations/request', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createAdminReservation: (data) => request('/reservations/admin', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateReservationStatus: (id, status, payment_status, notes) => request(`/reservations/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, payment_status, notes })
  }),
  deleteReservation: (id) => request(`/reservations/${id}`, {
    method: 'DELETE'
  }),
  getWhatsAppLink: (id) => request(`/reservations/${id}/whatsapp`),

  // Finance
  getFinanceSummary: (month) => request(`/finance/summary?month=${month || ''}`),
  getFinanceTransactions: (type, month) => request(`/finance?type=${type || ''}&month=${month || ''}`),
  createFinanceTransaction: (data) => request('/finance', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteFinanceTransaction: (id) => request(`/finance/${id}`, {
    method: 'DELETE'
  }),

  // Blog
  getBlogPosts: (publicOnly = true) => request(publicOnly ? '/blog' : '/blog/admin'),
  getBlogPostBySlug: (slug) => request(`/blog/${slug}`),
  createBlogPost: (data) => request('/blog', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateBlogPost: (id, data) => request(`/blog/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteBlogPost: (id) => request(`/blog/${id}`, {
    method: 'DELETE'
  }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Upload
  uploadImage: async (file) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    return await res.json();
  }
};
