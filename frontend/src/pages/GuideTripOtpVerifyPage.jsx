import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { tripSessionsAPI } from '../services/api';
import TripFlowStepper from '../components/TripFlowStepper';

function tripStatusLabel(tripStatus) {
  const s = (tripStatus || '').toUpperCase();
  switch (s) {
    case 'AWAITING_GUIDE': return 'Waiting To Head Out';
    case 'GUIDE_EN_ROUTE': return 'Guide En Route';
    case 'AWAITING_OTP': return 'Awaiting OTP';
    case 'READY_TO_START': return 'OTP Verified';
    case 'TRIP_STARTED': return 'Trip Started';
    case 'TRIP_ONGOING': return 'Trip Ongoing';
    case 'TRIP_COMPLETED': return 'Trip Completed';
    default: return 'Trip';
  }
}

export default function GuideTripOtpVerifyPage() {
  const { bookingId } = useParams();
  const bookingIdNum = useMemo(() => Number(bookingId), [bookingId]);

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [startingJourney, setStartingJourney] = useState(false);
  const [markingArrived, setMarkingArrived] = useState(false);
  const [endingTrip, setEndingTrip] = useState(false);

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

  const onVerifyOtp = async () => {
    const trimmed = String(otpInput).trim();
    if (!trimmed || trimmed.length < 4) { toast.error('Enter the OTP from the traveler.'); return; }
    setVerifying(true);
    try {
      await tripSessionsAPI.verifyGuideOtp(bookingIdNum, trimmed);
      toast.success('OTP verified — trip is live.');
      await fetchTrip();
    } catch (e) {
      toast.error(e?.response?.data || 'OTP verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const onStartJourney = async () => {
    setStartingJourney(true);
    try {
      await tripSessionsAPI.guideStartJourney(bookingIdNum);
      toast.success('Pickup journey started.');
      await fetchTrip();
    } catch (e) {
      toast.error(e?.response?.data || 'Failed to start journey.');
    } finally {
      setStartingJourney(false);
    }
  };

  const onMarkArrived = async () => {
    setMarkingArrived(true);
    try {
      await tripSessionsAPI.guideArrived(bookingIdNum);
      toast.success('Marked as arrived. Ask the traveler for their pickup OTP (on their trip screen).');
      await fetchTrip();
    } catch (e) {
      toast.error(e?.response?.data || 'Failed to mark arrival.');
    } finally {
      setMarkingArrived(false);
    }
  };

  const onEndTrip = async () => {
    setEndingTrip(true);
    try {
      await tripSessionsAPI.endTrip(bookingIdNum);
      toast.success('Trip marked completed.');
      await fetchTrip();
    } catch (e) {
      toast.error(e?.response?.data || 'Failed to end trip.');
    } finally {
      setEndingTrip(false);
    }
  };

  const tripStatus = trip?.tripStatus;
  const normalizedStatus = String(tripStatus || '').toUpperCase();
  const isAwaitingOtp = normalizedStatus === 'AWAITING_OTP';
  const canStartJourney = !!trip?.canGuideStartJourney;
  const canMarkArrived = !!trip?.canGuideMarkArrived;
  const tripIsLive = normalizedStatus === 'TRIP_STARTED' || normalizedStatus === 'TRIP_ONGOING';
  const canEndTrip = ['TRIP_STARTED', 'TRIP_ONGOING', 'READY_TO_START'].includes(normalizedStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Guide Trip Verification</h1>
          <p className="mt-1 text-slate-400 text-sm">Booking ID: <span className="font-mono text-slate-300">#{bookingId}</span></p>
        </div>
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-white/5 border-white/10 text-slate-300 whitespace-nowrap">
          {tripStatusLabel(tripStatus)}
        </span>
      </div>

      {!loading && trip && (
        <TripFlowStepper tripStatus={tripStatus} className="mb-6" />
      )}

      {loading ? (
        <div className="glass rounded-2xl border border-white/6 p-6 flex items-center gap-2 text-slate-500 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-cyan-400" />
          Loading trip session…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass rounded-2xl border border-white/6 p-6">
            <h2 className="text-base font-semibold text-white mb-1">Pickup Flow</h2>
            <p className="text-xs text-slate-400 mb-5">Follow the ride-hailing style flow before OTP verification.</p>

            <div className="space-y-3">
              <button
                onClick={onStartJourney}
                disabled={!canStartJourney || startingJourney}
                className={`w-full px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                  canStartJourney && !startingJourney
                    ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                    : 'bg-white/8 text-slate-500 cursor-not-allowed border border-white/10'
                }`}
              >
                {startingJourney ? 'Starting journey...' : 'Start Journey To Traveler'}
              </button>

              <button
                onClick={onMarkArrived}
                disabled={!canMarkArrived || markingArrived}
                className={`w-full px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                  canMarkArrived && !markingArrived
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-white/8 text-slate-500 cursor-not-allowed border border-white/10'
                }`}
              >
                {markingArrived ? 'Marking arrived...' : 'Mark Arrived'}
              </button>
            </div>
          </div>

          {/* OTP Verify */}
          <div className="glass rounded-2xl border border-white/6 p-6">
            <h2 className="text-base font-semibold text-white mb-1">Verify Traveler OTP</h2>
            <p className="text-xs text-slate-400 mb-5">
              Enter the pickup OTP from the traveler trip screen (issued when their booking is confirmed).
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">OTP Code</label>
              <input
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                inputMode="numeric"
                className="input-dark text-center text-2xl font-bold tracking-widest"
                placeholder="——————"
                disabled={!isAwaitingOtp || verifying}
                maxLength={6}
              />
            </div>

            <button
              onClick={onVerifyOtp}
              disabled={!isAwaitingOtp || verifying}
              className={`w-full px-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                isAwaitingOtp && !verifying
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-white/8 text-slate-500 cursor-not-allowed border border-white/10'
              }`}
            >
              {verifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Verifying…
                </>
              ) : (
                'Verify OTP & start trip'
              )}
            </button>

            {!isAwaitingOtp && tripStatus && (
              <p className="text-xs text-emerald-400 text-center mt-3">
                ✓ OTP already verified for this trip.
              </p>
            )}
          </div>

          {/* End Trip */}
          <div className="glass rounded-2xl border border-white/6 p-6">
            <h2 className="text-base font-semibold text-white mb-1">Trip Actions</h2>
            <p className="text-xs text-slate-400 mb-5">End the trip when you're done exploring together.</p>

            <div className="rounded-xl bg-white/3 border border-white/8 p-4 mb-5 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Current status</span>
                <span className="font-medium text-slate-300">{tripStatusLabel(tripStatus)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Booking ID</span>
                <span className="font-mono text-slate-300">#{bookingId}</span>
              </div>
            </div>

            <button
              onClick={onEndTrip}
              disabled={!canEndTrip || endingTrip}
              className={`w-full px-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                canEndTrip && !endingTrip
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-white/8 text-slate-500 cursor-not-allowed border border-white/10'
              }`}
            >
              {endingTrip ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Ending…
                </>
              ) : (
                'End Trip & Request Review'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
