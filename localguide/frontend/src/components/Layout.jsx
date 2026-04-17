import React, { useState } from 'react';
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
  CreditCardIcon,
  SparklesIcon,
  ChartBarIcon
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

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Guides', href: '/guides', icon: UserIcon },
    { name: 'Revenue model', href: '/revenue-model', icon: ChartBarIcon },
    { name: 'AI Planner', href: '/ai-planner', icon: SparklesIcon },
    { name: 'Stories', href: '/stories', icon: DocumentTextIcon },
    { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Bookings', href: '/bookings', icon: MapPinIcon },
    { name: 'Profile', href: '/profile', icon: Cog6ToothIcon },
  ];

  // Show guide-registration entry based on actual guide approval status:
  // - Admin should never see /become-guide (backend doesn't allow admins to submit).
  // - If not a GUIDE role, show form.
  // - If GUIDE role, show form only when the guide isn't fully approved yet.
  const { data: guideStatus } = useQuery(
    ['my-guide-status', user?.id],
    () => userAPI.getGuideStatus().then((r) => r.data),
    { enabled: !!user?.id && isGuide, retry: 1 }
  );

  const isFullyApprovedGuide =
    guideStatus?.hasGuide === true &&
    guideStatus?.aadharVerified === true &&
    guideStatus?.isVerified === true &&
    guideStatus?.isApproved === true;

  const dynamicNavigation = !isAdmin && (!isGuide || !isFullyApprovedGuide)
    ? [{ name: 'Become a Guide', href: '/become-guide', icon: ShieldCheckIcon }, ...navigation]
    : navigation;

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin', icon: ShieldCheckIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (href) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 transition-opacity ${sidebarOpen ? 'opacity-75' : 'opacity-0'}`} 
             onClick={() => setSidebarOpen(false)} />
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          
          {/* Sidebar content */}
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-2xl font-bold text-primary-600">TrailBuddy</h1>
            </div>
            <nav className="mt-8 px-2 space-y-1">
              {dynamicNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
              
              {normalizedRoles.includes('ADMIN') && adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-2xl font-bold text-primary-600">TrailBuddy</h1>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {dynamicNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            ))}
            
            {normalizedRoles.includes('ADMIN') && adminNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 lg:hidden">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 flex justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex-1 flex">
              <h1 className="text-lg font-semibold text-gray-900 self-center">TrailBuddy</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500">
                <BellIcon className="h-6 w-6" />
              </button>
              <button
                onClick={handleLogout}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default Layout;
