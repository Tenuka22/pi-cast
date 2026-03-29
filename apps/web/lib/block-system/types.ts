/**
 * Block System Types and Utilities
 *
 * Core types, grid utilities, and equation tokenizer for the pi-cast block system.
 * Based on 32x32 pixel grid units.
 * 
 * NODE TREE ARCHITECTURE:
 * - Each node can have prev (input) and next (output) pointers
 * - Data flows from source nodes through the chain
 * - Chart nodes can traverse back through the chain to get all inputs
 * - Supports branching (multiple next nodes from one node)
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
  | "table"
  | "piecewise-limiter"
  | "piecewise-builder"

// ============================================================================
// NODE TREE TYPES (New Chain-Based Architecture)
// ============================================================================

/**
 * Data that flows between nodes in the chain
 */
export interface NodeData {
  // Equation data
  equation?: string
  variables?: Variable[]
  tokens?: EquationToken[]
  equationType?: EquationType
  evaluatedValue?: number
  result?: number | boolean

  // For limit approach values
  limitValues?: LimitApproachValue[]

  // For shape fill
  fillValue?: number
  fillPercentage?: number
  isFilled?: boolean

  // For logic/comparator results
  booleanResult?: boolean

  // For piecewise functions
  piecewisePieces?: PiecewisePiece[]
  fallbackEquation?: string

  // Metadata
  timestamp?: number
}

/**
 * A single piece of a piecewise function
 */
export interface PiecewisePiece {
  equation: string
  constraint: VariableConstraint
  variableName: string
  displayLabel?: string
  variables?: Record<string, number>
}

/**
 * Limit approach value for showing near values
 */
export interface LimitApproachValue {
  x: number
  y: number
  label: string
}

/**
 * Node in the chain/tree structure
 * Each node can have:
 * - prev: the node that feeds data INTO this node (input)
 * - next: array of nodes that receive data FROM this node (outputs)
 * 
 * CALCULATION CACHING:
 * - calculatedData: cached result from node-calculation-engine
 * - dataVersion: incremented when node data changes (for cache invalidation)
 */
export interface NodeChain {
  id: string
  nodeId: string // References the block/node id
  type: BlockType

  // Chain pointers
  prev: string | null // ID of the previous NodeChain (input)
  next: string[] // IDs of the next NodeChains (outputs) - can branch

  // Position in canvas
  position: GridPosition
  dimensions: BlockDimensions

  // Calculation caching (for node-based calculation engine)
  calculatedData?: NodeData // Cached calculation result
  dataVersion?: number // Incremented when block data changes

  createdAt: number
  updatedAt: number
}

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

/**
 * Limit Type - determines the direction of approach
 * - left: x approaches from the left (⁻)
 * - right: x approaches from the right (⁺)
 * - both: x approaches from both sides (↔)
 */
export type LimitType = "left" | "right" | "both"

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
  variableName?: string // For multivariable constraints
  constraints?: VariableConstraint[] // For compound constraints (and/or/not)
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
  // Node chain reference (for new tree-based architecture)
  nodeChainId?: string
}

export interface EquationBlock extends BaseBlock {
  type: "equation"
  equation: string
  tokens?: EquationToken[]
  variables?: Variable[]
  equationType?: EquationType
  // Enable/disable (optional boolean input)
  enabled?: boolean
  enabledSourceId?: string
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
  sourceLimitIds?: string[]
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
  targetEquationId?: string | null
  variableName: string
  limitValue: number
  approach: LimitApproach
  limitType: LimitType // Fixed type: left, right, or both (cannot be changed)
  isInfinite: boolean // If true, limit approaches ±∞ instead of a finite value
  infiniteDirection: "positive" | "negative" // Which infinity to approach
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
  result?: boolean | number // Computed boolean result or numeric value
}

export interface ConstraintBlock extends BaseBlock {
  type: "constraint"
  targetEquationId?: string | null // Connected equation block ID
  variableName: string // Variable to constrain (e.g., 'x')
  constraint: VariableConstraint // The constraint definition
  result?: boolean // Whether the constraint is satisfied
}

