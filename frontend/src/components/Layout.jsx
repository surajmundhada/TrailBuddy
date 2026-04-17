import React, { useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from 'react-query';
import {
  HomeIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  MapPinIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ChartBarIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { BellIcon } from '@heroicons/react/24/solid';
import { userAPI } from '../services/api';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const normalizedRoles = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean)
    : [];
  const isGuide = normalizedRoles.includes('GUIDE');
  const isAdmin = normalizedRoles.includes('ADMIN');
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Traveller nav — Revenue Model is NOT included
  const travellerNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Guides', href: '/guides', icon: UserIcon },
    { name: 'Hidden Gems', href: '/packages', icon: Squares2X2Icon },
    { name: 'AI Planner', href: '/ai-planner', icon: SparklesIcon },
    { name: 'Stories', href: '/stories', icon: DocumentTextIcon },
    { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Bookings', href: '/bookings', icon: MapPinIcon },
    { name: 'Profile', href: '/profile', icon: Cog6ToothIcon },
  ];

  // Guide nav — includes Earnings & Levels right after Guides
  const guideNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Guides', href: '/guides', icon: UserIcon },
    { name: 'Hidden Gems', href: '/packages', icon: Squares2X2Icon },
    { name: 'Earnings & Levels', href: '/revenue-model', icon: ChartBarIcon },
    { name: 'AI Planner', href: '/ai-planner', icon: SparklesIcon },
    { name: 'Stories', href: '/stories', icon: DocumentTextIcon },
    { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Bookings', href: '/bookings', icon: MapPinIcon },
    { name: 'Profile', href: '/profile', icon: Cog6ToothIcon },
  ];

  const { data: guideStatus } = useQuery(
    ['my-guide-status', user?.id],
    () => userAPI.getGuideStatus().then((r) => r.data),
    { enabled: !!user?.id, retry: 1 }
  );

  const hasGuideProfile = guideStatus?.hasGuide === true;
  const isFullyApprovedGuide =
    guideStatus?.hasGuide === true &&
    guideStatus?.aadharVerified === true &&
    guideStatus?.isVerified === true &&
    guideStatus?.isApproved === true;

  const canAccessGuideFeatures = isGuide && isFullyApprovedGuide;

  const dynamicNavigation = useMemo(() => {
    if (isAdmin) return travellerNavigation;
    if (canAccessGuideFeatures) return guideNavigation;

    const becomeGuideItem = {
      name: hasGuideProfile ? 'Guide Application' : 'Become a Guide',
      href: '/become-guide',
      icon: ShieldCheckIcon,
    };

    return [becomeGuideItem, ...travellerNavigation];
  }, [isAdmin, canAccessGuideFeatures, hasGuideProfile]);

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin', icon: ShieldCheckIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (href) => {
    if (href === '/chat') {
      return location.pathname === '/chat' || location.pathname.startsWith('/chat/');
    }
    if (href === '/packages') {
      return location.pathname === '/packages';
    }
    return location.pathname === href;
  };

  const NavItem = ({ item, onClick }) => (
    <Link
      key={item.name}
      to={item.href}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive(item.href)
          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
      }`}
    >
      <item.icon
        className={`flex-shrink-0 h-5 w-5 transition-colors ${
          isActive(item.href) ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
        }`}
      />
      {item.name}
    </Link>
  );

  const SidebarContent = ({ onClose }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/5">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-primary-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xs">TB</span>
        </div>
        <span className="text-white font-semibold text-base tracking-tight">Trail Buddy</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {dynamicNavigation.map((item) => (
          <NavItem key={item.name} item={item} onClick={onClose} />
        ))}
        {normalizedRoles.includes('ADMIN') &&
          adminNavigation.map((item) => (
            <NavItem key={item.name} item={item} onClick={onClose} />
          ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {user?.firstName?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-800 border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          onClick={() => setSidebarOpen(false)}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 bg-navy-800 border-r border-white/5">
        <SidebarContent onClose={undefined} />
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-4 bg-navy-800/90 backdrop-blur-md border-b border-white/5 px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-400 to-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">TB</span>
            </div>
            <span className="text-white font-semibold text-sm">Trail Buddy</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              <BellIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default Layout;
