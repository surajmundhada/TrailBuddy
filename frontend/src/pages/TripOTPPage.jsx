import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TripOTPPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpStatus, setOtpStatus] = useState(null);
  const [tripStarted, setTripStarted] = useState(false);
  const [tripEnded, setTripEnded] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    setUserRole(role);

    if (token) {
      fetchOTPStatus();
      const interval = setInterval(fetchOTPStatus, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [bookingId]);

  const fetchOTPStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/trip-otp/status/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOtpStatus(response.data.status);

      if (response.data.bothVerified && !tripStarted) {
        setSuccess('✓ Both OTPs verified! Trip can start now.');
      }

      if (response.data.expired) {
        setShowExpiredModal(true);
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const endpoint = userRole === 'GUIDE'
        ? `/trip-otp/verify-guide/${bookingId}`
        : `/trip-otp/verify-traveller/${bookingId}`;

      const response = await axios.post(
        `http://localhost:8080${endpoint}`,
        { otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`✓ OTP verified successfully!`);
      setOtp('');

      setTimeout(() => {
        fetchOTPStatus();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8080/trip-otp/start-trip/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('✓ Trip started successfully!');
      setTripStarted(true);

      setTimeout(() => {
        navigate(`/trip-tracking/${bookingId}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error starting trip');
    } finally {
      setLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (!window.confirm('Are you sure you want to end the trip?')) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8080/trip-otp/end-trip/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('✓ Trip ended successfully!');
      setTripEnded(true);

      setTimeout(() => {
        navigate(`/trip-completed/${bookingId}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error ending trip');
    } finally {
      setLoading(false);
    }
  };

  const userType = userRole === 'GUIDE' ? 'Guide' : 'Traveller';
  const isBothVerified = otpStatus?.travellerOtpVerified && otpStatus?.guideOtpVerified;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 text-center">
          <h1 className="text-3xl font-bold mb-2">🚗 Trip Verification</h1>
          <p className="text-blue-100">Booking ID: {bookingId}</p>
        </div>

        <div className="p-8 space-y-6">

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* OTP Status Cards */}
          {otpStatus && (
            <div className="space-y-3">
              <div className={`p-4 rounded-lg border-2 ${otpStatus.travellerOtpVerified
                  ? 'bg-green-50 border-green-500'
                  : 'bg-gray-50 border-gray-300'
                }`}>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${otpStatus.travellerOtpVerified ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                    {otpStatus.travellerOtpVerified ? '✓' : '✕'}
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-800">Traveller OTP</p>
                    {otpStatus.travellerOtpVerified && (
                      <p className="text-sm text-green-600">Verified at {new Date(otpStatus.travellerOtpVerifiedAt).toLocaleTimeString()}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${otpStatus.guideOtpVerified
                  ? 'bg-green-50 border-green-500'
                  : 'bg-gray-50 border-gray-300'
                }`}>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${otpStatus.guideOtpVerified ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                    {otpStatus.guideOtpVerified ? '✓' : '✕'}
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-800">Guide OTP</p>
                    {otpStatus.guideOtpVerified && (
                      <p className="text-sm text-green-600">Verified at {new Date(otpStatus.guideOtpVerifiedAt).toLocaleTimeString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OTP Input Form */}
          {!isBothVerified && !tripStarted && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Enter Your {userType} OTP (6 digits)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  maxLength="6"
                  placeholder="000000"
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP ✓'}
              </button>
            </form>
          )}

          {/* Trip Control Buttons */}
          {isBothVerified && !tripStarted && (
            <button
              onClick={handleStartTrip}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Starting...' : '🚀 Start Trip'}
            </button>
          )}

          {tripStarted && !tripEnded && (
            <button
              onClick={handleEndTrip}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Ending...' : '⏹️ End Trip'}
            </button>
          )}

          {tripEnded && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center font-semibold">
              ✓ Trip completed! Redirecting...
            </div>
          )}

          {/* OTP Expiry Info */}
          {otpStatus && otpStatus.otpExpiry && (
            <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
              <p className="text-sm text-yellow-800">
                <strong>OTP expires at:</strong> {new Date(otpStatus.otpExpiry).toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Trip info */}
          {tripStarted && otpStatus?.tripStartedAt && (
            <div className="bg-blue-50 border border-blue-300 rounded p-3">
              <p className="text-sm text-blue-800">
                <strong>Trip started at:</strong> {new Date(otpStatus.tripStartedAt).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expired Modal */}
      {showExpiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-sm">
            <h2 className="text-2xl font-bold mb-4 text-red-600">⚠️ OTP Expired</h2>
            <p className="text-gray-700 mb-6">Your OTP has expired. Please request a new one.</p>
            <button
              onClick={() => {
                setShowExpiredModal(false);
                navigate(`/bookings/${bookingId}`);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
            >
              Go Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripOTPPage;
