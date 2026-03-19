/**
 * Enhanced Chart Block Component
 * 
 * Renders interactive graphs from equation blocks with real-time updates.
 */

'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import {
  GRID_UNIT,
  type ChartBlock,
  type EquationBlock,
  type ChartConfig,
} from '@/lib/block-system/types';
import {
  renderGraph,
  type GraphConfig,
  type PlotOptions,
  getDefaultConfigForEquation,
} from '@/lib/visualization/graph-renderer';
import { VariableSlider } from '@/components/visualization/variable-slider';

interface EnhancedChartBlockProps {
  block: ChartBlock;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  equations?: EquationBlock[];
  variables?: Record<string, number>;
  onVariableChange?: (name: string, value: number) => void;
  className?: string;
}

const DEFAULT_PLOT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export function EnhancedChartBlock({
  block,
  isSelected,
  onClick,
  onMouseDown,
  equations = [],
  variables = {},
  onVariableChange,
  className,
}: EnhancedChartBlockProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [config, setConfig] = useState<GraphConfig>({
    width: block.dimensions.width * GRID_UNIT,
    height: block.dimensions.height * GRID_UNIT,
    xAxis: { min: -10, max: 10, label: 'x', showLabels: true, showGrid: true },
    yAxis: { min: -10, max: 10, label: 'y', showLabels: true, showGrid: true },
    zoom: 1,
    pan: { x: 0, y: 0 },
    showAxes: true,
    showGrid: true,
  });

  const [showControls, setShowControls] = useState(false);
  const [showVariables, setShowVariables] = useState(false);

  // Extract variables from equations
  const equationVariables = useCallback(() => {
    const vars = new Set<string>();
    equations.forEach((eq) => {
      eq.variables?.forEach((v) => {
        if (v.name !== 'x' && v.name !== 'y') {
          vars.add(v.name);
        }
      });
    });
    return Array.from(vars);
  }, [equations]);

  // Render graph when equations or variables change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Prepare equations for rendering
    const plots = equations.map((eq, index) => ({
      equation: eq.equation,
      variables: { ...variables, x: 0 },
      options: {
        color: DEFAULT_PLOT_COLORS[index % DEFAULT_PLOT_COLORS.length],
        lineWidth: 2,
        label: eq.equation,
      } as PlotOptions,
    }));

    // Apply equation-specific config
    const firstEq = equations[0];
    if (firstEq?.equationType) {
      const eqConfig = getDefaultConfigForEquation(firstEq.equationType);
      setConfig((prev) => ({ ...prev, ...eqConfig }));
    }

    renderGraph(ctx, plots, config);
  }, [equations, variables, config]);

  const handleZoomIn = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      xAxis: { ...prev.xAxis, min: prev.xAxis.min * 0.8, max: prev.xAxis.max * 0.8 },
      yAxis: { ...prev.yAxis, min: prev.yAxis.min * 0.8, max: prev.yAxis.max * 0.8 },
      zoom: prev.zoom * 1.25,
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      xAxis: { ...prev.xAxis, min: prev.xAxis.min * 1.25, max: prev.xAxis.max * 1.25 },
      yAxis: { ...prev.yAxis, min: prev.yAxis.min * 1.25, max: prev.yAxis.max * 1.25 },
      zoom: prev.zoom / 1.25,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setConfig({
      width: block.dimensions.width * GRID_UNIT,
      height: block.dimensions.height * GRID_UNIT,
      xAxis: { min: -10, max: 10, label: 'x', showLabels: true, showGrid: true },
      yAxis: { min: -10, max: 10, label: 'y', showLabels: true, showGrid: true },
      zoom: 1,
      pan: { x: 0, y: 0 },
      showAxes: true,
      showGrid: true,
    });
  }, [block.dimensions]);

  const vars = equationVariables();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onMouseDown={onMouseDown}
      className={cn(
        'group relative flex flex-col rounded-lg border-2 transition-all duration-200',
        'bg-card hover:border-primary/50 hover:shadow-md',
        isSelected
          ? 'border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-background'
          : 'border-border',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">📈 Chart</span>
          <span className="text-xs text-muted-foreground">
            {equations.length} equation{equations.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="rounded px-2 py-1 text-xs hover:bg-accent"
            title="Zoom out"
          >
            −
          </button>
          <button
            onClick={handleReset}
            className="rounded px-2 py-1 text-xs hover:bg-accent"
            title="Reset view"
          >
            Reset
          </button>
          <button
            onClick={handleZoomIn}
            className="rounded px-2 py-1 text-xs hover:bg-accent"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => setShowControls(!showControls)}
            className="rounded px-2 py-1 text-xs hover:bg-accent"
          >
            {showControls ? 'Hide' : 'Show'} Controls
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={config.width}
          height={config.height}
          className="h-full w-full"
        />
      </div>

      {/* Variable Controls */}
      {showControls && vars.length > 0 && (
        <div className="border-t border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Variables</span>
            <button
              onClick={() => setShowVariables(!showVariables)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showVariables ? 'Hide' : 'Show'} Sliders
            </button>
          </div>
          {showVariables && (
            <div className="flex flex-col gap-3">
              {vars.map((varName, index) => (
                <VariableSlider
                  key={varName}
                  name={varName}
                  value={variables[varName] ?? 1}
                  onChange={onVariableChange}
                  className="border-b border-border pb-2 last:border-0"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Equation Legend */}
      {equations.length > 0 && (
        <div className="border-t border-border bg-muted/30 px-3 py-2">
          <div className="flex flex-wrap gap-3">
            {equations.map((eq, index) => (
              <div key={eq.id} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: DEFAULT_PLOT_COLORS[index % DEFAULT_PLOT_COLORS.length] }}
                />
                <span className="font-mono text-xs">{eq.equation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="pointer-events-none absolute -inset-0.5 rounded-lg border-2 border-primary" />
      )}
    </div>
  );
}

export default EnhancedChartBlock;
