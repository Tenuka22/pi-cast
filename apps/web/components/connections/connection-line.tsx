'use client';

import React from 'react';
import type { BlockConnection } from '@/lib/block-system/types';

export type BlockConnectionType = BlockConnection['type'];

interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isSelected?: boolean;
  isAnimated?: boolean;
  onClick?: () => void;
  connectionId?: string;
  connectionType?: BlockConnectionType;
  sourceWidth?: number;  // Width of source block for routing
  targetWidth?: number;  // Width of target block for routing
}

// Theme-friendly palette; deterministic pick by connection id.
const PALETTE = [
  'oklch(0.62 0.2 320)', // magenta
  'oklch(0.65 0.18 260)', // violet
  'oklch(0.62 0.16 210)', // cyan
  'oklch(0.66 0.18 140)', // green
  'oklch(0.68 0.16 80)',  // amber
  'oklch(0.62 0.18 30)',  // orange
  'oklch(0.6 0.17 10)',   // red
];

function pickColor(connectionId: string | undefined, isSelected?: boolean): string {
  if (isSelected) return 'oklch(0.78 0.22 320)';
  if (!connectionId) return PALETTE[0]!;
  let hash = 0;
  for (let i = 0; i < connectionId.length; i++) {
    hash = (hash * 31 + connectionId.charCodeAt(i)) >>> 0;
  }
  const colorIndex = hash % PALETTE.length;
  return PALETTE[colorIndex]!;
}

/**
 * Creates a PCB-style orthogonal path that routes outward from source and inward to target
 * Uses multiple segments with 90-degree turns to avoid overlapping blocks
 * 
 * Path pattern:
 * 1. Horizontal outward from source (right side)
 * 2. Vertical to align with target's y-level
 * 3. Horizontal to target's x-position
 * 4. Vertical to target connection point
 */
function createOrthogonalPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  sourceWidth?: number,
  targetWidth?: number
): string {
  // Keep offsets tight so runs don't stick far out from nodes.
  // 1 grid unit ≈ 32px, so start bends at about one unit.
  const outwardOffset = sourceWidth ? Math.max(16, sourceWidth * 0.15) : 32;
  const inwardOffset = targetWidth ? Math.max(16, targetWidth * 0.15) : 32;
  
  // Calculate key points for the path
  const sourceOutX = startX + outwardOffset;  // Route outward from source
  const targetInX = endX - inwardOffset;      // Route inward to target
  
  // Determine if we need intermediate vertical segments
  const path: string[] = [];
  path.push(`M ${startX} ${startY}`);  // Start point
  
  // Step 1: Horizontal outward from source
  path.push(`L ${sourceOutX} ${startY}`);
  
  // Step 2 & 3: Route to target's vertical alignment
  // Check if target is to the right of source
  if (targetInX > sourceOutX) {
    // Target is to the right - clean routing
    // Step 2: Vertical to intermediate y (if needed)
    const midY = (startY + endY) / 2;
    
    if (Math.abs(endY - startY) > 10) {
      // Need vertical adjustment - use 45-degree angle if slope is shallow
      const dy = endY - startY;
      const dx = targetInX - sourceOutX;
      
      if (Math.abs(dy) < Math.abs(dx)) {
        // Shallow slope - go horizontal first, then vertical at 45°
        const diagonalStartX = sourceOutX + Math.abs(dy);
        path.push(`L ${diagonalStartX} ${startY}`);
        path.push(`L ${targetInX} ${endY}`);
      } else {
        // Steep slope - vertical first, then horizontal
        path.push(`L ${sourceOutX} ${midY}`);
        path.push(`L ${targetInX} ${midY}`);
      }
    } else {
      // Nearly same y-level - direct horizontal
      path.push(`L ${targetInX} ${startY}`);
    }
  } else {
    // Target is to the left or overlapping - need more complex routing
    const midY = (startY + endY) / 2;
    const verticalDrop = Math.max(32, Math.abs(endY - startY) * 0.35);
    const detourClearance = 16; // keep the sideways jog short (≈ half unit)
    
    // Route down and around
    path.push(`L ${sourceOutX} ${startY + verticalDrop}`);
    path.push(`L ${sourceOutX - detourClearance} ${startY + verticalDrop}`);
    path.push(`L ${targetInX} ${startY + verticalDrop}`);
  }
  
  // Step 4: Vertical to end point (if not already there)
  const lastPoint = path[path.length - 1];
  const lastY = lastPoint ? parseFloat(lastPoint.split(' ').pop() || '0') : startY;
  if (Math.abs(lastY - endY) > 1) {
    path.push(`L ${targetInX} ${endY}`);
  }
  
  // Step 5: Horizontal to end point
  path.push(`L ${endX} ${endY}`);
  
  return path.join(' ');
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
  connectionType,
  sourceWidth,
  targetWidth,
}: ConnectionLineProps) {
  // Create PCB-style orthogonal path with outward/inward routing
  const pathD = createOrthogonalPath(startX, startY, endX, endY, sourceWidth, targetWidth);
  
  const strokeColor = pickColor(connectionId, isSelected);

  return (
    <g
      onClick={onClick}
      onMouseDown={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      data-connection-id={connectionId}
      className="cursor-pointer"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Main connection line - clean, no glow */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isSelected ? 4 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-200"
        style={{ pointerEvents: 'stroke' }}
      />

      {/* Invisible wider path for easier clicking */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth="24"
        className="pointer-events-auto"
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
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
  sourceWidth?: number;
  targetWidth?: number;
}

export function ConnectionPreview({ startX, startY, endX, endY, isValid, sourceWidth, targetWidth }: ConnectionPreviewProps) {
  const pathD = createOrthogonalPath(startX, startY, endX, endY, sourceWidth, targetWidth);

  return (
    <g>
      {/* Dashed preview line */}
      <path
        d={pathD}
        fill="none"
        stroke={isValid ? 'oklch(0.6 0.25 323.949)' : 'oklch(0.5 0.1 320)'}
        strokeWidth="2"
        strokeDasharray="6,4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-80"
      />

      {/* Circle at cursor position */}
      <circle
        cx={endX}
        cy={endY}
        r="6"
        fill={isValid ? 'oklch(0.6 0.25 323.949)' : 'oklch(0.5 0.1 320)'}
        className="opacity-60"
      />
      <circle
        cx={endX}
        cy={endY}
        r="3"
        fill="oklch(0.95 0.02 320)"
      />
    </g>
  );
}
