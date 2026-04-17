import React from 'react';
import {
  CheckCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const STAGES = [
  {
    id: 'BEGINNER',
    name: 'Beginner',
    badgeClass: 'bg-gray-100 text-gray-800 ring-gray-200',
    borderActive: 'ring-2 ring-gray-400 shadow-lg',
    criteria: 'Trips < 30 OR earnings < ₹25,000',
    pricing: ['₹0 platform fee', '18% commission per booking'],
    highlightDefault: true,
  },
  {
    id: 'PRO',
    name: 'Pro',
    badgeClass: 'bg-blue-100 text-blue-800 ring-blue-200',
    borderActive: 'ring-2 ring-blue-500 shadow-lg',
    criteria: 'Trips ≥ 30 OR earnings ≥ ₹25,000',
    pricing: ['₹500 (first month)', '₹1,500/month after', '15% commission'],
  },
  {
    id: 'ELITE',
    name: 'Elite',
    badgeClass: 'bg-amber-100 text-amber-900 ring-amber-300',
    borderActive: 'ring-2 ring-amber-500 shadow-xl',
    criteria: 'Trips ≥ 50 AND rating ≥ 4.5 AND reviews ≥ 20',
    pricing: ['₹1,800/month', '10% commission (minimum)'],
    perks: [
      'Priority listing',
      'Top Guide badge',
      'Premium user access',
      'Higher visibility in search',
    ],
  },
];

function ProgressBar({ label, value }) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span>{v}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-600 transition-all duration-500"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

/**
 * @param {{ model?: object | null, loading?: boolean, showStaticDefault?: boolean }} props
 */
export default function RevenueModelSection({ model, loading, showStaticDefault = true }) {
  const current = model?.stage || null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Revenue model</h1>
        <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
          Three performance-based stages with transparent commissions. New guides start on{' '}
          <span className="font-medium text-gray-800">Beginner</span> — zero platform fee while you grow.
        </p>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500 mb-10">
          Loading your performance snapshot…
        </div>
      )}

      {!loading && model && (
        <div className="mb-10 rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <SparklesIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Your current stage</h2>
            <span
              className={`inline-flex items-center rounded-full px-3 py-0.5 text-sm font-medium ${
                current === 'ELITE'
                  ? 'bg-amber-100 text-amber-900'
                  : current === 'PRO'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-200 text-gray-800'
              }`}
            >
              {current}
            </span>
            <span className="text-sm text-gray-600">
              • {model.commissionPercent}% commission on new bookings
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6">
            <div>
              <div className="text-gray-500">Completed trips</div>
              <div className="text-xl font-semibold text-gray-900">{model.tripsCompleted}</div>
            </div>
            <div>
              <div className="text-gray-500">Earnings (tracked)</div>
              <div className="text-xl font-semibold text-gray-900">
                ₹{Number(model.totalEarnings).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Avg. rating</div>
              <div className="text-xl font-semibold text-gray-900">
                {Number(model.averageRating).toFixed(1)} ★
              </div>
            </div>
            <div>
              <div className="text-gray-500">Reviews</div>
              <div className="text-xl font-semibold text-gray-900">{model.totalReviews}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-800 mb-3">Progress</h3>
              <ProgressBar label="Trips (tier goals)" value={model.tripsProgressPercent} />
              {model.stage === 'BEGINNER' && (
                <ProgressBar label="Earnings toward Pro (₹25k)" value={model.earningsProgressPercent} />
              )}
              <ProgressBar label="Rating (Elite needs 4.5★)" value={model.ratingProgressPercent} />
              <ProgressBar label="Reviews (Elite needs 20)" value={model.reviewsProgressPercent} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-800 mb-2">Next steps</h3>
              <ul className="space-y-2">
                {(model.progressHints || []).map((h, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-600" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {STAGES.map((stage) => {
          const isCurrent = current && stage.id === current;
          const defaultHighlight = showStaticDefault && !current && stage.id === 'BEGINNER';
          const ring = isCurrent ? stage.borderActive : defaultHighlight ? 'ring-1 ring-gray-300' : '';

          return (
            <div
              key={stage.id}
              className={`relative rounded-2xl border border-gray-200 bg-white p-6 flex flex-col ${ring}`}
            >
              {(isCurrent || defaultHighlight) && (
                <span className="absolute -top-3 left-4 inline-flex rounded-full bg-primary-600 px-3 py-0.5 text-xs font-semibold text-white shadow">
                  {isCurrent ? 'Your stage' : 'Default'}
                </span>
              )}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{stage.name}</h3>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${stage.badgeClass}`}
                >
                  {stage.name}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">{stage.criteria}</p>
              <ul className="space-y-2 mb-4 flex-1">
                {stage.pricing.map((line) => (
                  <li key={line} className="flex gap-2 text-sm text-gray-700">
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-primary-500" />
                    {line}
                  </li>
                ))}
                {stage.id === 'BEGINNER' && (
                  <li className="text-sm font-medium text-primary-700">Best for onboarding — no monthly fee</li>
                )}
              </ul>
              {stage.perks && (
                <ul className="border-t border-gray-100 pt-4 space-y-1">
                  <li className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Perks</li>
                  {stage.perks.map((p) => (
                    <li key={p} className="text-sm text-amber-900 flex gap-2">
                      <SparklesIcon className="h-4 w-4 flex-shrink-0 text-amber-600" />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {model?.upgradeBenefits?.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 mb-10">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Upgrade benefits</h3>
          <ul className="space-y-2">
            {model.upgradeBenefits.map((b, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <InformationCircleIcon className="h-5 w-5 text-primary-600 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-dashed border-gray-300 bg-white/80 p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <InformationCircleIcon className="h-5 w-5 text-gray-500" />
          Why this works
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          Stages reward consistency: <strong>Beginner</strong> keeps fees low so you can build trust.{' '}
          <strong>Pro</strong> unlocks when volume or earnings show you are active.{' '}
          <strong>Elite</strong> requires strong social proof (rating + reviews) and high trip volume — so
          travellers see verified top guides first. Commissions fund platform safety, support, and payouts.
        </p>
      </div>
    </div>
  );
}
