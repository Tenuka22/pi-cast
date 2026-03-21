/**
 * Block Type Guards
 *
 * Type guard functions for discriminating between block types.
 */

import type {
  Block,
  EquationBlock,
  ChartBlock,
  ControlBlock,
  DescriptionBlock,
  LimitBlock,
  ShapeBlock,
  LogicBlock,
  VariableBlock,
  ComparatorBlock,
  ConstraintBlock,
} from '@/lib/block-system/types';

export function isEquationBlock(block: Block): block is EquationBlock {
  return block.type === 'equation';
}

export function isChartBlock(block: Block): block is ChartBlock {
  return block.type === 'chart';
}

export function isControlBlock(block: Block): block is ControlBlock {
  return block.type === 'control';
}

export function isDescriptionBlock(block: Block): block is DescriptionBlock {
  return block.type === 'description';
}

export function isLimitBlock(block: Block): block is LimitBlock {
  return block.type === 'limit';
}

export function isShapeBlock(block: Block): block is ShapeBlock {
  return block.type === 'shape';
}

export function isLogicBlock(block: Block): block is LogicBlock {
  return block.type === 'logic';
}

export function isVariableBlock(block: Block): block is VariableBlock {
  return block.type === 'variable';
}

export function isComparatorBlock(block: Block): block is ComparatorBlock {
  return block.type === 'comparator';
}

export function isConstraintBlock(block: Block): block is ConstraintBlock {
  return block.type === 'constraint';
}
