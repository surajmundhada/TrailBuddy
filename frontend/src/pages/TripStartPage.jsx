import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { tripSessionsAPI } from '../services/api';
import { ShieldExclamationIcon, MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { defaultAvatarUrl, resolveMediaUrl } from '../utils/media';
import TripFlowStepper from '../components/TripFlowStepper';

const SOS_CONFIRMATION = 'Help is on the way. Stay where you are.';

function tierBadge(tier) {
  const t = (tier || '').toUpperCase();
  if (t === 'ELITE') return 'bg-amber-500/15 text-amber-300 border-amber-500/25';
  if (t === 'PRO') return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25';
  return 'bg-slate-500/15 text-slate-400 border-slate-500/25';
}

function tripStatusLabel(tripStatus) {
  const s = (tripStatus || '').toUpperCase();
  switch (s) {
    case 'AWAITING_GUIDE': return 'Guide not dispatched yet';
    case 'GUIDE_EN_ROUTE': return 'Guide on the way';
    case 'AWAITING_OTP': return 'Awaiting OTP';
    case 'READY_TO_START': return 'Ready to start';
    case 'TRIP_STARTED': return 'Trip Started';
    case 'TRIP_ONGOING': return 'Trip Ongoing';
    case 'TRIP_COMPLETED': return 'Trip Completed';
    default: return 'Trip';
  }
}

export default function TripStartPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startTripLoading, setStartTripLoading] = useState(false);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);
  const sharingIntervalRef = useRef(null);
  const autoRedirectedRef = useRef(false);

  const bookingIdNum = useMemo(() => Number(bookingId), [bookingId]);

  const fetchTrip = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tripSessionsAPI.getByBooking(bookingIdNum);
      setTrip(res.data);
    } catch (e) {
      toast.error(e?.response?.data || 'Failed to load trip session');
    } finally {
      setLoading(false);
    }
  }, [bookingIdNum]);

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrip((prev) => {
        const status = prev?.tripStatus || '';
        if (status.toUpperCase() === 'TRIP_COMPLETED') return prev;
        fetchTrip();
        return prev;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchTrip]);

  const onStartTrip = async () => {
    setStartTripLoading(true);
    try {
      await tripSessionsAPI.startTrip(bookingIdNum);
      toast.success('Trip is live.');
      await fetchTrip();
    } catch (e) {
      toast.error(e?.response?.data || 'Failed to start trip');
    } finally {
      setStartTripLoading(false);
    }
  };

  const onSos = async () => {
    if (!navigator.geolocation) { toast.error('Geolocation is not supported on this device.'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await tripSessionsAPI.sos(bookingIdNum, { latitude: pos.coords.latitude, longitude: pos.coords.longitude, notes: '' });
          toast.success(SOS_CONFIRMATION);
        } catch (e) { toast.error(e?.response?.data || 'SOS failed. Try again.'); }
      },
      (err) => { toast.error(err?.message || 'Unable to fetch location for SOS'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const sendLiveLocationOnce = useCallback(async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try { await tripSessionsAPI.updateLocation(bookingIdNum, { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracyMeters: pos.coords.accuracy, liveLocationEnabled: true }); } catch { /* ignore */ }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [bookingIdNum]);

  useEffect(() => {
    return () => { if (sharingIntervalRef.current) { clearInterval(sharingIntervalRef.current); sharingIntervalRef.current = null; } };
  }, []);

  const onToggleLocationSharing = async (nextEnabled) => {
    if (nextEnabled) {
      setLocationSharingEnabled(true);
      await sendLiveLocationOnce();
      if (sharingIntervalRef.current) clearInterval(sharingIntervalRef.current);
      sharingIntervalRef.current = setInterval(sendLiveLocationOnce, 20000);
      toast.success('Live location sharing enabled.');
    } else {
      setLocationSharingEnabled(false);
      if (sharingIntervalRef.current) clearInterval(sharingIntervalRef.current);
      sharingIntervalRef.current = null;
      toast('Live location sharing disabled.');
    }
  };

  const guide = trip?.guide;
  const otp = trip?.otp;
  const canStartTrip = !!trip?.canStartTrip;
  const tripStatus = trip?.tripStatus;
  const normalizedStatus = String(tripStatus || '').toUpperCase();
  const pickupOtpPhase = ['AWAITING_GUIDE', 'GUIDE_EN_ROUTE', 'AWAITING_OTP'].includes(normalizedStatus);
  const showOtp = pickupOtpPhase;
  const tripIsLive = normalizedStatus === 'TRIP_ONGOING' || normalizedStatus === 'TRIP_STARTED';

  useEffect(() => {
    autoRedirectedRef.current = false;
  }, [bookingId]);

  useEffect(() => {
    if (!tripIsLive || autoRedirectedRef.current) {
      return undefined;
    }

    autoRedirectedRef.current = true;
    toast.success('OTP verified. Trip is live now.');
    const timeoutId = window.setTimeout(() => {
      navigate(`/trip/experience/${bookingId}`, { replace: true });
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [bookingId, navigate, tripIsLive]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Trip</h1>
          <p className="mt-1 text-slate-400 text-sm">Booking ID: <span className="font-mono text-slate-300">#{bookingId}</span></p>
        </div>
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-white/5 border-white/10 text-slate-300 whitespace-nowrap">
          {tripStatusLabel(tripStatus)}
        </span>
      </div>

      {!loading && trip && (
        <TripFlowStepper tripStatus={tripStatus} className="mb-6" />
      )}

      {!loading && (
        <details className="mb-6 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-xs text-slate-400 open:bg-white/[0.04]">
          <summary className="cursor-pointer list-none font-medium text-cyan-400/90 select-none">
            How OTP works (Rapido/Uber style)
          </summary>
          <ol className="mt-3 space-y-2 pl-0 list-decimal list-inside text-slate-400 leading-relaxed">
            <li>
              <strong className="text-slate-300">Pay first</strong> — booking must be <strong className="text-slate-300">CONFIRMED</strong> (mock or real payment on the payment page).
            </li>
            <li>
              <strong className="text-slate-300">Guide</strong> opens <strong className="text-slate-300">Pickup Flow</strong> (Bookings → Pickup Flow): <em>Start journey</em> → <em>Mark arrived</em>.
            </li>
            <li>
              Right after <strong className="text-slate-300">confirmation</strong>, your <strong className="text-slate-300">6-digit pickup OTP</strong> appears here and stays the same until your guide refreshes it (only if it expired). Share it when you meet.
            </li>
            <li>
              <strong className="text-slate-300">Guide</strong> uses <strong className="text-slate-300">Pickup Flow</strong> to head out and mark arrived, then enters that OTP under <strong className="text-slate-300">Verify OTP</strong>. The trip goes <strong className="text-slate-300">live</strong> as soon as the code matches — then continue in Experience / end trip when done.
            </li>
          </ol>
        </details>
      )}

      {loading ? (
        <div className="glass rounded-2xl border border-white/6 p-6 flex items-center gap-2 text-slate-500 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-cyan-400" />
          Loading trip session…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Guide Card */}
          <div className="lg:col-span-1 glass rounded-2xl border border-white/6 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-2xl ring-2 ring-cyan-500/20 overflow-hidden bg-white/5 flex-shrink-0">
                {guide?.profileImageUrl ? (
                  <img
                    src={resolveMediaUrl(guide.profileImageUrl)}
                    alt={guide.fullName || 'Guide'}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = defaultAvatarUrl;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold text-cyan-400">
                    {(guide?.fullName?.[0] || 'G').toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{guide?.fullName || 'Guide'}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {guide?.averageRating ? `${guide.averageRating}★ (${guide.totalReviews || 0} reviews)` : 'Rating soon'}
                </div>
              </div>
            </div>

            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tierBadge(guide?.guideTier)}`}>
              {guide?.guideTier || 'BEGINNER'}
            </span>

            <div className="mt-4 pt-4 border-t border-white/6">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <PhoneIcon className="h-3.5 w-3.5" /> Contact
              </div>
              {guide?.canContact ? (
                <a href={`tel:${(guide?.phoneMasked || '').replace(/\*/g, '')}`} className="text-sm text-cyan-400 underline underline-offset-2">
                  {guide?.phoneMasked || 'Contact available'}
                </a>
              ) : (
                <div>
                  <span className="text-sm text-slate-500">{guide?.phoneMasked || '••••••••'}</span>
                  <div className="text-xs text-slate-600 mt-1">Contact unlocks after the trip starts.</div>
                </div>
              )}
            </div>
          </div>

          {/* OTP + Start */}
          <div className="lg:col-span-2 glass rounded-2xl border border-white/6 p-5">
            <h2 className="text-base font-semibold text-white mb-1">Trip Handoff</h2>
            <p className="text-xs text-slate-400 mb-5">Pickup OTP is issued when your booking is confirmed. The trip goes live when your guide verifies it after pickup (no extra tap from you).</p>

            {/* OTP Display */}
            {showOtp ? (
              <div className="rounded-xl bg-white/4 border border-white/8 px-5 py-4 mb-5 inline-block min-w-[200px]">
                <div className="text-xs font-medium text-slate-500 mb-2">Your OTP</div>
                <div className="text-4xl font-bold tracking-[0.3em] bg-gradient-to-r from-cyan-400 to-primary-400 bg-clip-text text-transparent">
                  {otp || '—'}
                </div>
                {typeof trip?.otpRemainingSeconds === 'number' && (
                  <div className="text-xs text-slate-500 mt-2">Expires in {trip.otpRemainingSeconds}s</div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mb-5">
                {tripIsLive
                  ? 'OTP was used to start this trip. If you need a new code, ask support — normally one OTP per pickup.'
                  : 'Confirm payment to see your pickup OTP here, or open this page again after you pay.'}
              </p>
            )}

            {/* Legacy only: old bookings may still show "Start trip" after OTP */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
              {canStartTrip ? (
                <button
                  type="button"
                  onClick={onStartTrip}
                  disabled={startTripLoading}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shrink-0 ${
                    !startTripLoading
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-white/8 border border-white/12 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {startTripLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                      Starting…
                    </span>
                  ) : (
                    'Start trip (legacy booking)'
                  )}
                </button>
              ) : null}
              <div className="text-xs text-slate-500">
                {tripIsLive ? (
                  <span className="text-emerald-400">✓ Trip is live — same as Rapido/Uber after OTP.</span>
                ) : canStartTrip ? (
                  <span className="text-emerald-400">✓ Finish this older step once; new trips go live on guide OTP only.</span>
                ) : normalizedStatus === 'GUIDE_EN_ROUTE' ? (
                  <span>Guide is on the way to your pickup point.</span>
                ) : normalizedStatus === 'AWAITING_GUIDE' ? (
                  <span>Guide will dispatch soon.</span>
                ) : pickupOtpPhase ? (
                  <span>Keep this OTP handy; your guide will enter it in Verify OTP after they mark arrived.</span>
                ) : (
                  <span>Waiting for pickup…</span>
                )}
              </div>
            </div>

            {/* Location Sharing Toggle */}
            <div className="flex items-center justify-between rounded-xl bg-white/3 border border-white/8 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                  <MapPinIcon className="h-4 w-4 text-cyan-400" />
                  Share live location
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Helps SOS and trip safety while enabled.</div>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only" checked={locationSharingEnabled} onChange={(e) => onToggleLocationSharing(e.target.checked)} />
                <span className={`w-11 h-6 rounded-full transition-colors ${locationSharingEnabled ? 'bg-emerald-500' : 'bg-white/12'}`}>
                  <span className={`block h-5 w-5 m-0.5 rounded-full bg-white shadow transition-transform ${locationSharingEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </span>
              </label>
            </div>

            {/* Trip in progress notice */}
            {tripIsLive && (
              <div className="mt-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-4">
                <div className="text-sm text-emerald-300 font-semibold mb-3">Trip is now in progress. Continue in the experience screen.</div>
                <button
                  onClick={() => navigate(`/trip/experience/${bookingId}`)}
                  className="px-4 py-2 rounded-xl font-semibold text-sm bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                >
                  Open Experience →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SOS */}
      <button
        onClick={onSos}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-red-600 text-white shadow-2xl hover:bg-red-700 flex items-center justify-center z-50 font-bold text-sm ring-4 ring-red-600/30"
        aria-label="SOS" title="Emergency SOS"
      >
        SOS
      </button>
    </div>
  );
}
