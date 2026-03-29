"use client"

import { useState, useCallback, useRef } from "react"
import { GridCanvas } from "@/components/blocks/grid-canvas"
import { BlockLibrary } from "@/components/blocks/block-library"
import type { BlockPreset } from "@/components/blocks/block-library"
import type { Block, NodeChain, GridPosition, BlockDimensions } from "@/lib/block-system/types"
import {
  findNearestValidPosition,
  parseEquation,
  createNodeChain,
  getDefaultBlockDimensions,
} from "@/lib/block-system/types"
import { useUserRole } from "@/hooks/use-user-role"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import Link from "next/link"
import {
  connectNodeChains,
  disconnectNodeChains,
} from "@/lib/block-system/types"

/**
 * Canvas Page - Main workspace for node tree-based math visualization.
 *
 * NODE TREE ARCHITECTURE:
 * - Each block has a nodeChainId that links it to a chain structure
 * - Chains have prev (input) and next (output) pointers
 * - Data flows from source nodes through the chain
 * - Charts can traverse back through the chain to get all inputs
 *
 * Features:
 * - Chain-based connections (add to beginning or end of chain)
 * - Visual chain indicators showing data flow
 * - Easy tracking of data through the pipeline
 * - Support for branching (one node -> multiple outputs)
 * - Piecewise function templates
 * - Undo/Redo support
 * - Block deletion with cleanup
 *
 * Example chains:
 * 1. Equation -> Variable Slider -> Limiter -> Chart
 * 2. Equation (x=2) -> Equation (y=3) -> Equation (y=x) -> Chart -> Shape
 * 3. Limiter (x approaching 10) -> Chart (shows all near values)
 *
 * Recording Permissions:
 * - Only admins and creators can record lessons
 * - Students can use the canvas but cannot record
 */
export default function CanvasPage() {
  return <CanvasContent />
}

