/**
 * Canvas Node Content
 *
 * Wrapper component for canvas node content with auto-sizing support.
 * Measures content dimensions and reports changes via ResizeObserver.
 * Minimal styling: p-1 only.
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import type { CanvasNodeContentProps } from './canvas-node-types';
import { GRID_UNIT } from '@/lib/block-system/types';

export function CanvasNodeContent({
  node,
  onSizeChange,
  children,
  className,
}: CanvasNodeContentProps): React.ReactElement {
  const contentRef = useRef<HTMLDivElement>(null);
  const lastReportedRef = useRef<{ width: number; height: number } | null>(null);

  const minWidthPx = Math.max(4, node.dimensions?.width ?? 0) * GRID_UNIT;
  const minHeightPx = Math.max(2, node.dimensions?.height ?? 0) * GRID_UNIT;

  const measureContent = useCallback(() => {
    if (!contentRef.current) {
      return { width: 0, height: 0 };
    }

    const rect = contentRef.current.getBoundingClientRect();
    const widthInGridUnits = Math.max(4, Math.ceil(rect.width / GRID_UNIT));
    const heightInGridUnits = Math.max(2, Math.ceil(rect.height / GRID_UNIT));

    return {
      width: widthInGridUnits,
      height: heightInGridUnits,
    };
  }, []);

  const reportDimensions = useCallback((dimensions: { width: number; height: number }) => {
    const last = lastReportedRef.current;
    if (!last || dimensions.width !== last.width || dimensions.height !== last.height) {
      lastReportedRef.current = dimensions;
      onSizeChange?.(dimensions);
    }
  }, [onSizeChange]);

  useEffect(() => {
    const initialDimensions = measureContent();
    if (initialDimensions.width > 0 && initialDimensions.height > 0) {
      reportDimensions(initialDimensions);
    }

    const resizeObserver = new ResizeObserver(() => {
      const newDimensions = measureContent();
      if (newDimensions.width > 0 && newDimensions.height > 0) {
        reportDimensions(newDimensions);
      }
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [measureContent, reportDimensions]);

  return (
    <div
      ref={contentRef}
      className={cn('relative flex min-h-[64px] min-w-[128px] flex-col p-1', className)}
      style={{ minWidth: minWidthPx, minHeight: minHeightPx }}
      data-node-id={node.id}
      data-node-type={node.type}
    >
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default CanvasNodeContent;
