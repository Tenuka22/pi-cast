/**
 * Logic Evaluation System
 *
 * Evaluates logic gates and comparator blocks based on their inputs.
 */

import type {
  Block,
  LogicBlock,
  ComparatorBlock,
  EquationBlock,
  ControlBlock,
  ShapeBlock,
  ConstraintBlock,
} from '@/lib/block-system/types';
import {
  isEquationBlock,
  isControlBlock,
  isShapeBlock,
  isLogicBlock,
  isComparatorBlock,
  isConstraintBlock,
} from '@/components/block-system/blocks/type-guards';

/**
 * Get the numeric value from a block (equation, control, or shape).
 */
function getBlockNumericValue(block: Block | undefined): number {
  if (!block) return 0;

  if (isEquationBlock(block)) {
    // For equations, try to evaluate the result
    // This is a simplified evaluation - in a full system you'd parse and evaluate
    if (block.variables && block.variables.length > 0) {
      // Use the first variable's value as a proxy
      return block.variables[0]?.value ?? 0;
    }
    return 0;
  }

  if (isControlBlock(block)) {
    // For control blocks, use the first variable's value
    return block.variables[0]?.value ?? 0;
  }

  if (isShapeBlock(block)) {
    // For shape blocks, use the fill value
    return block.fillValue ?? 0;
  }

  // For logic/comparator blocks with boolean results, convert to number
  if (isLogicBlock(block) && typeof block.result === 'boolean') {
    return block.result ? 1 : 0;
  }

  if (isComparatorBlock(block) && typeof block.result === 'boolean') {
    return block.result ? 1 : 0;
  }

  return 0;
}

/**
 * Get the boolean value from a block.
 */
function getBlockBooleanValue(block: Block | undefined): boolean {
  if (!block) return false;

  // If the block has a boolean result, use it directly
  if (isLogicBlock(block) && typeof block.result === 'boolean') {
    return block.result;
  }

  if (isComparatorBlock(block) && typeof block.result === 'boolean') {
    return block.result;
  }

  // For numeric blocks, treat non-zero as true
  const numericValue = getBlockNumericValue(block);
  return numericValue !== 0;
}

/**
 * Evaluate a logic gate based on its input blocks.
 */
export function evaluateLogicGate(
  logicBlock: LogicBlock,
  blocks: Block[]
): boolean {
  const { logicType, inputs } = logicBlock;

  // Get input block values
  const inputValues = inputs
    .map((id) => blocks.find((b) => b.id === id))
    .filter((b): b is Block => b !== undefined)
    .map((b) => getBlockBooleanValue(b));

  // If no inputs, return false
  if (inputValues.length === 0) return false;

  switch (logicType) {
    case 'and':
      return inputValues.every((v) => v === true);
    case 'or':
      return inputValues.some((v) => v === true);
    case 'xor':
      // XOR: true if exactly one input is true
      const trueCount = inputValues.filter((v) => v).length;
      return trueCount === 1;
    case 'eq':
      // Equality: true if all inputs are equal
      if (inputValues.length === 0) return false;
      const first = inputValues[0];
      return inputValues.every((v) => v === first);
    case 'lt':
    case 'gt':
    case 'le':
    case 'ge':
      // These are comparator operators, not logic gates
      // Fall through to default
    default:
      // For unknown types, return true if any input is true
      return inputValues.some((v) => v === true);
  }
}

/**
 * Evaluate a comparator block based on its left and right inputs.
 */
export function evaluateComparator(
  comparatorBlock: ComparatorBlock,
  blocks: Block[]
): boolean {
  const { operator, leftInput, rightInput } = comparatorBlock;

  // Get left and right operand values
  const leftBlock = leftInput ? blocks.find((b) => b.id === leftInput) : undefined;
  const rightBlock = rightInput ? blocks.find((b) => b.id === rightInput) : undefined;

  const leftValue = getBlockNumericValue(leftBlock);
  const rightValue = getBlockNumericValue(rightBlock);

  switch (operator) {
    case 'lt':
      return leftValue < rightValue;
    case 'gt':
      return leftValue > rightValue;
    case 'le':
      return leftValue <= rightValue;
    case 'ge':
      return leftValue >= rightValue;
    case 'eq':
      return leftValue === rightValue;
    default:
      return false;
  }
}

/**
 * Evaluate a constraint block based on the connected equation's variable value.
 */
export function evaluateConstraint(
  constraintBlock: ConstraintBlock,
  blocks: Block[]
): boolean {
  const { variableName, constraint } = constraintBlock;

  // Find the connected equation block
  const equationBlock = blocks.find(
    (b) => b.id === constraintBlock.targetEquationId && isEquationBlock(b)
  );

  if (!equationBlock) return true; // No equation connected, constraint is satisfied by default

  // Get the variable value from the equation
  const variable = (equationBlock as EquationBlock).variables?.find((v: import('@/lib/block-system/types').Variable) => v.name === variableName);
  const value = variable?.value ?? 0;

  switch (constraint.type) {
    case 'gte':
      return constraint.min !== undefined ? value >= constraint.min : true;
    case 'gt':
      return constraint.min !== undefined ? value > constraint.min : true;
    case 'lte':
      return constraint.max !== undefined ? value <= constraint.max : true;
    case 'lt':
      return constraint.max !== undefined ? value < constraint.max : true;
    case 'range':
      const minOk = constraint.min !== undefined ? value >= constraint.min : true;
      const maxOk = constraint.max !== undefined ? value <= constraint.max : true;
      return minOk && maxOk;
    default:
      return true;
  }
}

/**
 * Evaluate all logic and comparator blocks in the system.
 * This should be called whenever blocks or connections change.
 */
export function evaluateAllLogicBlocks(
  blocks: Block[]
): { id: string; result: boolean | number }[] {
  const results: { id: string; result: boolean | number }[] = [];

  for (const block of blocks) {
    if (isLogicBlock(block)) {
      const result = evaluateLogicGate(block, blocks);
      results.push({ id: block.id, result });
    } else if (isComparatorBlock(block)) {
      const result = evaluateComparator(block, blocks);
      results.push({ id: block.id, result });
    } else if (isConstraintBlock(block)) {
      const result = evaluateConstraint(block, blocks);
      results.push({ id: block.id, result });
    }
  }

  return results;
}

/**
 * Update logic block results in the block array.
 */
export function updateLogicBlockResults(
  blocks: Block[],
  results: { id: string; result: boolean | number }[]
): Block[] {
  const now = Date.now();

  return blocks.map((block) => {
    const logicResult = results.find((r) => r.id === block.id);
    if (!logicResult) return block;

    if (isLogicBlock(block)) {
      return { ...block, result: logicResult.result as boolean, updatedAt: now } as Block;
    }
    if (isComparatorBlock(block)) {
      return { ...block, result: logicResult.result as boolean, updatedAt: now } as Block;
    }
    return block;
  });
}
