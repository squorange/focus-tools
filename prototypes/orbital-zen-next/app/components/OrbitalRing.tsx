/**
 * OrbitalRing component
 *
 * Renders a single orbital ring path. Used in both galaxy and solar system views
 * to maintain consistent styling across all orbital visualizations.
 */

interface OrbitalRingProps {
  /** Radius of the ring in pixels */
  radius: number;
  /** Optional additional CSS classes */
  className?: string;
  /** Optional inline styles to merge with default positioning */
  style?: React.CSSProperties;
}

export default function OrbitalRing({ radius, className = '', style = {} }: OrbitalRingProps) {
  return (
    <div
      className={`absolute border border-gray-700/35 rounded-full transition-all duration-500 ease-in-out ${className}`}
      style={{
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        ...style,
      }}
    />
  );
}
