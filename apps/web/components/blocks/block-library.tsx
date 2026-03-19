'use client';

import React, { useState } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  LibraryIcon,
  Flag01Icon,
  SlideIcon,
  ChartIcon,
  FileCheck,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@hugeicons/core-free-icons';
import type { EquationBlock, ChartBlock, ControlBlock, DescriptionBlock } from '@/lib/block-system/types';

export type BlockPreset = 
  | { type: 'equation'; data: Partial<EquationBlock> }
  | { type: 'chart'; data: Partial<ChartBlock> }
  | { type: 'control'; data: Partial<ControlBlock> }
  | { type: 'description'; data: Partial<DescriptionBlock> };

interface BlockLibraryProps {
  onBlockSelect?: (preset: BlockPreset) => void;
  className?: string;
}

export function BlockLibrary({ onBlockSelect, className }: BlockLibraryProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('equations');

  const handleBlockClick = (preset: BlockPreset) => onBlockSelect?.(preset);

  return (
    <div className={cn('flex h-full w-64 flex-col border-r border-border bg-card', className)}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-sm font-semibold">Block Library</h2>
        <HugeiconsIcon icon={LibraryIcon} className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 overflow-auto p-2">
        <CategorySection
          title="Equations"
          icon={Flag01Icon}
          isExpanded={expandedCategory === 'equations'}
          onToggle={() => setExpandedCategory(expandedCategory === 'equations' ? null : 'equations')}
        >
          <BlockItem title="Linear" equation="y = mx + c" onClick={() => handleBlockClick({ type: 'equation', data: { equation: 'y = mx + c' } })} />
          <BlockItem title="Quadratic" equation="y = ax² + bx + c" onClick={() => handleBlockClick({ type: 'equation', data: { equation: 'y = ax^2 + bx + c' } })} />
          <BlockItem title="Cubic" equation="y = ax³ + bx² + cx + d" onClick={() => handleBlockClick({ type: 'equation', data: { equation: 'y = ax^3 + bx^2 + cx + d' } })} />
          <BlockItem title="Exponential" equation="y = a^x" onClick={() => handleBlockClick({ type: 'equation', data: { equation: 'y = a^x' } })} />
          <BlockItem title="Sine Wave" equation="y = A·sin(x)" onClick={() => handleBlockClick({ type: 'equation', data: { equation: 'y = A * sin(x)' } })} />
          <BlockItem title="Custom" equation="Add your own..." onClick={() => handleBlockClick({ type: 'equation', data: { equation: '' } })} />
        </CategorySection>

        <CategorySection
          title="Controls"
          icon={SlideIcon}
          isExpanded={expandedCategory === 'controls'}
          onToggle={() => setExpandedCategory(expandedCategory === 'controls' ? null : 'controls')}
        >
          <BlockItem title="Variable Slider" equation="Slider for m" onClick={() => handleBlockClick({ type: 'control', data: { layout: 'vertical' } })} />
          <BlockItem title="Number Input" equation="Input for c" onClick={() => handleBlockClick({ type: 'control', data: { layout: 'horizontal' } })} />
          <BlockItem title="Multi-Variable" equation="m, c, x" onClick={() => handleBlockClick({ type: 'control', data: { layout: 'vertical' } })} />
        </CategorySection>

        <CategorySection
          title="Charts"
          icon={ChartIcon}
          isExpanded={expandedCategory === 'charts'}
          onToggle={() => setExpandedCategory(expandedCategory === 'charts' ? null : 'charts')}
        >
          <BlockItem title="Single Graph" equation="1 equation" onClick={() => handleBlockClick({ type: 'chart', data: {} })} />
          <BlockItem title="Comparison" equation="Multiple equations" onClick={() => handleBlockClick({ type: 'chart', data: {} })} />
          <BlockItem title="Large Canvas" equation="512x384px" onClick={() => handleBlockClick({ type: 'chart', data: {} })} />
        </CategorySection>

        <CategorySection
          title="Descriptions"
          icon={FileCheck}
          isExpanded={expandedCategory === 'descriptions'}
          onToggle={() => setExpandedCategory(expandedCategory === 'descriptions' ? null : 'descriptions')}
        >
          <BlockItem title="Text Block" equation="Plain text" onClick={() => handleBlockClick({ type: 'description', data: { format: 'plain' } })} />
          <BlockItem title="Markdown" equation="Formatted text" onClick={() => handleBlockClick({ type: 'description', data: { format: 'markdown' } })} />
          <BlockItem title="LaTeX" equation="Math notation" onClick={() => handleBlockClick({ type: 'description', data: { format: 'latex' } })} />
          <BlockItem title="Title Block" equation="With header" onClick={() => handleBlockClick({ type: 'description', data: { format: 'plain', title: 'Title' } })} />
        </CategorySection>
      </div>
      <div className="border-t border-border p-3 text-xs text-muted-foreground">
        <p>Drag blocks to canvas or click to add</p>
      </div>
    </div>
  );
}

function CategorySection({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  icon: typeof LibraryIcon;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 rounded-lg border border-border">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={icon} className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <HugeiconsIcon
          icon={isExpanded ? ArrowUpIcon : ArrowDownIcon}
          className={cn('h-4 w-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')}
        />
      </button>
      {isExpanded && <div className="border-t border-border px-2 py-1">{children}</div>}
    </div>
  );
}

function BlockItem({
  title,
  equation,
  onClick,
}: {
  title: string;
  equation: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-1 rounded-md border border-border p-2 text-left transition-colors hover:bg-accent hover:border-primary/50"
    >
      <span className="text-sm font-medium">{title}</span>
      <span className="truncate text-xs font-mono text-muted-foreground">{equation}</span>
    </button>
  );
}

export default BlockLibrary;
