"use client"

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import functionPlot from "function-plot"
import katex from "katex"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import "katex/dist/katex.min.css"
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
  formatEquation,
} from "@/lib/block-system/types"
import { ConnectionHandles } from "@/components/connections/connection-handles"
import {
  GraphConfig,
  DEFAULT_GRAPH_CONFIG,
  evaluateFunction,
  evaluateExpression,
} from "@/lib/visualization/graph-renderer"

// ============================================================================
// BLOCK WRAPPER
// ============================================================================

interface BlockWrapperProps {
  block: Block
  isSelected?: boolean
  isDragging?: boolean
  maxDimensions?: { width: number; height: number }
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

export function BlockWrapper({
  block,
  isSelected,
  isDragging = false,
  maxDimensions,
  onClick,
  onMouseDown,
  onDimensionsChange,
  className,
  style,
  children,
}: BlockWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({
    width: block.dimensions.width,
    height: block.dimensions.height,
  })
  const dimensionsRef = useRef(dimensions)
  useEffect(() => {
    dimensionsRef.current = dimensions
  }, [dimensions])

  // Measure content and round up to nearest grid unit (32px)
  useEffect(() => {
    const updateDimensions = () => {
      if (contentRef.current) {
        // Use layout sizes so pan/zoom CSS transforms don't cause feedback loops.
        const measuredPxWidth = contentRef.current.offsetWidth
        const measuredPxHeight = contentRef.current.offsetHeight
        // Use the LARGER of: measured content OR block's stored dimensions
        // This prevents shrinking while allowing growth
        const measuredWidth = Math.ceil(measuredPxWidth / GRID_UNIT)
        const measuredHeight = Math.ceil(measuredPxHeight / GRID_UNIT)
        const unclampedWidth = Math.max(measuredWidth, block.dimensions.width)
        const unclampedHeight = Math.max(
          measuredHeight,
          block.dimensions.height
        )
        const newWidth =
          maxDimensions?.width !== undefined
            ? Math.min(unclampedWidth, maxDimensions.width)
            : unclampedWidth
        const newHeight =
          maxDimensions?.height !== undefined
            ? Math.min(unclampedHeight, maxDimensions.height)
            : unclampedHeight

        const current = dimensionsRef.current
        if (newWidth !== current.width || newHeight !== current.height) {
          setDimensions({ width: newWidth, height: newHeight })
        }

        if (
          (newWidth !== block.dimensions.width ||
            newHeight !== block.dimensions.height) &&
          !isDragging
        ) {
          onDimensionsChange?.({ width: newWidth, height: newHeight })
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
    block.dimensions.width,
    block.dimensions.height,
    maxDimensions?.width,
    maxDimensions?.height,
    isDragging,
    onDimensionsChange,
  ])

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
    // Don't start a drag from interactive elements (or on double-click intent)
    if (
      e.button !== 0 ||
      e.detail > 1 ||
      target?.closest(
        'input, textarea, select, button, a, [contenteditable="true"], [data-no-drag]'
      )
    ) {
      return
    }
    onMouseDown?.(e)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-block-id={block.id}
      onClick={handleBodyClick}
      onMouseDown={handleBodyMouseDown}
      style={{
        // Positioning is handled by parent transform (grid-canvas.tsx)
        // Merge incoming style props with base styles
        userSelect: "none",
        WebkitUserSelect: "none",
        ...style,
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
          minWidth: dimensions.width * GRID_UNIT,
          minHeight: dimensions.height * GRID_UNIT,
          ...(maxDimensions?.width !== undefined
            ? { maxWidth: maxDimensions.width * GRID_UNIT }
            : {}),
          ...(maxDimensions?.height !== undefined
            ? { maxHeight: maxDimensions.height * GRID_UNIT }
            : {}),
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
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void
  className?: string
  style?: React.CSSProperties
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void
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
  onDimensionsChange,
  className,
  style,
  onConnectionStart,
  onConnectionEnd,
  onEquationChange,
  isConnecting,
  connectingFromType,
}: EquationBlockComponentProps) {
  const { equation, tokens } = block
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(equation)
  const inputRef = useRef<HTMLInputElement>(null)

  // Parse equation on-the-fly if variables/tokens aren't available
  const parsedTokens =
    tokens || (editValue ? parseEquation(editValue).tokens : [])

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
    const formatted = formatEquation(editValue)
    // Allow clearing the equation back to empty/initial state
    if (formatted !== equation) {
      onEquationChange?.(formatted)
      setEditValue(formatted)
    }
  }, [editValue, equation, onEquationChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        const formatted = formatEquation(editValue)
        if (formatted !== equation) {
          onEquationChange?.(formatted)
          setEditValue(formatted)
        }
        setIsEditing(false)
      } else if (e.key === "Escape") {
        setEditValue(equation)
        setIsEditing(false)
      }
    },
    [editValue, equation, onEquationChange]
  )

  const connectedHandleIds = new Set([
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
  ])

  // Render equation with syntax-highlighted tokens
  const renderEquation = () => {
    if (!parsedTokens || parsedTokens.length === 0) {
      return equation
    }

    return parsedTokens.map((token, index) => (
      <span
        key={`${token.startIndex}-${index}`}
        className={getTokenClassName(token.type)}
      >
        {token.value}
      </span>
    ))
  }

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onDimensionsChange={onDimensionsChange}
      className={className}
      style={style}
    >
      <div className="flex h-full flex-col p-2">
        <div className="mx-2 mb-1 flex items-center gap-2 border-b border-border pb-1">
          <span className="font-mono text-sm font-semibold">f(x)</span>
          <h3 className="text-sm font-semibold text-foreground">Equation</h3>
        </div>
        <div className="flex-1 overflow-auto px-2 py-1">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full rounded border border-primary bg-card px-2 py-1 font-mono text-base focus:outline-none"
              placeholder="y = 2x + 1"
            />
          ) : (
            <div
              onDoubleClick={handleDoubleClick}
              className="cursor-text rounded py-1 font-mono text-sm leading-relaxed text-card-foreground hover:bg-muted/30"
            >
              {equation.trim().length === 0 ? (
                <span className="text-muted-foreground">
                  Double-click to edit
                </span>
              ) : (
                <code className="font-mono">{renderEquation()}</code>
              )}
            </div>
          )}
        </div>
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

