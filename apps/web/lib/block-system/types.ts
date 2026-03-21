/**
 * Block System Types and Utilities
 *
 * Core types, grid utilities, and equation tokenizer for the pi-cast block system.
 * Based on 32x32 pixel grid units.
 */

export const GRID_UNIT = 32 // Base grid unit in pixels

// ============================================================================
// TYPES
// ============================================================================

export type BlockType =
  | "equation"
  | "chart"
  | "control"
  | "description"
  | "limit"
  | "shape"
  | "logic"
  | "variable"
  | "comparator"
  | "constraint"

export type EquationType =
  | "linear"
  | "quadratic"
  | "cubic"
  | "exponential"
  | "trigonometric"
  | "custom"

export type TokenType =
  | "variable"
  | "number"
  | "operator"
  | "equals"
  | "function"
  | "parenthesis"
  | "whitespace"

export type LimitApproach = "left" | "right" | "both"

export type ShapeType = "square" | "circle" | "rectangle"

export type ShapeFillMode = "solid" | "fraction" | "decimal" | "percentage"

export type LogicGateType = "and" | "or" | "xor" | "eq" | "le" | "ge" | "gt" | "lt"

export interface GridPosition {
  x: number
  y: number
}

export interface BlockDimensions {
  width: number
  height: number
}

export interface EquationToken {
  value: string
  type: TokenType
  startIndex: number
  endIndex: number
}

export type ConstraintType = 'gte' | 'gt' | 'lte' | 'lt' | 'range'

export interface VariableConstraint {
  type: ConstraintType
  min?: number  // For gte, gt, or range minimum
  max?: number  // For lte, lt, or range maximum
}

export interface Variable {
  name: string
  value: number
  defaultValue: number
  min?: number
  max?: number
  step?: number
  constraints?: VariableConstraint
}

export interface BaseBlock {
  id: string
  type: BlockType
  position: GridPosition
  dimensions: BlockDimensions
  groupId?: string
  isLocked?: boolean
  createdAt: number
  updatedAt: number
}

export interface EquationBlock extends BaseBlock {
  type: "equation"
  equation: string
  tokens?: EquationToken[]
  variables?: Variable[]
  equationType?: EquationType
  // Connection tracking
  connectedChartIds?: string[]
  connectedControlIds?: string[]
  connectedEquationIds?: string[]
  connectedLimitIds?: string[]
  connectedVariableIds?: string[]
}

export interface ChartConfig {
  xAxis: {
    min: number
    max: number
    step?: number
    label?: string
    showLabels: boolean
  }
  yAxis: {
    min: number
    max: number
    step?: number
    label?: string
    showLabels: boolean
  }
  showGrid: boolean
  showAxes: boolean
  zoom: number
  pan: GridPosition
}

export interface ChartBlock extends BaseBlock {
  type: "chart"
  sourceEquationIds?: string[]
  equations: string[]
  chartConfig?: ChartConfig
}

export interface ControlVariable {
  name: string
  value: number
  min: number
  max: number
  step: number
  showSlider: boolean
  showInput: boolean
  // Auto-animation settings
  autoAnimate?: boolean
  animationSpeed?: number // ms per cycle
  animationDirection?: "oscillate" | "loop" // oscillate: back-and-forth, loop: min to max
}

export interface ControlBlock extends BaseBlock {
  type: "control"
  sourceEquationId?: string
  sourceEquationIds?: string[]
  variables: ControlVariable[]
  layout: "horizontal" | "vertical"
  // Global auto-animation settings
  autoAnimateAll?: boolean
  globalSpeed?: number
}

export interface DescriptionBlock extends BaseBlock {
  type: "description"
  content: string
  format: "plain" | "markdown" | "latex"
  title?: string
}

export interface LimitBlock extends BaseBlock {
  type: "limit"
  targetEquationId?: string
  variableName: string
  limitValue: number
  approach: LimitApproach
  result?: string
}

