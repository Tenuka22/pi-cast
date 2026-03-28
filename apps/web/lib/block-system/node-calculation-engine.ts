/**
 * Node Calculation Engine
 *
 * High-performance calculation engine for node-based data flow.
 * Features:
 * - Topological sort for correct calculation order
 * - Dirty tracking to minimize recalculations
 * - Memoization for cached results
 * - Cycle detection to prevent infinite loops
 *
 * Performance Goals:
 * - O(n) chain traversal where n = chain length
 * - Sub-millisecond recalculation for simple chains
 * - Only recalculate affected branches on changes
 */

import type {
  NodeChain,
  NodeData,
  Block,
  EquationBlock,
  VariableBlock,
  ConstraintBlock,
  LimitBlock,
  PiecewiseLimiterBlock,
  PiecewiseBuilderBlock,
  LimitApproachValue,
  Variable,
  PiecewisePiece,
  VariableConstraint,
} from "@/lib/block-system/types"
import { parseEquation } from "@/lib/block-system/types"
import { evaluateFunction } from "@/lib/visualization/graph-renderer"

// ============================================================================
// CALCULATION CACHE
// ============================================================================

/**
 * Cached calculation result for a node
 * Includes version tracking for invalidation
 */
interface CalculationCache {
  data: NodeData
  version: number // Incremented when cache is invalidated
  lastCalculated: number
  dependsOnVersions: Map<string, number> // Track dependencies for dirty checking
}

/**
 * Global calculation state for a canvas session
 * Manages caches and dirty tracking for all nodes
 */
export class CalculationState {
  private caches = new Map<string, CalculationCache>()
  private globalVersion = 0

  /**
   * Get current global version (for dependency tracking)
   */
  get version(): number {
    return this.globalVersion
  }

  /**
   * Get cached data for a node (or undefined if not cached)
   */
  get(chainId: string): NodeData | undefined {
    return this.caches.get(chainId)?.data
  }

  /**
   * Set cached data for a node
   */
  set(chainId: string, data: NodeData, dependencies: Map<string, number>) {
    this.caches.set(chainId, {
      data,
      version: ++this.globalVersion,
      lastCalculated: Date.now(),
      dependsOnVersions: dependencies,
    })
  }

  /**
   * Invalidate cache for a node and all downstream nodes
   */
  invalidate(chainId: string, allChains: Map<string, NodeChain>) {
    const toInvalidate = new Set<string>([chainId])

    // Find all downstream nodes (BFS traversal)
    const queue = [chainId]
    while (queue.length > 0) {
      const currentId = queue.shift()!
      const chain = allChains.get(currentId)
      if (!chain) continue

      for (const nextId of chain.next) {
        if (!toInvalidate.has(nextId)) {
          toInvalidate.add(nextId)
          queue.push(nextId)
        }
      }
    }

    // Increment version for all affected nodes
    for (const id of toInvalidate) {
      const cache = this.caches.get(id)
      if (cache) {
        cache.version = ++this.globalVersion
      }
    }
  }

  /**
   * Check if a node's cache is stale based on its dependencies
   */
  isStale(chainId: string): boolean {
    const cache = this.caches.get(chainId)
    if (!cache) return true

    for (const [depId, depVersion] of cache.dependsOnVersions) {
      const depCache = this.caches.get(depId)
      if (!depCache || depCache.version !== depVersion) {
        return true
      }
    }

    return false
  }

  /**
   * Clear all caches
   */
  clear() {
    this.caches.clear()
    this.globalVersion = 0
  }
}

// ============================================================================
// TOPOLOGICAL SORT
// ============================================================================

/**
 * Sort nodes in calculation order (dependencies first)
 * Uses Kahn's algorithm for topological sorting
 *
 * Returns null if cycle detected
 */
