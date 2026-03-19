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
  parseEquation,
  gridToPixels,
  pixelsToGrid,
  findNearestValidPosition,
  autoArrangeNeighbors,
  getDefaultBlockDimensions,
} from '@/lib/block-system/types';
import {
  EquationBlockComponent,
  ChartBlockComponent,
  ControlBlockComponent,
  DescriptionBlockComponent,
} from './block-components';
import { useRecording } from '@/lib/recording-system/use-recording';
import { RecordingControls } from '@/components/recording/recording-controls';
import { RecordingStatusBar } from '@/components/recording/recording-status-bar';

interface GridCanvasProps {
  className?: string;
  onBlocksChange?: (blocks: Block[]) => void;
}

export function GridCanvas({ className, onBlocksChange }: GridCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>();
  const [gridVisible, setGridVisible] = useState(true);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const isDraggingRef = useRef(false);

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

  useEffect(() => {
    if (canvasRef.current) {
      const { clientWidth, clientHeight } = canvasRef.current;
      setViewportSize({ width: clientWidth, height: clientHeight });
    }
  }, []);

  const handleBlockClick = useCallback((blockId: string) => setSelectedBlockId(blockId), []);

  const handleDragStart = useCallback((e: React.MouseEvent, block: Block) => {
    e.stopPropagation();
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
    setSelectedBlockId(block.id);
  }, []);

  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!dragState || !isDraggingRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - dragState.offset.x;
    const mouseY = e.clientY - rect.top - dragState.offset.y;
    setDragState((prev) => prev && { ...prev, currentPosition: pixelsToGrid(mouseX, mouseY) });
  }, [dragState]);

  const handleDragEnd = useCallback(() => {
    if (!dragState) return;
    const block = blocks.find((b) => b.id === dragState.blockId);
    if (!block) return;

    const validPosition = findNearestValidPosition(dragState.currentPosition, block.dimensions, blocks, block.id);
    const updatedBlock = { ...block, position: validPosition, updatedAt: Date.now() };
    const adjustments = autoArrangeNeighbors(updatedBlock, [...blocks]);

    const newBlocks = blocks.map((b) => {
      const adjustment = adjustments.find((a) => a.blockId === b.id);
      if (adjustment) return { ...b, position: adjustment.newPosition, updatedAt: Date.now() };
      if (b.id === block.id) return updatedBlock;
      return b;
    });

    // Record block moved event if recording
    if (dragState.startPosition.x !== validPosition.x || dragState.startPosition.y !== validPosition.y) {
      recordBlockMoved(block.id, dragState.startPosition, validPosition);
    }

    setBlocks(newBlocks);
    onBlocksChange?.(newBlocks);
    setDragState(null);
    isDraggingRef.current = false;
  }, [dragState, blocks, onBlocksChange, recordBlockMoved]);

  const createEquationBlock = (position: GridPosition, equation?: string): EquationBlock => {
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
  };

  const createChartBlock = (position: GridPosition): ChartBlock => ({
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'chart',
    position,
    dimensions: getDefaultBlockDimensions('chart'),
    equations: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const createControlBlock = (position: GridPosition, layout: 'horizontal' | 'vertical' = 'vertical'): ControlBlock => ({
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'control',
    position,
    dimensions: getDefaultBlockDimensions('control'),
    layout,
    variables: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const createDescriptionBlock = (position: GridPosition, format: 'plain' | 'markdown' | 'latex' = 'plain'): DescriptionBlock => ({
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'description',
    position,
    dimensions: getDefaultBlockDimensions('description'),
    content: 'Add your text here...',
    format,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const addBlock = (type: Block['type'], data: Record<string, unknown>) => {
    const position: GridPosition = {
      x: Math.floor(viewportSize.width / GRID_UNIT / 2) - 4,
      y: Math.floor(viewportSize.height / GRID_UNIT / 2) - 2,
    };

    const newBlock: Block = (() => {
      switch (type) {
        case 'equation': {
          const equation = typeof data.equation === 'string' ? data.equation : undefined;
          return createEquationBlock(position, equation);
        }
        case 'chart':
          return createChartBlock(position);
        case 'control': {
          const layout = (data.layout === 'horizontal' || data.layout === 'vertical') ? data.layout : undefined;
          return createControlBlock(position, layout);
        }
        case 'description': {
          const format = (data.format === 'plain' || data.format === 'markdown' || data.format === 'latex') ? data.format : undefined;
          return createDescriptionBlock(position, format);
        }
      }
    })();

    const validPosition = findNearestValidPosition(position, newBlock.dimensions, blocks);
    const blockWithPosition = { ...newBlock, position: validPosition };

    const newBlocks = [...blocks, blockWithPosition];
    setBlocks(newBlocks);
    onBlocksChange?.(newBlocks);
    setSelectedBlockId(blockWithPosition.id);

    // Record block placed event if recording
    recordBlockPlaced(blockWithPosition.id, type, validPosition, (data.equation as string) || undefined);
  };

  const renderBlock = (block: Block) => {
    const isSelected = block.id === selectedBlockId;
    const isDragging = dragState?.blockId === block.id;
    const pos = gridToPixels(block.position);

    const commonProps = {
      key: block.id,
      isSelected,
      onClick: () => handleBlockClick(block.id),
      onMouseDown: (e: React.MouseEvent) => handleDragStart(e, block),
      className: cn('transition-shadow', isDragging ? 'z-50 cursor-grabbing shadow-2xl' : 'z-10'),
      style: { left: pos.x, top: pos.y },
    };

    switch (block.type) {
      case 'equation':
        return <EquationBlockComponent block={block} {...commonProps} />;
      case 'chart':
        return <ChartBlockComponent block={block} {...commonProps} />;
      case 'control':
        return <ControlBlockComponent block={block} {...commonProps} />;
      case 'description':
        return <DescriptionBlockComponent block={block} {...commonProps} />;
    }
  };

  return (
    <div className={cn('relative flex h-full w-full flex-col', className)}>
      {/* Top Toolbar */}
      <div className="z-20 flex items-center justify-between border-b border-border bg-card p-2 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => addBlock('equation', { equation: 'y = mx + c' })}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Equation
          </button>
          <button
            onClick={() => addBlock('control', { layout: 'vertical' })}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
          >
            + Controls
          </button>
          <button
            onClick={() => addBlock('chart', {})}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
          >
            + Chart
          </button>
          <button
            onClick={() => addBlock('description', {})}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
          >
            + Description
          </button>
        </div>
        <div className="flex items-center gap-4">
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
            isRecording={recordingState.status === 'recording' || recordingState.status === 'paused'}
            isPaused={recordingState.status === 'paused'}
            currentTime={recordingState.currentTime}
            onStart={startRecording}
            onStop={stopRecording}
            onPause={pauseRecording}
            onResume={resumeRecording}
            onCreateBookmark={createBookmark}
          />
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative flex-1 overflow-auto bg-background"
        onClick={() => setSelectedBlockId(undefined)}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {gridVisible && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
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
        {dragState && (
          <div
            className="pointer-events-none fixed z-50 opacity-50"
            style={{ left: gridToPixels(dragState.currentPosition).x, top: gridToPixels(dragState.currentPosition).y }}
          >
            <div className="h-8 w-8 rounded border-2 border-primary bg-primary/20" />
          </div>
        )}
      </div>

      {/* Recording Status Bar */}
      {(recordingState.status === 'recording' || recordingState.status === 'paused' || recordingState.audioSegments.length > 0) && (
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
