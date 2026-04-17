import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const isAdmin = useMemo(() => {
    const roles = Array.isArray(user?.roles)
      ? user.roles.map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean)
      : [];
    return roles.includes('ADMIN');
  }, [user]);

  const [activeTab, setActiveTab] = useState('pending');

  const { data: dashboardData, refetch: refetchDashboard, error: dashboardError } = useQuery(
    ['admin-dashboard'],
    () => adminAPI.getDashboard().then((r) => r.data),
    { retry: 1 }
  );

  const { data: guidesPage, refetch: refetchGuides, isLoading: guidesLoading, error: guidesError } = useQuery(
    ['admin-guides', 0, 20],
    () => adminAPI.getGuides(0, 20).then((r) => r.data),
    { retry: 1 }
  );

  const guides = guidesPage?.content ?? [];
  const pendingGuides = guides.filter((g) => {
    // Pending means: not yet fully verified/approved by admin.
    return g.aadharVerified !== true || g.isVerified !== true || g.isApproved !== true;
  });

  const { data: bookingsPage, isLoading: bookingsLoading, error: bookingsError } = useQuery(
    ['admin-bookings', 0, 10],
    () => adminAPI.getBookings(0, 10).then((r) => r.data),
    { retry: 1 }
  );
  const recentBookings = bookingsPage?.content ?? [];

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <div className="bg-white rounded-lg shadow p-6 text-red-700">
            Access denied. Admins only.
          </div>
        </div>
      </div>
    );
  }

  const onApprove = async (guideId) => {
    try {
      await adminAPI.approveGuide(guideId);
      toast.success('Guide approved');
      await Promise.all([refetchGuides(), refetchDashboard()]);
    } catch (e) {
      toast.error(e?.response?.data || 'Failed to approve');
    }
  };

  const onReject = async (guideId) => {
    const reason = window.prompt('Rejection reason (optional):') || '';
    try {
      await adminAPI.rejectGuide(guideId, reason);
      toast.success('Guide rejected');
      await Promise.all([refetchGuides(), refetchDashboard()]);
    } catch (e) {
      toast.error(e?.response?.data || 'Failed to reject');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeTab === 'pending' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Verification Queue ({pendingGuides.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeTab === 'overview' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recent')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeTab === 'recent' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Recent Bookings
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardError ? (
            <div className="col-span-full text-red-600 text-sm">
              Failed to load dashboard: {dashboardError?.message || 'Unknown error'}
            </div>
          ) : null}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Active Users</h3>
            <p className="text-3xl font-bold text-blue-600">{dashboardData?.activeUsers ?? '-'}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Active Guides</h3>
            <p className="text-3xl font-bold text-green-600">{dashboardData?.activeGuides ?? '-'}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Bookings</h3>
            <p className="text-3xl font-bold text-purple-600">{dashboardData?.totalBookings ?? '-'}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Revenue</h3>
            <p className="text-3xl font-bold text-orange-600">₹{dashboardData?.revenue ?? '-'}</p>
          </div>
        </div>

        {/* Body */}
        {activeTab === 'pending' ? (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Aadhaar Verification Queue</h2>

            {guidesError ? (
              <div className="text-red-600 text-sm">
                Failed to load guides: {guidesError?.message || 'Unknown error'}
              </div>
            ) : null}

            {guidesLoading ? (
              <div className="text-gray-600">Loading guides...</div>
            ) : pendingGuides.length === 0 ? (
              <div className="text-gray-600">No guides pending verification.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Guide</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingGuides.map((g) => {
                      const statusParts = [
                        g.aadharVerified === true ? 'Aadhaar OK' : 'Aadhaar pending',
                        g.isVerified === true ? 'Verified' : 'Not verified',
                        g.isApproved === true ? 'Approved' : 'Approval pending',
                      ];
                      return (
                        <tr key={g.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {g.user?.firstName} {g.user?.lastName}
                            <div className="text-xs text-gray-500">{g.user?.email}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="flex flex-wrap gap-2">
                              {statusParts.map((s, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-1 rounded text-xs ${
                                    s.includes('OK') || s.includes('Verified') || s.includes('Approved')
                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                  }`}
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {g.city}, {g.state}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            <button
                              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                              onClick={() => onApprove(g.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="ml-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                              onClick={() => onReject(g.id)}
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'overview' ? (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Overview</h2>
            <div className="text-sm text-gray-700 space-y-2">
              <div>
                Active users: <span className="font-semibold">{dashboardData?.activeUsers ?? '-'}</span>
              </div>
              <div>
                Active guides: <span className="font-semibold">{dashboardData?.activeGuides ?? '-'}</span>
              </div>
              <div>
                Guides pending verification: <span className="font-semibold">{pendingGuides.length}</span>
              </div>
              <div>
                Total bookings: <span className="font-semibold">{dashboardData?.totalBookings ?? '-'}</span>
              </div>
              <div>
                Revenue: <span className="font-semibold">₹{dashboardData?.revenue ?? '-'}</span>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'recent' ? (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bookings</h2>
            {bookingsError ? (
              <div className="text-red-600 text-sm">
                Failed to load bookings: {bookingsError?.message || 'Unknown error'}
              </div>
            ) : null}
            {bookingsLoading ? (
              <div className="text-gray-600">Loading bookings...</div>
            ) : recentBookings.length === 0 ? (
              <div className="text-gray-600">No bookings yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Booking</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Guide</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dates</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">#{b.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {/* Booking.user is JsonIgnored, so we display user via guide.user on available fields (fallback). */}
                          {b.user?.firstName ? `${b.user.firstName} ${b.user.lastName}` : b.guide?.user?.firstName ? 'User hidden' : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {b.guide?.user?.firstName ? `${b.guide.user.firstName} ${b.guide.user.lastName}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {b.startDate} - {b.endDate}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{b.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminDashboard;
