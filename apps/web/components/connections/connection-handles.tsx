'use client';

import React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import type { ConnectionHandleType } from '@/lib/block-system/types';

interface ConnectionHandleProps {
  id: string;
  type: ConnectionHandleType;
  label?: string;
  onConnectionStart?: (handleId: string, handleType: ConnectionHandleType) => void;
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void;
  isConnecting?: boolean;
  isValidTarget?: boolean;
  isConnected?: boolean;
  sideIndex?: number;
  sideCount?: number;
}

export function ConnectionHandle({
  id,
  type,
  label,
  onConnectionStart,
  onConnectionEnd,
  isConnecting = false,
  isValidTarget = false,
  isConnected = false,
  sideIndex = 0,
  sideCount = 1,
}: ConnectionHandleProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'output') {
      onConnectionStart?.(id, type);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'input' && isConnecting) {
      onConnectionEnd?.(id, type);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Could be used to disconnect all connections from this handle
  };

  return (
    <div
      className={cn(
        'absolute flex items-center justify-center',
        type === 'input' ? '-left-3' : '-right-3',
        '-translate-y-1/2'
      )}
      style={{
        top: `calc(50% + ${(sideIndex - (sideCount - 1) / 2) * 24}px)`,
      }}
    >
      <div
        data-connection-handle
        onMouseDown={type === 'output' ? handleMouseDown : undefined}
        onMouseUp={type === 'input' ? handleMouseUp : undefined}
        onDoubleClick={handleDoubleClick}
        className={cn(
          'h-6 w-6 rounded-full border-2 transition-all duration-200',
          'flex items-center justify-center',
          type === 'output' && 'cursor-crosshair',
          type === 'input' && isConnecting && isValidTarget && 'cursor-copy',
          isConnected
            ? 'border-primary bg-primary/20'
            : isValidTarget
              ? 'border-green-500 bg-green-500/20 animate-pulse'
              : 'border-muted-foreground/50 bg-background hover:border-primary hover:bg-primary/10'
        )}
        title={label || (type === 'output' ? 'Drag to connect' : 'Drop connection here')}
      >
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            isConnected || isValidTarget ? 'bg-primary' : 'bg-muted-foreground/50'
          )}
        />
      </div>
      {label && (
        <span
          className={cn(
            'absolute top-full mt-1 whitespace-nowrap text-xs text-muted-foreground',
            type === 'input' ? 'left-full ml-2' : 'right-full mr-2'
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}

interface ConnectionHandlesProps {
  blockId: string;
  blockType: string;
  handles?: Array<{ id: string; type: ConnectionHandleType; label?: string }>;
  onConnectionStart?: (handleId: string, handleType: ConnectionHandleType) => void;
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void;
  isConnecting?: boolean;
  connectingFromType?: string;
  connectedHandles?: Set<string>;
}

export function ConnectionHandles({
  blockId,
  blockType,
  handles,
  onConnectionStart,
  onConnectionEnd,
  isConnecting = false,
  connectingFromType,
  connectedHandles = new Set(),
}: ConnectionHandlesProps) {
  // Default handles based on block type
  const defaultHandles: Array<{ id: string; type: ConnectionHandleType; label?: string }> = handles || (() => {
    const result: Array<{ id: string; type: ConnectionHandleType; label?: string }> = [];

    // All blocks that can receive connections get input handles
    if (['chart', 'control', 'limit', 'variable', 'logic', 'comparator', 'constraint', 'shape', 'table'].includes(blockType)) {
      result.push({ id: `${blockId}-input`, type: 'input' });
    }

    // All blocks that can send connections get output handles
    if (['equation', 'limit', 'variable', 'logic', 'comparator', 'constraint', 'control'].includes(blockType)) {
      result.push({ id: `${blockId}-output`, type: 'output' });
    }

    return result;
  })();

  // Check if this block is a valid target for the current connection
  const isValidTarget = isConnecting && connectingFromType && (
    (connectingFromType === 'equation' && ['chart', 'control', 'equation', 'limit', 'variable', 'constraint', 'table'].includes(blockType)) ||
    (connectingFromType === 'variable' && ['chart'].includes(blockType)) ||
    (connectingFromType === 'limit' && ['chart', 'table'].includes(blockType)) ||
    (connectingFromType === 'logic' && ['logic', 'chart', 'shape', 'comparator', 'equation'].includes(blockType)) ||
    (connectingFromType === 'comparator' && ['logic', 'chart', 'shape', 'comparator', 'equation'].includes(blockType)) ||
    (connectingFromType === 'constraint' && ['equation', 'chart', 'logic', 'comparator', 'constraint', 'table'].includes(blockType)) ||
    (connectingFromType === 'control' && ['shape', 'limit', 'comparator'].includes(blockType))
  );

  return (
    <>
      {defaultHandles.map((handle) => {
        const sameSideHandles = defaultHandles.filter((h) => h.type === handle.type);
        const sideCount = sameSideHandles.length || 1;
        const sideIndex = sameSideHandles.findIndex((h) => h.id === handle.id);
        return (
        <ConnectionHandle
          key={handle.id}
          id={handle.id}
          type={handle.type}
          label={handle.label}
          onConnectionStart={onConnectionStart}
          onConnectionEnd={onConnectionEnd}
          isConnecting={!!isConnecting}
          isValidTarget={!!isValidTarget}
          isConnected={!!connectedHandles.has(handle.id)}
          sideIndex={sideIndex < 0 ? 0 : sideIndex}
          sideCount={sideCount}
        />
        );
      })}
    </>
  );
}
