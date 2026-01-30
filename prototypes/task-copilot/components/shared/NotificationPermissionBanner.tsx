"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import { requestNotificationPermission } from "@/lib/notifications";

interface NotificationPermissionBannerProps {
  onDismiss: () => void;
  onPermissionGranted?: () => void;
}

export default function NotificationPermissionBanner({
  onDismiss,
  onPermissionGranted,
}: NotificationPermissionBannerProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnable = async () => {
    setIsRequesting(true);
    const granted = await requestNotificationPermission();
    setIsRequesting(false);

    if (granted) {
      onPermissionGranted?.();
      onDismiss();
    }
  };

  return (
    <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg flex-shrink-0">
          <Bell size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-violet-900 dark:text-violet-100 mb-1">
            Enable Notifications
          </h3>
          <p className="text-xs text-violet-700 dark:text-violet-300 mb-3">
            Get reminders and start-time pokes to stay on track with your tasks.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnable}
              disabled={isRequesting}
              className="px-3 py-1.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {isRequesting ? "Requesting..." : "Enable"}
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-sm font-medium text-violet-700 dark:text-violet-300 hover:text-violet-900 dark:hover:text-violet-100 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-violet-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