export function topologicalSort(
  chainIds: string[],
  allChains: Map<string, NodeChain>
): string[] | null {
  const inDegree = new Map<string, number>()
  const result: string[] = []

  // Initialize in-degrees
  for (const id of chainIds) {
    inDegree.set(id, 0)
  }

  // Calculate in-degrees (count incoming edges)
  for (const id of chainIds) {
    const chain = allChains.get(id)
    if (chain?.prev && inDegree.has(chain.prev)) {
      inDegree.set(id, (inDegree.get(id) ?? 0) + 1)
    }
  }

  // Start with nodes that have no dependencies (in-degree = 0)
  const queue: string[] = []
  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      queue.push(id)
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!
    result.push(current)

    const chain = allChains.get(current)
    if (!chain) continue

    // Reduce in-degree for all next nodes
    for (const nextId of chain.next) {
      if (inDegree.has(nextId)) {
        const newDegree = (inDegree.get(nextId) ?? 0) - 1
        inDegree.set(nextId, newDegree)
        if (newDegree === 0) {
          queue.push(nextId)
        }
      }
    }
  }

  // If we couldn't process all nodes, there's a cycle
  if (result.length !== chainIds.length) {
    return null
  }

  return result
}

/**
 * Detect if there's a cycle in the node graph
 * Uses DFS with coloring (white/gray/black)
 */
export function hasCycle(
  startChainId: string,
  allChains: Map<string, NodeChain>
): boolean {
  const WHITE = 0, GRAY = 1, BLACK = 2
  const color = new Map<string, number>()

  function dfs(chainId: string): boolean {
    color.set(chainId, GRAY)

    const chain = allChains.get(chainId)
    if (chain) {
      for (const nextId of chain.next) {
        const nextColor = color.get(nextId) ?? WHITE
        if (nextColor === GRAY) {
          return true // Back edge found = cycle
        }
        if (nextColor === WHITE && dfs(nextId)) {
          return true
        }
      }
    }

    color.set(chainId, BLACK)
    return false
  }

  return dfs(startChainId)
}

// ============================================================================
// NODE CALCULATION
// ============================================================================

/**
 * Calculate data for a single node based on its type and inputs
 */
export function calculateNode(
  chain: NodeChain,
  block: Block,
  prevData: NodeData | null,
  allBlocks: Map<string, Block>,
  allChains: Map<string, NodeChain>
): NodeData {
  const timestamp = Date.now()

  switch (block.type) {
    case "equation": {
      return calculateEquationNode(block as EquationBlock, prevData, allBlocks, timestamp)
    }

    case "variable": {
      return calculateVariableNode(block as VariableBlock, prevData, timestamp)
    }

    case "constraint": {
      return calculateConstraintNode(block as ConstraintBlock, prevData, allBlocks, timestamp)
    }

    case "limit": {
      return calculateLimitNode(block as LimitBlock, prevData, allBlocks, timestamp)
    }

    case "piecewise-limiter": {
      return calculatePiecewiseLimiterNode(block as PiecewiseLimiterBlock, prevData, allBlocks, timestamp)
    }

    case "piecewise-builder": {
      return calculatePiecewiseBuilderNode(block as PiecewiseBuilderBlock, prevData, allBlocks, timestamp)
    }

    case "chart":
    case "table":
    case "shape": {
      // Output nodes pass through the accumulated data
      return {
        ...prevData,
        timestamp,
      }
    }

    case "logic":
    case "comparator": {
      // Logic results are calculated in grid-canvas useEffect
      // Just pass through with result metadata
      return {
        ...prevData,
        result: (block as any).result,
        timestamp,
      }
    }

    case "description":
    default: {
      // Pass through unchanged
      return prevData ?? { timestamp }
    }
  }
}

/**
 * Calculate equation node data
 */
function calculateEquationNode(
  block: EquationBlock,
  prevData: NodeData | null,
  allBlocks: Map<string, Block>,
  timestamp: number
): NodeData {
  const parsed = parseEquation(block.equation)
  const variables = block.variables ?? parsed.variables

  // Merge variables from previous nodes (e.g., variable sliders)
  const mergedVariables = mergeVariables(variables, prevData?.variables, allBlocks)

  return {
    equation: block.equation,
    variables: mergedVariables,
    tokens: parsed.tokens,
    equationType: parsed.equationType,
    timestamp,
  }
}

/**
 * Calculate variable node data (variable sliders)
 */
function calculateVariableNode(
  block: VariableBlock,
  prevData: NodeData | null,
  timestamp: number
): NodeData {
  // Variable blocks provide variable values to downstream nodes
  return {
    variables: block.variables.map(v => ({
      name: v.name,
      value: v.value,
      defaultValue: v.value,
      min: v.min,
      max: v.max,
      step: v.step,
    })),
    timestamp,
  }
}

