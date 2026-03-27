/**
 * Constraint Block Component
 *
 * Renders a constraint block for setting variable limits (e.g., x ≥ 2).
 */

'use client';

import React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import {
  type ConstraintBlock,
  type ConstraintType,
  type ConnectionHandleType,
} from '@/lib/block-system/types';
import { BlockWrapper } from './block-wrapper';
import { ConnectionHandles } from '@/components/connections/connection-handles';

interface ConstraintBlockComponentProps {
  block: ConstraintBlock;
  isSelected?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void;
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void;
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void;
  onVariableChange?: (variableName: string, value: string | number) => void;
  onConstraintChange?: (constraint: ConstraintType, value: number | number[]) => void;
  isConnecting?: boolean;
  connectingFromType?: string;
}

const CONSTRAINT_SYMBOLS: Record<ConstraintType, string> = {
  gte: '≥',
  gt: '>',
  lte: '≤',
  lt: '<',
  range: '≤ x ≤',
};

const CONSTRAINT_LABELS: Record<ConstraintType, string> = {
  gte: 'Greater or Equal',
  gt: 'Greater Than',
  lte: 'Less or Equal',
  lt: 'Less Than',
  range: 'Range',
};

export function ConstraintBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onDimensionsChange,
  onConnectionStart,
  onConnectionEnd,
  onVariableChange,
  onConstraintChange,
  isConnecting,
  connectingFromType,
}: ConstraintBlockComponentProps): React.ReactElement {
  const { variableName, constraint, result, targetEquationId } = block;

  const connectedHandleIds = new Set([
    ...(targetEquationId ? [`${block.id}-output-equation`] : []),
  ]);

  const handleConstraintTypeChange = (newType: ConstraintType) => {
    onConstraintChange?.(newType, constraint.min ?? 0);
  };

  const handleValueChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    if (constraint.type === 'range') {
      onConstraintChange?.(constraint.type, [numValue, constraint.max ?? 100]);
    } else {
      onConstraintChange?.(constraint.type, numValue);
    }
  };

  const handleMaxValueChange = (value: string) => {
    const numValue = parseFloat(value) || 100;
    if (constraint.type === 'range') {
      onConstraintChange?.(constraint.type, [constraint.min ?? 0, numValue]);
    }
  };

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onDimensionsChange={onDimensionsChange}
    >
      <div className="absolute -top-3 left-3 flex items-center gap-1 rounded bg-card px-2 text-xs text-muted-foreground">
        <span className="font-mono">🔒</span>
      </div>
      <div className="flex-1 space-y-3 p-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Variable
          </label>
          <input
            type="text"
            value={variableName}
            onChange={(e) => onVariableChange?.('variableName', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm font-mono"
            placeholder="x"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Constraint
          </label>
          <select
            value={constraint.type}
            onChange={(e) => handleConstraintTypeChange(e.target.value as ConstraintType)}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            {Object.entries(CONSTRAINT_LABELS).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{variableName}</span>
          <span className="font-mono text-sm font-bold text-primary">
            {CONSTRAINT_SYMBOLS[constraint.type]}
          </span>
          {constraint.type !== 'range' ? (
            <input
              type="number"
              value={constraint.min ?? 0}
              onChange={(e) => handleValueChange(e.target.value)}
              className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
              step="any"
            />
          ) : (
            <>
              <input
                type="number"
                value={constraint.min ?? 0}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
                step="any"
                placeholder="min"
              />
              <span className="font-mono text-sm">and</span>
              <input
                type="number"
                value={constraint.max ?? 100}
                onChange={(e) => handleMaxValueChange(e.target.value)}
                className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
                step="any"
                placeholder="max"
              />
            </>
          )}
        </div>

        {result !== undefined && (
          <div
            className={cn(
              'rounded px-3 py-1 text-sm font-medium',
              result
                ? 'bg-green-500/20 text-green-600'
                : 'bg-red-500/20 text-red-600'
            )}
          >
            {result ? '✓ Satisfied' : '✗ Not satisfied'}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Connect to equation to apply constraint
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

export default ConstraintBlockComponent;
