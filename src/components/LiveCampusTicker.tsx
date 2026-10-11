import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, ChevronLeft, ChevronRight, Flame, Bell, Clock } from 'lucide-react';
import { NotificationItem } from '../types';
import { formatRelativeTime } from '../utils/campusTime';
import { useNow } from '../hooks/useNow';

interface LiveCampusTickerProps {
  notifications: NotificationItem[];
  onSelectNotification: (notif: NotificationItem) => void;
}

export const LiveCampusTicker: React.FC<LiveCampusTickerProps> = ({
  notifications,
  onSelectNotification,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const now = useNow();

  // Filter valid notifications
  const items = notifications.length > 0 ? notifications : [];

  // Auto rotate every 6.5s when not hovered
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6500);

    return () => clearInterval(interval);
  }, [items.length, isPaused]);

  if (items.length === 0) return null;

  const activeIndex = currentIndex % items.length;
  const current = items[activeIndex] || items[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const relativeTime = formatRelativeTime(current.createdAt, current.timestamp || 'Just now', now);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="bg-amber-50/95 border-b border-amber-200/80 px-3 sm:px-4 py-2 text-ink-800 text-xs transition-colors shadow-2xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
        {/* Left Side: Live Badge + Dynamic Item */}
        <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-200/90 text-amber-950 font-bold text-xs">
              {current.type === 'food_drop' ? (
                <Flame className="w-3 h-3 text-amber-700 fill-amber-700" />
              ) : (
                <Zap className="w-3 h-3 text-amber-700 fill-amber-700" />
              )}
              <span>Campus alert</span>
            </span>

            {/* Live relative time */}
            <span className="hidden sm:inline-flex items-center gap-1 text-2xs text-amber-900/80 bg-amber-100/70 px-1.5 py-0.5 rounded">
              <Clock className="w-2.5 h-2.5" />
              {relativeTime}
            </span>
          </div>

          <p
            key={current.id}
            onClick={() => onSelectNotification(current)}
            className="cc-ticker-item truncate font-normal text-ink-800 cursor-pointer hover:text-brand-950 transition-colors flex-1"
          >
            <span className="font-bold text-ink-950">{current.title} — </span>
            <span className="text-ink-600">{current.body}</span>
          </p>
        </div>

        {/* Right Side: Carousel Controls & Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          {items.length > 1 && (
            <div className="hidden sm:flex items-center gap-1 bg-amber-100/60 rounded-md px-1.5 py-0.5 text-xs font-semibold text-amber-900 border">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous alert"
                className="p-0.5 rounded hover:bg-amber-200/80 text-amber-900 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="px-1 text-2xs">
                {activeIndex + 1}/{items.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next alert"
                className="p-0.5 rounded hover:bg-amber-200/80 text-amber-900 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => onSelectNotification(current)}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-brand-950 px-2 py-0.5 rounded hover:bg-amber-200/50 transition-colors cursor-pointer"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
