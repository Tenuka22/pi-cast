/**
 * Limit Block Component
 *
 * Renders a limit block for calculus operations.
 * Three distinct types: left limit (⁻), right limit (⁺), and both limits (↔)
 * The limit type is fixed at creation and cannot be changed.
 */

'use client';

import React from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  type LimitBlock,
  type ConnectionHandleType,
} from '@/lib/block-system/types';
import { BlockWrapper } from './block-wrapper';
import { ConnectionHandles } from '@/components/connections/connection-handles';

interface LimitBlockComponentProps {
  block: LimitBlock;
  isSelected?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void;
  onVariableChange?: (variableName: string, value: number | string) => void;
  variableOptions?: string[];
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void;
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void;
  isConnecting?: boolean;
  connectingFromType?: string;
}

export function LimitBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onDimensionsChange,
  onVariableChange,
  variableOptions = [],
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
}: LimitBlockComponentProps): React.ReactElement {
  const { variableName, limitValue, limitType, isInfinite, infiniteDirection } = block;

  // Display symbol based on limit type
  const limitSymbol = limitType === 'left' ? '⁻' : limitType === 'right' ? '⁺' : '↔';
  const limitLabel = limitType === 'left' ? 'Left Limit' : limitType === 'right' ? 'Right Limit' : 'Two-Sided Limit';
  
  // Get the display value (infinity or finite number)
  const displayValue = isInfinite 
    ? (infiniteDirection === 'positive' ? '∞' : '-∞')
    : limitValue.toString();

  const connectedHandleIds = new Set([
    ...(block.targetEquationId
      ? [`${block.id}-input-equation-${block.targetEquationId}`]
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
          <span className="font-mono text-sm font-semibold">lim</span>
          <span className="text-xs text-muted-foreground">{limitLabel}</span>
        </div>
        <span className="text-lg font-bold text-primary">{limitSymbol}</span>
      </div>
      <div className="flex-1 space-y-4 p-4">
        <div className="space-y-2">
          <Label className="text-xs">Variable</Label>
          <select
            value={variableName}
            onChange={(e) =>
              onVariableChange?.('variableName', e.target.value)
            }
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            {variableOptions.length > 0 ? (
              variableOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))
            ) : (
              <option value={variableName}>{variableName}</option>
            )}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Approaches</Label>
          <div className="flex gap-2">
            <Button
              variant={!isInfinite ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => onVariableChange?.('isInfinite', isInfinite ? 0 : 1)}
            >
              Finite
            </Button>
            <Button
              variant={isInfinite ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => onVariableChange?.('isInfinite', isInfinite ? 0 : 1)}
            >
              Infinite
            </Button>
          </div>
        </div>
        {isInfinite ? (
          <div className="space-y-2">
            <Label className="text-xs">Direction</Label>
            <div className="flex gap-2">
              <Button
                variant={infiniteDirection === 'positive' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => onVariableChange?.('infiniteDirection', 'positive')}
              >
                +∞
              </Button>
              <Button
                variant={infiniteDirection === 'negative' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => onVariableChange?.('infiniteDirection', 'negative')}
              >
                -∞
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-xs">Value</Label>
            <Input
              type="number"
              value={limitValue}
              onChange={(e) =>
                onVariableChange?.('limitValue', parseFloat(e.target.value) || 0)
              }
              className="h-8"
              step="any"
            />
          </div>
        )}
        <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
          <span className="font-mono">
            {variableName} → {displayValue}{limitSymbol}
          </span>
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

export default LimitBlockComponent;
