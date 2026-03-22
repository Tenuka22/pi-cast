/**
 * Equation Block Component
 *
 * Renders an equation block with editable equation and variable controls.
 */

'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import {
  type EquationBlock,
  type ConnectionHandleType,
  getTokenClassName,
  parseEquation,
} from '@/lib/block-system/types';
import { BlockWrapper } from './block-wrapper';
import { ConnectionHandles } from '@/components/connections/connection-handles';
import { Input } from '@workspace/ui/components/input';

interface EquationBlockComponentProps {
  block: EquationBlock;
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
  onVariableChange?: (variableName: string, value: number) => void;
  onEquationChange?: (newEquation: string) => void;
  isConnecting?: boolean;
  connectingFromType?: string;
}

export function EquationBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onDimensionsChange,
  onConnectionStart,
  onConnectionEnd,
  onVariableChange,
  onEquationChange,
  isConnecting,
  connectingFromType,
}: EquationBlockComponentProps): React.ReactElement {
  const { equation, tokens, variables } = block;
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(equation);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Parse equation on-the-fly if variables/tokens aren't available
  const parsedTokens = tokens || (editValue ? parseEquation(editValue).tokens : []);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(equation);
    },
    [equation]
  );

  const handleBlur = React.useCallback(() => {
    setIsEditing(false);
    // Save the equation if it changed
    if (editValue !== equation && editValue.trim()) {
      onEquationChange?.(editValue);
    }
  }, [editValue, equation, onEquationChange]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Save on Enter
        if (editValue !== equation && editValue.trim()) {
          onEquationChange?.(editValue);
        }
        setIsEditing(false);
      } else if (e.key === 'Escape') {
        setEditValue(equation);
        setIsEditing(false);
      }
    },
    [editValue, equation, onEquationChange]
  );

  const connectedHandleIds = new Set([
    ...(block.connectedChartIds || []).map(
      (id) => `${block.id}-output-chart-${id}`
    ),
    ...(block.connectedControlIds || []).map(
      (id) => `${block.id}-output-control-${id}`
    ),
    ...(block.connectedEquationIds || []).map(
      (id) => `${block.id}-output-equation-${id}`
    ),
    ...(block.connectedLimitIds || []).map(
      (id) => `${block.id}-output-limit-${id}`
    ),
    ...(block.connectedVariableIds || []).map(
      (id) => `${block.id}-output-variable-${id}`
    ),
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
      <div
        className="absolute -top-3 left-3 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs shadow-sm"
        style={{ zIndex: 60 }}
      >
        <span className="font-mono text-sm">ƒ</span>
        <span className="text-xs text-muted-foreground">Equation</span>
      </div>

      <div
        className="px-2 py-4"
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full font-mono text-lg"
            placeholder="Enter equation (e.g., y = mx + c)"
          />
        ) : (
          <div className="font-mono text-lg">
            {parsedTokens && parsedTokens.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1">
                {parsedTokens.map((token, index) => (
                  <span
                    key={`${token.startIndex}-${index}`}
                    className={cn(
                      getTokenClassName(token.type),
                      'whitespace-pre-wrap break-all'
                    )}
                  >
                    {token.value}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">
                Double-click to edit
              </span>
            )}
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

export default EquationBlockComponent;
