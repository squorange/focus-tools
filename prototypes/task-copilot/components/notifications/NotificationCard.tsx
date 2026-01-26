"use client";

import { BellRing, Clock, Flame, Info } from "lucide-react";
import { Notification, NotificationType, NotificationIcon } from "@/lib/notification-types";

interface NotificationCardProps {
  notification: Notification;
  onTap: () => void;
  onDismiss?: () => void;
  onStart?: () => void;
  onSnooze?: (minutes: number) => void;
  onCancel?: () => void;
  section?: 'active' | 'upcoming' | 'past';
}

// Icon component based on notification icon type
function NotificationIconComponent({ icon, type }: { icon: NotificationIcon; type: NotificationType }) {
  const colorClasses = getColorClasses(type);
  const iconSize = 18;

  switch (icon) {
    case 'bell-ring':
      return <BellRing size={iconSize} className={colorClasses.icon} />;
    case 'clock':
      return <Clock size={iconSize} className={colorClasses.icon} />;
    case 'flame':
      return <Flame size={iconSize} className={colorClasses.icon} />;
    case 'info':
    default:
      return <Info size={iconSize} className={colorClasses.icon} />;
  }
}

// Color scheme by notification type
function getColorClasses(type: NotificationType): { bg: string; border: string; icon: string; text: string } {
  switch (type) {
    case 'start_poke':
      return {
        bg: 'bg-violet-50 dark:bg-violet-900/20',
        border: 'border-violet-200 dark:border-violet-800',
        icon: 'text-violet-500 dark:text-violet-400',
        text: 'text-violet-700 dark:text-violet-300',
      };
    case 'streak':
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        icon: 'text-orange-500 dark:text-orange-400',
        text: 'text-orange-700 dark:text-orange-300',
      };
    case 'reminder':
    case 'system':
    default:
      return {
        bg: 'bg-zinc-50 dark:bg-zinc-800/80',
        border: 'border-zinc-200 dark:border-zinc-700',
        icon: 'text-zinc-500 dark:text-zinc-400',
        text: 'text-zinc-700 dark:text-zinc-300',
      };
  }
}

// Format time for display (e.g., "2:30 PM" or "Tomorrow 9:00 AM")
function formatNotificationTime(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const notifDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (notifDay.getTime() === today.getTime()) {
    return timeStr;
  } else if (notifDay.getTime() === tomorrow.getTime()) {
    return `Tomorrow ${timeStr}`;
  } else {
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return `${dateStr} ${timeStr}`;
  }
}

export default function NotificationCard({
  notification,
  onTap,
  onDismiss,
  onStart,
  onSnooze,
  onCancel,
  section = 'active',
}: NotificationCardProps) {
  const colors = getColorClasses(notification.type);
  const isUnread = notification.firedAt !== null && notification.acknowledgedAt === null;
  const isFired = notification.firedAt !== null;
  const isStartPoke = notification.type === 'start_poke';

  // Format: "Start at X" for pokes, regular title for others
  const timeStr = formatNotificationTime(notification.scheduledAt);
  const displayTitle = isStartPoke
    ? `Start "${notification.body}" at ${timeStr}`
    : notification.title;

  return (
    <div
      onClick={onTap}
      className={`
        w-full text-left p-3 rounded-lg border transition-colors cursor-pointer
        ${colors.bg} ${colors.border}
        hover:border-zinc-300 dark:hover:border-zinc-600
      `}
    >
      <div className="flex gap-3">
        {/* Icon - emoji for pokes, icon for others */}
        <div className={`flex-shrink-0 mt-0.5 ${isStartPoke ? '' : `w-8 h-8 rounded-full flex items-center justify-center ${colors.bg}`}`}>
          {isStartPoke ? (
            <span className="text-lg leading-none" role="img" aria-label="Start poke">👉🏽</span>
          ) : (
            <NotificationIconComponent icon={notification.icon} type={notification.type} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${colors.text}`}>
              {displayTitle}
            </span>
            {isUnread && (
              <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
            )}
          </div>
          {!isStartPoke && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
              {notification.body}
            </p>
          )}
          <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 block">
            {isFired ? 'Fired' : 'Scheduled'}: {timeStr}
          </span>

          {/* Action buttons based on section */}
          {(section === 'active' || section === 'upcoming') && (
            <div className="flex items-center gap-1.5 mt-2">
              {onStart && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onStart(); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-100 dark:bg-zinc-800
                    text-zinc-700 dark:text-zinc-300
                    hover:bg-zinc-200 dark:hover:bg-zinc-700
                    transition-colors"
                >
                  Start
                </button>
              )}
              {section === 'active' && onSnooze && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSnooze(5); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-100 dark:bg-zinc-800
                    text-zinc-700 dark:text-zinc-300
                    hover:bg-zinc-200 dark:hover:bg-zinc-700
                    transition-colors"
                >
                  Snooze 5m
                </button>
              )}
              {section === 'active' && onDismiss && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-100 dark:bg-zinc-800
                    text-zinc-700 dark:text-zinc-300
                    hover:bg-zinc-200 dark:hover:bg-zinc-700
                    transition-colors"
                >
                  Dismiss
                </button>
              )}
              {section === 'upcoming' && onCancel && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onCancel(); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-100 dark:bg-zinc-800
                    text-zinc-700 dark:text-zinc-300
                    hover:bg-zinc-200 dark:hover:bg-zinc-700
                    transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
