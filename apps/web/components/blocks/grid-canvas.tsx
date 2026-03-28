/**
 * GridCanvas - Hybrid Canvas + HTML Editor System
 *
 * Architecture:
 * - Canvas layer: Grid rendering (performant, scales infinitely)
 * - HTML layer: Interactive nodes (accessible, focusable, editable)
 * - Transform system: Shared pan/zoom state applied to both layers
 * - Ghost dragging: Original stays in place, preview follows cursor
 * - Snapping: Grid + edge/center alignment with tolerance
 *
 * Performance:
 * - Uses transform: translate/scale instead of top/left
 * - ResizeObserver for content-aware dimensions
 * - Refs for mutable drag state (avoids re-renders)
 * - Document-level event listeners for smooth dragging
 */

"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { cn } from "@workspace/ui/lib/utils"
import {
  GRID_UNIT,
  type Block,
  type GridPosition,
  type BlockDimensions,
  type EquationBlock,
  type ChartBlock,
  type ControlBlock,
  type ControlVariable,
  type LimitBlock,
  type LogicBlock,
  type ComparatorBlock,
  type ConstraintBlock,
  type BlockConnection,
  type Variable,
  parseEquation,
  gridToPixels,
  findNearestValidPosition,
  autoArrangeNeighbors,
  getConnectionType,
} from "@/lib/block-system/types"
import { evaluateFunction } from "@/lib/visualization/graph-renderer"
import {
  CalculationState,
  calculateOutputNode,
  invalidateBlockCalculations,
} from "@/lib/block-system/node-calculation-engine"
import type { BlockPreset } from "./block-library"
import {
  EquationBlockComponent,
  ChartBlockComponent,
  ControlBlockComponent,
  DescriptionBlockComponent,
  LimitBlockComponent,
  ShapeBlockComponent,
  LogicBlockComponent,
  VariableBlockComponent,
  ComparatorBlockComponent,
  ConstraintBlockComponent,
  TableBlockComponent,
} from "./block-components"
import { ConnectionLayer } from "@/components/connections/connection-layer"
import { ConnectionPreview } from "@/components/connections/connection-line"
import { useRecording } from "@/lib/recording-system/use-recording"
import { RecordingControls } from "@/components/recording/recording-controls"
import { RecordingStatusBar } from "@/components/recording/recording-status-bar"
import { useUserRole } from "@/hooks/use-user-role"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu"
import { Checkbox } from "@workspace/ui/components/checkbox"

// ============================================================================
// TYPE GUARDS
// ============================================================================

function isValidBlockPreset(value: unknown): value is BlockPreset {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string" &&
    [
      "equation",
      "chart",
      "control",
      "description",
      "limit",
      "shape",
      "logic",
      "variable",
      "comparator",
      "constraint",
      "table",
    ].includes(value.type)
  )
}

function isEquationBlock(block: Block): block is EquationBlock {
  return block.type === "equation"
}

function isControlBlock(block: Block): block is ControlBlock {
  return block.type === "control"
}

function isLimitBlock(block: Block): block is LimitBlock {
  return block.type === "limit"
}

function isChartBlock(block: Block): block is ChartBlock {
  return block.type === "chart"
}

function isShapeBlock(
  block: Block
): block is import("@/lib/block-system/types").ShapeBlock {
  return block.type === "shape"
}

function isVariableBlock(
  block: Block
): block is import("@/lib/block-system/types").VariableBlock {
  return block.type === "variable"
}

function isLogicBlock(block: Block): block is LogicBlock {
  return block.type === "logic"
}

function isTableBlock(
  block: Block
): block is import("@/lib/block-system/types").TableBlock {
  return block.type === "table"
}

function isComparatorBlock(block: Block): block is ComparatorBlock {
  return block.type === "comparator"
}

function isConstraintBlock(block: Block): block is ConstraintBlock {
  return block.type === "constraint"
}

// ============================================================================
// REUSABLE HOOKS (Extracted for separation of concerns)
// ============================================================================

/**
 * useTransform - Shared pan/zoom transform state
 * Provides coordinate conversion utilities
 */
interface TransformState {
  x: number
  y: number
  scale: number
}

function useTransform(initialScale = 1, minScale = 0.25, maxScale = 3) {
  const [transform, setTransformState] = useState<TransformState>({
    x: 0,
    y: 0,
    scale: initialScale,
  })

  const transformRef = useRef(transform)
  useEffect(() => {
    transformRef.current = transform
  }, [transform])

  const setTransform = useCallback(
    (
      updates:
        | Partial<TransformState>
        | ((prev: TransformState) => TransformState)
    ) => {
      setTransformState((prev) => {
        const next =
          typeof updates === "function"
            ? updates(prev)
            : { ...prev, ...updates }
        next.scale = Math.min(Math.max(next.scale, minScale), maxScale)
        return next
      })
    },
    [minScale, maxScale]
  )

  const reset = useCallback(() => {
    setTransformState({ x: 0, y: 0, scale: initialScale })
  }, [initialScale])

  const zoomIn = useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: prev.scale + 0.1 }))
  }, [setTransform])

  const zoomOut = useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: prev.scale - 0.1 }))
  }, [setTransform])

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => ({
      x: (screenX - transformRef.current.x) / transformRef.current.scale,
      y: (screenY - transformRef.current.y) / transformRef.current.scale,
    }),
    []
  )

  const worldToScreen = useCallback(
    (worldX: number, worldY: number) => ({
      x: worldX * transformRef.current.scale + transformRef.current.x,
      y: worldY * transformRef.current.scale + transformRef.current.y,
    }),
    []
  )

  return {
    transform,
    setTransform,
    reset,
    zoomIn,
    zoomOut,
    screenToWorld,
    worldToScreen,
    transformRef,
  }
}

/**
 * useSnap - Grid and edge snapping system
 */
interface SnapOptions {
  gridSize?: number
  snapThreshold?: number
  enableGridSnap?: boolean
  enableEdgeSnap?: boolean
  enableCenterSnap?: boolean
}

interface SnapResult {
  position: GridPosition
  snappedToGrid: boolean
  snappedToEdge: boolean
  snappedToCenter: boolean
  guideLines?: GuideLine[]
}

interface GuideLine {
  type: "vertical" | "horizontal"
  position: number
  source: "edge" | "center"
}

function useSnap(options: SnapOptions = {}) {
  const {
    snapThreshold = 8,
    enableGridSnap = true,
    enableEdgeSnap = true,
    enableCenterSnap = true,
  } = options

  const snapToGrid = useCallback(
    (position: GridPosition): GridPosition => {
      if (!enableGridSnap) return position
      // Position is already in grid coordinates, just round to nearest integer
      return {
        x: Math.round(position.x),
        y: Math.round(position.y),
      }
    },
    [enableGridSnap]
  )

  const getBlockEdges = useCallback(
    (position: GridPosition, dimensions: BlockDimensions) => [
      { type: "left" as const, value: position.x * GRID_UNIT },
      {
        type: "right" as const,
        value: (position.x + dimensions.width) * GRID_UNIT,
      },
      { type: "top" as const, value: position.y * GRID_UNIT },
      {
        type: "bottom" as const,
        value: (position.y + dimensions.height) * GRID_UNIT,
      },
    ],
    []
  )

  const getBlockCenter = useCallback(
    (position: GridPosition, dimensions: BlockDimensions) => ({
      x: (position.x + dimensions.width / 2) * GRID_UNIT,
      y: (position.y + dimensions.height / 2) * GRID_UNIT,
    }),
    []
  )

  const snap = useCallback(
    (
      position: GridPosition,
      dimensions: BlockDimensions,
      allBlocks: Block[],
      excludeBlockId?: string
    ): SnapResult => {
      const otherBlocks = allBlocks.filter((b) => b.id !== excludeBlockId)

      // Start with grid snapping
      let snappedPosition = snapToGrid(position)
      const snappedToGridResult =
        enableGridSnap &&
        (snappedPosition.x !== position.x || snappedPosition.y !== position.y)

      // Find edge and center snapping opportunities
      const myEdges = getBlockEdges(snappedPosition, dimensions)
      const myCenter = getBlockCenter(snappedPosition, dimensions)
      const guideLines: GuideLine[] = []
      let snappedToEdge = false
      let snappedToCenter = false

      // Check edge snapping
      if (enableEdgeSnap) {
        for (const block of otherBlocks) {
          const theirEdges = getBlockEdges(block.position, block.dimensions)

          for (const myEdge of myEdges) {
            for (const theirEdge of theirEdges) {
              if (
                myEdge.type === theirEdge.type &&
                Math.abs(myEdge.value - theirEdge.value) <= snapThreshold
              ) {
                snappedToEdge = true
                const delta = theirEdge.value - myEdge.value

                if (myEdge.type === "left" || myEdge.type === "right") {
                  snappedPosition = {
                    ...snappedPosition,
                    x: snappedPosition.x + delta / GRID_UNIT,
                  }
                  guideLines.push({
                    type: "vertical",
                    position: theirEdge.value,
                    source: "edge",
                  })
                } else {
                  snappedPosition = {
                    ...snappedPosition,
                    y: snappedPosition.y + delta / GRID_UNIT,
                  }
                  guideLines.push({
                    type: "horizontal",
                    position: theirEdge.value,
                    source: "edge",
                  })
                }
                break
              }
            }
            if (snappedToEdge) break
          }
          if (snappedToEdge) break
        }
      }

      // Check center alignment snapping (if no edge snap)
      if (!snappedToEdge && enableCenterSnap) {
        for (const block of otherBlocks) {
          const theirCenter = getBlockCenter(block.position, block.dimensions)

          if (Math.abs(myCenter.x - theirCenter.x) <= snapThreshold) {
            snappedToCenter = true
            const delta = theirCenter.x - myCenter.x
            snappedPosition = {
              ...snappedPosition,
              x: snappedPosition.x + delta / GRID_UNIT,
            }
            guideLines.push({
              type: "vertical",
              position: theirCenter.x,
              source: "center",
            })
            break
          }

          if (Math.abs(myCenter.y - theirCenter.y) <= snapThreshold) {
            snappedToCenter = true
            const delta = theirCenter.y - myCenter.y
            snappedPosition = {
              ...snappedPosition,
              y: snappedPosition.y + delta / GRID_UNIT,
            }
            guideLines.push({
              type: "horizontal",
              position: theirCenter.y,
              source: "center",
            })
            break
          }
        }
      }

      return {
        position: snappedPosition,
        snappedToGrid: snappedToGridResult,
        snappedToEdge,
        snappedToCenter,
        guideLines: guideLines.length > 0 ? guideLines : undefined,
      }
    },
    [
      snapToGrid,
      getBlockEdges,
      getBlockCenter,
      enableGridSnap,
      enableEdgeSnap,
      enableCenterSnap,
      snapThreshold,
    ]
  )

  return { snap, snapToGrid }
}

