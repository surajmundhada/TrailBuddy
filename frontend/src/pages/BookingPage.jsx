import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { guidesAPI, bookingsAPI, guidePackagesAPI } from '../services/api';
import { defaultAvatarUrl, resolveMediaUrl } from '../utils/media';

function addDaysIsoDate(startIso, daysToAdd) {
  const d = new Date(`${startIso}T12:00:00`);
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().slice(0, 10);
}

function parseExperienceDayCount(duration) {
  const m = String(duration || '')
    .toLowerCase()
    .match(/(\d+)\s*day/);
  if (!m) return 1;
  return Math.max(1, Math.min(14, parseInt(m[1], 10)));
}

const BookingPage = () => {
  const navigate = useNavigate();
  const { guideId } = useParams();
  const [searchParams] = useSearchParams();
  const packageIdFromQuery = searchParams.get('package');
  const isExperienceBooking = Boolean(packageIdFromQuery);

  const [bookingMode, setBookingMode] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationHours, setDurationHours] = useState(4);
  const [passengerCount, setPassengerCount] = useState(1);
  const [needsVehicle, setNeedsVehicle] = useState(false);
  const [vehicleAc, setVehicleAc] = useState(false);
  const [distanceKm, setDistanceKm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [useCuratedQuotation, setUseCuratedQuotation] = useState(false);
  const [avoidTags, setAvoidTags] = useState('');
  const [wantTags, setWantTags] = useState('');
  const [prefsNotes, setPrefsNotes] = useState('');
  const [selectedPackageIds, setSelectedPackageIds] = useState([]);

  const { data: guideResponse, isLoading: isLoadingGuide, error: guideError } = useQuery(
    ['guide', guideId],
    () => guidesAPI.getById(Number(guideId)),
    { enabled: !!guideId, select: (res) => res.data }
  );

  const {
    data: experiencePackage,
    isLoading: packageLoading,
    error: packageError,
  } = useQuery(
    ['guide-package-listing', packageIdFromQuery],
    () => guidePackagesAPI.getById(Number(packageIdFromQuery)).then((res) => res.data),
    { enabled: isExperienceBooking && !!packageIdFromQuery }
  );

  const experienceDays = useMemo(
    () => parseExperienceDayCount(experiencePackage?.duration),
    [experiencePackage?.duration]
  );

  useEffect(() => {
    if (!isExperienceBooking) return;
    setBookingMode('daily');
    setUseCuratedQuotation(false);
  }, [isExperienceBooking]);

  useEffect(() => {
    if (!isExperienceBooking || !experiencePackage) return;
    const t = new Date();
    const localToday = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    const tomorrow = addDaysIsoDate(localToday, 1);
    setStartDate((prev) => prev || tomorrow);
  }, [isExperienceBooking, experiencePackage]);

  useEffect(() => {
    if (!isExperienceBooking || !experiencePackage || !startDate) return;
    setEndDate(addDaysIsoDate(startDate, experienceDays - 1));
  }, [isExperienceBooking, experiencePackage, startDate, experienceDays]);

  const guide = guideResponse;
  const guideImageUrl = resolveMediaUrl(guide?.profileImageUrl || guide?.user?.profileImageUrl || '');

  const { data: packagesRaw, isLoading: packagesLoading } = useQuery(
    ['guide-packages', guideId, useCuratedQuotation],
    () => guidePackagesAPI.getByGuide(Number(guideId)).then((res) => res.data),
    { enabled: !!guideId && useCuratedQuotation }
  );
  const guidePackages = Array.isArray(packagesRaw) ? packagesRaw : [];

  const togglePackage = (id) => {
    setSelectedPackageIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedPackagesTotal = useMemo(() => {
    return guidePackages
      .filter((p) => selectedPackageIds.includes(p.id))
      .reduce((s, p) => s + (Number(p.price) || 0), 0);
  }, [guidePackages, selectedPackageIds]);

  const hourlyRate = useMemo(() => {
    if (!guide?.hourlyRate) return 0;
    return Number(guide.hourlyRate);
  }, [guide]);

  const dailyRate = useMemo(() => {
    if (!guide) return 0;
    if (guide.dailyRate != null) return Number(guide.dailyRate);
    if (guide.hourlyRate != null) return Number(guide.hourlyRate) * 8;
    return 0;
  }, [guide]);

  const tripDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    if (Number.isNaN(diffMs)) return 0;
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
  }, [startDate, endDate]);

  const guideBaseAmount = useMemo(() => {
    if (bookingMode === 'hourly') {
      const duration = Number(durationHours || 0);
      if (!hourlyRate || duration <= 0) return 0;
      return hourlyRate * duration;
    }

    if (!tripDays || !dailyRate) return 0;
    return tripDays * dailyRate;
  }, [bookingMode, dailyRate, durationHours, hourlyRate, tripDays]);

  const vehicleAmount = useMemo(() => {
    const km = Number(distanceKm || 0);
    const vehicleRate = vehicleAc ? 30 : 25;
    return needsVehicle && km > 0 ? Math.round(km * vehicleRate * 100) / 100 : 0;
  }, [distanceKm, needsVehicle, vehicleAc]);

  const amount = useMemo(() => {
    if (isExperienceBooking && experiencePackage) {
      const base = Number(experiencePackage.price) || 0;
      return Math.round((base + vehicleAmount) * 100) / 100;
    }
    return Math.round((guideBaseAmount + vehicleAmount) * 100) / 100;
  }, [experiencePackage, guideBaseAmount, isExperienceBooking, vehicleAmount]);

  const canSubmit = useMemo(() => {
    if (isSubmitting || !startDate) return false;
    if (bookingMode === 'daily' && !endDate) return false;
    if (bookingMode === 'hourly' && (!startTime || Number(durationHours || 0) <= 0)) return false;
    if (useCuratedQuotation) return true;
    return !!amount;
  }, [amount, bookingMode, durationHours, endDate, isSubmitting, startDate, startTime, useCuratedQuotation]);

  const experienceGuideMismatch =
    isExperienceBooking &&
    experiencePackage &&
    guideId &&
    Number(experiencePackage.guideId) !== Number(guideId);

  const onCreateBooking = async (e) => {
    e.preventDefault();
    setError(null);

    if (bookingMode === 'daily' && (!startDate || !endDate)) {
      setError('Please select start and end dates.');
      return;
    }

    if (bookingMode === 'hourly' && (!startDate || !startTime)) {
      setError('Please select a start date and time.');
      return;
    }

    if (bookingMode === 'hourly' && Number(durationHours || 0) <= 0) {
      setError('Duration must be at least 1 hour.');
      return;
    }

    if (!useCuratedQuotation && !amount) {
      setError('Invalid trip amount.');
      return;
    }

    if (isExperienceBooking && experienceGuideMismatch) {
      setError('This experience belongs to a different guide. Open the link from Hidden Gems again.');
      return;
    }

    if (Number(passengerCount) <= 0) {
      setError('Passenger count must be at least 1.');
      return;
    }

    if (needsVehicle && Number(distanceKm || 0) <= 0) {
      setError('Please enter distance in KM for vehicle booking.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (useCuratedQuotation) {
        const selectedSnapshots = guidePackages
          .filter((p) => selectedPackageIds.includes(p.id))
          .map((p) => ({
            id: p.id,
            title: p.title,
            price: p.price,
            duration: p.duration,
            city: p.city,
          }));
        const travelerPreferences = JSON.stringify({
          avoid: avoidTags.split(',').map((s) => s.trim()).filter(Boolean),
          wants: wantTags.split(',').map((s) => s.trim()).filter(Boolean),
          notes: prefsNotes.trim() || undefined,
          selectedPackages: selectedSnapshots,
        });
        const response = await bookingsAPI.create({
          guideId: Number(guideId),
          startDate,
          endDate: bookingMode === 'hourly' ? startDate : endDate,
          amount: 0,
          passengerCount: Number(passengerCount),
          needsVehicle,
          vehicleAc,
          distanceKm: needsVehicle ? Number(distanceKm) : 0,
          useCuratedQuotation: true,
          travelerPreferences,
        });
        if (!response.data?.id) {
          setError('Invalid server response: booking ID missing');
          return;
        }
        navigate('/bookings');
        return;
      }

      const response = await bookingsAPI.create({
        guideId: Number(guideId),
        startDate,
        endDate: bookingMode === 'hourly' ? startDate : endDate,
        amount,
        passengerCount: Number(passengerCount),
        needsVehicle,
        vehicleAc,
        distanceKm: needsVehicle ? Number(distanceKm) : 0,
        ...(isExperienceBooking && packageIdFromQuery
          ? { guidePackageId: Number(packageIdFromQuery) }
          : {}),
      });

      if (!response.data || typeof response.data !== 'object' || !response.data.id) {
        console.error('[BookingPage] Invalid response - no booking ID:', response.data);
        setError('Invalid server response: booking ID missing');
        return;
      }

      const bookingId = response.data.id;
      console.log('[BookingPage] Booking created successfully', { bookingId, bookingData: response.data });
      console.log('Fetching booking ID for payment:', bookingId);
      navigate(`/payment/${bookingId}`);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.response?.data || 'Failed to create booking';
      console.error('[BookingPage] Error creating booking:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-primary-400 bg-clip-text text-transparent">
          {isExperienceBooking ? 'Book this experience' : 'Book Now'}
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          {isExperienceBooking
            ? 'Fixed-price local tour (like Airbnb Experiences). Choose add-ons, then pay to confirm your trip.'
            : 'Confirm your trip details and secure your guide.'}
        </p>
      </div>

      {(isLoadingGuide || (isExperienceBooking && packageLoading)) && (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-8">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-cyan-400" />
          {isExperienceBooking ? 'Loading experience…' : 'Loading guide...'}
        </div>
      )}

      {guideError && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-4">
          Failed to load guide: {guideError?.message || guideError?.response?.data || 'Unknown error'}
        </div>
      )}

      {isExperienceBooking && packageError && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-4">
          Could not load this experience listing.
        </div>
      )}

      {experienceGuideMismatch && (
        <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 mb-4">
          This experience is hosted by another guide. Use &quot;Book this experience&quot; from Hidden Gems or the guide&apos;s card.
        </div>
      )}

      {!isLoadingGuide && !guide && !guideError && (
        <div className="text-slate-500 text-sm">Guide not found. guideId={guideId}</div>
      )}

      {guide && (!isExperienceBooking || experiencePackage) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl border border-white/6 p-6 flex flex-col gap-5">
            {isExperienceBooking && experiencePackage && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/90">Listed experience</p>
                <h3 className="text-lg font-bold text-white leading-snug">{experiencePackage.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-4">{experiencePackage.description}</p>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                  <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5">{experiencePackage.city}</span>
                  <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5">{experiencePackage.duration}</span>
                  {experiencePackage.maxGuests ? (
                    <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5">
                      Max {experiencePackage.maxGuests} guests
                    </span>
                  ) : null}
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-emerald-300 font-semibold">
                    ₹{experiencePackage.price} total
                  </span>
                </div>
                {experiencePackage.meetingPoint ? (
                  <div className="text-xs text-slate-300">
                    <span className="text-slate-500">Meet: </span>
                    {experiencePackage.meetingPoint}
                  </div>
                ) : null}
                {Array.isArray(experiencePackage.whatsIncluded) && experiencePackage.whatsIncluded.length > 0 ? (
                  <div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1">What&apos;s included</div>
                    <ul className="text-xs text-slate-400 space-y-0.5">
                      {experiencePackage.whatsIncluded.slice(0, 6).map((line) => (
                        <li key={line}>· {line}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="h-16 w-16 rounded-2xl ring-2 ring-cyan-500/30 ring-offset-2 ring-offset-navy-900 overflow-hidden bg-white/5">
                  {guideImageUrl ? (
                    <img
                      src={guideImageUrl}
                      alt={`${guide.user?.firstName || 'Guide'} ${guide.user?.lastName || ''}`}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = defaultAvatarUrl;
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-cyan-400">
                      {(guide.user?.firstName?.[0] || 'G').toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {guide.user?.firstName} {guide.user?.lastName}
                </h2>
                <p className="text-sm text-slate-400 capitalize">{guide.city}, {guide.state}</p>
              </div>
            </div>

            {isExperienceBooking && experiencePackage?.hostIntro ? (
              <p className="text-slate-400 text-sm leading-relaxed border-t border-white/6 pt-4">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">About your host · </span>
                {experiencePackage.hostIntro}
              </p>
            ) : null}
            {!isExperienceBooking && guide.bio && (
              <p className="text-slate-400 text-sm leading-relaxed border-t border-white/6 pt-4">{guide.bio}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/4 border border-white/8 p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">Hourly</div>
                <div className="text-lg font-bold text-cyan-400">Rs {hourlyRate}</div>
              </div>
              <div className="rounded-xl bg-white/4 border border-white/8 p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">Daily</div>
                <div className="text-lg font-bold text-cyan-400">Rs {dailyRate}</div>
              </div>
            </div>

            {guide.expertise && (
              <div className="flex flex-wrap gap-2">
                {String(guide.expertise).split(',').map((tag) => (
                  <span
                    key={tag.trim()}
                    className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl border border-white/6 p-6">
            <form onSubmit={onCreateBooking} className="space-y-5">
              {!isExperienceBooking && (
              <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
                <label className="inline-flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`relative h-5 w-5 rounded flex items-center justify-center border transition-all ${
                      useCuratedQuotation ? 'bg-cyan-500 border-cyan-500' : 'bg-white/5 border-white/20 group-hover:border-white/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={useCuratedQuotation}
                      onChange={(e) => setUseCuratedQuotation(e.target.checked)}
                      className="sr-only"
                    />
                    {useCuratedQuotation && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-200">Request a personalized quote (guide sets price)</span>
                </label>
                <p className="text-xs text-slate-500 pl-8">
                  Pick from this guide&apos;s published packages (optional), add avoid/want tags, then submit. Your guide sends a tailored quote; you accept, pay, then the live trip flow matches Rapido/Uber.
                </p>
                {useCuratedQuotation && (
                  <div className="space-y-3 pt-2 border-t border-white/8">
                    <div>
                      <div className="text-xs font-semibold text-slate-300 mb-2">Available packages from this guide</div>
                      {packagesLoading && (
                        <div className="text-xs text-slate-500 flex items-center gap-2 py-2">
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border border-white/20 border-t-cyan-400" />
                          Loading packages…
                        </div>
                      )}
                      {!packagesLoading && guidePackages.length === 0 && (
                        <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                          This guide hasn&apos;t published packages yet. Your text preferences below still help them build a quote.
                        </p>
                      )}
                      {!packagesLoading && guidePackages.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                          {guidePackages.map((pkg) => {
                            const on = selectedPackageIds.includes(pkg.id);
                            return (
                              <button
                                key={pkg.id}
                                type="button"
                                onClick={() => togglePackage(pkg.id)}
                                className={`text-left rounded-xl border px-3 py-2.5 transition-all ${
                                  on
                                    ? 'border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/20'
                                    : 'border-white/10 bg-white/4 hover:border-white/20'
                                }`}
                              >
                                <div className="text-xs font-semibold text-white line-clamp-2">{pkg.title}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {pkg.duration} · {pkg.city}
                                </div>
                                <div className="text-sm font-bold text-cyan-400 mt-1">₹{pkg.price}</div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {selectedPackagesTotal > 0 && (
                        <p className="text-[11px] text-slate-400 mt-2">
                          Reference sum of selected packages: <span className="text-cyan-300 font-semibold">₹{selectedPackagesTotal}</span>
                          <span className="text-slate-500"> — final price is set by your guide in the quote.</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Avoid (comma-separated)</label>
                      <input
                        className="input-dark text-sm"
                        placeholder="e.g. museums, shopping malls"
                        value={avoidTags}
                        onChange={(e) => setAvoidTags(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Want / focus (comma-separated)</label>
                      <input
                        className="input-dark text-sm"
                        placeholder="e.g. trek, street food, local temples"
                        value={wantTags}
                        onChange={(e) => setWantTags(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Extra notes</label>
                      <textarea
                        className="input-dark text-sm resize-none"
                        rows={2}
                        placeholder="Timing, fitness level, dietary needs…"
                        value={prefsNotes}
                        onChange={(e) => setPrefsNotes(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Booking Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isExperienceBooking}
                    onClick={() => setBookingMode('hourly')}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                      bookingMode === 'hourly'
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]'
                        : 'border-white/8 bg-white/3 text-slate-400 hover:border-white/15 hover:text-slate-200'
                    } ${isExperienceBooking ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    Hourly
                  </button>
                  <button
                    type="button"
                    disabled={isExperienceBooking}
                    onClick={() => setBookingMode('daily')}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                      bookingMode === 'daily'
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]'
                        : 'border-white/8 bg-white/3 text-slate-400 hover:border-white/15 hover:text-slate-200'
                    } ${isExperienceBooking ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    Daily
                  </button>
                </div>
              </div>

              {bookingMode === 'daily' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Start date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="input-dark [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      {isExperienceBooking ? 'End date (set by experience length)' : 'End date'}
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      readOnly={isExperienceBooking}
                      className={`input-dark [color-scheme:dark] ${isExperienceBooking ? 'opacity-70 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Start date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="input-dark [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Start time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input-dark [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Duration (hours)</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value)}
                      className="input-dark"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Passengers</label>
                <input
                  type="number"
                  min={1}
                  max={isExperienceBooking && experiencePackage?.maxGuests ? experiencePackage.maxGuests : undefined}
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(e.target.value)}
                  className="input-dark"
                />
                {isExperienceBooking && experiencePackage?.maxGuests ? (
                  <p className="text-[11px] text-slate-500 mt-1">This host caps this walk at {experiencePackage.maxGuests} guests.</p>
                ) : null}
              </div>

              <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                <label className="inline-flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`relative h-5 w-5 rounded flex items-center justify-center border transition-all ${
                      needsVehicle ? 'bg-cyan-500 border-cyan-500' : 'bg-white/5 border-white/20 group-hover:border-white/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={needsVehicle}
                      onChange={(e) => setNeedsVehicle(e.target.checked)}
                      className="sr-only"
                    />
                    {needsVehicle && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-200">I need a vehicle with guide</span>
                </label>

                {needsVehicle && (
                  <div className="mt-4 space-y-4 pt-4 border-t border-white/8">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Distance (KM)</label>
                      <input
                        type="number"
                        min={1}
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(e.target.value)}
                        className="input-dark"
                        placeholder="Enter distance in km"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Vehicle type</label>
                      <div className="flex gap-3">
                        <label
                          className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm cursor-pointer transition-all ${
                            !vehicleAc
                              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                              : 'bg-white/3 border-white/8 text-slate-400 hover:border-white/15'
                          }`}
                        >
                          <input type="radio" name="vehicleAc" checked={!vehicleAc} onChange={() => setVehicleAc(false)} className="sr-only" />
                          Non-AC <span className="text-xs opacity-70">Rs 25/km</span>
                        </label>
                        <label
                          className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm cursor-pointer transition-all ${
                            vehicleAc
                              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                              : 'bg-white/3 border-white/8 text-slate-400 hover:border-white/15'
                          }`}
                        >
                          <input type="radio" name="vehicleAc" checked={vehicleAc} onChange={() => setVehicleAc(true)} className="sr-only" />
                          With AC <span className="text-xs opacity-70">Rs 30/km</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Booking mode</span>
                  <span className="font-medium text-slate-200 capitalize">{bookingMode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{bookingMode === 'hourly' ? 'Duration' : 'Trip length'}</span>
                  <span className="font-medium text-slate-200">
                    {bookingMode === 'hourly'
                      ? `${Number(durationHours || 0) || 0} hour${Number(durationHours || 0) === 1 ? '' : 's'}`
                      : `${tripDays || 0} day${tripDays === 1 ? '' : 's'}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{isExperienceBooking ? 'Experience price' : 'Guide fee'}</span>
                  <span className="font-medium text-slate-200">
                    Rs{' '}
                    {isExperienceBooking && experiencePackage
                      ? Number(experiencePackage.price) || 0
                      : guideBaseAmount || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Passengers</span>
                  <span className="font-medium text-slate-200">{Number(passengerCount || 0) || 0}</span>
                </div>
                {needsVehicle && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Vehicle add-on</span>
                    <span className="font-medium text-slate-200">Rs {vehicleAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-white/8 pt-2.5 mt-1">
                  <span className="font-semibold text-slate-300">Total Amount</span>
                  <span className="font-bold text-cyan-400 text-base">
                    {useCuratedQuotation ? 'After guide quotes' : `Rs ${amount || 0}`}
                  </span>
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit || experienceGuideMismatch}
                className="w-full btn-cyan font-semibold text-sm py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    Creating booking...
                  </>
                ) : useCuratedQuotation ? (
                  'Submit request'
                ) : isExperienceBooking ? (
                  'Continue to payment'
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