export interface TableRow {
  id: string
  values: Record<string, number | string>
}

export interface TableColumn {
  id: string
  label: string
  type: "variable" | "equation" | "result" | "custom"
  equation?: string // For computed columns
  variableName?: string // For variable columns
}

export interface TableBlock extends BaseBlock {
  type: "table"
  sourceEquationId?: string | null // Connected equation block for y = f(x) calculations
  sourceLimitId?: string | null // Connected limit block for limit approach values
  sourceConstraintIds?: string[] // Connected constraint blocks for filtering values
  columns: TableColumn[]
  rows: TableRow[]
  autoGenerateRows?: boolean // Auto-generate rows based on limit approach
  variableName?: string // Primary variable for row generation (e.g., 'x')
  showGrid?: boolean
  highlightLastRow?: boolean
}

export interface VariableBlock extends BaseBlock {
  type: "variable"
  sourceEquationId?: string // Connected equation block
  variables: ControlVariable[] // Variables with sliders
  layout: "horizontal" | "vertical"
}

export interface PiecewiseLimiterBlock extends BaseBlock {
  type: "piecewise-limiter"
  sourceEquationId?: string | null // Connected equation block
  variableName: string // Variable to constrain (e.g., 'x')
  constraint: VariableConstraint // The domain constraint (gte/gt/lte/lt/range)
  enabled: boolean // Enable/disable this piece
  displayLabel?: string // Optional label for this piece (e.g., "x < 0")
}

