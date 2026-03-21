/**
 * Shape Block Component
 *
 * Renders a shape block for visualizing fractions and percentages.
 */

'use client';

import React from 'react';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { cn } from '@workspace/ui/lib/utils';
import {
  type ShapeBlock,
  type ShapeType,
  type ShapeFillMode,
  type ConnectionHandleType,
} from '@/lib/block-system/types';
import { BlockWrapper } from './block-wrapper';
import { ConnectionHandles } from '@/components/connections/connection-handles';

interface ShapeBlockComponentProps {
  block: ShapeBlock;
  isSelected?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void;
  onFillValueChange?: (value: number) => void;
  onFillColorChange?: (color: string) => void;
  onFillModeChange?: (mode: ShapeFillMode) => void;
  onShapeTypeChange?: (shapeType: ShapeType) => void;
  onGridToggle?: () => void;
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void;
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void;
  isConnecting?: boolean;
  connectingFromType?: string;
}

export function ShapeBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onDimensionsChange,
  onFillValueChange,
  onFillColorChange,
  onFillModeChange,
  onShapeTypeChange,
  onGridToggle,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
}: ShapeBlockComponentProps): React.ReactElement {
  const { shapeType, fillColor, fillValue, fillMode, showGrid } = block;

  const renderShape = () => {
    // Use block dimensions to calculate SVG size (accounting for padding and header)
    const svgSize = Math.min(
      block.dimensions.width * 32 - 48, // Account for padding
      block.dimensions.height * 32 - 120 // Account for header and controls
    );
    const center = svgSize / 2;

    switch (shapeType) {
      case 'circle':
        return (
          <svg width={svgSize} height={svgSize} className="mx-auto">
            <circle
              cx={center}
              cy={center}
              r={center - 10}
              fill="none"
              stroke={fillColor}
              strokeWidth="2"
            />
            <circle
              cx={center}
              cy={center}
              r={(center - 10) * (fillValue / 100)}
              fill={fillColor}
              opacity="0.5"
            />
          </svg>
        );
      case 'rectangle':
        return (
          <svg width={svgSize} height={svgSize} className="mx-auto">
            <rect
              x="20"
              y="40"
              width={svgSize - 40}
              height={svgSize - 80}
              fill="none"
              stroke={fillColor}
              strokeWidth="2"
            />
            <rect
              x="20"
              y="40"
              width={svgSize - 40}
              height={(svgSize - 80) * (fillValue / 100)}
              fill={fillColor}
              opacity="0.5"
            />
          </svg>
        );
      case 'square':
      default:
        return (
          <svg width={svgSize} height={svgSize} className="mx-auto">
            <rect
              x="10"
              y="10"
              width={svgSize - 20}
              height={svgSize - 20}
              fill="none"
              stroke={fillColor}
              strokeWidth="2"
            />
            <rect
              x="10"
              y="10"
              width={(svgSize - 20) * (fillValue / 100)}
              height={svgSize - 20}
              fill={fillColor}
              opacity="0.5"
            />
          </svg>
        );
    }
  };

  const connectedHandleIds = new Set([
    ...(block.sourceValueId
      ? [`${block.id}-input-value-${block.sourceValueId}`]
      : []),
    ...(block.sourceControlId
      ? [`${block.id}-input-control-${block.sourceControlId}`]
      : []),
  ]);

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onDimensionsChange={onDimensionsChange}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">◻️</span>
          <span className="text-xs text-muted-foreground capitalize">
            {shapeType}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-4">
        <div className="flex justify-center">{renderShape()}</div>

        <div className="space-y-2">
          <Label className="text-xs">Fill Value ({fillMode})</Label>
          <input
            type="range"
            value={fillValue}
            min={0}
            max={
              fillMode === 'percentage' ? 100 : fillMode === 'decimal' ? 1 : 1
            }
            step={fillMode === 'percentage' ? 1 : 0.01}
            onChange={(e) => onFillValueChange?.(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span className="font-mono">{fillValue}</span>
            <span>
              {fillMode === 'percentage'
                ? 100
                : fillMode === 'decimal'
                  ? 1
                  : '1/1'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Color</Label>
          <div className="flex gap-2">
            {[
              '#7c3aed',
              '#ec4899',
              '#22d3ee',
              '#4ade80',
              '#facc15',
              '#f87171',
            ].map((color) => (
              <button
                key={color}
                className={cn(
                  'h-6 w-6 rounded border-2',
                  fillColor === color ? 'border-primary' : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
                onClick={() => onFillColorChange?.(color)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Grid</Label>
          <Button variant="outline" size="sm" onClick={onGridToggle}>
            {showGrid ? 'On' : 'Off'}
          </Button>
        </div>
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

export default ShapeBlockComponent;
