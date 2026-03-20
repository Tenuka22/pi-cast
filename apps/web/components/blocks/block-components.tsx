"use client"

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  GRID_UNIT,
  type Block,
  type EquationBlock,
  type ChartBlock,
  type ControlBlock,
  type ControlVariable,
  type DescriptionBlock,
  type LimitBlock,
  type ConnectionHandleType,
  getTokenClassName,
  parseEquation,
} from "@/lib/block-system/types"
import { ConnectionHandles } from "@/components/connections/connection-handles"
import {
  GraphConfig,
  renderGraph,
  DEFAULT_GRAPH_CONFIG,
} from "@/lib/visualization/graph-renderer"

// ============================================================================
// BLOCK WRAPPER
// ============================================================================

interface BlockWrapperProps {
  block: Block
  isSelected?: boolean
  isDragging?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  className?: string
  children: React.ReactNode
}

export function BlockWrapper({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  className,
  children,
}: BlockWrapperProps) {
  const pos = {
    x: block.position.x * GRID_UNIT,
    y: block.position.y * GRID_UNIT,
  }
  const contentRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({
    width: block.dimensions.width,
    height: block.dimensions.height,
  })

  // Measure content and round up to nearest grid unit (32px)
  useEffect(() => {
    const updateDimensions = () => {
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect()
        // Use the LARGER of: measured content OR block's stored dimensions
        // This prevents shrinking while allowing growth
        const measuredWidth = Math.ceil(rect.width / GRID_UNIT)
        const measuredHeight = Math.ceil(rect.height / GRID_UNIT)
        const newWidth = Math.max(measuredWidth, block.dimensions.width)
        const newHeight = Math.max(measuredHeight, block.dimensions.height)

        if (newWidth !== dimensions.width || newHeight !== dimensions.height) {
          setDimensions({ width: newWidth, height: newHeight })
        }
      }
    }

    // Initial measurement
    updateDimensions()

    // Use ResizeObserver to track content size changes
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [
    dimensions.width,
    dimensions.height,
    block.dimensions.width,
    block.dimensions.height,
  ])

  const width = dimensions.width * GRID_UNIT
  const height = dimensions.height * GRID_UNIT

  const handleBodyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const target = e.target instanceof HTMLElement ? e.target : null
    if (target?.closest("[data-connection-handle]")) {
      return
    }
    onClick?.()
  }

  const handleBodyMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    const target = e.target instanceof HTMLElement ? e.target : null
    if (target?.closest("[data-connection-handle]")) {
      return
    }
    onMouseDown?.(e)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleBodyClick}
      onMouseDown={handleBodyMouseDown}
      style={{
        left: pos.x,
        top: pos.y,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      className={cn(
        "group absolute flex flex-col rounded-lg border-2 transition-all duration-200 select-none hover:border-primary/50 hover:shadow-md",
        "bg-card",
        isDragging ? "z-50 cursor-grabbing shadow-2xl" : "z-10 cursor-grab",
        isSelected
          ? "border-primary shadow-lg ring-2 ring-primary/20"
          : "border-border",
        "overflow-visible",
        className
      )}
    >
      {/* Drag Handle Indicator */}
      <div className="absolute -top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-0.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground shadow-sm">
          <span className="text-[10px] leading-none">⋮⋮</span>
          <span className="text-[9px]">Drag</span>
        </div>
      </div>
      <div
        ref={contentRef}
        className="flex flex-col items-stretch"
        style={{
          minWidth: block.dimensions.width * GRID_UNIT,
          minHeight: block.dimensions.height * GRID_UNIT,
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// EQUATION BLOCK
// ============================================================================

interface EquationBlockComponentProps {
  block: EquationBlock
  isSelected?: boolean
  isDragging?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void
  onVariableChange?: (variableName: string, value: number) => void
  onEquationChange?: (newEquation: string) => void
  isConnecting?: boolean
  connectingFromType?: string
}

export function EquationBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onConnectionStart,
  onConnectionEnd,
  onVariableChange,
  onEquationChange,
  isConnecting,
  connectingFromType,
}: EquationBlockComponentProps) {
  const { equation, tokens, variables } = block
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(equation)
  const inputRef = useRef<HTMLInputElement>(null)

  // Parse equation on-the-fly if variables/tokens aren't available
  const parsedTokens =
    tokens || (editValue ? parseEquation(editValue).tokens : [])
  const parsedVariables =
    variables || (editValue ? parseEquation(editValue).variables : [])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsEditing(true)
      setEditValue(equation)
    },
    [equation]
  )

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    // Save the equation if it changed
    if (editValue !== equation && editValue.trim()) {
      onEquationChange?.(editValue)
    }
  }, [editValue, equation, onEquationChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        // Save on Enter
        if (editValue !== equation && editValue.trim()) {
          onEquationChange?.(editValue)
        }
        setIsEditing(false)
      } else if (e.key === "Escape") {
        setEditValue(equation)
        setIsEditing(false)
      }
    },
    [editValue, equation, onEquationChange]
  )

  const handleVariableChange = useCallback(
    (varName: string, newValue: number) => {
      onVariableChange?.(varName, newValue)
    },
    [onVariableChange]
  )

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <div
        className="absolute -top-3 left-3 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs shadow-sm"
        style={{ zIndex: 60 }}
      >
        <span className="font-mono text-sm">ƒ</span>
        <span className="text-xs text-muted-foreground">Equation</span>
      </div>

      <div
        className="px-2 py-4"
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full rounded border border-primary bg-card px-2 py-1 font-mono text-lg focus:outline-none"
            placeholder="Enter equation (e.g., y = mx + c)"
          />
        ) : (
          <div className="font-mono text-lg">
            {parsedTokens && parsedTokens.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1">
                {parsedTokens.map((token, index) => (
                  <span
                    key={`${token.startIndex}-${index}`}
                    className={cn(
                      getTokenClassName(token.type),
                      "whitespace-pre-wrap break-all"
                    )}
                  >
                    {token.value}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">
                Double-click to edit
              </span>
            )}
          </div>
        )}
      </div>
      <ConnectionHandles
        blockId={block.id}
        blockType={block.type}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        isConnecting={isConnecting}
        connectingFromType={connectingFromType}
        connectedHandles={
          new Set([
            ...(block.connectedChartIds || []).map(
              (id) => `${block.id}-output-chart-${id}`
            ),
            ...(block.connectedControlIds || []).map(
              (id) => `${block.id}-output-control-${id}`
            ),
            ...(block.connectedEquationIds || []).map(
              (id) => `${block.id}-output-equation-${id}`
            ),
            ...(block.connectedLimitIds || []).map(
              (id) => `${block.id}-output-limit-${id}`
            ),
            ...(block.connectedVariableIds || []).map(
              (id) => `${block.id}-output-variable-${id}`
            ),
          ])
        }
      />
    </BlockWrapper>
  )
}

