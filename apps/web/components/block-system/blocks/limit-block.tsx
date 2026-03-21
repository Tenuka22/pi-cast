/**
 * Limit Block Component
 *
 * Renders a limit block for calculus operations.
 */

'use client';

import React from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  type LimitBlock,
  type ConnectionHandleType,
  type LimitApproach,
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
  onApproachChange?: (approach: LimitApproach) => void;
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
  onApproachChange,
  variableOptions = [],
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
}: LimitBlockComponentProps): React.ReactElement {
  const { variableName, limitValue, approach } = block;

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
          <span className="text-xs text-muted-foreground">Limit</span>
        </div>
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
        <div className="space-y-2">
          <Label className="text-xs">Direction</Label>
          <div className="flex gap-2">
            {(['left', 'right', 'both'] as const).map((dir) => (
              <Button
                key={dir}
                variant={approach === dir ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => onApproachChange?.(dir)}
              >
                {dir === 'left' ? '⁻' : dir === 'right' ? '⁺' : '↔'}
              </Button>
            ))}
          </div>
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