export interface ShapeBlock extends BaseBlock {
  type: "shape"
  shapeType: ShapeType
  fillColor: string
  fillValue: number // 0-1 for fraction/decimal, 0-100 for percentage
  fillMode: ShapeFillMode
  showGrid: boolean
  rows?: number // for grid subdivision
  cols?: number
  // Connection tracking
  sourceValueId?: string // Can connect to equation/control for dynamic values
  sourceControlId?: string // Can connect to control for value sync
}

export interface LogicBlock extends BaseBlock {
  type: "logic"
  logicType: LogicGateType
  inputs: string[] // Array of connected block IDs
  output: string | null // Connected output block ID
  result?: number | boolean // Computed result
}

export interface ComparatorBlock extends BaseBlock {
  type: "comparator"
  operator: LogicGateType // le, ge, gt, lt, eq
  leftInput: string | null // Connected left operand block ID
  rightInput: string | null // Connected right operand block ID
  output: string | null // Connected output block ID
  result?: boolean // Computed boolean result
}

export interface ConstraintBlock extends BaseBlock {
  type: "constraint"
  targetEquationId?: string // Connected equation block ID
  variableName: string // Variable to constrain (e.g., 'x')
  constraint: VariableConstraint // The constraint definition
  result?: boolean // Whether the constraint is satisfied
}

export interface VariableBlock extends BaseBlock {
  type: "variable"
  sourceEquationId?: string // Connected equation block
  variables: ControlVariable[] // Variables with sliders
  layout: "horizontal" | "vertical"
}

export type Block =
  | EquationBlock
  | ChartBlock
  | ControlBlock
  | DescriptionBlock
  | LimitBlock
  | ShapeBlock
  | LogicBlock
  | VariableBlock
  | ComparatorBlock
  | ConstraintBlock

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export type ConnectionHandleType = "input" | "output"

export interface ConnectionHandle {
  id: string
  type: ConnectionHandleType
  label?: string
  position: "top" | "bottom" | "left" | "right"
  index?: number
}

export interface BlockConnection {
  id: string
  sourceBlockId: string
  sourceHandleId: string
  targetBlockId: string
  targetHandleId: string
  type:
    | "equation-to-chart"
    | "equation-to-control"
    | "equation-to-equation"
    | "equation-to-limit"
    | "equation-to-variable"
    | "limit-to-chart"
    | "equation-to-shape"
    | "control-to-shape"
    | "control-to-limit"
    | "equation-to-logic"
    | "logic-to-logic"
    | "logic-to-chart"
    | "logic-to-shape"
    | "equation-to-comparator"
    | "control-to-comparator"
    | "comparator-to-logic"
    | "comparator-to-chart"
    | "comparator-to-shape"
    | "comparator-to-comparator"
    | "constraint-to-equation"
    | "constraint-to-chart"
  createdAt: number
}

export interface Viewport {
  x: number
  y: number
  width: number
  height: number
  zoom: number
}

export interface CanvasState {
  blocks: Block[]
  viewport: Viewport
  gridVisible: boolean
  selectedBlockId?: string
  draggedBlockId?: string
}

export interface DragState {
  isDragging: boolean
  blockId: string
  startPosition: GridPosition
  currentPosition: GridPosition
  offset: { x: number; y: number }
}

// ============================================================================
// GRID UTILITIES
// ============================================================================

export function gridToPixels(position: GridPosition): { x: number; y: number } {
  return { x: position.x * GRID_UNIT, y: position.y * GRID_UNIT }
}

export function pixelsToGrid(x: number, y: number): GridPosition {
  return { x: Math.round(x / GRID_UNIT), y: Math.round(y / GRID_UNIT) }
}

export function getBlockBoundingBox(block: Block): {
  x: number
  y: number
  width: number
  height: number
  right: number
  bottom: number
} {
  const pos = gridToPixels(block.position)
  const size = {
    width: block.dimensions.width * GRID_UNIT,
    height: block.dimensions.height * GRID_UNIT,
  }
  return {
    ...pos,
    ...size,
    right: pos.x + size.width,
    bottom: pos.y + size.height,
  }
}

