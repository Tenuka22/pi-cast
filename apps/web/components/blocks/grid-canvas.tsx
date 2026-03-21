"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { cn } from "@workspace/ui/lib/utils"
import {
  GRID_UNIT,
  type Block,
  type GridPosition,
  type DragState,
  type EquationBlock,
  type ChartBlock,
  type ControlBlock,
  type DescriptionBlock,
  type LimitBlock,
  type BlockConnection,
  parseEquation,
  gridToPixels,
  pixelsToGrid,
  findNearestValidPosition,
  autoArrangeNeighbors,
  getDefaultBlockDimensions,
  getConnectionType,
} from "@/lib/block-system/types"
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
} from "./block-components"
import { ConnectionLayer } from "@/components/connections/connection-layer"
import { ConnectionPreview } from "@/components/connections/connection-line"
import { useRecording } from "@/lib/recording-system/use-recording"
import { RecordingControls } from "@/components/recording/recording-controls"
import { RecordingStatusBar } from "@/components/recording/recording-status-bar"

// Type guard functions to avoid type assertions
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

interface GridCanvasProps {
  className?: string
  onBlocksChange?: (blocks: Block[]) => void
  onBlockDrop?: (preset: BlockPreset, position: GridPosition) => void

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
  readOnly = false,
}: GridCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [internalBlocks, setInternalBlocks] = useState<Block[]>([])
  const blocks = externalBlocks ?? internalBlocks
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>()
  const [gridVisible, setGridVisible] = useState(true)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const isDraggingRef = useRef(false)

  // Connection state
  const [connections, setConnections] = useState<BlockConnection[]>([])
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | undefined
  >()
  const [connectionDrag, setConnectionDrag] = useState<{
    sourceBlockId: string
    sourceHandleId: string
    currentX: number
    currentY: number
  } | null>(null)

  // Pan and zoom state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0 })
  const panOffsetRef = useRef({ x: 0, y: 0 })

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
            // Oscillate: 0 → 1 → 0
            const oscillateProgress =
              progress < 0.5 ? progress * 2 : (1 - progress) * 2
            newValue =
              variable.min + oscillateProgress * (variable.max - variable.min)
          } else {
            // Loop: 0 → 1 → 0 (jump back)
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

  // Recording system integration
  const {
    state: recordingState,
    start: startRecording,
    stop: stopRecording,
    pause: pauseRecording,
    resume: resumeRecording,
    createBookmark,
    recordBlockPlaced,
    recordBlockMoved,
  } = useRecording({
    metadata: {
      lessonTitle: "Untitled Lesson",
    },
  })

  useEffect(() => {
    if (canvasRef.current) {
      const { clientWidth, clientHeight } = canvasRef.current
      setViewportSize({ width: clientWidth, height: clientHeight })
    }
  }, [])

  const handleBlockClick = useCallback(
    (blockId: string) => {
      setSelectedBlockId(blockId)
      // Trigger interaction callback for playback mode
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
    [blocks, externalBlocks, isPlaybackMode, onBlockModification, onBlocksChange, readOnly]
  )

  const handleDragStart = useCallback((e: React.MouseEvent, block: Block) => {
    e.stopPropagation()
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const blockPos = gridToPixels(block.position)

    setDragState({
      isDragging: true,
      blockId: block.id,
      startPosition: block.position,
      currentPosition: block.position,
      offset: { x: mouseX - blockPos.x, y: mouseY - blockPos.y },
    })
    isDraggingRef.current = true
  }, [])

  const handleDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState || !isDraggingRef.current || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left - dragState.offset.x
      const mouseY = e.clientY - rect.top - dragState.offset.y
      setDragState(
        (prev) =>
          prev && { ...prev, currentPosition: pixelsToGrid(mouseX, mouseY) }
      )
    },
    [dragState]
  )

  const handleDragEnd = useCallback(() => {
    if (!dragState) return
    const block = blocks.find((b) => b.id === dragState.blockId)
    if (!block) return

    const validPosition = findNearestValidPosition(
      dragState.currentPosition,
      block.dimensions,
      blocks,
      block.id
    )
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
      if (b.id === block.id) return updatedBlock
      return b
    })

    // Record block moved event if recording
    if (
      dragState.startPosition.x !== validPosition.x ||
      dragState.startPosition.y !== validPosition.y
    ) {
      recordBlockMoved(block.id, dragState.startPosition, validPosition)
    }

    if (!isPlaybackMode) {
      setInternalBlocks(newBlocks)
    }
    onBlocksChange?.(newBlocks)
    setDragState(null)
    isDraggingRef.current = false
  }, [dragState, blocks, onBlocksChange, recordBlockMoved, isPlaybackMode])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const handleCanvasDragStart = useCallback((e: React.DragEvent) => {
    // Prevent HTML5 native drag for blocks on canvas (we use custom mouse-based dragging)
    // Only allow HTML5 drag for items coming from the block library
    const target = e.target as HTMLElement
    const isFromLibrary = target.closest("[data-block-library-item]") !== null
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

      let preset: BlockPreset
      try {
        const parsed: unknown = JSON.parse(data)
        // Validate that parsed data has the expected structure
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "type" in parsed &&
          typeof (parsed as Record<string, unknown>).type === "string"
        ) {
          preset = parsed as BlockPreset
        } else {
          return
        }
      } catch {
        return
      }

      const rect = canvasRef.current.getBoundingClientRect()
      const scrollLeft = canvasRef.current.scrollLeft
      const scrollTop = canvasRef.current.scrollTop
      const x = e.clientX - rect.left + scrollLeft
      const y = e.clientY - rect.top + scrollTop
      const gridPosition = pixelsToGrid(x, y)

      onBlockDrop?.(preset, gridPosition)
    },
    [readOnly, isPlaybackMode, onBlockDrop]
  )

  // Pan handlers
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse button or Alt + click to pan
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault()
        setIsPanning(true)
        panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
        panOffsetRef.current = { x: pan.x, y: pan.y }
      }
    },
    [pan]
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        e.preventDefault()
        setPan({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        })
      }
    },
    [isPanning]
  )

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleZoom = useCallback((delta: number) => {
    setZoom((prev) => {
      const newZoom = Math.min(Math.max(prev + delta, 0.25), 3)
      return Math.round(newZoom * 100) / 100
    })
  }, [])

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

  // Connection handlers
  const handleConnectionStart = useCallback(
    (blockId: string, handleId: string) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      if (!canvasRect) return

      // We'll get the mouse position from the subsequent move events
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
      // Calculate position in screen coordinates, then convert to grid coordinates
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      // Convert to grid space (accounting for pan and zoom)
      const gridX = (screenX - pan.x) / zoom
      const gridY = (screenY - pan.y) / zoom

      setConnectionDrag((prev) =>
        prev ? { ...prev, currentX: gridX, currentY: gridY } : null
      )
    },
    [connectionDrag, pan, zoom]
  )

  // Document-level mouse handlers for connection dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!connectionDrag || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      const gridX = (screenX - pan.x) / zoom
      const gridY = (screenY - pan.y) / zoom

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
  }, [connectionDrag, pan, zoom])

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

      // Check if connection already exists
      const existingConnection = connections.find(
        (c) =>
          c.sourceBlockId === sourceBlock.id &&
          c.targetBlockId === targetBlock.id
      )
      if (existingConnection) {
        setConnectionDrag(null)
        return
      }

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

      // Update block connection tracking
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
        } else if (block.id === targetBlock.id) {
          if (isChartBlock(targetBlock)) {
            return {
              ...targetBlock,
              sourceEquationIds: [
                ...(targetBlock.sourceEquationIds || []),
                sourceBlock.id,
              ],
            }
          } else if (isControlBlock(targetBlock)) {
            const eqVars = isEquationBlock(sourceBlock)
              ? (sourceBlock.variables ??
                parseEquation(sourceBlock.equation).variables)
              : []

            // If this control has no variables yet, seed from the connected equation variables.
            // Variables include x/y by default (auto-inferred), but the user can still adjust them here.
            const seededVariables = (
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
            // When connecting an equation to a variable block, populate variables from the equation
            const eqVars = isEquationBlock(sourceBlock)
              ? (sourceBlock.variables ??
                parseEquation(sourceBlock.equation).variables)
              : []

            // Filter out auto-inferred variables (x, y, e, pi) - only show editable constants
            const editableVars = eqVars.filter(
              (v) => !["x", "y", "e", "pi"].includes(v.name)
            )

            const seededVariables = editableVars.map((v) => ({
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

      // Remove from block tracking
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
          if (isChartBlock(block) || isControlBlock(block)) {
            return {
              ...block,
              sourceEquationIds: block.sourceEquationIds?.filter(
                (id) => id !== connection.sourceBlockId
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
          }
        }
        return block
      })

      setConnections((prev) => prev.filter((c) => c.id !== connectionId))
      setInternalBlocks(updatedBlocks)
      onBlocksChange?.(updatedBlocks)
    },
    [connections, blocks, onBlocksChange]
  )

  const handleConnectionClick = useCallback((connectionId: string) => {
    setSelectedConnectionId(connectionId)
  }, [])

  // Keyboard handler for deleting connections
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

  const renderBlock = (block: Block) => {
    const isSelected = block.id === selectedBlockId
    const isDragging = dragState?.blockId === block.id
    const pos = gridToPixels(block.position)

    const commonProps = {
      isSelected,
      onClick: () => handleBlockClick(block.id),
      onMouseDown: (e: React.MouseEvent) => handleDragStart(e, block),
      onDimensionsChange: (dimensions: { width: number; height: number }) =>
        handleBlockDimensionsChange(block.id, dimensions),
      className: cn(
        "transition-shadow",
        isDragging ? "z-50 cursor-grabbing shadow-2xl" : "z-10"
      ),
      style: { left: pos.x, top: pos.y },
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
            onVariableChange={(varName, value) => {
              const now = Date.now()
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isEquationBlock(b)) {
                  const updatedVars =
                    b.variables?.map((v) =>
                      v.name === varName ? { ...v, value } : v
                    ) || []
                  return { ...b, variables: updatedVars, updatedAt: now }
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
          />
        )
      case "chart": {
        const connectedEquations = (block.sourceEquationIds ?? [])
          .map((id) => blocks.find((b) => b.id === id && b.type === "equation"))
          .filter((eq): eq is EquationBlock => Boolean(eq))
        return (
          <ChartBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
            connectedEquations={connectedEquations}
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
                  // Handle special animation properties
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

                  // Handle regular value changes
                  const numValue =
                    typeof value === "string" ? parseFloat(value) : value
                  const variables = b.variables.map((v) =>
                    v.name === name ? { ...v, value: numValue } : v
                  )
                  return { ...b, variables, updatedAt: now }
                }

                // Propagate control variable changes into any connected equations so charts/limits can react.
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
          />
        )
      case "limit":
        return (
          <LimitBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
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
                  // Type-safe update of specific limit block properties
                  if (varName === "variableName" && typeof value === "string") {
                    return { ...b, variableName: value, updatedAt: Date.now() }
                  }
                  if (varName === "limitValue" && typeof value === "number") {
                    return { ...b, limitValue: value, updatedAt: Date.now() }
                  }
                  return b
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
            onApproachChange={(approach) => {
              const updatedBlocks = blocks.map((b) => {
                if (b.id === block.id && isLimitBlock(b)) {
                  return { ...b, approach, updatedAt: Date.now() }
                }
                return b
              })
              setInternalBlocks(updatedBlocks)
              onBlocksChange?.(updatedBlocks)
            }}
          />
        )
      case "shape":
        return (
          <ShapeBlockComponent
            key={block.id}
            block={block}
            {...commonProps}
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
      case "logic":
        return (
          <LogicBlockComponent key={block.id} block={block} {...commonProps} />
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
                if (b.id === block.id && isVariableBlock(b)) {
                  const variables = b.variables.map((v) =>
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
    }
  }

  return (
    <div className={cn("relative flex h-full w-full flex-col", className)}>
      {/* Top Toolbar - Hidden in playback mode */}
      {!isPlaybackMode && (
        <div className="z-20 flex items-center justify-end gap-4 border-b border-border bg-card p-2 shadow-sm">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={gridVisible}
              onChange={(e) => setGridVisible(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Show Grid
          </label>
          {/* Recording Controls */}
          <RecordingControls
            isRecording={
              recordingState.status === "recording" ||
              recordingState.status === "paused"
            }
            isPaused={recordingState.status === "paused"}
            currentTime={recordingState.currentTime}
            onStart={() => {
              void startRecording()
            }}
            onStop={() => {
              void stopRecording()
            }}
            onPause={pauseRecording}
            onResume={resumeRecording}
            onCreateBookmark={createBookmark}
          />
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative flex-1 overflow-hidden bg-background select-none"
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
        {/* Zoom and Pan Controls */}
        {!isPlaybackMode && (
          <div className="absolute right-4 bottom-4 z-30 flex items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-lg">
            <button
              onClick={() => handleZoom(-0.1)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-lg hover:bg-accent"
              disabled={zoom <= 0.25}
            >
              −
            </button>
            <span className="min-w-[3rem] text-center text-sm font-medium">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.1)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-lg hover:bg-accent"
              disabled={zoom >= 3}
            >
              +
            </button>
            <button
              onClick={() => {
                setZoom(1)
                setPan({ x: 0, y: 0 })
              }}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-xs hover:bg-accent"
              title="Reset view"
            >
              ⟲
            </button>
          </div>
        )}

        {/* Transformed Content */}
        <div
          className="absolute inset-0 origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: "100%",
            height: "100%",
          }}
        >
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
          {blocks.map(renderBlock)}
        </div>

        {/* Drag Preview (outside transform to avoid scaling) */}
        {dragState &&
          (() => {
            const draggedBlock = blocks.find((b) => b.id === dragState.blockId)
            const pos = gridToPixels(dragState.currentPosition)
            const width =
              Math.ceil(draggedBlock?.dimensions.width || 6) * GRID_UNIT
            const height =
              Math.ceil(draggedBlock?.dimensions.height || 2) * GRID_UNIT

            return (
              <div
                className="pointer-events-none absolute z-50 opacity-50"
                style={{
                  left: pan.x + pos.x * zoom,
                  top: pan.y + pos.y * zoom,
                  width: width * zoom,
                  height: height * zoom,
                }}
              >
                <div className="h-full w-full rounded-lg border-2 border-primary bg-primary/20" />
              </div>
            )
          })()}

        {/* Connection Layer */}
        <ConnectionLayer
          blocks={blocks}
          connections={connections}
          selectedConnectionId={selectedConnectionId}
          onConnectionClick={handleConnectionClick}
          zoom={zoom}
          pan={pan}
        />

        {/* Connection Preview (while dragging) */}
        {connectionDrag &&
          (() => {
            const sourceBlock = blocks.find(
              (b) => b.id === connectionDrag.sourceBlockId
            )
            if (!sourceBlock) return null

            // Calculate start position (output handle of source block) in screen coordinates
            const startPos = {
              x:
                (sourceBlock.position.x * GRID_UNIT +
                  sourceBlock.dimensions.width * GRID_UNIT) *
                  zoom +
                pan.x,
              y:
                (sourceBlock.position.y * GRID_UNIT +
                  (sourceBlock.dimensions.height * GRID_UNIT) / 2) *
                  zoom +
                pan.y,
            }

            // End position is the cursor in screen coordinates
            const endPos = {
              x: connectionDrag.currentX * zoom + pan.x,
              y: connectionDrag.currentY * zoom + pan.y,
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
      </div>

      {/* Recording Status Bar */}
      {(recordingState.status === "recording" ||
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
