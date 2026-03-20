/**
 * useCanvasNodeConnections Hook
 *
 * Handles node connection logic for canvas nodes.
 * Uses generics for type safety, no manual type assertions.
 */

'use client';

import { useCallback, useState } from 'react';
import type {
  UseCanvasNodeConnectionsOptions,
  UseCanvasNodeConnectionsReturn,
  ConnectionDragState,
  ConnectionHandle,
} from './canvas-node-types';

export function useCanvasNodeConnections({
  node,
  canvasRef,
  onConnectionStart,
}: UseCanvasNodeConnectionsOptions): UseCanvasNodeConnectionsReturn {
  const [connectionDrag, setConnectionDrag] =
    useState<ConnectionDragState | null>(null);

  const handles: ConnectionHandle[] = [
    {
      id: `${node.id}-input`,
      type: 'input',
      position: 'top',
    },
    {
      id: `${node.id}-output`,
      type: 'output',
      position: 'bottom',
    },
  ];

  const handleConnectionMouseDown = useCallback(
    (handleId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      const canvasElement = canvasRef.current;
      if (!canvasElement) {
        return;
      }

      const rect = canvasElement.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      setConnectionDrag({
        sourceNodeId: node.id,
        sourceHandleId: handleId,
        currentX: mouseX,
        currentY: mouseY,
      });

      onConnectionStart?.(node.id, handleId);
    },
    [node.id, canvasRef, onConnectionStart]
  );

  return {
    connectionDrag,
    handles,
    handleConnectionMouseDown,
  };
}

export default useCanvasNodeConnections;
