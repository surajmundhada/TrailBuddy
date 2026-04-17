import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { bookingsAPI, paymentsAPI } from '../services/api';

const PaymentPage = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [error, setError] = useState(null);
  const [isPaying, setIsPaying] = useState(false);

  const { data, isLoading, error: loadError, refetch } = useQuery(
    ['booking', bookingId],
    () => bookingsAPI.getById(Number(bookingId)).then((r) => r.data),
    { enabled: !!bookingId }
  );

  const booking = data;

  const onMockPay = async () => {
    setError(null);
    setIsPaying(true);
    try {
      await paymentsAPI.mockConfirm(Number(bookingId));
      await refetch();
      navigate('/bookings');
    } catch (e) {
      setError(e?.response?.data || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment</h1>

        {isLoading && <div className="text-gray-600">Loading booking...</div>}
        {loadError && <div className="text-red-600">Failed to load booking.</div>}

        {booking && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking summary</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <div>Booking ID: #{booking.id}</div>
                <div>
                  Dates: {booking.startDate} - {booking.endDate}
                </div>
                <div>Total amount: ₹{booking.totalAmount}</div>
                <div>Status: {booking.status}</div>
              </div>

              {booking.guide?.user?.id ? (
                <div className="mt-4 text-sm text-gray-600">
                  Guide: {booking.guide.user.firstName} {booking.guide.user.lastName}
                </div>
              ) : null}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Complete payment</h2>
              <p className="text-sm text-gray-600 mb-4">
                Use a test payment to complete the end-to-end flow.
              </p>

              {error ? <div className="text-red-600 text-sm mb-3">{error}</div> : null}

              <button
                className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium disabled:opacity-50"
                disabled={isPaying || booking.status !== 'PENDING'}
                onClick={onMockPay}
              >
                {isPaying
                  ? 'Processing...'
                  : booking.status === 'PENDING'
                    ? 'Pay Now (Test)'
                    : 'Payment completed'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
