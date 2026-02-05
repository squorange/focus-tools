'use client';

export interface ProgressRingProps {
  /** Number of completed steps/items */
  completed: number;
  /** Total number of steps/items */
  total: number;
  /** Whether the task is fully complete (shows checkmark) */
  isComplete?: boolean;
  /** Visual variant: solid shows progress arc, dashed shows fully dashed circle */
  variant?: 'solid' | 'dashed';
  /** Size in pixels */
  size?: number;
  /** Custom className */
  className?: string;
}

/**
 * ProgressRing - A circular progress indicator for task completion.
 *
 * Shows step progress as a circular arc, or a checkmark when complete.
 *
 * @example
 * ```tsx
 * // Task with 3 of 5 steps complete
 * <ProgressRing completed={3} total={5} />
 *
 * // Completed task (shows checkmark)
 * <ProgressRing completed={5} total={5} isComplete />
 *
 * // Dashed variant (for triage/inbox items)
 * <ProgressRing completed={0} total={0} variant="dashed" />
 * ```
 */
export function ProgressRing({
  completed,
  total,
  isComplete = false,
  variant = 'solid',
  size = 20,
  className = '',
}: ProgressRingProps) {
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const offset = circumference - progress * circumference;

  const isDashed = variant === 'dashed';

  // Completed state - green checkmark
  if (isComplete) {
    return (
      <div
        className={`rounded-full bg-bg-positive-strong flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label="Completed"
      >
        <svg
          className="text-fg-neutral-inverse-primary"
          style={{ width: size * 0.6, height: size * 0.6 }}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  // Dashed variant - completely dashed circle, no progress arc
  if (isDashed) {
    return (
      <svg
        width={size}
        height={size}
        className={`flex-shrink-0 ${className}`}
        role="img"
        aria-label="No progress"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray="3 2"
          className="text-fg-neutral-disabled"
        />
      </svg>
    );
  }

  // Solid variant - background circle with progress arc
  return (
    <svg
      width={size}
      height={size}
      className={`transform -rotate-90 flex-shrink-0 ${className}`}
      role="progressbar"
      aria-valuenow={completed}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${completed} of ${total} complete`}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-fg-neutral-softest"
      />
      {/* Progress arc */}
      {progress > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-fg-accent-primary"
        />
      )}
    </svg>
  );
}

export default ProgressRing;