// ============================================================================
// CHART BLOCK
// ============================================================================

interface ChartBlockComponentProps {
  block: ChartBlock
  isSelected?: boolean
  isDragging?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void
  isConnecting?: boolean
  connectingFromType?: string
  connectedEquations?: EquationBlock[]
}

const PLOT_COLORS = [
  "#c084fc",
  "#ec4899",
  "#22d3ee",
  "#facc15",
  "#4ade80",
  "#f87171",
  "#60a5fa",
  "#a78bfa",
]

export function ChartBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
  connectedEquations = [],
}: ChartBlockComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const width = block.dimensions.width * GRID_UNIT
  const height = block.dimensions.height * GRID_UNIT
  const config = useMemo<GraphConfig>(() => {
    const base = block.chartConfig
    return {
      width,
      height,
      xAxis: {
        ...DEFAULT_GRAPH_CONFIG.xAxis,
        ...(base?.xAxis ?? {}),
      },
      yAxis: {
        ...DEFAULT_GRAPH_CONFIG.yAxis,
        ...(base?.yAxis ?? {}),
      },
      zoom: base?.zoom ?? DEFAULT_GRAPH_CONFIG.zoom,
      pan: {
        ...DEFAULT_GRAPH_CONFIG.pan,
        ...(base?.pan ?? {}),
      },
      showAxes: base?.showAxes ?? DEFAULT_GRAPH_CONFIG.showAxes,
      showGrid: base?.showGrid ?? DEFAULT_GRAPH_CONFIG.showGrid,
      backgroundColor: "transparent",
    }
  }, [block.chartConfig, height, width])

  const plots = useMemo(
    () =>
      connectedEquations.map((equationBlock, index) => {
        const variables: Record<string, number> = {}
        ;(equationBlock.variables ?? []).forEach((variable) => {
          variables[variable.name] = variable.value
        })
        if (variables.x === undefined) variables.x = 0
        if (variables.y === undefined) variables.y = 0

        return {
          equation: equationBlock.equation,
          variables,
          options: {
            color: PLOT_COLORS[index % PLOT_COLORS.length] || "#c084fc",
            lineWidth: 2,
            label: equationBlock.equation,
          },
        }
      }),
    [connectedEquations]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    renderGraph(ctx, plots, config)
  }, [config, plots, width, height])

  const hasEquations = connectedEquations.length > 0
  const connectedHandleIds = new Set(
    (block.sourceEquationIds || []).map(
      (id) => `${block.id}-input-equation-${id}`
    )
  )

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">📈</span>
          <span className="text-xs text-muted-foreground">
            {connectedEquations.length || 0} equation
            {connectedEquations.length !== 1 ? "s" : ""} connected
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            Drop equation connections here
          </span>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden rounded-lg border border-border bg-muted/50">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden={!hasEquations}
        />
        {!hasEquations && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Connected equations will render here
          </div>
        )}
      </div>
      <ConnectionHandles
        blockId={block.id}
        blockType={block.type}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        isConnecting={isConnecting}
        connectingFromType={connectingFromType}
        connectedHandles={connectedHandleIds}
      />
    </BlockWrapper>
  )
}

