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
    <div className="bg-bg-accent-subtle border border-border-accent rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-bg-accent-subtle rounded-lg flex-shrink-0">
          <Bell size={20} className="text-fg-accent-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-fg-accent-primary mb-1">
            Enable Notifications
          </h3>
          <p className="text-xs text-fg-accent-primary mb-3">
            Get reminders and start-time pokes to stay on track with your tasks.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnable}
              disabled={isRequesting}
              className="px-3 py-1.5 text-sm font-medium text-fg-neutral-inverse-primary bg-bg-accent-high hover:bg-bg-accent-high-hover disabled:opacity-50 rounded-lg transition-colors"
            >
              {isRequesting ? "Requesting..." : "Enable"}
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-sm font-medium text-fg-accent-primary hover:text-fg-accent-primary transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-fg-accent-secondary hover:text-fg-accent-primary transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