export interface PiecewiseBuilderBlock extends BaseBlock {
  type: "piecewise-builder"
  connectedLimiterIds: string[] // Array of connected piecewise limiter IDs
  fallbackEquation?: string // Optional default equation when no piece matches (e.g., "0")
  fallbackEnabled: boolean // Enable/disable fallback
  combinedEquation?: string // Auto-generated piecewise notation (for display)
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
  | TableBlock
  | PiecewiseLimiterBlock
  | PiecewiseBuilderBlock

// ============================================================================
// TYPE GUARDS
// ============================================================================

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

export function isTableBlock(block: Block): block is TableBlock {
  return block.type === 'table';
}

export function isPiecewiseLimiterBlock(block: Block): block is PiecewiseLimiterBlock {
  return block.type === 'piecewise-limiter';
}

export function isPiecewiseBuilderBlock(block: Block): block is PiecewiseBuilderBlock {
  return block.type === 'piecewise-builder';
}

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
    | "equation-to-constraint"
    | "equation-to-shape"
    | "equation-to-logic"
    | "equation-to-comparator"
    | "equation-to-table"
    | "variable-to-chart"
    | "variable-to-equation"
    | "logic-to-equation"
    | "logic-to-chart"
    | "logic-to-shape"
    | "logic-to-logic"
    | "comparator-to-equation"
    | "comparator-to-logic"
    | "comparator-to-chart"
    | "comparator-to-shape"
    | "comparator-to-comparator"
    | "comparator-to-table"
    | "limit-to-chart"
    | "limit-to-table"
    | "limit-to-logic"
    | "control-to-shape"
    | "control-to-limit"
    | "control-to-comparator"
    | "control-to-equation"
    | "constraint-to-equation"
    | "constraint-to-chart"
    | "constraint-to-constraint"
    | "constraint-to-logic"
    | "constraint-to-comparator"
    | "constraint-to-table"
    | "equation-to-piecewise-limiter"
    | "piecewise-limiter-to-builder"
    | "piecewise-builder-to-chart"
    | "piecewise-builder-to-table"
    | "piecewise-builder-to-logic"
    | "piecewise-builder-to-shape"
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
      return { width: 10, height: 2 }
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
      return { width: 8, height: 1 }
    case "table":
      return { width: 20, height: 12 }
    case "piecewise-limiter":
      return { width: 11, height: 5 }
    case "piecewise-builder":
      return { width: 10, height: 6 }
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
// EQUATION FORMATTER
// ============================================================================

function isOpeningParen(token: EquationToken): boolean {
  return token.type === "parenthesis" && (token.value === "(" || token.value === "[")
}

function isClosingParen(token: EquationToken): boolean {
  return token.type === "parenthesis" && (token.value === ")" || token.value === "]")
}

function isOperandEnd(token: EquationToken): boolean {
  return (
    token.type === "number" ||
    token.type === "variable" ||
    token.type === "function" ||
    isClosingParen(token)
  )
}

function isOperandStart(token: EquationToken): boolean {
  return (
    token.type === "number" ||
    token.type === "variable" ||
    token.type === "function" ||
    isOpeningParen(token)
  )
}

function shouldInsertImplicitMultiply(prev: EquationToken, next: EquationToken): boolean {
  // Avoid turning function calls into multiplication (e.g. sin(x))
  if (prev.type === "function" && isOpeningParen(next)) return false
  // Avoid turning "sinx" into "sin * x" (users likely meant sin(x))
  if (prev.type === "function" && next.type === "variable") return false
  return isOperandEnd(prev) && isOperandStart(next)
}

/**
 * formatEquation
 * - Removes unnecessary whitespace
 * - Adds explicit multiplication for implicit terms (e.g. "mx" -> "m * x")
 * - Normalizes spacing around operators
 */
export function formatEquation(equation: string): string {
  const rawTokens = tokenizeEquation(equation).filter((t) => t.type !== "whitespace")
  if (rawTokens.length === 0) return ""

  // Split short implicit variable products like "mx" into "m" "x"
  // (Tokenizer treats "mx" as a single variable token, but users often mean m*x.)
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
  const expandedTokens: EquationToken[] = []
  for (const token of rawTokens) {
    if (
      token.type === "variable" &&
      /^[a-z]{2}$/.test(token.value) &&
      !functionNames.has(token.value.toLowerCase())
    ) {
      expandedTokens.push(
        {
          ...token,
          value: token.value[0] ?? token.value,
          endIndex: token.startIndex + 1,
        },
        {
          ...token,
          value: token.value[1] ?? token.value,
          startIndex: token.startIndex + 1,
        }
      )
      continue
    }
    expandedTokens.push(token)
  }

  const tokens: EquationToken[] = []
  for (const current of expandedTokens) {
    const prev = tokens.length > 0 ? tokens[tokens.length - 1] : undefined
    if (prev && shouldInsertImplicitMultiply(prev, current)) {
      tokens.push({
        value: "*",
        type: "operator",
        startIndex: current.startIndex,
        endIndex: current.startIndex,
      })
    }
    tokens.push(current)
  }

  let out = ""
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token) continue
    const prev = i > 0 ? tokens[i - 1] : undefined
    const next = i < tokens.length - 1 ? tokens[i + 1] : undefined

    if (token.type === "operator" || token.type === "equals") {
      const op = token.value
      if (op === "^") {
        // No spaces around exponent operator
        out = out.replace(/\s+$/g, "")
        out += "^"
        continue
      }

      // Unary minus: at start or after another operator/equals/opening paren
      const isUnaryMinus =
        op === "-" &&
        (!prev ||
          prev.type === "operator" ||
          prev.type === "equals" ||
          isOpeningParen(prev))
      if (isUnaryMinus) {
        out = out.replace(/\s+$/g, "")
        out += "-"
        continue
      }

      out = out.replace(/\s+$/g, "")
      out += ` ${op} `
      continue
    }

    if (isOpeningParen(token)) {
      out = out.replace(/\s+$/g, "")
      out += token.value
      continue
    }

    if (isClosingParen(token)) {
      out = out.replace(/\s+$/g, "")
      out += token.value
      continue
    }