      <div className="absolute top-2 right-2 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        equation
      </div>
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
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void
  className?: string
  style?: React.CSSProperties
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void
  isConnecting?: boolean
  connectingFromType?: string
  // Node chain calculated data (node-based calculation)
  calculatedData?: import("@/lib/block-system/types").NodeData
  connectedEquations?: EquationBlock[]
  // Constraints with their target equation IDs (for per-equation constraints)
  constraints?: import("@/lib/block-system/types").ConstraintBlock[]
  // Map of equationId -> constraintIds that apply to it
  equationConstraintMap?: Record<string, string[]>
  connectedLimits?: LimitBlock[]
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
  onDimensionsChange,
  className,
  style,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
  calculatedData,
  connectedEquations = [],
  constraints = [],
  equationConstraintMap = {},
  connectedLimits = [],
}: ChartBlockComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const defaultDimensionsRef = useRef(block.dimensions)
  const MIN_CANVAS_HEIGHT = 240
  const width = block.dimensions.width * GRID_UNIT
  const height = block.dimensions.height * GRID_UNIT
  const [headerPx, setHeaderPx] = useState(0)
  const [plotWidthPx, setPlotWidthPx] = useState(width)

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const update = () => setHeaderPx(el.offsetHeight || 0)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      // Use the border-box width so the plotted SVG fills the visible container.
      // `clientWidth` excludes borders which can show up as a clipped/right-gap
      // on small chart blocks.
      const rect = el.getBoundingClientRect()
      const next = Math.round(rect.width) || el.offsetWidth || width
      if (next && next !== plotWidthPx) setPlotWidthPx(next)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width])

  // Keep chart total height aligned to the grid by making the plot area fit
  // within the block's height (header + plot = block height).
  const plotHeight = Math.max(MIN_CANVAS_HEIGHT, Math.max(0, height - headerPx))

  const config = useMemo<GraphConfig>(() => {
    const base = block.chartConfig
    return {
      width: plotWidthPx,
      height: plotHeight,
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
  }, [block.chartConfig, plotHeight, plotWidthPx])

  const constraintDomain = useMemo(() => {
    let xMin: number | undefined
    let xMax: number | undefined
    let yMin: number | undefined
    let yMax: number | undefined

    for (const c of constraints) {
      const name = (c.variableName ?? "").toLowerCase()
      const type = c.constraint.type
      const min = c.constraint.min
      const max = c.constraint.max

      const applyMin = (v: number) => {
        if (name === "x") xMin = xMin === undefined ? v : Math.max(xMin, v)
        if (name === "y") yMin = yMin === undefined ? v : Math.max(yMin, v)
      }
      const applyMax = (v: number) => {
        if (name === "x") xMax = xMax === undefined ? v : Math.min(xMax, v)
        if (name === "y") yMax = yMax === undefined ? v : Math.min(yMax, v)
      }

      if (type === "gte" && typeof min === "number") applyMin(min)
      if (type === "gt" && typeof min === "number") applyMin(min + 1e-9)
      if (type === "lte" && typeof min === "number") applyMax(min)
      if (type === "lt" && typeof min === "number") applyMax(min - 1e-9)
      if (type === "range") {
        if (typeof min === "number") applyMin(min)
        if (typeof max === "number") applyMax(max)
      }
    }

    return { xMin, xMax, yMin, yMax }
  }, [constraints])

  const constrainedConfig = useMemo<GraphConfig>(() => {
    const next: GraphConfig = {
      ...config,
      xAxis: { ...config.xAxis },
      yAxis: { ...config.yAxis },
    }

    // Always include a small reference window around 0 for readability.
    // Constraints limit the *plotted function*, not the axis ticks themselves.
    const enforceAxis = (axis: { min: number; max: number }) => {
      let min = axis.min
      let max = axis.max
      if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
        min = -10
        max = 10
      }
      min = Math.min(min, -1, 0)
      max = Math.max(max, 1, 0)
      // Ensure min < max
      if (min === max) {
        min -= 2
        max += 2
      }
      return { min, max }
    }

    const enforcedX = enforceAxis(next.xAxis)
    const enforcedY = enforceAxis(next.yAxis)
    next.xAxis.min = enforcedX.min
    next.xAxis.max = enforcedX.max
    next.yAxis.min = enforcedY.min
    next.yAxis.max = enforcedY.max
    return next
  }, [config])

  // Build plots from calculated node data (node-based calculation)
  // Falls back to connectedEquations prop for backwards compatibility
  const plots = useMemo(() => {
    // Prefer calculatedData from node-calculation-engine
    if (calculatedData?.equation && calculatedData.variables) {
      const variables: Record<string, number> = {}
      calculatedData.variables.forEach((variable) => {
        variables[variable.name] = variable.value
      })
      if (variables.x === undefined) variables.x = 0
      if (variables.y === undefined) variables.y = 0

      // Get constraints for this equation (from node chain or equationConstraintMap)
      const equationId = calculatedData.equation // Use equation as ID for single equation
      const applicableConstraintIds = equationConstraintMap[equationId] || []
      const applicableConstraints = constraints.filter(c => applicableConstraintIds.includes(c.id))

      return [{
        key: 'calc-0',
        equation: calculatedData.equation,
        variables,
        color: PLOT_COLORS[0] || "#c084fc",
        label: calculatedData.equation,
        constraints: applicableConstraints,
      }]
    }

    // Fallback to legacy connectedEquations prop
    return connectedEquations.map((equationBlock, index) => {
      const variables: Record<string, number> = {}
      ;(equationBlock.variables ?? []).forEach((variable) => {
        variables[variable.name] = variable.value
      })
      if (variables.x === undefined) variables.x = 0
      if (variables.y === undefined) variables.y = 0

      // Get constraints that apply to this specific equation
      const applicableConstraintIds = equationConstraintMap[equationBlock.id] || []
      const applicableConstraints = constraints.filter(c => applicableConstraintIds.includes(c.id))

      return {
        key: `eq${index}`,
        equation:
          equationBlock.enabled === false ? "y = 0" : equationBlock.equation,
        variables,
        color: PLOT_COLORS[index % PLOT_COLORS.length] || "#c084fc",
        label:
          equationBlock.enabled === false
            ? "disabled"
            : equationBlock.equation,
        constraints: applicableConstraints,
      }
    })
  }, [calculatedData, connectedEquations, constraints, equationConstraintMap])

  const autoYAxis = useMemo(() => {
    // Use the chart's configured xAxis domain, NOT constraintDomain
    // Constraints should only mask function lines, not affect the visible area
    const xMin = constrainedConfig.xAxis.min
    const xMax = constrainedConfig.xAxis.max
    
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin === xMax) {
      return null
    }

    const samples = 120
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    for (const plot of plots) {
      const equation = plot.equation
      if (!equation?.trim()) continue

      for (let i = 0; i <= samples; i++) {
        const t = i / samples
        const x = xMin + (xMax - xMin) * t
        const y = evaluateFunction(equation, { ...plot.variables, x })
        if (!Number.isFinite(y)) continue
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }

    if (!Number.isFinite(minY) || !Number.isFinite(maxY)) return null
    if (minY === maxY) {
      const pad = Math.max(1, Math.abs(minY) * 0.1)
      return { min: minY - pad, max: maxY + pad }
    }

    const pad = (maxY - minY) * 0.1
    return { min: minY - pad, max: maxY + pad }
  }, [constrainedConfig.xAxis.max, constrainedConfig.xAxis.min, plots])

  const effectiveConfig = useMemo<GraphConfig>(() => {
    const base = constrainedConfig
    if (!autoYAxis) return base

    const enforceAxis = (axis: { min: number; max: number }) => {
      let min = axis.min
      let max = axis.max
      min = Math.min(min, -1, 0)
      max = Math.max(max, 1, 0)
      if (min === max) {
        min -= 2
        max += 2
      }
      return { min, max }
    }

    const enforced = enforceAxis({ min: autoYAxis.min, max: autoYAxis.max })
    return {
      ...base,
      yAxis: {
        ...base.yAxis,
        min: enforced.min,
        max: enforced.max,
      },
    }
  }, [
    autoYAxis,
    constrainedConfig,
  ])

  // Build function strings with substituted variables
  // Apply constraints PER EQUATION, not globally
  const functionData = useMemo(() => {
    return plots
      .map((plot) => {
        let fn = plot.equation?.trim() ?? ""

        // Skip empty equations
        if (!fn) return null

        // Remove "y =" or "y=" prefix if present (function-plot expects just the expression)
        fn = fn.replace(/^y\s*=\s*/i, "").trim()

        // Skip if nothing left after removing prefix
        if (!fn) return null

        // Substitute known constants
        fn = fn.replace(/\bpi\b/g, String(Math.PI))
        fn = fn.replace(/\be\b(?!q)/g, String(Math.E))
        // Substitute variables (except x which is the independent variable)
        Object.entries(plot.variables).forEach(([name, value]) => {
          if (name !== "x") {
            const regex = new RegExp(`\\b${name}\\b`, "g")
            fn = fn.replace(regex, String(value))
          }
        })

        // Final validation - skip if expression is still invalid
        if (!fn || fn === "=" || fn.endsWith("=")) return null

        // Skip incomplete expressions (ending with operator or unclosed parentheses)
        if (/[+\-*/^]$/.test(fn.trim())) return null
        if ((fn.match(/\(/g) || []).length !== (fn.match(/\)/g) || []).length)
          return null

        // Skip if contains unsupported unicode characters that function-plot can't handle
        if (/[∧∨⊕→⁻⁺]/.test(fn)) return null

        // Apply constraint masking PER EQUATION
        // Only apply constraints that are specific to this equation
        // DO NOT use global constraintDomain - that would affect all equations
        const plotConstraints = plot.constraints || []
        
        // Start with NO limits - only apply equation-specific constraints
        let xMinLimit: number | undefined
        let xMaxLimit: number | undefined
        let yMinLimit: number | undefined
        let yMaxLimit: number | undefined

        // Apply only the constraints for this specific equation
        for (const c of plotConstraints) {
          const name = (c.variableName ?? "").toLowerCase()
          const type = c.constraint.type
          const min = c.constraint.min
          const max = c.constraint.max

          if (name === "x") {
            if (type === "gte" && typeof min === "number") xMinLimit = min
            if (type === "gt" && typeof min === "number") xMinLimit = min + 1e-9
            if (type === "lte" && typeof min === "number") xMaxLimit = min
            if (type === "lt" && typeof min === "number") xMaxLimit = min - 1e-9
            if (type === "range") {
              if (typeof min === "number") xMinLimit = min
              if (typeof max === "number") xMaxLimit = max
            }
          }
          if (name === "y") {
            if (type === "gte" && typeof min === "number") yMinLimit = min
            if (type === "gt" && typeof min === "number") yMinLimit = min + 1e-9
            if (type === "lte" && typeof min === "number") yMaxLimit = min
            if (type === "lt" && typeof min === "number") yMaxLimit = min - 1e-9
            if (type === "range") {
              if (typeof min === "number") yMinLimit = min
              if (typeof max === "number") yMaxLimit = max
            }
          }
        }

        const NAN_EXPR = "(0/0)"
        let masked = `(${fn})`
        if (typeof yMinLimit === "number") {
          masked = `((${masked}) < (${yMinLimit}) ? ${NAN_EXPR} : (${masked}))`
        }
        if (typeof yMaxLimit === "number") {
          masked = `((${masked}) > (${yMaxLimit}) ? ${NAN_EXPR} : (${masked}))`
        }
        if (typeof xMinLimit === "number") {
          masked = `(x < (${xMinLimit}) ? ${NAN_EXPR} : (${masked}))`
        }
        if (typeof xMaxLimit === "number") {
          masked = `(x > (${xMaxLimit}) ? ${NAN_EXPR} : (${masked}))`
        }

        return {
          fn: masked,
          color: plot.color,
          graphType: "polyline" as const,
        }
      })
      .filter(
        (item): item is { fn: string; color: string; graphType: "polyline" } =>
          item !== null
      )
  }, [plots])

  // Render the plot when plots or config changes
  useEffect(() => {
    if (!containerRef.current || functionData.length === 0) return

    // Clear previous content
    containerRef.current.innerHTML = ""

    try {
      functionPlot({
        target: containerRef.current,
        width: effectiveConfig.width,
        height: effectiveConfig.height,
        disableZoom: true,
        yAxis: {
          domain: [effectiveConfig.yAxis.min, effectiveConfig.yAxis.max],
          invert: false,
        },
        xAxis: {
          domain: [effectiveConfig.xAxis.min, effectiveConfig.xAxis.max],
          invert: false,
        },
        grid: effectiveConfig.showGrid,
        data: functionData,
        tip: {
          xLine: true,
          yLine: true,
        },
      })
    } catch (error) {
      console.error("Error plotting function:", error, functionData)
    }
  }, [functionData, effectiveConfig])

  const hasEquations = functionData.length > 0
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
      maxDimensions={defaultDimensionsRef.current}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onDimensionsChange={onDimensionsChange}
      className={className}
      style={style}
    >
      <div
        ref={headerRef}
        className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">📈</span>
          <span className="text-xs text-muted-foreground">
            {connectedEquations.length || 0} equation
            {connectedEquations.length !== 1 ? "s" : ""} connected
            {connectedLimits.length > 0 && (
              <span className="ml-2">
                • {connectedLimits.length} limit
                {connectedLimits.length !== 1 ? "s" : ""}
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            Drop equation connections here
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="function-plot-root relative flex-1 overflow-hidden rounded-lg border border-border bg-muted/50"
        style={{
          minHeight: plotHeight,
          height: plotHeight,
          maxHeight: plotHeight,
          minWidth: width,
          width,
          maxWidth: width,
        }}
      >
        <style>{`
          .function-plot-root svg g.axis path,
          .function-plot-root svg g.axis line,
          .function-plot-root svg g.x.axis path,
          .function-plot-root svg g.x.axis line,
          .function-plot-root svg g.y.axis path,
          .function-plot-root svg g.y.axis line,
          .function-plot-root svg .tick line {
            stroke: oklch(0.86 0.16 323.949) !important;
            stroke-width: 1.25 !important;
            shape-rendering: crispEdges;
          }
          .function-plot-root svg g.axis text,
          .function-plot-root svg g.x.axis text,
          .function-plot-root svg g.y.axis text,
          .function-plot-root svg .tick text {
            fill: oklch(0.86 0.16 323.949) !important;
          }
        `}</style>
        {!hasEquations && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Connected equations will render here
          </div>
        )}
        {/* Limit approach indicators */}
        {connectedLimits.length > 0 && hasEquations && (
          <div className="pointer-events-none absolute inset-0">
            {connectedLimits.map((limit) => {
              const x = limit.limitValue
              const isLeftOrBoth = limit.approach === "left" || limit.approach === "both"
              const isRightOrBoth = limit.approach === "right" || limit.approach === "both"
              return (
                <React.Fragment key={limit.id}>
                  {/* Vertical dashed line at limit position */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-primary/50 border-l-2 border-dashed"
                    style={{
                      left: `${((x - (-10)) / (10 - (-10))) * 100}%`,
                    }}
                  />
                  {/* Approach arrows */}
                  {isLeftOrBoth && (
                    <div
                      className="absolute top-2 text-xs text-primary font-mono"
                      style={{
                        left: `${((x - 2 - (-10)) / (10 - (-10))) * 100}%`,
                      }}
                    >
                      →
                    </div>
                  )}
                  {isRightOrBoth && (
                    <div
                      className="absolute top-2 text-xs text-primary font-mono"
                      style={{
                        left: `${((x + 2 - (-10)) / (10 - (-10))) * 100}%`,
                      }}
                    >
                      ←
                    </div>
                  )}
                  {/* Limit value label */}
                  <div
                    className="absolute -top-1 px-1 py-0.5 text-xs bg-primary text-primary-foreground rounded"
                    style={{
                      left: `${((x - (-10)) / (10 - (-10))) * 100}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {limit.variableName} → {limit.limitValue}
                  </div>
                </React.Fragment>
              )
            })}
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
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void
  className?: string
  style?: React.CSSProperties
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
  onDimensionsChange,
  className,
  style,
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
      maxDimensions={{ width: 24, height: 18 }}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onDimensionsChange={onDimensionsChange}
      className={className}
      style={style}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">🎛️</span>
          <span className="text-xs text-muted-foreground">
            {variables.length} variable{variables.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <div className="flex-1">
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

  useEffect(() => {
    if (Number.isFinite(variable.value) && variable.value !== value) {
      setValue(variable.value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variable.value])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    setValue(newValue)
    onChange?.(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw.trim() === "") {
      setValue(Number.NaN)
      return
    }
    const newValue = parseFloat(raw)
    if (!Number.isFinite(newValue)) return
    setValue(newValue)
    onChange?.(newValue)
  }

  const inputValue: string | number = Number.isFinite(value) ? value : ""
  const sliderValue = Number.isFinite(value)
    ? value
    : Number.isFinite(variable.value)
      ? variable.value
      : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-mono text-sm">{variable.name}</Label>
        <Input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          className="h-7 w-20 text-right font-mono"
          step={variable.step || 1}
        />
      </div>
      <input
        type="range"
        value={sliderValue}
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
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void
  className?: string
  style?: React.CSSProperties
  onContentChange?: (content: string) => void
}

export function DescriptionBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onDimensionsChange,
  className,
  style,
  onContentChange,
}: DescriptionBlockComponentProps) {
  const { content, format, title } = block
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const latexRef = useRef<HTMLSpanElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isEditing) {
      setEditContent(content)
    }
  }, [content, isEditing])

  // Render LaTeX content using KaTeX
  useEffect(() => {
    if (latexRef.current && format === "latex" && !isEditing) {
      try {
        katex.render(content, latexRef.current, {
          displayMode: false,
          throwOnError: false,
          output: "html",
          macros: {
            "\\RR": "\\mathbb{R}",
            "\\NN": "\\mathbb{N}",
            "\\ZZ": "\\mathbb{Z}",
            "\\QQ": "\\mathbb{Q}",
            "\\CC": "\\mathbb{C}",
          },
        })
      } catch (error) {
        console.error("KaTeX rendering error:", error)
      }
    }
  }, [content, format, isEditing])

  const commitContent = useCallback(() => {
    if (editContent !== content) {
      onContentChange?.(editContent)
    }
  }, [content, editContent, onContentChange])

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsEditing(true)
      setEditContent(content)
    },
    [content]
  )

  const handleBlur = useCallback(() => {
    commitContent()
    setIsEditing(false)
  }, [commitContent])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        commitContent()
        setIsEditing(false)
      } else if (e.key === "Escape") {
        setEditContent(content)
        setIsEditing(false)
      }
    },
    [commitContent, content]
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
      onDimensionsChange={onDimensionsChange}
      className={className}
      style={style}
    >
      <div className="flex h-full flex-col p-2">
        {title && (
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <span className="font-mono text-lg font-semibold">📝</span>
            <h3 className="truncate text-xs font-medium text-muted-foreground">
              {title}
            </h3>
          </div>
        )}
        <div className="flex-1 overflow-auto px-1 py-0">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full resize-none rounded border border-border bg-card px-1 py-0 text-sm leading-relaxed focus:ring-1 focus:ring-primary focus:outline-none"
            />
          ) : format === "latex" ? (
            <div
              onDoubleClick={handleDoubleClick}
              className="cursor-text rounded px-1 py-0 text-sm leading-tight text-card-foreground hover:bg-muted/30"
            >
              <span ref={latexRef} className="text-sm leading-tight" />
            </div>
          ) : format === "markdown" ? (
            <p
              onDoubleClick={handleDoubleClick}
              className="cursor-text rounded px-1 py-0 text-sm leading-relaxed break-words whitespace-pre-wrap text-card-foreground hover:bg-muted/30"
            >
              {content}
            </p>
          ) : (
            <p
              onDoubleClick={handleDoubleClick}
              className="cursor-text rounded px-1 py-0 text-sm leading-relaxed break-words whitespace-pre-wrap text-card-foreground hover:bg-muted/30"
            >
              {content}
            </p>
          )}
        </div>
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
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void
  className?: string
  style?: React.CSSProperties
  onVariableChange?: (variableName: string, value: number | string) => void
  variableOptions?: string[]
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void
  isConnecting?: boolean
  connectingFromType?: string
  connectedEquation?: EquationBlock | null
}

export function LimitBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onDimensionsChange,
  className,
  style,
  onVariableChange,
  variableOptions = [],
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
  connectedEquation,
}: LimitBlockComponentProps) {
  const { variableName, limitValue, limitType, isInfinite, infiniteDirection } = block

  // Display symbol based on limit type (fixed, cannot be changed)
  const limitSymbol = limitType === 'left' ? '⁻' : limitType === 'right' ? '⁺' : '↔'
  const limitLabel = limitType === 'left' ? 'Left Limit' : limitType === 'right' ? 'Right Limit' : 'Two-Sided Limit'
  
  // Get the display value (infinity or finite number)
  const displayValue = isInfinite 
    ? (infiniteDirection === 'positive' ? '∞' : '-∞')
    : limitValue.toString()

  // Calculate limit result from connected equation
  const limitResult = useMemo(() => {
    if (!connectedEquation?.equation) return null

    const equation = connectedEquation.equation
    const variables: Record<string, number> = {}
    ;(connectedEquation.variables ?? []).forEach((v) => {
      variables[v.name] = v.value
    })

    try {
      // Evaluate equation at the limit value using safe evaluation
      let expr = equation.replace(/\s/g, "")
      const equalsIndex = expr.indexOf("=")
      if (equalsIndex !== -1) {
        expr = expr.substring(equalsIndex + 1)
      }

      // For infinite limits or when approaching 0, check behavior from both sides
      const evalValue = isInfinite || limitValue === 0 ? (isInfinite ? (infiniteDirection === 'positive' ? 1e10 : -1e10) : limitValue) : limitValue
      
      // Replace variable with limit value in the variables object
      const evalVariables: Record<string, number> = { ...variables }
      evalVariables[variableName] = evalValue

      // Use safe evaluateExpression instead of Function constructor
      const result = evaluateExpression(expr, evalVariables)
      
      // Check for infinite results (division by zero or very large values)
      if (!isFinite(result)) {
        if (result > 0) return { type: 'infinite', direction: 'positive' }
        if (result < 0) return { type: 'infinite', direction: 'negative' }
        return { type: 'undefined' }
      }
      
      return result
    } catch (error) {
      // Check if it's a division by zero or asymptote
      return { type: 'infinite', direction: 'unknown' }
    }
  }, [connectedEquation, variableName, limitValue, isInfinite, infiniteDirection])

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onDimensionsChange={onDimensionsChange}
      className={className}
      style={style}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">lim</span>
          <span className="text-xs text-muted-foreground">{limitLabel}</span>
        </div>
        <span className="text-lg font-bold text-primary">{limitSymbol}</span>
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
          <div className="flex gap-2">
            <Button
              variant={!isInfinite ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => onVariableChange?.("isInfinite", isInfinite ? 0 : 1)}
            >
              Finite
            </Button>
            <Button
              variant={isInfinite ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => onVariableChange?.("isInfinite", isInfinite ? 0 : 1)}
            >
              Infinite
            </Button>
          </div>
        </div>
        {isInfinite ? (
          <div className="space-y-2">
            <Label className="text-xs">Direction</Label>
            <div className="flex gap-2">
              <Button
                variant={infiniteDirection === "positive" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => onVariableChange?.("infiniteDirection", "positive")}
              >
                +∞
              </Button>
              <Button
                variant={infiniteDirection === "negative" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => onVariableChange?.("infiniteDirection", "negative")}
              >
                -∞
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-xs">Value</Label>
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
        )}
        <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
          <span className="font-mono">
            {variableName} → {displayValue}{limitSymbol}
          </span>
        </div>

        {/* Limit Result Display */}
        {connectedEquation && (
          <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
            <div className="text-xs font-medium text-muted-foreground">
              Limit Result
            </div>
            <div className="font-mono text-sm">
              lim<sub>{variableName}→{displayValue}</sub> f({variableName}) ={" "}
              {typeof limitResult === 'object' && limitResult !== null ? (
                <span className={limitResult.type === 'infinite' ? 'text-green-600' : 'text-red-600'}>
                  {limitResult.type === 'infinite' 
                    ? (limitResult.direction === 'positive' ? '+∞' : limitResult.direction === 'negative' ? '-∞' : '∞')
                    : 'undefined'}
                </span>
              ) : (
                <span className={isFinite(limitResult ?? NaN) ? 'text-green-600' : 'text-red-600'}>
                  {isFinite(limitResult ?? NaN) ? limitResult?.toFixed(4) : 'undefined'}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Connect a table to see approach values
            </div>
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
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void
  className?: string
  style?: React.CSSProperties
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
  onDimensionsChange,
  className,
  style,
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
      onDimensionsChange={onDimensionsChange}
      className={className}
      style={style}
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
          new Set(block.sourceEquationId ? [`${block.id}-input`] : [])
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
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void
  className?: string
  style?: React.CSSProperties
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
  le: "≤",
  ge: "≥",
  gt: ">",
  lt: "<",
}

const LOGIC_GATE_COLORS: Record<
  import("@/lib/block-system/types").LogicGateType,
  string
> = {
  and: "text-blue-500",
  or: "text-green-500",
  xor: "text-purple-500",
  eq: "text-orange-500",
  le: "text-cyan-500",
  ge: "text-teal-500",
  gt: "text-red-500",
  lt: "text-pink-500",
}

export function LogicBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onDimensionsChange,
  className,
  style,
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
      onDimensionsChange={onDimensionsChange}
      className={className}
      style={style}
    >
      <div className="p-4">
        <div className="absolute -top-3 left-3 flex items-center gap-1 rounded bg-card px-2 text-xs text-muted-foreground">
          <span className="font-mono">🔌</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div
            className={cn("text-4xl font-bold", LOGIC_GATE_COLORS[logicType])}
          >
            {LOGIC_GATE_SYMBOLS[logicType]}
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase">
            {logicType}
          </div>
          {result !== undefined && (
            <div className="mt-2 rounded bg-primary/10 px-3 py-1 font-mono text-sm">
              ={" "}
              {typeof result === "boolean"
                ? result
                  ? "true"
                  : "false"
                : result}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {inputs.length} input{inputs.length !== 1 ? "s" : ""}
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
            ...(inputs || []).map((id, index) => `${block.id}-input-${index}`),
            ...(block.output ? [`${block.id}-output`] : []),
          ])
        }
      />
    </BlockWrapper>
  )
}

// ============================================================================
// COMPARATOR BLOCK
// ============================================================================

interface ComparatorBlockComponentProps {
  block: import("@/lib/block-system/types").ComparatorBlock
  isSelected?: boolean
  isDragging?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void
  className?: string
  style?: React.CSSProperties
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void
  isConnecting?: boolean
  connectingFromType?: string
}

const COMPARATOR_SYMBOLS: Record<
  import("@/lib/block-system/types").LogicGateType,
  string
> = {
  and: "âˆ§",
  or: "âˆ¨",
  xor: "âŠ•",
  eq: "=",
  le: "â‰¤",
  ge: "â‰¥",
  gt: ">",
  lt: "<",
}

export function ComparatorBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onDimensionsChange,
  className,
  style,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
}: ComparatorBlockComponentProps) {
  const { operator, result, leftInput, rightInput } = block
  const inputCount = [leftInput, rightInput].filter(Boolean).length

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onDimensionsChange={onDimensionsChange}
      className={className}
      style={style}
    >
      <div className="p-4">
        <div className="absolute -top-3 left-3 flex items-center gap-1 rounded bg-card px-2 text-xs text-muted-foreground">
          <span className="font-mono">â‰Ÿ</span>
          <span>Comparator</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-4xl font-bold text-orange-500">
            {COMPARATOR_SYMBOLS[operator]}
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase">
            {operator}
          </div>
          {result !== undefined && (
            <div className="mt-2 rounded bg-primary/10 px-3 py-1 font-mono text-sm">
              ={" "}
              {typeof result === "boolean"
                ? result
                  ? "true"
                  : "false"
                : result}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {inputCount} / 2 inputs
          </div>
        </div>
      </div>
      <ConnectionHandles
        blockId={block.id}
        blockType={block.type}
        handles={[
          { id: `${block.id}-input-left`, type: "input", label: "L" },
          { id: `${block.id}-input-right`, type: "input", label: "R" },
          { id: `${block.id}-output`, type: "output" },
        ]}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        isConnecting={isConnecting}
        connectingFromType={connectingFromType}
        connectedHandles={
          new Set([
            ...(leftInput ? [`${block.id}-input-left`] : []),
            ...(rightInput ? [`${block.id}-input-right`] : []),
            ...(block.output ? [`${block.id}-output`] : []),
          ])
        }
      />
    </BlockWrapper>
  )
}

// ============================================================================
// CONSTRAINT BLOCK (Display-only for now)
// ============================================================================

interface ConstraintBlockComponentProps {
  block: import("@/lib/block-system/types").ConstraintBlock
  isSelected?: boolean
  isDragging?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void
  className?: string
  style?: React.CSSProperties
  variableOptions?: string[]
  onConstraintChange?: (
    next: Partial<import("@/lib/block-system/types").ConstraintBlock>
  ) => void
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void
  isConnecting?: boolean
  connectingFromType?: string
}

export function ConstraintBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onDimensionsChange,
  className,
  style,
  variableOptions = [],
  onConstraintChange,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
}: ConstraintBlockComponentProps) {
  const { variableName, constraint, result } = block

  const constraintType = constraint.type
  const minValue = constraint.min ?? 0
  const maxValue = constraint.max ?? 0
  const operatorLabel =
    constraintType === "gte"
      ? ">="
      : constraintType === "gt"
        ? ">"
        : constraintType === "lte"
          ? "<="
          : constraintType === "lt"
            ? "<"
            : "range"

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onDimensionsChange={onDimensionsChange}
      className={className}
      style={style}
    >
      <div className="p-4">
        <div className="absolute -top-3 left-3 flex items-center gap-2 rounded bg-card px-2 text-xs text-muted-foreground">
          <span className="font-mono">âš™</span>
          <span>Constraint</span>
          <span className="font-mono text-foreground">{operatorLabel}</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Var</Label>
            <select
              value={
                variableOptions.includes(variableName)
                  ? variableName
                  : (variableOptions[0] ?? "")
              }
              onChange={(e) =>
                onConstraintChange?.({
                  variableName: e.target.value.trim() || "x",
                })
              }
              disabled={variableOptions.length === 0}
              className={cn(
                "h-7 w-24 rounded border border-input bg-background px-2 font-mono text-xs",
                variableOptions.length === 0 && "opacity-60"
              )}
            >
              {variableOptions.length === 0 ? (
                <option value="">Connect equation</option>
              ) : (
                variableOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              )}
            </select>
            <div className="ml-auto flex items-center gap-2">
              {constraintType !== "range" ? (
                <>
                  <Label className="text-xs text-muted-foreground">Value</Label>
                  <Input
                    type="number"
                    value={Number.isFinite(minValue) ? minValue : 0}
                    onChange={(e) => {
                      const nextMin = Number(e.target.value)
                      onConstraintChange?.({
                        constraint: {
                          ...constraint,
                          min: Number.isFinite(nextMin) ? nextMin : 0,
                        },
                      })
                    }}
                    className="h-7 w-24 text-right font-mono"
                  />
                </>
              ) : (
                <>
                  <Label className="text-xs text-muted-foreground">Min</Label>
                  <Input
                    type="number"
                    value={Number.isFinite(minValue) ? minValue : 0}
                    onChange={(e) => {
                      const nextMin = Number(e.target.value)
                      onConstraintChange?.({
                        constraint: {
                          ...constraint,
                          min: Number.isFinite(nextMin) ? nextMin : 0,
                        },
                      })
                    }}
                    className="h-7 w-20 text-right font-mono"
                  />
                  <Label className="text-xs text-muted-foreground">Max</Label>
                  <Input
                    type="number"
                    value={Number.isFinite(maxValue) ? maxValue : 0}
                    onChange={(e) => {
                      const nextMax = Number(e.target.value)
                      onConstraintChange?.({
                        constraint: {
                          ...constraint,
                          max: Number.isFinite(nextMax) ? nextMax : 0,
                        },
                      })
                    }}
                    className="h-7 w-20 text-right font-mono"
                  />
                </>
              )}
            </div>
          </div>

          {result !== undefined && (
            <div
              className={cn(
                "rounded px-3 py-1 font-mono text-sm",
                result
                  ? "bg-green-500/10 text-green-600"
                  : "bg-red-500/10 text-red-600"
              )}
            >
              {result ? "true" : "false"}
            </div>
          )}
        </div>
      </div>
      <ConnectionHandles
        blockId={block.id}
        blockType={block.type}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        isConnecting={isConnecting}
        connectingFromType={connectingFromType}
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
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void
  className?: string
  style?: React.CSSProperties
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
  connectedEquation?: EquationBlock | null
  connectedLogic?: import("@/lib/block-system/types").LogicBlock | null
  connectedComparator?: import("@/lib/block-system/types").ComparatorBlock | null
}

export function ShapeBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onDimensionsChange,
  className,
  style,
  onFillValueChange,
  onFillColorChange,
  onGridToggle,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
  connectedEquation,
  connectedLogic,
  connectedComparator,
}: ShapeBlockComponentProps) {
  const { shapeType, fillColor, fillValue, fillMode, showGrid } = block

  // Compute effective fill value from connections
  const effectiveFillValue = useMemo(() => {
    // Priority: Logic/Comparator boolean result > Equation numeric result > Manual fillValue
    if (connectedLogic && typeof connectedLogic.result === "boolean") {
      return connectedLogic.result ? 100 : 0
    }
    if (connectedComparator && typeof connectedComparator.result === "boolean") {
      return connectedComparator.result ? 100 : 0
    }
    if (connectedEquation?.equation) {
      try {
        const equation = connectedEquation.equation
        const variables: Record<string, number> = {}
        ;(connectedEquation.variables ?? []).forEach((v) => {
          variables[v.name] = v.value
        })

        let expr = equation.replace(/\s/g, "")
        const equalsIndex = expr.indexOf("=")
        if (equalsIndex !== -1) {
          expr = expr.substring(equalsIndex + 1)
        }

        // Use safe evaluateExpression instead of Function constructor
        const result = evaluateExpression(expr, variables)

        if (isFinite(result)) {
          // Normalize to 0-100 range based on fillMode
          if (fillMode === "percentage") {
            return Math.max(0, Math.min(100, result))
          } else if (fillMode === "decimal") {
            return Math.max(0, Math.min(1, result)) * 100
          } else {
            // fraction
            return Math.max(0, Math.min(1, result)) * 100
          }
        }
      } catch {
        // Fall through to manual value
      }
    }
    return fillValue
  }, [connectedEquation, connectedLogic, connectedComparator, fillValue, fillMode])

  const hasConnectedValue = !!(connectedEquation || connectedLogic || connectedComparator)

  const renderShape = () => {
    // Use block dimensions to calculate SVG size (accounting for padding and header)
    const svgSize = Math.min(
      block.dimensions.width * GRID_UNIT - 48, // Account for padding
      block.dimensions.height * GRID_UNIT - 120 // Account for header and controls
    )
    const center = svgSize / 2
    
    // Calculate fill percentage (0-100)
    const fillPercent = fillMode === "percentage" 
      ? effectiveFillValue 
      : fillMode === "decimal" 
        ? effectiveFillValue * 100 
        : effectiveFillValue

    switch (shapeType) {
      case "circle":
        return (
          <svg width={svgSize} height={svgSize} className="mx-auto">
            {/* Outer circle border */}
            <circle
              cx={center}
              cy={center}
              r={center - 10}
              fill="none"
              stroke={fillColor}
              strokeWidth="2"
            />
            {/* Inner filled circle - radius scales with fill percentage */}
            <circle
              cx={center}
              cy={center}
              r={((center - 10) * fillPercent) / 100}
              fill={fillColor}
              opacity="0.5"
            />
          </svg>
        )
      case "rectangle":
        return (
          <svg width={svgSize} height={svgSize} className="mx-auto">
            {/* Outer rectangle border */}
            <rect
              x="20"
              y="40"
              width={svgSize - 40}
              height={svgSize - 80}
              fill="none"
              stroke={fillColor}
              strokeWidth="2"
            />
            {/* Inner filled rectangle - height scales from bottom */}
            <rect
              x="20"
              y={40 + (svgSize - 80) * (1 - fillPercent / 100)}
              width={svgSize - 40}
              height={(svgSize - 80) * (fillPercent / 100)}
              fill={fillColor}
              opacity="0.5"
            />
          </svg>
        )
      case "square":
      default:
        return (
          <svg width={svgSize} height={svgSize} className="mx-auto">
            {/* Outer square border */}
            <rect
              x="10"
              y="10"
              width={svgSize - 20}
              height={svgSize - 20}
              fill="none"
              stroke={fillColor}
              strokeWidth="2"
            />
            {/* Inner filled square - width scales from left */}
            <rect
              x="10"
              y="10"
              width={((svgSize - 20) * fillPercent) / 100}
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
      onDimensionsChange={onDimensionsChange}
      className={className}
      style={style}
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

        {/* Connected Value Display or Manual Slider */}
        {hasConnectedValue ? (
          <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
            <Label className="text-xs">Connected Value</Label>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {connectedLogic
                  ? `Logic: ${connectedLogic.result ? "true" : "false"}`
                  : connectedComparator
                    ? `Comparator: ${connectedComparator.result ? "true" : "false"}`
                    : "Equation output"}
              </span>
              <span className="font-mono text-sm font-semibold">
                {effectiveFillValue.toFixed(2)}%
              </span>
            </div>
          </div>
        ) : (
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
        )}

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

// ============================================================================
// TABLE BLOCK (Dynamic Table for Limits and Equations)
// ============================================================================

interface TableBlockComponentProps {
  block: import("@/lib/block-system/types").TableBlock
  isSelected?: boolean
  isDragging?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void
  className?: string
  style?: React.CSSProperties
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void
  isConnecting?: boolean
  connectingFromType?: string
  connectedEquation?: EquationBlock | null
  connectedLimit?: LimitBlock | null
  connectedConstraints?: import("@/lib/block-system/types").ConstraintBlock[]
  onColumnChange?: (columns: import("@/lib/block-system/types").TableColumn[]) => void
  onRowChange?: (rows: import("@/lib/block-system/types").TableRow[]) => void
  onSettingsChange?: (settings: {
    autoGenerateRows?: boolean
    variableName?: string
    showGrid?: boolean
    highlightLastRow?: boolean
  }) => void
}

export function TableBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onDimensionsChange,
  className,
  style,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
  connectedEquation,
  connectedLimit,
  connectedConstraints = [],
  onSettingsChange,
}: TableBlockComponentProps) {
  const {
    columns = [],
    rows = [],
    autoGenerateRows = true,
    variableName = "x",
    showGrid = true,
    highlightLastRow = true,
  } = block

  // State for controlling how many rows to display
  const [displayedRowCount, setDisplayedRowCount] = useState(11) // Default: show 11 rows

  // Generate table data based on connected equation and limit
  const tableData = useMemo(() => {
    if (!connectedEquation?.equation) {
      return { columns: [], rows: [] }
    }

    const equation = connectedEquation.equation
    const variables: Record<string, number> = {}
    ;(connectedEquation.variables ?? []).forEach((v) => {
      variables[v.name] = v.value
    })

    // Default columns based on equation
    const defaultColumns: import("@/lib/block-system/types").TableColumn[] = [
      { id: "x", label: "x", type: "variable", variableName: "x" },
      { id: "y", label: "y = f(x)", type: "result", equation },
    ]

    // Generate rows based on limit or default range
    const generatedRows: import("@/lib/block-system/types").TableRow[] = []

    if (connectedLimit && autoGenerateRows) {
      // Generate limit approach values with more precision steps
      const limitValue = connectedLimit.limitValue
      const approach = connectedLimit.approach
      const isInfinite = connectedLimit.isInfinite
      const infiniteDirection = connectedLimit.infiniteDirection || 'positive'
      const stepSizes = [0.0001, 0.001, 0.01, 0.1] // Multiple step sizes for detailed approach
      const stepsPerSize = 2 // How many values per step size

      const generateSide = (direction: "left" | "right") => {
        const sideRows: import("@/lib/block-system/types").TableRow[] = []

        if (isInfinite) {
          // For infinite limits, generate increasingly large values
          const baseValue = infiniteDirection === 'positive' ? 10 : -10
          const multiplier = infiniteDirection === 'positive' ? 1 : -1
          
          for (const stepSize of stepSizes) {
            for (let i = 1; i <= stepsPerSize; i++) {
              const x = baseValue * multiplier * i * (1 / stepSize)
              variables[variableName] = x
              const y = evaluateEquationAtX(equation, variables)
              sideRows.push({
                id: `row-${direction}-inf-${stepSize}-${i}`,
                values: {
                  x: parseFloat(x.toFixed(6)),
                  y: parseFloat(y.toFixed(6)),
                },
              })
            }
          }
          
          // Sort by x value
          const getNumericValue = (row: import("@/lib/block-system/types").TableRow, key: string): number => {
            const val = row.values[key]
            if (typeof val === 'number') return val
            if (typeof val === 'string') return parseFloat(val) || 0
            return 0
          }
          
          if (infiniteDirection === 'positive') {
            sideRows.sort((a, b) => getNumericValue(a, 'x') - getNumericValue(b, 'x'))
          } else {
            sideRows.sort((a, b) => getNumericValue(b, 'x') - getNumericValue(a, 'x'))
          }
        } else {
          // For finite limits, generate approach values
          // Special handling for limits approaching 0
          const isApproachingZero = Math.abs(limitValue) < 0.0001
          
          for (const stepSize of stepSizes) {
            for (let i = stepsPerSize; i >= 1; i--) {
              let x: number
              if (isApproachingZero) {
                // For x → 0, use symmetric approach: -0.1, -0.01, 0.01, 0.1
                x = direction === "left" ? -stepSize * i : stepSize * i
              } else {
                x = direction === "left"
                  ? limitValue - stepSize * i
                  : limitValue + stepSize * i
              }
              variables[variableName] = x
              const y = evaluateEquationAtX(equation, variables)
              sideRows.push({
                id: `row-${direction}-${stepSize}-${i}`,
                values: {
                  x: parseFloat(x.toFixed(6)),
                  y: parseFloat(y.toFixed(6)),
                },
              })
            }
          }

          // Sort by x value
          const getNumericValue = (row: import("@/lib/block-system/types").TableRow, key: string): number => {
            const val = row.values[key]
            if (typeof val === 'number') return val
            if (typeof val === 'string') return parseFloat(val) || 0
            return 0
          }

          sideRows.sort((a, b) => getNumericValue(a, 'x') - getNumericValue(b, 'x'))
        }

        return sideRows
      }

      if (approach === "left" || approach === "both") {
        generatedRows.push(...generateSide("left"))
      }

      if (approach === "right" || approach === "both") {
        generatedRows.push(...generateSide("right"))
      }

      // Add the limit point itself at the end (only for finite limits)
      if (!isInfinite && Math.abs(limitValue) > 0.0001) {
        variables[variableName] = limitValue
        const yAtLimit = evaluateEquationAtX(equation, variables)
        generatedRows.push({
          id: "row-limit",
          values: {
            x: parseFloat(limitValue.toFixed(6)),
            y: isFinite(yAtLimit) ? parseFloat(yAtLimit.toFixed(6)) : NaN,
          },
        })
      }
    } else {
      // Default: generate a simple table from -5 to 5
      for (let x = -5; x <= 5; x++) {
        variables[variableName] = x
        const y = evaluateEquationAtX(equation, variables)
        generatedRows.push({
          id: `row-${x}`,
          values: { x, y: parseFloat(y.toFixed(4)) },
        })
      }
    }

    return {
      columns: defaultColumns,
      rows: generatedRows,
    }
  }, [connectedEquation, connectedLimit, autoGenerateRows, variableName])

  // Filter rows based on connected constraints
  const filteredTableData = useMemo(() => {
    if (!connectedConstraints.length || !tableData.rows.length) {
      return tableData
    }

    const filteredRows = tableData.rows.filter((row) => {
      // Check if row satisfies all constraints
      return connectedConstraints.every((constraint) => {
        const varName = constraint.variableName
        const rowValue = row.values[varName]
        if (typeof rowValue !== "number") return true

        const { type, min, max } = constraint.constraint
        switch (type) {
          case "gte":
            return min === undefined || rowValue >= min
          case "gt":
            return min === undefined || rowValue > min
          case "lte":
            return max === undefined || rowValue <= max
          case "lt":
            return max === undefined || rowValue < max
          case "range":
            return (min === undefined || rowValue >= min) &&
              (max === undefined || rowValue <= max)
          default:
            return true
        }
      })
    })

    return {
      columns: tableData.columns,
      rows: filteredRows,
    }
  }, [tableData, connectedConstraints])

  // Get the rows to display based on the current count
  const displayedRows = useMemo(() => {
    const allRows = rows.length > 0 ? rows : filteredTableData.rows
    return allRows.slice(0, displayedRowCount)
  }, [rows, filteredTableData.rows, displayedRowCount])

  // Reset displayed row count when limit or equation changes
  useEffect(() => {
    setDisplayedRowCount(11)
  }, [connectedLimit, connectedEquation])

  // Note: We don't sync tableData back to block state to avoid infinite loops.
  // The table data is derived from connected equation/limit and displayed directly.
  // The block's columns/rows are only used for manually configured tables.

  const handleHeaderClick = (columnId: string) => {
    // Could be used for column sorting or editing
  }

  const handleShowMore = () => {
    setDisplayedRowCount((prev) => Math.min(prev + 10, filteredTableData.rows.length))
  }

  const handleShowAll = () => {
    setDisplayedRowCount(filteredTableData.rows.length)
  }

  const hasMoreRows = displayedRowCount < filteredTableData.rows.length

  const connectedHandleIds = new Set([
    ...(block.sourceEquationId
      ? [`${block.id}-input-equation-${block.sourceEquationId}`]
      : []),
    ...(block.sourceLimitId
      ? [`${block.id}-input-limit-${block.sourceLimitId}`]
      : []),
    ...(block.sourceConstraintIds || []).map(
      (id) => `${block.id}-input-constraint-${id}`
    ),
  ])

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onDimensionsChange={onDimensionsChange}
      className={className}
      style={style}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">📊</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">
              {displayedRows.length} / {filteredTableData.rows.length} rows ×{" "}
              {columns.length || filteredTableData.columns.length} columns
            </span>
            {connectedEquation && (
              <span className="text-xs text-green-600">✓ Equation connected</span>
            )}
            {connectedConstraints.length > 0 && (
              <span className="text-xs text-primary">
                {connectedConstraints.length} constraint
                {connectedConstraints.length !== 1 ? "s" : ""} filtering
              </span>
            )}
            {connectedConstraints.length > 0 && (
              <span className="text-xs text-muted-foreground">
                (from {tableData.rows.length} total)
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onSettingsChange?.({ autoGenerateRows: !autoGenerateRows })
            }
            className={cn(
              "h-6 text-xs",
              autoGenerateRows && "bg-primary/10 text-primary"
            )}
          >
            Auto
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {!connectedEquation && connectedConstraints.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <div className="text-center">
              <p>Connect an equation to display values</p>
              <p className="mt-1 text-xs">
                Or connect a constraint that&apos;s linked to an equation
              </p>
            </div>
          </div>
        ) : !connectedEquation && connectedConstraints.length > 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <div className="text-center">
              <p>Constraint connected but no equation found</p>
              <p className="mt-2 text-xs">
                Make sure the constraint is connected to an equation first
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-primary">
                  {connectedConstraints.length} constraint
                  {connectedConstraints.length !== 1 ? "s" : ""} connected:
                </p>
                {connectedConstraints.map((c) => (
                  <p key={c.id} className="text-xs font-mono">
                    {c.variableName} {c.constraint.type === 'gte' ? '≥' : c.constraint.type === 'gt' ? '>' : c.constraint.type === 'lte' ? '≤' : c.constraint.type === 'lt' ? '<' : 'range'} {c.constraint.min}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ) : filteredTableData.rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <div className="text-center">
              <p>No rows match the constraints</p>
              {connectedConstraints.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-primary">
                    {connectedConstraints.length} constraint
                    {connectedConstraints.length !== 1 ? "s" : ""} active:
                  </p>
                  {connectedConstraints.map((c) => (
                    <p key={c.id} className="text-xs font-mono">
                      {c.variableName} {c.constraint.type === 'gte' ? '≥' : c.constraint.type === 'gt' ? '>' : c.constraint.type === 'lte' ? '≤' : c.constraint.type === 'lt' ? '<' : 'range'} {c.constraint.min}
                    </p>
                  ))}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Tip: Connect constraint directly to table for filtering
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {(columns.length > 0 ? columns : filteredTableData.columns).map(
                      (col) => (
                        <th
                          key={col.id}
                          onClick={() => handleHeaderClick(col.id)}
                          className={cn(
                            "border-b border-border px-3 py-2 text-left font-medium",
                            showGrid && "border-r last:border-r-0"
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-mono">{col.label}</span>
                            {col.type === "variable" && (
                              <span className="text-xs text-muted-foreground">
                                (var)
                              </span>
                            )}
                            {col.type === "result" && (
                              <span className="text-xs text-muted-foreground">
                                (calc)
                              </span>
                            )}
                          </div>
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((row, index) => {
                    const isLastRow = index === displayedRows.length - 1
                    const isLimitRow = row.id === "row-limit"
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "transition-colors hover:bg-muted/30",
                          highlightLastRow &&
                            (isLastRow || isLimitRow) &&
                            "bg-primary/5 font-medium"
                        )}
                      >
                        {(columns.length > 0 ? columns : filteredTableData.columns).map(
                          (col) => (
                            <td
                              key={`${row.id}-${col.id}`}
                              className={cn(
                                "border-b border-border px-3 py-2 font-mono text-xs",
                                showGrid && "border-r last:border-r-0"
                              )}
                            >
                              {row.values[col.id] !== undefined
                                ? String(row.values[col.id])
                                : "-"}
                            </td>
                          )
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Show More / Show All buttons */}
            {connectedLimit && hasMoreRows && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowMore}
                  className="flex-1"
                >
                  Show More (+10)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowAll}
                >
                  Show All ({tableData.rows.length})
                </Button>
              </div>
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
        connectedHandles={connectedHandleIds}
      />
    </BlockWrapper>
  )
}

// Helper function to evaluate equation at a specific x value
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

    // Use safe evaluateExpression instead of Function constructor
    return evaluateExpression(expr, variables)
  } catch {
    return NaN
  }
}
