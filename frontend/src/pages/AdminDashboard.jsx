import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { UsersIcon, ShieldCheckIcon, CalendarIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';

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

  const { data: guidesPage, refetch: refetchGuides, error: guidesError } = useQuery(
    ['admin-guides', 0, 20],
    () => adminAPI.getGuides(0, 20).then((r) => r.data),
    { retry: 1 }
  );

  const guides = guidesPage?.content ?? [];
  const { data: pendingGuidesData, refetch: refetchPendingGuides, isLoading: pendingGuidesLoading, error: pendingGuidesError } = useQuery(
    ['admin-pending-guides'],
    () => adminAPI.getPendingGuides().then((r) => r.data),
    { retry: 1 }
  );
  const pendingGuides = Array.isArray(pendingGuidesData) ? pendingGuidesData : [];

  const { data: bookingsPage, isLoading: bookingsLoading, error: bookingsError } = useQuery(
    ['admin-bookings', 0, 200],
    () => adminAPI.getBookings(0, 200).then((r) => r.data),
    { retry: 1 }
  );
  const recentBookings = bookingsPage?.content ?? [];

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-4">Admin Dashboard</h1>
        <div className="glass rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-red-400 text-sm">
          Access denied. Admins only.
        </div>
      </div>
    );
  }

  const onApprove = async (guideId) => {
    try {
      await adminAPI.approveGuide(guideId);
      toast.success('Guide approved');
      await Promise.all([refetchGuides(), refetchPendingGuides(), refetchDashboard()]);
    } catch (e) { toast.error(e?.response?.data || 'Failed to approve'); }
  };

  const onReject = async (guideId) => {
    const reason = window.prompt('Rejection reason (optional):') || '';
    try {
      await adminAPI.rejectGuide(guideId, reason);
      toast.success('Guide rejected');
      await Promise.all([refetchGuides(), refetchPendingGuides(), refetchDashboard()]);
    } catch (e) { toast.error(e?.response?.data || 'Failed to reject'); }
  };

  const statCards = [
    { label: 'Active Users', value: dashboardData?.activeUsers ?? '—', icon: UsersIcon, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Active Guides', value: dashboardData?.activeGuides ?? '—', icon: ShieldCheckIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Total Bookings', value: dashboardData?.totalBookings ?? '—', icon: CalendarIcon, color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20' },
    { label: 'Revenue', value: dashboardData?.revenue != null ? `₹${dashboardData.revenue}` : '—', icon: CurrencyRupeeIcon, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  ];

  const tabs = [
    { id: 'pending', label: `Verification Queue (${pendingGuides.length})` },
    { id: 'overview', label: 'Overview' },
    { id: 'recent', label: 'Recent Bookings' },
  ];

  const statusBadge = (status) => {
    const map = {
      PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
      CONFIRMED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      COMPLETED: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
      CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/25',
    };
    return map[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/25';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-primary-400 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-slate-400 text-sm">Platform overview, guide approvals, and booking management.</p>
      </div>

      {/* Stat Cards */}
      {dashboardError && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-6">
          Failed to load dashboard: {dashboardError?.message || 'Unknown error'}
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`glass rounded-2xl border p-5 ${bg}`}>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-white shadow-glow-sm'
                : 'bg-white/5 text-slate-400 border border-white/8 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pending Guides */}
      {activeTab === 'pending' && (
        <div className="glass rounded-2xl border border-white/6">
          <div className="px-6 py-4 border-b border-white/6">
            <h2 className="text-base font-bold text-white">Aadhaar Verification Queue</h2>
          </div>
          {(guidesError || pendingGuidesError) && (
            <div className="px-6 py-3 text-xs text-red-400">
              Failed to load guides: {pendingGuidesError?.message || guidesError?.message || 'Unknown error'}
            </div>
          )}
          {pendingGuidesLoading ? (
            <div className="px-6 py-6 flex items-center gap-2 text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-cyan-400" />
              Loading guides...
            </div>
          ) : pendingGuides.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500 text-sm">✓ No guides pending verification.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Guide</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {pendingGuides.map((g) => {
                    const statusParts = [
                      g.aadharVerified === true ? 'Aadhaar OK' : 'Aadhaar pending',
                      g.isVerified === true ? 'Verified' : 'Not verified',
                      g.isApproved === true ? 'Approved' : 'Approval pending',
                    ];
                    return (
                      <tr key={g.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-5 py-4 text-sm">
                          <div className="font-semibold text-slate-200">{g.user?.firstName} {g.user?.lastName}</div>
                          <div className="text-xs text-slate-500">{g.user?.email}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {statusParts.map((s, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                  s.includes('OK') || (s.includes('Verified') && !s.includes('Not')) || s.includes('Approved')
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-400">{g.city}, {g.state}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors font-medium"
                              onClick={() => onApprove(g.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 transition-colors"
                              onClick={() => onReject(g.id)}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="glass rounded-2xl border border-white/6 p-6">
          <h2 className="text-base font-bold text-white mb-5">Admin Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Active users', value: dashboardData?.activeUsers ?? '—' },
              { label: 'Active guides', value: dashboardData?.activeGuides ?? '—' },
              { label: 'Pending verification', value: pendingGuides.length },
              { label: 'Total bookings', value: dashboardData?.totalBookings ?? '—' },
              { label: 'Revenue', value: dashboardData?.revenue != null ? `₹${dashboardData.revenue}` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white/4 border border-white/8 p-4">
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className="text-xl font-bold text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      {activeTab === 'recent' && (
        <div className="glass rounded-2xl border border-white/6">
          <div className="px-6 py-4 border-b border-white/6">
            <h2 className="text-base font-bold text-white">Recent Bookings</h2>
          </div>
          {bookingsError && (
            <div className="px-6 py-3 text-xs text-red-400">
              Failed to load bookings: {bookingsError?.message || 'Unknown error'}
            </div>
          )}
          {bookingsLoading ? (
            <div className="px-6 py-6 flex items-center gap-2 text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-cyan-400" />
              Loading bookings...
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500 text-sm">No bookings yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Guide</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dates</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-4 text-sm font-semibold text-slate-200">#{b.id}</td>
                      <td className="px-5 py-4 text-sm text-slate-400">
                        {b.user?.firstName ? `${b.user.firstName} ${b.user.lastName}` : b.guide?.user?.firstName ? 'User hidden' : '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">
                        {b.guide?.user?.firstName ? `${b.guide.user.firstName} ${b.guide.user.lastName}` : '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400 whitespace-nowrap">
                        {b.startDate} – {b.endDate}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${statusBadge(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