    // For function names, add a space if it's not a call (handled above) and not at start
    if (token.type === "function") {
      const isCall = next ? isOpeningParen(next) : false
      if (!isCall && out.length > 0 && !out.endsWith(" ")) out += " "
      out += token.value
      continue
    }

    // Default: just append value, ensuring single space separation when needed
    if (out.length > 0 && !out.endsWith(" ")) {
      // Add a space between two plain identifiers/numbers only if we didn't insert '*' (rare case)
      if (prev && (prev.type === "variable" || prev.type === "number") && (token.type === "variable" || token.type === "number")) {
        out += " "
      }
    }
    out += token.value
  }

  return out.replace(/\s+/g, " ").trim()
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
  if (sourceBlockType === "variable" && targetBlockType === "chart")
    return "variable-to-chart"
  if (sourceBlockType === "logic" && targetBlockType === "equation")
    return "logic-to-equation"
  if (sourceBlockType === "comparator" && targetBlockType === "equation")
    return "comparator-to-equation"
  if (sourceBlockType === "equation" && targetBlockType === "control")
    return "equation-to-control"
  if (sourceBlockType === "equation" && targetBlockType === "equation")
    return "equation-to-equation"
  if (sourceBlockType === "equation" && targetBlockType === "limit")
    return "equation-to-limit"
  if (sourceBlockType === "equation" && targetBlockType === "variable")
    return "equation-to-variable"
  if (sourceBlockType === "equation" && targetBlockType === "constraint")
    return "equation-to-constraint"
  if (sourceBlockType === "equation" && targetBlockType === "shape")
    return "equation-to-shape"
  if (sourceBlockType === "equation" && targetBlockType === "logic")
    return "equation-to-logic"
  if (sourceBlockType === "equation" && targetBlockType === "comparator")
    return "equation-to-comparator"
  if (sourceBlockType === "equation" && targetBlockType === "table")
    return "equation-to-table"
  if (sourceBlockType === "control" && targetBlockType === "shape")
    return "control-to-shape"
  if (sourceBlockType === "control" && targetBlockType === "limit")
    return "control-to-limit"
  if (sourceBlockType === "control" && targetBlockType === "comparator")
    return "control-to-comparator"
  if (sourceBlockType === "limit" && targetBlockType === "chart")
    return "limit-to-chart"
  if (sourceBlockType === "limit" && targetBlockType === "table")
    return "limit-to-table"
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
  if (sourceBlockType === "constraint" && targetBlockType === "constraint")
    return "constraint-to-constraint"
  if (sourceBlockType === "constraint" && targetBlockType === "logic")
    return "constraint-to-logic"
  if (sourceBlockType === "constraint" && targetBlockType === "comparator")
    return "constraint-to-comparator"
  if (sourceBlockType === "constraint" && targetBlockType === "table")
    return "constraint-to-table"
  if (sourceBlockType === "equation" && targetBlockType === "piecewise-limiter")
    return "equation-to-piecewise-limiter"
  if (sourceBlockType === "piecewise-limiter" && targetBlockType === "piecewise-builder")
    return "piecewise-limiter-to-builder"
  if (sourceBlockType === "piecewise-builder" && targetBlockType === "chart")
    return "piecewise-builder-to-chart"
  if (sourceBlockType === "piecewise-builder" && targetBlockType === "table")
    return "piecewise-builder-to-table"
  
  // Missing practical connections
  if (sourceBlockType === "variable" && targetBlockType === "equation")
    return "variable-to-equation"
  if (sourceBlockType === "control" && targetBlockType === "equation")
    return "control-to-equation"
  if (sourceBlockType === "logic" && targetBlockType === "chart")
    return "logic-to-chart"
  if (sourceBlockType === "logic" && targetBlockType === "shape")
    return "logic-to-shape"
  if (sourceBlockType === "comparator" && targetBlockType === "table")
    return "comparator-to-table"
  if (sourceBlockType === "constraint" && targetBlockType === "logic")
    return "constraint-to-logic"
  if (sourceBlockType === "constraint" && targetBlockType === "comparator")
    return "constraint-to-comparator"
  if (sourceBlockType === "limit" && targetBlockType === "logic")
    return "limit-to-logic"
  if (sourceBlockType === "piecewise-builder" && targetBlockType === "logic")
    return "piecewise-builder-to-logic"
  if (sourceBlockType === "piecewise-builder" && targetBlockType === "shape")
    return "piecewise-builder-to-shape"
  return null
}

