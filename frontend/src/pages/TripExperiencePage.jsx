import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { tripSessionsAPI, experiencePurchaseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapPinIcon, ArrowLeftIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';

function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

async function ensureRazorpayLoaded() {
  if (window.Razorpay) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
    document.body.appendChild(script);
  });
}

export default function TripExperiencePage() {
  const { bookingId } = useParams();
  const bookingIdNum = useMemo(() => Number(bookingId), [bookingId]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [cards, setCards] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlockingKey, setUnlockingKey] = useState(null);
  const [endingTrip, setEndingTrip] = useState(false);
  const [mockPaymentModal, setMockPaymentModal] = useState(null);

  const SOS_CONFIRMATION = 'Help is on the way. Stay where you are.';
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);
  const sharingIntervalRef = useRef(null);

  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startedAt = trip?.tripStartedAt ? new Date(trip.tripStartedAt) : null;
  const tripDurationMinutes = trip?.tripDurationMinutes || 0;
  const elapsedSeconds = startedAt ? (nowTick - startedAt.getTime()) / 1000 : 0;
  const totalSeconds = tripDurationMinutes ? tripDurationMinutes * 60 : 0;

  const statusText = useMemo(() => {
    const s = (trip?.tripStatus || '').toUpperCase();
    if (s === 'TRIP_COMPLETED') return 'Trip Completed';
    if (s === 'TRIP_ONGOING' || s === 'TRIP_STARTED') return 'Exploring with your guide';
    return 'Trip';
  }, [trip?.tripStatus]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tripRes, cardsRes, timelineRes] = await Promise.all([
        tripSessionsAPI.getByBooking(bookingIdNum),
        tripSessionsAPI.getExperienceUnlockCards(bookingIdNum),
        tripSessionsAPI.getTimeline(bookingIdNum),
      ]);
      setTrip(tripRes.data);
      setCards(cardsRes.data || []);
      setTimeline(timelineRes.data || []);
    } catch (e) {
      toast.error(e?.response?.data || 'Failed to load trip experience data');
    } finally {
      setLoading(false);
    }
  }, [bookingIdNum]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const interval = setInterval(() => { fetchAll(); }, 4000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const onEndTrip = async () => {
    setEndingTrip(true);
    try {
      await tripSessionsAPI.endTrip(bookingIdNum);
      toast.success('Trip ended. Thank you!');
      await fetchAll();
    } catch (e) {
      toast.error(e?.response?.data || 'Failed to end trip');
    } finally {
      setEndingTrip(false);
    }
  };

  const sendLiveLocationOnce = useCallback(async (enabledValue) => {
    if (!navigator.geolocation) { toast.error('Geolocation is not supported on this device.'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try { await tripSessionsAPI.updateLocation(bookingIdNum, { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracyMeters: pos.coords.accuracy, liveLocationEnabled: enabledValue }); } catch { /* ignore */ }
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
      await sendLiveLocationOnce(true);
      if (sharingIntervalRef.current) clearInterval(sharingIntervalRef.current);
      sharingIntervalRef.current = setInterval(() => { sendLiveLocationOnce(true); }, 20000);
      toast.success('Live location sharing enabled.');
    } else {
      setLocationSharingEnabled(false);
      if (sharingIntervalRef.current) clearInterval(sharingIntervalRef.current);
      sharingIntervalRef.current = null;
      await sendLiveLocationOnce(false);
      toast('Live location sharing disabled.');
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

  const onUnlock = async (card) => {
    if (!card?.experienceId) { toast.error('Experience id missing'); return; }
    setUnlockingKey(card.experienceKey);
    try {
      const orderRes = await experiencePurchaseAPI.createOrder({ experienceId: card.experienceId, bookingId: bookingIdNum });
      if (orderRes?.data?.requiresMockConfirmation) {
        setMockPaymentModal({ card, purchaseId: orderRes?.data?.purchaseId, amount: card.price || 0 });
        return;
      }
      if (orderRes?.data?.status === 'COMPLETED') { toast.success('Unlocked! Enjoy the experience.'); await fetchAll(); return; }

      const { orderId, amount, currency, keyId } = orderRes.data || {};
      if (!orderId || !amount || !currency || !keyId) throw new Error('Invalid order response from server');

      await ensureRazorpayLoaded();
      const options = {
        key: keyId, amount, currency, name: 'TrailBuddy', description: card.title, order_id: orderId,
        prefill: { name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || '', email: user?.email || '', contact: user?.phone || '' },
        handler: async function (response) {
          try {
            await experiencePurchaseAPI.verify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature });
            toast.success('Unlocked! Enjoy the experience.');
            await fetchAll();
          } catch (e) { toast.error(e?.response?.data || 'Payment verification failed'); }
        },
        modal: { ondismiss: () => {} },
      };
      // eslint-disable-next-line no-undef
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      toast.error(e?.response?.data || e?.message || 'Unlock failed');
    } finally {
      setUnlockingKey(null);
    }
  };

  const onConfirmMockPayment = async () => {
    if (!mockPaymentModal?.purchaseId) return;
    try {
      await experiencePurchaseAPI.mockConfirm({ purchaseId: mockPaymentModal.purchaseId });
      toast.success('Payment successful. Experience unlocked.');
      await fetchAll();
    } catch (e) {
      toast.error(e?.response?.data || 'Mock payment failed');
    } finally {
      setMockPaymentModal(null);
      setUnlockingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="glass rounded-2xl border border-white/6 p-6 flex items-center gap-2 text-slate-500 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-cyan-400" />
          Loading trip…
        </div>
      </div>
    );
  }

  const guide = trip?.guide;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Trip Experience</h1>
          <div className="mt-1 text-slate-400 text-sm">
            {guide?.fullName || 'Guide'} • {statusText}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-slate-500">Elapsed</div>
          <div className="text-3xl font-bold text-white font-mono">{formatMMSS(elapsedSeconds)}</div>
          {totalSeconds > 0 && <div className="text-xs text-slate-500">/ {formatMMSS(totalSeconds)}</div>}
        </div>
      </div>

      {/* Location Sharing */}
      <div className="flex items-center justify-between glass rounded-xl border border-white/6 px-4 py-3 mb-5">
        <div>
          <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <MapPinIcon className="h-4 w-4 text-cyan-400" />
            Share live location
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Used for SOS and safety while enabled.</div>
        </div>
        <label className="inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only" checked={locationSharingEnabled} onChange={(e) => onToggleLocationSharing(e.target.checked)} />
          <span className={`w-11 h-6 rounded-full transition-colors ${locationSharingEnabled ? 'bg-emerald-500' : 'bg-white/12'}`}>
            <span className={`block h-5 w-5 m-0.5 rounded-full bg-white shadow transition-transform ${locationSharingEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </span>
        </label>
      </div>

      {/* Experience Unlocks */}
      <div className="glass rounded-2xl border border-white/6 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Experience Unlocks</h2>
          <div className="text-xs text-slate-500">Scroll to explore →</div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {cards.length === 0 && <div className="text-sm text-slate-500">No experience cards for this trip.</div>}
          {cards.map((card) => (
            <div
              key={card.experienceKey}
              className={`min-w-[240px] flex-shrink-0 rounded-xl border p-4 flex flex-col ${
                card.unlocked
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-white/3 border-white/8'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">{card.type}</div>
                  <div className="text-sm font-semibold text-white leading-snug">{card.title}</div>
                </div>
                <div className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border whitespace-nowrap flex-shrink-0 ${
                  card.unlocked
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}>
                  {card.unlocked ? '✓ Unlocked' : `₹${card.price}`}
                </div>
              </div>

              <div className="text-xs text-slate-400 mb-4 flex-1">
                {card.unlocked ? 'Included with your trip.' : 'Locked. Unlock this experience during your trip.'}
              </div>

              <button
                onClick={() => onUnlock(card)}
                disabled={card.unlocked || unlockingKey === card.experienceKey}
                className={`w-full rounded-lg px-3 py-2 font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                  card.unlocked
                    ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                    : unlockingKey === card.experienceKey
                      ? 'bg-white/8 text-slate-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {card.unlocked ? (
                  <><LockOpenIcon className="h-3.5 w-3.5" /> Unlocked</>
                ) : unlockingKey === card.experienceKey ? (
                  <><div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white" /> Unlocking…</>
                ) : (
                  <><LockClosedIcon className="h-3.5 w-3.5" /> {card.ctaLabel || 'Unlock'}</>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="glass rounded-2xl border border-white/6 p-5 mb-5">
        <h2 className="text-base font-semibold text-white mb-4">Journey Timeline</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {timeline.length === 0 ? (
            <div className="text-sm text-slate-500">No events yet.</div>
          ) : (
            timeline.map((e, idx) => (
              <div key={`${e.type}-${idx}`} className="rounded-xl bg-white/3 border border-white/6 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-300">{e.type}</div>
                  {e.timestamp && (
                    <div className="text-xs text-slate-500">
                      {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                {e.message && <div className="mt-1 text-xs text-slate-400">{e.message}</div>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* End Trip + Back */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(`/trip/start/${bookingIdNum}`)} className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5">
          <ArrowLeftIcon className="h-4 w-4" /> Back to Trip Start
        </button>
        <button
          onClick={onEndTrip}
          disabled={endingTrip || (trip?.tripStatus || '').toUpperCase() === 'TRIP_COMPLETED'}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            endingTrip || (trip?.tripStatus || '').toUpperCase() === 'TRIP_COMPLETED'
              ? 'bg-white/8 text-slate-500 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {endingTrip ? 'Ending…' : 'End Trip'}
        </button>
      </div>

      {/* SOS */}
      <button
        onClick={onSos}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-red-600 text-white shadow-2xl hover:bg-red-700 flex items-center justify-center z-50 font-bold text-sm ring-4 ring-red-600/30"
        aria-label="SOS" title="Emergency SOS"
      >
        SOS
      </button>

      {/* Mock Payment Modal */}
      {mockPaymentModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass rounded-2xl border border-white/10 shadow-card-dark">
            <div className="p-5 border-b border-white/8">
              <div className="text-base font-bold text-white">Dummy Payment Gateway</div>
              <div className="text-xs text-slate-400 mt-1">Complete test payment to unlock this trip add-on.</div>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-white/4 border border-white/8 p-4">
                <div className="text-xs text-slate-500 mb-1">Experience</div>
                <div className="font-semibold text-white">{mockPaymentModal.card?.title}</div>
                <div className="text-sm text-cyan-400 mt-1 font-bold">₹{mockPaymentModal.amount}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500">Card Number (dummy)</label>
                <input value="4111 1111 1111 1111" readOnly className="input-dark mt-1.5 opacity-60 cursor-not-allowed text-sm font-mono" />
              </div>
            </div>
            <div className="p-4 border-t border-white/8 flex justify-end gap-3">
              <button
                onClick={() => { setMockPaymentModal(null); setUnlockingKey(null); toast('Payment cancelled'); }}
                className="px-4 py-2 rounded-xl bg-white/8 hover:bg-white/12 text-slate-300 text-sm border border-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmMockPayment}
                className="btn-cyan px-5 py-2 rounded-xl text-sm font-semibold"
              >
                Pay ₹{mockPaymentModal.amount}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