export function blocksCollide(block1: Block, block2: Block): boolean {
  const b1 = getBlockBoundingBox(block1)
  const b2 = getBlockBoundingBox(block2)
  return !(
    b1.right <= b2.x ||
    b1.x >= b2.right ||
    b1.bottom <= b2.y ||
    b1.y >= b2.bottom
  )
}

export function positionCollides(
  position: GridPosition,
  dimensions: BlockDimensions,
  blocks: Block[],
  excludeBlockId?: string
): boolean {
  const tempBlock: EquationBlock = {
    id: "temp",
    type: "equation",
    position,
    dimensions,
    equation: "y = x",
    createdAt: 0,
    updatedAt: 0,
  }
  return blocks.some(
    (block) => block.id !== excludeBlockId && blocksCollide(tempBlock, block)
  )
}

export function findNearestValidPosition(
  position: GridPosition,
  dimensions: BlockDimensions,
  blocks: Block[],
  excludeBlockId?: string
): GridPosition {
  if (!positionCollides(position, dimensions, blocks, excludeBlockId))
    return position

  const maxSearch = 50
  for (let radius = 1; radius < maxSearch; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue
        const testPos: GridPosition = { x: position.x + dx, y: position.y + dy }
        if (!positionCollides(testPos, dimensions, blocks, excludeBlockId))
          return testPos
      }
    }
  }
  return { x: position.x + 20, y: position.y }
}

export function autoArrangeNeighbors(
  movedBlock: Block,
  blocks: Block[],
  searchRadius: number = 10
): { blockId: string; oldPosition: GridPosition; newPosition: GridPosition }[] {
  const adjustments: {
    blockId: string
    oldPosition: GridPosition
    newPosition: GridPosition
  }[] = []
  const movedBox = getBlockBoundingBox(movedBlock)

  const nearbyBlocks = blocks.filter((block) => {
    if (block.id === movedBlock.id) return false
    const box = getBlockBoundingBox(block)
    const distance = Math.sqrt(
      Math.pow(box.x + box.width / 2 - (movedBox.x + movedBox.width / 2), 2) +
        Math.pow(box.y + box.height / 2 - (movedBox.y + movedBox.height / 2), 2)
    )
    return distance < searchRadius * GRID_UNIT
  })

  for (const block of nearbyBlocks) {
    if (blocksCollide(movedBlock, block)) {
      const oldPosition = { ...block.position }
      const box = getBlockBoundingBox(block)
      const dx = box.x + box.width / 2 - (movedBox.x + movedBox.width / 2)
      const dy = box.y + box.height / 2 - (movedBox.y + movedBox.height / 2)

      let newX = block.position.x
      let newY = block.position.y

      if (Math.abs(dx) > Math.abs(dy)) {
        newX =
          block.position.x +
          (dx > 0 ? block.dimensions.width : -block.dimensions.width)
      } else {
        newY =
          block.position.y +
          (dy > 0 ? block.dimensions.height : -block.dimensions.height)
      }

      const newPosition = findNearestValidPosition(
        { x: newX, y: newY },
        block.dimensions,
        blocks.filter((b) => b.id !== block.id),
        block.id
      )

      if (newPosition.x !== oldPosition.x || newPosition.y !== oldPosition.y) {
        adjustments.push({ blockId: block.id, oldPosition, newPosition })
        block.position = newPosition
      }
    }
  }
  return adjustments
}

export function getDefaultBlockDimensions(type: BlockType): BlockDimensions {
  switch (type) {
    case "equation":
      return { width: 16, height: 3 }
    case "chart":
      return { width: 60, height: 48 }
    case "control":
      return { width: 6, height: 4 }
    case "description":
      return { width: 10, height: 4 }
    case "limit":
      return { width: 8, height: 4 }
    case "shape":
      return { width: 6, height: 8 }
    case "logic":
      return { width: 4, height: 4 }
    case "variable":
      return { width: 6, height: 4 }
    case "comparator":
      return { width: 6, height: 4 }
    case "constraint":
      return { width: 6, height: 5 }
    default:
      return { width: 4, height: 2 }
  }
}

