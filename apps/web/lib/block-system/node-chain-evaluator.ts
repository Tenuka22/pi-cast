/**
 * Node Chain Data Flow Evaluator
 * 
 * Evaluates data flowing through node chains in the tree-based architecture.
 * Each node processes input data from its prev node and passes output to next nodes.
 */

import type {
  Block,
  NodeChain,
  NodeData,
  LimitApproachValue,
  EquationBlock,
  ControlBlock,
  LimitBlock,
  ShapeBlock,
  LogicBlock,
  ComparatorBlock,
  ConstraintBlock,
  Variable,
} from '@/lib/block-system/types';
import {
  evaluateFunction,
  type GraphConfig,
  DEFAULT_GRAPH_CONFIG,
} from '@/lib/visualization/graph-renderer';
import {
  evaluateLogicGate,
  evaluateComparator,
  evaluateConstraint,
} from './logic-evaluation';

/**
 * Main entry point: Evaluate a complete node chain
 * Traverses from the given node back to all sources, collecting and processing data
 */
export function evaluateChain(
  chainId: string,
  allChains: Map<string, NodeChain>,
  allBlocks: Map<string, Block>
): NodeData {
  const chain = allChains.get(chainId);
  if (!chain) return {};

  const block = allBlocks.get(chain.nodeId);
  if (!block) return {};

  // First, evaluate previous node (if exists) to get input data
  let inputData: NodeData = {};
  if (chain.prev) {
    inputData = evaluateChain(chain.prev, allChains, allBlocks);
  }

  // Process data through this node
  const outputData = processNode(block, inputData, allBlocks);

  return outputData;
}

/**
 * Process data through a single node
 */
function processNode(
  block: Block,
  inputData: NodeData,
  allBlocks: Map<string, Block>
): NodeData {
  const output: NodeData = {
    ...inputData, // Start with input data
    timestamp: Date.now(),
  };

  switch (block.type) {
    case 'equation': {
      const eqBlock = block as EquationBlock;
      // Merge equation data (input variables may be modified by control nodes)
      output.equation = eqBlock.equation;
      output.tokens = eqBlock.tokens;
      output.equationType = eqBlock.equationType;
      
      // Merge variables - input variables take precedence (from control nodes)
      if (inputData.variables && inputData.variables.length > 0) {
        // Merge with input variables (control block values override equation defaults)
        output.variables = eqBlock.variables?.map((eqVar) => {
          const inputVar = inputData.variables?.find((v) => v.name === eqVar.name);
          return inputVar || eqVar;
        });
      } else {
        output.variables = eqBlock.variables;
      }
      break;
    }

    case 'control': {
      const ctrlBlock = block as ControlBlock;
      // Control blocks modify variables from previous nodes
      output.variables = ctrlBlock.variables.map((v) => ({
        name: v.name,
        value: v.value,
        defaultValue: v.value,
        min: v.min,
        max: v.max,
        step: v.step,
      }));
      break;
    }

    case 'variable': {
      // Variable block is similar to control but specifically for equation variables
      const varBlock = block as import('@/lib/block-system/types').VariableBlock;
      output.variables = varBlock.variables.map((v) => ({
        name: v.name,
        value: v.value,
        defaultValue: v.value,
        min: v.min,
        max: v.max,
        step: v.step,
      }));
      break;
    }

    case 'limit': {
      const limitBlock = block as LimitBlock;
      // Generate limit approach values based on previous equation
      if (inputData.equation && inputData.variables) {
        output.limitValues = generateLimitApproachValues(
          inputData.equation,
          inputData.variables,
          limitBlock.variableName,
          limitBlock.limitValue,
          limitBlock.approach
        );
      }
      break;
    }

    case 'shape': {
      const shapeBlock = block as ShapeBlock;
      
      // Check if shape receives input from previous node
      if (inputData.fillValue !== undefined) {
        // Use input fill value from previous node (logic/comparator result)
        const fillFromInput = inputData.isFilled !== undefined
          ? inputData.isFilled
            ? 100
            : 0
          : inputData.fillValue;
        
        output.fillValue = fillFromInput;
        output.fillPercentage = calculateFillPercentage(shapeBlock.fillMode, fillFromInput);
        output.isFilled = output.fillPercentage === 100;
      } else {
        // Use block's own fill value
        output.fillValue = shapeBlock.fillValue;
        output.fillPercentage = calculateFillPercentage(shapeBlock.fillMode, shapeBlock.fillValue);
        output.isFilled = output.fillPercentage === 100;
      }
      break;
    }

    case 'logic': {
      const logicBlock = block as LogicBlock;
      // Evaluate logic gate using connected input blocks
      const result = evaluateLogicGate(logicBlock, Array.from(allBlocks.values()));
      output.booleanResult = result;
      output.result = result;
      // For shape fill: true = 100%, false = 0%
      output.fillValue = result ? 100 : 0;
      output.isFilled = result;
      break;
    }

    case 'comparator': {
      const compBlock = block as ComparatorBlock;
      // Evaluate comparator using connected input blocks
      const result = evaluateComparator(compBlock, Array.from(allBlocks.values()));
      output.booleanResult = result;
      output.result = result;
      // For shape fill: true = 100%, false = 0%
      output.fillValue = result ? 100 : 0;
      output.isFilled = result;
      break;
    }

    case 'constraint': {
      const constraintBlock = block as ConstraintBlock;
      // Evaluate constraint
      const result = evaluateConstraint(constraintBlock, Array.from(allBlocks.values()));
      output.booleanResult = result;
      output.result = result;
      break;
    }

    case 'chart': {
      // Chart collects all data from the chain - no modification needed
      // The actual rendering happens in the ChartBlockComponent
      break;
    }

    case 'description': {
      // Description blocks don't modify data flow
      break;
    }
  }

  return output;
}

