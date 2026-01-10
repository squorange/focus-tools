'use client';

import { useReducedMotion } from 'framer-motion';

interface ShimmerTextProps {
  text: string;
  className?: string;
  delay?: number;  // Animation delay in seconds (for coordination with pulse)
}

export function ShimmerText({ text, className = '', delay = 0 }: ShimmerTextProps) {
  const prefersReducedMotion = useReducedMotion();

  // Reduced motion: plain text with slightly lower opacity
  if (prefersReducedMotion) {
    return (
      <span className={`text-zinc-500 dark:text-zinc-400 opacity-70 ${className}`}>
        {text}
      </span>
    );
  }

  return (
    <span
      className={`shimmer-text ${className}`}
      style={{
        animationDelay: `${delay}s`,
      }}
    >
      {text}
    </span>
  );
}

export default ShimmerText;
