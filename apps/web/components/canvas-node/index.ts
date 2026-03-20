/**
 * Canvas Node System
 *
 * A comprehensive node rendering system for the pi-cast canvas.
 * Features:
 * - Auto-sizing based on content
 * - Drag-and-drop support
 * - Node connection system
 * - Hover/selection outlines
 * - Generic type safety (no any types, no manual type assertions)
 */

export { CanvasNode } from './canvas-node';
export { CanvasNodeContent } from './canvas-node-content';
export { CanvasNodeOutline } from './canvas-node-outline';
export { useCanvasNodeDrag } from './use-canvas-node-drag';
export { useCanvasNodeConnections } from './use-canvas-node-connections';

export type {
  CanvasNodeData,
  CanvasNodeDimensions,
  CanvasNodeState,
  CanvasDragState,
  ConnectionHandle,
  ConnectionHandleType,
  ConnectionDragState,
  CanvasNodeOutlineProps,
  CanvasNodeBaseProps,
  CanvasNodeProps,
  CanvasNodeContentProps,
  CanvasEventHandler,
  CanvasNodeRenderer,
  UseCanvasNodeDragOptions,
  UseCanvasNodeDragReturn,
  UseCanvasNodeConnectionsOptions,
  UseCanvasNodeConnectionsReturn,
} from './canvas-node-types';