interface GridCanvasProps {
  className?: string
  onBlocksChange?: (blocks: Block[]) => void
  onBlockDrop?: (preset: BlockPreset, position: GridPosition) => void

  // Node chain props (new tree-based architecture)
  nodeChains?: Map<string, import("@/lib/block-system/types").NodeChain>
  onNodeChainsChange?: (
    chains: Map<string, import("@/lib/block-system/types").NodeChain>
  ) => void
  onConnectBlocks?: (sourceBlockId: string, targetBlockId: string) => void
  onDisconnectBlocks?: (sourceBlockId: string, targetBlockId: string) => void

  // Playback mode props
  blocks?: Block[]
  isPlaybackMode?: boolean
  onBlockInteract?: () => void
  onBlockModification?: (blockId: string, modifications: Partial<Block>) => void
  onVariableChange?: (
    blockId: string,
    variableName: string,
    value: number
  ) => void
  readOnly?: boolean

  // Recording permission prop
  canRecord?: boolean
}

/**
 * Ghost Drag State - Tracks drag preview position
 * The original element stays in place; only the ghost moves
 */
interface GhostDragState {
  isDragging: boolean
  blockId: string
  startPosition: GridPosition
  previewPosition: GridPosition // Snapped preview position
  offset: { x: number; y: number } // Click offset in world coordinates
  dimensions: BlockDimensions
  snappedToGrid: boolean
  snappedToEdge: boolean
  snappedToCenter: boolean
  guideLines?: GuideLine[]
}

