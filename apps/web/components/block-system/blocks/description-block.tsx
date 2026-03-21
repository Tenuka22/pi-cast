/**
 * Description Block Component
 *
 * Renders a description block with editable content.
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { type DescriptionBlock } from '@/lib/block-system/types';
import { BlockWrapper } from './block-wrapper';

interface DescriptionBlockComponentProps {
  block: DescriptionBlock;
  isSelected?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void;
}

export function DescriptionBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onDimensionsChange,
}: DescriptionBlockComponentProps): React.ReactElement {
  const { content, format, title } = block;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditContent(content);
    },
    [content]
  );

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditContent(content);
        setIsEditing(false);
      }
    },
    [content]
  );

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onDimensionsChange={onDimensionsChange}
      className="p-4"
    >
      {title && (
        <div className="mb-2 flex items-center gap-2 border-b border-border pb-2">
          <span className="font-mono text-sm font-semibold">📝</span>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-full w-full resize-none rounded border border-primary bg-card p-2 text-sm leading-relaxed focus:outline-none"
          />
        ) : format === 'latex' ? (
          <div
            onDoubleClick={handleDoubleClick}
            className="cursor-text rounded p-1 font-mono text-sm hover:bg-muted/50"
          >
            <code className="rounded bg-muted px-2 py-1">{content}</code>
          </div>
        ) : (
          <p
            onDoubleClick={handleDoubleClick}
            className="cursor-text rounded p-1 text-sm leading-relaxed whitespace-pre-wrap text-card-foreground hover:bg-muted/50"
          >
            {content}
          </p>
        )}
      </div>
      <div className="absolute top-2 right-2 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        {format}
      </div>
    </BlockWrapper>
  );
}

export default DescriptionBlockComponent;