// ============================================================================
// EQUATION TOKENIZER
// ============================================================================

export function tokenizeEquation(equation: string): EquationToken[] {
  const tokens: EquationToken[] = []
  let index = 0

  while (index < equation.length) {
    const char = equation.charAt(index)

    if (/\s/.test(char)) {
      let endIndex = index
      while (endIndex < equation.length && /\s/.test(equation.charAt(endIndex)))
        endIndex++
      tokens.push({
        value: equation.slice(index, endIndex),
        type: "whitespace",
        startIndex: index,
        endIndex,
      })
      index = endIndex
      continue
    }

    if (char === "=") {
      tokens.push({
        value: char,
        type: "equals",
        startIndex: index,
        endIndex: index + 1,
      })
      index++
      continue
    }

    if (["+", "-", "*", "/"].includes(char)) {
      tokens.push({
        value: char,
        type: "operator",
        startIndex: index,
        endIndex: index + 1,
      })
      index++
      continue
    }

    if (char === "^") {
      tokens.push({
        value: char,
        type: "operator",
        startIndex: index,
        endIndex: index + 1,
      })
      index++
      continue
    }

    if (["(", ")", "[", "]"].includes(char)) {
      tokens.push({
        value: char,
        type: "parenthesis",
        startIndex: index,
        endIndex: index + 1,
      })
      index++
      continue
    }

    const numberMatch = equation.slice(index).match(/^-?\d+\.?\d*/)
    if (numberMatch) {
      const value = numberMatch[0]
      tokens.push({
        value,
        type: "number",
        startIndex: index,
        endIndex: index + value.length,
      })
      index += value.length
      continue
    }

    const functionMatch = equation
      .slice(index)
      .match(/^(sin|cos|tan|log|ln|sqrt|abs|exp|floor|ceil)/i)
    if (functionMatch) {
      const value = functionMatch[0]
      tokens.push({
        value,
        type: "function",
        startIndex: index,
        endIndex: index + value.length,
      })
      index += value.length
      continue
    }

    const variableMatch = equation
      .slice(index)
      .match(/^[a-zA-Z][a-zA-Z0-9_]*(?:_[a-zA-Z0-9]+)*/)
    if (variableMatch) {
      const value = variableMatch[0]
      tokens.push({
        value,
        type: "variable",
        startIndex: index,
        endIndex: index + value.length,
      })
      index += value.length
      continue
    }

    tokens.push({
      value: char,
      type: "operator",
      startIndex: index,
      endIndex: index + 1,
    })
    index++
  }

  return tokens
}

export function getTokenClassName(type: TokenType): string {
  const classes: Record<TokenType, string> = {
    variable: "text-purple-600 dark:text-purple-400 font-semibold",
    number: "text-orange-600 dark:text-orange-400",
    operator: "text-gray-600 dark:text-gray-400",
    equals: "text-pink-600 dark:text-pink-400 font-bold",
    function: "text-blue-600 dark:text-blue-400 font-semibold",
    parenthesis: "text-gray-500 dark:text-gray-500",
    whitespace: "",
  }
  return classes[type] || ""
}