export function GridCanvas({
  className,
  onBlocksChange,
  blocks: externalBlocks,
  isPlaybackMode = false,
  onBlockInteract,
  onBlockModification,
  onVariableChange,
  onBlockDrop,
  nodeChains,
  onNodeChainsChange,
  readOnly = false,
  canRecord = true,
}: GridCanvasProps) {
  const { isAdmin, isCreator } = useUserRole()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [internalBlocks, setInternalBlocks] = useState<Block[]>([])
  const blocks = externalBlocks ?? internalBlocks
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>()
  const [gridVisible, setGridVisible] = useState(true)

  // Connection state
  const [connections, setConnections] = useState<BlockConnection[]>([])
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | undefined
  >()
  const [contextTarget, setContextTarget] = useState<
    { blockId?: string; connectionId?: string } | undefined
  >(undefined)
  const [connectionDrag, setConnectionDrag] = useState<{
    sourceBlockId: string
    sourceHandleId: string
    currentX: number
    currentY: number
  } | null>(null)

  // Node calculation state (for node-based calculation engine)
  // Uses ref to avoid re-renders, calculation results are passed via nodeChains
  const calculationStateRef = useRef<CalculationState>(new CalculationState())

  // Transform system (pan + zoom) - shared across all layers
  const {
    transform,
    setTransform,
    reset: resetTransform,
    zoomIn,
    zoomOut,
    screenToWorld,
    worldToScreen,
    transformRef,
  } = useTransform(1, 0.25, 3)

  // Snapping system
  const { snap } = useSnap({
    gridSize: GRID_UNIT,
    snapThreshold: 8,
    enableGridSnap: true,
    enableEdgeSnap: true,
    enableCenterSnap: true,
  })

  // Ghost dragging state - uses ref for mutable state during drag
  const [ghostDrag, setGhostDrag] = useState<GhostDragState | null>(null)
  const ghostDragRef = useRef<GhostDragState | null>(null)
  const isDraggingRef = useRef(false)

  // Panning state
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0 })

  // Sync ref with state
  useEffect(() => {
    ghostDragRef.current = ghostDrag
  }, [ghostDrag])

  // Keep Variable Slider blocks in sync when their source equation changes (e.g. new variables added)
  useEffect(() => {
    if (isPlaybackMode) return

    const equationById = new Map(
      blocks.filter(isEquationBlock).map((b) => [b.id, b] as const)
    )

    let didChange = false
    const nextBlocks = blocks.map((block) => {
      if (!isVariableBlock(block) || !block.sourceEquationId) return block
      const sourceEq = equationById.get(block.sourceEquationId)
      if (!sourceEq) return block

      const eqVars =
        sourceEq.variables ?? parseEquation(sourceEq.equation).variables
      const editableVars = eqVars.filter(
        (v) => !["x", "y", "e", "pi"].includes(v.name)
      )
      const varsToSeed =
        editableVars.length > 0
          ? editableVars
          : eqVars.filter((v) => !["x", "e", "pi"].includes(v.name))

      const currentByName = new Map(
        block.variables.map((v) => [v.name, v] as const)
      )
      const seededVariables = varsToSeed.map((v) => {
        const existing = currentByName.get(v.name)
        return {
          name: v.name,
          value: existing?.value ?? v.value,
          min: existing?.min ?? v.min ?? -1000,
          max: existing?.max ?? v.max ?? 1000,
          step: existing?.step ?? v.step ?? 0.5,
          showSlider: existing?.showSlider ?? true,
          showInput: existing?.showInput ?? true,
          autoAnimate: existing?.autoAnimate ?? false,
          animationSpeed: existing?.animationSpeed ?? 2000,
          animationDirection:
            existing?.animationDirection ?? ("oscillate" as const),
        }
      })

      const same =
        block.variables.length === seededVariables.length &&
        block.variables.every((v, i) => {
          const next = seededVariables[i]
          return (
            next &&
            v.name === next.name &&
            v.value === next.value &&
            v.min === next.min &&
            v.max === next.max &&
            v.step === next.step &&
            v.showSlider === next.showSlider &&
            v.showInput === next.showInput
          )
        })

      if (same) return block
      didChange = true
      return { ...block, variables: seededVariables, updatedAt: Date.now() }
    })

    if (!didChange) return
    setInternalBlocks(nextBlocks)
    onBlocksChange?.(nextBlocks)
  }, [blocks, isPlaybackMode, onBlocksChange])

  // Compute logic/comparator results from connections
  useEffect(() => {
    if (isPlaybackMode) return

    const byId = new Map(blocks.map((b) => [b.id, b] as const))

    const getNumericValue = (block: Block | undefined): number | undefined => {
      if (!block) return undefined
      if (isComparatorBlock(block)) {
        return typeof block.result === "number" ? block.result : undefined
      }
      if (isLogicBlock(block)) {
        return typeof block.result === "number" ? block.result : undefined
      }
      if (isEquationBlock(block)) {
        const vars = block.variables ?? parseEquation(block.equation).variables
        const record: Record<string, number> = {}
        for (const v of vars) record[v.name] = v.value
        const x = record.x ?? 0
        const y = evaluateFunction(block.equation, { ...record, x })
        return Number.isFinite(y) ? y : undefined
      }
      return undefined
    }

    const getBoolValue = (block: Block): boolean | undefined => {
      if (isConstraintBlock(block)) {
        return typeof block.result === "boolean" ? block.result : undefined
      }
      if (isComparatorBlock(block)) {
        if (typeof block.result === "boolean") return block.result
        if (typeof block.result === "number") return block.result !== 0
      }
      if (isLogicBlock(block)) {
        if (typeof block.result === "boolean") return block.result
        if (typeof block.result === "number") return block.result !== 0
      }
      if (isEquationBlock(block)) {
        const raw = block.equation ?? ""
        const normalized = raw.toLowerCase().replace(/\s/g, "")
        const parts = normalized.split("=")
        // Treat pure numeric equalities like "1=1" as boolean statements.
        // Do NOT treat assignments/functions like "y=mx+c" or "m=mx+c" as boolean.
        if (
          parts.length === 2 &&
          parts[0] !== undefined &&
          parts[1] !== undefined
        ) {
          const lhs = parts[0]
          const rhs = parts[1]
          const isFunctionDef = lhs === "y"
          const hasLetters = /[a-z]/i.test(lhs + rhs)
          if (!isFunctionDef && !hasLetters) {
            const vars = block.variables ?? parseEquation(raw).variables
            const record: Record<string, number> = {}
            for (const v of vars) record[v.name] = v.value
            const leftVal = evaluateFunction(`y=${lhs}`, record)
            const rightVal = evaluateFunction(`y=${rhs}`, record)
            if (!Number.isFinite(leftVal) || !Number.isFinite(rightVal))
              return undefined
            const epsilon = 1e-9
            return Math.abs(leftVal - rightVal) <= epsilon
          }
        }

        const num = getNumericValue(block)
        return num === undefined ? undefined : num !== 0
      }
      return undefined
    }

    let didChange = false
    const nextBlocks = blocks.map((block) => {
      if (
        !isLogicBlock(block) &&
        !isComparatorBlock(block) &&
        !isEquationBlock(block)
      )
        return block

      if (isEquationBlock(block)) {
        const now = Date.now()
        const sourceId = block.enabledSourceId
        if (!sourceId) {
          if (block.enabled === false) {
            didChange = true
            return { ...block, enabled: true, updatedAt: now }
          }
          return block
        }
        const sourceBlock = byId.get(sourceId)
        const enabledValue = sourceBlock ? getBoolValue(sourceBlock) : undefined
        const nextEnabled = enabledValue === undefined ? true : enabledValue
        if (block.enabled === nextEnabled) return block
        didChange = true
        return { ...block, enabled: nextEnabled, updatedAt: now }
      }

      if (isLogicBlock(block)) {
        const inputBlocks = (block.inputs || [])
          .map((id) => byId.get(id))
          .filter((b): b is Block => Boolean(b))

        const now = Date.now()
        if (["and", "or", "xor"].includes(block.logicType)) {
          if (inputBlocks.length < 2)
            return block.result === undefined
              ? block
              : { ...block, result: undefined }
          const bools = inputBlocks.map(getBoolValue)
          if (bools.some((b) => b === undefined)) return block
          const values = bools.filter((b): b is boolean => b !== undefined)
          const result =
            block.logicType === "and"
              ? values.every(Boolean)
              : block.logicType === "or"
                ? values.some(Boolean)
                : values.reduce((acc, v) => acc !== v, false)
          if (block.result === result) return block
          didChange = true
          return { ...block, result, updatedAt: now }
        }

        // Comparison gate types (eq, le, ge, gt, lt): use first two numeric inputs
        if (inputBlocks.length < 2)
          return block.result === undefined
            ? block
            : { ...block, result: undefined }
        const left = getNumericValue(inputBlocks[0])
        const right = getNumericValue(inputBlocks[1])
        if (left === undefined || right === undefined) return block
        let result: boolean
        switch (block.logicType) {
          case "eq":
            result = left === right
            break
          case "le":
            result = left <= right
            break
          case "ge":
            result = left >= right
            break
          case "gt":
            result = left > right
            break
          case "lt":
            result = left < right
            break
          default:
            return block
        }
        if (block.result === result) return block
        didChange = true
        return { ...block, result, updatedAt: now }
      }

      // Comparator block computation (two inputs)
      if (isComparatorBlock(block)) {
        if (!block.leftInput || !block.rightInput) {
          return block.result === undefined
            ? block
            : { ...block, result: undefined }
        }
        const leftBlock = byId.get(block.leftInput)
        const rightBlock = byId.get(block.rightInput)
        if (!leftBlock || !rightBlock) return block
        const left = getNumericValue(leftBlock)
        const right = getNumericValue(rightBlock)
        if (left === undefined || right === undefined) return block

        let result: boolean
        switch (block.operator) {
          case "eq":
            result = left === right
            break
          case "le":
            result = left <= right
            break
          case "ge":
            result = left >= right
            break
          case "gt":
            result = left > right
            break
          case "lt":
            result = left < right
            break
          default:
            return block
        }

        if (block.result === result) return block
        didChange = true
        return { ...block, result, updatedAt: Date.now() }
      }

      return block
    })

    if (!didChange) return
    setInternalBlocks(nextBlocks)
    onBlocksChange?.(nextBlocks)
  }, [blocks, isPlaybackMode, onBlocksChange])

  // ============================================================================
  // NODE-BASED CALCULATION ENGINE
  // Calculates data flow through node chains for output blocks (chart/table/shape)
  // 
  // IMPORTANT: We only run calculations when blocks change, NOT when nodeChains change.
  // This prevents infinite loops. The calculation results are stored in nodeChains,
  // but we don't re-run this effect when that happens.
  // ============================================================================
  const prevBlocksRef = useRef<string>('')
  
  useEffect(() => {
    if (isPlaybackMode || !nodeChains || !onNodeChainsChange) return

    // Create a signature of block data to detect actual changes
    const blocksSignature = blocks.map(b => `${b.id}-${b.updatedAt}`).join(',')
    const prevSignature = prevBlocksRef.current
    
    // Skip if blocks haven't actually changed (prevents infinite loop)
    if (blocksSignature === prevSignature) {
      return
    }
    prevBlocksRef.current = blocksSignature

    const state = calculationStateRef.current
    const allBlocks = new Map(blocks.map((b) => [b.id, b] as const))

    // Calculate data for each output node (chart, table, shape)
    // Track which chains have new/changed calculations
    const changedChainIds = new Set<string>()

    for (const [chainId, chain] of nodeChains) {
      // Only calculate for output block types
      if (!['chart', 'table', 'shape'].includes(chain.type)) continue

      const block = allBlocks.get(chain.nodeId)
      if (!block) continue

      try {
        // Calculate data flowing through the chain
        const calculatedData = calculateOutputNode(
          chainId,
          nodeChains,
          allBlocks,
          state
        )

        // Only update if calculated data changed (shallow comparison)
        const existingData = chain.calculatedData
        const dataChanged = !existingData || 
          existingData.timestamp !== calculatedData.timestamp ||
          existingData.equation !== calculatedData.equation

        if (dataChanged) {
          changedChainIds.add(chainId)
        }
      } catch (error) {
        console.error('Error calculating node chain:', chainId, error)
      }
    }

    // Only create new map and trigger update if we have changes
    if (changedChainIds.size > 0) {
      const nextChains = new Map(nodeChains)
      for (const chainId of changedChainIds) {
        const chain = nodeChains.get(chainId)
        if (!chain) continue

        const allBlocksMap = new Map(blocks.map((b) => [b.id, b] as const))
        const calculatedData = calculateOutputNode(
          chainId,
          nodeChains,
          allBlocksMap,
          state
        )

        nextChains.set(chainId, {
          ...chain,
          calculatedData,
        })
      }
      onNodeChainsChange(nextChains)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, nodeChains, onNodeChainsChange, isPlaybackMode])

  // Invalidate calculation cache when blocks change significantly
  useEffect(() => {
    if (!nodeChains || !onNodeChainsChange) return

    const state = calculationStateRef.current
    // Clear entire cache on major changes (simpler than tracking individual changes)
    state.clear()
  }, [blocks.length, nodeChains?.size])

  // Recording system integration
  const {
    state: recordingState,
    start: startRecording,
    stop: stopRecording,
    pause: pauseRecording,
    resume: resumeRecording,
    createBookmark,
    recordBlockMoved,
  } = useRecording({
    metadata: {
      lessonTitle: "Untitled Lesson",
    },
  })

  // Auto-animation for control variables (disabled to keep the canvas readable)
  useEffect(() => {
    return
    let animationFrame: number
    const animate = () => {
      const now = Date.now()
      let needsUpdate = false
      const updatedBlocks = blocks.map((block) => {
        if (!isControlBlock(block)) return block

        const hasAutoVariables = block.variables.some((v) => v.autoAnimate)
        if (!hasAutoVariables) return block

        const updatedVariables = block.variables.map((variable) => {
          if (!variable.autoAnimate) return variable

          const speed = variable.animationSpeed || 2000
          const direction = variable.animationDirection || "oscillate"
          const progress = (now % speed) / speed

          let newValue: number
          if (direction === "oscillate") {
            const oscillateProgress =
              progress < 0.5 ? progress * 2 : (1 - progress) * 2
            newValue =
              variable.min + oscillateProgress * (variable.max - variable.min)
          } else {
            newValue = variable.min + progress * (variable.max - variable.min)
          }

          if (Math.abs(newValue - variable.value) > 0.01) {
            needsUpdate = true
            return { ...variable, value: Math.round(newValue * 100) / 100 }
          }
          return variable
        })

        if (needsUpdate) {
          return { ...block, variables: updatedVariables, updatedAt: now }
        }
        return block
      })

      if (needsUpdate) {
        setInternalBlocks(updatedBlocks)
        onBlocksChange?.(updatedBlocks)
      }

      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [blocks, onBlocksChange])

  // ============================================================================
  // BLOCK INTERACTION HANDLERS
  // ============================================================================

  const handleBlockClick = useCallback(
    (blockId: string) => {
      setSelectedBlockId(blockId)
      if (isPlaybackMode) {
        onBlockInteract?.()
      }
    },
    [isPlaybackMode, onBlockInteract]
  )

  const handleBlockDimensionsChange = useCallback(
    (blockId: string, dimensions: { width: number; height: number }) => {
      if (readOnly) return
      const now = Date.now()

      if (isPlaybackMode) {
        onBlockModification?.(blockId, { dimensions, updatedAt: now })
        return
      }

      const updatedBlocks = blocks.map((b) =>
        b.id === blockId ? { ...b, dimensions, updatedAt: now } : b
      )

      if (!externalBlocks) {
        setInternalBlocks(updatedBlocks)
      }
      onBlocksChange?.(updatedBlocks)
    },
    [
      blocks,
      externalBlocks,
      isPlaybackMode,
      onBlockModification,
      onBlocksChange,
      readOnly,
    ]
  )

  // ============================================================================
  // GHOST DRAGGING SYSTEM
  // When dragging starts, the original element stays in place
  // A ghost preview follows the cursor with snapping applied
  // On release, the position is committed
  // ============================================================================

  const handleDragStart = useCallback(
    (e: React.MouseEvent, block: Block) => {
      e.stopPropagation()
      e.preventDefault()

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      // Calculate click offset in screen coordinates
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top

      // Convert to world coordinates (accounting for transform)
      const worldPos = screenToWorld(screenX, screenY)

      // Calculate offset from top-left of block (in world coordinates)
      const blockWorldX = block.position.x * GRID_UNIT
      const blockWorldY = block.position.y * GRID_UNIT
      const offset = {
        x: worldPos.x - blockWorldX,
        y: worldPos.y - blockWorldY,
      }

      // Initialize ghost drag state
      const dragState: GhostDragState = {
        isDragging: true,
        blockId: block.id,
        startPosition: { ...block.position },
        previewPosition: { ...block.position },
        offset,
        dimensions: { ...block.dimensions },
        snappedToGrid: false,
        snappedToEdge: false,
        snappedToCenter: false,
        guideLines: undefined,
      }

      setGhostDrag(dragState)
      isDraggingRef.current = true

      // Set capture for smooth dragging outside canvas bounds
      // Use 0 as default pointerId for mouse events
      canvasRef.current?.setPointerCapture?.(0)
    },
    [screenToWorld]
  )

  const handleDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ghostDragRef.current || !isDraggingRef.current || !canvasRef.current)
        return

      const rect = canvasRef.current.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top

      // Convert to world coordinates
      const worldPos = screenToWorld(screenX, screenY)

      // Calculate new position based on cursor minus offset
      // This ensures the block doesn't snap to top-left
      const newX = worldPos.x - ghostDragRef.current.offset.x
      const newY = worldPos.y - ghostDragRef.current.offset.y

      // Convert to grid coordinates
      const gridPosition: GridPosition = {
        x: newX / GRID_UNIT,
        y: newY / GRID_UNIT,
      }

      // Apply snapping to preview position
      const snapResult = snap(
        gridPosition,
        ghostDragRef.current.dimensions,
        blocks,
        ghostDragRef.current.blockId
      )

      // Update ghost preview (not the actual block yet)
      setGhostDrag((prev) =>
        prev
          ? {
              ...prev,
              previewPosition: snapResult.position,
              snappedToGrid: snapResult.snappedToGrid,
              snappedToEdge: snapResult.snappedToEdge,
              snappedToCenter: snapResult.snappedToCenter,
              guideLines: snapResult.guideLines,
            }
          : null
      )
    },
    [screenToWorld, snap, blocks]
  )

  const handleDragEnd = useCallback(() => {
    if (!ghostDragRef.current) return

    const { blockId, previewPosition, startPosition } = ghostDragRef.current
    const block = blocks.find((b) => b.id === blockId)
    if (!block) return

    // Find valid position (avoid collisions)
    const validPosition = findNearestValidPosition(
      previewPosition,
      block.dimensions,
      blocks,
      blockId
    )

    // Apply auto-arrangement to neighbors if needed
    const updatedBlock = {
      ...block,
      position: validPosition,
      updatedAt: Date.now(),
    }
    const adjustments = autoArrangeNeighbors(updatedBlock, [...blocks])

    const newBlocks = blocks.map((b) => {
      const adjustment = adjustments.find((a) => a.blockId === b.id)
      if (adjustment)
        return { ...b, position: adjustment.newPosition, updatedAt: Date.now() }
      if (b.id === blockId) return updatedBlock
      return b
    })

    // Record block moved event if recording
    if (
      startPosition.x !== validPosition.x ||
      startPosition.y !== validPosition.y
    ) {
      recordBlockMoved(blockId, startPosition, validPosition)
    }

    if (!isPlaybackMode) {
      setInternalBlocks(newBlocks)
    }
    onBlocksChange?.(newBlocks)

    // Clear drag state
    setGhostDrag(null)
    isDraggingRef.current = false
  }, [blocks, onBlocksChange, recordBlockMoved, isPlaybackMode])

  // ============================================================================
  // PAN HANDLERS (Middle mouse or Alt+click)
  // ============================================================================

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse button or Alt + click to pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault()
      setIsPanning(true)
      panStartRef.current = {
        x: e.clientX - transformRef.current.x,
        y: e.clientY - transformRef.current.y,
      }
    }
  }, [])

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        e.preventDefault()
        setTransform({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        })
      }
    },
    [isPanning, setTransform]
  )

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // ============================================================================
  // ZOOM HANDLERS
  // ============================================================================

  const handleZoom = useCallback(
    (delta: number) => {
      setTransform((prev) => {
        const newZoom = Math.min(Math.max(prev.scale + delta, 0.25), 3)
        return { ...prev, scale: Math.round(newZoom * 100) / 100 }
      })
    },
    [setTransform]
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        handleZoom(delta)
      }
    },
    [handleZoom]
  )

  // ============================================================================
  // DRAG AND DROP FROM LIBRARY
  // ============================================================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const handleCanvasDragStart = useCallback((e: React.DragEvent) => {
    // Prevent HTML5 native drag for blocks on canvas
    const target = e.target instanceof HTMLElement ? e.target : null
    const isFromLibrary = target?.closest("[data-block-library-item]") !== null
    if (!isFromLibrary) {
      e.preventDefault()
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!canvasRef.current || readOnly || isPlaybackMode) return

      const data = e.dataTransfer.getData("application/json")
      if (!data) return

      let preset: BlockPreset | null = null
      try {
        const parsed: unknown = JSON.parse(data)
        if (isValidBlockPreset(parsed)) {
          preset = parsed
        }
      } catch {
        return
      }

      if (!preset) return

      const rect = canvasRef.current.getBoundingClientRect()
      const scrollLeft = canvasRef.current.scrollLeft || 0
      const scrollTop = canvasRef.current.scrollTop || 0
      const screenX = e.clientX - rect.left + scrollLeft
      const screenY = e.clientY - rect.top + scrollTop

      // Convert screen to world coordinates (accounting for pan/zoom)
      const worldPos = screenToWorld(screenX, screenY)
      const gridPosition: GridPosition = {
        x: Math.round(worldPos.x / GRID_UNIT),
        y: Math.round(worldPos.y / GRID_UNIT),
      }

      onBlockDrop?.(preset, gridPosition)
    },
    [readOnly, isPlaybackMode, onBlockDrop, screenToWorld]
  )

  // Connection handlers
  const handleConnectionStart = useCallback(
    (blockId: string, handleId: string) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      if (!canvasRect) return

      setConnectionDrag({
        sourceBlockId: blockId,
        sourceHandleId: handleId,
        currentX: 0,
        currentY: 0,
      })
    },
    []
  )

  const handleConnectionMove = useCallback(
    (e: React.MouseEvent) => {
      if (!connectionDrag || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      const gridX = (screenX - transform.x) / transform.scale
      const gridY = (screenY - transform.y) / transform.scale

      setConnectionDrag((prev) =>
        prev ? { ...prev, currentX: gridX, currentY: gridY } : null
      )
    },
    [connectionDrag, transform.x, transform.y, transform.scale]
  )

  // Document-level mouse handlers for connection dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!connectionDrag || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      const gridX =
        (screenX - transformRef.current.x) / transformRef.current.scale
      const gridY =
        (screenY - transformRef.current.y) / transformRef.current.scale

      setConnectionDrag((prev) =>
        prev ? { ...prev, currentX: gridX, currentY: gridY } : null
      )
    }

    const handleGlobalMouseUp = () => {
      if (connectionDrag) {
        setConnectionDrag(null)
      }
    }

    if (connectionDrag) {
      document.addEventListener("mousemove", handleGlobalMouseMove)
      document.addEventListener("mouseup", handleGlobalMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove)
        document.removeEventListener("mouseup", handleGlobalMouseUp)
      }
    }
  }, [connectionDrag, transformRef])

  const handleConnectionEnd = useCallback(
    (targetBlockId: string, targetHandleId: string) => {
      if (!connectionDrag) return

      const sourceBlock = blocks.find(
        (b) => b.id === connectionDrag.sourceBlockId
      )
      const targetBlock = blocks.find((b) => b.id === targetBlockId)

      if (!sourceBlock || !targetBlock) return
      if (sourceBlock.id === targetBlock.id) return

      const connectionType = getConnectionType(
        sourceBlock.type,
        targetBlock.type
      )
      if (!connectionType) return

      const existingConnection = connections.find(
        (c) =>
          c.sourceBlockId === sourceBlock.id &&
          c.targetBlockId === targetBlock.id
      )
      const shouldAddConnection = !existingConnection

      if (shouldAddConnection) {
        const newConnection: BlockConnection = {
          id: `conn-${Date.now()}`,
          sourceBlockId: sourceBlock.id,
          sourceHandleId: connectionDrag.sourceHandleId,
          targetBlockId: targetBlock.id,
          targetHandleId: targetHandleId,
          type: connectionType,
          createdAt: Date.now(),
        }

        setConnections((prev) => [...prev, newConnection])
      }

      const updatedBlocks = blocks.map((block) => {
        if (block.id === sourceBlock.id && isEquationBlock(block)) {
          if (isChartBlock(targetBlock)) {
            return {
              ...block,
              connectedChartIds: [
                ...(block.connectedChartIds || []),
                targetBlock.id,
              ],
            }
          } else if (isControlBlock(targetBlock)) {
            return {
              ...block,
              connectedControlIds: [
                ...(block.connectedControlIds || []),
                targetBlock.id,
              ],
            }
          } else if (isLimitBlock(targetBlock)) {
            return {
              ...block,
              connectedLimitIds: [
                ...(block.connectedLimitIds || []),
                targetBlock.id,
              ],
            }
          } else if (isEquationBlock(targetBlock)) {
            return {
              ...block,
              connectedEquationIds: [
                ...(block.connectedEquationIds || []),
                targetBlock.id,
              ],
            }
          } else if (isVariableBlock(targetBlock)) {
            return {
              ...block,
              connectedVariableIds: [
                ...(block.connectedVariableIds || []),
                targetBlock.id,
              ],
            }
          }
        } else if (block.id === sourceBlock.id && isLogicBlock(block)) {
          return {
            ...block,
            output: targetBlock.id,
          }
        } else if (block.id === sourceBlock.id && isComparatorBlock(block)) {
          return {
            ...block,
            output: targetBlock.id,
          }
        } else if (block.id === targetBlock.id) {
          if (isChartBlock(targetBlock)) {
            const effectiveEquationId =
              isVariableBlock(sourceBlock) && sourceBlock.sourceEquationId
                ? sourceBlock.sourceEquationId
                : isConstraintBlock(sourceBlock) && sourceBlock.targetEquationId
                  ? sourceBlock.targetEquationId
                  : sourceBlock.id

            // Handle limit -> chart connection
            if (isLimitBlock(sourceBlock)) {
              return {
                ...targetBlock,
                sourceLimitIds: [
                  ...(targetBlock.sourceLimitIds || []),
                  sourceBlock.id,
                ],
              }
            }

            // Handle equation/variable/constraint -> chart connection
            return {
              ...targetBlock,
              sourceEquationIds: [
                ...(targetBlock.sourceEquationIds || []),
                effectiveEquationId,
              ],
            }
          } else if (isControlBlock(targetBlock)) {
            const eqVars = isEquationBlock(sourceBlock)
              ? (sourceBlock.variables ??
                parseEquation(sourceBlock.equation).variables)
              : []

            const seededVariables: ControlVariable[] = (
              targetBlock.variables?.length ? targetBlock.variables : eqVars
            ).map((v) => ({
              name: v.name,
              value: v.value,
              min: v.min ?? -1000,
              max: v.max ?? 1000,
              step: v.step ?? (v.name === "x" || v.name === "y" ? 0.1 : 0.5),
              showSlider: true,
              showInput: true,
              autoAnimate: false,
              animationSpeed: 2000,
              animationDirection: "oscillate" as const,
            }))

            return {
              ...targetBlock,
              sourceEquationIds: [
                ...(targetBlock.sourceEquationIds || []),
                sourceBlock.id,
              ],
              variables: seededVariables,
            }
          } else if (isLimitBlock(targetBlock)) {
            const eqVars = isEquationBlock(sourceBlock)
              ? (sourceBlock.variables ??
                parseEquation(sourceBlock.equation).variables)
              : []
            const variableNames = new Set(eqVars.map((v) => v.name))
            const nextVariableName = variableNames.has(targetBlock.variableName)
              ? targetBlock.variableName
              : (eqVars[0]?.name ?? "x")
            return {
              ...targetBlock,
              targetEquationId: sourceBlock.id,
              variableName: nextVariableName,
            }
          } else if (isVariableBlock(targetBlock)) {
            const eqVars = isEquationBlock(sourceBlock)
              ? (sourceBlock.variables ??
                parseEquation(sourceBlock.equation).variables)
              : []

            const editableVars = eqVars.filter(
              (v) => !["x", "y", "e", "pi"].includes(v.name)
            )
            const varsToSeed =
              editableVars.length > 0
                ? editableVars
                : eqVars.filter((v) => !["x", "e", "pi"].includes(v.name))

            const seededVariables = varsToSeed.map((v) => ({
              name: v.name,
              value: v.value,
              min: v.min ?? -1000,
              max: v.max ?? 1000,
              step: v.step ?? 0.5,
              showSlider: true,
              showInput: true,
              autoAnimate: false,
              animationSpeed: 2000,
              animationDirection: "oscillate" as const,
            }))

            return {
              ...targetBlock,
              sourceEquationId: sourceBlock.id,
              variables: seededVariables,
            }
          } else if (isEquationBlock(targetBlock)) {
            if (targetHandleId.endsWith("-input-enable")) {
              return { ...targetBlock, enabledSourceId: sourceBlock.id }
            }
          } else if (isLogicBlock(targetBlock)) {
            const nextInputs = Array.from(
              new Set([...(targetBlock.inputs || []), sourceBlock.id])
            )
            return {
              ...targetBlock,
              inputs: nextInputs,
            }
          } else if (isComparatorBlock(targetBlock)) {
            // Route by handle id so ordering doesn't change meaning
            if (targetHandleId.endsWith("-input-left")) {
              return { ...targetBlock, leftInput: sourceBlock.id }
            }
            if (targetHandleId.endsWith("-input-right")) {
              return { ...targetBlock, rightInput: sourceBlock.id }
            }
          } else if (
            isConstraintBlock(targetBlock) &&
            isEquationBlock(sourceBlock)
          ) {
            const vars =
              sourceBlock.variables ??
              parseEquation(sourceBlock.equation).variables
            const names = vars.map((v) => v.name)
            const nextVar = names.includes(targetBlock.variableName)
              ? targetBlock.variableName
              : (names[0] ?? "x")
            return {
              ...targetBlock,
              targetEquationId: sourceBlock.id,
              variableName: nextVar,
            }
          } else if (
            isConstraintBlock(targetBlock) &&
            isConstraintBlock(sourceBlock)
          ) {
            // Chain constraints: propagate equation context forward
            if (!sourceBlock.targetEquationId) return targetBlock
            return {
              ...targetBlock,
              targetEquationId:
                targetBlock.targetEquationId ?? sourceBlock.targetEquationId,
              variableName:
                targetBlock.variableName || sourceBlock.variableName || "x",
            }
          } else if (
            isShapeBlock(targetBlock) &&
            isEquationBlock(sourceBlock)
          ) {
            // Handle equation -> shape connection for dynamic fill value
            return {
              ...targetBlock,
              sourceValueId: sourceBlock.id,
            }
          } else if (isTableBlock(targetBlock)) {
            // Handle equation -> table connection
            if (isEquationBlock(sourceBlock)) {
              return {
                ...targetBlock,
                sourceEquationId: sourceBlock.id,
                variableName: targetBlock.variableName || "x",
              }
            }
            // Handle limit -> table connection
            if (isLimitBlock(sourceBlock)) {
              return {
                ...targetBlock,
                sourceLimitId: sourceBlock.id,
              }
            }
            // Handle constraint -> table connection
            if (isConstraintBlock(sourceBlock)) {
              return {
                ...targetBlock,
                sourceConstraintIds: [
                  ...(targetBlock.sourceConstraintIds || []),
                  sourceBlock.id,
                ],
              }
            }
          }
        } else if (
          isVariableBlock(sourceBlock) &&
          isChartBlock(targetBlock) &&
          sourceBlock.sourceEquationId &&
          block.id === sourceBlock.sourceEquationId &&
          isEquationBlock(block)
        ) {
          return {
            ...block,
            connectedChartIds: [
              ...(block.connectedChartIds || []),
              targetBlock.id,
            ],
          }
        }
        return block
      })

      setInternalBlocks(updatedBlocks)
      onBlocksChange?.(updatedBlocks)
      setConnectionDrag(null)
    },
    [connectionDrag, blocks, connections, onBlocksChange]
  )

  const handleDeleteConnection = useCallback(
    (connectionId: string) => {
      const connection = connections.find((c) => c.id === connectionId)
      if (!connection) return

      const sourceBlock = blocks.find((b) => b.id === connection.sourceBlockId)
      const backingEquationId =
        connection.type === "variable-to-chart" &&
        sourceBlock &&
        isVariableBlock(sourceBlock)
          ? sourceBlock.sourceEquationId
          : undefined

      const updatedBlocks = blocks.map((block) => {
        if (block.id === connection.sourceBlockId && isEquationBlock(block)) {
          return {
            ...block,
            connectedChartIds: block.connectedChartIds?.filter(
              (id) => id !== connection.targetBlockId
            ),
            connectedControlIds: block.connectedControlIds?.filter(
              (id) => id !== connection.targetBlockId
            ),
            connectedEquationIds: block.connectedEquationIds?.filter(
              (id) => id !== connection.targetBlockId
            ),
            connectedLimitIds: block.connectedLimitIds?.filter(
              (id) => id !== connection.targetBlockId
            ),
            connectedVariableIds: block.connectedVariableIds?.filter(
              (id) => id !== connection.targetBlockId
            ),
          }
        } else if (block.id === connection.targetBlockId) {
          if (isChartBlock(block)) {
            // Handle disconnecting from chart (both equations and limits)
            return {
              ...block,
              sourceEquationIds: block.sourceEquationIds?.filter(
                (id) =>
                  id !== connection.sourceBlockId &&
                  (!backingEquationId || id !== backingEquationId)
              ),
              sourceLimitIds: block.sourceLimitIds?.filter(
                (id) => id !== connection.sourceBlockId
              ),
            }
          } else if (isControlBlock(block)) {
            return {
              ...block,
              sourceEquationIds: block.sourceEquationIds?.filter(
                (id) =>
                  id !== connection.sourceBlockId &&
                  (!backingEquationId || id !== backingEquationId)
              ),
            }
          } else if (isLimitBlock(block)) {
            return block.targetEquationId === connection.sourceBlockId
              ? { ...block, targetEquationId: undefined }
              : block
          } else if (isVariableBlock(block)) {
            return block.sourceEquationId === connection.sourceBlockId
              ? { ...block, sourceEquationId: undefined, variables: [] }
              : block
          } else if (isLogicBlock(block)) {
            return {
              ...block,
              inputs: (block.inputs || []).filter(
                (id) => id !== connection.sourceBlockId
              ),
            }
          } else if (isComparatorBlock(block)) {
            return {
              ...block,
              leftInput:
                block.leftInput === connection.sourceBlockId
                  ? null
                  : block.leftInput,
              rightInput:
                block.rightInput === connection.sourceBlockId
                  ? null
                  : block.rightInput,
            }
          } else if (isTableBlock(block)) {
            // Handle disconnecting equation from table
            if (block.sourceEquationId === connection.sourceBlockId) {
              return { ...block, sourceEquationId: null }
            }
            // Handle disconnecting limit from table
            if (block.sourceLimitId === connection.sourceBlockId) {
              return { ...block, sourceLimitId: null }
            }
            // Handle disconnecting constraint from table
            if (block.sourceConstraintIds?.includes(connection.sourceBlockId)) {
              return {
                ...block,
                sourceConstraintIds: block.sourceConstraintIds.filter(
                  (id) => id !== connection.sourceBlockId
                ),
              }
            }
          }

          // Handle disconnecting equation from shape
          if (
            isShapeBlock(block) &&
            block.sourceValueId === connection.sourceBlockId
          ) {
            return { ...block, sourceValueId: undefined }
          }

          if (
            isEquationBlock(block) &&
            block.enabledSourceId === connection.sourceBlockId
          ) {
            return { ...block, enabledSourceId: undefined, enabled: true }
          }
        } else if (
          backingEquationId &&
          block.id === backingEquationId &&
          isEquationBlock(block)
        ) {
          return {
            ...block,
            connectedChartIds: block.connectedChartIds?.filter(
              (id) => id !== connection.targetBlockId
            ),
          }
        }

        if (block.id === connection.sourceBlockId && isLogicBlock(block)) {
          return block.output === connection.targetBlockId
            ? { ...block, output: null }
            : block
        }
        if (block.id === connection.sourceBlockId && isComparatorBlock(block)) {
          return block.output === connection.targetBlockId
            ? { ...block, output: null }
            : block
        }
        return block
      })

      setConnections((prev) => prev.filter((c) => c.id !== connectionId))
      setInternalBlocks(updatedBlocks)
      onBlocksChange?.(updatedBlocks)
    },
    [connections, blocks, onBlocksChange]
  )

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      const blockToDelete = blocks.find((b) => b.id === blockId)
      const backingEquationId =
        blockToDelete && isVariableBlock(blockToDelete)
          ? blockToDelete.sourceEquationId
          : undefined

      const updatedBlocks = blocks
        .filter((b) => b.id !== blockId)
        .map((block) => {
          if (isEquationBlock(block)) {
            return {
              ...block,
              connectedChartIds: block.connectedChartIds?.filter(
                (id) => id !== blockId
              ),
              connectedControlIds: block.connectedControlIds?.filter(
                (id) => id !== blockId
              ),
              connectedEquationIds: block.connectedEquationIds?.filter(
                (id) => id !== blockId
              ),
              connectedLimitIds: block.connectedLimitIds?.filter(
                (id) => id !== blockId
              ),
              connectedVariableIds: block.connectedVariableIds?.filter(
                (id) => id !== blockId
              ),
            }
          }

          if (isChartBlock(block) || isControlBlock(block)) {
            return {
              ...block,
              sourceEquationIds: block.sourceEquationIds?.filter(
                (id) =>
                  id !== blockId &&
                  (!backingEquationId || id !== backingEquationId)
              ),
            }
          }

          if (isLimitBlock(block)) {
            return block.targetEquationId === blockId
              ? { ...block, targetEquationId: undefined }
              : block
          }

          if (isVariableBlock(block)) {
            return block.sourceEquationId === blockId
              ? { ...block, sourceEquationId: undefined, variables: [] }
              : block
          }

          return block
        })

      const updatedConnections = connections.filter(
        (c) => c.sourceBlockId !== blockId && c.targetBlockId !== blockId
      )

      setConnections(updatedConnections)
      setInternalBlocks(updatedBlocks)
      onBlocksChange?.(updatedBlocks)

      // Clean up node chain map if provided
      if (nodeChains && onNodeChainsChange) {
        const nextChains = new Map<
          string,
          import("@/lib/block-system/types").NodeChain
        >(
          Array.from(nodeChains.entries()).filter(
            (entry) => entry[1].nodeId !== blockId
          )
        )
        onNodeChainsChange(nextChains)
      }

      if (selectedBlockId === blockId) setSelectedBlockId(undefined)
    },
    [
      blocks,
      connections,
      nodeChains,
      onBlocksChange,
      onNodeChainsChange,
      selectedBlockId,
    ]
  )

  const handleConnectionClick = useCallback((connectionId: string) => {
    setSelectedConnectionId(connectionId)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedConnectionId
      ) {
        handleDeleteConnection(selectedConnectionId)
        setSelectedConnectionId(undefined)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedConnectionId, handleDeleteConnection])

  // ============================================================================
  // BLOCK RENDERING
  // Uses CSS transforms for positioning (performance best practice)
  // ============================================================================

  const renderBlock = (block: Block) => {
    const isSelected = block.id === selectedBlockId
    // During drag, the original block stays in place; only ghost moves
    const isGhostDragging = ghostDrag?.blockId === block.id
    const pos = gridToPixels(block.position)

    const commonProps = {
      isSelected,
      onClick: () => handleBlockClick(block.id),
      onMouseDown: (e: React.MouseEvent) => handleDragStart(e, block),
      onDimensionsChange: (dimensions: { width: number; height: number }) =>
        handleBlockDimensionsChange(block.id, dimensions),
      className: cn(
        "transition-shadow",
        isGhostDragging ? "opacity-50" : "",
        "z-10"
      ),
      // Use CSS transform for positioning (better performance than top/left)
      style: {
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        position: "absolute" as const,
      },
      readOnly: readOnly || isPlaybackMode,
      isConnecting: !!connectionDrag,
      connectingFromType: connectionDrag?.sourceBlockId
        ? blocks.find((b) => b.id === connectionDrag.sourceBlockId)?.type
        : undefined,
      onConnectionStart: (handleId: string) =>
        handleConnectionStart(block.id, handleId),
      onConnectionEnd: (handleId: string) =>
        handleConnectionEnd(block.id, handleId),
    }

    switch (block.type) {
      case "equation":
        return (
          <EquationBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            onEquationChange={(newEquation) => {
              const now = Date.now()
              const parsed = parseEquation(newEquation)
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isEquationBlock(b)) {
                  return {
                    ...b,
                    equation: newEquation,
                    tokens: parsed.tokens,
                    variables: parsed.variables,
                    equationType: parsed.equationType,
                    updatedAt: now,
                  }
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
          />
        )
      case "chart": {
        // Find connected equations from connections array
        const connectedEquationIds = connections
          .filter((c) => c.targetBlockId === block.id && c.type.includes('equation-to-chart'))
          .map((c) => c.sourceBlockId)
        
        const connectedEquations = connectedEquationIds
          .map((id) => blocks.find((b) => b.id === id && isEquationBlock(b)))
          .filter((eq): eq is EquationBlock => Boolean(eq))
        
        // Also check sourceEquationIds for backwards compatibility
        if (connectedEquations.length === 0 && block.sourceEquationIds) {
          const legacyEquations = (block.sourceEquationIds ?? [])
            .map((id) => blocks.find((b) => b.id === id && isEquationBlock(b)))
            .filter((eq): eq is EquationBlock => Boolean(eq))
          connectedEquations.push(...legacyEquations)
        }
        
        const directConstraintIds = connections
          .filter(
            (c) =>
              c.type === "constraint-to-chart" && c.targetBlockId === block.id
          )
          .map((c) => c.sourceBlockId)

        const connectedConstraints = blocks.filter(
          (b): b is ConstraintBlock => {
            if (!isConstraintBlock(b)) return false
            if (directConstraintIds.includes(b.id)) return true
            return (
              !!b.targetEquationId &&
              connectedEquationIds.includes(b.targetEquationId)
            )
          }
        )

        // Build equation -> constraint map for per-equation constraints
        const equationConstraintMap: Record<string, string[]> = {}
        for (const constraint of connectedConstraints) {
          const eqId = constraint.targetEquationId
          if (eqId != null) {
            if (!equationConstraintMap[eqId]) {
              equationConstraintMap[eqId] = []
            }
            equationConstraintMap[eqId].push(constraint.id)
          }
        }

        // Find connected limits from connections array
        const connectedLimitIds = connections
          .filter((c) => c.targetBlockId === block.id && c.type.includes('limit-to-chart'))
          .map((c) => c.sourceBlockId)
        
        const connectedLimits = connectedLimitIds
          .map((id) => blocks.find((b) => b.id === id && isLimitBlock(b)))
          .filter((limit): limit is LimitBlock => Boolean(limit))
        
        // Also check sourceLimitIds for backwards compatibility
        if (connectedLimits.length === 0 && block.sourceLimitIds) {
          const legacyLimits = (block.sourceLimitIds ?? [])
            .map((id) => blocks.find((b) => b.id === id && isLimitBlock(b)))
            .filter((limit): limit is LimitBlock => Boolean(limit))
          connectedLimits.push(...legacyLimits)
        }

        // Get calculated data from node chain (node-based calculation)
        const chainId = nodeChains ? Array.from(nodeChains.entries()).find(([_, c]) => c.nodeId === block.id)?.[0] : undefined
        let calculatedData = chainId && nodeChains?.has(chainId) ? nodeChains.get(chainId)?.calculatedData : undefined
        
        // Fallback: If we have connected limits but no calculatedData, get equation from limit's target
        if (!calculatedData?.equation && connectedLimits.length > 0) {
          const limit = connectedLimits[0]
          if (limit?.targetEquationId) {
            const targetEq = blocks.find(b => b.id === limit.targetEquationId && isEquationBlock(b))
            if (targetEq && isEquationBlock(targetEq)) {
              // Create calculatedData from the target equation
              const variables: Record<string, number> = {}
              ;(targetEq.variables ?? []).forEach((v) => {
                variables[v.name] = v.value
              })
              calculatedData = {
                equation: targetEq.equation,
                variables: targetEq.variables,
                tokens: targetEq.tokens,
                equationType: targetEq.equationType,
                timestamp: Date.now(),
              }
            }
          }
        }

        return (
          <ChartBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            calculatedData={calculatedData}
            connectedEquations={connectedEquations}
            constraints={connectedConstraints}
            equationConstraintMap={equationConstraintMap}
            connectedLimits={connectedLimits}
          />
        )
      }
      case "control":
        return (
          <ControlBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            onVariableChange={(name, value) => {
              const now = Date.now()
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isControlBlock(b)) {
                  if (name.endsWith("__auto")) {
                    const varName = name.replace("__auto", "")
                    const variables = b.variables.map((v) =>
                      v.name === varName
                        ? { ...v, autoAnimate: value === 1 }
                        : v
                    )
                    return { ...b, variables, updatedAt: now }
                  }
                  if (name.endsWith("__speed")) {
                    const varName = name.replace("__speed", "")
                    const numValue =
                      typeof value === "string" ? parseFloat(value) : value
                    const variables = b.variables.map((v) =>
                      v.name === varName
                        ? { ...v, animationSpeed: numValue }
                        : v
                    )
                    return { ...b, variables, updatedAt: now }
                  }
                  if (name.endsWith("__direction")) {
                    const varName = name.replace("__direction", "")
                    const directionValue = String(value)
                    const animationDirection: "oscillate" | "loop" =
                      directionValue === "loop" ? "loop" : "oscillate"
                    const variables = b.variables.map((v) =>
                      v.name === varName ? { ...v, animationDirection } : v
                    )
                    return { ...b, variables, updatedAt: now }
                  }

                  const numValue =
                    typeof value === "string" ? parseFloat(value) : value
                  const variables = b.variables.map((v) =>
                    v.name === name ? { ...v, value: numValue } : v
                  )
                  return { ...b, variables, updatedAt: now }
                }

                if (isEquationBlock(b) && isControlBlock(block)) {
                  if (!block.sourceEquationIds?.includes(b.id)) return b
                  if (
                    name.endsWith("__auto") ||
                    name.endsWith("__speed") ||
                    name.endsWith("__direction")
                  )
                    return b

                  const vars =
                    b.variables ?? parseEquation(b.equation).variables
                  if (!vars.some((v) => v.name === name)) return b
                  const numValue =
                    typeof value === "string" ? parseFloat(value) : value
                  const updatedVars = vars.map((v) =>
                    v.name === name ? { ...v, value: numValue } : v
                  )
                  return { ...b, variables: updatedVars, updatedAt: now }
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
          />
        )
      case "description":
        return (
          <DescriptionBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            onContentChange={(value) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && b.type === "description") {
                  return { ...b, content: value, updatedAt: Date.now() }
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
          />
        )
      case "limit":
        return (
          <LimitBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            connectedEquation={(() => {
              if (!isLimitBlock(block) || !block.targetEquationId) return null
              const eq = blocks.find(
                (b) => b.id === block.targetEquationId && isEquationBlock(b)
              )
              if (!eq || !isEquationBlock(eq)) return null
              return eq
            })()}
            variableOptions={(() => {
              if (!isLimitBlock(block) || !block.targetEquationId)
                return undefined
              const eq = blocks.find(
                (b) => b.id === block.targetEquationId && isEquationBlock(b)
              )
              if (!eq || !isEquationBlock(eq)) return undefined
              const vars = eq.variables ?? parseEquation(eq.equation).variables
              return vars.map((v) => v.name)
            })()}
            onVariableChange={(varName, value) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isLimitBlock(b)) {
                  if (varName === "variableName" && typeof value === "string") {
                    return { ...b, variableName: value, updatedAt: Date.now() }
                  }
                  if (varName === "limitValue" && typeof value === "number") {
                    return { ...b, limitValue: value, updatedAt: Date.now() }
                  }
                  if (varName === "isInfinite") {
                    return { ...b, isInfinite: value === 1, updatedAt: Date.now() }
                  }
                  if (varName === "infiniteDirection" && typeof value === "string") {
                    return { ...b, infiniteDirection: value as "positive" | "negative", updatedAt: Date.now() }
                  }
                  return b
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
          />
        )
      case "shape": {
        // Find connected equation (from sourceValueId)
        const connectedEquation =
          isShapeBlock(block) && block.sourceValueId
            ? blocks.find(
                (b) => b.id === block.sourceValueId && b.type === "equation"
              )
            : undefined

        // Find connected logic/comparator blocks (from connections)
        const connectedLogicBlock = connections
          .filter((c) => c.targetBlockId === block.id && c.sourceBlockId)
          .map((c) => blocks.find((b) => b.id === c.sourceBlockId))
          .find((b) => b?.type === "logic")

        const connectedComparatorBlock = connections
          .filter((c) => c.targetBlockId === block.id && c.sourceBlockId)
          .map((c) => blocks.find((b) => b.id === c.sourceBlockId))
          .find((b) => b?.type === "comparator")

        return (
          <ShapeBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            connectedEquation={
              connectedEquation && isEquationBlock(connectedEquation)
                ? connectedEquation
                : null
            }
            connectedLogic={
              connectedLogicBlock && isLogicBlock(connectedLogicBlock)
                ? connectedLogicBlock
                : null
            }
            connectedComparator={
              connectedComparatorBlock &&
              isComparatorBlock(connectedComparatorBlock)
                ? connectedComparatorBlock
                : null
            }
            onFillValueChange={(value) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isShapeBlock(b)) {
                  return { ...b, fillValue: value, updatedAt: Date.now() }
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
            onFillColorChange={(color) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isShapeBlock(b)) {
                  return { ...b, fillColor: color, updatedAt: Date.now() }
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
            onFillModeChange={(mode) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isShapeBlock(b)) {
                  return { ...b, fillMode: mode, updatedAt: Date.now() }
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
            onShapeTypeChange={(shapeType) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isShapeBlock(b)) {
                  return { ...b, shapeType, updatedAt: Date.now() }
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
            onGridToggle={() => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isShapeBlock(b)) {
                  return { ...b, showGrid: !b.showGrid, updatedAt: Date.now() }
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
          />
        )
      }
      case "logic":
        return (
          <LogicBlockComponent key={block.id} block={block} {...commonProps} />
        )
      case "comparator":
        return (
          <ComparatorBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
          />
        )
      case "constraint":
        return (
          <ConstraintBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            variableOptions={(() => {
              if (!isConstraintBlock(block) || !block.targetEquationId)
                return []
              const eq = blocks.find(
                (b) => b.id === block.targetEquationId && b.type === "equation"
              )
              if (!eq || !isEquationBlock(eq)) return []
              const vars = eq.variables ?? parseEquation(eq.equation).variables
              const names = Array.from(new Set(vars.map((v) => v.name))).sort()
              return names.length ? names : []
            })()}
            onConstraintChange={(next) => {
              const now = Date.now()
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isConstraintBlock(b)) {
                  return { ...b, ...next, updatedAt: now }
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
          />
        )
      case "variable":
        return (
          <VariableBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            onVariableChange={(name, value) => {
              const now = Date.now()
              const updatedBlocks = blocks.map((b) => {
                // Update the variable slider block itself
                if (b.id === block.id && isVariableBlock(b)) {
                  const variables = b.variables.map((v) =>
                    v.name === name ? { ...v, value } : v
                  )
                  return { ...b, variables, updatedAt: now }
                }

                // If this variable block is connected to an equation, push values into that equation's variables
                if (
                  isVariableBlock(block) &&
                  block.sourceEquationId &&
                  b.id === block.sourceEquationId &&
                  isEquationBlock(b)
                ) {
                  const baseVars =
                    b.variables ?? parseEquation(b.equation).variables
                  const variables = baseVars.map((v) =>
                    v.name === name ? { ...v, value } : v
                  )
                  return { ...b, variables, updatedAt: now }
                }

                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
          />
        )
      case "table": {
        // Find connected equations from connections array
        const connectedEquationIds = connections
          .filter((c) => c.targetBlockId === block.id && c.type.includes('equation-to-table'))
          .map((c) => c.sourceBlockId)
        
        let connectedEquation: EquationBlock | null = null
        if (connectedEquationIds.length > 0) {
          const eq = blocks.find((b) => b.id === connectedEquationIds[0] && isEquationBlock(b))
          if (eq && isEquationBlock(eq)) connectedEquation = eq
        }
        
        // Also check sourceEquationId for backwards compatibility
        if (!connectedEquation && block.sourceEquationId) {
          const eq = blocks.find((b) => b.id === block.sourceEquationId && isEquationBlock(b))
          if (eq && isEquationBlock(eq)) connectedEquation = eq
        }
        
        // Find connected limits from connections array
        const connectedLimitIds = connections
          .filter((c) => c.targetBlockId === block.id && c.type.includes('limit-to-table'))
          .map((c) => c.sourceBlockId)
        
        let connectedLimit: LimitBlock | null = null
        if (connectedLimitIds.length > 0) {
          const limit = blocks.find((b) => b.id === connectedLimitIds[0] && isLimitBlock(b))
          if (limit && isLimitBlock(limit)) connectedLimit = limit
        }
        
        // Also check sourceLimitId for backwards compatibility
        if (!connectedLimit && block.sourceLimitId) {
          const limit = blocks.find((b) => b.id === block.sourceLimitId && isLimitBlock(b))
          if (limit && isLimitBlock(limit)) connectedLimit = limit
        }
        
        // Get connected constraints for filtering table values
        const connectedConstraintIds = connections
          .filter((c) => c.targetBlockId === block.id && c.type.includes('constraint-to-table'))
          .map((c) => c.sourceBlockId)
        
        const connectedConstraints = connectedConstraintIds
          .map((id) => blocks.find((b) => b.id === id && isConstraintBlock(b)))
          .filter((c): c is ConstraintBlock => Boolean(c))
        
        // Also check sourceConstraintIds for backwards compatibility
        if (connectedConstraints.length === 0 && block.sourceConstraintIds) {
          const legacyConstraints = (block.sourceConstraintIds ?? [])
            .map((id) => blocks.find((b) => b.id === id && isConstraintBlock(b)))
            .filter((c): c is ConstraintBlock => Boolean(c))
          connectedConstraints.push(...legacyConstraints)
        }

        // Get equation from constraint's target equation if no direct connection
        let equationFromConstraint: EquationBlock | null = null
        if (!connectedEquation && connectedConstraints.length > 0) {
          const constraintWithEquation = connectedConstraints.find((c) => c.targetEquationId)
          if (constraintWithEquation?.targetEquationId) {
            const eq = blocks.find((b) => b.id === constraintWithEquation.targetEquationId && isEquationBlock(b))
            if (eq && isEquationBlock(eq)) equationFromConstraint = eq
          }
        }

        return (
          <TableBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            connectedEquation={connectedEquation || equationFromConstraint}
            connectedLimit={connectedLimit}
            connectedConstraints={connectedConstraints}
            onColumnChange={(columns) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isTableBlock(b)) {
                  return { ...b, columns, updatedAt: Date.now() }
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
            onRowChange={(rows) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isTableBlock(b)) {
                  return { ...b, rows, updatedAt: Date.now() }
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
            onSettingsChange={(settings) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isTableBlock(b)) {
                  return {
                    ...b,
                    ...settings,
                    updatedAt: Date.now(),
                  }
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
          />
        )
      }
    }
  }

  return (
    <div className={cn("relative flex h-full w-full flex-col", className)}>
      {/* Top Toolbar - Hidden in playback mode */}
      {!isPlaybackMode && (
        <>
          {!canRecord && (
            <div className="container mx-auto p-4">
              <span>
                {isAdmin || isCreator
                  ? "You can record lessons now."
                  : "Recording is only available for creators and admins. Upgrade to creator to record lessons."}
              </span>
            </div>
          )}
          <div className="z-20 flex items-center justify-end gap-4 border-b border-border bg-card p-2 shadow-sm">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={gridVisible}
                onCheckedChange={(checked) => setGridVisible(checked)}
              />
              Show Grid
            </label>
            {canRecord && (
              <RecordingControls
                isRecording={
                  recordingState.status === "recording" ||
                  recordingState.status === "paused"
                }
                isPaused={recordingState.status === "paused"}
                currentTime={recordingState.currentTime}
                onStart={() => void startRecording()}
                onStop={() => void stopRecording()}
                onPause={pauseRecording}
                onResume={resumeRecording}
                onCreateBookmark={createBookmark}
              />
            )}
          </div>
        </>
      )}

      {/* Canvas Container */}
      <ContextMenu>
        <ContextMenuTrigger
          ref={(el) => {
            if (el) {
              canvasRef.current = el
            }
          }}
          className="relative flex-1 overflow-hidden bg-background select-none"
          onContextMenuCapture={(e) => {
            const target = e.target instanceof Element ? e.target : null
            const blockEl = target?.closest("[data-block-id]")
            const connectionEl = target?.closest("[data-connection-id]")
            const blockId =
              blockEl instanceof HTMLElement
                ? blockEl.dataset?.blockId
                : undefined
            const connectionId =
              connectionEl instanceof HTMLElement
                ? connectionEl.dataset?.connectionId
                : undefined

            setContextTarget({ blockId, connectionId })
            if (blockId) setSelectedBlockId(blockId)
            if (connectionId) setSelectedConnectionId(connectionId)
          }}
          onClick={() => setSelectedBlockId(undefined)}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={(e) => {
            handleCanvasMouseMove(e)
            handleDragMove(e)
            handleConnectionMove(e)
          }}
          onMouseUp={() => {
            handleCanvasMouseUp()
            handleDragEnd()
          }}
          onMouseLeave={() => {
            handleCanvasMouseUp()
            handleDragEnd()
          }}
          onWheel={handleWheel}
          onDragStart={handleCanvasDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        >
          {/* Zoom/Pan Controls */}
          {!isPlaybackMode && (
            <div className="absolute right-4 bottom-4 z-30 flex items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-lg">
              <button
                onClick={() => zoomOut()}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-lg hover:bg-accent"
                disabled={transform.scale <= 0.25}
              >
                −
              </button>
              <span className="min-w-[3rem] text-center text-sm font-medium">
                {Math.round(transform.scale * 100)}%
              </span>
              <button
                onClick={() => zoomIn()}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-lg hover:bg-accent"
                disabled={transform.scale >= 3}
              >
                +
              </button>
              <button
                onClick={resetTransform}
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-xs hover:bg-accent"
                title="Reset view"
              >
                ⟲
              </button>
            </div>
          )}

          {/*
          TRANSFORMED CONTENT LAYER
          Both grid and nodes share the same transform for consistency
        */}
          <div
            className="absolute inset-0 origin-top-left"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              width: "100%",
              height: "100%",
            }}
          >
            {/* Grid Layer (DOM-based for simplicity, can be canvas for better perf) */}
            {gridVisible && (
              <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                  linear-gradient(to right, oklch(0.542 0.034 322.5 / 0.3) 1px, transparent 1px),
                  linear-gradient(to bottom, oklch(0.542 0.034 322.5 / 0.3) 1px, transparent 1px)
                `,
                  backgroundSize: `${GRID_UNIT}px ${GRID_UNIT}px`,
                }}
              />
            )}

            {/* HTML Node Layer - Blocks rendered with transform positioning */}
            {blocks.map(renderBlock)}
          </div>

          {/*
          GHOST DRAG PREVIEW
          Rendered outside transform to avoid double-scaling
          Shows where the block will be placed (with snapping visual)
        */}
          {ghostDrag &&
            (() => {
              const draggedBlock = blocks.find(
                (b) => b.id === ghostDrag.blockId
              )
              if (!draggedBlock) return null

              // Convert preview grid position to screen coordinates
              const screenPos = worldToScreen(
                ghostDrag.previewPosition.x * GRID_UNIT,
                ghostDrag.previewPosition.y * GRID_UNIT
              )

              const widthPx =
                ghostDrag.dimensions.width * GRID_UNIT * transform.scale
              const heightPx =
                ghostDrag.dimensions.height * GRID_UNIT * transform.scale

              return (
                <div
                  className="pointer-events-none absolute z-50"
                  style={{
                    left: screenPos.x,
                    top: screenPos.y,
                    width: widthPx,
                    height: heightPx,
                  }}
                >
                  {/* Ghost outline with snap indicator */}
                  <div
                    className={cn(
                      "h-full w-full rounded-lg border-2",
                      ghostDrag.snappedToEdge || ghostDrag.snappedToCenter
                        ? "border-green-500 bg-green-500/20"
                        : "border-primary bg-primary/20"
                    )}
                  />
                </div>
              )
            })()}

          {/* Snapping Guide Lines */}
          {ghostDrag &&
            ghostDrag.guideLines &&
            ghostDrag.guideLines.length > 0 &&
            (() => {
              // Guide lines are in world coordinates, need to convert to screen
              const lines = ghostDrag.guideLines
              return (
                <svg
                  className="pointer-events-none absolute inset-0"
                  style={{ zIndex: 40, width: "100%", height: "100%" }}
                >
                  {lines.map((line, i) => {
                    // Convert world position to screen position
                    const screenPos =
                      line.type === "vertical"
                        ? worldToScreen(line.position, 0).x
                        : worldToScreen(0, line.position).y

                    return line.type === "vertical" ? (
                      <line
                        key={i}
                        x1={screenPos}
                        y1={0}
                        x2={screenPos}
                        y2="100%"
                        stroke={line.source === "edge" ? "#22c55e" : "#3b82f6"}
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        opacity="0.6"
                      />
                    ) : (
                      <line
                        key={i}
                        x1={0}
                        y1={screenPos}
                        x2="100%"
                        y2={screenPos}
                        stroke={line.source === "edge" ? "#22c55e" : "#3b82f6"}
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        opacity="0.6"
                      />
                    )
                  })}
                </svg>
              )
            })()}

          {/* Connection Layer */}
          <ConnectionLayer
            blocks={blocks}
            connections={connections}
            selectedConnectionId={selectedConnectionId}
            onConnectionClick={handleConnectionClick}
            zoom={transform.scale}
            pan={{ x: transform.x, y: transform.y }}
          />

          {/* Connection Preview (while dragging) */}
          {connectionDrag &&
            (() => {
              const sourceBlock = blocks.find(
                (b) => b.id === connectionDrag.sourceBlockId
              )
              if (!sourceBlock) return null

              const startPos = {
                x:
                  (sourceBlock.position.x * GRID_UNIT +
                    sourceBlock.dimensions.width * GRID_UNIT) *
                    transform.scale +
                  transform.x,
                y:
                  (sourceBlock.position.y * GRID_UNIT +
                    (sourceBlock.dimensions.height * GRID_UNIT) / 2) *
                    transform.scale +
                  transform.y,
              }

              const endPos = {
                x: connectionDrag.currentX * transform.scale + transform.x,
                y: connectionDrag.currentY * transform.scale + transform.y,
              }

              return (
                <svg
                  className="pointer-events-none absolute inset-0"
                  style={{ zIndex: 1000, width: "100%", height: "100%" }}
                >
                  <ConnectionPreview
                    startX={startPos.x}
                    startY={startPos.y}
                    endX={endPos.x}
                    endY={endPos.y}
                    isValid={true}
                  />
                </svg>
              )
            })()}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {contextTarget?.connectionId && (
            <>
              <ContextMenuItem
                variant="destructive"
                onClick={() => {
                  if (contextTarget?.connectionId) {
                    handleDeleteConnection(contextTarget.connectionId)
                  }
                }}
              >
                Delete connection
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          {contextTarget?.blockId && (
            <ContextMenuItem
              variant="destructive"
              onClick={() => {
                if (contextTarget?.blockId) {
                  handleDeleteBlock(contextTarget.blockId)
                }
              }}
            >
              Delete node
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Recording Status Bar */}
      {canRecord &&
        (recordingState.status === "recording" ||
          recordingState.status === "paused" ||
          recordingState.audioSegments.length > 0) && (
          <RecordingStatusBar
            isRecording={recordingState.status === "recording"}
            isPaused={recordingState.status === "paused"}
            currentTime={recordingState.currentTime}
            events={recordingState.events}
            audioSegments={recordingState.audioSegments}
          />
        )}
    </div>
  )
}

export default GridCanvas
