import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { bookingsAPI, guidesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const BookingsPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState(null);

  const [reviewModal, setReviewModal] = useState({
    open: false,
    bookingId: null,
    guideId: null,
    bookingStatus: null,
    rating: 5,
    comment: '',
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const isTripOver = (booking) => {
    if (!booking?.endDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(booking.endDate);
    end.setHours(0, 0, 0, 0);
    return end < today;
  };

  const downloadReceipt = (booking, type) => {
    const guideName = booking?.guide?.user?.firstName
      ? `${booking.guide.user.firstName} ${booking.guide.user.lastName}`
      : `Guide #${booking?.guide?.id ?? '-'}`;

    const cancellationFeeLine = typeof booking?.specialRequirements === 'string'
      ? booking.specialRequirements.split('\n').find((l) => l.startsWith('cancellationFee='))
      : null;

    const feeValue =
      cancellationFeeLine && cancellationFeeLine.includes('=')
        ? String(cancellationFeeLine.split('=')[1] ?? '').trim()
        : null;

    // jsPDF has slightly different export shapes depending on version/build tooling.
    const JsPDFClass = jsPDF?.jsPDF ? jsPDF.jsPDF : jsPDF;
    const doc = new JsPDFClass({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;
    const maxWidth = pageWidth - marginX * 2;

    let y = 44;
    doc.setFontSize(16);
    doc.text(`TrailBuddy ${type === 'cancel' ? 'Cancellation Receipt' : 'Booking Receipt'}`, marginX, y);
    y += 18;

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(`Generated on ${new Date().toLocaleString()}`, marginX, y);
    y += 16;

    doc.setDrawColor(229, 231, 235); // gray-200
    doc.setLineWidth(0.75);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 18;

    const lines = [
      `Booking ID: #${booking?.id ?? '-'}`,
      `Status: ${booking?.status ?? '-'}`,
      `Guide: ${guideName}`,
      `Dates: ${booking?.startDate ?? '-'} to ${booking?.endDate ?? '-'}`,
      `Total Amount: ₹${booking?.totalAmount ?? '-'}`,
      `Cancellation fee: ${feeValue ? `₹${feeValue}` : '-'}`,
    ];

    doc.setTextColor(17, 24, 39); // gray-900
    doc.setFontSize(11);

    lines.forEach((t) => {
      const split = doc.splitTextToSize(t, maxWidth);
      doc.text(split, marginX, y);
      y += 14 * split.length;
    });

    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // gray-500
    const note = 'Note: dev receipt generated client-side.';
    const noteSplit = doc.splitTextToSize(note, maxWidth);
    doc.text(noteSplit, marginX, y);

    doc.save(`trailbuddy-${type}-receipt-booking-${booking?.id ?? 'unknown'}.pdf`);
  };

  const { data, isLoading, error } = useQuery(
    ['my-bookings', user?.id],
    async () => {
      const res = await bookingsAPI.getUserBookings();
      return res.data;
    },
    {
      enabled: !!user?.id,
      retry: 1,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    }
  );

  const bookings = data?.content ?? [];
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

  const submitReview = async () => {
    if (!reviewModal.bookingId || !reviewModal.guideId) return;
    setIsSubmittingReview(true);
    try {
      if (reviewModal.bookingStatus === 'CONFIRMED') {
        // Trip is over but status still confirmed; normalize it before review.
        await bookingsAPI.updateStatus(reviewModal.bookingId, 'COMPLETED');
      }

      await guidesAPI.addReview(reviewModal.guideId, {
        bookingId: reviewModal.bookingId,
        rating: Number(reviewModal.rating),
        comment: reviewModal.comment,
      });
      toast.success('Review submitted successfully');

      setReviewModal({
        open: false,
        bookingId: null,
        guideId: null,
        bookingStatus: null,
        rating: 5,
        comment: '',
      });

      // Update guides card ratings + totals.
      queryClient.invalidateQueries('guides');
      queryClient.invalidateQueries(['my-bookings', user?.id]);
    } catch (e) {
      toast.error(e?.response?.data || e?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Bookings</h1>

        {(authLoading || isLoading) && (
          <div className="text-gray-600">Loading bookings...</div>
        )}

        {error && (
          <div className="text-red-600">
            Failed to load bookings.
            {errorStatus ? ` (HTTP ${errorStatus})` : ''}
            <div className="text-xs mt-1 text-red-700">{typeof errorMessage === 'string' ? errorMessage : 'See console for details'}</div>
          </div>
        )}

        {actionError ? (
          <div className="text-red-600 text-sm mt-2">{actionError}</div>
        ) : null}

        {!isLoading && !error && bookings.length === 0 && (
          <div className="text-gray-600">No bookings yet.</div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Booking</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dates</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    #{b.id}
                    {b.guide?.user?.firstName ? (
                      <div className="text-xs text-gray-500">
                        Guide: {b.guide.user.firstName} {b.guide.user.lastName}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {b.startDate} - {b.endDate}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    ₹{b.totalAmount}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {b.status}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {b.status === 'PENDING' ? (
                      <button
                        className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                        onClick={() => navigate(`/payment/${b.id}`)}
                      >
                        Pay
                      </button>
                    ) : null}
                    {(b.status === 'PENDING' || b.status === 'CONFIRMED') ? (
                      <button
                        className="ml-2 px-3 py-1 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                        onClick={() => onCancel(b.id)}
                      >
                        Cancel
                      </button>
                    ) : null}
                    {(b.status === 'CONFIRMED' || b.status === 'CANCELLED') ? (
                      <button
                        className="ml-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                        onClick={() => downloadReceipt(b, b.status === 'CANCELLED' ? 'cancel' : 'confirm')}
                      >
                        Receipt
                      </button>
                    ) : null}
                    {b.guide?.user?.id ? (
                      <button
                        className="ml-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                        onClick={() => navigate(`/chat/${b.guide.user.id}`)}
                      >
                        Chat
                      </button>
                    ) : null}

                    {(b.guide?.id && (b.status === 'COMPLETED' || (b.status === 'CONFIRMED' && isTripOver(b)))) ? (
                      <button
                        className="ml-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                        onClick={() => {
                          setReviewModal({
                            open: true,
                            bookingId: b.id,
                            guideId: b.guide.id,
                            bookingStatus: b.status,
                            rating: 5,
                            comment: '',
                          });
                        }}
                      >
                        Rate & Review
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reviewModal.open ? (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Rate your guide</h2>
              <p className="text-sm text-gray-600 mb-4">Your rating updates the guide’s profile instantly.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating</label>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = Number(reviewModal.rating) >= n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setReviewModal((s) => ({ ...s, rating: n }))}
                          className="p-1"
                          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                        >
                          <StarSolidIcon
                            className={`h-7 w-7 ${active ? 'text-yellow-400' : 'text-gray-300'}`}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {Number(reviewModal.rating).toFixed(1)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Review</label>
                  <textarea
                    value={reviewModal.comment}
                    onChange={(e) => setReviewModal((s) => ({ ...s, comment: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    rows={4}
                    placeholder="Write your experience..."
                  />
                </div>

                {actionError ? (
                  <div className="text-red-600 text-sm">{actionError}</div>
                ) : null}

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={() => setReviewModal((s) => ({ ...s, open: false }))}
                    disabled={isSubmittingReview}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                    onClick={submitReview}
                    disabled={isSubmittingReview}
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default BookingsPage;

