'use client';

import React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import {
  GRID_UNIT,
  type Block,
  type EquationBlock,
  type ChartBlock,
  type ChartConfig,
  type ControlBlock,
  type ControlVariable,
  type DescriptionBlock,
  getTokenClassName,
} from '@/lib/block-system/types';

// ============================================================================
// SHARED BLOCK WRAPPER
// ============================================================================

interface BlockWrapperProps {
  block: Block;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
}

function BlockWrapper({
  block,
  isSelected,
  onClick,
  onMouseDown,
  children,
  className,
}: BlockWrapperProps) {
  const pos = { x: block.position.x * GRID_UNIT, y: block.position.y * GRID_UNIT };
  const width = block.dimensions.width * GRID_UNIT;
  const height = block.dimensions.height * GRID_UNIT;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onMouseDown={onMouseDown}
      style={{ left: pos.x, top: pos.y, minWidth: width, minHeight: height }}
      className={cn(
        'group absolute flex cursor-grab flex-col rounded-lg border-2 transition-all duration-200 hover:border-primary/50 hover:shadow-md',
        'bg-card',
        isSelected
          ? 'border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-background'
          : 'border-border',
        className
      )}
    >
      {children}
      {/* Resize handle */}
      <div className="absolute bottom-1 right-1 hidden h-3 w-3 cursor-se-resize items-end justify-end group-hover:flex">
        <div className="h-1.5 w-1.5 border-b-2 border-r-2 border-muted-foreground/50" />
      </div>
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -inset-0.5 rounded-lg border-2 border-primary pointer-events-none" />
      )}
    </div>
  );
}

// ============================================================================
// EQUATION BLOCK
// ============================================================================

