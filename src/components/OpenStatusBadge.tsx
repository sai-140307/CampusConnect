import React from 'react';
import { getOpenStatus } from '../utils/openHours';
import { useNow } from '../hooks/useNow';

const STYLES: Record<string, string> = {
  open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closing_soon: 'bg-amber-50 text-amber-800 border-amber-200',
  closed: 'bg-ink-100 text-ink-600 border-ink-200',
  unknown: 'bg-ink-100 text-ink-600 border-ink-200',
};
const DOTS: Record<string, string> = {
  open: 'bg-emerald-500',
  closing_soon: 'bg-amber-500',
  closed: 'bg-ink-400',
  unknown: 'bg-ink-400',
};

/** Live open/closed pill for a campus service, driven by the shared clock. */
export const OpenStatusBadge: React.FC<{ openHours: string; plain?: boolean }> = ({ openHours, plain }) => {
  const now = useNow();
  const status = getOpenStatus(openHours, now);

  if (plain) {
    return <span className={status.state === 'open' ? 'text-emerald-700' : status.state === 'closing_soon' ? 'text-amber-700' : 'text-ink-500'}>{status.label}</span>;
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border inline-flex items-center gap-1.5 tabular-nums ${STYLES[status.state]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOTS[status.state]}`} />
      {status.label}
    </span>
  );
};
