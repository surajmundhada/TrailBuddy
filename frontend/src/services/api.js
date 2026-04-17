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
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
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
  getMyProfile: () => api.get('/guides/profile'),
  /** GUIDE role — live stage, commission, metrics */
  getRevenueModel: () => api.get('/guides/revenue-model'),
  register: (guideData) => api.post('/guides/register', guideData),
  updateProfile: (guideData) => api.put('/guides/profile', guideData),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/guides/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadVideo: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/guides/upload-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
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
  submitGuideQuotation: (bookingId, body) => api.put(`/bookings/${bookingId}/guide/quotation`, body),
  acceptQuotation: (bookingId) => api.post(`/bookings/${bookingId}/quotation/accept`),
  declineQuotation: (bookingId) => api.post(`/bookings/${bookingId}/quotation/decline`),
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
  mockConfirm: (bookingId, paymentPayload = {}) => api.post(`/payments/mock-confirm/${bookingId}`, paymentPayload),
  getDummyQr: (bookingId) => api.get(`/payments/dummy-qr/${bookingId}`),
};

// Guide-authored packages (curated itineraries) — public list per guide for booking quote flow
export const guidePackagesAPI = {
  getByGuide: (guideId) => api.get(`/guide-packages/by-guide/${guideId}`),
  /** Public — single listing (same fields as explore cards). */
  getById: (packageId) => api.get(`/guide-packages/listing/${packageId}`),
  /** Authenticated — same catalog order as explore. */
  listAll: () => api.get('/guide-packages'),
  /** Public — browse all locals’ packages (hidden gems + known spots). */
  explore: () => api.get('/guide-packages/explore'),
  create: (payload) => api.post('/guide-packages', payload),
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

// Trip Sessions API endpoints (OTP + SOS + experiences unlocks)
export const tripSessionsAPI = {
  getByBooking: (bookingId) => api.get(`/trip-sessions/by-booking/${bookingId}`),
  guideStartJourney: (bookingId) => api.post(`/trip-sessions/by-booking/${bookingId}/guide/start-journey`, {}),
  guideArrived: (bookingId) => api.post(`/trip-sessions/by-booking/${bookingId}/guide/arrived`, {}),
  verifyGuideOtp: (bookingId, otp) =>
    api.post(`/trip-sessions/by-booking/${bookingId}/guide/verify-otp`, { otp }),
  startTrip: (bookingId) => api.post(`/trip-sessions/by-booking/${bookingId}/user/start-trip`, {}),
  endTrip: (bookingId) => api.post(`/trip-sessions/by-booking/${bookingId}/end-trip`, {}),
  updateLocation: (bookingId, locationPayload) =>
    api.post(`/trip-sessions/by-booking/${bookingId}/location`, locationPayload),
  sos: (bookingId, sosPayload) => api.post(`/trip-sessions/by-booking/${bookingId}/sos`, sosPayload),

  getExperienceUnlockCards: (bookingId) =>
    api.get(`/trip-sessions/by-booking/${bookingId}/experiences`),
  getTimeline: (bookingId) =>
    api.get(`/trip-sessions/by-booking/${bookingId}/timeline`),
  getPostTripData: (bookingId) =>
    api.get(`/trip-sessions/by-booking/${bookingId}/post-trip`),
};

export const marketplaceAPI = {
  createRequest: (payload) => api.post('/requests', payload),
  getMyRequests: () => api.get('/requests/mine'),
  getIncomingRequests: () => api.get('/requests/for-guides'),
  createProposal: (payload) => api.post('/proposals/send', payload),
  getProposals: (requestId) => api.get(`/marketplace/getProposals/${requestId}`),
  selectProposal: (proposalId) => api.post(`/proposals/${proposalId}/accept`, {}),
};

export const requestsAPI = {
  create: (payload) => api.post('/requests', payload),
  getMine: () => api.get('/requests/mine'),
  getForGuides: () => api.get('/requests/for-guides'),
};

export const proposalsAPI = {
  send: (payload) => api.post('/proposals/send', payload),
  getTraveler: () => api.get('/proposals/traveler'),
  getGuide: () => api.get('/proposals/guide'),
  accept: (proposalId) => api.post(`/proposals/${proposalId}/accept`, {}),
  reject: (proposalId) => api.post(`/proposals/${proposalId}/reject`, {}),
};

export const experiencePurchaseAPI = {
  createOrder: ({ experienceId, bookingId = null }) =>
    api.post('/experience-purchases/create-order', { experienceId, bookingId }),
  mockConfirm: ({ purchaseId }) =>
    api.post('/experience-purchases/mock-confirm', { purchaseId }),
  verify: ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) =>
    api.post('/experience-purchases/verify', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }),
};

export const experiencesAPI = {
  getWithoutGuideQuick: () => api.get('/experiences/catalog/without-guide/quick'),
  getWithoutGuideCityTours: () => api.get('/experiences/catalog/without-guide/city-tours'),
  getTripAddons: () => api.get('/experiences/catalog/trip-addon'),
};

// Chat API endpoints
export const chatAPI = {
  sendMessage: ({ receiverId, message }) => api.post('/chat/send', { receiverId, message }),
  getHistory: (userId) => api.get(`/chat/history/${userId}`),
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
  getProfile: () => api.get('/user/profile'),
  updateProfile: (userData) => api.put('/user/profile', userData),
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
  getPendingGuides: () => api.get('/admin/guides/pending'),
  approveGuide: (guideId) => api.post(`/admin/guides/${guideId}/approve`),
  rejectGuide: (guideId, reason) => api.post(`/admin/guides/${guideId}/reject`, { reason }),
  getBookings: (page = 0, size = 20) => api.get('/admin/bookings', { params: { page, size } }),
  getRevenue: (startDate, endDate) =>
    api.get('/admin/revenue', { params: { startDate, endDate } }),
};

export default api;