/**
 * Calculate constraint node data
 */
function calculateConstraintNode(
  block: ConstraintBlock,
  prevData: NodeData | null,
  allBlocks: Map<string, Block>,
  timestamp: number
): NodeData {
  // Get the target equation if connected
  let targetEquation: EquationBlock | undefined
  if (block.targetEquationId) {
    const targetBlock = allBlocks.get(block.targetEquationId)
    if (targetBlock && targetBlock.type === "equation") {
      targetEquation = targetBlock as EquationBlock
    }
  }

  return {
    ...prevData,
    // Store constraint info for downstream filtering
    result: block.result,
    timestamp,
  }
}

/**
 * Calculate limit node data (generates approach values)
 */
function calculateLimitNode(
  block: LimitBlock,
  prevData: NodeData | null,
  allBlocks: Map<string, Block>,
  timestamp: number
): NodeData {
  const approachValues: LimitApproachValue[] = []
  const { variableName, limitValue, approach, limitType } = block

  // Get the target equation to evaluate
  let targetEquation: EquationBlock | undefined
  if (block.targetEquationId) {
    const targetBlock = allBlocks.get(block.targetEquationId)
    if (targetBlock && targetBlock.type === "equation") {
      targetEquation = targetBlock as EquationBlock
    }
  }

  // If no target equation, try to get from previous node data
  const equation = targetEquation?.equation ?? prevData?.equation
  const variables = targetEquation?.variables ?? prevData?.variables ?? []

  if (equation) {
    // Generate approach values based on limitType (which is fixed)
    // Use approach for backwards compatibility, but prefer limitType
    const effectiveApproach = limitType || approach
    const offsets = [0.1, 0.01, 0.001, 0.0001]

    if (effectiveApproach === "left" || effectiveApproach === "both") {
      for (const offset of offsets) {
        const x = limitValue - offset
        const y = evaluateFunctionWithVariables(equation, variables, variableName, x)
        approachValues.push({
          x,
          y,
          label: `${variableName} → ${limitValue}⁻`,
        })
      }
    }

    if (effectiveApproach === "right" || effectiveApproach === "both") {
      for (const offset of offsets) {
        const x = limitValue + offset
        const y = evaluateFunctionWithVariables(equation, variables, variableName, x)
        approachValues.push({
          x,
          y,
          label: `${variableName} → ${limitValue}⁺`,
        })
      }
    }
  }

  return {
    ...prevData,
    limitValues: approachValues,
    timestamp,
  }
}

/**
 * Calculate piecewise limiter node data
 * A limiter connects to an equation and defines a domain constraint for that piece
 */
function calculatePiecewiseLimiterNode(
  block: PiecewiseLimiterBlock,
  prevData: NodeData | null,
  allBlocks: Map<string, Block>,
  timestamp: number
): NodeData {
  // Get the source equation if connected
  let sourceEquation: EquationBlock | undefined
  if (block.sourceEquationId) {
    const targetBlock = allBlocks.get(block.sourceEquationId)
    if (targetBlock && targetBlock.type === "equation") {
      sourceEquation = targetBlock as EquationBlock
    }
  }

  // If no source equation, try to get from previous node data
  const equation = sourceEquation?.equation ?? prevData?.equation
  const variables = sourceEquation?.variables ?? prevData?.variables

  // Convert variables array to record for easier access
  const variablesRecord: Record<string, number> = {}
  if (variables) {
    for (const v of variables) {
      variablesRecord[v.name] = v.value
    }
  }

  // Create the piecewise piece
  const piece: PiecewisePiece = {
    equation: equation || "",
    constraint: block.constraint,
    variableName: block.variableName,
    displayLabel: block.displayLabel,
    variables: variablesRecord,
  }

  return {
    ...prevData,
    // Store piece data for the builder to aggregate
    piecewisePieces: [piece],
    timestamp,
  }
}

/**
 * Calculate piecewise builder node data
 * A builder aggregates multiple limiters into a single piecewise function
 */
