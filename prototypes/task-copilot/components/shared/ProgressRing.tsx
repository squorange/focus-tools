"use client";

interface ProgressRingProps {
  completed: number;
  total: number;
  isComplete: boolean;
  variant?: 'solid' | 'dashed';
  size?: number;
}

// Progress ring showing step completion as a circular indicator
// variant='dashed' shows a completely dashed circle (for triage items)
// variant='solid' (default) shows progress arc
export default function ProgressRing({
  completed,
  total,
  isComplete,
  variant = 'solid',
  size = 20,
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
        className="rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
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
      <svg width={size} height={size} className="flex-shrink-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray="3 2"
          className="text-zinc-300 dark:text-zinc-600"
        />
      </svg>
    );
  }

  // Solid variant - background circle with progress arc
  return (
    <svg width={size} height={size} className="transform -rotate-90 flex-shrink-0">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-zinc-200 dark:text-zinc-700"
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
          className="text-violet-500"
        />
      )}
    </svg>
  );
}
