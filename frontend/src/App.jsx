import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import GuidesListPage from './pages/GuidesListPage';
import GuideProfilePage from './pages/GuideProfilePage';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import TripStartPage from './pages/TripStartPage';
import AiTripPlannerPage from './pages/AiTripPlannerPage';
import StoriesPage from './pages/StoriesPage';
import StoryDetailPage from './pages/StoryDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import ChatsPage from './pages/ChatsPage';
import ChatPage from './pages/ChatPage';
import BookingsPage from './pages/BookingsPage';
import GuideTripOtpVerifyPage from './pages/GuideTripOtpVerifyPage';
import TripExperiencePage from './pages/TripExperiencePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import GuideRegisterPage from './pages/GuideRegisterPage';
import MarketplacePage from './pages/MarketplacePage';
import GuidePackagesPage from './pages/GuidePackagesPage';
import PricingPage from './pages/PricingPage';
import NotFoundPage from './pages/NotFoundPage';
import PackagesPage from './pages/PackagesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-navy-900">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/guides" element={<GuidesListPage />} />
              <Route path="/revenue-model" element={
                <ProtectedRoute requiredRole="GUIDE">
                  <Layout>
                    <PricingPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/guides/:id" element={<GuideProfilePage />} />

              <Route path="/packages" element={
                <ProtectedRoute>
                  <Layout>
                    <PackagesPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/stories" element={<StoriesPage />} />
              <Route path="/stories/create" element={
                <ProtectedRoute>
                  <Layout>
                    <StoriesPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/stories/:id" element={
                <Layout>
                  <StoryDetailPage />
                </Layout>
              } />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/booking/:guideId" element={
                <ProtectedRoute>
                  <Layout>
                    <BookingPage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/bookings" element={
                <ProtectedRoute>
                  <Layout>
                    <BookingsPage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/payment/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentPage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/trip/start/:bookingId" element={
                <ProtectedRoute requiredRole="USER">
                  <Layout>
                    <TripStartPage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/trip/verify/:bookingId" element={
                <ProtectedRoute requiredRole="GUIDE">
                  <Layout>
                    <GuideTripOtpVerifyPage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/trip/experience/:bookingId" element={
                <ProtectedRoute requiredRole="USER">
                  <Layout>
                    <TripExperiencePage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/ai-planner" element={
                <ProtectedRoute>
                  <Layout>
                    <AiTripPlannerPage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/marketplace" element={
                <ProtectedRoute>
                  <Layout>
                    <MarketplacePage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/packages" element={
                <ProtectedRoute>
                  <Layout>
                    <GuidePackagesPage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/become-guide" element={
                <ProtectedRoute>
                  <Layout>
                    <GuideRegisterPage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/chat" element={
                <ProtectedRoute>
                  <Layout>
                    <ChatsPage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/chat/:userId" element={
                <ProtectedRoute>
                  <Layout>
                    <ChatPage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#0d2137',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#00b8d4',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
