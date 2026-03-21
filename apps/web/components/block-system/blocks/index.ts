/**
 * Block Components Index
 *
 * Exports all block type components and type guards.
 */

export { BlockWrapper } from './block-wrapper';
export { EquationBlockComponent } from './equation-block';
export { ChartBlockComponent } from '../../blocks/block-components';
export { ControlBlockComponent } from './control-block';
export { ControlVariableInput } from './control-variable-input';
export { DescriptionBlockComponent } from './description-block';
export { LimitBlockComponent } from './limit-block';
export { ShapeBlockComponent } from './shape-block';
export { LogicBlockComponent } from './logic-block';
export { ComparatorBlockComponent } from './comparator-block';
export { ConstraintBlockComponent } from './constraint-block';
export { VariableBlockComponent } from './variable-block';

// Type guards
export {
  isEquationBlock,
  isChartBlock,
  isControlBlock,
  isDescriptionBlock,
  isLimitBlock,
  isShapeBlock,
  isLogicBlock,
  isVariableBlock,
  isComparatorBlock,
  isConstraintBlock,
} from './type-guards';
