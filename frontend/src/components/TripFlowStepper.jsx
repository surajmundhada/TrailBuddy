import React, { useMemo } from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

/**
 * Uber/Rapido-style linear trip progress for live bookings.
 * @param {string} tripStatus - TripStatus enum value from API
 */
export default function TripFlowStepper({ tripStatus, className = '' }) {
  const steps = useMemo(
    () => [
      { id: 1, label: 'Booked' },
      { id: 2, label: 'En route' },
      { id: 3, label: 'Pickup OTP' },
      { id: 4, label: 'Trip live' },
      { id: 5, label: 'Done' },
    ],
    []
  );

  const current = useMemo(() => {
    const s = String(tripStatus || '').toUpperCase();
    if (s === 'TRIP_COMPLETED') return 5;
    if (s === 'TRIP_STARTED' || s === 'TRIP_ONGOING') return 4;
    if (s === 'READY_TO_START') return 3;
    if (s === 'AWAITING_OTP') return 3;
    if (s === 'GUIDE_EN_ROUTE') return 2;
    if (s === 'AWAITING_GUIDE') return 1;
    return 1;
  }, [tripStatus]);

  return (
    <div className={`rounded-2xl border border-white/8 bg-white/[0.03] p-4 ${className}`}>
      <div className="flex items-center w-full">
        {steps.map((step, idx) => {
          const n = step.id;
          const done = n < current;
          const active = n === current;
          const segmentDone = idx < steps.length - 1 && current > n;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center min-w-0 shrink-0">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors ${
                    done
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : active
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_0_3px_rgba(34,211,238,0.15)]'
                        : 'bg-white/5 border-white/15 text-slate-500'
                  }`}
                >
                  {done ? <CheckIcon className="h-4 w-4" /> : n}
                </div>
                <div
                  className={`mt-2 text-[10px] sm:text-[11px] font-medium text-center leading-tight px-0.5 max-w-[76px] sm:max-w-[88px] ${
                    active ? 'text-cyan-300' : done ? 'text-emerald-400/90' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 min-w-[6px] mx-1 mb-7 rounded-full transition-colors ${
                    segmentDone ? 'bg-emerald-500/45' : 'bg-white/10'
                  }`}
                  aria-hidden
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500 mt-3 text-center leading-relaxed">
        Flow: pay to confirm → guide heads to you → OTP handoff → trip goes live → end & rate (like Rapido/Uber).
      </p>
    </div>
  );
}
