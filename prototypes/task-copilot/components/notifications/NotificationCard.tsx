"use client";

import { BellRing, Clock, Flame, Info } from "lucide-react";
import { Notification, NotificationType, NotificationIcon } from "@/lib/notification-types";
import { ActionableCard } from "@design-system/components";

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

// Icon colors by notification type
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

// Map section to ActionableCard appearance
function getAppearance(section: 'active' | 'missed' | 'upcoming' | 'past') {
  switch (section) {
    case 'active':
    case 'missed':
      return 'highlighted';
    case 'past':
      return 'muted';
    case 'upcoming':
    default:
      return 'default';
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
  const isUnread = notification.firedAt !== null && notification.acknowledgedAt === null;
  const isFired = notification.firedAt !== null;
  const isStartPoke = notification.type === 'start_poke';
  const isHighlighted = section === 'active' || section === 'missed';

  // Format: "Start at X" for pokes, regular title for others
  const timeStr = formatNotificationTime(notification.scheduledAt);
  const displayTitle = isStartPoke
    ? `Start "${notification.body}" at ${timeStr}`
    : notification.title;

  // Action buttons based on section
  const showActions = section === 'active' || section === 'missed' || section === 'upcoming';

  return (
    <ActionableCard
      appearance={getAppearance(section)}
      emphasis={section === 'active' ? 'primary' : 'secondary'}
      onClick={onTap}
    >
      <ActionableCard.Leading>
        {/* Icon - emoji for pokes, icon in circle for others */}
        {isStartPoke ? (
          <span className="text-lg leading-none" role="img" aria-label="Start poke">👉🏽</span>
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-700">
            <NotificationIconComponent icon={notification.icon} type={notification.type} />
          </div>
        )}
      </ActionableCard.Leading>

      <ActionableCard.Body>
        {/* Title with unread indicator */}
        <div className="flex items-center gap-2">
          <ActionableCard.Title className={isHighlighted ? 'text-violet-700 dark:text-violet-300' : ''}>
            {displayTitle}
          </ActionableCard.Title>
          {isUnread && (
            <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
          )}
        </div>

        {/* Body text for non-poke notifications */}
        {!isStartPoke && (
          <span className="text-sm text-fg-neutral-secondary truncate">
            {notification.body}
          </span>
        )}

        {/* Timestamp */}
        <ActionableCard.Meta>
          <span className="text-xs text-fg-neutral-soft">
            {isFired ? 'Fired' : section === 'missed' ? 'Missed' : 'Scheduled'}: {timeStr}
          </span>
        </ActionableCard.Meta>

        {/* Action buttons */}
        {showActions && (
          <ActionableCard.InlineActions>
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
          </ActionableCard.InlineActions>
        )}
      </ActionableCard.Body>
    </ActionableCard>
  );
}
