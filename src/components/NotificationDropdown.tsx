import React, { useState, useEffect, useMemo } from 'react';
import { useModal } from '../hooks/useModal';
import { 
  X, 
  Flame, 
  Bell, 
  Calendar, 
  Users, 
  Sparkles, 
  GraduationCap, 
  CheckCheck,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { NotificationItem } from '../types';
import { formatRelativeTime } from '../utils/campusTime';
import { useNow } from '../hooks/useNow';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onSelectNotification: (item: NotificationItem) => void;
  onMarkAllAsRead: () => void;
  onClearAll?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications = [],
  onSelectNotification,
  onMarkAllAsRead,
  onClearAll,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'urgent' | 'food' | 'reminders'>('all');
  const now = useNow();

  // Strict deduplication of notifications by ID and title to guarantee zero duplicates
  const uniqueNotifications = useMemo(() => {
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    const result: NotificationItem[] = [];

    for (const item of (notifications || [])) {
      if (!item || !item.id) continue;
      const key = `${item.id}-${item.title}`;
      if (seenIds.has(item.id) || seenTitles.has(key)) {
        continue;
      }
      seenIds.add(item.id);
      seenTitles.add(key);
      result.push(item);
    }
    return result;
  }, [notifications]);

  useModal(isOpen, onClose);

  if (!isOpen) return null;

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'food_drop':
        return <Flame className="w-4 h-4 text-amber-600" />;
      case 'reminder':
        return <Calendar className="w-4 h-4 text-brand-600" />;
      case 'club_broadcast':
        return <Users className="w-4 h-4 text-ink-700" />;
      case 'match_alert':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'faculty_note':
        return <GraduationCap className="w-4 h-4 text-ink-700" />;
      default:
        return <Bell className="w-4 h-4 text-ink-700" />;
    }
  };

  const filtered = (uniqueNotifications || []).filter((item) => {
    if (filterType === 'urgent') return item.urgent;
    if (filterType === 'food') return item.type === 'food_drop';
    if (filterType === 'reminders') return item.type === 'reminder' || item.type === 'faculty_note';
    return true;
  });

  const unreadCount = (uniqueNotifications || []).filter((n) => !n.isRead).length;

  return (
    <div 
      className="cc-overlay fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-ink-900/30 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Notifications"
        className="cc-dialog cc-dialog-side relative w-full max-w-sm sm:max-w-md bg-white border border-brand-200/90 rounded-2xl shadow-2xl overflow-hidden mt-12 text-ink-900 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-brand-50/70 border-b border-brand-200/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-ink-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-brand-200/90 text-brand-950">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-900 hover:text-brand-950 px-2 py-1 rounded-lg hover:bg-brand-100/60 transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark Read</span>
              </button>
            )}
            {onClearAll && uniqueNotifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                title="Clear all notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-ink-500 hover:text-ink-800 hover:bg-brand-100/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 px-3 py-2 bg-ink-50 border-b border-brand-100 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
              filterType === 'all'
                ? 'cc-btn-brand'
                : 'text-ink-600 hover:bg-ink-200/60'
            }`}
          >
            All ({uniqueNotifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('urgent')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
              filterType === 'urgent'
                ? 'cc-btn-brand'
                : 'text-ink-600 hover:bg-ink-200/60'
            }`}
          >
            ⚡ Urgent ({uniqueNotifications.filter((n) => n.urgent).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('food')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
              filterType === 'food'
                ? 'cc-btn-brand'
                : 'text-ink-600 hover:bg-ink-200/60'
            }`}
          >
            🍕 Food Drops ({uniqueNotifications.filter((n) => n.type === 'food_drop').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('reminders')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
              filterType === 'reminders'
                ? 'cc-btn-brand'
                : 'text-ink-600 hover:bg-ink-200/60'
            }`}
          >
            📅 Reminders
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-brand-100/70">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-ink-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-ink-300 stroke-[1.5]" />
              <p className="text-xs font-semibold text-ink-600">No notifications found</p>
              <p className="text-xs text-ink-400">You're all caught up with campus events and club news!</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectNotification(item)}
                className={`p-3.5 hover:bg-brand-50/50 transition-colors cursor-pointer flex gap-3 ${
                  !item.isRead ? 'bg-brand-50/30' : ''
                }`}
              >
                <div className="mt-0.5 w-8 h-8 rounded-xl bg-brand-100/80 border border-brand-200 flex items-center justify-center shrink-0">
                  {renderIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`text-xs font-bold truncate ${!item.isRead ? 'text-ink-900' : 'text-ink-700'}`}>
                      {item.title}
                    </h4>
                    <span className="text-2xs text-ink-400 shrink-0">
                      {formatRelativeTime(item.createdAt, item.timestamp, now)}
                    </span>
                  </div>

                  <p className="text-xs text-ink-600 line-clamp-2 leading-relaxed">
                    {item.body}
                  </p>

                  {item.urgent && (
                    <span className="inline-flex items-center gap-1 text-2xs font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                      Urgent
                    </span>
                  )}
                </div>

                {!item.isRead && (
                  <div className="w-2 h-2 rounded-full bg-brand-600 mt-2 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
