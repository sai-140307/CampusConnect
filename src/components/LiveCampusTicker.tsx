import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, ChevronLeft, ChevronRight, Flame, Bell, Clock } from 'lucide-react';
import { NotificationItem } from '../types';
import { formatRelativeTime } from '../utils/dateSyncUtils';

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
  const [, setClockTick] = useState(0);

  // Sync relative time strings every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

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

  const relativeTime = current.createdAt
    ? formatRelativeTime(current.createdAt, current.timestamp)
    : current.timestamp || 'Just now';

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="bg-amber-50/95 dark:bg-slate-900/95 border-b border-amber-200/80 dark:border-slate-800 px-3 sm:px-4 py-2 text-stone-800 dark:text-slate-200 text-xs transition-colors shadow-2xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
        {/* Left Side: Live Badge + Dynamic Item */}
        <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-200/90 dark:bg-amber-500/20 text-amber-950 dark:text-amber-300 font-bold text-[11px]">
              {current.type === 'food_drop' ? (
                <Flame className="w-3 h-3 text-amber-700 dark:text-amber-400 fill-amber-700 dark:fill-amber-400" />
              ) : (
                <Zap className="w-3 h-3 text-amber-700 dark:text-amber-400 fill-amber-700 dark:fill-amber-400" />
              )}
              <span>Live Campus Alert</span>
            </span>

            {/* Live relative time */}
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-900/80 dark:text-slate-400 bg-amber-100/70 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              <Clock className="w-2.5 h-2.5" />
              {relativeTime}
            </span>
          </div>

          <p
            onClick={() => onSelectNotification(current)}
            className="truncate font-normal text-stone-800 dark:text-slate-200 cursor-pointer hover:text-orange-950 dark:hover:text-orange-400 transition-colors flex-1"
          >
            <span className="font-bold text-stone-950 dark:text-white">{current.title} — </span>
            <span className="text-stone-600 dark:text-slate-400">{current.body}</span>
          </p>
        </div>

        {/* Right Side: Carousel Controls & Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          {items.length > 1 && (
            <div className="hidden xs:flex items-center gap-1 bg-amber-100/60 dark:bg-slate-800 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-amber-900 dark:text-slate-300 border dark:border-slate-700">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous alert"
                className="p-0.5 rounded hover:bg-amber-200/80 dark:hover:bg-slate-700 text-amber-900 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="px-1 text-[10px]">
                {activeIndex + 1}/{items.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next alert"
                className="p-0.5 rounded hover:bg-amber-200/80 dark:hover:bg-slate-700 text-amber-900 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => onSelectNotification(current)}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 dark:text-orange-400 hover:text-orange-950 dark:hover:text-orange-300 px-2 py-0.5 rounded hover:bg-amber-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
