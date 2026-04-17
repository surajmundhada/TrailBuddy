import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { adminAPI, bookingsAPI, guidesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { CalendarIcon } from '@heroicons/react/24/outline';

const BookingsPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean).map((r) => String(r).toUpperCase())
    : [];
  const isGuide = roles.includes('GUIDE') || roles.includes('ROLE_GUIDE');
  const isAdmin = (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN')) && !isGuide;
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState(null);

  const [reviewModal, setReviewModal] = useState({
    open: false, bookingId: null, guideId: null, bookingStatus: null, rating: 5, comment: '',
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [quoteModal, setQuoteModal] = useState({
    open: false, bookingId: null, curatedText: '', quotedAmount: '',
  });

  const isTripOver = (booking) => {
    if (!booking?.endDate) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(booking.endDate); end.setHours(0, 0, 0, 0);
    return end < today;
  };

  const downloadReceipt = (booking, type) => {
    const guideName = booking?.guide?.user?.firstName
      ? `${booking.guide.user.firstName} ${booking.guide.user.lastName}`
      : `Guide #${booking?.guide?.id ?? '-'}`;
    const cancellationFeeLine = typeof booking?.specialRequirements === 'string'
      ? booking.specialRequirements.split('\n').find((l) => l.startsWith('cancellationFee='))
      : null;
    const feeValue = cancellationFeeLine && cancellationFeeLine.includes('=')
      ? String(cancellationFeeLine.split('=')[1] ?? '').trim() : null;
    const JsPDFClass = jsPDF?.jsPDF ? jsPDF.jsPDF : jsPDF;
    const doc = new JsPDFClass({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;
    const maxWidth = pageWidth - marginX * 2;
    let y = 44;
    doc.setFontSize(16);
    doc.text(`TrailBuddy ${type === 'cancel' ? 'Cancellation Receipt' : 'Booking Receipt'}`, marginX, y);
    y += 18;
    doc.setFontSize(10); doc.setTextColor(107, 114, 128);
    doc.text(`Generated on ${new Date().toLocaleString()}`, marginX, y); y += 16;
    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.75);
    doc.line(marginX, y, pageWidth - marginX, y); y += 18;
    const lines = [
      `Booking ID: #${booking?.id ?? '-'}`, `Status: ${booking?.status ?? '-'}`,
      `Guide: ${guideName}`, `Dates: ${booking?.startDate ?? '-'} to ${booking?.endDate ?? '-'}`,
      `Total Amount: ₹${booking?.totalAmount ?? '-'}`, `Cancellation fee: ${feeValue ? `₹${feeValue}` : '-'}`,
    ];
    doc.setTextColor(17, 24, 39); doc.setFontSize(11);
    lines.forEach((t) => { const split = doc.splitTextToSize(t, maxWidth); doc.text(split, marginX, y); y += 14 * split.length; });
    y += 10; doc.setFontSize(9); doc.setTextColor(107, 114, 128);
    const note = 'Note: dev receipt generated client-side.';
    doc.text(doc.splitTextToSize(note, maxWidth), marginX, y);
    doc.save(`trailbuddy-${type}-receipt-booking-${booking?.id ?? 'unknown'}.pdf`);
  };

  const fetchBookings = async () => {
    console.log('USER:', user);
    if (isAdmin) {
      const res = await adminAPI.getBookings(0, 200);
      console.log('BOOKINGS DATA (admin):', res.data);
      return res.data;
    }
    if (isGuide) {
      const res = await bookingsAPI.getGuideBookings();
      console.log('BOOKINGS DATA (guide):', res.data);
      return res.data;
    }
    const res = await bookingsAPI.getUserBookings();
    console.log('BOOKINGS DATA (user):', res.data);
    return res.data;
  };

  const { data, isLoading, error } = useQuery(
    ['my-bookings', user, isAdmin, isGuide],
    fetchBookings,
    {
      enabled: !!user,
      retry: 1,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    }
  );

  const bookings = Array.isArray(data) ? data : (data?.content || []);
  const errorMessage = error?.response?.data || error?.message || 'Unknown error';
  const errorStatus = error?.response?.status;

  const onCancel = async (bookingId) => {
    setActionError(null);
    const reason = window.prompt('Cancellation reason (optional):') || '';
    try {
      await bookingsAPI.cancel(bookingId, reason);
      window.location.reload();
    } catch (e) {
      setActionError(e?.response?.data || 'Failed to cancel booking');
    }
  };

  const parseTravelerPrefs = (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const quotationLabel = (qs) => {
    const s = String(qs || 'NONE').toUpperCase();
    const map = {
      NONE: '—',
      AWAITING_GUIDE: 'Awaiting quote',
      SENT: 'Quote received',
      ACCEPTED: 'Accepted — pay',
      DECLINED: 'Declined',
    };
    return map[s] || s;
  };

  const submitGuideQuote = async () => {
    if (!quoteModal.bookingId || !quoteModal.curatedText?.trim()) {
      toast.error('Add a description for your curated experience');
      return;
    }
    const amt = Number(quoteModal.quotedAmount);
    if (!amt || Number.isNaN(amt) || amt <= 0) {
      toast.error('Enter a valid quoted amount (INR)');
      return;
    }
    try {
      await bookingsAPI.submitGuideQuotation(quoteModal.bookingId, {
        curatedText: quoteModal.curatedText.trim(),
        quotedAmount: amt,
      });
      toast.success('Quotation sent to traveler');
      setQuoteModal({ open: false, bookingId: null, curatedText: '', quotedAmount: '' });
      queryClient.invalidateQueries(['my-bookings', user, isAdmin, isGuide]);
    } catch (e) {
      toast.error(typeof e?.response?.data === 'string' ? e.response.data : e?.message || 'Failed to send quote');
    }
  };

  const acceptQuotation = async (bookingId) => {
    try {
      await bookingsAPI.acceptQuotation(bookingId);
      toast.success('Quotation accepted — proceed to pay');
      queryClient.invalidateQueries(['my-bookings', user, isAdmin, isGuide]);
    } catch (e) {
      toast.error(e?.response?.data || 'Failed');
    }
  };

  const declineQuotation = async (bookingId) => {
    if (!window.confirm('Decline this quotation? The booking will be cancelled.')) return;
    try {
      await bookingsAPI.declineQuotation(bookingId);
      toast.success('Quotation declined');
      queryClient.invalidateQueries(['my-bookings', user, isAdmin, isGuide]);
    } catch (e) {
      toast.error(e?.response?.data || 'Failed');
    }
  };

  const submitReview = async () => {
    if (!reviewModal.bookingId || !reviewModal.guideId) return;
    setIsSubmittingReview(true);
    try {
      if (reviewModal.bookingStatus === 'CONFIRMED') {
        await bookingsAPI.updateStatus(reviewModal.bookingId, 'COMPLETED');
      }
      await guidesAPI.addReview(reviewModal.guideId, {
        bookingId: reviewModal.bookingId,
        rating: Number(reviewModal.rating),
        comment: reviewModal.comment,
      });
      toast.success('Review submitted successfully');
      setReviewModal({ open: false, bookingId: null, guideId: null, bookingStatus: null, rating: 5, comment: '' });
      queryClient.invalidateQueries('guides');
      queryClient.invalidateQueries(['my-bookings', user, isAdmin, isGuide]);
    } catch (e) {
      toast.error(e?.response?.data || e?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
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
          My Bookings
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          {isAdmin ? 'All platform bookings.' : isGuide ? 'Bookings from your travelers.' : 'Your travel bookings and history.'}
        </p>
      </div>

      {/* Loading / Error states */}
      {(authLoading || (isLoading && !!user)) && (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-8">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-cyan-400" />
          Loading bookings...
        </div>
      )}
      {error && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-4">
          Failed to load bookings.{errorStatus ? ` (HTTP ${errorStatus})` : ''}
          <div className="text-red-500 mt-1">{typeof errorMessage === 'string' ? errorMessage : 'See console for details'}</div>
        </div>
      )}
      {actionError && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-4">
          {actionError}
        </div>
      )}
      {!authLoading && !isLoading && !error && bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
            <CalendarIcon className="h-7 w-7 text-slate-600" />
          </div>
          <p className="text-slate-500 text-sm">No bookings yet.</p>
        </div>
      )}

      {/* Bookings Table */}
      {bookings.length > 0 && (
        <div className="glass rounded-2xl border border-white/6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/6">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dates</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Quote</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4 text-sm">
                      <span className="font-semibold text-slate-200">#{b.id}</span>
                      {b.guidePackageId ? (
                        <div className="text-[10px] font-medium text-cyan-400/90 mt-0.5">Hidden Gem · listed experience</div>
                      ) : null}
                        {!isGuide && b.guide?.user?.firstName && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            Guide: {b.guide.user.firstName} {b.guide.user.lastName}
                          </div>
                        )}
                        {isGuide && b.user?.firstName && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            Traveler: {b.user.firstName} {b.user.lastName}
                          </div>
                        )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400 whitespace-nowrap">
                      {b.startDate} – {b.endDate}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-cyan-400 whitespace-nowrap">
                      ₹{b.totalAmount}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400 max-w-[180px]">
                      <div>{quotationLabel(b.quotationStatus)}</div>
                      {(() => {
                        const prefs = parseTravelerPrefs(b.travelerPreferences);
                        const pkgs = prefs?.selectedPackages;
                        if (Array.isArray(pkgs) && pkgs.length > 0) {
                          return (
                            <div className="text-[10px] text-cyan-400/90 mt-1 space-y-0.5">
                              {pkgs.map((p) => (
                                <div key={p.id} className="line-clamp-1" title={p.title}>
                                  • {p.title} (₹{p.price})
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return b.travelerPreferences && isGuide ? (
                          <div className="text-[10px] text-slate-500 mt-1 line-clamp-2" title={b.travelerPreferences}>
                            {b.travelerPreferences}
                          </div>
                        ) : null;
                      })()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${statusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {isGuide && b.status === 'PENDING' && b.quotationStatus === 'AWAITING_GUIDE' && (
                          <button
                            type="button"
                            onClick={() => {
                              const prefs = parseTravelerPrefs(b.travelerPreferences);
                              const suggested = Array.isArray(prefs?.selectedPackages)
                                ? prefs.selectedPackages.reduce((s, p) => s + (Number(p.price) || 0), 0)
                                : 0;
                              setQuoteModal({
                                open: true,
                                bookingId: b.id,
                                curatedText: b.guideCuratedQuotation || '',
                                quotedAmount: suggested > 0 ? String(suggested) : '',
                              });
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 font-medium"
                          >
                            Send quote
                          </button>
                        )}
                        {!isGuide && b.status === 'PENDING' && b.quotationStatus === 'SENT' && (
                          <>
                            <button
                              type="button"
                              onClick={() => acceptQuotation(b.id)}
                              className="btn-cyan text-xs px-3 py-1.5 rounded-lg font-semibold"
                            >
                              Accept quote
                            </button>
                            <button
                              type="button"
                              onClick={() => declineQuotation(b.id)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {b.status === 'PENDING' && (b.quotationStatus === 'NONE' || b.quotationStatus === 'ACCEPTED' || !b.quotationStatus) && Number(b.totalAmount) > 0 && (
                          <button
                            onClick={() => navigate(`/payment/${b.id}`)}
                            className="btn-cyan text-xs px-3 py-1.5 rounded-lg font-semibold"
                          >
                            Pay
                          </button>
                        )}
                        {b.status === 'CONFIRMED' && !isGuide && !isAdmin && (
                          <button
                            onClick={() => navigate(`/trip/start/${b.id}`)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/15 transition-colors font-medium"
                          >
                            Trip Handoff
                          </button>
                        )}
                        {b.status === 'CONFIRMED' && isGuide && (
                          <button
                            onClick={() => navigate(`/trip/verify/${b.id}`)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/15 transition-colors font-medium"
                          >
                            Pickup Flow
                          </button>
                        )}
                        {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                          <button
                            onClick={() => onCancel(b.id)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/8 text-red-400 hover:bg-red-500/15 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                        )}
                        {(b.status === 'CONFIRMED' || b.status === 'CANCELLED') && (
                          <button
                            onClick={() => downloadReceipt(b, b.status === 'CANCELLED' ? 'cancel' : 'confirm')}
                            className="text-xs px-3 py-1.5 rounded-lg border border-white/8 bg-white/4 text-slate-300 hover:bg-white/8 transition-colors"
                          >
                            Receipt
                          </button>
                        )}
                        {(isGuide ? (b.user?.id || b.guide?.user?.id) : b.guide?.user?.id) && (
                          <button
                            onClick={() => navigate(`/chat/${isGuide ? (b.user?.id || b.guide.user.id) : b.guide.user.id}`)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-white/8 bg-white/4 text-slate-300 hover:bg-white/8 transition-colors"
                          >
                            Chat
                          </button>
                        )}
                        {(b.guide?.id && (b.status === 'COMPLETED' || (b.status === 'CONFIRMED' && isTripOver(b)))) && (
                          <button
                            onClick={() => setReviewModal({ open: true, bookingId: b.id, guideId: b.guide.id, bookingStatus: b.status, rating: 5, comment: '' })}
                            className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/8 text-amber-400 hover:bg-amber-500/15 transition-colors font-medium"
                          >
                            Rate & Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {quoteModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass rounded-2xl border border-white/10 shadow-card-dark">
            <div className="p-5 border-b border-white/8">
              <h2 className="text-base font-bold text-white">Send curated quotation</h2>
              <p className="text-xs text-slate-400 mt-1">Describe the experience and set a total price (INR).</p>
            </div>
            <div className="p-5 space-y-3">
              {(() => {
                const bookingRow = bookings.find((x) => x.id === quoteModal.bookingId);
                const prefs = bookingRow ? parseTravelerPrefs(bookingRow.travelerPreferences) : null;
                const suggested = Array.isArray(prefs?.selectedPackages)
                  ? prefs.selectedPackages.reduce((s, p) => s + (Number(p.price) || 0), 0)
                  : 0;
                if (!suggested) return null;
                return (
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-200/90">
                    Suggested total from traveler&apos;s selected packages: <strong>₹{suggested}</strong> (you can adjust).
                  </div>
                );
              })()}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Curated plan</label>
                <textarea
                  className="input-dark resize-none text-sm"
                  rows={5}
                  value={quoteModal.curatedText}
                  onChange={(e) => setQuoteModal((s) => ({ ...s, curatedText: e.target.value }))}
                  placeholder="Day 1: … Day 2: … Inclusions, meeting point, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Quoted amount (₹)</label>
                <input
                  type="number"
                  min={1}
                  className="input-dark"
                  value={quoteModal.quotedAmount}
                  onChange={(e) => setQuoteModal((s) => ({ ...s, quotedAmount: e.target.value }))}
                />
              </div>
            </div>
            <div className="p-4 border-t border-white/8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setQuoteModal({ open: false, bookingId: null, curatedText: '', quotedAmount: '' })}
                className="px-4 py-2 rounded-xl bg-white/8 text-slate-300 text-sm border border-white/10"
              >
                Cancel
              </button>
              <button type="button" onClick={submitGuideQuote} className="btn-cyan px-5 py-2 rounded-xl text-sm font-semibold">
                Send to traveler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass rounded-2xl border border-white/10 shadow-card-dark">
            <div className="p-5 border-b border-white/8">
              <h2 className="text-base font-bold text-white">Rate your guide</h2>
              <p className="text-xs text-slate-400 mt-1">Your rating updates the guide's profile instantly.</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = Number(reviewModal.rating) >= n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setReviewModal((s) => ({ ...s, rating: n }))}
                        className="p-0.5 transition-transform hover:scale-110"
                        aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                      >
                        <StarSolidIcon className={`h-7 w-7 transition-colors ${active ? 'text-amber-400' : 'text-slate-700'}`} />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-sm font-semibold text-amber-400">
                    {Number(reviewModal.rating).toFixed(1)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Review</label>
                <textarea
                  value={reviewModal.comment}
                  onChange={(e) => setReviewModal((s) => ({ ...s, comment: e.target.value }))}
                  className="input-dark resize-none"
                  rows={4}
                  placeholder="Write your experience..."
                />
              </div>

              {actionError && (
                <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{actionError}</div>
              )}
            </div>

            <div className="p-4 border-t border-white/8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewModal((s) => ({ ...s, open: false }))}
                disabled={isSubmittingReview}
                className="px-4 py-2 rounded-xl bg-white/8 hover:bg-white/12 text-slate-300 text-sm border border-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReview}
                disabled={isSubmittingReview}
                className="btn-cyan px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingReview ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                    Submitting...
                  </>
                ) : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