function CanvasContent() {
  const { canRecord, isCreator, isAdmin } = useUserRole()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [nodeChains, setNodeChains] = useState<Map<string, NodeChain>>(
    new Map()
  )
  
  // Undo/Redo history
  const historyRef = useRef<{ blocks: Block[]; nodeChains: Map<string, NodeChain> }[]>([])
  const futureRef = useRef<{ blocks: Block[]; nodeChains: Map<string, NodeChain> }[]>([])
  const MAX_HISTORY = 50

  const addToHistory = useCallback((newBlocks: Block[], newChains: Map<string, NodeChain>) => {
    historyRef.current.push({
      blocks: JSON.parse(JSON.stringify(newBlocks)),
      nodeChains: new Map(newChains),
    })
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift()
    }
    futureRef.current = [] // Clear future on new action
  }, [])

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return
    const previous = historyRef.current.pop()!
    futureRef.current.push({
      blocks: JSON.parse(JSON.stringify(blocks)),
      nodeChains: new Map(nodeChains),
    })
    setBlocks(previous.blocks)
    setNodeChains(previous.nodeChains)
  }, [blocks, nodeChains])

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return
    const next = futureRef.current.pop()!
    historyRef.current.push({
      blocks: JSON.parse(JSON.stringify(blocks)),
      nodeChains: new Map(nodeChains),
    })
    setBlocks(next.blocks)
    setNodeChains(next.nodeChains)
  }, [blocks, nodeChains])

  const createBlockFromPreset = (
    preset: BlockPreset,
    position: GridPosition
  ): Block => {
    const dimensions = getDefaultBlockDimensions(preset.type)
    const baseBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dimensions,
    }

    switch (preset.type) {
      case "equation": {
        const equation = preset.data.equation ?? ""
        const parsed = parseEquation(equation)
        return {
          ...baseBlock,
          type: "equation",
          equation,
          tokens: parsed?.tokens,
          variables: parsed?.variables,
          equationType: parsed?.equationType,
        }
      }
      case "chart":
        return {
          ...baseBlock,
          type: "chart",
          equations: [],
          dimensions: preset.data.dimensions ?? dimensions,
        }
      case "description": {
        const format = preset.data.format ?? "plain"
        return {
          ...baseBlock,
          type: "description",
          content: "Double-click to edit...",
          format,
        }
      }
      case "limit": {
        const variableName = preset.data.variableName ?? "x"
        const limitValue = preset.data.limitValue ?? 0
        const approach = preset.data.approach ?? "both"
        const limitType = preset.data.limitType ?? approach
        const isInfinite = preset.data.isInfinite ?? false
        const infiniteDirection = preset.data.infiniteDirection ?? "positive"
        return {
          ...baseBlock,
          type: "limit",
          variableName,
          limitValue,
          approach,
          limitType,
          isInfinite,
          infiniteDirection,
        }
      }
      case "shape": {
        const shapeType = preset.data.shapeType ?? "square"
        const fillColor = preset.data.fillColor ?? "#7c3aed"
        const fillValue = preset.data.fillValue ?? 50
        const fillMode = preset.data.fillMode ?? "percentage"
        return {
          ...baseBlock,
          type: "shape",
          shapeType,
          fillColor,
          fillValue,
          fillMode,
          showGrid: true,
          rows: 10,
          cols: 10,
        }
      }
      case "logic": {
        const logicType = preset.data.logicType ?? "and"
        return {
          ...baseBlock,
          type: "logic",
          logicType,
          inputs: [],
          output: null,
        }
      }
      case "comparator": {
        const operator = preset.data.operator ?? "eq"
        return {
          ...baseBlock,
          type: "comparator",
          operator,
          leftInput: null,
          rightInput: null,
          output: null,
        }
      }
      case "constraint": {
        const variableName = preset.data.variableName ?? "x"
        const constraintType = preset.data.constraintType ?? "gte"
        const constraintValue = preset.data.constraintValue ?? 0
        return {
          ...baseBlock,
          type: "constraint",
          variableName,
          constraint: {
            type: constraintType,
            min: constraintType === "range" ? constraintValue : constraintValue,
            max: constraintType === "range" ? 100 : undefined,
          },
        }
      }
      case "variable": {
        const layout = preset.data.layout ?? "vertical"
        return {
          ...baseBlock,
          type: "variable",
          layout,
          variables: [],
        }
      }
      case "table": {
        const autoGenerateRows = preset.data.autoGenerateRows ?? true
        const variableName = preset.data.variableName ?? "x"
        const showGrid = preset.data.showGrid ?? true
        const highlightLastRow = preset.data.highlightLastRow ?? true
        return {
          ...baseBlock,
          type: "table",
          sourceEquationId: null,
          sourceLimitId: null,
          columns: [],
          rows: [],
          autoGenerateRows,
          variableName,
          showGrid,
          highlightLastRow,
          dimensions: preset.data.dimensions ?? dimensions,
        }
      }
      case "piecewise-limiter": {
        const variableName = preset.data.variableName ?? "x"
        const constraint = preset.data.constraint ?? { type: "lt" as const, min: 0 }
        const enabled = preset.data.enabled ?? true
        return {
          ...baseBlock,
          type: "piecewise-limiter",
          sourceEquationId: null,
          variableName,
          constraint,
          enabled,
        }
      }
      case "piecewise-builder": {
        const connectedLimiterIds = preset.data.connectedLimiterIds ?? []
        const fallbackEnabled = preset.data.fallbackEnabled ?? true
        const fallbackEquation = preset.data.fallbackEquation ?? "0"
        return {
          ...baseBlock,
          type: "piecewise-builder",
          connectedLimiterIds,
          fallbackEnabled,
          fallbackEquation,
        }
      }
    }
  }

  /**
   * Connect two blocks in a chain (source -> target)
   * This creates a directional data flow from source to target
   */
  const connectBlocks = useCallback(
    (sourceBlockId: string, targetBlockId: string) => {
      setNodeChains((prevChains) => {
        const newChains = new Map(prevChains)
        const sourceChain = Array.from(newChains.values()).find(
          (c) => c.nodeId === sourceBlockId
        )
        const targetChain = Array.from(newChains.values()).find(
          (c) => c.nodeId === targetBlockId
        )

        if (sourceChain && targetChain) {
          connectNodeChains(sourceChain, targetChain, newChains)
        }

        return newChains
      })
    },
    []
  )

  /**
   * Disconnect two blocks in a chain
   */
  const disconnectBlocks = useCallback(
    (sourceBlockId: string, targetBlockId: string) => {
      setNodeChains((prevChains) => {
        const newChains = new Map(prevChains)
        const sourceChain = Array.from(newChains.values()).find(
          (c) => c.nodeId === sourceBlockId
        )
        const targetChain = Array.from(newChains.values()).find(
          (c) => c.nodeId === targetBlockId
        )

        if (sourceChain && targetChain) {
          disconnectNodeChains(sourceChain, targetChain, newChains)
        }

        return newChains
      })
    },
    []
  )

  const handleBlockDrop = (preset: BlockPreset, position: GridPosition) => {
    const newBlock = createBlockFromPreset(preset, position)
    const validPosition = findNearestValidPosition(
      position,
      newBlock.dimensions,
      blocks
    )
    const blockWithPosition = { ...newBlock, position: validPosition }

    // Create a node chain for the new block
    const chain = createNodeChain(
      blockWithPosition.id,
      blockWithPosition.type,
      validPosition,
      blockWithPosition.dimensions
    )
    
    const newBlocks = [...blocks, blockWithPosition]
    const newChains = new Map(nodeChains).set(chain.id, chain)
    
    addToHistory(newBlocks, newChains)
    setNodeChains(newChains)
    setBlocks(newBlocks)
  }

  const handleBlockSelect = (preset: BlockPreset) => {
    const centerPosition: GridPosition = { x: 10, y: 10 }
    const newBlock = createBlockFromPreset(preset, centerPosition)
    const validPosition = findNearestValidPosition(
      centerPosition,
      newBlock.dimensions,
      blocks
    )
    const blockWithPosition = { ...newBlock, position: validPosition }

    // Create a node chain for the new block
    const chain = createNodeChain(
      blockWithPosition.id,
      blockWithPosition.type,
      validPosition,
      blockWithPosition.dimensions
    )
    
    const newBlocks = [...blocks, blockWithPosition]
    const newChains = new Map(nodeChains).set(chain.id, chain)

    addToHistory(newBlocks, newChains)
    setNodeChains(newChains)
    setBlocks(newBlocks)
  }

  /**
   * Handle block deletion with proper cleanup
   */
  const handleBlockDelete = useCallback((blockId: string) => {
    const newBlocks = blocks.filter(b => b.id !== blockId)
    const newChains = new Map(nodeChains)
    
    // Find and remove the chain for this block
    for (const [chainId, chain] of newChains.entries()) {
      if (chain.nodeId === blockId) {
        // Disconnect from prev and next
        if (chain.prev) {
          const prevChain = newChains.get(chain.prev)
          if (prevChain) {
            prevChain.next = prevChain.next.filter(id => id !== chainId)
          }
        }
        for (const nextId of chain.next) {
          const nextChain = newChains.get(nextId)
          if (nextChain) {
            nextChain.prev = null
          }
        }
        newChains.delete(chainId)
        break
      }
    }
    
    addToHistory(newBlocks, newChains)
    setBlocks(newBlocks)
    setNodeChains(newChains)
  }, [blocks, nodeChains, addToHistory])

  /**
   * Handle blocks change with history tracking
   */
  const handleBlocksChange = (newBlocks: Block[]) => {
    // Only add to history if blocks actually changed
    const blocksChanged = blocks.length !== newBlocks.length || 
      blocks.some((b, i) => b.id !== newBlocks[i]?.id || b.updatedAt !== newBlocks[i]?.updatedAt)
    
    if (blocksChanged) {
      addToHistory(newBlocks, nodeChains)
    }
    setBlocks(newBlocks)
  }

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Undo: Ctrl+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
    }
    // Redo: Ctrl+Shift+Z or Ctrl+Y
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault()
      redo()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault()
      redo()
    }
  }, [undo, redo])

  return (
    <div className="flex h-screen w-full">
      <BlockLibrary
        onBlockSelect={handleBlockSelect}
      />
      <div className="flex-1 space-y-4">
        <GridCanvas
          blocks={blocks}
          nodeChains={nodeChains}
          onBlocksChange={handleBlocksChange}
          onNodeChainsChange={setNodeChains}
          onBlockDrop={handleBlockDrop}
          onBlockDelete={handleBlockDelete}
          onConnectBlocks={connectBlocks}
          onDisconnectBlocks={disconnectBlocks}
          onKeyDown={handleKeyDown}
          canRecord={canRecord}
        />
      </div>
    </div>
  )
}
