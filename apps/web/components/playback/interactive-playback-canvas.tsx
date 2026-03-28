/**
 * Interactive Playback Canvas
 * 
 * Allows students to manipulate blocks and variables during lesson playback.
 * Automatically pauses when student interacts, with option to resume and keep/revert changes.
 */

'use client';

import { useState, useCallback } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import type { Block } from '@/lib/block-system/types';
import type { RecordingEvent } from '@/lib/recording-system/types';
import { useInteractivePlayback } from '@/lib/recording-system/use-interactive-playback';
import { GridCanvas } from '@/components/blocks/grid-canvas';

interface InteractivePlaybackCanvasProps {
  originalBlocks: Block[];
  events: RecordingEvent[];
  isPlaying: boolean;
  currentTime: number;
  onPause: () => void;
  onPlay: () => void;
  onBlocksChange?: (blocks: Block[]) => void;
  className?: string;
}

export function InteractivePlaybackCanvas({
  originalBlocks,
  events,
  isPlaying,
  currentTime,
  onPause,
  onPlay,
  onBlocksChange,
  className,
}: InteractivePlaybackCanvasProps) {
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  const {
    isPausedForEdit,
    hasUnsavedChanges,
    modifiedBlocks,
    manipulationHistory,
    pauseForEdit,
    resumePlayback,
    revertChanges,
    applyBlockModification,
    applyVariableChange,
  } = useInteractivePlayback({
    originalBlocks,
    events,
    isPlaying,
    currentTime,
    onPause: () => {
      onPause();
      setShowResumeDialog(true);
    },
    onPlay,
    onBlocksChange,
  });

  // Handle user interaction that should pause playback
  const handleUserInteraction = useCallback(() => {
    if (isPlaying && !isPausedForEdit) {
      pauseForEdit();
    }
  }, [isPlaying, isPausedForEdit, pauseForEdit]);

  // Handle resume with choice
  const handleResume = useCallback((keepChanges: boolean) => {
    setShowResumeDialog(false);
    resumePlayback(keepChanges);
    if (!keepChanges) {
      revertChanges();
    }
  }, [resumePlayback, revertChanges]);

  return (
    <div className={cn('relative flex h-full w-full flex-col', className)}>
      {/* Main Canvas */}
      <div className="relative flex-1">
        <GridCanvas
          blocks={modifiedBlocks}
          isPlaybackMode
          onBlockInteract={handleUserInteraction}
          onBlockModification={applyBlockModification}
          onVariableChange={applyVariableChange}
          readOnly={!isPausedForEdit}
        />

        {/* Edit Mode Indicator */}
        {isPausedForEdit && (
          <div className="absolute top-4 right-4 z-50">
            <Card className="w-80">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <CardTitle className="text-base">Paused for Editing</CardTitle>
                </div>
                <CardDescription>
                  {hasUnsavedChanges
                    ? 'You have unsaved changes. Choose how to resume.'
                    : 'Make changes to blocks or variables.'}
                </CardDescription>
              </CardHeader>
              {hasUnsavedChanges && (
                <CardContent className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium">Changes made:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {manipulationHistory.slice(-3).map((action) => (
                        <li key={action.id} className="truncate">
                          {formatActionDescription(action)}
                        </li>
                      ))}
                      {manipulationHistory.length > 3 && (
                        <li className="text-muted-foreground">
                          +{manipulationHistory.length - 3} more changes
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              )}
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    revertChanges();
                    onPlay();
                    setShowResumeDialog(false);
                  }}
                  className="flex-1"
                >
                  Revert & Resume
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    resumePlayback(true);
                    setShowResumeDialog(false);
                  }}
                  className="flex-1"
                >
                  Keep Changes & Resume
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>

      {/* Resume Confirmation Dialog */}
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasUnsavedChanges ? 'Unsaved Changes' : 'Resume Playback?'}
            </DialogTitle>
            <DialogDescription>
              {hasUnsavedChanges
                ? 'You have made changes to the lesson. How would you like to resume?'
                : 'Are you ready to continue watching?'}
            </DialogDescription>
          </DialogHeader>
          {hasUnsavedChanges && (
            <div className="py-4">
              <div className="rounded-lg border bg-muted p-3">
                <p className="text-sm font-medium mb-2">Changes made:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {manipulationHistory.slice(-5).map((action) => (
                    <li key={action.id} className="truncate">
                      • {formatActionDescription(action)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleResume(false)}
            >
              {hasUnsavedChanges ? 'Discard Changes' : 'Cancel'}
            </Button>
            {hasUnsavedChanges && (
              <Button
                variant="secondary"
                onClick={() => {
                  revertChanges();
                  handleResume(false);
                }}
              >
                Revert & Resume
              </Button>
            )}
            <Button
              onClick={() => handleResume(true)}
            >
              {hasUnsavedChanges ? 'Keep Changes' : 'Resume'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to format action descriptions
interface ManipulationAction {
  type: 'BLOCK_MODIFIED' | 'VARIABLE_CHANGED' | 'BLOCK_ADDED' | 'BLOCK_DELETED';
  data: {
    blockId?: string;
    variableName?: string;
    value?: number;
  };
}

function formatActionDescription(action: ManipulationAction): string {
  switch (action.type) {
    case 'BLOCK_MODIFIED':
      return `Modified block ${action.data.blockId}`;
    case 'VARIABLE_CHANGED':
      return `Changed ${action.data.variableName} to ${action.data.value}`;
    case 'BLOCK_ADDED':
      return 'Added new block';
    case 'BLOCK_DELETED':
      return 'Deleted block';
    default:
      return 'Made a change';
  }
}

// This would be an enhanced version of GridCanvas that supports playback mode
// For now, we'll export the main component and GridCanvas can be updated separately
export default InteractivePlaybackCanvas;
