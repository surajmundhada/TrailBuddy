import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { guidesAPI, bookingsAPI } from '../services/api';

const BookingPage = () => {
  const navigate = useNavigate();
  const { guideId } = useParams();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: guideResponse, isLoading: isLoadingGuide, error: guideError } = useQuery(
    ['guide', guideId],
    () => guidesAPI.getById(Number(guideId)),
    { enabled: !!guideId, select: (res) => res.data }
  );

  const guide = guideResponse;

  const dailyRate = useMemo(() => {
    if (!guide) return 0;
    if (guide.dailyRate != null) return Number(guide.dailyRate);
    if (guide.hourlyRate != null) return Number(guide.hourlyRate) * 8;
    return 0;
  }, [guide]);

  const tripDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffMs = e.getTime() - s.getTime();
    if (Number.isNaN(diffMs)) return 0;
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
  }, [startDate, endDate]);

  const amount = useMemo(() => {
    if (!tripDays || !dailyRate) return 0;
    return Math.round(tripDays * dailyRate * 100) / 100;
  }, [tripDays, dailyRate]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onCreateBooking = async (e) => {
    e.preventDefault();
    setError(null);
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }
    if (!amount) {
      setError('Invalid trip amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bookingsAPI.create({
        guideId: Number(guideId),
        startDate,
        endDate,
        amount,
      });
      navigate(`/payment/${res.data.id}`);
    } catch (err) {
      setError(err?.response?.data || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Book Now</h1>

        {isLoadingGuide && <div className="text-gray-600">Loading guide...</div>}
        {guideError && (
          <div className="text-red-600">
            Failed to load guide: {guideError?.message || guideError?.response?.data || 'Unknown error'}
          </div>
        )}

        {guide && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={guide.user?.profileImageUrl}
                  alt={`${guide.user?.firstName || 'Guide'} ${guide.user?.lastName || ''}`}
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {guide.user?.firstName} {guide.user?.lastName}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {guide.city}, {guide.state}
                  </p>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">{guide.bio}</p>

              <div className="text-sm text-gray-700">
                <div>Hourly: ₹{guide.hourlyRate}</div>
                <div>Daily: ₹{dailyRate}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={onCreateBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Trip days</span>
                    <span className="font-medium">{tripDays || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Amount</span>
                    <span className="font-medium">₹{amount || '-'}</span>
                  </div>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <button
                  type="submit"
                  disabled={isSubmitting || !startDate || !endDate}
                  className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Confirm Booking'}
                </button>
              </form>
            </div>
          </div>
        )}
        {!isLoadingGuide && !guide && !guideError && (
          <div className="text-gray-600">Guide not found. guideId={guideId}</div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
