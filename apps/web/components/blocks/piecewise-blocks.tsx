"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  GRID_UNIT,
  type PiecewiseLimiterBlock,
  type PiecewiseBuilderBlock,
  type ConnectionHandleType,
  type VariableConstraint,
  getTokenClassName,
  parseEquation,
} from "@/lib/block-system/types"
import { ConnectionHandles } from "@/components/connections/connection-handles"
import { BlockWrapper } from "./block-components"

// ============================================================================
// PIECEWISE LIMITER BLOCK
// ============================================================================

interface PiecewiseLimiterBlockComponentProps {
  block: PiecewiseLimiterBlock
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
  onBlockChange?: (updates: Partial<PiecewiseLimiterBlock>) => void
}

export function PiecewiseLimiterBlockComponent({
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
  onBlockChange,
}: PiecewiseLimiterBlockComponentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(block.displayLabel || "")
  const inputRef = useRef<HTMLInputElement>(null)

  const connectedHandleIds = new Set([
    block.sourceEquationId ? `${block.id}-input-equation` : "",
    `${block.id}-output-builder`,
  ].filter(Boolean))

  const handleConstraintChange = useCallback((constraint: VariableConstraint) => {
    onBlockChange?.({ constraint })
  }, [onBlockChange])

  const handleVariableChange = useCallback((variableName: string) => {
    onBlockChange?.({ variableName })
  }, [onBlockChange])

  const handleEnabledChange = useCallback((enabled: boolean) => {
    onBlockChange?.({ enabled })
  }, [onBlockChange])

  const handleLabelSave = useCallback(() => {
    onBlockChange?.({ displayLabel: editLabel.trim() || undefined })
    setIsEditing(false)
  }, [editLabel, onBlockChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLabelSave()
    } else if (e.key === "Escape") {
      setEditLabel(block.displayLabel || "")
      setIsEditing(false)
    }
  }, [handleLabelSave, block.displayLabel])

  // Generate constraint display string
  const constraintDisplay = (() => {
    const { type, min, max } = block.constraint
    const varName = block.variableName

    switch (type) {
      case "gte": return `${varName} ≥ ${min}`
      case "gt": return `${varName} > ${min}`
      case "lte": return `${varName} ≤ ${min}`
      case "lt": return `${varName} < ${min}`
      case "range": return `${min} ≤ ${varName} ≤ ${max}`
      default: return ""
    }
  })()

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
      <div className="flex h-full flex-col p-3">
        {/* Header */}
        <div className="mx-2 mb-2 flex items-center gap-2 border-b border-border pb-2">
          <span className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">
            {block.variableName}
          </span>
          <h3 className="text-sm font-semibold text-foreground">Domain Limiter</h3>
        </div>

        {/* Equation Display (if connected) */}
        <div className="mx-2 mb-2 rounded-md bg-muted/50 px-2 py-1.5">
          <div className="text-xs text-muted-foreground">Equation:</div>
          <div className="font-mono text-sm text-foreground">
            {block.sourceEquationId ? (
              <span className="text-green-600 dark:text-green-400">Connected</span>
            ) : (
              <span className="text-muted-foreground">Not connected</span>
            )}
          </div>
        </div>

        {/* Variable Selector */}
        <div className="mx-2 mb-2 space-y-1">
          <Label className="text-xs">Variable</Label>
          <Select
            value={block.variableName}
            onValueChange={(value) => value && handleVariableChange(value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="x">x</SelectItem>
              <SelectItem value="y">y</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Constraint Type */}
        <div className="mx-2 mb-2 space-y-1">
          <Label className="text-xs">Constraint Type</Label>
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant={block.constraint.type === "lt" ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => handleConstraintChange({ ...block.constraint, type: "lt" })}
            >
              &lt;
            </Button>
            <Button
              variant={block.constraint.type === "lte" ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => handleConstraintChange({ ...block.constraint, type: "lte" })}
            >
              ≤
            </Button>
            <Button
              variant={block.constraint.type === "gt" ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => handleConstraintChange({ ...block.constraint, type: "gt" })}
            >
              &gt;
            </Button>
            <Button
              variant={block.constraint.type === "gte" ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => handleConstraintChange({ ...block.constraint, type: "gte" })}
            >
              ≥
            </Button>
          </div>
        </div>

        {/* Constraint Value(s) */}
        {block.constraint.type === "range" ? (
          <div className="mx-2 mb-2 grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Min</Label>
              <Input
                type="number"
                value={block.constraint.min ?? 0}
                onChange={(e) =>
                  handleConstraintChange({
                    ...block.constraint,
                    min: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max</Label>
              <Input
                type="number"
                value={block.constraint.max ?? 0}
                onChange={(e) =>
                  handleConstraintChange({
                    ...block.constraint,
                    max: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-8 text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="mx-2 mb-2 space-y-1">
            <Label className="text-xs">Value</Label>
            <Input
              type="number"
              value={block.constraint.min ?? 0}
              onChange={(e) =>
                handleConstraintChange({
                  ...block.constraint,
                  min: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8 text-xs"
            />
          </div>
        )}

        {/* Constraint Display */}
        <div className="mx-2 mb-2 rounded-md bg-primary/10 px-2 py-1.5 text-center">
          <div className="text-xs font-medium text-primary">{constraintDisplay}</div>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="mx-2 mt-auto flex items-center justify-between border-t border-border pt-2">
          <Label htmlFor="enabled-toggle" className="text-xs">Enabled</Label>
          <Switch
            id="enabled-toggle"
            checked={block.enabled}
            onCheckedChange={handleEnabledChange}
          />
        </div>

        {/* Optional Label */}
        <div className="mx-2 mt-2 border-t border-border pt-2">
          {isEditing ? (
            <Input
              ref={inputRef}
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={handleLabelSave}
              onKeyDown={handleKeyDown}
              placeholder="e.g., x < 0"
              className="h-7 text-xs"
              autoFocus
            />
          ) : (
            <Button
              variant="ghost"
              className="h-7 w-full text-xs"
              onClick={() => {
                setEditLabel(block.displayLabel || "")
                setIsEditing(true)
              }}
            >
              {block.displayLabel ? (
                <span className="font-mono">{block.displayLabel}</span>
              ) : (
                <span className="text-muted-foreground">+ Add label</span>
              )}
            </Button>
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
        limiter
      </div>
    </BlockWrapper>
  )
}

// ============================================================================
// PIECEWISE BUILDER BLOCK
// ============================================================================

interface PiecewiseBuilderBlockComponentProps {
  block: PiecewiseBuilderBlock
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
  onBlockChange?: (updates: Partial<PiecewiseBuilderBlock>) => void
  // Calculated piecewise data for display
  calculatedPieces?: Array<{
    equation: string
    constraint: VariableConstraint
    variableName: string
    displayLabel?: string
  }>
}

export function PiecewiseBuilderBlockComponent({
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
  onBlockChange,
  calculatedPieces = [],
}: PiecewiseBuilderBlockComponentProps) {
  const [isEditingFallback, setIsEditingFallback] = useState(false)
  const [editFallback, setEditFallback] = useState(block.fallbackEquation || "0")
  const inputRef = useRef<HTMLInputElement>(null)

  const connectedHandleIds = new Set([
    ...block.connectedLimiterIds.map((id) => `${block.id}-input-limiter-${id}`),
    `${block.id}-output-chart`,
  ])

  const handleFallbackChange = useCallback((fallback: string) => {
    onBlockChange?.({ fallbackEquation: fallback })
  }, [onBlockChange])

  const handleFallbackEnabledChange = useCallback((enabled: boolean) => {
    onBlockChange?.({ fallbackEnabled: enabled })
  }, [onBlockChange])

  const handleFallbackSave = useCallback(() => {
    handleFallbackChange(editFallback.trim() || "0")
    setIsEditingFallback(false)
  }, [editFallback, handleFallbackChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFallbackSave()
    } else if (e.key === "Escape") {
      setEditFallback(block.fallbackEquation || "0")
      setIsEditingFallback(false)
    }
  }, [handleFallbackSave, block.fallbackEquation])

  // Generate piecewise notation for display
  const piecewiseNotation = (() => {
    if (calculatedPieces.length === 0 && !block.fallbackEnabled) {
      return "No pieces defined"
    }

    const pieces: string[] = []
    for (const piece of calculatedPieces) {
      const { type, min, max } = piece.constraint
      const varName = piece.variableName
      let constraintStr = ""

      switch (type) {
        case "gte": constraintStr = `${varName} ≥ ${min}`; break
        case "gt": constraintStr = `${varName} > ${min}`; break
        case "lte": constraintStr = `${varName} ≤ ${min}`; break
        case "lt": constraintStr = `${varName} < ${min}`; break
        case "range": constraintStr = `${min} ≤ ${varName} ≤ ${max}`; break
      }

      pieces.push(`${piece.equation}, if ${piece.displayLabel || constraintStr}`)
    }

    if (block.fallbackEnabled) {
      pieces.push(`${block.fallbackEquation || "0"}, otherwise`)
    }

    return pieces.join("; ")
  })()

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
      <div className="flex h-full flex-col p-3">
        {/* Header */}
        <div className="mx-2 mb-2 flex items-center gap-2 border-b border-border pb-2">
          <span className="font-mono text-sm font-semibold text-pink-600 dark:text-pink-400">
            f(x)
          </span>
          <h3 className="text-sm font-semibold text-foreground">Piecewise Builder</h3>
        </div>

        {/* Connected Pieces Count */}
        <div className="mx-2 mb-2 rounded-md bg-muted/50 px-2 py-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Connected Pieces:</span>
            <span className="text-sm font-semibold text-foreground">
              {block.connectedLimiterIds.length}
            </span>
          </div>
        </div>

        {/* Pieces Preview */}
        <div className="mx-2 mb-2 flex-1 overflow-auto rounded-md border border-border bg-muted/30 p-2">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Preview:
          </div>
          <div className="font-mono text-xs leading-relaxed">
            {calculatedPieces.length > 0 ? (
              <div className="space-y-1">
                {calculatedPieces.map((piece, i) => {
                  const { type, min, max } = piece.constraint
                  const varName = piece.variableName
                  let constraintStr = ""

                  switch (type) {
                    case "gte": constraintStr = `${varName} ≥ ${min}`; break
                    case "gt": constraintStr = `${varName} > ${min}`; break
                    case "lte": constraintStr = `${varName} ≤ ${min}`; break
                    case "lt": constraintStr = `${varName} < ${min}`; break
                    case "range": constraintStr = `${min} ≤ ${varName} ≤ ${max}`; break
                  }

                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-purple-600 dark:text-purple-400">
                        {piece.equation}
                      </span>
                      <span className="text-muted-foreground">if</span>
                      <span className="text-primary">
                        {piece.displayLabel || constraintStr}
                      </span>
                    </div>
                  )
                })}
                {block.fallbackEnabled && (
                  <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
                    <span className="text-purple-600 dark:text-purple-400">
                      {block.fallbackEquation || "0"}
                    </span>
                    <span className="text-muted-foreground">otherwise</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground italic">
                Connect piecewise limiters to build function
              </div>
            )}
          </div>
        </div>

        {/* Fallback Equation */}
        <div className="mx-2 mb-2 border-t border-border pt-2">
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs">Fallback (otherwise)</Label>
            <Switch
              checked={block.fallbackEnabled}
              onCheckedChange={handleFallbackEnabledChange}
            />
          </div>
          {block.fallbackEnabled && (
            isEditingFallback ? (
              <Input
                ref={inputRef}
                type="text"
                value={editFallback}
                onChange={(e) => setEditFallback(e.target.value)}
                onBlur={handleFallbackSave}
                onKeyDown={handleKeyDown}
                placeholder="e.g., 0"
                className="h-7 text-xs"
                autoFocus
              />
            ) : (
              <Button
                variant="outline"
                className="h-7 w-full text-xs font-mono"
                onClick={() => {
                  setEditFallback(block.fallbackEquation || "0")
                  setIsEditingFallback(true)
                }}
              >
                {block.fallbackEquation || "0"}
              </Button>
            )
          )}
        </div>

        {/* Full Notation Display */}
        <Card className="mx-2 mt-auto">
          <CardContent className="p-2">
            <div className="text-[10px] text-muted-foreground mb-0.5">
              Combined notation:
            </div>
            <div className="font-mono text-xs leading-tight">
              {piecewiseNotation}
            </div>
          </CardContent>
        </Card>
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
        piecewise
      </div>
    </BlockWrapper>
  )
}
