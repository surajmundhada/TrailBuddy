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
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
    borderActive: 'ring-2 ring-slate-400',
    criteria: 'Trips < 30 OR earnings < ₹25,000',
    pricing: ['₹0 platform fee', '18% commission per booking'],
    highlightDefault: true,
    accentColor: 'from-slate-500/10 to-slate-600/5',
  },
  {
    id: 'PRO',
    name: 'Pro',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
    borderActive: 'ring-2 ring-cyan-500',
    criteria: 'Trips ≥ 30 OR earnings ≥ ₹25,000',
    pricing: ['₹1,500/month', '15% commission'],
    accentColor: 'from-cyan-500/10 to-cyan-600/5',
  },
  {
    id: 'ELITE',
    name: 'Elite',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    borderActive: 'ring-2 ring-amber-500',
    criteria: 'Trips ≥ 50 AND rating ≥ 4.5 AND reviews ≥ 20',
    pricing: ['₹1,800/month', '10% commission (minimum)'],
    perks: ['Priority listing', 'Top Guide badge', 'Premium user access', 'Higher visibility in search'],
    accentColor: 'from-amber-500/10 to-amber-600/5',
  },
];

function ProgressBar({ label, value }) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
        <span>{label}</span>
        <span className="font-medium text-slate-400">{v}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-primary-500 transition-all duration-700"
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
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-primary-400 bg-clip-text text-transparent">
          Earnings &amp; Levels
        </h1>
        <p className="mt-2 text-slate-400 max-w-2xl mx-auto text-sm">
          Grow your journey as a guide and unlock better earnings.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass rounded-2xl border border-white/6 p-6 text-center text-slate-500 text-sm mb-10 flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-cyan-400" />
          Loading your performance snapshot…
        </div>
      )}

      {/* Current Stage Panel */}
      {!loading && model && (
        <div className="mb-10 glass rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/5 to-primary-600/5 p-6">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <SparklesIcon className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Your current stage</h2>
            <span
              className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold border ${current === 'ELITE'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                : current === 'PRO'
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25'
                  : 'bg-slate-500/15 text-slate-300 border-slate-500/25'
                }`}
            >
              {current}
            </span>
            <span className="text-xs text-slate-400">
              • {model.commissionPercent}% commission on new bookings
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6">
            {[
              { label: 'Completed trips', value: model.tripsCompleted },
              { label: 'Earnings (tracked)', value: `₹${Number(model.totalEarnings).toLocaleString('en-IN')}` },
              { label: 'Avg. rating', value: `${Number(model.averageRating).toFixed(1)} ★` },
              { label: 'Reviews', value: model.totalReviews },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white/4 border border-white/6 p-3">
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className="text-lg font-bold text-white">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Progress</h3>
              <ProgressBar label="Trips (tier goals)" value={model.tripsProgressPercent} />
              {model.stage === 'BEGINNER' && (
                <ProgressBar label="Earnings toward Pro (₹25k)" value={model.earningsProgressPercent} />
              )}
              <ProgressBar label="Rating (Elite needs 4.5★)" value={model.ratingProgressPercent} />
              <ProgressBar label="Reviews (Elite needs 20)" value={model.reviewsProgressPercent} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Next Steps</h3>
              <ul className="space-y-2">
                {(model.progressHints || []).map((h, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-300">
                    <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stage Cards */}
      <div className="grid md:grid-cols-3 gap-5 mb-10">
        {STAGES.map((stage) => {
          const isCurrent = current && stage.id === current;
          const defaultHighlight = showStaticDefault && !current && stage.id === 'BEGINNER';
          const ringClass = isCurrent ? stage.borderActive : defaultHighlight ? 'ring-1 ring-white/15' : '';

          return (
            <div
              key={stage.id}
              className={`relative glass rounded-2xl border border-white/6 p-6 flex flex-col bg-gradient-to-br ${stage.accentColor} ${ringClass}`}
            >
              {(isCurrent || defaultHighlight) && (
                <span className="absolute -top-3 left-4 inline-flex rounded-full bg-primary-600 px-3 py-0.5 text-xs font-semibold text-white shadow">
                  {isCurrent ? 'Your stage' : 'Default'}
                </span>
              )}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{stage.name}</h3>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${stage.badgeClass}`}>
                  {stage.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">{stage.criteria}</p>
              <ul className="space-y-2 mb-4 flex-1">
                {stage.pricing.map((line) => (
                  <li key={line} className="flex gap-2 text-sm text-slate-300">
                    <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-cyan-400 mt-0.5" />
                    {line}
                  </li>
                ))}
                {stage.id === 'BEGINNER' && (
                  <li className="text-xs font-semibold text-cyan-400 mt-1">Best for onboarding — no monthly fee</li>
                )}
              </ul>
              {stage.perks && (
                <ul className="border-t border-white/8 pt-4 space-y-1.5">
                  <li className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Perks</li>
                  {stage.perks.map((p) => (
                    <li key={p} className="text-xs text-amber-300 flex gap-2">
                      <SparklesIcon className="h-3.5 w-3.5 flex-shrink-0 text-amber-400 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Upgrade Benefits */}
      {model?.upgradeBenefits?.length > 0 && (
        <div className="glass rounded-2xl border border-white/6 p-6 mb-8">
          <h3 className="text-base font-semibold text-white mb-3">Upgrade Benefits</h3>
          <ul className="space-y-2">
            {model.upgradeBenefits.map((b, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <InformationCircleIcon className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Why this works */}
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 p-5">
        <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
          <InformationCircleIcon className="h-4 w-4 text-slate-500" />
          Why this works
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Stages reward consistency: <strong className="text-slate-300">Beginner</strong> keeps fees low so you can build trust.{' '}
          <strong className="text-slate-300">Pro</strong> unlocks when volume or earnings show you are active.{' '}
          <strong className="text-slate-300">Elite</strong> requires strong social proof (rating + reviews) and high trip volume — so
          travellers see verified top guides first. Commissions fund platform safety, support, and payouts.
        </p>
      </div>
    </div>
  );
}
