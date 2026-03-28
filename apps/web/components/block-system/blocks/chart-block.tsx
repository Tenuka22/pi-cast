/**
 * Chart Block Component
 *
 * Renders a chart block for visualizing equations using function-plot.
 * 
 * NODE-BASED CALCULATION:
 * - Receives calculated data from node-calculation-engine
 * - Data flows through the chain: Variable → Equation → Constraint → Limit → Chart
 * - Chart just renders, doesn't calculate (separation of concerns)
 */

"use client"

import React, { useMemo, useRef, useEffect } from "react"
import functionPlot from "function-plot"
import {
  type ChartBlock,
  type EquationBlock,
  type ConnectionHandleType,
  type NodeData,
} from "@/lib/block-system/types"
import { BlockWrapper } from "./block-wrapper"
import { ConnectionHandles } from "@/components/connections/connection-handles"
import {
  GraphConfig,
  DEFAULT_GRAPH_CONFIG,
} from "@/lib/visualization/graph-renderer"
import { calculateOutputNode } from "@/lib/block-system/node-calculation-engine"

interface ChartBlockComponentProps {
  block: ChartBlock
  isSelected?: boolean
  isDragging?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void
  isConnecting?: boolean
  connectingFromType?: string
  // Node chain data (calculated by node-calculation-engine)
  calculatedData?: NodeData
  // Legacy props (kept for backwards compatibility)
  connectedEquations?: EquationBlock[]
  connectedConstraints?: Array<{
    variableName: string
    constraint: {
      type: 'gte' | 'gt' | 'lte' | 'lt' | 'range'
      min?: number
      max?: number
    }
  }>
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
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
  calculatedData,
  connectedEquations = [],
  connectedConstraints = [],
}: ChartBlockComponentProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const [defaultDimensions] = React.useState(block.dimensions)
  const MIN_CANVAS_HEIGHT = 240
  const width = block.dimensions.width * 32
  const height = block.dimensions.height * 32
  const effectiveHeight = Math.max(height, MIN_CANVAS_HEIGHT)

  const config = useMemo<GraphConfig>(() => {
    const base = block.chartConfig
    
    // Apply constraints to xAxis domain
    let xMin = base?.xAxis?.min ?? DEFAULT_GRAPH_CONFIG.xAxis.min
    let xMax = base?.xAxis?.max ?? DEFAULT_GRAPH_CONFIG.xAxis.max
    
    // Process constraints to modify domain
    for (const constraint of connectedConstraints) {
      if (constraint.variableName === 'x') {
        const { type, min, max } = constraint.constraint
        switch (type) {
          case 'gte':
            if (min !== undefined && min > xMin) xMin = min
            break
          case 'gt':
            if (min !== undefined && min >= xMin) xMin = min + 0.001
            break
          case 'lte':
            if (max !== undefined && max < xMax) xMax = max
            break
          case 'lt':
            if (max !== undefined && max <= xMax) xMax = max - 0.001
            break
          case 'range':
            if (min !== undefined && min > xMin) xMin = min
            if (max !== undefined && max < xMax) xMax = max
            break
        }
      }
    }
    
    return {
      width,
      height: effectiveHeight,
      xAxis: {
        ...DEFAULT_GRAPH_CONFIG.xAxis,
        ...(base?.xAxis ?? {}),
        min: xMin,
        max: xMax,
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
  }, [block.chartConfig, connectedConstraints, effectiveHeight, width])

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

      return [{
        key: 'calc-0',
        equation: calculatedData.equation,
        variables,
        color: PLOT_COLORS[0] || "#c084fc",
        label: calculatedData.equation,
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

      return {
        key: `eq${index}`,
        equation: equationBlock.equation,
        variables,
        color: PLOT_COLORS[index % PLOT_COLORS.length] || "#c084fc",
        label: equationBlock.equation,
      }
    })
  }, [calculatedData, connectedEquations])

  // Build function strings with substituted variables
  const functionData = useMemo(() => {
    return plots.map((plot) => {
      let fn = plot.equation
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

      return {
        fn,
        color: plot.color,
        graphType: "polyline" as const,
      }
    })
  }, [plots])

  // Render the plot when plots or config changes
  useEffect(() => {
    if (!containerRef.current || functionData.length === 0) return

    // Clear previous content
    containerRef.current.innerHTML = ""

    try {
      functionPlot({
        target: containerRef.current,
        width: config.width,
        height: config.height,
        yAxis: {
          domain: [config.yAxis.min, config.yAxis.max],
        },
        xAxis: {
          domain: [config.xAxis.min, config.xAxis.max],
        },
        grid: config.showGrid,
        data: functionData,
        tip: {
          xLine: true,
          yLine: true,
        },
      })
    } catch (error) {
      console.error("Error plotting function:", error)
    }
  }, [functionData, config])

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
      maxDimensions={defaultDimensions}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onDimensionsChange={onDimensionsChange}
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
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-muted/50"
        style={{
          minHeight: MIN_CANVAS_HEIGHT,
          height: effectiveHeight,
          maxHeight: effectiveHeight,
          width,
          maxWidth: width,
        }}
      >
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

export default ChartBlockComponent