export function parseEquation(equation: string): {
  tokens: EquationToken[]
  variables: Variable[]
  equationType: EquationType
} {
  const tokens = tokenizeEquation(equation)
  const functionNames = new Set([
    "sin",
    "cos",
    "tan",
    "log",
    "ln",
    "sqrt",
    "abs",
    "exp",
    "floor",
    "ceil",
  ])
  const variableNames = new Set<string>()

  for (const token of tokens) {
    if (
      token.type === "variable" &&
      !functionNames.has(token.value.toLowerCase())
    ) {
      variableNames.add(token.value)
    }
  }

  variableNames.delete("e")
  variableNames.delete("pi")

  const variables: Variable[] = []
  let varIndex = 0
  const defaults: Record<string, number> = {
    m: 1,
    c: 0,
    a: 1,
    b: 0,
    d: 0,
    x: 0,
    y: 0,
  }

  for (const name of Array.from(variableNames).sort()) {
    variables.push({
      name,
      value: defaults[name] ?? (varIndex === 0 ? 1 : 0),
      defaultValue: defaults[name] ?? (varIndex === 0 ? 1 : 0),
      min: -1000,
      max: 1000,
      step: name === "x" || name === "y" ? 0.1 : 0.5,
    })
    varIndex++
  }

  const normalized = equation.toLowerCase().replace(/\s/g, "")
  let equationType: EquationType = "custom"
  if (/sin|cos|tan/.test(normalized)) equationType = "trigonometric"
  else if (/\^[a-zx]/.test(normalized) || /exp\(/.test(normalized))
    equationType = "exponential"
  else if (/x\^3/.test(normalized)) equationType = "cubic"
  else if (/x\^2/.test(normalized)) equationType = "quadratic"
  else if (/y=/.test(normalized) || /=.*x/.test(normalized))
    equationType = "linear"

  return { tokens, variables, equationType }
}

// ============================================================================
// CONNECTION UTILITIES
// ============================================================================

export function getConnectionType(
  sourceBlockType: BlockType,
  targetBlockType: BlockType
): BlockConnection["type"] | null {
  if (sourceBlockType === "equation" && targetBlockType === "chart")
    return "equation-to-chart"
  if (sourceBlockType === "equation" && targetBlockType === "control")
    return "equation-to-control"
  if (sourceBlockType === "equation" && targetBlockType === "equation")
    return "equation-to-equation"
  if (sourceBlockType === "equation" && targetBlockType === "limit")
    return "equation-to-limit"
  if (sourceBlockType === "equation" && targetBlockType === "variable")
    return "equation-to-variable"
  if (sourceBlockType === "equation" && targetBlockType === "shape")
    return "equation-to-shape"
  if (sourceBlockType === "equation" && targetBlockType === "logic")
    return "equation-to-logic"
  if (sourceBlockType === "equation" && targetBlockType === "comparator")
    return "equation-to-comparator"
  if (sourceBlockType === "control" && targetBlockType === "shape")
    return "control-to-shape"
  if (sourceBlockType === "control" && targetBlockType === "limit")
    return "control-to-limit"
  if (sourceBlockType === "control" && targetBlockType === "comparator")
    return "control-to-comparator"
  if (sourceBlockType === "limit" && targetBlockType === "chart")
    return "limit-to-chart"
  if (sourceBlockType === "logic" && targetBlockType === "logic")
    return "logic-to-logic"
  if (sourceBlockType === "logic" && targetBlockType === "chart")
    return "logic-to-chart"
  if (sourceBlockType === "logic" && targetBlockType === "shape")
    return "logic-to-shape"
  if (sourceBlockType === "comparator" && targetBlockType === "logic")
    return "comparator-to-logic"
  if (sourceBlockType === "comparator" && targetBlockType === "chart")
    return "comparator-to-chart"
  if (sourceBlockType === "comparator" && targetBlockType === "shape")
    return "comparator-to-shape"
  if (sourceBlockType === "comparator" && targetBlockType === "comparator")
    return "comparator-to-comparator"
  if (sourceBlockType === "constraint" && targetBlockType === "equation")
    return "constraint-to-equation"
  if (sourceBlockType === "constraint" && targetBlockType === "chart")
    return "constraint-to-chart"
  return null
}

export function isValidConnection(
  sourceBlock: Block,
  targetBlock: Block
): boolean {
  const connectionType = getConnectionType(sourceBlock.type, targetBlock.type)
  return connectionType !== null
}