function calculatePiecewiseBuilderNode(
  block: PiecewiseBuilderBlock,
  prevData: NodeData | null,
  allBlocks: Map<string, Block>,
  timestamp: number
): NodeData {
  const pieces: PiecewisePiece[] = []

  // Collect pieces from all connected limiters
  for (const limiterId of block.connectedLimiterIds) {
    const limiterBlock = allBlocks.get(limiterId)

    if (limiterBlock && limiterBlock.type === "piecewise-limiter") {
      const limiter = limiterBlock as PiecewiseLimiterBlock

      // Get the equation for this limiter
      let sourceEquation: EquationBlock | undefined
      if (limiter.sourceEquationId) {
        const eqBlock = allBlocks.get(limiter.sourceEquationId)
        if (eqBlock && eqBlock.type === "equation") {
          sourceEquation = eqBlock as EquationBlock
        }
      }

      // Convert equation variables to record
      const variablesRecord: Record<string, number> = {}
      if (sourceEquation?.variables) {
        for (const v of sourceEquation.variables) {
          variablesRecord[v.name] = v.value
        }
      }

      // Only add enabled pieces
      if (limiter.enabled && sourceEquation?.equation) {
        pieces.push({
          equation: sourceEquation.equation,
          constraint: limiter.constraint,
          variableName: limiter.variableName,
          displayLabel: limiter.displayLabel,
          variables: variablesRecord,
        })
      }
    }
  }

  // Generate combined equation notation for display
  const combinedEquation = generatePiecewiseNotation(pieces, block.fallbackEnabled ? block.fallbackEquation : undefined)

  return {
    ...prevData,
    piecewisePieces: pieces,
    fallbackEquation: block.fallbackEnabled ? block.fallbackEquation : undefined,
    equation: combinedEquation,
    timestamp,
  }
}

/**
 * Generate piecewise function notation for display
 * Example: "f(x) = { 2x + 1, if x < 0; x², if x >= 0 }"
 */
function generatePiecewiseNotation(pieces: PiecewisePiece[], fallbackEquation?: string): string {
  if (pieces.length === 0 && !fallbackEquation) {
    return ""
  }

  const pieceStrings: string[] = []

  for (const piece of pieces) {
    const constraintStr = constraintToString(piece.constraint, piece.variableName)
    pieceStrings.push(`${piece.equation}, if ${constraintStr}`)
  }

  if (fallbackEquation) {
    pieceStrings.push(`${fallbackEquation}, otherwise`)
  }

  return `f(x) = { ${pieceStrings.join("; ")} }`
}

/**
 * Convert constraint to human-readable string
 */
