'use client';

import React from 'react';

interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isSelected?: boolean;
  isAnimated?: boolean;
  onClick?: () => void;
  connectionId?: string;
}

export function ConnectionLine({
  startX,
  startY,
  endX,
  endY,
  isSelected = false,
  isAnimated = false,
  onClick,
  connectionId,
}: ConnectionLineProps) {
  // Calculate smooth bezier curve control points (Obsidian-style)
  // The curve flows horizontally from source to target
  const horizontalDistance = Math.abs(endX - startX);
  const verticalDistance = Math.abs(endY - startY);
  
  // Control point offset - creates the smooth S-curve
  // Adjust based on distance for optimal curve shape
  const controlOffset = Math.min(horizontalDistance * 0.5, Math.max(100, horizontalDistance * 0.3));
  
  const controlPoint1 = { x: startX + controlOffset, y: startY };
  const controlPoint2 = { x: endX - controlOffset, y: endY };

  // Create the bezier curve path
  const pathD = `M ${startX} ${startY} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${endX} ${endY}`;

  return (
    <g
      onClick={onClick}
      data-connection-id={connectionId}
      className="cursor-pointer pointer-events-auto"
    >
      {/* Outer glow for visibility */}
      <path
        d={pathD}
        fill="none"
        stroke="oklch(0.95 0.02 320)"
        strokeWidth="12"
        className="opacity-30 pointer-events-none"
        style={{ filter: 'blur(2px)' }}
      />
      
      {/* Main connection line - thicker for better visibility */}
      <path
        d={pathD}
        fill="none"
        stroke={isSelected ? 'oklch(0.7 0.25 323.949)' : 'oklch(0.6 0.2 320)'}
        strokeWidth={isSelected ? 6 : 4}
        strokeLinecap="round"
        className="transition-all duration-200 pointer-events-none"
      />
      
      {/* Inner highlight for depth */}
      <path
        d={pathD}
        fill="none"
        stroke="oklch(0.85 0.15 320 / 0.5)"
        strokeWidth={isSelected ? 2 : 1}
        strokeLinecap="round"
        className="pointer-events-none"
      />

      {/* Animated flow indicator intentionally disabled (kept for API compatibility) */}
      {isAnimated ? null : null}

      {/* Invisible wider path for easier clicking */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth="20"
        className="pointer-events-auto"
      />
    </g>
  );
}

interface ConnectionPreviewProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isValid: boolean;
}

export function ConnectionPreview({ startX, startY, endX, endY, isValid }: ConnectionPreviewProps) {
  const horizontalDistance = Math.abs(endX - startX);
  const controlOffset = Math.min(horizontalDistance * 0.5, Math.max(100, horizontalDistance * 0.3));
  
  const controlPoint1 = { x: startX + controlOffset, y: startY };
  const controlPoint2 = { x: endX - controlOffset, y: endY };

  const pathD = `M ${startX} ${startY} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${endX} ${endY}`;

  return (
    <g>
      {/* Dashed preview line */}
      <path
        d={pathD}
        fill="none"
        stroke={isValid ? 'oklch(0.6 0.25 323.949)' : 'oklch(0.5 0.1 320)'}
        strokeWidth="3"
        strokeDasharray="8,4"
        strokeLinecap="round"
        className="opacity-80"
      />
      
      {/* Circle at cursor position */}
      <circle
        cx={endX}
        cy={endY}
        r="8"
        fill={isValid ? 'oklch(0.6 0.25 323.949)' : 'oklch(0.5 0.1 320)'}
        className="opacity-60"
      />
      <circle
        cx={endX}
        cy={endY}
        r="4"
        fill="oklch(0.95 0.02 320)"
      />
    </g>
  );
}
