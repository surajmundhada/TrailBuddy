import React, { useState } from 'react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const generateMockPlan = ({ destination, duration, budget, travelers, preferences }) => {
  const days = Math.max(1, parseInt(duration || '1', 10) || 1);
  const travelerCount = Math.max(1, parseInt(travelers || '1', 10) || 1);
  const budgetNum = parseInt(budget || '0', 10) || 0;

  const pref = preferences?.trim()
    ? preferences.trim()
    : 'a balanced mix of sightseeing and local experiences';

  const d = String(destination || '').trim();
  const destLower = d.toLowerCase();

  const cityPresets = {
    delhi: {
      neighborhoods: ['Old Delhi', 'New Delhi', 'Hauz Khas', 'Mehrauli', 'Connaught Place'],
      morningSpots: ['heritage walk', 'coffee + local bakery', 'history museum loop', 'temple & lanes'],
      eveningSpots: ['street food crawl', 'sunset viewpoint', 'night market vibes', 'cultural performance'],
      afternoonSpots: ['craft bazaar browsing', 'guided monuments tour', 'art gallery + snack breaks', 'park relax time'],
    },
    mumbai: {
      neighborhoods: ['Colaba', 'Fort', 'Bandra', 'Juhu', 'Marine Drive'],
      morningSpots: ['sea-breeze breakfast', 'heritage photo walk', 'local café hop', 'market stroll'],
      eveningSpots: ['street food crawl', 'sea promenade sunset', 'live music evening', 'night snack trail'],
      afternoonSpots: ['art & architecture stop', 'local craft shopping', 'waterfront lunch + walk', 'neighborhood food tasting'],
    },
    jaipur: {
      neighborhoods: ['Pink City', 'Amer', 'Jantar Mantar area', 'C-Scheme', 'Bapu Nagar'],
      morningSpots: ['fort-photo morning', 'local jalebi break + lanes', 'museum circuit', 'craft workshop visit'],
      eveningSpots: ['sunset at viewpoint', 'food trail', 'folk music session', 'night bazaar browse'],
      afternoonSpots: ['heritage storytelling tour', 'stepwell + snack stop', 'jewelry & textile shopping', 'slow city stroll'],
    },
  };

  const preset =
    Object.entries(cityPresets).find(([k]) => destLower.includes(k))?.[1] || {
      neighborhoods: ['Central District', 'Old Town', 'Riverside', 'Local Market Area', 'City Park'],
      morningSpots: ['local market warm-up', 'heritage stop', 'scenic walk', 'museum starter'],
      afternoonSpots: ['curated experiences', 'cafes + shopping', 'guided tour', 'relax break'],
      eveningSpots: ['food trail', 'night market vibes', 'sunset viewpoint', 'cultural show'],
    };

  const dayBlocks = Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    const area = preset.neighborhoods[(day - 1) % preset.neighborhoods.length];
    const morningSpot = preset.morningSpots[(day - 1) % preset.morningSpots.length];
    const afternoonSpot = preset.afternoonSpots[(day - 1) % preset.afternoonSpots.length];
    const eveningSpot = preset.eveningSpots[(day - 1) % preset.eveningSpots.length];

    return {
      day,
      morning: `Day ${day}: ${d} (${area}) - ${morningSpot}`,
      afternoon: `Day ${day}: ${afternoonSpot} + ${pref} ideas (for ${travelerCount} travelers)`,
      evening: `Day ${day}: ${eveningSpot} + short relax time`,
    };
  });

  return {
    destination: d,
    days,
    travelers: travelerCount,
    estimatedBudget: budgetNum ? `Approx. ₹${budgetNum.toLocaleString()}` : 'Budget not provided',
    preferences: pref,
    itinerary: dayBlocks,
  };
};

const AiTripPlannerPage = () => {
  const { user } = useAuth();
  const normalizedRoles = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean)
    : [];

  const [tripData, setTripData] = useState({
    destination: '',
    duration: '3',
    budget: '',
    travelers: '2',
    preferences: '',
  });
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    try {
      // Backend AI endpoints may not be wired; we still generate a usable plan locally.
      // If you later enable backend AI, this can call aiAPI.generateTripPlan().
      const localPlan = generateMockPlan(tripData);
      setPlan(localPlan);
    } catch (e) {
      setError('Failed to generate itinerary');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Trip Planner</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Destination</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={tripData.destination}
                  onChange={(e) => setTripData({ ...tripData, destination: e.target.value })}
                  placeholder="e.g., Jaipur, Kerala, Varanasi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (days)</label>
                <input
                  type="number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={tripData.duration}
                  onChange={(e) => setTripData({ ...tripData, duration: e.target.value })}
                  min={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Budget (₹)</label>
                <input
                  type="number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={tripData.budget}
                  onChange={(e) => setTripData({ ...tripData, budget: e.target.value })}
                  placeholder="e.g., 15000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Number of Travelers</label>
                <input
                  type="number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={tripData.travelers}
                  onChange={(e) => setTripData({ ...tripData, travelers: e.target.value })}
                  min={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Preferences</label>
                <textarea
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  value={tripData.preferences}
                  onChange={(e) => setTripData({ ...tripData, preferences: e.target.value })}
                  placeholder="Heritage, Food, Shopping, Adventure..."
                />
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate AI Itinerary'}
              </button>

              {normalizedRoles.includes('GUIDE') && (
                <p className="text-xs text-gray-500">
                  Tip: As a guide, you can use your itinerary to plan guide availability (UI is minimal for now).
                </p>
              )}
            </form>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Itinerary</h2>
            {!plan ? (
              <p className="text-gray-600">Fill the form and click “Generate” to see a plan here.</p>
            ) : (
              <div className="space-y-5">
                <div className="text-sm text-gray-700">
                  <div><span className="font-medium">Destination:</span> {plan.destination}</div>
                  <div><span className="font-medium">Trip:</span> {plan.days} days for {plan.travelers} travelers</div>
                  <div><span className="font-medium">Budget:</span> {plan.estimatedBudget}</div>
                  <div><span className="font-medium">Preferences:</span> {plan.preferences}</div>
                </div>

                <div className="space-y-4">
                  {plan.itinerary.map((d) => (
                    <div key={d.day} className="border rounded-md p-4">
                      <div className="font-medium text-gray-900 mb-2">Day {d.day}</div>
                      <div className="text-sm text-gray-700">
                        <div className="mb-1"><span className="font-medium">Morning:</span> {d.morning}</div>
                        <div className="mb-1"><span className="font-medium">Afternoon:</span> {d.afternoon}</div>
                        <div><span className="font-medium">Evening:</span> {d.evening}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiTripPlannerPage;

