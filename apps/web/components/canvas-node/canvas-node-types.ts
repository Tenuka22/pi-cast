/**
 * Canvas Node System Types
 *
 * Generic types for the canvas node rendering system.
 * Supports auto-sizing, drag-and-drop, and node connections.
 */

import type { Block, BlockType, GridPosition } from '@/lib/block-system/types';

// ============================================================================
// CORE NODE TYPES
// ============================================================================

export interface CanvasNodeData<T extends BlockType = BlockType> {
  id: string;
  type: T;
  position: GridPosition;
}

export interface CanvasNodeDimensions {
  width: number;
  height: number;
}

export interface CanvasNodeState<T extends Block = Block> {
  node: T;
  isSelected: boolean;
  isDragging: boolean;
  isHovered: boolean;
  isConnecting: boolean;
}

// ============================================================================
// DRAG TYPES
// ============================================================================

export interface CanvasDragState {
  isDragging: boolean;
  nodeId: string;
  startPosition: GridPosition;
  currentPosition: GridPosition;
  offset: { x: number; y: number };
}

export interface UseCanvasNodeDragOptions {
  node: Block;
  canvasRef: React.RefObject<HTMLElement | null>;
  onDragStart?: (nodeId: string, position: GridPosition) => void;
  onDragMove?: (nodeId: string, position: GridPosition) => void;
  onDragEnd?: (nodeId: string, oldPosition: GridPosition, newPosition: GridPosition) => void;
}

export interface UseCanvasNodeDragReturn {
  dragState: CanvasDragState | null;
  handleMouseDown: (event: React.MouseEvent) => void;
  handleMouseMove: (event: React.MouseEvent) => void;
  handleMouseUp: () => void;
}

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export type ConnectionHandleType = 'input' | 'output';

export interface ConnectionHandle {
  id: string;
  type: ConnectionHandleType;
  label?: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  index?: number;
}

export interface ConnectionDragState {
  sourceNodeId: string;
  sourceHandleId: string;
  currentX: number;
  currentY: number;
}

export interface UseCanvasNodeConnectionsOptions {
  node: Block;
  canvasRef: React.RefObject<HTMLElement | null>;
  onConnectionStart?: (nodeId: string, handleId: string) => void;
  onConnectionMove?: (x: number, y: number) => void;
  onConnectionEnd?: (targetNodeId: string, targetHandleId: string) => void;
}

export interface UseCanvasNodeConnectionsReturn {
  connectionDrag: ConnectionDragState | null;
  handles: ConnectionHandle[];
  handleConnectionMouseDown: (handleId: string, event: React.MouseEvent) => void;
}

// ============================================================================
// OUTLINE TYPES
// ============================================================================

export interface CanvasNodeOutlineProps {
  isVisible: boolean;
  isHovered: boolean;
  isSelected: boolean;
  isDragging: boolean;
}

// ============================================================================
// CANVAS NODE COMPONENT TYPES
// ============================================================================

export interface CanvasNodeBaseProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CanvasNodeProps<T extends Block = Block> {
  node: T;
  isSelected: boolean;
  isDraggable: boolean;
  isConnectable: boolean;
  canvasRef: React.RefObject<HTMLElement | null>;
  onNodeSelect?: (nodeId: string) => void;
  onNodePositionChange?: (nodeId: string, position: GridPosition) => void;
  onNodeDimensionsChange?: (nodeId: string, dimensions: CanvasNodeDimensions) => void;
  onConnectionStart?: (nodeId: string, handleId: string) => void;
  onConnectionEnd?: (targetNodeId: string, targetHandleId: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export interface CanvasNodeContentProps {
  node: Block;
  onSizeChange?: (dimensions: CanvasNodeDimensions) => void;
  children?: React.ReactNode;
  className?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type CanvasEventHandler<T extends Block = Block> = (
  node: T,
  event: React.MouseEvent | React.KeyboardEvent
) => void;

export type CanvasNodeRenderer<T extends Block = Block> = (props: {
  node: T;
  isSelected: boolean;
  isHovered: boolean;
}) => React.ReactNode;