interface EquationBlockComponentProps {
  block: EquationBlock;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export function EquationBlockComponent({
  block,
  isSelected,
  onClick,
  onMouseDown,
}: EquationBlockComponentProps) {
  const { equation, tokens } = block;
  const gridWidth = Math.max(8, Math.ceil(equation.length * 0.5));

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      onClick={onClick}
      onMouseDown={onMouseDown}
      className="px-4"
    >
      <div className="absolute -top-3 left-3 flex items-center gap-1 rounded bg-card px-2 text-xs text-muted-foreground">
        <span className="font-mono">ƒ</span>
      </div>
      <div className="w-full overflow-x-auto py-2" style={{ minWidth: gridWidth * GRID_UNIT }}>
        <div className="flex items-center gap-1 font-mono text-lg">
          {tokens && tokens.length > 0 ? (
            tokens.map((token, index) => (
              <span key={`${token.startIndex}-${index}`} className={cn(getTokenClassName(token.type), 'whitespace-pre')}>
                {token.value}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground">{equation}</span>
          )}
        </div>
      </div>
    </BlockWrapper>
  );
}

// ============================================================================
// CHART BLOCK
// ============================================================================

interface ChartBlockComponentProps {
  block: ChartBlock;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

function getDefaultChartConfig(): ChartConfig {
  return {
    xAxis: { min: -10, max: 10, showLabels: true },
    yAxis: { min: -10, max: 10, showLabels: true },
    showGrid: true,
    showAxes: true,
    zoom: 1,
    pan: { x: 0, y: 0 },
  };
}

function generateGridLines(width: number, height: number): { x1: number; y1: number; x2: number; y2: number }[] {
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const gridSize = 32;
  for (let x = 0; x <= width; x += gridSize) lines.push({ x1: x, y1: 0, x2: x, y2: height });
  for (let y = 0; y <= height; y += gridSize) lines.push({ x1: 0, y1: y, x2: width, y2: y });
  return lines;
}

export function ChartBlockComponent({
  block,
  isSelected,
  onClick,
  onMouseDown,
}: ChartBlockComponentProps) {
  const config = block.chartConfig || getDefaultChartConfig();
  const width = block.dimensions.width * GRID_UNIT;
  const height = block.dimensions.height * GRID_UNIT;

  // Sample graph data (y = x)
  const points: { x: number; y: number }[] = [];
  for (let x = -10; x <= 10; x += 0.5) points.push({ x, y: x });

  const xScale = width / 20;
  const yScale = height / 20;
  const pathData = points.map((point, i) => {
    const svgX = width / 2 + point.x * xScale;
    const svgY = height / 2 - point.y * yScale;
    return `${i === 0 ? 'M' : 'L'} ${svgX} ${svgY}`;
  }).join(' ');

  return (
    <BlockWrapper block={block} isSelected={isSelected} onClick={onClick} onMouseDown={onMouseDown}>
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">📈</span>
          <span className="text-xs text-muted-foreground">{block.equations.length} equation{block.equations.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded p-1 text-muted-foreground hover:bg-accent"><span className="text-sm">+</span></button>
          <button className="rounded p-1 text-muted-foreground hover:bg-accent"><span className="text-sm">−</span></button>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="absolute inset-0">
          {config.showGrid && (
            <g className="text-muted-foreground/20">
              {generateGridLines(width, height).map((line, i) => (
                <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="currentColor" strokeWidth="1" />
              ))}
            </g>
          )}
          {config.showAxes && (
            <g className="text-muted-foreground">
              <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" strokeWidth="2" />
              <line x1={width / 2} y1={0} x2={width / 2} y2={height} stroke="currentColor" strokeWidth="2" />
            </g>
          )}
          <path d={pathData} fill="none" stroke="oklch(0.518 0.253 323.949)" strokeWidth="2" />
        </svg>
        {config.xAxis.showLabels && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">{config.xAxis.label || 'x'}</div>
        )}
        {config.yAxis.showLabels && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground">{config.yAxis.label || 'y'}</div>
        )}
      </div>
    </BlockWrapper>
  );
}

// ============================================================================
// CONTROL BLOCK
// ============================================================================

interface ControlBlockComponentProps {
  block: ControlBlock;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onVariableChange?: (variableName: string, value: number) => void;
}

function ControlVariableComponent({
  variable,
  onSliderChange,
  onInputChange,
}: {
  variable: ControlVariable;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { name, value, min, max, step, showSlider, showInput } = variable;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <label className="font-mono text-sm font-medium text-muted-foreground">{name}</label>
        {showInput && (
          <input
            type="number"
            value={value}
            onChange={onInputChange}
            step={step}
            min={min}
            max={max}
            className="h-7 w-20 rounded-md border border-input bg-background px-2 text-right text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        )}
      </div>
      {showSlider && (
        <input
          type="range"
          value={value}
          onChange={onSliderChange}
          min={min}
          max={max}
          step={step}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary hover:accent-primary/80"
          style={{
            background: `linear-gradient(to right, oklch(0.518 0.253 323.949) 0%, oklch(0.518 0.253 323.949) ${((value - min) / (max - min)) * 100}%, oklch(0.542 0.034 322.5) ${((value - min) / (max - min)) * 100}%, oklch(0.542 0.034 322.5) 100%)`,
          }}
        />
      )}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min === -1000 ? '-∞' : min}</span>
        <span>{max === 1000 ? '+∞' : max}</span>
      </div>
    </div>
  );
}

export function ControlBlockComponent({
  block,
  isSelected,
  onClick,
  onMouseDown,
  onVariableChange,
}: ControlBlockComponentProps) {
  const handleSliderChange = (variable: ControlVariable, e: React.ChangeEvent<HTMLInputElement>) => {
    onVariableChange?.(variable.name, parseFloat(e.target.value));
  };

  const handleInputChange = (variable: ControlVariable, e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) onVariableChange?.(variable.name, newValue);
  };

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      onClick={onClick}
      onMouseDown={onMouseDown}
      className="gap-3 p-4"
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold">🎛️</span>
        <span className="text-xs text-muted-foreground">Controls</span>
      </div>
      <div className={cn('flex gap-4', block.layout === 'vertical' ? 'flex-col' : 'flex-row flex-wrap')}>
        {block.variables.map((variable) => (
          <ControlVariableComponent
            key={variable.name}
            variable={variable}
            onSliderChange={(e) => handleSliderChange(variable, e)}
            onInputChange={(e) => handleInputChange(variable, e)}
          />
        ))}
      </div>
    </BlockWrapper>
  );
}

// ============================================================================
// DESCRIPTION BLOCK
// ============================================================================

interface DescriptionBlockComponentProps {
  block: DescriptionBlock;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export function DescriptionBlockComponent({
  block,
  isSelected,
  onClick,
  onMouseDown,
}: DescriptionBlockComponentProps) {
  const { content, format, title } = block;

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      onClick={onClick}
      onMouseDown={onMouseDown}
      className="p-4"
    >
      {title && (
        <div className="mb-2 flex items-center gap-2 border-b border-border pb-2">
          <span className="font-mono text-sm font-semibold">📝</span>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {format === 'latex' ? (
          <div className="font-mono text-sm"><code className="rounded bg-muted px-2 py-1">{content}</code></div>
        ) : (
          <p className="text-sm leading-relaxed text-card-foreground whitespace-pre-wrap">{content}</p>
        )}
      </div>
      <div className="absolute top-2 right-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        {format}
      </div>
    </BlockWrapper>
  );
}