// ============================================================================
// CONTROL BLOCK
// ============================================================================

interface ControlBlockComponentProps {
  block: ControlBlock
  isSelected?: boolean
  isDragging?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onVariableChange?: (name: string, value: number | string) => void
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void
  isConnecting?: boolean
  connectingFromType?: string
}

export function ControlBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onVariableChange,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
}: ControlBlockComponentProps) {
  const { variables = [], layout } = block

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">🎛️</span>
          <span className="text-xs text-muted-foreground">
            {variables.length} variable{variables.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <div className="flex-1 p-4">
        {variables.length > 0 ? (
          <div
            className={cn(
              "space-y-4",
              layout === "horizontal" ? "flex gap-4" : ""
            )}
          >
            {variables.map((variable) => (
              <ControlVariableInput
                key={variable.name}
                variable={variable}
                onChange={(value) => onVariableChange?.(variable.name, value)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Connect an equation to control variables
          </p>
        )}
      </div>
      <ConnectionHandles
        blockId={block.id}
        blockType={block.type}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        isConnecting={isConnecting}
        connectingFromType={connectingFromType}
        connectedHandles={
          new Set(
            (block.sourceEquationIds || []).map(
              (id) => `${block.id}-input-equation-${id}`
            )
          )
        }
      />
    </BlockWrapper>
  )
}

interface ControlVariableInputProps {
  variable: ControlVariable
  onChange?: (value: number) => void
}

function ControlVariableInput({
  variable,
  onChange,
}: ControlVariableInputProps) {
  const [value, setValue] = useState(variable.value)

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    setValue(newValue)
    onChange?.(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    setValue(newValue)
    onChange?.(newValue)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-mono text-sm">{variable.name}</Label>
        <Input
          type="number"
          value={value}
          onChange={handleInputChange}
          className="h-7 w-20 text-right font-mono"
          step={variable.step || 1}
        />
      </div>
      <input
        type="range"
        value={value}
        min={variable.min || -100}
        max={variable.max || 100}
        step={variable.step || 1}
        onChange={handleSliderChange}
        className="w-full"
      />
    </div>
  )
}

// ============================================================================
// DESCRIPTION BLOCK
// ============================================================================

interface DescriptionBlockComponentProps {
  block: DescriptionBlock
  isSelected?: boolean
  isDragging?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
}

export function DescriptionBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
}: DescriptionBlockComponentProps) {
  const { content, format, title } = block
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsEditing(true)
      setEditContent(content)
    },
    [content]
  )

  const handleBlur = useCallback(() => {
    setIsEditing(false)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditContent(content)
        setIsEditing(false)
      }
    },
    [content]
  )

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
      className="p-4"
    >
      {title && (
        <div className="mb-2 flex items-center gap-2 border-b border-border pb-2">
          <span className="font-mono text-sm font-semibold">📝</span>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-full w-full resize-none rounded border border-primary bg-card p-2 text-sm leading-relaxed focus:outline-none"
          />
        ) : format === "latex" ? (
          <div
            onDoubleClick={handleDoubleClick}
            className="cursor-text rounded p-1 font-mono text-sm hover:bg-muted/50"
          >
            <code className="rounded bg-muted px-2 py-1">{content}</code>
          </div>
        ) : (
          <p
            onDoubleClick={handleDoubleClick}
            className="cursor-text rounded p-1 text-sm leading-relaxed whitespace-pre-wrap text-card-foreground hover:bg-muted/50"
          >
            {content}
          </p>
        )}
      </div>
      <div className="absolute top-2 right-2 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        {format}
      </div>
    </BlockWrapper>
  )
}

