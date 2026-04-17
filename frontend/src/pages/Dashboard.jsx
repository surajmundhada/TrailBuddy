import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  adminAPI,
  bookingsAPI,
  chatAPI,
  experiencePurchaseAPI,
  experiencesAPI,
  guidesAPI,
  paymentsAPI,
  reviewsAPI,
  userAPI,
} from '../services/api';
import { useQuery } from 'react-query';
import {
  UserGroupIcon,
  MapPinIcon,
  StarIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  HeartIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();

  const normalizedRoles = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean)
    : [];

  const hasGuideRole = normalizedRoles.includes('GUIDE');
  const isAdmin = normalizedRoles.includes('ADMIN');
  const { data: guideStatus } = useQuery(
    ['dashboard-guide-status', user?.id],
    () => userAPI.getGuideStatus().then((r) => r.data),
    { enabled: !!user?.id, retry: 1 }
  );
  const isGuide =
    hasGuideRole &&
    guideStatus?.hasGuide === true &&
    guideStatus?.aadharVerified === true &&
    guideStatus?.isVerified === true &&
    guideStatus?.isApproved === true;
  const canApplyAsGuide = !isAdmin && !isGuide;
  const hasGuideApplication = guideStatus?.hasGuide === true;
  const userStorageSuffix = user?.id || user?.email || 'anonymous';
  const unlockedStorageKey = `eowg_unlocked_experience_keys_${userStorageSuffix}`;
  const receiptsStorageKey = `eowg_receipts_by_key_${userStorageSuffix}`;

  // Explore Without a Guide catalog + local unlocks (scoped per account).
  const [quickCatalog, setQuickCatalog] = useState([]);
  const [cityToursCatalog, setCityToursCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [unlockedKeys, setUnlockedKeys] = useState(new Set());
  const [receiptsByKey, setReceiptsByKey] = useState({});
  const [activeDoc, setActiveDoc] = useState(null);
  const [mockPaymentModal, setMockPaymentModal] = useState(null);
  const [dynamicStats, setDynamicStats] = useState(null);

  const formatInr = (value) => {
    const n = Number(value) || 0;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  useEffect(() => {
    try {
      const rawUnlocked = localStorage.getItem(unlockedStorageKey);
      const parsedUnlocked = rawUnlocked ? JSON.parse(rawUnlocked) : [];
      setUnlockedKeys(new Set(Array.isArray(parsedUnlocked) ? parsedUnlocked : []));
    } catch {
      setUnlockedKeys(new Set());
    }

    try {
      const rawReceipts = localStorage.getItem(receiptsStorageKey);
      const parsedReceipts = rawReceipts ? JSON.parse(rawReceipts) : {};
      setReceiptsByKey(parsedReceipts && typeof parsedReceipts === 'object' ? parsedReceipts : {});
    } catch {
      setReceiptsByKey({});
    }
  }, [unlockedStorageKey, receiptsStorageKey]);

  useEffect(() => {
    if (isGuide || isAdmin) return;

    const loadCatalog = async () => {
      setCatalogLoading(true);
      try {
        const [quickRes, cityRes] = await Promise.all([
          experiencesAPI.getWithoutGuideQuick(),
          experiencesAPI.getWithoutGuideCityTours(),
        ]);
        setQuickCatalog(quickRes.data || []);
        setCityToursCatalog(cityRes.data || []);
      } catch (e) {
        toast.error(e?.response?.data || 'Failed to load explore catalog');
      } finally {
        setCatalogLoading(false);
      }
    };

    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuide, isAdmin]);

  useEffect(() => {
    try {
      localStorage.setItem(unlockedStorageKey, JSON.stringify(Array.from(unlockedKeys)));
    } catch {
      // ignore storage failures
    }
  }, [unlockedKeys]);

  useEffect(() => {
    try {
      localStorage.setItem(receiptsStorageKey, JSON.stringify(receiptsByKey));
    } catch {
      // ignore storage failures
    }
  }, [receiptsByKey]);

  const downloadReceiptPdf = (exp, receiptMeta) => {
    const doc = new jsPDF();
    const amount = exp?.price || 0;
    doc.setFontSize(16);
    doc.text('TrailBuddy Experience Receipt', 14, 18);
    doc.setFontSize(12);
    doc.text(`Receipt Id: ${receiptMeta?.receiptId || 'N/A'}`, 14, 32);
    doc.text(`Date: ${new Date(receiptMeta?.paidAt || Date.now()).toLocaleString()}`, 14, 40);
    doc.text(`Experience: ${exp?.title || 'N/A'}`, 14, 48);
    doc.text(`Type: ${exp?.type || 'N/A'}`, 14, 56);
    doc.text(`Amount Paid: INR ${amount}`, 14, 64);
    doc.text(`Payment Ref: ${receiptMeta?.paymentRef || 'TEST_PAYMENT'}`, 14, 72);
    doc.text('Mode: Test Payment (Dummy)', 14, 80);
    doc.save(`receipt-${exp?.experienceKey || 'experience'}.pdf`);
  };

  const ensureRazorpayLoaded = async () => {
    if (window.Razorpay) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
      document.body.appendChild(script);
    });
  };

  const [unlockingKey, setUnlockingKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const toCount = (data) => {
      if (!data) return 0;
      if (typeof data.totalElements === 'number') return data.totalElements;
      if (Array.isArray(data)) return data.length;
      if (Array.isArray(data.content)) return data.content.length;
      return 0;
    };

    const loadStats = async () => {
      try {
        if (isAdmin && !isGuide) {
          const [dashboardRes, convRes] = await Promise.all([
            adminAPI.getDashboard(),
            chatAPI.getConversations(),
          ]);
          if (cancelled) return;
          setDynamicStats({
            totalBookings: Number(dashboardRes?.data?.totalBookings || 0),
            reviews: 0,
            messages: toCount(convRes?.data),
            totalSpent: Number(dashboardRes?.data?.revenue || 0),
            activeUsers: Number(dashboardRes?.data?.activeUsers || 0),
            activeGuides: Number(dashboardRes?.data?.activeGuides || 0),
          });
          return;
        }

        if (isGuide) {
          const [guideBookingsRes, revenueRes, convRes] = await Promise.all([
            bookingsAPI.getGuideBookings(),
            guidesAPI.getRevenueModel(),
            chatAPI.getConversations(),
          ]);
          if (cancelled) return;
          setDynamicStats({
            totalBookings: toCount(guideBookingsRes?.data),
            averageRating: Number(revenueRes?.data?.averageRating || 0),
            totalEarnings: Number(revenueRes?.data?.totalEarnings || 0),
            messages: toCount(convRes?.data),
          });
          return;
        }

        const [userBookingsRes, reviewsRes, convRes, paymentsRes] = await Promise.all([
          bookingsAPI.getUserBookings(),
          reviewsAPI.getUserReviews(),
          chatAPI.getConversations(),
          paymentsAPI.getHistory(),
        ]);
        if (cancelled) return;
        const paymentRows = Array.isArray(paymentsRes?.data) ? paymentsRes.data : [];
        const totalSpent = paymentRows.reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
        setDynamicStats({
          totalBookings: toCount(userBookingsRes?.data),
          reviews: toCount(reviewsRes?.data),
          messages: toCount(convRes?.data),
          totalSpent,
        });
      } catch {
        // keep dashboard usable if one stat endpoint fails
      }
    };

    if (user?.id) {
      loadStats();
    }

    return () => {
      cancelled = true;
    };
  }, [user?.id, isAdmin, isGuide]);

  const onConfirmMockPayment = async () => {
    if (!mockPaymentModal?.purchaseId || !mockPaymentModal?.exp) return;
    const exp = mockPaymentModal.exp;
    try {
      const mockPayRes = await experiencePurchaseAPI.mockConfirm({
        purchaseId: mockPaymentModal.purchaseId,
      });
      const purchase = mockPayRes?.data || {};
      const next = new Set(unlockedKeys);
      next.add(exp.experienceKey);
      setUnlockedKeys(next);
      const receiptMeta = {
        receiptId: `TRB-${purchase?.id || Date.now()}`,
        paidAt: new Date().toISOString(),
        paymentRef: purchase?.paymentRef || `pay_test_${Date.now()}`,
      };
      setReceiptsByKey((prev) => ({ ...prev, [exp.experienceKey]: receiptMeta }));
      downloadReceiptPdf(exp, receiptMeta);
      toast.success('Payment successful. Experience unlocked.');
    } catch (e) {
      toast.error(e?.response?.data || 'Mock payment failed');
    } finally {
      setMockPaymentModal(null);
      setUnlockingKey(null);
    }
  };

  const unlockExperience = async (exp) => {
    if (!exp) return;
    if (unlockedKeys.has(exp.experienceKey)) return;

    setUnlockingKey(exp.experienceKey);
    try {
      // Free experiences: unlock immediately.
      if (exp.isFree || (exp.price || 0) <= 0) {
        const next = new Set(unlockedKeys);
        next.add(exp.experienceKey);
        setUnlockedKeys(next);
        toast.success('Unlocked!');
        return;
      }

      const orderRes = await experiencePurchaseAPI.createOrder({
        experienceId: exp.id,
        bookingId: null,
      });
      if (orderRes?.data?.requiresMockConfirmation) {
        setMockPaymentModal({
          exp,
          purchaseId: orderRes?.data?.purchaseId,
          amount: exp.price || 0,
        });
        return;
      }
      if (orderRes?.data?.status === 'COMPLETED') {
        const next = new Set(unlockedKeys);
        next.add(exp.experienceKey);
        setUnlockedKeys(next);
        const receiptMeta = {
          receiptId: `TRB-${orderRes?.data?.purchaseId || Date.now()}`,
          paidAt: new Date().toISOString(),
          paymentRef: `pay_auto_${Date.now()}`,
        };
        setReceiptsByKey((prev) => ({ ...prev, [exp.experienceKey]: receiptMeta }));
        downloadReceiptPdf(exp, receiptMeta);
        toast.success('Unlocked! Enjoy your experience.');
        return;
      }

      const { orderId, amount, currency, keyId } = orderRes.data || {};
      if (!orderId || !amount || !currency || !keyId) {
        throw new Error('Invalid order response from server');
      }

      await ensureRazorpayLoaded();

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'TrailBuddy',
        description: exp.title,
        order_id: orderId,
        prefill: {
          name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        handler: async function (response) {
          try {
            await experiencePurchaseAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            const next = new Set(unlockedKeys);
            next.add(exp.experienceKey);
            setUnlockedKeys(next);
            const receiptMeta = {
              receiptId: `TRB-${Date.now()}`,
              paidAt: new Date().toISOString(),
              paymentRef: response.razorpay_payment_id || `pay_${Date.now()}`,
            };
            setReceiptsByKey((prev) => ({ ...prev, [exp.experienceKey]: receiptMeta }));
            downloadReceiptPdf(exp, receiptMeta);
            toast.success('Unlocked! Enjoy your experience.');
          } catch (e) {
            toast.error(e?.response?.data || 'Payment verification failed');
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      toast.error(e?.response?.data || e?.message || 'Unlock failed');
    } finally {
      setUnlockingKey(null);
    }
  };

  const userStats = [
    { name: 'Total Bookings', value: String(dynamicStats?.totalBookings ?? 0), icon: CalendarIcon, color: 'bg-blue-500' },
    { name: 'Reviews Given', value: String(dynamicStats?.reviews ?? 0), icon: StarIcon, color: 'bg-yellow-500' },
    { name: 'Messages', value: String(dynamicStats?.messages ?? 0), icon: ChatBubbleLeftRightIcon, color: 'bg-green-500' },
    { name: 'Total Spent', value: formatInr(dynamicStats?.totalSpent ?? 0), icon: CurrencyDollarIcon, color: 'bg-purple-500' },
  ];

  const guideStats = isAdmin && !isGuide
    ? [
      { name: 'Total Bookings', value: String(dynamicStats?.totalBookings ?? 0), icon: CalendarIcon, color: 'bg-blue-500' },
      { name: 'Active Users', value: String(dynamicStats?.activeUsers ?? 0), icon: UserGroupIcon, color: 'bg-yellow-500' },
      { name: 'Active Guides', value: String(dynamicStats?.activeGuides ?? 0), icon: StarIcon, color: 'bg-green-500' },
      { name: 'Platform Revenue', value: formatInr(dynamicStats?.totalSpent ?? 0), icon: CurrencyDollarIcon, color: 'bg-purple-500' },
    ]
    : [
      { name: 'Total Bookings', value: String(dynamicStats?.totalBookings ?? 0), icon: CalendarIcon, color: 'bg-blue-500' },
      { name: 'Average Rating', value: (Number(dynamicStats?.averageRating ?? 0)).toFixed(1), icon: StarIcon, color: 'bg-yellow-500' },
      { name: 'Total Earnings', value: formatInr(dynamicStats?.totalEarnings ?? 0), icon: CurrencyDollarIcon, color: 'bg-green-500' },
      { name: 'Messages', value: String(dynamicStats?.messages ?? 0), icon: ChatBubbleLeftRightIcon, color: 'bg-purple-500' },
    ];

  const quickActions = isGuide ? [
    { name: 'Proposal Inbox', href: '/marketplace', icon: SparklesIcon, description: 'Respond to traveler preferences' },
    { name: 'Update Availability', href: '/profile', icon: CalendarIcon, description: 'Manage your calendar' },
    { name: 'View Bookings', href: '/bookings', icon: MapPinIcon, description: 'Check upcoming bookings' },
    { name: 'Share Story', href: '/stories/create', icon: DocumentTextIcon, description: 'Share local insights' },
    { name: 'Update Profile', href: '/profile', icon: UserGroupIcon, description: 'Edit your information' },
  ] : [
    { name: 'Custom Trip Request', href: '/marketplace', icon: SparklesIcon, description: 'Get curated offers from guides' },
    { name: 'Find Guides', href: '/guides', icon: UserGroupIcon, description: 'Discover local experts' },
    { name: 'AI Trip Planner', href: '/ai-planner', icon: SparklesIcon, description: 'Plan your perfect trip' },
    { name: 'My Bookings', href: '/bookings', icon: CalendarIcon, description: 'View your trips' },
    { name: 'Browse Stories', href: '/stories', icon: DocumentTextIcon, description: 'Read local experiences' },
    {
      name: hasGuideApplication ? 'Guide Application' : 'Become a Guide',
      href: '/become-guide',
      icon: ShieldCheckIcon,
      description: hasGuideApplication
        ? 'Complete your verification and track approval status'
        : 'Register to offer your tours and get approved',
    },
  ];

  const recentBookings = [
    {
      id: 1,
      guideName: 'Rajesh Kumar',
      destination: 'Jaipur, Rajasthan',
      date: '2024-03-25',
      status: 'Confirmed',
      amount: '₹3,500',
    },
    {
      id: 2,
      guideName: 'Priya Sharma',
      destination: 'Kerala Backwaters',
      date: '2024-04-10',
      status: 'Pending',
      amount: '₹5,200',
    },
    {
      id: 3,
      guideName: 'Amit Verma',
      destination: 'Varanasi, UP',
      date: '2024-03-15',
      status: 'Completed',
      amount: '₹2,800',
    },
  ];

  const upcomingTrips = [
    {
      destination: 'Golden Triangle Tour',
      date: 'May 25-28, 2026',
      guide: 'Rajesh Kumar',
      status: 'Confirmed',
      image: 'https://dynamic-media.tacdn.com/media/photo-o/2e/ec/ae/76/caption.jpg?w=1400&h=1000&s=1',
    },
    {
      destination: 'Kerala Backwaters',
      date: 'April 13-15, 2026',
      guide: 'Priya Sharma',
      status: 'Pending',
      image: 'https://www.tripsavvy.com/thmb/UoylMLyzOBPdDp34ForEiJd9m3s=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-522478216-5ab12c4e3de4230036949cee.jpg',
    },
  ];

  const stats = (isGuide || isAdmin) ? guideStats : userStats;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-primary-400 to-cyan-300 bg-clip-text text-transparent">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          {isGuide
            ? "Here's what's happening with your guide business today."
            : hasGuideApplication
              ? 'Your guide application is in progress. Finish verification and track approval here.'
              : "Ready for your next adventure? Here's what's new."
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="card-dark rounded-2xl p-5 border border-white/6">
            <div className="flex items-center gap-4">
              <div className={`flex-shrink-0 p-3 rounded-xl ${stat.color} bg-opacity-80`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 truncate">{stat.name}</p>
                <p className="text-xl font-bold text-white mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-5">
          <div className="glass rounded-2xl border border-white/6 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/6">
              <h2 className="text-base font-semibold text-white">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/3 hover:bg-cyan-500/5 hover:border-cyan-500/20 transition-all duration-200"
                >
                  <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                    <action.icon className="h-4 w-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">{action.name}</p>
                    <p className="text-xs text-slate-500 truncate">{action.description}</p>
                  </div>
                  <ArrowRightIcon className="flex-shrink-0 h-4 w-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Safety Features */}
          <div className="glass rounded-2xl border border-white/6 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/6">
              <h2 className="text-base font-semibold text-white">Safety Features</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-sm text-slate-300">Verified Guides</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <HeartIcon className="h-4 w-4 text-pink-400" />
                </div>
                <span className="text-sm text-slate-300">Women Safety Mode</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <ClockIcon className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="text-sm text-slate-300">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings/Upcoming Trips */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass rounded-2xl border border-white/6 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">
                  {isGuide ? 'Recent Bookings' : 'Upcoming Trips'}
                </h2>
                <Link
                  to="/bookings"
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View all
                </Link>
              </div>
            </div>

            {!isGuide ? (
              <div className="p-4 space-y-3">
                {upcomingTrips.map((trip, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-xl border border-white/6 bg-white/3 hover:bg-white/5 transition-colors">
                    <img
                      src={trip.image}
                      alt={trip.destination}
                      className="h-14 w-14 rounded-xl object-cover flex-shrink-0 border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{trip.destination}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{trip.date}</p>
                      <p className="text-xs text-slate-500">Guide: {trip.guide}</p>
                    </div>
                    <span className={`flex-shrink-0 inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${trip.status === 'Confirmed'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                      }`}>
                      {trip.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-white/6">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Destination</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4">
                    {recentBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-slate-200">{booking.guideName}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-400">{booking.destination}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-400">{booking.date}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-semibold text-cyan-400">{booking.amount}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${booking.status === 'Confirmed'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            : booking.status === 'Pending'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                              : 'bg-slate-500/15 text-slate-400 border border-slate-500/25'
                            }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Explore Without a Guide */}
          {!isGuide && !isAdmin && (
            <div className="glass rounded-2xl border border-white/6 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/6">
                <h2 className="text-base font-semibold text-white">🎒 Explore Without a Guide</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Unlock quick experiences (₹29) and full city tours (₹149).
                </p>
              </div>

              <div className="p-5">
                {catalogLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-cyan-400" />
                    Loading catalog…
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Quick Experiences */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-200">Quick Experiences</h3>
                        <span className="text-xs text-cyan-400 font-semibold">₹29</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {quickCatalog.map((exp) => {
                          const unlocked = unlockedKeys.has(exp.experienceKey);
                          return (
                            <div key={exp.id} className="rounded-xl border border-white/8 bg-white/3 p-4">
                              <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{exp.type}</div>
                              <div className="font-semibold text-slate-100 mt-1 text-sm">{exp.title}</div>
                              <div className="mt-1.5 text-xs text-slate-400 line-clamp-2">{exp.description || ''}</div>
                              <div className="mt-3 space-y-2">
                                {unlocked ? (
                                  <>
                                    <button onClick={() => setActiveDoc(exp)} className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-white bg-emerald-600/90 hover:bg-emerald-600 transition-colors">
                                      View Document
                                    </button>
                                    <button onClick={() => downloadReceiptPdf(exp, receiptsByKey[exp.experienceKey])} className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 bg-white/8 hover:bg-white/12 border border-white/10 transition-colors">
                                      Download Receipt
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => unlockExperience(exp)}
                                    disabled={unlockingKey === exp.experienceKey}
                                    className={`w-full rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors ${unlockingKey === exp.experienceKey
                                      ? 'bg-slate-600 cursor-not-allowed'
                                      : 'bg-primary-600/90 hover:bg-primary-600'
                                      }`}
                                  >
                                    {unlockingKey === exp.experienceKey ? 'Unlocking…' : `Unlock for ₹${exp.price}`}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* City Tours */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-200">City Tours</h3>
                        <span className="text-xs text-cyan-400 font-semibold">₹149</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {cityToursCatalog.map((exp) => {
                          const unlocked = unlockedKeys.has(exp.experienceKey);
                          return (
                            <div key={exp.id} className="rounded-xl border border-white/8 bg-white/3 p-4">
                              <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{exp.type}</div>
                              <div className="font-semibold text-slate-100 mt-1 text-sm">{exp.title}</div>
                              <div className="mt-1.5 text-xs text-slate-400 line-clamp-2">{exp.description || ''}</div>
                              <div className="mt-3 space-y-2">
                                {unlocked ? (
                                  <>
                                    <button onClick={() => setActiveDoc(exp)} className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-white bg-emerald-600/90 hover:bg-emerald-600 transition-colors">
                                      View Document
                                    </button>
                                    <button onClick={() => downloadReceiptPdf(exp, receiptsByKey[exp.experienceKey])} className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 bg-white/8 hover:bg-white/12 border border-white/10 transition-colors">
                                      Download Receipt
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => unlockExperience(exp)}
                                    disabled={unlockingKey === exp.experienceKey}
                                    className={`w-full rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors ${unlockingKey === exp.experienceKey
                                      ? 'bg-slate-600 cursor-not-allowed'
                                      : 'bg-primary-600/90 hover:bg-primary-600'
                                      }`}
                                  >
                                    {unlockingKey === exp.experienceKey ? 'Unlocking…' : `Unlock for ₹${exp.price}`}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Unlocked Content */}
                    {Array.from(unlockedKeys).length > 0 && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="text-sm font-semibold text-emerald-400">✓ Unlocked</div>
                        <div className="mt-1.5 text-xs text-slate-400">Your unlocked experiences are ready to explore.</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[...quickCatalog, ...cityToursCatalog]
                            .filter((exp) => unlockedKeys.has(exp.experienceKey))
                            .slice(0, 6)
                            .map((exp) => (
                              <button
                                key={exp.id}
                                onClick={() => setActiveDoc(exp)}
                                className="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 px-3 py-1 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
                              >
                                {exp.title}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {canApplyAsGuide && hasGuideApplication && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-base font-semibold text-white">Guide Application In Review</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Your profile is saved. Finish Aadhaar verification or wait for admin approval to unlock guide tools.
                  </p>
                </div>
                <Link
                  to="/become-guide"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15 text-xs font-semibold transition-colors"
                >
                  Open Application
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/8 to-primary-600/8 p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-base font-semibold text-white">✨ AI Trip Recommendations</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Get personalized travel suggestions based on your preferences
                </p>
              </div>
              <Link
                to="/ai-planner"
                className="inline-flex items-center gap-2 btn-cyan text-xs font-semibold px-4 py-2 rounded-xl flex-shrink-0"
              >
                Try Now
                <SparklesIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {activeDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass rounded-2xl border border-white/10 shadow-card-dark">
            <div className="flex items-center justify-between p-5 border-b border-white/8">
              <div>
                <div className="text-base font-semibold text-white">{activeDoc.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{activeDoc.type}</div>
              </div>
              <button
                onClick={() => setActiveDoc(null)}
                className="px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-slate-300 hover:text-white text-sm transition-colors border border-white/10"
              >
                Close
              </button>
            </div>
            <div className="p-5 max-h-[65vh] overflow-y-auto">
              <div className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
                {activeDoc.content || activeDoc.description || 'Document content is not available for this experience yet.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {mockPaymentModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass rounded-2xl border border-white/10 shadow-card-dark">
            <div className="p-5 border-b border-white/8">
              <div className="text-base font-semibold text-white">Dummy Payment Gateway</div>
              <div className="text-xs text-slate-400 mt-1">Complete test payment to unlock this experience.</div>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-xs text-slate-500 mb-1">Experience</div>
                <div className="font-semibold text-white text-sm">{mockPaymentModal.exp?.title}</div>
                <div className="text-xs text-slate-400 mt-1">Amount: INR {mockPaymentModal.amount}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500">Card Number (dummy)</label>
                <input value="4111 1111 1111 1111" readOnly className="input-dark mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Expiry</label>
                  <input value="12/30" readOnly className="input-dark mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">CVV</label>
                  <input value="123" readOnly className="input-dark mt-1" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-white/8 flex justify-end gap-3">
              <button
                onClick={() => {
                  setMockPaymentModal(null);
                  setUnlockingKey(null);
                  toast('Payment cancelled');
                }}
                className="px-4 py-2 rounded-xl bg-white/8 hover:bg-white/12 text-slate-300 text-sm border border-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmMockPayment}
                className="btn-cyan px-4 py-2 rounded-xl text-sm font-semibold"
              >
                Pay INR {mockPaymentModal.amount}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
