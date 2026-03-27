/**
 * Grid Canvas Component
 *
 * Main canvas for the block system with drag-and-drop, connections, and playback support.
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import {
  GRID_UNIT,
  type Block,
  type GridPosition,
  type DragState,
  type EquationBlock,
  type ChartBlock,
  type ControlBlock,
  type DescriptionBlock,
  type LimitBlock,
  type ShapeBlock,
  type VariableBlock,
  type LogicBlock,
  type ComparatorBlock,
  type ConstraintBlock,
  type BlockConnection,
  type ShapeType,
  type ShapeFillMode,
  parseEquation,
  gridToPixels,
  pixelsToGrid,
  findNearestValidPosition,
  autoArrangeNeighbors,
  getDefaultBlockDimensions,
  getConnectionType,
} from '@/lib/block-system/types';
import type { BlockPreset } from '../library/block-library';
import {
  EquationBlockComponent,
  ChartBlockComponent,
  ControlBlockComponent,
  DescriptionBlockComponent,
  LimitBlockComponent,
  ShapeBlockComponent,
  LogicBlockComponent,
  ComparatorBlockComponent,
  ConstraintBlockComponent,
  VariableBlockComponent,
  isEquationBlock,
  isControlBlock,
  isLimitBlock,
  isChartBlock,
  isShapeBlock,
  isVariableBlock,
  isLogicBlock,
  isDescriptionBlock,
  isComparatorBlock,
  isConstraintBlock,
} from '../blocks';
import { ConnectionLayer } from '../connections/connection-layer';
import { ConnectionPreview } from '../connections/connection-line';
import { useRecording } from '@/lib/recording-system/use-recording';
import { RecordingControls } from '@/components/recording/recording-controls';
import { RecordingStatusBar } from '@/components/recording/recording-status-bar';
import {
  evaluateAllLogicBlocks,
  updateLogicBlockResults,
} from '@/lib/block-system/logic-evaluation';

interface GridCanvasProps {
  className?: string;
  onBlocksChange?: (blocks: Block[]) => void;
  onBlockDrop?: (preset: BlockPreset, position: GridPosition) => void;

  // Playback mode props
  blocks?: Block[];
  isPlaybackMode?: boolean;
  onBlockInteract?: () => void;
  onBlockModification?: (blockId: string, modifications: Partial<Block>) => void;
  onVariableChange?: (
    blockId: string,
    variableName: string,
    value: number
  ) => void;
  readOnly?: boolean;
}

interface ConnectionDragState {
  sourceBlockId: string;
  sourceHandleId: string;
  currentX: number;
  currentY: number;
}

// Block creator functions
function createEquationBlock(
  position: GridPosition,
  equation?: string
): EquationBlock {
  const parsed = equation ? parseEquation(equation) : undefined;
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'equation',
    position,
    dimensions: getDefaultBlockDimensions('equation'),
    equation: equation ?? '',
    tokens: parsed?.tokens,
    variables: parsed?.variables,
    equationType: parsed?.equationType,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createChartBlock(position: GridPosition): ChartBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'chart',
    position,
    dimensions: getDefaultBlockDimensions('chart'),
    equations: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createControlBlock(
  position: GridPosition,
  layout: 'horizontal' | 'vertical' = 'vertical'
): ControlBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'control',
    position,
    dimensions: getDefaultBlockDimensions('control'),
    layout,
    variables: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createDescriptionBlock(
  position: GridPosition,
  format: 'plain' | 'markdown' | 'latex' = 'plain'
): DescriptionBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'description',
    position,
    dimensions: getDefaultBlockDimensions('description'),
    content: 'Add your text here...',
    format,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createLimitBlock(
  position: GridPosition,
  variableName: string = 'x',
  limitValue: number = 0
): LimitBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'limit',
    position,
    dimensions: getDefaultBlockDimensions('limit'),
    variableName,
    limitValue,
    approach: 'both',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createShapeBlock(
  position: GridPosition,
  shapeType: ShapeBlock['shapeType'] = 'square',
  fillColor: string = '#7c3aed',
  fillValue: number = 50,
  fillMode: ShapeBlock['fillMode'] = 'percentage'
): ShapeBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'shape',
    position,
    dimensions: getDefaultBlockDimensions('shape'),
    shapeType,
    fillColor,
    fillValue,
    fillMode,
    showGrid: false,
    rows: 10,
    cols: 10,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createLogicBlock(
  position: GridPosition,
  logicType: LogicBlock['logicType'] = 'and'
): LogicBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'logic',
    position,
    dimensions: getDefaultBlockDimensions('logic'),
    logicType,
    inputs: [],
    output: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createVariableBlock(
  position: GridPosition,
  layout: 'horizontal' | 'vertical' = 'vertical'
): VariableBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'variable',
    position,
    dimensions: getDefaultBlockDimensions('variable'),
    layout,
    variables: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createComparatorBlock(
  position: GridPosition,
  operator: ComparatorBlock['operator'] = 'eq'
): ComparatorBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'comparator',
    position,
    dimensions: getDefaultBlockDimensions('comparator'),
    operator,
    leftInput: null,
    rightInput: null,
    output: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createConstraintBlock(
  position: GridPosition,
  variableName: string = 'x',
  constraintType: ConstraintBlock['constraint']['type'] = 'gte',
  constraintValue: number = 0
): ConstraintBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'constraint',
    position,
    dimensions: getDefaultBlockDimensions('constraint'),
    variableName,
    constraint: {
      type: constraintType,
      min: constraintValue,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function GridCanvas({
  className,
  onBlocksChange,
  blocks: externalBlocks,
  isPlaybackMode = false,
  onBlockInteract,
  onBlockModification,
  onVariableChange,
  onBlockDrop,
  readOnly = false,
}: GridCanvasProps): React.ReactElement {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [internalBlocks, setInternalBlocks] = useState<Block[]>([]);
  const blocks = externalBlocks ?? internalBlocks;
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>();
  const [gridVisible, setGridVisible] = useState(true);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const isDraggingRef = useRef(false);

  // Connection state
  const [connections, setConnections] = useState<BlockConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | undefined
  >();
  const [connectionDrag, setConnectionDrag] = useState<ConnectionDragState | null>(
    null
  );

  // Pan and zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetRef = useRef({ x: 0, y: 0 });

  // Recording system integration
  const {
    state: recordingState,
    start: startRecording,
    stop: stopRecording,
    pause: pauseRecording,
    resume: resumeRecording,
    createBookmark,
    recordBlockPlaced,
    recordBlockMoved,
  } = useRecording({
    metadata: {
      lessonTitle: 'Untitled Lesson',
    },
  });

  // Initialize viewport size
  useEffect(() => {
    if (canvasRef.current) {
      const { clientWidth, clientHeight } = canvasRef.current;
      setViewportSize({ width: clientWidth, height: clientHeight });
    }
  }, []);

  // Auto-animation for control variables (disabled to keep the canvas readable)
  useEffect(() => {
    return;
    // Animation code intentionally disabled
  }, [blocks, onBlocksChange]);

  // Evaluate logic gates and comparators when blocks or connections change
  useEffect(() => {
    const logicResults = evaluateAllLogicBlocks(blocks);
    if (logicResults.length > 0) {
      const updatedBlocks = updateLogicBlockResults(blocks, logicResults);
      if (!externalBlocks) {
        setInternalBlocks(updatedBlocks);
      }
      onBlocksChange?.(updatedBlocks);
    }
  }, [blocks, connections, externalBlocks, onBlocksChange]);

  const handleBlockClick = useCallback(
    (blockId: string) => {
      setSelectedBlockId(blockId);
      // Trigger interaction callback for playback mode
      if (isPlaybackMode) {
        onBlockInteract?.();
      }
    },
    [isPlaybackMode, onBlockInteract]
  );

  const handleBlockDimensionsChange = useCallback(
    (blockId: string, dimensions: { width: number; height: number }) => {
      const now = Date.now();

      if (readOnly) {
        return;
      }

      if (isPlaybackMode) {
        onBlockModification?.(blockId, { dimensions, updatedAt: now });
        return;
      }

      const updatedBlocks = blocks.map((b) =>
        b.id === blockId ? { ...b, dimensions, updatedAt: now } : b
      );

      if (!externalBlocks) {
        setInternalBlocks(updatedBlocks);
      }
      onBlocksChange?.(updatedBlocks);
    },
    [blocks, externalBlocks, isPlaybackMode, onBlockModification, onBlocksChange, readOnly]
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent, block: Block) => {
      e.stopPropagation();
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const blockPos = gridToPixels(block.position);

      setDragState({
        isDragging: true,
        blockId: block.id,
        startPosition: block.position,
        currentPosition: block.position,
        offset: { x: mouseX - blockPos.x, y: mouseY - blockPos.y },
      });
      isDraggingRef.current = true;
    },
    []
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState || !isDraggingRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - dragState.offset.x;
      const mouseY = e.clientY - rect.top - dragState.offset.y;
      setDragState(
        (prev) =>
          prev && { ...prev, currentPosition: pixelsToGrid(mouseX, mouseY) }
      );
    },
    [dragState]
  );

  const handleDragEnd = useCallback(() => {
    if (!dragState) return;
    const block = blocks.find((b) => b.id === dragState.blockId);
    if (!block) return;

    const validPosition = findNearestValidPosition(
      dragState.currentPosition,
      block.dimensions,
      blocks,
      block.id
    );
    const updatedBlock = {
      ...block,
      position: validPosition,
      updatedAt: Date.now(),
    };
    const adjustments = autoArrangeNeighbors(updatedBlock, [...blocks]);

    const newBlocks = blocks.map((b) => {
      const adjustment = adjustments.find((a) => a.blockId === b.id);
      if (adjustment)
        return { ...b, position: adjustment.newPosition, updatedAt: Date.now() };
      if (b.id === block.id) return updatedBlock;
      return b;
    });

    // Record block moved event if recording
    if (
      dragState.startPosition.x !== validPosition.x ||
      dragState.startPosition.y !== validPosition.y
    ) {
      recordBlockMoved(block.id, dragState.startPosition, validPosition);
    }

    if (!isPlaybackMode) {
      setInternalBlocks(newBlocks);
    }
    onBlocksChange?.(newBlocks);
    setDragState(null);
    isDraggingRef.current = false;
  }, [dragState, blocks, onBlocksChange, recordBlockMoved, isPlaybackMode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleCanvasDragStart = useCallback((e: React.DragEvent) => {
    // Prevent HTML5 native drag for blocks on canvas (we use custom mouse-based dragging)
    // Only allow HTML5 drag for items coming from the block library
    const target = e.target instanceof HTMLElement ? e.target : null;
    const isFromLibrary = target?.closest('[data-block-library-item]') !== null;
    if (!isFromLibrary) {
      e.preventDefault();
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!canvasRef.current || readOnly || isPlaybackMode) return;

      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      let preset: BlockPreset;
      try {
        const parsed: unknown = JSON.parse(data);
        // Validate that parsed data has the expected structure
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'type' in parsed &&
          typeof (parsed as Record<string, unknown>).type === 'string'
        ) {
          preset = parsed as BlockPreset;
        } else {
          return;
        }
      } catch {
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const scrollLeft = canvasRef.current.scrollLeft;
      const scrollTop = canvasRef.current.scrollTop;
      const x = e.clientX - rect.left + scrollLeft;
      const y = e.clientY - rect.top + scrollTop;
      const gridPosition = pixelsToGrid(x, y);

      onBlockDrop?.(preset, gridPosition);
    },
    [readOnly, isPlaybackMode, onBlockDrop]
  );

  // Pan handlers
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse button or Alt + click to pan
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        panOffsetRef.current = { x: pan.x, y: pan.y };
      }
    },
    [pan]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        e.preventDefault();
        setPan({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        });
      }
    },
    [isPanning]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setZoom((prev) => {
      const newZoom = Math.min(Math.max(prev + delta, 0.25), 3);
      return Math.round(newZoom * 100) / 100;
    });
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        handleZoom(delta);
      }
    },
    [handleZoom]
  );

  // Connection handlers
  const handleConnectionStart = useCallback(
    (blockId: string, handleId: string) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      setConnectionDrag({
        sourceBlockId: blockId,
        sourceHandleId: handleId,
        currentX: 0,
        currentY: 0,
      });
    },
    []
  );

  const handleConnectionMove = useCallback(
    (e: React.MouseEvent) => {
      if (!connectionDrag || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const gridX = (screenX - pan.x) / zoom;
      const gridY = (screenY - pan.y) / zoom;

      setConnectionDrag((prev) =>
        prev ? { ...prev, currentX: gridX, currentY: gridY } : null
      );
    },
    [connectionDrag, pan, zoom]
  );

  // Document-level mouse handlers for connection dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!connectionDrag || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const gridX = (screenX - pan.x) / zoom;
      const gridY = (screenY - pan.y) / zoom;

      setConnectionDrag((prev) =>
        prev ? { ...prev, currentX: gridX, currentY: gridY } : null
      );
    };

    const handleGlobalMouseUp = () => {
      if (connectionDrag) {
        setConnectionDrag(null);
      }
    };

    if (connectionDrag) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [connectionDrag, pan, zoom]);

  const handleConnectionEnd = useCallback(
    (targetBlockId: string, targetHandleId: string) => {
      if (!connectionDrag) return;

      const sourceBlock = blocks.find(
        (b) => b.id === connectionDrag.sourceBlockId
      );
      const targetBlock = blocks.find((b) => b.id === targetBlockId);

      if (!sourceBlock || !targetBlock) return;
      if (sourceBlock.id === targetBlock.id) return;

      const connectionType = getConnectionType(
        sourceBlock.type,
        targetBlock.type
      );
      if (!connectionType) return;

      // Check if connection already exists
      const existingConnection = connections.find(
        (c) =>
          c.sourceBlockId === sourceBlock.id &&
          c.targetBlockId === targetBlock.id
      );
      if (existingConnection) {
        setConnectionDrag(null);
        return;
      }

      const newConnection: BlockConnection = {
        id: `conn-${Date.now()}`,
        sourceBlockId: sourceBlock.id,
        sourceHandleId: connectionDrag.sourceHandleId,
        targetBlockId: targetBlock.id,
        targetHandleId: targetHandleId,
        type: connectionType,
        createdAt: Date.now(),
      };

      setConnections((prev) => [...prev, newConnection]);

      // Update logic block inputs
      const now = Date.now();
      if (isLogicBlock(targetBlock)) {
        const updatedBlocks = blocks.map((b) => {
          if (b.id === targetBlock.id && isLogicBlock(b)) {
            if (!b.inputs.includes(sourceBlock.id)) {
              return {
                ...b,
                inputs: [...b.inputs, sourceBlock.id],
                updatedAt: now,
              };
            }
          }
          return b;
        });
        if (!externalBlocks) {
          setInternalBlocks(updatedBlocks);
        }
        onBlocksChange?.(updatedBlocks);
      }

      // Update comparator block inputs
      if (isComparatorBlock(targetBlock)) {
        const updatedBlocks = blocks.map((b) => {
          if (b.id === targetBlock.id && isComparatorBlock(b)) {
            const updates: Partial<ComparatorBlock> = { updatedAt: now };
            // Determine if this is left or right input based on handleId
            if (targetHandleId.includes('left') || !b.leftInput) {
              updates.leftInput = sourceBlock.id;
            } else if (targetHandleId.includes('right') || !b.rightInput) {
              updates.rightInput = sourceBlock.id;
            }
            return { ...b, ...updates };
          }
          return b;
        });
        if (!externalBlocks) {
          setInternalBlocks(updatedBlocks);
        }
        onBlocksChange?.(updatedBlocks);
      }

      // Update constraint block target
      if (isConstraintBlock(sourceBlock)) {
        const updatedBlocks = blocks.map((b) => {
          if (b.id === sourceBlock.id && isConstraintBlock(b)) {
            return {
              ...b,
              targetEquationId: targetBlock.id,
              updatedAt: now,
            };
          }
          return b;
        });
        if (!externalBlocks) {
          setInternalBlocks(updatedBlocks);
        }
        onBlocksChange?.(updatedBlocks);
      }
    },
    [connectionDrag, blocks, externalBlocks, onBlocksChange]
  );

  const handleDeleteConnection = useCallback(
    (connectionId: string) => {
      const connection = connections.find((c) => c.id === connectionId);
      if (!connection) return;

      setConnections((prev) => prev.filter((c) => c.id !== connectionId));

      // Update logic block inputs
      const now = Date.now();
      const targetBlock = blocks.find((b) => b.id === connection.targetBlockId);
      if (targetBlock && isLogicBlock(targetBlock)) {
        const updatedBlocks = blocks.map((b) => {
          if (b.id === targetBlock.id && isLogicBlock(b)) {
            return {
              ...b,
              inputs: b.inputs.filter((id) => id !== connection.sourceBlockId),
              updatedAt: now,
            };
          }
          return b;
        });
        if (!externalBlocks) {
          setInternalBlocks(updatedBlocks);
        }
        onBlocksChange?.(updatedBlocks);
      }

      // Update comparator block inputs
      if (targetBlock && isComparatorBlock(targetBlock)) {
        const updatedBlocks = blocks.map((b) => {
          if (b.id === targetBlock.id && isComparatorBlock(b)) {
            const updates: Partial<ComparatorBlock> = { updatedAt: now };
            if (b.leftInput === connection.sourceBlockId) {
              updates.leftInput = null;
            }
            if (b.rightInput === connection.sourceBlockId) {
              updates.rightInput = null;
            }
            return { ...b, ...updates };
          }
          return b;
        });
        if (!externalBlocks) {
          setInternalBlocks(updatedBlocks);
        }
        onBlocksChange?.(updatedBlocks);
      }

      // Update constraint block target
      const sourceBlock = blocks.find((b) => b.id === connection.sourceBlockId);
      if (sourceBlock && isConstraintBlock(sourceBlock)) {
        const updatedBlocks = blocks.map((b) => {
          if (b.id === sourceBlock.id && isConstraintBlock(b)) {
            return {
              ...b,
              targetEquationId: null,
              updatedAt: now,
            };
          }
          return b;
        });
        if (!externalBlocks) {
          setInternalBlocks(updatedBlocks);
        }
        onBlocksChange?.(updatedBlocks);
      }
    },
    [connections, blocks, externalBlocks, onBlocksChange]
  );

  const handleConnectionClick = useCallback((connectionId: string) => {
    setSelectedConnectionId(connectionId);
  }, []);

  // Keyboard handler for deleting connections
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedConnectionId
      ) {
        handleDeleteConnection(selectedConnectionId);
        setSelectedConnectionId(undefined);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedConnectionId, handleDeleteConnection]);

  const renderBlock = useCallback(
    (block: Block) => {
      const isSelected = block.id === selectedBlockId;
      const isDragging = dragState?.blockId === block.id;
      const pos = gridToPixels(block.position);

      const commonProps = {
        isSelected,
        onClick: () => handleBlockClick(block.id),
        onMouseDown: (e: React.MouseEvent) => handleDragStart(e, block),
        onDimensionsChange: (dimensions: { width: number; height: number }) =>
          handleBlockDimensionsChange(block.id, dimensions),
        className: cn(
          'transition-shadow',
          isDragging ? 'z-50 cursor-grabbing shadow-2xl' : 'z-10'
        ),
        style: { left: pos.x, top: pos.y },
        readOnly: readOnly || isPlaybackMode,
        isConnecting: !!connectionDrag,
        connectingFromType: connectionDrag?.sourceBlockId
          ? blocks.find((b) => b.id === connectionDrag.sourceBlockId)?.type
          : undefined,
        onConnectionStart: (handleId: string) =>
          handleConnectionStart(block.id, handleId),
        onConnectionEnd: (handleId: string) =>
          handleConnectionEnd(block.id, handleId),
      };

      if (isEquationBlock(block)) {
        return (
          <EquationBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            onEquationChange={(newEquation) => {
              const now = Date.now();
              const parsed = parseEquation(newEquation);
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isEquationBlock(b)) {
                  return {
                    ...b,
                    equation: newEquation,
                    tokens: parsed.tokens,
                    variables: parsed.variables,
                    equationType: parsed.equationType,
                    updatedAt: now,
                  };
                }
                return b;
              });
              setInternalBlocks(updatedBlocks);
              onBlocksChange?.(updatedBlocks);
            }}
            onVariableChange={(varName, value) => {
              const now = Date.now();
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isEquationBlock(b)) {
                  const updatedVars =
                    b.variables?.map((v) =>
                      v.name === varName ? { ...v, value } : v
                    ) || [];
                  return { ...b, variables: updatedVars, updatedAt: now };
                }
                return b;
              });
              setInternalBlocks(updatedBlocks);
              onBlocksChange?.(updatedBlocks);
            }}
          />
        );
      }

      if (isChartBlock(block)) {
        const connectedEquations = (block.sourceEquationIds ?? [])
          .map((id) => blocks.find((b) => b.id === id && isEquationBlock(b)))
          .filter((eq): eq is EquationBlock => Boolean(eq));
        
        // Get connected constraints
        const connectedConstraints = blocks
          .filter((b): b is ConstraintBlock => isConstraintBlock(b) && b.targetEquationId === block.id)
          .map((b) => ({
            variableName: b.variableName,
            constraint: b.constraint,
          }));
        
        return (
          <ChartBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            connectedEquations={connectedEquations}
            connectedConstraints={connectedConstraints}
          />
        );
      }

      if (isControlBlock(block)) {
        return (
          <ControlBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            onVariableChange={(name, value) => {
              const now = Date.now();
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isControlBlock(b)) {
                  const numValue =
                    typeof value === 'string' ? parseFloat(value) : value;
                  const variables = b.variables.map((v) =>
                    v.name === name ? { ...v, value: numValue } : v
                  );
                  return { ...b, variables, updatedAt: now };
                }
                return b;
              });
              setInternalBlocks(updatedBlocks);
              onBlocksChange?.(updatedBlocks);
            }}
          />
        );
      }

      if (isDescriptionBlock(block)) {
        return (
          <DescriptionBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
          />
        );
      }

      if (isLimitBlock(block)) {
        return (
          <LimitBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            variableOptions={(() => {
              if (!block.targetEquationId) return undefined;
              const eq = blocks.find(
                (b) => b.id === block.targetEquationId && isEquationBlock(b)
              );
              if (!eq || !isEquationBlock(eq)) return undefined;
              const vars = eq.variables ?? parseEquation(eq.equation).variables;
              return vars.map((v: { name: string }) => v.name);
            })()}
            onVariableChange={(varName, value) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isLimitBlock(b)) {
                  if (
                    varName === 'variableName' &&
                    typeof value === 'string'
                  ) {
                    return {
                      ...b,
                      variableName: value,
                      updatedAt: Date.now(),
                    };
                  }
                  if (
                    varName === 'limitValue' &&
                    typeof value === 'number'
                  ) {
                    return {
                      ...b,
                      limitValue: value,
                      updatedAt: Date.now(),
                    };
                  }
                  return b;
                }
                return b;
              });
              setInternalBlocks(updatedBlocks);
              onBlocksChange?.(updatedBlocks);
            }}
            onApproachChange={(approach) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isLimitBlock(b)) {
                  return { ...b, approach, updatedAt: Date.now() };
                }
                return b;
              });
              setInternalBlocks(updatedBlocks);
              onBlocksChange?.(updatedBlocks);
            }}
          />
        );
      }

      if (isShapeBlock(block)) {
        return (
          <ShapeBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            onFillValueChange={(value) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isShapeBlock(b)) {
                  return { ...b, fillValue: value, updatedAt: Date.now() };
                }
                return b;
              });
              setInternalBlocks(updatedBlocks);
              onBlocksChange?.(updatedBlocks);
            }}
            onFillColorChange={(color) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isShapeBlock(b)) {
                  return { ...b, fillColor: color, updatedAt: Date.now() };
                }
                return b;
              });
              setInternalBlocks(updatedBlocks);
              onBlocksChange?.(updatedBlocks);
            }}
            onFillModeChange={(mode) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isShapeBlock(b)) {
                  return { ...b, fillMode: mode, updatedAt: Date.now() };
                }
                return b;
              });
              setInternalBlocks(updatedBlocks);
              onBlocksChange?.(updatedBlocks);
            }}
            onShapeTypeChange={(shapeType) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isShapeBlock(b)) {
                  return { ...b, shapeType, updatedAt: Date.now() };
                }
                return b;
              });
              setInternalBlocks(updatedBlocks);
              onBlocksChange?.(updatedBlocks);
            }}
            onGridToggle={() => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isShapeBlock(b)) {
                  return { ...b, showGrid: !b.showGrid, updatedAt: Date.now() };
                }
                return b;
              });
              setInternalBlocks(updatedBlocks);
              onBlocksChange?.(updatedBlocks);
            }}
          />
        );
      }

      if (isLogicBlock(block)) {
        return (
          <LogicBlockComponent key={block.id} block={block} {...commonProps} />
        );
      }

      if (isComparatorBlock(block)) {
        return (
          <ComparatorBlockComponent key={block.id} block={block} {...commonProps} />
        );
      }

      if (isConstraintBlock(block)) {
        return (
          <ConstraintBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            onVariableChange={(varName, value) => {
              const now = Date.now();
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isConstraintBlock(b)) {
                  if (varName === 'variableName' && typeof value === 'string') {
                    return { ...b, variableName: value, updatedAt: now };
                  }
                  return b;
                }
                return b;
              });
              setInternalBlocks(updatedBlocks);
              onBlocksChange?.(updatedBlocks);
            }}
            onConstraintChange={(type, values) => {
              const now = Date.now();
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isConstraintBlock(b)) {
                  const constraint = { ...b.constraint, type };
                  if (Array.isArray(values)) {
                    constraint.min = values[0];
                    constraint.max = values[1];
                  } else {
                    constraint.min = values;
                  }
                  return { ...b, constraint, updatedAt: now };
                }
                return b;
              });
              setInternalBlocks(updatedBlocks);
              onBlocksChange?.(updatedBlocks);
            }}
          />
        );
      }

      if (isVariableBlock(block)) {
        return (
          <VariableBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            onVariableChange={(name, value) => {
              const now = Date.now();
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isVariableBlock(b)) {
                  const variables = b.variables.map((v) =>
                    v.name === name ? { ...v, value } : v
                  );
                  return { ...b, variables, updatedAt: now };
                }
                return b;
              });
              setInternalBlocks(updatedBlocks);
              onBlocksChange?.(updatedBlocks);
            }}
          />
        );
      }

      return null;
    },
    [
      selectedBlockId,
      dragState,
      handleBlockClick,
      handleDragStart,
      readOnly,
      isPlaybackMode,
      connectionDrag,
      handleConnectionStart,
      handleConnectionEnd,
      blocks,
      onBlocksChange,
    ]
  );

  return (
    <div className={cn('relative flex h-full w-full flex-col', className)}>
      {/* Top Toolbar - Hidden in playback mode */}
      {!isPlaybackMode && (
        <div className="z-20 flex items-center justify-end gap-4 border-b border-border bg-card p-2 shadow-sm">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={gridVisible}
              onChange={(e) => setGridVisible(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Show Grid
          </label>
          {/* Recording Controls */}
          <RecordingControls
            isRecording={
              recordingState.status === 'recording' ||
              recordingState.status === 'paused'
            }
            isPaused={recordingState.status === 'paused'}
            currentTime={recordingState.currentTime}
            onStart={() => {
              void startRecording();
            }}
            onStop={() => {
              void stopRecording();
            }}
            onPause={pauseRecording}
            onResume={resumeRecording}
            onCreateBookmark={createBookmark}
          />
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative flex-1 overflow-hidden bg-background select-none"
        onClick={() => setSelectedBlockId(undefined)}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={(e) => {
          handleCanvasMouseMove(e);
          handleDragMove(e);
          handleConnectionMove(e);
        }}
        onMouseUp={() => {
          handleCanvasMouseUp();
          handleDragEnd();
        }}
        onMouseLeave={() => {
          handleCanvasMouseUp();
          handleDragEnd();
        }}
        onWheel={handleWheel}
        onDragStart={handleCanvasDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {/* Zoom and Pan Controls */}
        {!isPlaybackMode && (
          <div className="absolute right-4 bottom-4 z-30 flex items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-lg">
            <button
              onClick={() => handleZoom(-0.1)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-lg hover:bg-accent"
              disabled={zoom <= 0.25}
            >
              −
            </button>
            <span className="min-w-[3rem] text-center text-sm font-medium">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.1)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-lg hover:bg-accent"
              disabled={zoom >= 3}
            >
              +
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-xs hover:bg-accent"
              title="Reset view"
            >
              ⟲
            </button>
          </div>
        )}

        {/* Transformed Content */}
        <div
          className="absolute inset-0 origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: '100%',
            height: '100%',
          }}
        >
          {gridVisible && (
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, oklch(0.542 0.034 322.5 / 0.3) 1px, transparent 1px),
                  linear-gradient(to bottom, oklch(0.542 0.034 322.5 / 0.3) 1px, transparent 1px)
                `,
                backgroundSize: `${GRID_UNIT}px ${GRID_UNIT}px`,
              }}
            />
          )}
          {blocks.map(renderBlock)}
        </div>

        {/* Drag Preview (outside transform to avoid scaling) */}
        {dragState &&
          (() => {
            const draggedBlock = blocks.find((b) => b.id === dragState.blockId);
            const pos = gridToPixels(dragState.currentPosition);
            const width =
              Math.ceil(draggedBlock?.dimensions.width || 6) * GRID_UNIT;
            const height =
              Math.ceil(draggedBlock?.dimensions.height || 2) * GRID_UNIT;

            return (
              <div
                className="pointer-events-none absolute z-50 opacity-50"
                style={{
                  left: pan.x + pos.x * zoom,
                  top: pan.y + pos.y * zoom,
                  width: width * zoom,
                  height: height * zoom,
                }}
              >
                <div className="h-full w-full rounded-lg border-2 border-primary bg-primary/20" />
              </div>
            );
          })()}

        {/* Connection Layer */}
        <ConnectionLayer
          blocks={blocks}
          connections={connections}
          selectedConnectionId={selectedConnectionId}
          onConnectionClick={handleConnectionClick}
          zoom={zoom}
          pan={pan}
        />

        {/* Connection Preview (while dragging) */}
        {connectionDrag &&
          (() => {
            const sourceBlock = blocks.find(
              (b) => b.id === connectionDrag.sourceBlockId
            );
            if (!sourceBlock) return null;

            // Calculate start position (output handle of source block) in screen coordinates
            const startPos = {
              x:
                (sourceBlock.position.x * GRID_UNIT +
                  sourceBlock.dimensions.width * GRID_UNIT) *
                  zoom +
                pan.x,
              y:
                (sourceBlock.position.y * GRID_UNIT +
                  (sourceBlock.dimensions.height * GRID_UNIT) / 2) *
                  zoom +
                pan.y,
            };

            // End position is the cursor in screen coordinates
            const endPos = {
              x: connectionDrag.currentX * zoom + pan.x,
              y: connectionDrag.currentY * zoom + pan.y,
            };

            return (
              <svg
                className="pointer-events-none absolute inset-0"
                style={{ zIndex: 1000, width: '100%', height: '100%' }}
              >
                <ConnectionPreview
                  startX={startPos.x}
                  startY={startPos.y}
                  endX={endPos.x}
                  endY={endPos.y}
                  isValid={true}
                />
              </svg>
            );
          })()}
      </div>

      {/* Recording Status Bar */}
      {(recordingState.status === 'recording' ||
        recordingState.status === 'paused' ||
        recordingState.audioSegments.length > 0) && (
        <RecordingStatusBar
          isRecording={recordingState.status === 'recording'}
          isPaused={recordingState.status === 'paused'}
          currentTime={recordingState.currentTime}
          events={recordingState.events}
          audioSegments={recordingState.audioSegments}
        />
      )}
    </div>
  );
}

export default GridCanvas;