// ============================================================================
// LIMIT BLOCK
// ============================================================================

interface LimitBlockComponentProps {
  block: LimitBlock
  isSelected?: boolean
  isDragging?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onVariableChange?: (variableName: string, value: number | string) => void
  onApproachChange?: (approach: "left" | "right" | "both") => void
  variableOptions?: string[]
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void
  isConnecting?: boolean
  connectingFromType?: string
}

export function LimitBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onVariableChange,
  onApproachChange,
  variableOptions = [],
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
}: LimitBlockComponentProps) {
  const { variableName, limitValue, approach } = block

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">lim</span>
          <span className="text-xs text-muted-foreground">Limit</span>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-4">
        <div className="space-y-2">
          <Label className="text-xs">Variable</Label>
          <select
            value={variableName}
            onChange={(e) => onVariableChange?.("variableName", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            {variableOptions.length > 0 ? (
              variableOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))
            ) : (
              <option value={variableName}>{variableName}</option>
            )}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Approaches</Label>
          <Input
            type="number"
            value={limitValue}
            onChange={(e) =>
              onVariableChange?.("limitValue", parseFloat(e.target.value) || 0)
            }
            className="h-8"
            step="any"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Direction</Label>
          <div className="flex gap-2">
            {(["left", "right", "both"] as const).map((dir) => (
              <Button
                key={dir}
                variant={approach === dir ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => onApproachChange?.(dir)}
              >
                {dir === "left" ? "⁻" : dir === "right" ? "⁺" : "↔"}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <ConnectionHandles
        blockId={block.id}
        blockType={block.type}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        isConnecting={isConnecting}
        connectingFromType={connectingFromType}
        connectedHandles={
          new Set([
            ...(block.targetEquationId
              ? [`${block.id}-input-equation-${block.targetEquationId}`]
              : []),
          ])
        }
      />
    </BlockWrapper>
  )
}

// ============================================================================
// VARIABLE BLOCK
// ============================================================================

interface VariableBlockComponentProps {
  block: import("@/lib/block-system/types").VariableBlock
  isSelected?: boolean
  isDragging?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onVariableChange?: (variableName: string, value: number) => void
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void
  isConnecting?: boolean
  connectingFromType?: string
}

export function VariableBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onVariableChange,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
}: VariableBlockComponentProps) {
  const { variables = [], layout } = block

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">🎚️</span>
          <span className="text-xs text-muted-foreground">
            {variables.length} variable{variables.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <div className="flex-1 p-4">
        {variables.length > 0 ? (
          <div
            className={cn(
              "space-y-4",
              layout === "horizontal" ? "flex gap-4" : ""
            )}
          >
            {variables.map((variable) => (
              <ControlVariableInput
                key={variable.name}
                variable={variable}
                onChange={(value) => onVariableChange?.(variable.name, value)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Connect to an equation to see variables
          </p>
        )}
      </div>
      <ConnectionHandles
        blockId={block.id}
        blockType={block.type}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        isConnecting={isConnecting}
        connectingFromType={connectingFromType}
        connectedHandles={
          new Set(
            block.sourceEquationId
              ? [`${block.id}-input-equation-${block.sourceEquationId}`]
              : []
          )
        }
      />
    </BlockWrapper>
  )
}

// ============================================================================
// LOGIC BLOCK
// ============================================================================

interface LogicBlockComponentProps {
  block: import("@/lib/block-system/types").LogicBlock
  isSelected?: boolean
  isDragging?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void
  isConnecting?: boolean
  connectingFromType?: string
}

const LOGIC_GATE_SYMBOLS: Record<
  import("@/lib/block-system/types").LogicGateType,
  string
> = {
  and: "∧",
  or: "∨",
  xor: "⊕",
  eq: "=",
}

const LOGIC_GATE_COLORS: Record<
  import("@/lib/block-system/types").LogicGateType,
  string
> = {
  and: "text-blue-500",
  or: "text-green-500",
  xor: "text-purple-500",
  eq: "text-orange-500",
}

export function LogicBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
}: LogicBlockComponentProps) {
  const { logicType, inputs, result } = block

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
      className="p-4"
    >
      <div className="absolute -top-3 left-3 flex items-center gap-1 rounded bg-card px-2 text-xs text-muted-foreground">
        <span className="font-mono">🔌</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className={cn("text-4xl font-bold", LOGIC_GATE_COLORS[logicType])}>
          {LOGIC_GATE_SYMBOLS[logicType]}
        </div>
        <div className="text-xs font-medium text-muted-foreground uppercase">
          {logicType}
        </div>
        {result !== undefined && (
          <div className="mt-2 rounded bg-primary/10 px-3 py-1 font-mono text-sm">
            ={" "}
            {typeof result === "boolean" ? (result ? "true" : "false") : result}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {inputs.length} input{inputs.length !== 1 ? "s" : ""}
        </div>
      </div>
      <ConnectionHandles
        blockId={block.id}
        blockType={block.type}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        isConnecting={isConnecting}
        connectingFromType={connectingFromType}
        connectedHandles={
          new Set([
            ...(inputs || []).map((id, index) => `${block.id}-input-${index}`),
            ...(block.output ? [`${block.id}-output`] : []),
          ])
        }
      />
    </BlockWrapper>
  )
}

// ============================================================================
// SHAPE BLOCK
// ============================================================================

interface ShapeBlockComponentProps {
  block: import("@/lib/block-system/types").ShapeBlock
  isSelected?: boolean
  isDragging?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onFillValueChange?: (value: number) => void
  onFillColorChange?: (color: string) => void
  onFillModeChange?: (
    mode: "solid" | "fraction" | "decimal" | "percentage"
  ) => void
  onShapeTypeChange?: (shapeType: "square" | "circle" | "rectangle") => void
  onGridToggle?: () => void
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void
  isConnecting?: boolean
  connectingFromType?: string
}

export function ShapeBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onFillValueChange,
  onFillColorChange,
  onFillModeChange,
  onShapeTypeChange,
  onGridToggle,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
}: ShapeBlockComponentProps) {
  const { shapeType, fillColor, fillValue, fillMode, showGrid } = block

  const renderShape = () => {
    // Use block dimensions to calculate SVG size (accounting for padding and header)
    const svgSize = Math.min(
      block.dimensions.width * GRID_UNIT - 48, // Account for padding
      block.dimensions.height * GRID_UNIT - 120 // Account for header and controls
    )
    const center = svgSize / 2

    switch (shapeType) {
      case "circle":
        return (
          <svg width={svgSize} height={svgSize} className="mx-auto">
            <circle
              cx={center}
              cy={center}
              r={center - 10}
              fill="none"
              stroke={fillColor}
              strokeWidth="2"
            />
            <circle
              cx={center}
              cy={center}
              r={(center - 10) * (fillValue / 100)}
              fill={fillColor}
              opacity="0.5"
            />
          </svg>
        )
      case "rectangle":
        return (
          <svg width={svgSize} height={svgSize} className="mx-auto">
            <rect
              x="20"
              y="40"
              width={svgSize - 40}
              height={svgSize - 80}
              fill="none"
              stroke={fillColor}
              strokeWidth="2"
            />
            <rect
              x="20"
              y="40"
              width={svgSize - 40}
              height={(svgSize - 80) * (fillValue / 100)}
              fill={fillColor}
              opacity="0.5"
            />
          </svg>
        )
      case "square":
      default:
        return (
          <svg width={svgSize} height={svgSize} className="mx-auto">
            <rect
              x="10"
              y="10"
              width={svgSize - 20}
              height={svgSize - 20}
              fill="none"
              stroke={fillColor}
              strokeWidth="2"
            />
            <rect
              x="10"
              y="10"
              width={(svgSize - 20) * (fillValue / 100)}
              height={svgSize - 20}
              fill={fillColor}
              opacity="0.5"
            />
          </svg>
        )
    }
  }

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">◻️</span>
          <span className="text-xs text-muted-foreground capitalize">
            {shapeType}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-4">
        <div className="flex justify-center">{renderShape()}</div>

        <div className="space-y-2">
          <Label className="text-xs">Fill Value ({fillMode})</Label>
          <input
            type="range"
            value={fillValue}
            min={0}
            max={
              fillMode === "percentage" ? 100 : fillMode === "decimal" ? 1 : 1
            }
            step={fillMode === "percentage" ? 1 : 0.01}
            onChange={(e) => onFillValueChange?.(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span className="font-mono">{fillValue}</span>
            <span>
              {fillMode === "percentage"
                ? 100
                : fillMode === "decimal"
                  ? 1
                  : "1/1"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Color</Label>
          <div className="flex gap-2">
            {[
              "#7c3aed",
              "#ec4899",
              "#22d3ee",
              "#4ade80",
              "#facc15",
              "#f87171",
            ].map((color) => (
              <button
                key={color}
                className={cn(
                  "h-6 w-6 rounded border-2",
                  fillColor === color ? "border-primary" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
                onClick={() => onFillColorChange?.(color)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Grid</Label>
          <Button variant="outline" size="sm" onClick={onGridToggle}>
            {showGrid ? "On" : "Off"}
          </Button>
        </div>
      </div>
      <ConnectionHandles
        blockId={block.id}
        blockType={block.type}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        isConnecting={isConnecting}
        connectingFromType={connectingFromType}
        connectedHandles={
          new Set([
            ...(block.sourceValueId
              ? [`${block.id}-input-value-${block.sourceValueId}`]
              : []),
            ...(block.sourceControlId
              ? [`${block.id}-input-control-${block.sourceControlId}`]
              : []),
          ])
        }
      />
    </BlockWrapper>
  )
}

export default BlockWrapper
