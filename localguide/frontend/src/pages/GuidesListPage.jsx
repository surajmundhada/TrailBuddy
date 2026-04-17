import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { guidesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  MapPinIcon,
  StarIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const GuidesListPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  // `GuideServiceImpl` treats this as a daily price range (dailyRate or hourlyRate * 8).
  // Seeded/demo guides use dailyRate ~ 8000, so default must be wide enough.
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [womenOnly, setWomenOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating');

  const safeInt = (rawValue, fallback) => {
    // Prevent `NaN` leaking into request params (backend currently binds `minPrice/maxPrice` as Integer).
    if (rawValue === '' || rawValue === null || rawValue === undefined) return fallback;
    const num = parseInt(rawValue, 10);
    return Number.isNaN(num) ? fallback : num;
  };

  const cities = [
    'Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Chennai', 'Jaipur', 
    'Udaipur', 'Varanasi', 'Goa', 'Kerala', 'Rajasthan', 'Agra'
  ];

  const languages = [
    'Hindi', 'English', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 
    'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu'
  ];

  const languagesKey = useMemo(
    () => selectedLanguages.slice().sort().join(','),
    [selectedLanguages]
  );

  const { data: guides, isLoading, error } = useQuery(
    ['guides', {
      city: selectedCity || '',
      search: searchTerm || '',
      sortBy,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      languages: languagesKey,
      womenOnly,
      verifiedOnly,
    }],
    () => guidesAPI.getAll({
      city: selectedCity || undefined,
      search: searchTerm || undefined,
      sortBy: sortBy,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      languages: selectedLanguages.length ? selectedLanguages.join(',') : undefined,
      womenOnly,
      verifiedOnly
    }),
    {
      enabled: true,
      select: (response) => response.data,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true, // reflect admin approvals while user stays on page
    }
  );

  const displayGuides = guides?.content || [];

  const renderStars = (rating) => {
    const safeRating = Number(rating || 0);
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 !== 0;
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <StarSolidIcon key={i} className="h-4 w-4 text-yellow-400" />
        ))}
        {hasHalfStar && <StarSolidIcon className="h-4 w-4 text-yellow-400 opacity-50" />}
        <span className="ml-1 text-sm text-gray-700 font-medium">{safeRating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find Your Perfect Guide</h1>
        <p className="mt-2 text-gray-600">
          Connect with verified local experts for authentic travel experiences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              <FunnelIcon className="h-5 w-5 text-gray-400" />
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search guides..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* City Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Languages Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {languages.map(language => (
                  <label key={language} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes(language)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLanguages([...selectedLanguages, language]);
                        } else {
                          setSelectedLanguages(selectedLanguages.filter(l => l !== language));
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{language}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range (per day)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange(([min, max]) => [safeInt(e.target.value, min), max])
                  }
                  className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                  placeholder="Min"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange(([min, max]) => [min, safeInt(e.target.value, max)])
                  }
                  className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Special Filters */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={womenOnly}
                  onChange={(e) => setWomenOnly(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Women-friendly guides</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Verified only</span>
              </label>
            </div>

            {/* Sort */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="experience">Most Experience</option>
                <option value="bookings">Most Bookings</option>
              </select>
            </div>
          </div>
        </div>

        {/* Guides Grid */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-600">
          Showing {displayGuides.length} guides
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayGuides.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No guides found. Try clearing filters.
              </div>
            ) : displayGuides.map((guide) => (
              <div key={guide.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      {guide.user.profileImageUrl ? (
                        <img
                          src={guide.user.profileImageUrl}
                          alt={`${guide.user.firstName} ${guide.user.lastName}`}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-bold text-sm">
                            {(guide.user?.firstName?.[0] || 'U') + (guide.user?.lastName?.[0] || '')}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {guide.user.firstName} {guide.user.lastName}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {guide.city}, {guide.state}
                        </div>
                        <div className="flex items-center">
                          {renderStars(guide.averageRating)}
                          <span className="ml-2 text-xs text-gray-500">
                            ({Number(guide.totalReviews || 0)} review{Number(guide.totalReviews || 0) === 1 ? '' : 's'})
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {guide.isVerified && (
                        <div className="flex items-center text-green-600">
                          <ShieldCheckIcon className="h-5 w-5" />
                          <span className="ml-1 text-xs">Verified</span>
                        </div>
                      )}
                      <button className="p-2 rounded-full hover:bg-gray-100">
                        <HeartIcon className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-4 text-gray-600 text-sm line-clamp-2">
                    {guide.bio}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {guide.languages.slice(0, 3).map((language) => (
                      <span
                        key={language}
                        className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                      >
                        {language}
                      </span>
                    ))}
                    {guide.languages.length > 3 && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        +{guide.languages.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        <span>₹{guide.hourlyRate}/hr • ₹{guide.dailyRate}/day</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {guide.experienceYears} years experience • {guide.totalBookings} bookings
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="p-2 rounded-full border border-gray-300 hover:bg-gray-50"
                        onClick={() => {
                          const guideUserId = guide?.user?.id;
                          if (!guideUserId) return;
                          navigate(`/chat/${guideUserId}`);
                        }}
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
                        onClick={() => navigate(`/booking/${guide.id}`)}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading guides...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">Error loading guides. Please try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuidesListPage;
