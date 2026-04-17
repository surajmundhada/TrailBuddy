import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TripCompletedPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8080/bookings/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBooking(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const reviewData = {
        bookingId,
        rating,
        reviewText,
        isPublic: true
      };

      const response = await axios.post(
        'http://localhost:8080/reviews/create',
        reviewData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('✓ Thank you! Your review has been submitted.');
      setReviewed(true);

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error submitting review');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="text-4xl font-bold mb-2 text-gray-800">Trip Completed!</h1>
          <p className="text-gray-600">Thank you for using LocalGuide</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Trip Summary */}
        {booking && !reviewed && (
          <>
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Trip Summary</h2>
                <div className="space-y-3 text-gray-700">
                  <div className="flex justify-between py-3 border-b">
                    <span>Guide:</span>
                    <span className="font-semibold">{booking.guide.name}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span>Date:</span>
                    <span className="font-semibold">{booking.startDate}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span>Amount Paid:</span>
                    <span className="font-semibold text-green-600">₹{booking.totalAmount}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span>Booking ID:</span>
                    <span className="font-semibold">{bookingId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Review Form */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Rate Your Experience</h2>
              <form onSubmit={handleSubmitReview} className="space-y-6">

                {/* Star Rating */}
                <div>
                  <label className="block text-lg font-medium mb-4 text-gray-700">How was your experience?</label>
                  <div className="flex gap-3 text-5xl">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition transform hover:scale-110"
                      >
                        <span className={
                          star <= (hoverRating || rating)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }>
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {rating === 1 && '😞 Poor'}
                    {rating === 2 && '😕 Fair'}
                    {rating === 3 && '😐 Good'}
                    {rating === 4 && '😊 Very Good'}
                    {rating === 5 && '😍 Excellent'}
                  </p>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700">Your Review (Optional)</label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience... (e.g., Guide was very knowledgeable, covered all the tourist spots, great food recommendations)"
                    rows="5"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    maxLength="500"
                  />
                  <p className="text-sm text-gray-500 mt-2">{reviewText.length}/500</p>
                </div>

                {/* Checkbox for Public Review */}
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                  <span className="ml-3 text-gray-700">Make this review public</span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : '✓ Submit Review'}
                </button>
              </form>
            </div>
          </>
        )}

        {reviewed && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">🙏</div>
              <h2 className="text-2xl font-bold text-gray-800">Thank You!</h2>
              <p className="text-gray-600">Your review helps us improve the service</p>
              <p className="text-gray-600">Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        {/* Additional Info Card */}
        <div className="bg-blue-50 rounded-lg shadow p-6 mb-6 border-l-4 border-blue-600">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">What's Next?</h3>
          <ul className="space-y-2 text-gray-700">
            <li>✓ Your payment has been processed</li>
            <li>✓ The guide will receive your tip if you added one</li>
            <li>✓ Your review will help other travellers choose the best guides</li>
            <li>✓ Check your email for an invoice</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/bookings')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            📋 View All Bookings
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripCompletedPage;
