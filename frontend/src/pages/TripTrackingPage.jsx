import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TripTrackingPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [otpStatus, setOtpStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTripData();
    const interval = setInterval(fetchTripData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchTripData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch booking details
      const bookingRes = await axios.get(
        `http://localhost:8080/bookings/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBooking(bookingRes.data);

      // Fetch trip OTP status
      const otpRes = await axios.get(
        `http://localhost:8080/trip-otp/status/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOtpStatus(otpRes.data.status);

      setError('');
    } catch (err) {
      if (err.response?.status !== 401) {
        setError(err.response?.data?.error || 'Error fetching trip data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (!window.confirm('Are you sure you want to end the trip?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8080/trip-otp/end-trip/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/trip-completed/${bookingId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error ending trip');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading trip details...</p>
        </div>
      </div>
    );
  }

  const tripDuration = otpStatus?.tripStartedAt && otpStatus?.tripEndedAt
    ? Math.round((new Date(otpStatus.tripEndedAt) - new Date(otpStatus.tripStartedAt)) / 1000 / 60)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">🚗 Trip in Progress</h1>
          <p className="text-gray-600">Booking ID: {bookingId}</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Trip Status Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Trip Started</p>
            <p className="text-2xl font-bold text-green-600">
              {otpStatus?.tripStartedAt
                ? new Date(otpStatus.tripStartedAt).toLocaleTimeString()
                : 'N/A'
              }
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Duration</p>
            <p className="text-2xl font-bold text-blue-600">
              {tripDuration ? `${tripDuration} mins` : 'In progress'}
            </p>
          </div>
        </div>

        {/* Guide & Traveller Info */}
        {booking && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Guide Information</h2>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-700">📍 <strong>{booking.guide.name}</strong></p>
                <p className="text-gray-600">⭐ Rating: {booking.guide.averageRating || 'N/A'}</p>
                <p className="text-gray-600">📞 {booking.guide.phone || 'Not provided'}</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Trip Details</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Date:</span>
                  <span className="font-semibold">{booking.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Amount:</span>
                  <span className="font-semibold">₹{booking.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Status:</span>
                  <span className="font-semibold text-green-600">In Progress</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Special Requirements</h2>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-gray-700">{booking.specialRequirements || 'None'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Trip Timeline */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Trip Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Trip Started</h3>
                <p className="text-gray-600">
                  {otpStatus?.tripStartedAt
                    ? new Date(otpStatus.tripStartedAt).toLocaleString()
                    : 'Pending'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className={`flex items-center justify-center h-10 w-10 rounded-full ${otpStatus?.tripEndedAt ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                  <span className={otpStatus?.tripEndedAt ? 'text-green-600' : 'text-gray-400'}>
                    {otpStatus?.tripEndedAt ? '✓' : '○'}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Trip Ended</h3>
                <p className="text-gray-600">
                  {otpStatus?.tripEndedAt
                    ? new Date(otpStatus.tripEndedAt).toLocaleString()
                    : 'In progress...'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {!otpStatus?.tripEndedAt && (
            <button
              onClick={handleEndTrip}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
            >
              ⏹️ End Trip
            </button>
          )}
          {otpStatus?.tripEndedAt && (
            <button
              onClick={() => navigate(`/trip-completed/${bookingId}`)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
            >
              ✓ Complete & Rate
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripTrackingPage;
