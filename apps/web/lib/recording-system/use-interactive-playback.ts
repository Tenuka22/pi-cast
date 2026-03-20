/**
 * useInteractivePlayback Hook
 * 
 * Enables interactive manipulation of blocks and variables during playback.
 * Allows students to experiment without breaking the lecture flow.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { RecordingEvent, BlockPlacedData, BlockMovedData, VariableSliderChangedData } from '@/lib/recording-system/types';
import type { Block, GridPosition, BlockDimensions, EquationBlock, ChartBlock, ControlBlock, DescriptionBlock, LimitBlock } from '@/lib/block-system/types';

// Type guard functions
function isValidBlockType(type: string): type is Block['type'] {
  return ['equation', 'chart', 'control', 'description', 'limit', 'shape'].includes(type);
}

function isBlockPlacedData(data: unknown): data is BlockPlacedData {
  if (typeof data !== 'object' || data === null) return false;
  const record = data as Record<string, unknown>;
  return 'blockId' in record &&
    'blockType' in record &&
    'position' in record &&
    typeof record.blockId === 'string' &&
    typeof record.blockType === 'string' &&
    isValidBlockType(record.blockType) &&
    typeof record.position === 'object' &&
    record.position !== null &&
    isValidGridPosition(record.position);
}

function isBlockMovedData(data: unknown): data is BlockMovedData {
  if (typeof data !== 'object' || data === null) return false;
  const record = data as Record<string, unknown>;
  return 'blockId' in record &&
    'fromPosition' in record &&
    'toPosition' in record &&
    typeof record.blockId === 'string' &&
    typeof record.toPosition === 'object' &&
    record.toPosition !== null &&
    isValidGridPosition(record.toPosition);
}

function isVariableSliderChangedData(data: unknown): data is VariableSliderChangedData {
  if (typeof data !== 'object' || data === null) return false;
  const record = data as Record<string, unknown>;
  return 'blockId' in record &&
    'variableName' in record &&
    'newValue' in record &&
    typeof record.blockId === 'string' &&
    typeof record.variableName === 'string' &&
    typeof record.newValue === 'number';
}

function isValidGridPosition(pos: unknown): pos is GridPosition {
  return typeof pos === 'object' && pos !== null && 'x' in pos && 'y' in pos &&
    typeof (pos as Record<string, unknown>).x === 'number' &&
    typeof (pos as Record<string, unknown>).y === 'number';
}

function isValidBlockDimensions(dim: unknown): dim is BlockDimensions {
  return typeof dim === 'object' && dim !== null && 'width' in dim && 'height' in dim;
}

export interface ManipulationState {
  isPausedForEdit: boolean;
  hasUnsavedChanges: boolean;
  originalBlocks: Block[];
  modifiedBlocks: Block[];
  manipulationHistory: ManipulationAction[];
}

export interface ManipulationAction {
  id: string;
  type: 'BLOCK_MODIFIED' | 'VARIABLE_CHANGED' | 'BLOCK_ADDED' | 'BLOCK_DELETED';
  timestamp: number;
  data: Record<string, unknown>;
}

export interface InteractivePlaybackState {
  // Manipulation state
  isPausedForEdit: boolean;
  hasUnsavedChanges: boolean;
  canResume: boolean;
  
  // Block manipulation
  modifiedBlocks: Block[];
  manipulationHistory: ManipulationAction[];
  
  // Variable overrides
  variableOverrides: Map<string, number>;
  
  // Actions
  pauseForEdit: () => void;
  resumePlayback: (keepChanges: boolean) => void;
  revertChanges: () => void;
  applyBlockModification: (blockId: string, modifications: Partial<Block>) => void;
  applyVariableChange: (blockId: string, variableName: string, value: number) => void;
  addManipulationAction: (action: ManipulationAction) => void;
}

interface UseInteractivePlaybackOptions {
  originalBlocks: Block[];
  events: RecordingEvent[];
  isPlaying: boolean;
  currentTime: number;
  onPause?: () => void;
  onPlay?: () => void;
  onBlocksChange?: (blocks: Block[]) => void;
}

export function useInteractivePlayback({
  originalBlocks,
  events,
  isPlaying,
  currentTime,
  onPause,
  onPlay,
  onBlocksChange,
}: UseInteractivePlaybackOptions): InteractivePlaybackState {
  const [isPausedForEdit, setIsPausedForEdit] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [modifiedBlocks, setModifiedBlocks] = useState<Block[]>(originalBlocks);
  const [manipulationHistory, setManipulationHistory] = useState<ManipulationAction[]>([]);
  const [variableOverrides, setVariableOverrides] = useState<Map<string, number>>(new Map());

  const lastEventTimeRef = useRef<number>(0);
  const isUserInteractionRef = useRef<boolean>(false);

  // Update modified blocks when original blocks change (e.g., during playback)
  useEffect(() => {
    if (!isPausedForEdit && !hasUnsavedChanges) {
      // Use functional update to avoid stale closure
      setModifiedBlocks((current) => {
        // Only update if the blocks are actually different
        if (current !== originalBlocks) {
          return originalBlocks;
        }
        return current;
      });
    }
  }, [originalBlocks, isPausedForEdit, hasUnsavedChanges]);

  // Apply a recording event to blocks
  const applyEventToBlocks = useCallback((event: RecordingEvent) => {
    setModifiedBlocks((prev) => {
      let newBlocks = [...prev];

      switch (event.type) {
        case 'BLOCK_PLACED': {
          const data = event.data;
          if (isBlockPlacedData(data) && !newBlocks.find((b) => b.id === data.blockId)) {
            const position: GridPosition = isValidGridPosition(data.position) ? data.position : { x: 0, y: 0 };
            const dimensions: BlockDimensions = isValidBlockDimensions(data.dimensions) ? data.dimensions : { width: 4, height: 1 };
            if (!isValidBlockType(data.blockType)) break;

            // Create appropriate block based on type
            if (data.blockType === 'equation') {
              const newBlock: EquationBlock = {
                id: data.blockId,
                type: data.blockType,
                position,
                dimensions,
                equation: data.equation ?? '',
                createdAt: event.timestamp,
                updatedAt: event.timestamp,
              };
              newBlocks = [...newBlocks, newBlock];
            } else {
              // For other block types, create a minimal block with proper typing
              const baseBlock = {
                id: data.blockId,
                type: data.blockType,
                position,
                dimensions,
                createdAt: event.timestamp,
                updatedAt: event.timestamp,
              };
              
              // Type-safe block creation based on type
              switch (data.blockType) {
                case 'chart': {
                  const newBlock: ChartBlock = { ...baseBlock, type: 'chart', equations: [] };
                  newBlocks = [...newBlocks, newBlock];
                  break;
                }
                case 'control': {
                  const newBlock: ControlBlock = { ...baseBlock, type: 'control', layout: 'vertical', variables: [] };
                  newBlocks = [...newBlocks, newBlock];
                  break;
                }
                case 'description': {
                  const newBlock: DescriptionBlock = { ...baseBlock, type: 'description', content: '', format: 'plain' };
                  newBlocks = [...newBlocks, newBlock];
                  break;
                }
                case 'limit': {
                  const newBlock: LimitBlock = { ...baseBlock, type: 'limit', variableName: 'x', limitValue: 0, approach: 'both' };
                  newBlocks = [...newBlocks, newBlock];
                  break;
                }
                case 'shape': {
                  const newBlock: import('@/lib/block-system/types').ShapeBlock = { ...baseBlock, type: 'shape', shapeType: 'square', fillColor: '#7c3aed', fillValue: 50, fillMode: 'percentage', showGrid: true };
                  newBlocks = [...newBlocks, newBlock];
                  break;
                }
                default:
                  break;
              }
            }
          }
          break;
        }
        case 'BLOCK_MOVED': {
          const data = event.data;
          if (isBlockMovedData(data)) {
            const toPosition: GridPosition = isValidGridPosition(data.toPosition) ? data.toPosition : { x: 0, y: 0 };
            newBlocks = newBlocks.map((b) =>
              b.id === data.blockId
                ? { ...b, position: toPosition, updatedAt: event.timestamp }
                : b
            );
          }
          break;
        }
        case 'VARIABLE_SLIDER_CHANGED': {
          const data = event.data;
          if (isVariableSliderChangedData(data)) {
            newBlocks = newBlocks.map((b) => {
              if (b.id === data.blockId && b.type === 'control' && 'variables' in b) {
                const updatedVars = b.variables.map((v) =>
                  v.name === data.variableName ? { ...v, value: data.newValue } : v
                );
                return {
                  ...b,
                  variables: updatedVars,
                  updatedAt: event.timestamp,
                };
              }
              return b;
            });
          }
          break;
        }
      }

      return newBlocks;
    });
  }, []);

  // Process events and update blocks during playback
  useEffect(() => {
    if (isPausedForEdit) return;

    // Find events that should have been triggered by now
    const relevantEvents = events.filter(
      (event) => event.timestamp <= currentTime && event.timestamp > lastEventTimeRef.current
    );

    for (const event of relevantEvents) {
      switch (event.type) {
        case 'BLOCK_PLACED':
        case 'BLOCK_MOVED':
        case 'PARAMETER_CHANGED':
        case 'VARIABLE_SLIDER_CHANGED':
          // Apply event to blocks if not in edit mode
          if (!isPausedForEdit && !hasUnsavedChanges) {
            applyEventToBlocks(event);
          }
          break;
      }
    }

    if (relevantEvents.length > 0) {
      lastEventTimeRef.current = currentTime;
    }
  }, [currentTime, events, isPausedForEdit, hasUnsavedChanges, applyEventToBlocks]);

  // Pause playback for editing
  const pauseForEdit = useCallback(() => {
    if (isPlaying) {
      onPause?.();
      setIsPausedForEdit(true);
    }
  }, [isPlaying, onPause]);

  // Resume playback
  const resumePlayback = useCallback((keepChanges: boolean) => {
    if (!keepChanges) {
      // Revert to original blocks
      setModifiedBlocks(originalBlocks);
      setManipulationHistory([]);
      setVariableOverrides(new Map());
      setHasUnsavedChanges(false);
    } else {
      // Keep changes but mark as applied
      setHasUnsavedChanges(false);
    }
    
    setIsPausedForEdit(false);
    onPlay?.();
  }, [originalBlocks, onPlay]);

  // Revert all changes
  const revertChanges = useCallback(() => {
    setModifiedBlocks(originalBlocks);
    setManipulationHistory([]);
    setVariableOverrides(new Map());
    setHasUnsavedChanges(false);
  }, [originalBlocks]);

  // Apply block modification
  const applyBlockModification = useCallback((blockId: string, modifications: Partial<Block>) => {
    isUserInteractionRef.current = true;

    setModifiedBlocks((prev) => {
      const updated = prev.map((b) => {
        if (b.id === blockId) {
          // Type-safe update: only allow modifications that match the block type
          // We extract only the properties that are valid for this block type
          const baseUpdate = { updatedAt: Date.now() };
          
          switch (b.type) {
            case 'equation': {
              const eqBlock: EquationBlock = b;
              return {
                ...eqBlock,
                ...(modifications as Partial<EquationBlock>),
                ...baseUpdate,
              };
            }
            case 'chart': {
              const chartBlock: ChartBlock = b;
              return {
                ...chartBlock,
                ...(modifications as Partial<ChartBlock>),
                ...baseUpdate,
              };
            }
            case 'control': {
              const controlBlock: ControlBlock = b;
              return {
                ...controlBlock,
                ...(modifications as Partial<ControlBlock>),
                ...baseUpdate,
              };
            }
            case 'description': {
              const descBlock: DescriptionBlock = b;
              return {
                ...descBlock,
                ...(modifications as Partial<DescriptionBlock>),
                ...baseUpdate,
              };
            }
            case 'limit': {
              const limitBlock: LimitBlock = b;
              return {
                ...limitBlock,
                ...(modifications as Partial<LimitBlock>),
                ...baseUpdate,
              };
            }
            case 'shape': {
              const shapeBlock: import('@/lib/block-system/types').ShapeBlock = b;
              return {
                ...shapeBlock,
                ...(modifications as Partial<import('@/lib/block-system/types').ShapeBlock>),
                ...baseUpdate,
              };
            }
            case 'logic': {
              const logicBlock: import('@/lib/block-system/types').LogicBlock = b;
              return {
                ...logicBlock,
                ...(modifications as Partial<import('@/lib/block-system/types').LogicBlock>),
                ...baseUpdate,
              };
            }
            case 'variable': {
              const variableBlock: import('@/lib/block-system/types').VariableBlock = b;
              return {
                ...variableBlock,
                ...(modifications as Partial<import('@/lib/block-system/types').VariableBlock>),
                ...baseUpdate,
              };
            }
            default:
              // For unknown block types, only apply the base update
              return Object.assign({}, b, baseUpdate);
          }
        }
        return b;
      });
      return updated;
    });

    setHasUnsavedChanges(true);

    // Record manipulation action
    const action: ManipulationAction = {
      id: `manipulation-${Date.now()}`,
      type: 'BLOCK_MODIFIED',
      timestamp: Date.now(),
      data: { blockId, modifications },
    };

    setManipulationHistory((prev) => [...prev, action]);

    // Notify parent of changes
    onBlocksChange?.(modifiedBlocks);

    isUserInteractionRef.current = false;
  }, [modifiedBlocks, onBlocksChange]);

  // Apply variable change
  const applyVariableChange = useCallback((blockId: string, variableName: string, value: number) => {
    isUserInteractionRef.current = true;

    setModifiedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === 'control' && b.variables) {
          const updatedVariables = b.variables.map((v) =>
            v.name === variableName ? { ...v, value } : v
          );
          const updatedBlock: ControlBlock = {
            ...b,
            variables: updatedVariables,
            updatedAt: Date.now(),
          };
          return updatedBlock;
        }
        return b;
      })
    );

    // Track variable override
    setVariableOverrides((prev) => {
      const newMap = new Map(prev);
      newMap.set(`${blockId}:${variableName}`, value);
      return newMap;
    });
    
    setHasUnsavedChanges(true);
    
    // Record manipulation action
    const action: ManipulationAction = {
      id: `manipulation-${Date.now()}`,
      type: 'VARIABLE_CHANGED',
      timestamp: Date.now(),
      data: { blockId, variableName, value },
    };
    
    setManipulationHistory((prev) => [...prev, action]);
    
    // Notify parent of changes
    onBlocksChange?.(modifiedBlocks);
    
    isUserInteractionRef.current = false;
  }, [modifiedBlocks, onBlocksChange]);

  // Add manipulation action
  const addManipulationAction = useCallback((action: ManipulationAction) => {
    setManipulationHistory((prev) => [...prev, action]);
    setHasUnsavedChanges(true);
  }, []);

  return {
    // State
    isPausedForEdit,
    hasUnsavedChanges,
    canResume: isPausedForEdit,
    modifiedBlocks,
    manipulationHistory,
    variableOverrides,
    
    // Actions
    pauseForEdit,
    resumePlayback,
    revertChanges,
    applyBlockModification,
    applyVariableChange,
    addManipulationAction,
  };
}

export default useInteractivePlayback;
