/**
 * Block Item Component
 *
 * Individual block item in the library.
 */

'use client';

import React from 'react';

interface BlockItemProps {
  title: string;
  equation: string;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}

export function BlockItem({
  title,
  equation,
  onClick,
  onDragStart,
}: BlockItemProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      onDragStart={onDragStart}
      draggable
      data-block-library-item
      className="flex w-full flex-col gap-1 rounded-md border border-border p-2 text-left transition-colors hover:bg-accent hover:border-primary/50"
    >
      <span className="text-sm font-medium">{title}</span>
      <span className="truncate text-xs font-mono text-muted-foreground">
        {equation}
      </span>
    </button>
  );
}

export default BlockItem;
