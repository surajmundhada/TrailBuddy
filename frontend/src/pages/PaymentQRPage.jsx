import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'qrcode.react';

const PaymentQRPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, paid, failed

  useEffect(() => {
    fetchQRCode();
  }, [bookingId]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8080/payment-qr/generate/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setQrCode(response.data.qrCode);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Booking not found');
      } else {
        setError(err.response?.data?.error || 'Error generating QR code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkScanned = async () => {
    if (!paymentMethod) {
      setError('Please select payment method');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8080/payment-qr/mark-scanned/${qrCode.qrCodeId}`,
        { paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('✓ QR Code scanned! Processing payment...');
      setShowPaymentForm(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error marking as scanned');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!transactionId) {
      setError('Please enter transaction ID');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8080/payment-qr/mark-paid/${qrCode.qrCodeId}`,
        { transactionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('✓ Payment successful! Redirecting...');
      setPaymentStatus('paid');

      setTimeout(() => {
        navigate(`/trip-otp/${bookingId}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFailed = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8080/payment-qr/mark-failed/${qrCode.qrCodeId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setError('Payment marked as failed. Please try again.');
      setPaymentStatus('failed');
      setShowPaymentForm(false);
      setPaymentMethod('');
      setTransactionId('');
    } catch (err) {
      setError('Error processing failed payment');
    }
  };

  if (loading && !qrCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Generating QR Code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8 text-center">
          <h1 className="text-3xl font-bold mb-2">💳 Payment</h1>
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

          {/* Amount Display */}
          {qrCode && (
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-300 text-center">
              <p className="text-gray-700 text-sm mb-2">Amount to Pay</p>
              <p className="text-4xl font-bold text-blue-600">₹{qrCode.amount}</p>
              <p className="text-gray-500 text-sm mt-2">Status: {qrCode.status}</p>
            </div>
          )}

          {/* QR Code Display */}
          {qrCode && paymentStatus === 'pending' && !showPaymentForm && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-700 font-semibold mb-4">📱 Scan with any UPI/Payment App</p>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <QRCode
                    value={qrCode.qrCodeData}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700">Select Payment Method</label>
                <div className="space-y-2">
                  {['UPI', 'CARD', 'WALLET'].map(method => (
                    <label key={method} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-3 text-gray-700 font-medium">
                        {method === 'UPI' && '📱 UPI'}
                        {method === 'CARD' && '💳 Credit/Debit Card'}
                        {method === 'WALLET' && '👛 Digital Wallet'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleMarkScanned}
                disabled={loading || !paymentMethod}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : '✓ Proceed with Payment'}
              </button>
            </div>
          )}

          {/* Payment Processing Form */}
          {showPaymentForm && paymentStatus === 'pending' && (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  📲 Complete the payment on your {paymentMethod} app and copy the transaction ID
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g., TXN123456789"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                <p className="text-sm text-yellow-800">
                  ⏱️ QR expires at: {new Date(qrCode.qrExpiry).toLocaleTimeString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="submit"
                  disabled={loading || !transactionId}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : '✓ Payment Done'}
                </button>
                <button
                  type="button"
                  onClick={handlePaymentFailed}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  ✕ Failed
                </button>
              </div>
            </form>
          )}

          {/* Payment Status Success */}
          {paymentStatus === 'paid' && (
            <div className="text-center space-y-4">
              <div className="text-6xl">✓</div>
              <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
              <p className="text-gray-600">Redirecting to trip verification...</p>
            </div>
          )}

          {/* Payment Status Failed */}
          {paymentStatus === 'failed' && (
            <div className="text-center space-y-4">
              <div className="text-6xl">✕</div>
              <h2 className="text-2xl font-bold text-red-600">Payment Failed</h2>
              <p className="text-gray-600">Please try again with another payment method</p>
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentQRPage;