function constraintToString(constraint: VariableConstraint, variableName: string): string {
  const { type, min, max } = constraint

  switch (type) {
    case "gte":
      return `${variableName} ≥ ${min}`
    case "gt":
      return `${variableName} > ${min}`
    case "lte":
      return `${variableName} ≤ ${min}`
    case "lt":
      return `${variableName} < ${min}`
    case "range":
      return `${min} ≤ ${variableName} ≤ ${max}`
    default:
      return ""
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Merge variables from multiple sources (equation + variable blocks)
 */
function mergeVariables(
  equationVariables: Variable[] | undefined,
  prevVariables: Variable[] | undefined,
  allBlocks: Map<string, Block>
): Variable[] {
  const merged = new Map<string, Variable>()

  // Start with equation variables
  if (equationVariables) {
    for (const v of equationVariables) {
      merged.set(v.name, { ...v })
    }
  }

  // Override with previous node variables (e.g., from variable sliders)
  if (prevVariables) {
    for (const v of prevVariables) {
      const existing = merged.get(v.name)
      if (existing) {
        // Keep constraints from equation, update value from slider
        merged.set(v.name, {
          ...existing,
          value: v.value,
          min: v.min ?? existing.min,
          max: v.max ?? existing.max,
          step: v.step ?? existing.step,
        })
      } else {
        merged.set(v.name, { ...v })
      }
    }
  }

  return Array.from(merged.values())
}

/**
 * Evaluate a function with variable substitution
 */
function evaluateFunctionWithVariables(
  equation: string,
  variables: Variable[],
  independentVar: string,
  value: number
): number {
  const varRecord: Record<string, number> = {}

  // Set all variables except the independent variable
  for (const v of variables) {
    if (v.name !== independentVar && v.name !== "x" && v.name !== "y") {
      varRecord[v.name] = v.value
    }
  }

  // Set the independent variable
  varRecord[independentVar] = value
  varRecord.x = value

  return evaluateFunction(equation, varRecord)
}

// ============================================================================
// CHAIN TRAVERSAL
// ============================================================================

/**
 * Traverse a node chain from output back to inputs, collecting data
 * Returns data in calculation order (inputs first, output last)
 */
export function traverseChain(
  outputChainId: string,
  allChains: Map<string, NodeChain>,
  allBlocks: Map<string, Block>
): { chainIds: string[]; blocks: Block[] } {
  const chainIds: string[] = []
  const blocks: Block[] = []
  const visited = new Set<string>()

  function traverse(chainId: string) {
    if (visited.has(chainId)) return
    visited.add(chainId)

    const chain = allChains.get(chainId)
    if (!chain) return

    // Traverse previous first (inputs before outputs)
    if (chain.prev) {
      traverse(chain.prev)
    }

    chainIds.push(chainId)
    const block = allBlocks.get(chain.nodeId)
    if (block) {
      blocks.push(block)
    }

    // For branching: traverse all next nodes
    for (const nextId of chain.next) {
      traverse(nextId)
    }
  }

  traverse(outputChainId)
  return { chainIds, blocks }
}

/**
 * Get all input chains for an output node
 * Returns chains in topological order
 */
export function getInputChains(
  outputChainId: string,
  allChains: Map<string, NodeChain>
): string[] {
  const inputs: string[] = []
  const visited = new Set<string>()

  function traverse(chainId: string) {
    if (visited.has(chainId)) return
    visited.add(chainId)

    const chain = allChains.get(chainId)
    if (!chain) return

    if (chain.prev) {
      traverse(chain.prev)
    }

    inputs.push(chainId)
  }

  traverse(outputChainId)
  return inputs
}

// ============================================================================
// MAIN CALCULATION ENTRY POINT
// ============================================================================

/**
 * Calculate all data for an output node (chart/table/shape)
 * Traverses the chain, calculates each node in order, returns accumulated data
 *
 * @param outputChainId - The chain ID of the output node
 * @param allChains - All node chains in the canvas
 * @param allBlocks - All blocks in the canvas
 * @param state - Calculation state for caching (optional)
 * @returns Calculated NodeData with all accumulated information
 */
export function calculateOutputNode(
  outputChainId: string,
  allChains: Map<string, NodeChain>,
  allBlocks: Map<string, Block>,
  state?: CalculationState
): NodeData {
  // Check cache first
  if (state && !state.isStale(outputChainId)) {
    const cached = state.get(outputChainId)
    if (cached) return cached
  }

  // Get calculation order
  const inputChains = getInputChains(outputChainId, allChains)
  const sortedChains = topologicalSort(inputChains, allChains)

  if (!sortedChains) {
    // Cycle detected, return empty data
    console.error("Cycle detected in node chain:", outputChainId)
    return { timestamp: Date.now() }
  }

  // Calculate each node in order
  let accumulatedData: NodeData | null = null
  const dependencyVersions = new Map<string, number>()

  for (const chainId of sortedChains) {
    const chain = allChains.get(chainId)
    if (!chain) continue

    const block = allBlocks.get(chain.nodeId)
    if (!block) continue

    // Calculate node data
    const nodeData = calculateNode(chain, block, accumulatedData, allBlocks, allChains)

    // Track dependency versions
    if (state) {
      dependencyVersions.set(chainId, state.version)
    }

    // Accumulate data (merge with previous)
    accumulatedData = accumulatedData
      ? Object.assign({}, accumulatedData, nodeData)
      : nodeData
  }

  // Cache the result
  if (state && accumulatedData) {
    state.set(outputChainId, accumulatedData, dependencyVersions)
  }

  return accumulatedData ?? { timestamp: Date.now() }
}

/**
 * Invalidate calculations for a changed block
 * Call this when a block's data changes (e.g., variable slider moved)
 */
export function invalidateBlockCalculations(
  blockId: string,
  allChains: Map<string, NodeChain>,
  state: CalculationState
) {
  // Find the chain for this block
  for (const [chainId, chain] of allChains) {
    if (chain.nodeId === blockId) {
      state.invalidate(chainId, allChains)
      break
    }
  }
}
