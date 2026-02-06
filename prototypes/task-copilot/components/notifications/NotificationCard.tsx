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
  section?: 'active' | 'missed' | 'upcoming' | 'past';
}

// Icon component based on notification icon type
function NotificationIconComponent({ icon, type }: { icon: NotificationIcon; type: NotificationType }) {
  const iconColor = getIconColor(type);
  const iconSize = 18;

  switch (icon) {
    case 'bell-ring':
      return <BellRing size={iconSize} className={iconColor} />;
    case 'clock':
      return <Clock size={iconSize} className={iconColor} />;
    case 'flame':
      return <Flame size={iconSize} className={iconColor} />;
    case 'info':
    default:
      return <Info size={iconSize} className={iconColor} />;
  }
}

// Color scheme by section (active/missed get violet, others get standard task row styling)
function getSectionColors(section: 'active' | 'missed' | 'upcoming' | 'past'): {
  bg: string;
  border: string;
  icon: string;
  text: string;
  borderWidth: string;
} {
  switch (section) {
    case 'active':
      return {
        bg: 'bg-violet-50 dark:bg-violet-900/20',
        border: 'border-violet-300 dark:border-violet-700',
        icon: 'text-violet-500 dark:text-violet-400',
        text: 'text-violet-700 dark:text-violet-300',
        borderWidth: 'border-2',
      };
    case 'missed':
      return {
        bg: 'bg-violet-50 dark:bg-violet-900/20',
        border: 'border-violet-200 dark:border-violet-800',
        icon: 'text-violet-500 dark:text-violet-400',
        text: 'text-violet-700 dark:text-violet-300',
        borderWidth: 'border',
      };
    case 'upcoming':
    case 'past':
    default:
      return {
        bg: 'bg-zinc-50 dark:bg-zinc-800/80',
        border: 'border-border-color-neutral',
        icon: 'text-fg-neutral-secondary',
        text: 'text-fg-neutral-primary',
        borderWidth: 'border',
      };
  }
}

// Icon colors by notification type (separate from card styling)
function getIconColor(type: NotificationType): string {
  switch (type) {
    case 'start_poke':
      return 'text-violet-500 dark:text-violet-400';
    case 'streak':
      return 'text-orange-500 dark:text-orange-400';
    case 'reminder':
    case 'system':
    default:
      return 'text-fg-neutral-secondary';
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
  const sectionColors = getSectionColors(section);
  const isUnread = notification.firedAt !== null && notification.acknowledgedAt === null;
  const isFired = notification.firedAt !== null;
  const isStartPoke = notification.type === 'start_poke';
  const isHighlighted = section === 'active' || section === 'missed';

  // Format: "Start at X" for pokes, regular title for others
  const timeStr = formatNotificationTime(notification.scheduledAt);
  const displayTitle = isStartPoke
    ? `Start "${notification.body}" at ${timeStr}`
    : notification.title;

  return (
    <div
      onClick={onTap}
      className={`
        w-full text-left p-3 rounded-lg transition-colors cursor-pointer
        ${sectionColors.borderWidth} ${sectionColors.bg} ${sectionColors.border}
        hover:border-zinc-300 dark:hover:border-zinc-600
      `}
    >
      <div className="flex gap-3">
        {/* Icon - emoji for pokes, icon for others */}
        <div className={`flex-shrink-0 mt-0.5 ${isStartPoke ? '' : 'w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-700'}`}>
          {isStartPoke ? (
            <span className="text-lg leading-none" role="img" aria-label="Start poke">👉🏽</span>
          ) : (
            <NotificationIconComponent icon={notification.icon} type={notification.type} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isHighlighted ? sectionColors.text : 'text-fg-neutral-primary'}`}>
              {displayTitle}
            </span>
            {isUnread && (
              <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
            )}
          </div>
          {!isStartPoke && (
            <p className="text-sm text-fg-neutral-secondary truncate">
              {notification.body}
            </p>
          )}
          <span className="text-xs text-fg-neutral-soft mt-1 block">
            {isFired ? 'Fired' : section === 'missed' ? 'Missed' : 'Scheduled'}: {timeStr}
          </span>

          {/* Action buttons based on section */}
          {(section === 'active' || section === 'missed' || section === 'upcoming') && (
            <div className="flex items-center gap-1.5 mt-2">
              {onStart && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onStart(); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-900/10 dark:bg-white/10
                    text-fg-neutral-primary
                    hover:bg-zinc-900/20 dark:hover:bg-white/20
                    transition-colors"
                >
                  Start
                </button>
              )}
              {(section === 'active' || section === 'missed') && onSnooze && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSnooze(5); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-900/10 dark:bg-white/10
                    text-fg-neutral-primary
                    hover:bg-zinc-900/20 dark:hover:bg-white/20
                    transition-colors"
                >
                  Snooze 5m
                </button>
              )}
              {(section === 'active' || section === 'missed') && onDismiss && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-900/10 dark:bg-white/10
                    text-fg-neutral-primary
                    hover:bg-zinc-900/20 dark:hover:bg-white/20
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
                    bg-zinc-900/10 dark:bg-white/10
                    text-fg-neutral-primary
                    hover:bg-zinc-900/20 dark:hover:bg-white/20
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