export function isValidConnection(
  sourceBlock: Block,
  targetBlock: Block
): boolean {
  const connectionType = getConnectionType(sourceBlock.type, targetBlock.type)
  return connectionType !== null
}

// ============================================================================
// NODE CHAIN UTILITIES (New Tree-Based Architecture)
// ============================================================================

/**
 * Create a new node chain
 */
export function createNodeChain(
  nodeId: string,
  type: BlockType,
  position: GridPosition,
  dimensions: BlockDimensions = { width: 4, height: 2 }
): NodeChain {
  const now = Date.now()
  return {
    id: `chain-${now}-${Math.random().toString(36).substr(2, 9)}`,
    nodeId,
    type,
    prev: null,
    next: [],
    position,
    dimensions,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Connect two node chains (source -> target)
 * source.next.push(target) and target.prev = source
 */
export function connectNodeChains(
  sourceChain: NodeChain,
  targetChain: NodeChain,
  allChains: Map<string, NodeChain>
): void {
  // Add target to source's next array (if not already connected)
  if (!sourceChain.next.includes(targetChain.id)) {
    sourceChain.next.push(targetChain.id)
    sourceChain.updatedAt = Date.now()
  }

  // Set target's prev to source (if not already set)
  if (targetChain.prev !== sourceChain.id) {
    targetChain.prev = sourceChain.id
    targetChain.updatedAt = Date.now()
  }

  // Update the chains in the map
  allChains.set(sourceChain.id, sourceChain)
  allChains.set(targetChain.id, targetChain)
}

/**
 * Disconnect two node chains
 */
export function disconnectNodeChains(
  sourceChain: NodeChain,
  targetChain: NodeChain,
  allChains: Map<string, NodeChain>
): void {
  // Remove target from source's next array
  sourceChain.next = sourceChain.next.filter((id) => id !== targetChain.id)
  sourceChain.updatedAt = Date.now()

  // Clear target's prev if it points to source
  if (targetChain.prev === sourceChain.id) {
    targetChain.prev = null
    targetChain.updatedAt = Date.now()
  }

  allChains.set(sourceChain.id, sourceChain)
  allChains.set(targetChain.id, targetChain)
}

/**
 * Traverse a node chain backwards (from any node to all source nodes)
 * Returns an array of node chain IDs in order from source to current
 */
export function traverseChainBackwards(
  chainId: string,
  allChains: Map<string, NodeChain>,
  visited: Set<string> = new Set()
): string[] {
  if (visited.has(chainId)) return []
  visited.add(chainId)

  const chain = allChains.get(chainId)
  if (!chain) return []

  const result: string[] = [chainId]

  // Recursively traverse backwards
  if (chain.prev) {
    const prevChain = traverseChainBackwards(chain.prev, allChains, visited)
    result.unshift(...prevChain)
  }

  return result
}

/**
 * Traverse a node chain forwards (from any node to all end nodes)
 * Returns an array of node chain IDs in order from current to ends
 */
export function traverseChainForwards(
  chainId: string,
  allChains: Map<string, NodeChain>,
  visited: Set<string> = new Set()
): string[] {
  if (visited.has(chainId)) return []
  visited.add(chainId)

  const chain = allChains.get(chainId)
  if (!chain) return []

  const result: string[] = [chainId]

  // Recursively traverse forwards through all next nodes
  for (const nextId of chain.next) {
    const nextChains = traverseChainForwards(nextId, allChains, visited)
    result.push(...nextChains)
  }

  return result
}

/**
 * Get all blocks in a chain by traversing backwards from a chart or end node
 * Returns blocks in order from source to target
 */
export function getBlocksInChain(
  endChainId: string,
  allChains: Map<string, NodeChain>,
  blocks: Block[]
): Block[] {
  const chainIds = traverseChainBackwards(endChainId, allChains)
  const result: Block[] = []

  for (const chainId of chainIds) {
    const chain = allChains.get(chainId)
    if (chain) {
      const block = blocks.find((b) => b.id === chain.nodeId)
      if (block && !result.find((b) => b.id === block.id)) {
        result.push(block)
      }
    }
  }

  return result
}

/**
 * Find the source nodes (nodes with no prev) in a chain
 */
export function findSourceNodes(
  chainId: string,
  allChains: Map<string, NodeChain>
): string[] {
  const chain = allChains.get(chainId)
  if (!chain) return []

  if (!chain.prev) {
    return [chainId]
  }

  return findSourceNodes(chain.prev, allChains)
}

/**
 * Evaluate data flow through a node chain
 * Collects data from all nodes in the chain from source to target
 */
export function evaluateNodeChain(
  chainId: string,
  allChains: Map<string, NodeChain>,
  blocks: Block[]
): NodeData {
  const chain = allChains.get(chainId)
  if (!chain) return {}

  const block = blocks.find((b) => b.id === chain.nodeId)
  if (!block) return {}

  // Start with empty data
  const result: NodeData = {
    timestamp: Date.now(),
  }

  // Collect data from this node
  switch (block.type) {
    case "equation": {
      if (!isEquationBlock(block)) break
      result.equation = block.equation
      result.variables = block.variables
      result.tokens = block.tokens
      result.equationType = block.equationType
      break
    }
    case "control": {
      if (!isControlBlock(block)) break
      result.variables = block.variables.map((v) => ({
        name: v.name,
        value: v.value,
        defaultValue: v.value,
        min: v.min,
        max: v.max,
        step: v.step,
      }))
      break
    }
    case "limit": {
      if (!isLimitBlock(block)) break
      // Limit data is evaluated based on the previous node's equation
      result.limitValues = []
      break
    }
    case "shape": {
      if (!isShapeBlock(block)) break
      result.fillValue = block.fillValue
      result.fillPercentage =
        block.fillMode === "percentage"
          ? block.fillValue
          : block.fillMode === "fraction"
            ? block.fillValue * 100
            : block.fillMode === "decimal"
              ? block.fillValue * 100
              : 0
      result.isFilled = result.fillPercentage === 100
      break
    }
    case "logic": {
      if (!isLogicBlock(block)) break
      if (typeof block.result === 'boolean') {
        result.booleanResult = block.result
      }
      break
    }
    case "comparator": {
      if (!isComparatorBlock(block)) break
      if (typeof block.result === 'boolean') {
        result.booleanResult = block.result
      }
      break
    }
  }

  // Recursively collect data from previous nodes
  if (chain.prev) {
    const prevData = evaluateNodeChain(chain.prev, allChains, blocks)
    // Merge previous data (current node data takes precedence)
    Object.assign(result, prevData, result)
  }

  return result
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
  approach: LimitApproach,
  steps: number = 5
): LimitApproachValue[] {
  const values: LimitApproachValue[] = []
  const stepSize = 0.1 // Distance between each approach value

  // Create a variable map for evaluation
  const varMap: Record<string, number> = {}
  variables.forEach((v) => {
    varMap[v.name] = v.value
  })

  // Generate approach values
  const generateSide = (direction: "left" | "right") => {
    for (let i = steps; i >= 1; i--) {
      const x =
        direction === "left"
          ? limitValue - i * stepSize
          : limitValue + i * stepSize

      // Evaluate the equation at this x value
      // (simplified - in production you'd use the full evaluation engine)
      varMap[variableName] = x
      const y = evaluateEquationAtX(equation, varMap)

      values.push({
        x,
        y,
        label: `${variableName} → ${x.toFixed(2)}`,
      })
    }
  }

  if (approach === "left" || approach === "both") {
    generateSide("left")
  }

  if (approach === "right" || approach === "both") {
    generateSide("right")
  }

  return values
}

/**
 * Simplified equation evaluation at a specific x value
 * Uses safe math evaluation without Function constructor
 */
function evaluateEquationAtX(
  equation: string,
  variables: Record<string, number>
): number {
  try {
    // Extract RHS of equation
    let expr = equation.replace(/\s/g, "")
    const equalsIndex = expr.indexOf("=")
    if (equalsIndex !== -1) {
      expr = expr.substring(equalsIndex + 1)
    }

    // Replace variables with values
    for (const [name, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\b${name}\\b`, "g")
      expr = expr.replace(regex, value.toString())
    }

    // Safe math expression evaluation
    return evaluateMathExpression(expr)
  } catch {
    return NaN
  }
}

/**
 * Safely evaluate a basic math expression using tokenizer and RPN
 * Supports: +, -, *, /, ^, parentheses, numbers, Math functions
 */
function evaluateMathExpression(expr: string): number {
  // Replace ^ with ** for exponentiation
  expr = expr.replace(/\^/g, "**")
  
  // Replace Math functions
  expr = expr.replace(/\bsin\b/g, "Math.sin")
  expr = expr.replace(/\bcos\b/g, "Math.cos")
  expr = expr.replace(/\btan\b/g, "Math.tan")
  expr = expr.replace(/\bsqrt\b/g, "Math.sqrt")
  expr = expr.replace(/\babs\b/g, "Math.abs")
  expr = expr.replace(/\blog\b/g, "Math.log10")
  expr = expr.replace(/\bln\b/g, "Math.log")
  expr = expr.replace(/\bexp\b/g, "Math.exp")
  expr = expr.replace(/\bPI\b/g, Math.PI.toString())
  expr = expr.replace(/\bE\b/g, Math.E.toString())
  
  // Tokenize and evaluate using a safe shunting-yard algorithm
  const tokens = tokenizeMath(expr)
  const rpn = toRPN(tokens)
  return evaluateRPN(rpn)
}

type MathToken = 
  | { type: 'number'; value: number }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' | '**' | 'u-' }
  | { type: 'function'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' }

function tokenizeMath(expr: string): MathToken[] {
  const tokens: MathToken[] = []
  let i = 0
  
  while (i < expr.length) {
    const ch = expr[i]
    
    if (!ch) {
      i++
      continue
    }
    
    // Skip whitespace
    if (ch === ' ') {
      i++
      continue
    }
    
    // Numbers
    if (/[0-9.]/.test(ch)) {
      let numStr = ''
      while (i < expr.length && /[0-9.]/.test(expr[i] ?? '')) {
        numStr += expr[i]
        i++
      }
      const num = Number(numStr)
      if (!Number.isNaN(num)) {
        tokens.push({ type: 'number', value: num })
      }
      continue
    }
    
    // Operators
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      if (ch === '*' && expr[i + 1] === '*') {
        tokens.push({ type: 'operator', value: '**' })
        i += 2
      } else {
        const opValue = ch === '+' || ch === '-' || ch === '*' || ch === '/' ? ch : '+'
        tokens.push({ type: 'operator', value: opValue })
        i++
      }
      continue
    }
    
    // Parentheses
    if (ch === '(') {
      tokens.push({ type: 'lparen' })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen' })
      i++
      continue
    }
    
    // Function names (already replaced with Math.xxx)
    if (/[a-zA-Z_]/.test(ch)) {
      let name = ''
      while (i < expr.length && /[a-zA-Z0-9_.]/.test(expr[i] ?? '')) {
        name += expr[i]
        i++
      }
      if (name.startsWith('Math.')) {
        const fnName = name.slice(5)
        if (['sin', 'cos', 'tan', 'sqrt', 'abs', 'log10', 'log', 'exp'].includes(fnName)) {
          tokens.push({ type: 'function', value: fnName })
        }
      }
      continue
    }
    
    i++
  }
  
  return tokens
}

function toRPN(tokens: MathToken[]): MathToken[] {
  const output: MathToken[] = []
  const stack: MathToken[] = []
  
  const precedence: Record<string, number> = {
    '+': 1, '-': 1,
    '*': 2, '/': 2,
    'u-': 3,
    '**': 4,
  }
  
  let prevToken: MathToken | null = null

  for (const token of tokens) {
    if (token.type === 'number') {
      output.push(token)
    } else if (token.type === 'function') {
      stack.push(token)
    } else if (token.type === 'operator') {
      // Handle unary minus
      let op = token.value
      const prevTokenType = prevToken?.type as MathToken['type'] | undefined
      const isPrevTokenOperatorOrLparen = prevTokenType === 'operator' || prevTokenType === 'lparen' || prevTokenType === 'function'
      if (op === '-' && (!prevToken || isPrevTokenOperatorOrLparen)) {
        op = 'u-'
        token.value = op
      }

      while (stack.length > 0) {
        const top = stack[stack.length - 1]
        if (!top || top.type === 'lparen') break

        const topPrec = top.type === 'operator' ? precedence[top.value] ?? 0 : 0
        const opPrec = precedence[op] ?? 0

        if (topPrec >= opPrec) {
          const popped = stack.pop()
          if (popped) output.push(popped)
        } else {
          break
        }
      }
      stack.push(token)
    } else if (token.type === 'lparen') {
      stack.push(token)
    } else if (token.type === 'rparen') {
      while (stack.length > 0 && stack[stack.length - 1]?.type !== 'lparen') {
        const popped = stack.pop()
        if (popped) output.push(popped)
      }
      stack.pop() // Remove lparen
      const topFunc = stack[stack.length - 1]
      if (topFunc?.type === 'function') {
        const popped = stack.pop()
        if (popped) output.push(popped)
      }
    }

    if (token.type !== 'lparen' && token.type !== 'rparen') {
      prevToken = token
    }
  }

  while (stack.length > 0) {
    const popped = stack.pop()
    if (popped) output.push(popped)
  }

  return output
}

function evaluateRPN(tokens: MathToken[]): number {
  const stack: number[] = []
  
  const functions: Record<string, (x: number) => number> = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    sqrt: Math.sqrt,
    abs: Math.abs,
    log10: Math.log10,
    log: Math.log,
    exp: Math.exp,
  }
  
  for (const token of tokens) {
    if (token.type === 'number') {
      stack.push(token.value)
    } else if (token.type === 'function') {
      const arg = stack.pop()
      if (arg === undefined) throw new Error('Invalid expression')
      const fn = functions[token.value]
      if (!fn) throw new Error(`Unknown function: ${token.value}`)
      stack.push(fn(arg))
    } else if (token.type === 'operator') {
      if (token.value === 'u-') {
        const arg = stack.pop()
        if (arg === undefined) throw new Error('Invalid expression')
        stack.push(-arg)
      } else {
        const b = stack.pop()
        const a = stack.pop()
        if (a === undefined || b === undefined) throw new Error('Invalid expression')
        
        switch (token.value) {
          case '+': stack.push(a + b); break
          case '-': stack.push(a - b); break
          case '*': stack.push(a * b); break
          case '/': stack.push(a / b); break
          case '**': stack.push(a ** b); break
        }
      }
    }
  }
  
  const result = stack[0]
  if (result === undefined || !Number.isFinite(result)) {
    throw new Error('Invalid result')
  }
  return result
}

// ============================================================================
// EXPORTS FOR CALCULATION ENGINE
// ============================================================================

export {
  CalculationState,
  calculateOutputNode,
  calculateNode,
  traverseChain,
  getInputChains,
  topologicalSort,
  hasCycle,
  invalidateBlockCalculations,
} from './node-calculation-engine'
