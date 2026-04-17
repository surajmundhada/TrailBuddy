import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TravellerPreferencesPage = () => {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    interests: [],
    excludedCategories: [],
    budgetMin: null,
    budgetMax: null,
    groupSize: 1,
    accessibilityNeeds: '',
    dietaryRestrictions: '',
    preferredPace: 'MODERATE',
    languagePreferences: '',
    specialRequests: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const interestOptions = [
    'Adventure',
    'Cultural',
    'Beach',
    'Hiking',
    'Food',
    'Art',
    'Wildlife',
    'Photography',
    'History',
    'Shopping',
    'Nightlife',
    'Religious'
  ];

  const categoryOptions = [
    'Museums',
    'Temples',
    'Shopping Malls',
    'Restaurants',
    'Bars',
    'Adventure Sports',
    'Crowded Places',
    'Tourist Traps'
  ];

  const paceOptions = [
    { value: 'SLOW', label: 'Slow & Leisurely' },
    { value: 'MODERATE', label: 'Moderate (Recommended)' },
    { value: 'FAST', label: 'Fast-Paced' }
  ];

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/preferences/get', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.preference) {
        setPreferences(response.data.preference);
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInterestToggle = (interest) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleExcludedCategoryToggle = (category) => {
    setPreferences(prev => ({
      ...prev,
      excludedCategories: prev.excludedCategories.includes(category)
        ? prev.excludedCategories.filter(c => c !== category)
        : [...prev.excludedCategories, category]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: name.includes('Min') || name.includes('Max') || name === 'groupSize'
        ? parseInt(value)
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8080/preferences/save',
        preferences,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('✓ Preferences saved successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">Travel Preferences</h1>
          <p className="text-gray-600 mb-8">Help us understand what you like to create personalized tour recommendations</p>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}
          {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Interests */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">What interests you?</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {interestOptions.map(interest => (
                  <label key={interest} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition">
                    <input
                      type="checkbox"
                      checked={preferences.interests.includes(interest)}
                      onChange={() => handleInterestToggle(interest)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3 text-gray-700">{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Excluded Categories */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">What don't you want to visit?</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categoryOptions.map(category => (
                  <label key={category} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-red-50 transition">
                    <input
                      type="checkbox"
                      checked={preferences.excludedCategories.includes(category)}
                      onChange={() => handleExcludedCategoryToggle(category)}
                      className="w-4 h-4 text-red-600"
                    />
                    <span className="ml-3 text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Budget and Group Size */}
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Budget Min (₹)</label>
                <input
                  type="number"
                  name="budgetMin"
                  value={preferences.budgetMin || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 5000"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Budget Max (₹)</label>
                <input
                  type="number"
                  name="budgetMax"
                  value={preferences.budgetMax || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 50000"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Group Size</label>
                <input
                  type="number"
                  name="groupSize"
                  value={preferences.groupSize}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Pace</label>
                <select
                  name="preferredPace"
                  value={preferences.preferredPace}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {paceOptions.map(pace => (
                    <option key={pace.value} value={pace.value}>{pace.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Language Preferences</label>
                <input
                  type="text"
                  name="languagePreferences"
                  value={preferences.languagePreferences}
                  onChange={handleInputChange}
                  placeholder="e.g., English, Hindi"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Dietary Restrictions</label>
                <input
                  type="text"
                  name="dietaryRestrictions"
                  value={preferences.dietaryRestrictions}
                  onChange={handleInputChange}
                  placeholder="e.g., Vegetarian, Vegan"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Accessibility Needs</label>
              <textarea
                name="accessibilityNeeds"
                value={preferences.accessibilityNeeds}
                onChange={handleInputChange}
                placeholder="e.g., Wheelchair accessible, No stairs..."
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Special Requests</label>
              <textarea
                name="specialRequests"
                value={preferences.specialRequests}
                onChange={handleInputChange}
                placeholder="Any special requests or requirements..."
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : '✓ Save Preferences'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TravellerPreferencesPage;
