import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { bookingsAPI, paymentsAPI } from '../services/api';
import { CreditCardIcon, QrCodeIcon, ReceiptRefundIcon } from '@heroicons/react/24/outline';

const PaymentPage = () => {
  const navigate = useNavigate();
  // ✅ Extract ID from URL properly
  const { id } = useParams();
  const [error, setError] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMode, setPaymentMode] = useState('CARD');
  const bookingId = id ? Number(id) : null;
  const isValidBookingId = Number.isInteger(bookingId) && bookingId > 0;

  // ✅ Add debug logs
  console.log('[PaymentPage] 📍 Mounted with bookingId from URL:', bookingId);

  const { data, isLoading, error: loadError, refetch } = useQuery(
    ['booking', id],
    () => {
      console.log('[PaymentPage] 🔄 Fetching booking:', { bookingId });
      return bookingsAPI.getById(id).then((r) => {
        console.log('[PaymentPage] ✅ Booking loaded successfully:', r.data);
        return r.data;
      });
    },
    {
      enabled: isValidBookingId,
      onError: (err) => {
        console.error('[PaymentPage] ❌ Query error fetching booking:', {
          bookingId,
          status: err?.response?.status,
          message: err?.response?.data || err?.message,
        });
      },
    }
  );

  const booking = data;

  const { data: qrPayload } = useQuery(
    ['dummy-qr', bookingId, booking?.status, paymentMode],
    () => paymentsAPI.getDummyQr(bookingId).then((r) => r.data),
    {
      enabled: Boolean(isValidBookingId && booking && booking.status === 'PENDING' && paymentMode === 'UPI'),
      retry: 1,
    }
  );

  const breakdown = useMemo(() => {
    const req = typeof booking?.specialRequirements === 'string' ? booking.specialRequirements : '';
    const pick = (key) => {
      const line = req.split('\n').find((l) => l.startsWith(`${key}=`));
      return line ? line.split('=').slice(1).join('=').trim() : null;
    };
    return {
      passengerCount: pick('passengerCount'),
      needsVehicle: pick('needsVehicle') === 'true',
      vehicleAc: pick('vehicleAc') === 'true',
      distanceKm: pick('distanceKm'),
      guideBaseAmount: pick('guideBaseAmount'),
      vehicleAmount: pick('vehicleAmount'),
    };
  }, [booking?.specialRequirements]);

  const onMockPay = async () => {
    setError(null);
    setIsPaying(true);
    try {
      console.log('[PaymentPage] 💳 Processing payment for booking:', bookingId);
      await paymentsAPI.mockConfirm(bookingId, { paymentMethod: paymentMode });
      console.log('[PaymentPage] ✅ Payment confirmed, refetching booking status...');
      await refetch();
      const tripStartUrl = `/trip/start/${bookingId}`;
      console.log('[PaymentPage] 📍 Navigating to trip start:', tripStartUrl);
      navigate(tripStartUrl);
    } catch (e) {
      const errorMsg = e?.response?.data || 'Payment failed';
      console.error('[PaymentPage] ❌ Payment error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsPaying(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
      CONFIRMED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      COMPLETED: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
      CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/25',
    };
    return map[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/25';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-primary-400 bg-clip-text text-transparent">
          Payment
        </h1>
        <p className="mt-2 text-slate-400 text-sm">Review your booking and complete the payment to confirm your trip.</p>
      </div>

      {booking && (
        <div className="mb-6 glass rounded-2xl border border-white/6 p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">End-to-end flow (Rapido / Uber style)</div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[11px] text-slate-300">
            {booking.quotationStatus && booking.quotationStatus !== 'NONE' ? (
              <>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">① Request &amp; packages</span>
                <span className="text-slate-600">→</span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">② Guide quote</span>
                <span className="text-slate-600">→</span>
                <span className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1.5 text-cyan-200">③ Pay (here)</span>
                <span className="text-slate-600">→</span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">④ Pickup → OTP → Trip</span>
              </>
            ) : (
              <>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">① Book</span>
                <span className="text-slate-600">→</span>
                <span className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1.5 text-cyan-200">② Pay (here)</span>
                <span className="text-slate-600">→</span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">③ Guide en route → OTP → Live trip</span>
              </>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-8">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-cyan-400" />
          Loading booking...
        </div>
      )}
      {!isValidBookingId && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-4">
          <div className="font-semibold mb-1">Booking not found or not authorized</div>
          <div className="text-xs text-red-300">Invalid booking ID in URL.</div>
        </div>
      )}
      {loadError && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-4">
          <div className="font-semibold mb-1">
            {loadError?.response?.status === 404
              ? 'Booking not found'
              : loadError?.response?.status === 403
                ? 'Booking not authorized'
                : 'Failed to load booking'}
          </div>
          <div className="text-xs text-red-300">
            {loadError?.response?.data || loadError?.message || 'Unknown error occurred'}
          </div>
        </div>
      )}

      {booking && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Summary */}
          <div className="glass rounded-2xl border border-white/6 p-6">
            <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
              <ReceiptRefundIcon className="h-5 w-5 text-cyan-400" />
              Booking Summary
            </h2>

            <div className="space-y-3 text-sm">
              {/* Booking meta */}
              <div className="rounded-xl bg-white/4 border border-white/8 divide-y divide-white/6">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Booking ID</span>
                  <span className="font-semibold text-slate-200">#{booking.id}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Dates</span>
                  <span className="text-slate-300">{booking.startDate} – {booking.endDate}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Passengers</span>
                  <span className="text-slate-300">{breakdown.passengerCount || '—'}</span>
                </div>
                {breakdown.needsVehicle ? (
                  <>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-slate-500">Vehicle</span>
                      <span className="text-slate-300">{breakdown.vehicleAc ? 'With AC (₹30/km)' : 'Without AC (₹25/km)'}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-slate-500">Distance</span>
                      <span className="text-slate-300">{breakdown.distanceKm || '—'} km</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-slate-500">Vehicle add-on</span>
                      <span className="text-slate-300">₹{breakdown.vehicleAmount || '0'}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-slate-500">Vehicle</span>
                    <span className="text-slate-300">Not required</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Guide base</span>
                  <span className="text-slate-300">₹{breakdown.guideBaseAmount || booking.totalAmount}</span>
                </div>
              </div>

              {/* Total + Status */}
              <div className="flex items-center justify-between rounded-xl bg-cyan-500/5 border border-cyan-500/15 px-4 py-3">
                <span className="font-semibold text-slate-300">Total Amount</span>
                <span className="text-xl font-bold text-cyan-400">₹{booking.totalAmount}</span>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-slate-500">Status</span>
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${statusBadge(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              {booking.guide?.user?.id && (
                <div className="flex justify-between px-1 text-xs">
                  <span className="text-slate-500">Guide</span>
                  <span className="font-medium text-slate-300">
                    {booking.guide.user.firstName} {booking.guide.user.lastName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Panel */}
          <div className="glass rounded-2xl border border-white/6 p-6 flex flex-col">
            <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
              {paymentMode === 'CARD' ? <CreditCardIcon className="h-5 w-5 text-cyan-400" /> : <QrCodeIcon className="h-5 w-5 text-cyan-400" />}
              Dummy Payment Gateway
            </h2>

            <div className="flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setPaymentMode('CARD')}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    paymentMode === 'CARD'
                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                      : 'border-white/8 bg-white/3 text-slate-400'
                  }`}
                >
                  <CreditCardIcon className="h-5 w-5 mx-auto mb-2" />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    paymentMode === 'UPI'
                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                      : 'border-white/8 bg-white/3 text-slate-400'
                  }`}
                >
                  <QrCodeIcon className="h-5 w-5 mx-auto mb-2" />
                  QR / UPI
                </button>
              </div>
              <div className="rounded-xl bg-white/4 border border-white/8 p-4 mb-5">
                <div className="text-xs text-slate-500 mb-1">You are paying</div>
                <div className="text-3xl font-bold text-cyan-400">₹{booking.totalAmount}</div>
                <p className="text-xs text-slate-500 mt-2">
                  This is a test payment flow — no real money will be charged.
                </p>
              </div>

              {paymentMode === 'CARD' ? (
                <div className="rounded-xl border border-white/8 bg-white/4 p-4 mb-5 space-y-3">
                  <input value="4111 1111 1111 1111" readOnly className="input-dark" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value="12/30" readOnly className="input-dark" />
                    <input value="123" readOnly className="input-dark" />
                  </div>
                  <input value="Trail Buddy Test Card" readOnly className="input-dark" />
                </div>
              ) : (
                <div className="rounded-xl border border-white/8 bg-white/4 p-4 mb-5 text-center">
                  {qrPayload?.qrDataUrl ? (
                    <img
                      src={qrPayload.qrDataUrl}
                      alt="Dummy payment QR"
                      className="mx-auto h-44 w-44 rounded-2xl border border-white/10 bg-white p-2"
                    />
                  ) : (
                    <div className="h-44 flex items-center justify-center text-xs text-slate-500">Loading QR…</div>
                  )}
                  {qrPayload?.reference && (
                    <div className="mt-2 text-[11px] font-mono text-slate-400">Ref: {qrPayload.reference}</div>
                  )}
                  <div className="mt-2 text-xs text-slate-500">{qrPayload?.hint || 'Dummy scan — use the button below to confirm payment.'}</div>
                </div>
              )}

              {error && (
                <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2 mb-4">
                  {error}
                </div>
              )}

              <button
                className="w-full btn-cyan font-semibold text-sm py-3.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isPaying || booking.status !== 'PENDING'}
                onClick={onMockPay}
              >
                {isPaying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    Processing...
                  </>
                ) : booking.status === 'PENDING' ? (
                  <>
                    {paymentMode === 'CARD' ? <CreditCardIcon className="h-4 w-4" /> : <QrCodeIcon className="h-4 w-4" />}
                    Pay with {paymentMode === 'CARD' ? 'Card' : 'QR / UPI'}
                  </>
                ) : (
                  '✓ Payment completed'
                )}
              </button>

              {booking.status !== 'PENDING' && (
                <p className="text-xs text-emerald-400 text-center mt-3">
                  Payment has already been processed for this booking.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
