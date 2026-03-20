/**
 * Canvas Node Outline
 *
 * Renders the outline for canvas nodes with hover, selection, and drag states.
 * Shows a subtle outline on hover (opacity 20%) and stronger outlines for selection/drag.
 */

'use client';

import React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import type { CanvasNodeOutlineProps } from './canvas-node-types';

export function CanvasNodeOutline({
  isVisible,
  isHovered,
  isSelected,
  isDragging,
}: CanvasNodeOutlineProps): React.ReactElement | null {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute left-0 top-0 h-full w-full rounded-md border-2 transition-all duration-150',
        isDragging && 'border-primary bg-primary/5',
        isSelected && !isDragging && 'border-primary bg-primary/10',
        isHovered && !isSelected && !isDragging && 'border-border/20 bg-border/5'
      )}
      aria-hidden="true"
    />
  );
}

export default CanvasNodeOutline;
