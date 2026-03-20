/**
 * Chart Block Component
 *
 * Renders a chart block for visualizing equations.
 */

'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import {
  type ChartBlock,
  type EquationBlock,
  type ConnectionHandleType,
} from '@/lib/block-system/types';
import { BlockWrapper } from './block-wrapper';
import { ConnectionHandles } from '@/components/connections/connection-handles';
import {
  GraphConfig,
  renderGraph,
  DEFAULT_GRAPH_CONFIG,
} from '@/lib/visualization/graph-renderer';

interface ChartBlockComponentProps {
  block: ChartBlock;
  isSelected?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void;
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void;
  isConnecting?: boolean;
  connectingFromType?: string;
  connectedEquations?: EquationBlock[];
}

const PLOT_COLORS = [
  '#c084fc',
  '#ec4899',
  '#22d3ee',
  '#facc15',
  '#4ade80',
  '#f87171',
  '#60a5fa',
  '#a78bfa',
];

export function ChartBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
  connectedEquations = [],
}: ChartBlockComponentProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = block.dimensions.width * 32;
  const height = block.dimensions.height * 32;

  const config = useMemo<GraphConfig>(() => {
    const base = block.chartConfig;
    return {
      width,
      height,
      xAxis: {
        ...DEFAULT_GRAPH_CONFIG.xAxis,
        ...(base?.xAxis ?? {}),
      },
      yAxis: {
        ...DEFAULT_GRAPH_CONFIG.yAxis,
        ...(base?.yAxis ?? {}),
      },
      zoom: base?.zoom ?? DEFAULT_GRAPH_CONFIG.zoom,
      pan: {
        ...DEFAULT_GRAPH_CONFIG.pan,
        ...(base?.pan ?? {}),
      },
      showAxes: base?.showAxes ?? DEFAULT_GRAPH_CONFIG.showAxes,
      showGrid: base?.showGrid ?? DEFAULT_GRAPH_CONFIG.showGrid,
      backgroundColor: 'transparent',
    };
  }, [block.chartConfig, height, width]);

  const plots = useMemo(
    () =>
      connectedEquations.map((equationBlock, index) => {
        const variables: Record<string, number> = {};
        (equationBlock.variables ?? []).forEach((variable) => {
          variables[variable.name] = variable.value;
        });
        if (variables.x === undefined) variables.x = 0;
        if (variables.y === undefined) variables.y = 0;

        return {
          equation: equationBlock.equation,
          variables,
          options: {
            color: PLOT_COLORS[index % PLOT_COLORS.length] || '#c084fc',
            lineWidth: 2,
            label: equationBlock.equation,
          },
        };
      }),
    [connectedEquations]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderGraph(ctx, plots, config);
  }, [config, plots, width, height]);

  const hasEquations = connectedEquations.length > 0;
  const connectedHandleIds = new Set(
    (block.sourceEquationIds || []).map(
      (id) => `${block.id}-input-equation-${id}`
    )
  );

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">📈</span>
          <span className="text-xs text-muted-foreground">
            {connectedEquations.length || 0} equation
            {connectedEquations.length !== 1 ? 's' : ''} connected
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            Drop equation connections here
          </span>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden rounded-lg border border-border bg-muted/50">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden={!hasEquations}
        />
        {!hasEquations && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Connected equations will render here
          </div>
        )}
      </div>
      <ConnectionHandles
        blockId={block.id}
        blockType={block.type}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        isConnecting={isConnecting}
        connectingFromType={connectingFromType}
        connectedHandles={connectedHandleIds}
      />
    </BlockWrapper>
  );
}

export default ChartBlockComponent;
