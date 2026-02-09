"use client";

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export default function NotificationBadge({ count, className = "" }: NotificationBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <span
      className={`
        inline-flex items-center justify-center
        min-w-[18px] h-[18px] px-1
        text-xs font-medium
        bg-bg-accent-high text-fg-neutral-inverse-primary
        rounded-full
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
}
