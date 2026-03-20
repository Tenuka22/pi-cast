/**
 * useCanvasNodeDrag Hook
 *
 * Handles drag-and-drop logic for canvas nodes.
 * Uses generics for type safety, no manual type assertions.
 */

'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import type {
  UseCanvasNodeDragOptions,
  UseCanvasNodeDragReturn,
  CanvasDragState,
} from './canvas-node-types';
import { gridToPixels, pixelsToGrid } from '@/lib/block-system/types';

export function useCanvasNodeDrag({
  node,
  canvasRef,
  onDragStart,
  onDragMove,
  onDragEnd,
}: UseCanvasNodeDragOptions): UseCanvasNodeDragReturn {
  const [dragState, setDragState] = useState<CanvasDragState | null>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (event.button !== 0) {
        return;
      }

      event.stopPropagation();
      event.preventDefault();

      const canvasElement = canvasRef.current;
      if (!canvasElement) {
        return;
      }

      const rect = canvasElement.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const nodePosition = gridToPixels(node.position);

      const newDragState: CanvasDragState = {
        isDragging: true,
        nodeId: node.id,
        startPosition: node.position,
        currentPosition: node.position,
        offset: {
          x: mouseX - nodePosition.x,
          y: mouseY - nodePosition.y,
        },
      };

      setDragState(newDragState);
      isDraggingRef.current = true;
      onDragStart?.(node.id, node.position);
    },
    [node.id, node.position, canvasRef, onDragStart]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!dragState || !isDraggingRef.current || !canvasRef.current) {
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = event.clientX - rect.left - dragState.offset.x;
      const mouseY = event.clientY - rect.top - dragState.offset.y;
      const gridPosition = pixelsToGrid(mouseX, mouseY);

      setDragState((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          currentPosition: gridPosition,
        };
      });

      onDragMove?.(node.id, gridPosition);
    },
    [dragState, canvasRef, node.id, onDragMove]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragState) {
      return;
    }

    const oldPosition = dragState.startPosition;
    const newPosition = dragState.currentPosition;

    onDragEnd?.(node.id, oldPosition, newPosition);

    setDragState(null);
    isDraggingRef.current = false;
  }, [dragState, node.id, onDragEnd]);

  useEffect(() => {
    if (!isDraggingRef.current) {
      return;
    }

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleMouseUp]);

  return {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}

export default useCanvasNodeDrag;
