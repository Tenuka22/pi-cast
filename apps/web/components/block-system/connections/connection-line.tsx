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

// Color mapping for different connection types
const CONNECTION_COLORS: Record<BlockConnectionType | 'default', string> = {
  // Equation outputs - blue/purple tones
  'equation-to-chart': 'oklch(0.6 0.2 260)',
  'equation-to-control': 'oklch(0.65 0.15 260)',
  'equation-to-equation': 'oklch(0.55 0.25 260)',
  'equation-to-limit': 'oklch(0.6 0.18 260)',
  'equation-to-variable': 'oklch(0.65 0.2 260)',
  'equation-to-constraint': 'oklch(0.58 0.22 260)',
  'equation-to-shape': 'oklch(0.62 0.18 260)',
  'equation-to-logic': 'oklch(0.55 0.2 280)',
  'equation-to-comparator': 'oklch(0.58 0.2 280)',
  'equation-to-table': 'oklch(0.6 0.15 260)',
  
  // Variable outputs - green tones
  'variable-to-chart': 'oklch(0.65 0.2 140)',
  'variable-to-equation': 'oklch(0.6 0.22 140)',
  
  // Logic outputs - orange tones
  'logic-to-equation': 'oklch(0.65 0.2 30)',
  'logic-to-chart': 'oklch(0.6 0.18 30)',
  'logic-to-shape': 'oklch(0.62 0.2 30)',
  'logic-to-logic': 'oklch(0.58 0.22 30)',
  
  // Comparator outputs - red tones
  'comparator-to-equation': 'oklch(0.6 0.25 20)',
  'comparator-to-logic': 'oklch(0.62 0.22 20)',
  'comparator-to-chart': 'oklch(0.58 0.2 20)',
  'comparator-to-shape': 'oklch(0.6 0.18 20)',
  'comparator-to-comparator': 'oklch(0.55 0.25 20)',
  'comparator-to-table': 'oklch(0.6 0.2 20)',
  
  // Limit outputs - cyan tones
  'limit-to-chart': 'oklch(0.65 0.15 200)',
  'limit-to-table': 'oklch(0.6 0.18 200)',
  'limit-to-logic': 'oklch(0.62 0.15 200)',
  
  // Control outputs - yellow/amber tones
  'control-to-shape': 'oklch(0.7 0.18 60)',
  'control-to-limit': 'oklch(0.65 0.2 60)',
  'control-to-comparator': 'oklch(0.68 0.18 60)',
  'control-to-equation': 'oklch(0.65 0.2 60)',
  
  // Constraint outputs - pink tones
  'constraint-to-equation': 'oklch(0.6 0.25 340)',
  'constraint-to-chart': 'oklch(0.62 0.22 340)',
  'constraint-to-constraint': 'oklch(0.58 0.2 340)',
  'constraint-to-logic': 'oklch(0.6 0.2 340)',
  'constraint-to-comparator': 'oklch(0.62 0.18 340)',
  'constraint-to-table': 'oklch(0.6 0.2 340)',
  
  // Piecewise outputs - indigo tones
  'equation-to-piecewise-limiter': 'oklch(0.55 0.25 270)',
  'piecewise-limiter-to-builder': 'oklch(0.58 0.22 270)',
  'piecewise-builder-to-chart': 'oklch(0.6 0.2 270)',
  'piecewise-builder-to-table': 'oklch(0.62 0.18 270)',
  'piecewise-builder-to-logic': 'oklch(0.58 0.2 270)',
  'piecewise-builder-to-shape': 'oklch(0.6 0.18 270)',
  
  'default': 'oklch(0.6 0.2 320)',
}

function getConnectionColor(type?: BlockConnectionType, isSelected?: boolean): string {
  if (isSelected) {
    return 'oklch(0.75 0.25 323.949)';
  }
  if (!type) {
    return CONNECTION_COLORS['default'];
  }
  return CONNECTION_COLORS[type] || CONNECTION_COLORS['default'];
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
  // Minimum horizontal distance to route outward from blocks
  const outwardOffset = sourceWidth ? Math.max(40, sourceWidth * 0.5) : 60;
  const inwardOffset = targetWidth ? Math.max(40, targetWidth * 0.5) : 60;
  
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
    const verticalDrop = Math.max(80, Math.abs(endY - startY) * 0.5);
    
    // Route down and around
    path.push(`L ${sourceOutX} ${startY + verticalDrop}`);
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
  
  // Get color based on connection type
  const strokeColor = getConnectionColor(connectionType, isSelected);

  return (
    <g
      onClick={onClick}
      onMouseDown={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      data-connection-id={connectionId}
      className="cursor-pointer"
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
      />

      {/* Invisible wider path for easier clicking */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth="24"
        className="pointer-events-auto"
        style={{ cursor: 'pointer' }}
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
