/**
 * useInteractivePlayback Hook
 * 
 * Enables interactive manipulation of blocks and variables during playback.
 * Allows students to experiment without breaking the lecture flow.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { RecordingEvent } from '@/lib/recording-system/types';
import type { Block, GridPosition } from '@/lib/block-system/types';

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
      setModifiedBlocks(originalBlocks);
    }
  }, [originalBlocks, isPausedForEdit, hasUnsavedChanges]);

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
  }, [currentTime, events, isPausedForEdit, hasUnsavedChanges]);

  // Apply a recording event to blocks
  const applyEventToBlocks = useCallback((event: RecordingEvent) => {
    setModifiedBlocks((prev) => {
      let newBlocks = [...prev];

      switch (event.type) {
        case 'BLOCK_PLACED': {
          const data = event.data as any;
          if (!newBlocks.find((b) => b.id === data.blockId)) {
            const newBlock: Block = {
              id: data.blockId,
              type: data.blockType,
              position: data.position as GridPosition,
              dimensions: data.dimensions || { width: 4, height: 1 },
              equation: data.equation,
              createdAt: event.timestamp,
              updatedAt: event.timestamp,
            };
            newBlocks = [...newBlocks, newBlock];
          }
          break;
        }
        case 'BLOCK_MOVED': {
          const data = event.data as any;
          newBlocks = newBlocks.map((b) =>
            b.id === data.blockId
              ? { ...b, position: data.toPosition, updatedAt: event.timestamp }
              : b
          );
          break;
        }
        case 'VARIABLE_SLIDER_CHANGED': {
          const data = event.data as any;
          newBlocks = newBlocks.map((b) => {
            if (b.id === data.blockId && 'variables' in b) {
              return {
                ...b,
                variables: {
                  ...b.variables,
                  [data.variableName]: data.newValue,
                },
                updatedAt: event.timestamp,
              } as Block;
            }
            return b;
          });
          break;
        }
      }

      return newBlocks;
    });
  }, []);

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

    setModifiedBlocks((prev): Block[] =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, ...modifications, updatedAt: Date.now() } as Block
          : b
      )
    );
    
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
        if (b.id === blockId && 'variables' in b) {
          return {
            ...b,
            variables: {
              ...b.variables,
              [variableName]: value,
            },
            updatedAt: Date.now(),
          } as Block;
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
