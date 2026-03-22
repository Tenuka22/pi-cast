/**
 * Block Item Component
 *
 * Individual block item in the library.
 */

'use client';

import * as React from 'react';

import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';

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
    <Button
      variant="ghost"
      className="flex w-full flex-col items-start gap-1 p-2 text-left hover:border-primary/50"
      onClick={onClick}
      onDragStart={onDragStart}
      draggable
      data-block-library-item
    >
      <span className="text-sm font-medium">{title}</span>
      <Badge variant="outline" className="truncate text-xs font-mono">
        {equation}
      </Badge>
    </Button>
  );
}

export default BlockItem;
