/**
 * Block Wrapper Component
 *
 * Common wrapper for all block types with consistent styling and behavior.
 */

'use client';

import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { GRID_UNIT, type Block } from '@/lib/block-system/types';

interface BlockWrapperProps {
  block: Block;
  isSelected?: boolean;
  isDragging?: boolean;
  maxDimensions?: { width: number; height: number };
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void;
  className?: string;
  children: ReactNode;
}

export function BlockWrapper({
  block,
  isSelected,
  isDragging = false,
  maxDimensions,
  onClick,
  onMouseDown,
  onDimensionsChange,
  className,
  children,
}: BlockWrapperProps): React.ReactElement {
  const contentRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: block.dimensions.width,
    height: block.dimensions.height,
  });
  const dimensionsRef = useRef(dimensions);
  useEffect(() => {
    dimensionsRef.current = dimensions;
  }, [dimensions]);

  // Measure content and round up to nearest grid unit (32px)
  useEffect(() => {
    const updateDimensions = () => {
      if (contentRef.current) {
        // Use layout sizes so pan/zoom CSS transforms don't cause feedback loops.
        const measuredPxWidth = contentRef.current.offsetWidth;
        const measuredPxHeight = contentRef.current.offsetHeight;
        // Use the LARGER of: measured content OR block's stored dimensions
        // This prevents shrinking while allowing growth
        const measuredWidth = Math.ceil(measuredPxWidth / GRID_UNIT);
        const measuredHeight = Math.ceil(measuredPxHeight / GRID_UNIT);
        const unclampedWidth = Math.max(measuredWidth, block.dimensions.width);
        const unclampedHeight = Math.max(measuredHeight, block.dimensions.height);
        const newWidth =
          maxDimensions?.width !== undefined
            ? Math.min(unclampedWidth, maxDimensions.width)
            : unclampedWidth;
        const newHeight =
          maxDimensions?.height !== undefined
            ? Math.min(unclampedHeight, maxDimensions.height)
            : unclampedHeight;

        const current = dimensionsRef.current;
        if (newWidth !== current.width || newHeight !== current.height) {
          setDimensions({ width: newWidth, height: newHeight });
        }

        if (newWidth !== block.dimensions.width || newHeight !== block.dimensions.height) {
          onDimensionsChange?.({ width: newWidth, height: newHeight });
        }
      }
    };

    // Initial measurement
    updateDimensions();

    // Use ResizeObserver to track content size changes
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [block.dimensions.width, block.dimensions.height, maxDimensions?.width, maxDimensions?.height, onDimensionsChange]);

  const handleBodyClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (target?.closest('[data-connection-handle]')) {
      return;
    }
    onClick?.();
  };

  const handleBodyMouseDown = (e: React.MouseEvent): void => {
    e.stopPropagation();
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (target?.closest('[data-connection-handle]')) {
      return;
    }
    onMouseDown?.(e);
  };

  const pos = {
    x: block.position.x * GRID_UNIT,
    y: block.position.y * GRID_UNIT,
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleBodyClick}
      onMouseDown={handleBodyMouseDown}
      style={{
        left: pos.x,
        top: pos.y,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      className={cn(
        'group absolute flex flex-col rounded-lg border-2 transition-all duration-200 select-none hover:border-primary/50 hover:shadow-md',
        'bg-card',
        isDragging ? 'z-50 cursor-grabbing shadow-2xl' : 'z-10 cursor-grab',
        isSelected
          ? 'border-primary shadow-lg ring-2 ring-primary/20'
          : 'border-border',
        'overflow-visible',
        className
      )}
    >
      {/* Drag Handle Indicator */}
      <div className="absolute -top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-0.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground shadow-sm">
          <span className="text-[10px] leading-none">⋮⋮</span>
          <span className="text-[9px]">Drag</span>
        </div>
      </div>
      <div
        ref={contentRef}
        className="flex flex-col items-stretch"
        style={{
          minWidth: dimensions.width * GRID_UNIT,
          minHeight: dimensions.height * GRID_UNIT,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default BlockWrapper;
