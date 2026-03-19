/**
 * Block System Types and Utilities
 * 
 * Core types, grid utilities, and equation tokenizer for the pi-cast block system.
 * Based on 32x32 pixel grid units.
 */

export const GRID_UNIT = 32; // Base grid unit in pixels

// ============================================================================
// TYPES
// ============================================================================

export type BlockType = 'equation' | 'chart' | 'control' | 'description';

export type EquationType = 'linear' | 'quadratic' | 'cubic' | 'exponential' | 'trigonometric' | 'custom';

export type TokenType = 'variable' | 'number' | 'operator' | 'equals' | 'function' | 'parenthesis' | 'whitespace';

export interface GridPosition {
  x: number;
  y: number;
}

export interface BlockDimensions {
  width: number;
  height: number;
}

export interface EquationToken {
  value: string;
  type: TokenType;
  startIndex: number;
  endIndex: number;
}

export interface Variable {
  name: string;
  value: number;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  position: GridPosition;
  dimensions: BlockDimensions;
  groupId?: string;
  isLocked?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface EquationBlock extends BaseBlock {
  type: 'equation';
  equation: string;
  tokens?: EquationToken[];
  variables?: Variable[];
  equationType?: EquationType;
}

export interface ChartConfig {
  xAxis: { min: number; max: number; step?: number; label?: string; showLabels: boolean };
  yAxis: { min: number; max: number; step?: number; label?: string; showLabels: boolean };
  showGrid: boolean;
  showAxes: boolean;
  zoom: number;
  pan: GridPosition;
}

export interface ChartBlock extends BaseBlock {
  type: 'chart';
  sourceEquationId?: string;
  equations: string[];
  chartConfig?: ChartConfig;
}

export interface ControlVariable {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  showSlider: boolean;
  showInput: boolean;
}

export interface ControlBlock extends BaseBlock {
  type: 'control';
  sourceEquationId?: string;
  variables: ControlVariable[];
  layout: 'horizontal' | 'vertical';
}

export interface DescriptionBlock extends BaseBlock {
  type: 'description';
  content: string;
  format: 'plain' | 'markdown' | 'latex';
  title?: string;
}

export type Block = EquationBlock | ChartBlock | ControlBlock | DescriptionBlock;

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export interface CanvasState {
  blocks: Block[];
  viewport: Viewport;
  gridVisible: boolean;
  selectedBlockId?: string;
  draggedBlockId?: string;
}

export interface DragState {
  isDragging: boolean;
  blockId: string;
  startPosition: GridPosition;
  currentPosition: GridPosition;
  offset: { x: number; y: number };
}

// ============================================================================
// GRID UTILITIES
// ============================================================================

export function gridToPixels(position: GridPosition): { x: number; y: number } {
  return { x: position.x * GRID_UNIT, y: position.y * GRID_UNIT };
}

export function pixelsToGrid(x: number, y: number): GridPosition {
  return { x: Math.round(x / GRID_UNIT), y: Math.round(y / GRID_UNIT) };
}

export function getBlockBoundingBox(block: Block): {
  x: number; y: number; width: number; height: number; right: number; bottom: number;
} {
  const pos = gridToPixels(block.position);
  const size = { width: block.dimensions.width * GRID_UNIT, height: block.dimensions.height * GRID_UNIT };
  return { ...pos, ...size, right: pos.x + size.width, bottom: pos.y + size.height };
}

export function blocksCollide(block1: Block, block2: Block): boolean {
  const b1 = getBlockBoundingBox(block1);
  const b2 = getBlockBoundingBox(block2);
  return !(b1.right <= b2.x || b1.x >= b2.right || b1.bottom <= b2.y || b1.y >= b2.bottom);
}

export function positionCollides(
  position: GridPosition,
  dimensions: BlockDimensions,
  blocks: Block[],
  excludeBlockId?: string
): boolean {
  const tempBlock: EquationBlock = {
    id: 'temp', type: 'equation', position, dimensions, equation: 'y = x', createdAt: 0, updatedAt: 0,
  };
  return blocks.some(block => block.id !== excludeBlockId && blocksCollide(tempBlock, block));
}

export function findNearestValidPosition(
  position: GridPosition,
  dimensions: BlockDimensions,
  blocks: Block[],
  excludeBlockId?: string
): GridPosition {
  if (!positionCollides(position, dimensions, blocks, excludeBlockId)) return position;

  const maxSearch = 50;
  for (let radius = 1; radius < maxSearch; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        const testPos: GridPosition = { x: position.x + dx, y: position.y + dy };
        if (!positionCollides(testPos, dimensions, blocks, excludeBlockId)) return testPos;
      }
    }
  }
  return { x: position.x + 20, y: position.y };
}

export function autoArrangeNeighbors(
  movedBlock: Block,
  blocks: Block[],
  searchRadius: number = 10
): { blockId: string; oldPosition: GridPosition; newPosition: GridPosition }[] {
  const adjustments: { blockId: string; oldPosition: GridPosition; newPosition: GridPosition }[] = [];
  const movedBox = getBlockBoundingBox(movedBlock);

  const nearbyBlocks = blocks.filter(block => {
    if (block.id === movedBlock.id) return false;
    const box = getBlockBoundingBox(block);
    const distance = Math.sqrt(
      Math.pow(box.x + box.width / 2 - (movedBox.x + movedBox.width / 2), 2) +
      Math.pow(box.y + box.height / 2 - (movedBox.y + movedBox.height / 2), 2)
    );
    return distance < searchRadius * GRID_UNIT;
  });

  for (const block of nearbyBlocks) {
    if (blocksCollide(movedBlock, block)) {
      const oldPosition = { ...block.position };
      const box = getBlockBoundingBox(block);
      const dx = box.x + box.width / 2 - (movedBox.x + movedBox.width / 2);
      const dy = box.y + box.height / 2 - (movedBox.y + movedBox.height / 2);

      let newX = block.position.x;
      let newY = block.position.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        newX = block.position.x + (dx > 0 ? block.dimensions.width : -block.dimensions.width);
      } else {
        newY = block.position.y + (dy > 0 ? block.dimensions.height : -block.dimensions.height);
      }

      const newPosition = findNearestValidPosition(
        { x: newX, y: newY }, block.dimensions, blocks.filter(b => b.id !== block.id), block.id
      );

      if (newPosition.x !== oldPosition.x || newPosition.y !== oldPosition.y) {
        adjustments.push({ blockId: block.id, oldPosition, newPosition });
        block.position = newPosition;
      }
    }
  }
  return adjustments;
}

