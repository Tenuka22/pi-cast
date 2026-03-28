'use client';

import React, { useState } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  LibraryIcon,
  Flag01Icon,
  ChartIcon,
  FileCheck,
  ArrowUpIcon,
  ArrowDownIcon,
  CalculatorIcon,
  SquareIcon,
  PuzzleIcon,
} from '@hugeicons/core-free-icons';
import type { EquationBlock, ChartBlock, DescriptionBlock, LimitBlock, ShapeBlock, VariableBlock, TableBlock, PiecewiseLimiterBlock, PiecewiseBuilderBlock } from '@/lib/block-system/types';

export type LogicType = 'and' | 'or' | 'xor' | 'eq' | 'le' | 'ge' | 'gt' | 'lt';

export type ConstraintPresetType = 'gte' | 'gt' | 'lte' | 'lt' | 'range';

export type BlockPreset =
  | { type: 'equation'; data: Partial<EquationBlock> }
  | { type: 'chart'; data: Partial<ChartBlock> }
  | { type: 'description'; data: Partial<DescriptionBlock> }
  | { type: 'limit'; data: Partial<LimitBlock> }
  | { type: 'shape'; data: Partial<ShapeBlock> }
  | { type: 'logic'; data: { logicType: LogicType } }
  | { type: 'comparator'; data: { operator: LogicType } }
  | { type: 'constraint'; data: { variableName: string; constraintType: ConstraintPresetType; constraintValue?: number } }
  | { type: 'variable'; data: Partial<VariableBlock> }
  | { type: 'table'; data: Partial<TableBlock> }
  | { type: 'piecewise-limiter'; data: Partial<PiecewiseLimiterBlock> }
  | { type: 'piecewise-builder'; data: Partial<PiecewiseBuilderBlock> };

interface BlockLibraryProps {
  onBlockSelect?: (preset: BlockPreset) => void;
  className?: string;
}

