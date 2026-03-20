/**
 * Canvas Node
 *
 * Base component for rendering nodes on the canvas.
 * Handles outline rendering, drag-and-drop, and node connections.
 * Auto-sizes based on content with minimal styling (p-1).
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import type { CanvasNodeProps } from './canvas-node-types';
import { CanvasNodeOutline } from './canvas-node-outline';
import { CanvasNodeContent } from './canvas-node-content';
import { useCanvasNodeDrag } from './use-canvas-node-drag';
import { useCanvasNodeConnections } from './use-canvas-node-connections';
import { GRID_UNIT } from '@/lib/block-system/types';

export function CanvasNode<T extends import('@/lib/block-system/types').Block>({
  node,
  isSelected,
  isDraggable,
  isConnectable,
  canvasRef,
  onNodeSelect,
  onNodePositionChange,
  onConnectionStart,
  onNodeDimensionsChange,
  className,
  children,
}: CanvasNodeProps<T>): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback(() => {
    // Can add preview logic here if needed
  }, []);

  const handleDragEnd = useCallback(
    (
      nodeId: string,
      oldPosition: import('@/lib/block-system/types').GridPosition,
      newPosition: import('@/lib/block-system/types').GridPosition
    ) => {
      setIsDragging(false);
      onNodePositionChange?.(nodeId, newPosition);
    },
    [onNodePositionChange]
  );

  const handleDimensionsChange = useCallback(
    (newDimensions: { width: number; height: number }) => {
      onNodeDimensionsChange?.(node.id, newDimensions);
    },
    [node.id, onNodeDimensionsChange]
  );

  const { handleMouseDown, handleMouseMove, handleMouseUp } = useCanvasNodeDrag({
    node,
    canvasRef,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
  });

  const { handles, handleConnectionMouseDown } = useCanvasNodeConnections({
    node,
    canvasRef,
    onConnectionStart,
  });

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleClick = useCallback(() => {
    onNodeSelect?.(node.id);
  }, [node.id, onNodeSelect]);

  const position = {
    x: node.position.x * GRID_UNIT,
    y: node.position.y * GRID_UNIT,
  };

  return (
    <div
      ref={nodeRef}
      className={cn(
        'absolute cursor-grab active:cursor-grabbing',
        !isDraggable && 'cursor-default',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
      data-node-id={node.id}
      data-selected={isSelected || undefined}
      onMouseDown={isDraggable ? handleMouseDown : undefined}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="relative inline-block">
        <CanvasNodeOutline
          isVisible={true}
          isHovered={isHovered}
          isSelected={isSelected}
          isDragging={isDragging}
        />

        <CanvasNodeContent node={node} onSizeChange={handleDimensionsChange}>
          {children}
        </CanvasNodeContent>

        {isConnectable && (
          <ConnectionHandles
            handles={handles}
            onMouseDown={handleConnectionMouseDown}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CONNECTION HANDLES COMPONENT
// ============================================================================

interface ConnectionHandlesProps {
  handles: import('./canvas-node-types').ConnectionHandle[];
  onMouseDown: (handleId: string, event: React.MouseEvent) => void;
}

function ConnectionHandles({
  handles,
  onMouseDown,
}: ConnectionHandlesProps): React.ReactElement {
  return (
    <div className="pointer-events-auto absolute inset-0">
      {handles.map((handle) => (
        <ConnectionHandle
          key={handle.id}
          handle={handle}
          onMouseDown={onMouseDown}
        />
      ))}
    </div>
  );
}

interface ConnectionHandleProps {
  handle: import('./canvas-node-types').ConnectionHandle;
  onMouseDown: (handleId: string, event: React.MouseEvent) => void;
}

function ConnectionHandle({
  handle,
  onMouseDown,
}: ConnectionHandleProps): React.ReactElement {
  const positionClasses = {
    top: 'left-1/2 -translate-x-1/2 -top-2',
    bottom: 'left-1/2 -translate-x-1/2 -bottom-2',
    left: 'top-1/2 -translate-y-1/2 -left-2',
    right: 'top-1/2 -translate-y-1/2 -right-2',
  };

  return (
    <div
      className={cn(
        'absolute h-4 w-4 rounded-full border-2 border-border bg-background opacity-0 transition-opacity hover:opacity-100',
        positionClasses[handle.position]
      )}
      data-handle-id={handle.id}
      data-handle-type={handle.type}
      onMouseDown={(e) => onMouseDown(handle.id, e)}
    />
  );
}

export default CanvasNode;