/**
 * Calculate fill percentage based on fill mode
 */
function calculateFillPercentage(
  fillMode: 'solid' | 'fraction' | 'decimal' | 'percentage',
  value: number
): number {
  switch (fillMode) {
    case 'percentage':
      return value;
    case 'fraction':
      return value * 100;
    case 'decimal':
      return value * 100;
    case 'solid':
      return value > 0 ? 100 : 0;
    default:
      return 0;
  }
}

/**
 * Generate limit approach values for visualization
 * Shows values approaching the limit from left, right, or both sides
 */
export function generateLimitApproachValues(
  equation: string,
  variables: Variable[],
  variableName: string,
  limitValue: number,
  approach: 'left' | 'right' | 'both',
  steps: number = 5
): LimitApproachValue[] {
  const values: LimitApproachValue[] = [];
  const stepSize = 0.1; // Distance between each approach value

  // Create a variable map for evaluation
  const varMap: Record<string, number> = {};
  variables.forEach((v) => {
    varMap[v.name] = v.value;
  });

  // Generate approach values for one side
  const generateSide = (direction: 'left' | 'right') => {
    for (let i = steps; i >= 1; i--) {
      const x =
        direction === 'left'
          ? limitValue - i * stepSize
          : limitValue + i * stepSize;

      // Evaluate the equation at this x value
      varMap[variableName] = x;
      const y = evaluateEquationAtX(equation, varMap);

      values.push({
        x,
        y,
        label: `${variableName} → ${x.toFixed(2)}`,
      });
    }
  };

  if (approach === 'left' || approach === 'both') {
    generateSide('left');
  }

  if (approach === 'right' || approach === 'both') {
    generateSide('right');
  }

  return values;
}

/**
 * Evaluate equation at a specific x value using the full function evaluator
 */
function evaluateEquationAtX(
  equation: string,
  variables: Record<string, number>
): number {
  try {
    // Use the graph-renderer's evaluateFunction
    return evaluateFunction(equation, variables);
  } catch (error) {
    console.error('Error evaluating equation at x:', error);
    return NaN;
  }
}

/**
 * Get the final equation string with all variables substituted
 * This is useful for chart rendering
 */
export function getSubstitutedEquation(
  equation: string,
  variables: Variable[] | undefined
): string {
  if (!variables || variables.length === 0) {
    return equation;
  }

  let result = equation;

  // Remove "y = " prefix if present
  result = result.replace(/^y\s*=\s*/i, '').trim();

  // Replace constants first (pi, e)
  result = result.replace(/\bpi\b/g, String(Math.PI));
  result = result.replace(/\be\b(?!q)/g, String(Math.E));

  // Replace variables (except x which is the independent variable for graphing)
  for (const variable of variables) {
    if (variable.name !== 'x') {
      const regex = new RegExp(`\\b${variable.name}\\b`, 'g');
      result = result.replace(regex, String(variable.value));
    }
  }

  return result;
}

/**
 * Prepare data for chart rendering from a node chain
 */
export function prepareChartData(
  chainId: string,
  allChains: Map<string, NodeChain>,
  allBlocks: Map<string, Block>
): {
  equations: Array<{
    fn: string;
    color: string;
    variables: Record<string, number>;
  }>;
  limitValues?: LimitApproachValue[];
} {
  const chain = allChains.get(chainId);
  if (!chain) return { equations: [] };

  const evaluatedData = evaluateChain(chainId, allChains, allBlocks);

  const equations: Array<{
    fn: string;
    color: string;
    variables: Record<string, number>;
  }> = [];

  if (evaluatedData.equation) {
    const varMap: Record<string, number> = {};
    evaluatedData.variables?.forEach((v) => {
      varMap[v.name] = v.value;
    });

    const fn = getSubstitutedEquation(evaluatedData.equation, evaluatedData.variables);

    equations.push({
      fn,
      color: '#c084fc', // Default color
      variables: varMap,
    });
  }

  return {
    equations,
    limitValues: evaluatedData.limitValues,
  };
}

/**
 * Validate a node chain (check for cycles, broken links, etc.)
 */
export function validateChain(
  chainId: string,
  allChains: Map<string, NodeChain>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const visited = new Set<string>();

  // Check for cycles by traversing backwards
  function detectCycle(currentId: string, path: Set<string>): boolean {
    if (path.has(currentId)) {
      errors.push(`Cycle detected at node ${currentId}`);
      return true;
    }

    const chain = allChains.get(currentId);
    if (!chain) return false;

    path.add(currentId);

    if (chain.prev && detectCycle(chain.prev, new Set(path))) {
      return true;
    }

    return false;
  }

  const hasCycle = detectCycle(chainId, visited);

  // Check for broken links
  const chain = allChains.get(chainId);
  if (chain && chain.prev && !allChains.has(chain.prev)) {
    errors.push(`Broken link: node ${chainId} references non-existent previous node ${chain.prev}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
