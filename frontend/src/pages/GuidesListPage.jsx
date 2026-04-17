import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { guidesAPI } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MapPinIcon,
  ShieldCheckIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { defaultAvatarUrl, resolveMediaUrl } from '../utils/media';

const GuidesListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [womenOnly, setWomenOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [videoModal, setVideoModal] = useState(null);
  const [videoLoadError, setVideoLoadError] = useState('');

  const safeInt = (rawValue, fallback) => {
    if (rawValue === '' || rawValue === null || rawValue === undefined) return fallback;
    const num = parseInt(rawValue, 10);
    return Number.isNaN(num) ? fallback : num;
  };

  const cities = [
    'Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Chennai', 'Jaipur',
    'Udaipur', 'Varanasi', 'Goa', 'Kerala', 'Rajasthan', 'Agra',
  ];

  const languages = [
    'Hindi', 'English', 'Bengali', 'Tamil', 'Telugu', 'Marathi',
    'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu',
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
      sortBy,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      languages: selectedLanguages.length ? selectedLanguages.join(',') : undefined,
      womenOnly,
      verifiedOnly,
    }),
    {
      enabled: true,
      select: (response) => response.data,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    }
  );

  const displayGuides = guides?.content || [];
  const selectedChatUserId = location.pathname.startsWith('/chat/')
    ? Number(location.pathname.split('/').filter(Boolean).at(-1))
    : null;

  const renderStars = (rating) => {
    const safeRating = Number(rating || 0);
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 !== 0;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <StarSolidIcon key={i} className="h-3.5 w-3.5 text-amber-400" />
        ))}
        {hasHalfStar && <StarSolidIcon className="h-3.5 w-3.5 text-amber-400 opacity-50" />}
        <span className="ml-1 text-xs text-slate-300 font-medium">{safeRating.toFixed(1)}</span>
      </div>
    );
  };

  const FilterPanel = () => (
    <div className="glass rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-base flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-cyan-400" />
          Filters
        </h2>
        <button
          className="lg:hidden text-slate-500 hover:text-slate-300 transition-colors"
          onClick={() => setFiltersOpen(false)}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Search</label>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search guides..."
            className="input-dark pl-9"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">City</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="input-dark appearance-none"
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Languages</label>
        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
          {languages.map((language) => (
            <label key={language} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedLanguages.includes(language)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedLanguages([...selectedLanguages, language]);
                  } else {
                    setSelectedLanguages(selectedLanguages.filter((l) => l !== language));
                  }
                }}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
              />
              <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{language}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Price Range (per day)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange(([, max]) => [safeInt(e.target.value, 0), max])}
            className="input-dark w-24 text-center"
            placeholder="Min"
          />
          <div className="h-px flex-1 bg-white/10" />
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange(([min]) => [min, safeInt(e.target.value, 100000)])}
            className="input-dark w-24 text-center"
            placeholder="Max"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={womenOnly}
            onChange={(e) => setWomenOnly(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
          />
          <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">Women-friendly guides</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
          />
          <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">Verified only</span>
        </label>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sort by</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input-dark appearance-none"
        >
          <option value="rating">Highest Rated</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="experience">Most Experience</option>
          <option value="bookings">Most Bookings</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-900">
      <div className="border-b border-white/5 bg-navy-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-1">Find your perfect guide</h1>
          <p className="text-slate-400 text-sm">
            Connect with verified local experts for authentic travel experiences
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 text-sm font-medium text-cyan-400 border border-cyan-500/30 bg-cyan-500/5 px-4 py-2 rounded-xl hover:bg-cyan-500/10 transition-all"
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
          </button>
        </div>

        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/70" onClick={() => setFiltersOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-80 bg-navy-800 overflow-y-auto p-4">
              <FilterPanel />
            </div>
          </div>
        )}

        <div className="flex gap-8">
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-8">
              <FilterPanel />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-400 text-sm">
                Showing <span className="text-white font-semibold">{displayGuides.length}</span> guides
              </p>
            </div>

            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden bg-navy-800 border border-white/5 p-5">
                    <div className="skeleton h-[200px] rounded-2xl w-full mb-4" />
                    <div className="space-y-2">
                      <div className="skeleton h-4 rounded w-32" />
                      <div className="skeleton h-3 rounded w-24" />
                      <div className="skeleton h-3 rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && !isLoading && (
              <div className="text-center py-16">
                <p className="text-red-400 text-sm">Error loading guides. Please try again.</p>
              </div>
            )}

            {!isLoading && !error && displayGuides.length === 0 && (
              <div className="text-center py-20">
                <div className="h-16 w-16 rounded-2xl bg-navy-700 border border-white/5 flex items-center justify-center mx-auto mb-4">
                  <MagnifyingGlassIcon className="h-8 w-8 text-slate-600" />
                </div>
                <p className="text-slate-400 text-sm">No guides found. Try clearing some filters.</p>
              </div>
            )}

            {!isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {displayGuides.map((guide) => {
                  const profileImageUrl = resolveMediaUrl(guide.profileImageUrl || guide.user?.profileImageUrl || '');
                  const guideUserId = guide?.user?.id;
                  const hasVideo = Boolean(guide.introVideoUrl);
                  const fullVideoUrl = resolveMediaUrl(guide.introVideoUrl || '');
                  const isChatSelected = selectedChatUserId != null && selectedChatUserId === guideUserId;

                  console.log('IMAGE URL:', profileImageUrl);
                  console.log('VIDEO URL:', fullVideoUrl);

                  return (
                    <div
                      key={guide.id}
                      className={`card-dark group rounded-2xl overflow-hidden border transition-all ${
                        isChatSelected ? 'border-cyan-500/40 shadow-[0_0_0_1px_rgba(34,211,238,0.14)]' : 'border-white/6 hover:border-white/12'
                      }`}
                    >
                      <div className="relative">
                        {profileImageUrl ? (
                          <img
                            src={profileImageUrl}
                            alt={`${guide.user.firstName} ${guide.user.lastName}`}
                            className="w-full h-[200px] object-cover object-center rounded-none"
                            onError={(event) => {
                              event.currentTarget.src = defaultAvatarUrl;
                            }}
                          />
                        ) : (
                          <div className="h-[200px] w-full bg-gradient-to-br from-cyan-500/20 to-primary-600/20 flex items-center justify-center">
                            <span className="text-cyan-200 font-bold text-5xl">
                              {(guide.user?.firstName?.[0] || 'U') + (guide.user?.lastName?.[0] || '')}
                            </span>
                          </div>
                        )}
                        {hasVideo && (
                          <button
                            type="button"
                            onClick={() => {
                              setVideoLoadError('');
                              setVideoModal({ name: `${guide.user.firstName} ${guide.user.lastName}`, url: fullVideoUrl });
                            }}
                            className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 py-2 text-sm text-white backdrop-blur-sm hover:bg-black/70 transition-all"
                          >
                            <PlayCircleIcon className="h-5 w-5 text-cyan-300" />
                            Play intro
                          </button>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4 gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-white text-lg leading-tight truncate">
                                {guide.user.firstName} {guide.user.lastName}
                              </h3>
                              {guide.isVerified && (
                                <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
                                  <ShieldCheckIcon className="h-3 w-3" />
                                  <span className="text-xs font-medium">Verified</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-slate-400 text-xs mb-2">
                              <MapPinIcon className="h-3 w-3" />
                              {guide.city}, {guide.state}
                            </div>
                            {renderStars(guide.averageRating)}
                          </div>

                          <button className="p-1.5 rounded-full text-slate-600 hover:text-pink-400 hover:bg-pink-400/10 transition-all">
                            <HeartIcon className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed mb-4 min-h-[60px]">
                          {guide.bio}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {guide.languages.slice(0, 3).map((language) => (
                            <span
                              key={language}
                              className="inline-flex px-2 py-0.5 text-xs font-medium bg-white/5 border border-white/8 text-slate-300 rounded-full"
                            >
                              {language}
                            </span>
                          ))}
                          {guide.languages.length > 3 && (
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-white/5 border border-white/8 text-slate-400 rounded-full">
                              +{guide.languages.length - 3}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-3">
                          <div>
                            <div className="text-cyan-400 font-semibold text-sm">
                              Rs {guide.hourlyRate}/hr • Rs {guide.dailyRate}/day
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {guide.experienceYears}y exp • {guide.totalBookings} bookings
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className={`p-2 rounded-xl border transition-all ${
                                isChatSelected
                                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:text-cyan-300'
                              }`}
                              onClick={() => {
                                if (!guideUserId) return;
                                navigate(`/chat/${guideUserId}`);
                              }}
                            >
                              <ChatBubbleLeftRightIcon className="h-4 w-4" />
                            </button>
                            <button
                              className="btn-cyan text-xs font-semibold px-4 py-2 rounded-xl"
                              onClick={() => navigate(`/booking/${guide.id}`)}
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {videoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setVideoModal(null)} />
          <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-navy-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div>
                <h3 className="text-lg font-semibold text-white">{videoModal.name}</h3>
                <p className="text-xs text-slate-400">Guide intro video</p>
              </div>
              <button
                type="button"
                onClick={() => setVideoModal(null)}
                className="h-10 w-10 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-black">
              <video
                controls
                autoPlay
                className="w-full rounded-xl max-h-[70vh] bg-black"
                onError={() => setVideoLoadError('Video failed to load. Please re-upload.')}
              >
                <source src={videoModal.url} type="video/mp4" />
                Your browser does not support video.
              </video>
              {videoLoadError && <p className="px-5 py-3 text-sm text-red-400">{videoLoadError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidesListPage;