export function BlockLibrary({ onBlockSelect, className }: BlockLibraryProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('equations');

  const handleBlockClick = (preset: BlockPreset) => onBlockSelect?.(preset);

  const handleDragStart = (e: React.DragEvent, preset: BlockPreset) => {
    e.dataTransfer.setData('application/json', JSON.stringify(preset));
    e.dataTransfer.effectAllowed = 'copy';
  };

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
          <BlockItem title="Empty Equation" equation="Double-click to edit" onClick={() => handleBlockClick({ type: 'equation', data: { equation: '' } })} onDragStart={(e) => handleDragStart(e, { type: 'equation', data: { equation: '' } })} />
        </CategorySection>

        <CategorySection
          title="Variables"
          icon={CalculatorIcon}
          isExpanded={expandedCategory === 'variables'}
          onToggle={() => setExpandedCategory(expandedCategory === 'variables' ? null : 'variables')}
        >
          <BlockItem title="Variable Slider" equation="Connect to equation" onClick={() => handleBlockClick({ type: 'variable', data: {} })} onDragStart={(e) => handleDragStart(e, { type: 'variable', data: {} })} />
        </CategorySection>

        <CategorySection
          title="Logic Gates"
          icon={PuzzleIcon}
          isExpanded={expandedCategory === 'logic'}
          onToggle={() => setExpandedCategory(expandedCategory === 'logic' ? null : 'logic')}
        >
          <BlockItem title="AND Gate" equation="A ∧ B" onClick={() => handleBlockClick({ type: 'logic', data: { logicType: 'and' } })} onDragStart={(e) => handleDragStart(e, { type: 'logic', data: { logicType: 'and' } })} />
          <BlockItem title="OR Gate" equation="A ∨ B" onClick={() => handleBlockClick({ type: 'logic', data: { logicType: 'or' } })} onDragStart={(e) => handleDragStart(e, { type: 'logic', data: { logicType: 'or' } })} />
          <BlockItem title="XOR Gate" equation="A ⊕ B" onClick={() => handleBlockClick({ type: 'logic', data: { logicType: 'xor' } })} onDragStart={(e) => handleDragStart(e, { type: 'logic', data: { logicType: 'xor' } })} />
          <BlockItem title="Equality" equation="A = B" onClick={() => handleBlockClick({ type: 'logic', data: { logicType: 'eq' } })} onDragStart={(e) => handleDragStart(e, { type: 'logic', data: { logicType: 'eq' } })} />
        </CategorySection>

        <CategorySection
          title="Comparators"
          icon={CalculatorIcon}
          isExpanded={expandedCategory === 'comparators'}
          onToggle={() => setExpandedCategory(expandedCategory === 'comparators' ? null : 'comparators')}
        >
          <BlockItem title="Less Than" equation="A < B" onClick={() => handleBlockClick({ type: 'comparator', data: { operator: 'lt' } })} onDragStart={(e) => handleDragStart(e, { type: 'comparator', data: { operator: 'lt' } })} />
          <BlockItem title="Greater Than" equation="A > B" onClick={() => handleBlockClick({ type: 'comparator', data: { operator: 'gt' } })} onDragStart={(e) => handleDragStart(e, { type: 'comparator', data: { operator: 'gt' } })} />
          <BlockItem title="Less or Equal" equation="A ≤ B" onClick={() => handleBlockClick({ type: 'comparator', data: { operator: 'le' } })} onDragStart={(e) => handleDragStart(e, { type: 'comparator', data: { operator: 'le' } })} />
          <BlockItem title="Greater or Equal" equation="A ≥ B" onClick={() => handleBlockClick({ type: 'comparator', data: { operator: 'ge' } })} onDragStart={(e) => handleDragStart(e, { type: 'comparator', data: { operator: 'ge' } })} />
          <BlockItem title="Equals" equation="A = B" onClick={() => handleBlockClick({ type: 'comparator', data: { operator: 'eq' } })} onDragStart={(e) => handleDragStart(e, { type: 'comparator', data: { operator: 'eq' } })} />
        </CategorySection>

        <CategorySection
          title="Constraints"
          icon={CalculatorIcon}
          isExpanded={expandedCategory === 'constraints'}
          onToggle={() => setExpandedCategory(expandedCategory === 'constraints' ? null : 'constraints')}
        >
          <BlockItem title="X ≥ value" equation="x ≥ 0" onClick={() => handleBlockClick({ type: 'constraint', data: { variableName: 'x', constraintType: 'gte', constraintValue: 0 } })} onDragStart={(e) => handleDragStart(e, { type: 'constraint', data: { variableName: 'x', constraintType: 'gte', constraintValue: 0 } })} />
          <BlockItem title="X ≤ value" equation="x ≤ 100" onClick={() => handleBlockClick({ type: 'constraint', data: { variableName: 'x', constraintType: 'lte', constraintValue: 100 } })} onDragStart={(e) => handleDragStart(e, { type: 'constraint', data: { variableName: 'x', constraintType: 'lte', constraintValue: 100 } })} />
          <BlockItem title="X > value" equation="x > 0" onClick={() => handleBlockClick({ type: 'constraint', data: { variableName: 'x', constraintType: 'gt', constraintValue: 0 } })} onDragStart={(e) => handleDragStart(e, { type: 'constraint', data: { variableName: 'x', constraintType: 'gt', constraintValue: 0 } })} />
          <BlockItem title="X < value" equation="x < 100" onClick={() => handleBlockClick({ type: 'constraint', data: { variableName: 'x', constraintType: 'lt', constraintValue: 100 } })} onDragStart={(e) => handleDragStart(e, { type: 'constraint', data: { variableName: 'x', constraintType: 'lt', constraintValue: 100 } })} />
          <BlockItem title="Range" equation="0 ≤ x ≤ 100" onClick={() => handleBlockClick({ type: 'constraint', data: { variableName: 'x', constraintType: 'range', constraintValue: 0 } })} onDragStart={(e) => handleDragStart(e, { type: 'constraint', data: { variableName: 'x', constraintType: 'range', constraintValue: 0 } })} />
        </CategorySection>

        <CategorySection
          title="Charts"
          icon={ChartIcon}
          isExpanded={expandedCategory === 'charts'}
          onToggle={() => setExpandedCategory(expandedCategory === 'charts' ? null : 'charts')}
        >
          <BlockItem
            title="Medium Canvas"
            equation="512x384px"
            onClick={() => handleBlockClick({ type: 'chart', data: { dimensions: { width: 16, height: 12 } } })}
            onDragStart={(e) => handleDragStart(e, { type: 'chart', data: { dimensions: { width: 16, height: 12 } } })}
          />
          <BlockItem
            title="Large Canvas"
            equation="768x512px"
            onClick={() => handleBlockClick({ type: 'chart', data: { dimensions: { width: 24, height: 16 } } })}
            onDragStart={(e) => handleDragStart(e, { type: 'chart', data: { dimensions: { width: 24, height: 16 } } })}
          />
        </CategorySection>

        <CategorySection
          title="Descriptions"
          icon={FileCheck}
          isExpanded={expandedCategory === 'descriptions'}
          onToggle={() => setExpandedCategory(expandedCategory === 'descriptions' ? null : 'descriptions')}
        >
          <BlockItem title="Text Block" equation="Plain text" onClick={() => handleBlockClick({ type: 'description', data: { format: 'plain' } })} onDragStart={(e) => handleDragStart(e, { type: 'description', data: { format: 'plain' } })} />
          <BlockItem title="Markdown" equation="Formatted text" onClick={() => handleBlockClick({ type: 'description', data: { format: 'markdown' } })} onDragStart={(e) => handleDragStart(e, { type: 'description', data: { format: 'markdown' } })} />
          <BlockItem title="LaTeX" equation="Math notation" onClick={() => handleBlockClick({ type: 'description', data: { format: 'latex' } })} onDragStart={(e) => handleDragStart(e, { type: 'description', data: { format: 'latex' } })} />
          <BlockItem title="Title Block" equation="With header" onClick={() => handleBlockClick({ type: 'description', data: { format: 'plain', title: 'Title' } })} onDragStart={(e) => handleDragStart(e, { type: 'description', data: { format: 'plain', title: 'Title' } })} />
        </CategorySection>

        <CategorySection
          title="Limits"
          icon={CalculatorIcon}
          isExpanded={expandedCategory === 'limits'}
          onToggle={() => setExpandedCategory(expandedCategory === 'limits' ? null : 'limits')}
        >
          <BlockItem title="Two-Sided Limit" equation="lim x→a f(x)" onClick={() => handleBlockClick({ type: 'limit', data: { variableName: 'x', limitValue: 0, approach: 'both', limitType: 'both' } })} onDragStart={(e) => handleDragStart(e, { type: 'limit', data: { variableName: 'x', limitValue: 0, approach: 'both', limitType: 'both' } })} />
          <BlockItem title="Left Limit" equation="lim x→a⁻ f(x)" onClick={() => handleBlockClick({ type: 'limit', data: { variableName: 'x', limitValue: 0, approach: 'left', limitType: 'left' } })} onDragStart={(e) => handleDragStart(e, { type: 'limit', data: { variableName: 'x', limitValue: 0, approach: 'left', limitType: 'left' } })} />
          <BlockItem title="Right Limit" equation="lim x→a⁺ f(x)" onClick={() => handleBlockClick({ type: 'limit', data: { variableName: 'x', limitValue: 0, approach: 'right', limitType: 'right' } })} onDragStart={(e) => handleDragStart(e, { type: 'limit', data: { variableName: 'x', limitValue: 0, approach: 'right', limitType: 'right' } })} />
        </CategorySection>

        <CategorySection
          title="Shapes"
          icon={SquareIcon}
          isExpanded={expandedCategory === 'shapes'}
          onToggle={() => setExpandedCategory(expandedCategory === 'shapes' ? null : 'shapes')}
        >
          <BlockItem title="Square" equation="50% filled" onClick={() => handleBlockClick({ type: 'shape', data: { shapeType: 'square', fillValue: 50, fillMode: 'percentage' } })} onDragStart={(e) => handleDragStart(e, { type: 'shape', data: { shapeType: 'square', fillValue: 50, fillMode: 'percentage' } })} />
          <BlockItem title="Circle" equation="Fraction" onClick={() => handleBlockClick({ type: 'shape', data: { shapeType: 'circle', fillValue: 50, fillMode: 'fraction' } })} onDragStart={(e) => handleDragStart(e, { type: 'shape', data: { shapeType: 'circle', fillValue: 50, fillMode: 'fraction' } })} />
          <BlockItem title="Rectangle" equation="Decimal" onClick={() => handleBlockClick({ type: 'shape', data: { shapeType: 'rectangle', fillValue: 25, fillMode: 'decimal' } })} onDragStart={(e) => handleDragStart(e, { type: 'shape', data: { shapeType: 'rectangle', fillValue: 25, fillMode: 'decimal' } })} />
          <BlockItem title="Empty Square" equation="0% filled" onClick={() => handleBlockClick({ type: 'shape', data: { shapeType: 'square', fillValue: 0, fillMode: 'percentage' } })} onDragStart={(e) => handleDragStart(e, { type: 'shape', data: { shapeType: 'square', fillValue: 0, fillMode: 'percentage' } })} />
        </CategorySection>

        <CategorySection
          title="Tables"
          icon={ChartIcon}
          isExpanded={expandedCategory === 'tables'}
          onToggle={() => setExpandedCategory(expandedCategory === 'tables' ? null : 'tables')}
        >
          <BlockItem
            title="Dynamic Table"
            equation="y = mx + c support"
            onClick={() => handleBlockClick({ type: 'table', data: { autoGenerateRows: true, variableName: 'x', showGrid: true, highlightLastRow: true } })}
            onDragStart={(e) => handleDragStart(e, { type: 'table', data: { autoGenerateRows: true, variableName: 'x', showGrid: true, highlightLastRow: true } })}
          />
        </CategorySection>

        <CategorySection
          title="Piecewise Functions"
          icon={PuzzleIcon}
          isExpanded={expandedCategory === 'piecewise'}
          onToggle={() => setExpandedCategory(expandedCategory === 'piecewise' ? null : 'piecewise')}
        >
          <BlockItem
            title="Domain Limiter"
            equation="Connect to equation"
            onClick={() => handleBlockClick({ type: 'piecewise-limiter', data: { variableName: 'x', constraint: { type: 'lt', min: 0 }, enabled: true } })}
            onDragStart={(e) => handleDragStart(e, { type: 'piecewise-limiter', data: { variableName: 'x', constraint: { type: 'lt', min: 0 }, enabled: true } })}
          />
          <BlockItem
            title="Piecewise Builder"
            equation="Combine limiters"
            onClick={() => handleBlockClick({ type: 'piecewise-builder', data: { connectedLimiterIds: [], fallbackEnabled: true, fallbackEquation: '0' } })}
            onDragStart={(e) => handleDragStart(e, { type: 'piecewise-builder', data: { connectedLimiterIds: [], fallbackEnabled: true, fallbackEquation: '0' } })}
          />
        </CategorySection>
      </div>
      <div className="border-t border-border p-3 text-xs text-muted-foreground">
        <p>Drag blocks to canvas or click to add</p>
        <p className="mt-1">Double-click equations to edit</p>
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
  onDragStart,
}: {
  title: string;
  equation: string;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      onDragStart={onDragStart}
      draggable
      data-block-library-item
      className="flex w-full flex-col gap-1 rounded-md border border-border p-2 text-left transition-colors hover:bg-accent hover:border-primary/50"
    >
      <span className="text-sm font-medium">{title}</span>
      <span className="truncate text-xs font-mono text-muted-foreground">{equation}</span>
    </button>
  );
}

export default BlockLibrary;
