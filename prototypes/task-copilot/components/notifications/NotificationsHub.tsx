"use client";

import { Bell } from "lucide-react";
import { Notification } from "@/lib/notification-types";
import { groupNotificationsByDate, getUnacknowledged, getUpcoming } from "@/lib/notification-utils";
import NotificationCard from "./NotificationCard";

interface NotificationsHubProps {
  notifications: Notification[];
  onNotificationTap: (notification: Notification) => void;
  onDismiss: (notificationId: string) => void;
}

export default function NotificationsHub({
  notifications,
  onNotificationTap,
  onDismiss,
}: NotificationsHubProps) {
  const groups = groupNotificationsByDate(notifications);
  const unacknowledgedCount = getUnacknowledged(notifications).length;
  const upcomingNotifications = getUpcoming(notifications);

  // Separate into upcoming and past
  const now = Date.now();
  const upcomingGroups = groups.filter(g => {
    const groupDate = new Date(g.date).getTime();
    return groupDate >= new Date().setHours(0, 0, 0, 0);
  });
  const pastGroups = groups.filter(g => {
    const groupDate = new Date(g.date).getTime();
    return groupDate < new Date().setHours(0, 0, 0, 0);
  });

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
      {/* Upcoming section */}
      {upcomingNotifications.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            Upcoming
          </h2>
          <div className="space-y-2">
            {upcomingNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onTap={() => onNotificationTap(notification)}
                onDismiss={() => onDismiss(notification.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past notifications by date */}
      {groups
        .filter(g => g.notifications.some(n => n.firedAt !== null))
        .map((group) => {
          const firedNotifications = group.notifications.filter(n => n.firedAt !== null);
          if (firedNotifications.length === 0) return null;

          return (
            <div key={group.date}>
              <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                {group.label}
              </h2>
              <div className="space-y-2">
                {firedNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onTap={() => onNotificationTap(notification)}
                    onDismiss={
                      notification.acknowledgedAt === null
                        ? () => onDismiss(notification.id)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
