'use client';

interface FoggyRingMarkerProps {
  radius: number;
  isCelebrating?: boolean;
  isHovering?: boolean;
}

const DEFAULT_CONFIG = {
  // Base ring
  baseOpacity: 0.08, // Opacity for normal state (reduced for subtlety)
  thickness: 20, // Pixels

  // Colors
  normalColor: 'rgba(160, 150, 180, x)',
  celebratingColor: 'rgba(220, 180, 120, x)', // Gold/warm tone for celebration
};

export default function FoggyRingMarker({
  radius,
  isCelebrating = false,
  isHovering = false,
}: FoggyRingMarkerProps) {
  // Adjust colors and opacity based on state
  const baseColor = isCelebrating ? DEFAULT_CONFIG.celebratingColor : DEFAULT_CONFIG.normalColor;

  const baseOpacity = isCelebrating
    ? 0.35 // Brighter when celebrating
    : isHovering
      ? 0.2 // Brighter when hovering
      : DEFAULT_CONFIG.baseOpacity;

  return (
    <div className="foggy-ring-container absolute inset-0 pointer-events-none">
      {/* Simple solid translucent ring */}
      <svg
        className="absolute inset-0"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke={baseColor.replace('x', baseOpacity.toString())}
          strokeWidth={DEFAULT_CONFIG.thickness}
          style={{
            transition: 'stroke 800ms ease-out, stroke-width 300ms ease-out, r 500ms ease-in-out',
            filter: isCelebrating ? 'drop-shadow(0 0 8px rgba(220, 180, 120, 0.4))' : 'none',
          }}
        />
      </svg>
    </div>
  );
}
