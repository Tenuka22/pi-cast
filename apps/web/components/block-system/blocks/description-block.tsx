/**
 * Description Block Component
 *
 * Renders a description block with editable content.
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import katex from 'katex';
import { type DescriptionBlock } from '@/lib/block-system/types';
import { BlockWrapper } from './block-wrapper';
import 'katex/dist/katex.min.css';

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
  const latexRef = useRef<HTMLSpanElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Render LaTeX content using KaTeX
  useEffect(() => {
    if (latexRef.current && format === 'latex' && !isEditing) {
      try {
        katex.render(content, latexRef.current, {
          displayMode: true,
          throwOnError: false,
          output: 'html',
          macros: {
            '\\RR': '\\mathbb{R}',
            '\\NN': '\\mathbb{N}',
            '\\ZZ': '\\mathbb{Z}',
            '\\QQ': '\\mathbb{Q}',
            '\\CC': '\\mathbb{C}',
          },
        });
      } catch (error) {
        console.error('KaTeX rendering error:', error);
      }
    }
  }, [content, format, isEditing]);

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
        <div className="mx-4 mb-4 flex items-center gap-3 border-b border-border pb-3">
          <span className="font-mono text-lg font-semibold">📝</span>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
      )}
      <div className="flex-1 overflow-auto px-4 py-3">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-full w-full resize-none rounded border border-primary bg-card p-3 text-base leading-relaxed focus:outline-none"
          />
        ) : format === 'latex' ? (
          <div
            onDoubleClick={handleDoubleClick}
            className="cursor-text rounded py-3 text-card-foreground hover:bg-muted/30"
          >
            <span ref={latexRef} className="text-2xl" />
          </div>
        ) : format === 'markdown' ? (
          <p
            onDoubleClick={handleDoubleClick}
            className="cursor-text rounded py-3 text-base leading-relaxed whitespace-pre-wrap text-card-foreground hover:bg-muted/30"
          >
            {content}
          </p>
        ) : (
          <p
            onDoubleClick={handleDoubleClick}
            className="cursor-text rounded py-3 text-base leading-relaxed whitespace-pre-wrap text-card-foreground hover:bg-muted/30"
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
