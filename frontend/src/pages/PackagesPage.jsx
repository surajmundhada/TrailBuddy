import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { guidePackagesAPI } from '../services/api';
import { defaultAvatarUrl, resolveMediaUrl } from '../utils/media';
import {
  MapPinIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  SparklesIcon,
  EyeSlashIcon,
  UsersIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

export default function PackagesPage() {
  const [cityFilter, setCityFilter] = useState('');
  const [sort, setSort] = useState('newest'); // newest | price-asc | price-desc

  const { data, isLoading, error } = useQuery(
    ['packages-explore'],
    () => guidePackagesAPI.explore().then((r) => r.data),
    { staleTime: 60_000 }
  );

  const packages = Array.isArray(data) ? data : [];

  const cities = useMemo(() => {
    const set = new Set(packages.map((p) => p.city).filter(Boolean));
    return Array.from(set).sort();
  }, [packages]);

  const filtered = useMemo(() => {
    let list = packages;
    if (cityFilter) {
      list = list.filter((p) => (p.city || '') === cityFilter);
    }
    const copy = [...list];
    if (sort === 'price-asc') copy.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    else if (sort === 'price-desc') copy.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    return copy;
  }, [packages, cityFilter, sort]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero — differentiation vs MMT/Airbnb */}
      <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-navy-800/90 via-navy-900 to-navy-950 p-6 sm:p-10 mb-8">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[radial-gradient(circle_at_20%_20%,#22d3ee,transparent_50%),radial-gradient(circle_at_80%_60%,#6366f1,transparent_45%)]" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400/90 mb-2">Not the usual sightseeing grid</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Hidden gems &amp; local secrets
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-3xl leading-relaxed">
            Like MakeMyTrip or Airbnb Experiences, but built for places <span className="text-slate-200 font-medium">most maps don&apos;t highlight</span>—back lanes,
            family-run kitchens, rooftop views, and stories only locals know. Each package blends a few known anchors with{' '}
            <span className="text-cyan-300/90">off-radar stops</span> your guide curates.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">City</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCityFilter('')}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                !cityFilter ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
              }`}
            >
              All
            </button>
            {cities.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCityFilter(c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  cityFilter === c ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-dark text-sm min-w-[160px]"
          >
            <option value="newest">Newest listed</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-16 justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-cyan-400" />
          Loading experiences…
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Could not load packages. Is the API running on port 8080?
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-sm">
          No packages match this filter yet. Guides add listings from their dashboard flow—check back soon.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((pkg) => (
          <article
            key={pkg.id}
            className="group flex flex-col rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden hover:border-cyan-500/25 hover:bg-white/[0.05] transition-all duration-300"
          >
            <div className="relative h-44 bg-gradient-to-br from-slate-800 to-navy-900 overflow-hidden">
              {pkg.guideImageUrl ? (
                <img
                  src={resolveMediaUrl(pkg.guideImageUrl)}
                  alt=""
                  className="h-full w-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center gap-1.5 text-[11px] text-cyan-300/90 font-medium">
                  <EyeSlashIcon className="h-3.5 w-3.5" />
                  Hidden-gem forward
                </div>
                <h2 className="text-lg font-bold text-white leading-snug line-clamp-2 mt-0.5">{pkg.title}</h2>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{pkg.description}</p>

              <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 mb-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/8 px-2 py-0.5">
                  <MapPinIcon className="h-3.5 w-3.5 text-cyan-500/80" />
                  {pkg.city}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/8 px-2 py-0.5">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {pkg.duration}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-emerald-300 font-semibold">
                  <CurrencyRupeeIcon className="h-3.5 w-3.5" />
                  {pkg.price}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 text-[11px] flex-1">
                <div>
                  <div className="text-slate-500 font-medium mb-1 flex items-center gap-1">
                    <SparklesIcon className="h-3.5 w-3.5 text-amber-400/80" />
                    Known anchors
                  </div>
                  <ul className="text-slate-400 space-y-0.5">
                    {(pkg.famousSpots || []).slice(0, 3).map((s) => (
                      <li key={s}>· {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-cyan-500/80 font-medium mb-1 flex items-center gap-1">
                    <EyeSlashIcon className="h-3.5 w-3.5" />
                    Lesser-known picks
                  </div>
                  <ul className="text-slate-300 space-y-0.5">
                    {(pkg.hiddenSpots || []).slice(0, 4).map((s) => (
                      <li key={s}>· {s}</li>
                    ))}
                  </ul>
                </div>
                {(pkg.foodPlaces || []).length > 0 && (
                  <div>
                    <div className="text-slate-500 font-medium mb-1">Food &amp; bites</div>
                    <p className="text-slate-400 line-clamp-2">{(pkg.foodPlaces || []).join(' · ')}</p>
                  </div>
                )}
                {(pkg.languages || []).length > 0 && (
                  <div className="text-[11px] text-slate-500">
                    <span className="text-slate-600 font-medium">Hosted in </span>
                    {(pkg.languages || []).join(' · ')}
                  </div>
                )}
                {pkg.meetingPoint ? (
                  <div className="text-[11px] text-slate-400 line-clamp-2">
                    <span className="text-slate-600 font-medium">Meet: </span>
                    {pkg.meetingPoint}
                  </div>
                ) : null}
                {(pkg.whatsIncluded || []).length > 0 && (
                  <div>
                    <div className="text-slate-500 font-medium mb-1 flex items-center gap-1">
                      <CheckBadgeIcon className="h-3.5 w-3.5 text-emerald-400/80" />
                      What&apos;s included
                    </div>
                    <ul className="text-slate-400 space-y-0.5 text-[11px]">
                      {(pkg.whatsIncluded || []).slice(0, 4).map((line) => (
                        <li key={line}>· {line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-white/10 overflow-hidden flex-shrink-0">
                    {pkg.guideImageUrl ? (
                      <img
                        src={resolveMediaUrl(pkg.guideImageUrl)}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = defaultAvatarUrl;
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-cyan-400 text-xs font-bold">
                        {(pkg.guideName || 'G')[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <UsersIcon className="h-3 w-3 text-cyan-500/70" />
                      Local host
                    </div>
                    <div className="text-sm font-medium text-slate-200 truncate">{pkg.guideName || 'Guide'}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Link
                    to={`/booking/${pkg.guideId}?package=${pkg.id}`}
                    className="btn-cyan text-xs font-semibold px-4 py-2 rounded-xl whitespace-nowrap text-center"
                  >
                    Book experience
                  </Link>
                  <Link
                    to={`/guides/${pkg.guideId}`}
                    className="text-xs font-semibold px-4 py-2 rounded-xl whitespace-nowrap border border-white/12 text-slate-200 hover:bg-white/5 transition-colors text-center"
                  >
                    View guide
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
