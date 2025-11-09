'use client';

import { useState, useRef } from 'react';
import FoggyRingMarker from './markers/FoggyRingMarker';
// Future imports:
// import ParticleMarker from './markers/ParticleMarker';
// import SimpleLineMarker from './markers/SimpleLineMarker';

export type MarkerStyle = 'foggyRing' | 'particles' | 'simpleLine';

interface PriorityMarkerProps {
  radius: number;
  style?: MarkerStyle;
  onMoveInward?: () => void;
  onMoveOutward?: () => void;
  canMoveInward?: boolean;
  canMoveOutward?: boolean;
  isCelebrating?: boolean;
}

export default function PriorityMarker({
  radius,
  style = 'foggyRing',
  onMoveInward,
  onMoveOutward,
  canMoveInward = true,
  canMoveOutward = true,
  isCelebrating = false,
}: PriorityMarkerProps) {
  const [hoveredTarget, setHoveredTarget] = useState<'inner' | 'outer' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate distance from center of SVG to mouse position (in pixels)
  const getDistanceFromCenter = (e: React.MouseEvent<SVGSVGElement>): number => {
    if (!svgRef.current) return 0;

    const rect = svgRef.current.getBoundingClientRect();

    // Calculate center of the SVG in screen coordinates
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate distance from mouse to center in pixels
    return Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));
  };

  // Determine which zone the mouse is in
  const getZone = (distance: number): 'inner' | 'outer' | null => {
    // Inner donut: from (radius - 40) to radius
    if (canMoveInward && distance >= radius - 40 && distance < radius) {
      return 'inner';
    }
    // Outer donut: from radius to (radius + 40)
    if (canMoveOutward && distance >= radius && distance < radius + 40) {
      return 'outer';
    }
    return null;
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    const distance = getDistanceFromCenter(e);
    const zone = getZone(distance);

    if (zone === 'inner') {
      onMoveInward?.();
    } else if (zone === 'outer') {
      onMoveOutward?.();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const distance = getDistanceFromCenter(e);
    const zone = getZone(distance);
    setHoveredTarget(zone);
  };

  const handleMouseLeave = () => {
    setHoveredTarget(null);
  };

  return (
    <>
      {/* Visual marker layer */}
      <div
        className="priority-marker-container absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 15 }}
      >
        {/* Render the selected marker style */}
        {style === 'foggyRing' && (
          <FoggyRingMarker
            radius={radius}
            isCelebrating={isCelebrating}
            isHovering={hoveredTarget !== null}
          />
        )}

        {/* Future marker styles will go here */}
        {/* {style === 'particles' && <ParticleMarker radius={radius} />} */}
        {/* {style === 'simpleLine' && <SimpleLineMarker radius={radius} />} */}
      </div>

      {/* Interactive SVG layer (separate container to avoid flex interference) */}
      {/* z-index 5 keeps it below subtasks (z-index 10) but above orbital rings */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 5 }}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0 pointer-events-auto"
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
            cursor: hoveredTarget ? 'pointer' : 'default',
          }}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
        {/* Invisible full-size rect to capture all mouse events */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="transparent"
          pointerEvents="all"
        />
      </svg>
      </div>
    </>
  );
}
