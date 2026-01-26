"use client";

import { Bell } from "lucide-react";
import { Notification } from "@/lib/notification-types";
import { groupNotificationsByDate, getUpcoming } from "@/lib/notification-utils";
import NotificationCard from "./NotificationCard";

interface NotificationsHubProps {
  notifications: Notification[];
  onNotificationTap: (notification: Notification) => void;
  onDismiss: (notificationId: string) => void;
  onStart?: (notification: Notification) => void;
  onSnooze?: (notificationId: string, minutes: number) => void;
  onCancel?: (notificationId: string) => void;
}

export default function NotificationsHub({
  notifications,
  onNotificationTap,
  onDismiss,
  onStart,
  onSnooze,
  onCancel,
}: NotificationsHubProps) {
  const groups = groupNotificationsByDate(notifications);
  const upcomingNotifications = getUpcoming(notifications);

  // Active: fired but not acknowledged (needs attention)
  const activeNotifications = notifications.filter(
    n => n.firedAt !== null && n.acknowledgedAt === null
  );

  const isEmpty = notifications.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <Bell size={32} className="text-zinc-400 dark:text-zinc-500" />
        </div>
        <h2 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          No notifications yet
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[280px]">
          Start Nudges and reminders will appear here when they're scheduled or triggered.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active section: fired but not acknowledged */}
      {activeNotifications.length > 0 && (
        <div>
          <h2 className="text-base font-medium text-violet-600 dark:text-violet-400 mb-3">
            Active
          </h2>
          <div className="space-y-2">
            {activeNotifications.map((notification) => (
              <div
                key={notification.id}
                className="ring-2 ring-violet-500/50 rounded-lg"
              >
                <NotificationCard
                  notification={notification}
                  section="active"
                  onTap={() => onNotificationTap(notification)}
                  onStart={onStart ? () => onStart(notification) : undefined}
                  onSnooze={onSnooze ? (mins) => onSnooze(notification.id, mins) : undefined}
                  onDismiss={() => onDismiss(notification.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming section */}
      {upcomingNotifications.length > 0 && (
        <div>
          <h2 className="text-base font-medium text-zinc-500 dark:text-zinc-400 mb-3">
            Upcoming
          </h2>
          <div className="space-y-2">
            {upcomingNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                section="upcoming"
                onTap={() => onNotificationTap(notification)}
                onStart={onStart ? () => onStart(notification) : undefined}
                onCancel={onCancel ? () => onCancel(notification.id) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past notifications by date (excluding active ones) */}
      {groups
        .filter(g => g.notifications.some(n => n.firedAt !== null && n.acknowledgedAt !== null))
        .map((group) => {
          // Only show acknowledged (dismissed) notifications in past section
          const acknowledgedNotifications = group.notifications.filter(
            n => n.firedAt !== null && n.acknowledgedAt !== null
          );
          if (acknowledgedNotifications.length === 0) return null;

          return (
            <div key={group.date}>
              <h2 className="text-base font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                {group.label}
              </h2>
              <div className="space-y-2">
                {acknowledgedNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    section="past"
                    onTap={() => onNotificationTap(notification)}
                  />
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
