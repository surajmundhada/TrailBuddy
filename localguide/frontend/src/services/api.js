import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, refreshToken);
          const { token: newToken, refreshToken: newRefreshToken } = response.data;

          localStorage.setItem('token', newToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/signin', credentials),
  register: (userData) => api.post('/auth/signup', userData),
  googleSignIn: ({ email, firstName, lastName, token } = {}) =>
    api.post('/auth/google-signin', { email, firstName, lastName, token }),
  sendOtp: ({ phone } = {}) => api.post('/auth/send-otp', { phone }),
  phoneSignIn: ({ phone, code } = {}) => api.post('/auth/phone-signin', { phone, code }),
  getCurrentUser: () => api.get('/user/profile'),
  forgotPassword: (email) => api.post('/auth/forgot-password', null, { params: { email } }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', null, { params: { token, newPassword } }),
  verifyEmail: (token) => api.post('/auth/verify-email', null, { params: { token } }),
  resendVerification: (email) => api.post('/auth/resend-verification', null, { params: { email } }),
  checkEmailAvailability: (email) => api.get('/auth/check-email', { params: { email } }),
  checkPhoneAvailability: (phone) => api.get('/auth/check-phone', { params: { phone } }),
};

// Guides API endpoints
export const guidesAPI = {
  getAll: (params) => api.get('/guides', { params }),
  getById: (id) => api.get(`/guides/${id}`),
  /** GUIDE role — live stage, commission, metrics */
  getRevenueModel: () => api.get('/guides/revenue-model'),
  register: (guideData) => api.post('/guides/register', guideData),
  updateProfile: (guideData) => api.put('/guides/profile', guideData),
  updateAvailability: (availabilityData) => api.put('/guides/availability', availabilityData),
  getAvailability: (guideId, startDate, endDate) => 
    api.get(`/guides/${guideId}/availability`, { params: { startDate, endDate } }),
  addReview: (guideId, reviewData) => api.post(`/guides/${guideId}/review`, reviewData),
};

// Bookings API endpoints
export const bookingsAPI = {
  create: (bookingData) => api.post('/bookings', bookingData),
  getUserBookings: () => api.get('/bookings/user'),
  getGuideBookings: () => api.get('/bookings/guide'),
  getById: (bookingId) => api.get(`/bookings/${bookingId}`),
  updateStatus: (bookingId, status, reason) =>
    api.put(`/bookings/${bookingId}/status`, reason ?? null, { params: { status } }),
  cancel: (bookingId, reason) => api.put(`/bookings/${bookingId}/cancel`, { reason }),
};

// Payments API endpoints
export const paymentsAPI = {
  createOrder: (bookingId) => api.post(`/payments/create-order/${bookingId}`),
  verify: ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) =>
    api.post('/payments/verify', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }),
  getByBooking: (bookingId) => api.get(`/payments/booking/${bookingId}`),
  getHistory: () => api.get('/payments/history'),
  mockConfirm: (bookingId) => api.post(`/payments/mock-confirm/${bookingId}`),
};

// Reviews API endpoints
export const reviewsAPI = {
  create: (reviewData) => api.post('/reviews', reviewData),
  update: (reviewId, reviewData) => api.put(`/reviews/${reviewId}`, reviewData),
  delete: (reviewId) => api.delete(`/reviews/${reviewId}`),
  getGuideReviews: (guideId) => api.get(`/reviews/guide/${guideId}`),
  getUserReviews: () => api.get('/reviews/user'),
};

// Stories API endpoints
export const storiesAPI = {
  getAll: (params) => api.get('/stories', { params }),
  getById: (id) => api.get(`/stories/${id}`),
  create: (storyData) => api.post('/stories', storyData),
  update: (id, storyData) => api.put(`/stories/${id}`, storyData),
  delete: (id) => api.delete(`/stories/${id}`),
  like: (storyId) => api.post(`/stories/${storyId}/like`),
  unlike: (storyId) => api.delete(`/stories/${storyId}/like`),
  getComments: (storyId) => api.get(`/stories/${storyId}/comments`),
  addComment: (storyId, comment) => api.post(`/stories/${storyId}/comments`, { comment }),
};

// Chat API endpoints
export const chatAPI = {
  sendMessage: (messageData) => api.post('/chat/send', messageData),
  getHistory: (userId, page = 0, size = 20) => 
    api.get('/chat/history', { params: { userId, page, size } }),
  markAsRead: (senderId) => api.put('/chat/read', null, { params: { senderId } }),
  getConversations: () => api.get('/chat/conversations'),
};

// AI Planner API endpoints
export const aiAPI = {
  generateTripPlan: (plannerData) => api.post('/ai/planner', plannerData),
  getLocalInsights: (destination) => api.get('/ai/insights', { params: { destination } }),
};

// Places API endpoints
export const placesAPI = {
  getNearby: (lat, lng, radius, type) => 
    api.get('/places/nearby', { params: { lat, lng, radius, type } }),
  search: (query, location) => api.get('/places/search', { params: { query, location } }),
  getDetails: (placeId) => api.get(`/places/${placeId}`),
};

// Subscriptions API endpoints
export const subscriptionsAPI = {
  create: (subscriptionData) => api.post('/subscriptions', subscriptionData),
  getCurrent: () => api.get('/subscriptions/current'),
  cancel: () => api.post('/subscriptions/cancel'),
  renew: () => api.post('/subscriptions/renew'),
};

// Notifications API endpoints
export const notificationsAPI = {
  getAll: (page = 0, size = 20) => api.get('/notifications', { params: { page, size } }),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// User API endpoints
export const userAPI = {
  getGuideStatus: () => api.get('/user/guide-status'),
};

// DigiLocker API endpoints
export const digilockerAPI = {
  getAuthUrl: () => api.get('/digilocker/auth-url'),
};

// Admin API endpoints
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (page = 0, size = 20) => api.get('/admin/users', { params: { page, size } }),
  getGuides: (page = 0, size = 20) => api.get('/admin/guides', { params: { page, size } }),
  approveGuide: (guideId) => api.post(`/admin/guides/${guideId}/approve`),
  rejectGuide: (guideId, reason) => api.post(`/admin/guides/${guideId}/reject`, { reason }),
  getBookings: (page = 0, size = 20) => api.get('/admin/bookings', { params: { page, size } }),
  getRevenue: (startDate, endDate) => 
    api.get('/admin/revenue', { params: { startDate, endDate } }),
};

export default api;
