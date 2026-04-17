import React, { useState } from 'react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SparklesIcon, MapPinIcon } from '@heroicons/react/24/outline';

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
      const localPlan = generateMockPlan(tripData);
      setPlan(localPlan);
    } catch (e) {
      setError('Failed to generate itinerary');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-primary-400 bg-clip-text text-transparent">
          AI Trip Planner
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          Get a personalized day-by-day itinerary curated for your Indian adventure.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Panel */}
        <div className="glass rounded-2xl border border-white/6 p-6">
          <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-cyan-400" />
            Plan details
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Destination</label>
              <input
                type="text"
                className="input-dark"
                value={tripData.destination}
                onChange={(e) => setTripData({ ...tripData, destination: e.target.value })}
                placeholder="e.g., Jaipur, Kerala, Varanasi"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Duration (days)</label>
                <input
                  type="number"
                  className="input-dark"
                  value={tripData.duration}
                  onChange={(e) => setTripData({ ...tripData, duration: e.target.value })}
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Travelers</label>
                <input
                  type="number"
                  className="input-dark"
                  value={tripData.travelers}
                  onChange={(e) => setTripData({ ...tripData, travelers: e.target.value })}
                  min={1}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Budget (₹)</label>
              <input
                type="number"
                className="input-dark"
                value={tripData.budget}
                onChange={(e) => setTripData({ ...tripData, budget: e.target.value })}
                placeholder="e.g., 15000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Preferences</label>
              <textarea
                className="input-dark resize-none"
                rows="3"
                value={tripData.preferences}
                onChange={(e) => setTripData({ ...tripData, preferences: e.target.value })}
                placeholder="Heritage, Food, Shopping, Adventure..."
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full btn-cyan font-semibold text-sm py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Generating…
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  Generate AI Itinerary
                </>
              )}
            </button>

            {normalizedRoles.includes('GUIDE') && (
              <p className="text-xs text-slate-500 text-center">
                Tip: Use this to plan guide availability for upcoming trips.
              </p>
            )}
          </form>
        </div>

        {/* Itinerary Panel */}
        <div className="glass rounded-2xl border border-white/6 p-6">
          <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-cyan-400" />
            Your Itinerary
          </h2>
          {!plan ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
                <SparklesIcon className="h-7 w-7 text-slate-600" />
              </div>
              <p className="text-slate-500 text-sm">Fill the form and click "Generate" to see your plan here.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Summary */}
              <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/15 p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">Destination</div>
                  <div className="font-semibold text-white">{plan.destination}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">Duration</div>
                  <div className="font-semibold text-white">{plan.days} days · {plan.travelers} travelers</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">Budget</div>
                  <div className="font-semibold text-cyan-400">{plan.estimatedBudget}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">Focus</div>
                  <div className="font-semibold text-white truncate">{plan.preferences}</div>
                </div>
              </div>

              {/* Day cards */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {plan.itinerary.map((d) => (
                  <div key={d.day} className="rounded-xl border border-white/8 bg-white/3 p-4">
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide mb-3">Day {d.day}</div>
                    <div className="space-y-2 text-xs text-slate-300">
                      <div><span className="font-semibold text-slate-200">🌅 Morning: </span>{d.morning}</div>
                      <div><span className="font-semibold text-slate-200">☀️ Afternoon: </span>{d.afternoon}</div>
                      <div><span className="font-semibold text-slate-200">🌙 Evening: </span>{d.evening}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiTripPlannerPage;
