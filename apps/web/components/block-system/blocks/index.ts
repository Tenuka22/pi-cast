/**
 * Block Index
 * 
 * Exports all block components and utilities for the node tree-based system.
 */

export * from './block-wrapper';
export * from './chart-block';
export * from './control-block';
export * from './description-block';
export * from './equation-block';
export * from './limit-block';
export * from './shape-block';
export * from './logic-block';
export * from './variable-block';
export * from './comparator-block';
export * from './constraint-block';

// Type guards
export {
  isEquationBlock,
  isControlBlock,
  isLimitBlock,
  isChartBlock,
  isShapeBlock,
  isVariableBlock,
  isLogicBlock,
  isDescriptionBlock,
  isComparatorBlock,
  isConstraintBlock,
} from './type-guards';