export function getDefaultBlockDimensions(type: BlockType): BlockDimensions {
  switch (type) {
    case 'equation': return { width: 8, height: 1 };
    case 'chart': return { width: 16, height: 12 };
    case 'control': return { width: 6, height: 2 };
    case 'description': return { width: 10, height: 2 };
    default: return { width: 4, height: 1 };
  }
}

// ============================================================================
// EQUATION TOKENIZER
// ============================================================================

export function tokenizeEquation(equation: string): EquationToken[] {
  const tokens: EquationToken[] = [];
  let index = 0;

  while (index < equation.length) {
    const char = equation.charAt(index);

    if (/\s/.test(char)) {
      let endIndex = index;
      while (endIndex < equation.length && /\s/.test(equation.charAt(endIndex))) endIndex++;
      tokens.push({ value: equation.slice(index, endIndex), type: 'whitespace', startIndex: index, endIndex });
      index = endIndex;
      continue;
    }

    if (char === '=') {
      tokens.push({ value: char, type: 'equals', startIndex: index, endIndex: index + 1 });
      index++;
      continue;
    }

    if (['+', '-', '*', '/'].includes(char)) {
      tokens.push({ value: char, type: 'operator', startIndex: index, endIndex: index + 1 });
      index++;
      continue;
    }

    if (char === '^') {
      tokens.push({ value: char, type: 'operator', startIndex: index, endIndex: index + 1 });
      index++;
      continue;
    }

    if (['(', ')', '[', ']'].includes(char)) {
      tokens.push({ value: char, type: 'parenthesis', startIndex: index, endIndex: index + 1 });
      index++;
      continue;
    }

    const numberMatch = equation.slice(index).match(/^-?\d+\.?\d*/);
    if (numberMatch) {
      const value = numberMatch[0];
      tokens.push({ value, type: 'number', startIndex: index, endIndex: index + value.length });
      index += value.length;
      continue;
    }

    const functionMatch = equation.slice(index).match(/^(sin|cos|tan|log|ln|sqrt|abs|exp|floor|ceil)/i);
    if (functionMatch) {
      const value = functionMatch[0];
      tokens.push({ value, type: 'function', startIndex: index, endIndex: index + value.length });
      index += value.length;
      continue;
    }

    const variableMatch = equation.slice(index).match(/^[a-zA-Z][a-zA-Z0-9_]*(?:_[a-zA-Z0-9]+)*/);
    if (variableMatch) {
      const value = variableMatch[0];
      tokens.push({ value, type: 'variable', startIndex: index, endIndex: index + value.length });
      index += value.length;
      continue;
    }

    tokens.push({ value: char, type: 'operator', startIndex: index, endIndex: index + 1 });
    index++;
  }

  return tokens;
}

export function getTokenClassName(type: TokenType): string {
  const classes: Record<TokenType, string> = {
    variable: 'text-purple-600 dark:text-purple-400 font-semibold',
    number: 'text-orange-600 dark:text-orange-400',
    operator: 'text-gray-600 dark:text-gray-400',
    equals: 'text-pink-600 dark:text-pink-400 font-bold',
    function: 'text-blue-600 dark:text-blue-400 font-semibold',
    parenthesis: 'text-gray-500 dark:text-gray-500',
    whitespace: '',
  };
  return classes[type] || '';
}

export function parseEquation(equation: string): { tokens: EquationToken[]; variables: Variable[]; equationType: EquationType } {
  const tokens = tokenizeEquation(equation);
  const functionNames = new Set(['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs', 'exp', 'floor', 'ceil']);
  const variableNames = new Set<string>();

  for (const token of tokens) {
    if (token.type === 'variable' && !functionNames.has(token.value.toLowerCase())) {
      variableNames.add(token.value);
    }
  }

  variableNames.delete('e');
  variableNames.delete('pi');

  const variables: Variable[] = [];
  let varIndex = 0;
  const defaults: Record<string, number> = { m: 1, c: 0, a: 1, b: 0, d: 0, x: 0, y: 0 };

  for (const name of Array.from(variableNames).sort()) {
    variables.push({
      name, value: defaults[name] ?? (varIndex === 0 ? 1 : 0), defaultValue: defaults[name] ?? (varIndex === 0 ? 1 : 0),
      min: -1000, max: 1000, step: name === 'x' || name === 'y' ? 0.1 : 0.5,
    });
    varIndex++;
  }

  const normalized = equation.toLowerCase().replace(/\s/g, '');
  let equationType: EquationType = 'custom';
  if (/sin|cos|tan/.test(normalized)) equationType = 'trigonometric';
  else if (/\^[a-zx]/.test(normalized) || /exp\(/.test(normalized)) equationType = 'exponential';
  else if (/x\^3/.test(normalized)) equationType = 'cubic';
  else if (/x\^2/.test(normalized)) equationType = 'quadratic';
  else if (/y=/.test(normalized) || /=.*x/.test(normalized)) equationType = 'linear';

  return { tokens, variables, equationType };
}
