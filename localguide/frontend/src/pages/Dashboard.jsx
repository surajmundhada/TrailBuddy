import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
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

  const isGuide = normalizedRoles.includes('GUIDE');
  const isAdmin = normalizedRoles.includes('ADMIN');

  const userStats = [
    { name: 'Total Bookings', value: '12', icon: CalendarIcon, color: 'bg-blue-500' },
    { name: 'Reviews Given', value: '8', icon: StarIcon, color: 'bg-yellow-500' },
    { name: 'Messages', value: '24', icon: ChatBubbleLeftRightIcon, color: 'bg-green-500' },
    { name: 'Total Spent', value: '₹24,500', icon: CurrencyDollarIcon, color: 'bg-purple-500' },
  ];

  const guideStats = [
    { name: 'Total Bookings', value: '45', icon: CalendarIcon, color: 'bg-blue-500' },
    { name: 'Average Rating', value: '4.8', icon: StarIcon, color: 'bg-yellow-500' },
    { name: 'Total Earnings', value: '₹1,25,000', icon: CurrencyDollarIcon, color: 'bg-green-500' },
    { name: 'Response Rate', value: '98%', icon: ChatBubbleLeftRightIcon, color: 'bg-purple-500' },
  ];

  const quickActions = isGuide ? [
    { name: 'Update Availability', href: '/profile', icon: CalendarIcon, description: 'Manage your calendar' },
    { name: 'View Bookings', href: '/bookings', icon: MapPinIcon, description: 'Check upcoming bookings' },
    { name: 'Share Story', href: '/stories/create', icon: DocumentTextIcon, description: 'Share local insights' },
    { name: 'Update Profile', href: '/profile', icon: UserGroupIcon, description: 'Edit your information' },
  ] : [
    { name: 'Find Guides', href: '/guides', icon: UserGroupIcon, description: 'Discover local experts' },
    { name: 'AI Trip Planner', href: '/ai-planner', icon: SparklesIcon, description: 'Plan your perfect trip' },
    { name: 'My Bookings', href: '/bookings', icon: CalendarIcon, description: 'View your trips' },
    { name: 'Browse Stories', href: '/stories', icon: DocumentTextIcon, description: 'Read local experiences' },
    { name: 'Become a Guide', href: '/become-guide', icon: ShieldCheckIcon, description: 'Register to offer your tours and get approved' },
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
      date: 'March 25-28, 2024',
      guide: 'Rajesh Kumar',
      status: 'Confirmed',
      image: 'https://images.unsplash.com/photo-1524492442967-8c3b5c9c1d0f?w=400',
    },
    {
      destination: 'Kerala Backwaters',
      date: 'April 10-15, 2024',
      guide: 'Priya Sharma',
      status: 'Pending',
      image: 'https://images.unsplash.com/photo-1552728089-a8b7485f3b5b?w=400',
    },
  ];

  const stats = isGuide ? guideStats : userStats;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          {isGuide 
            ? "Here's what's happening with your guide business today."
            : "Ready for your next adventure? Here's what's new."
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stat.value}</dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    to={action.href}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <action.icon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{action.name}</p>
                        <p className="text-sm text-gray-500">{action.description}</p>
                      </div>
                      <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Safety Features */}
          <div className="bg-white rounded-lg shadow mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Safety Features</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-700">Verified Guides</span>
                </div>
                <div className="flex items-center">
                  <HeartIcon className="h-5 w-5 text-pink-500 mr-3" />
                  <span className="text-sm text-gray-700">Women Safety Mode</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-blue-500 mr-3" />
                  <span className="text-sm text-gray-700">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings/Upcoming Trips */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  {isGuide ? 'Recent Bookings' : 'Upcoming Trips'}
                </h2>
                <Link
                  to="/bookings"
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  View all
                </Link>
              </div>
            </div>
            
            {!isGuide ? (
              <div className="p-6">
                <div className="space-y-4">
                  {upcomingTrips.map((trip, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <img
                        src={trip.image}
                        alt={trip.destination}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{trip.destination}</h3>
                        <p className="text-sm text-gray-500">{trip.date}</p>
                        <p className="text-sm text-gray-500">Guide: {trip.guide}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trip.status === 'Confirmed' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {trip.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destination
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{booking.guideName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.destination}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.date}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.amount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            booking.status === 'Confirmed' 
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
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

          {/* AI Recommendations */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow mt-6 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">AI Trip Recommendations</h3>
                <p className="mt-1 text-primary-100">
                  Get personalized travel suggestions based on your preferences
                </p>
              </div>
              <Link
                to="/ai-planner"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-primary-50"
              >
                Try Now
                <SparklesIcon className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
