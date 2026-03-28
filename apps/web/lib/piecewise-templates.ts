"use client"

import type { BlockPreset } from "@/components/blocks/block-library"

/**
 * Piecewise Function Templates
 * Quick presets for common piecewise functions
 */

export interface PiecewiseTemplate {
  id: string
  name: string
  description: string
  category: 'basic' | 'advanced' | 'physics' | 'economics'
  pieces: Array<{
    equation: string
    constraintType: 'lt' | 'lte' | 'gt' | 'gte' | 'range'
    constraintValue: number
    constraintValue2?: number // For range
    displayLabel: string
  }>
  fallbackEquation?: string
  variableSliders?: Array<{
    name: string
    defaultValue: number
    min: number
    max: number
    step: number
  }>
}

export const PIECEWISE_TEMPLATES: PiecewiseTemplate[] = [
  // BASIC FUNCTIONS
  {
    id: 'absolute-value',
    name: 'Absolute Value',
    description: '|x| = -x if x < 0, x if x ≥ 0',
    category: 'basic',
    pieces: [
      {
        equation: 'y = -x',
        constraintType: 'lt',
        constraintValue: 0,
        displayLabel: 'x < 0',
      },
      {
        equation: 'y = x',
        constraintType: 'gte',
        constraintValue: 0,
        displayLabel: 'x ≥ 0',
      },
    ],
  },
  {
    id: 'sign-function',
    name: 'Sign Function',
    description: 'sgn(x) = -1 if x < 0, 0 if x = 0, 1 if x > 0',
    category: 'basic',
    pieces: [
      {
        equation: 'y = -1',
        constraintType: 'lt',
        constraintValue: 0,
        displayLabel: 'x < 0',
      },
      {
        equation: 'y = 0',
        constraintType: 'range',
        constraintValue: 0,
        constraintValue2: 0,
        displayLabel: 'x = 0',
      },
      {
        equation: 'y = 1',
        constraintType: 'gt',
        constraintValue: 0,
        displayLabel: 'x > 0',
      },
    ],
  },
  {
    id: 'heaviside-step',
    name: 'Heaviside Step Function',
    description: 'H(x) = 0 if x < 0, 1 if x ≥ 0',
    category: 'basic',
    pieces: [
      {
        equation: 'y = 0',
        constraintType: 'lt',
        constraintValue: 0,
        displayLabel: 'x < 0',
      },
      {
        equation: 'y = 1',
        constraintType: 'gte',
        constraintValue: 0,
        displayLabel: 'x ≥ 0',
      },
    ],
  },
  {
    id: 'ramp-function',
    name: 'Ramp Function',
    description: 'R(x) = 0 if x < 0, x if x ≥ 0',
    category: 'basic',
    pieces: [
      {
        equation: 'y = 0',
        constraintType: 'lt',
        constraintValue: 0,
        displayLabel: 'x < 0',
      },
      {
        equation: 'y = x',
        constraintType: 'gte',
        constraintValue: 0,
        displayLabel: 'x ≥ 0',
      },
    ],
  },
  {
    id: 'square-wave',
    name: 'Square Wave',
    description: 'f(x) = -1 if x < 0, 1 if 0 ≤ x < 1, -1 if x ≥ 1',
    category: 'basic',
    pieces: [
      {
        equation: 'y = -1',
        constraintType: 'lt',
        constraintValue: 0,
        displayLabel: 'x < 0',
      },
      {
        equation: 'y = 1',
        constraintType: 'range',
        constraintValue: 0,
        constraintValue2: 1,
        displayLabel: '0 ≤ x < 1',
      },
      {
        equation: 'y = -1',
        constraintType: 'gte',
        constraintValue: 1,
        displayLabel: 'x ≥ 1',
      },
    ],
  },

  // ADVANCED FUNCTIONS
  {
    id: 'triangle-wave',
    name: 'Triangle Wave',
    description: 'Linear rise and fall pattern',
    category: 'advanced',
    pieces: [
      {
        equation: 'y = -x - 2',
        constraintType: 'lt',
        constraintValue: -1,
        displayLabel: 'x < -1',
      },
      {
        equation: 'y = x',
        constraintType: 'range',
        constraintValue: -1,
        constraintValue2: 0,
        displayLabel: '-1 ≤ x < 0',
      },
      {
        equation: 'y = -x',
        constraintType: 'range',
        constraintValue: 0,
        constraintValue2: 1,
        displayLabel: '0 ≤ x < 1',
      },
      {
        equation: 'y = x - 2',
        constraintType: 'gte',
        constraintValue: 1,
        displayLabel: 'x ≥ 1',
      },
    ],
  },
  {
    id: 'gaussian-piecewise',
    name: 'Piecewise Gaussian',
    description: 'Different Gaussian curves for different ranges',
    category: 'advanced',
    pieces: [
      {
        equation: 'y = e^(-x²)',
        constraintType: 'lt',
        constraintValue: 0,
        displayLabel: 'x < 0',
      },
      {
        equation: 'y = 0.5 * e^(-x²)',
        constraintType: 'gte',
        constraintValue: 0,
        displayLabel: 'x ≥ 0',
      },
    ],
  },

  // PHYSICS APPLICATIONS
  {
    id: 'projectile-velocity',
    name: 'Projectile with Terminal Velocity',
    description: 'v(t) = gt if t < t_terminal, v_terminal if t ≥ t_terminal',
    category: 'physics',
    pieces: [
      {
        equation: 'v = 9.8 * t',
        constraintType: 'lt',
        constraintValue: 10,
        displayLabel: 't < 10s',
      },
      {
        equation: 'v = 98',
        constraintType: 'gte',
        constraintValue: 10,
        displayLabel: 't ≥ 10s',
      },
    ],
    variableSliders: [
      {
        name: 'g',
        defaultValue: 9.8,
        min: 1,
        max: 20,
        step: 0.1,
      },
      {
        name: 't_terminal',
        defaultValue: 10,
        min: 1,
        max: 100,
        step: 1,
      },
    ],
  },
  {
    id: 'spring-force',
    name: 'Nonlinear Spring',
    description: 'Different spring constants for compression vs extension',
    category: 'physics',
    pieces: [
      {
        equation: 'F = -k1 * x',
        constraintType: 'lt',
        constraintValue: 0,
        displayLabel: 'compression (x < 0)',
      },
      {
        equation: 'F = -k2 * x',
        constraintType: 'gte',
        constraintValue: 0,
        displayLabel: 'extension (x ≥ 0)',
      },
    ],
    variableSliders: [
      {
        name: 'k1',
        defaultValue: 10,
        min: 1,
        max: 100,
        step: 1,
      },
      {
        name: 'k2',
        defaultValue: 5,
        min: 1,
        max: 100,
        step: 1,
      },
    ],
  },
  {
    id: 'drag-force',
    name: 'Drag Force (Low vs High Speed)',
    description: 'Linear drag at low speed, quadratic at high speed',
    category: 'physics',
    pieces: [
      {
        equation: 'F = -b * v',
        constraintType: 'lt',
        constraintValue: 5,
        displayLabel: 'low speed (v < 5)',
      },
      {
        equation: 'F = -c * v²',
        constraintType: 'gte',
        constraintValue: 5,
        displayLabel: 'high speed (v ≥ 5)',
      },
    ],
    variableSliders: [
      {
        name: 'b',
        defaultValue: 1,
        min: 0.1,
        max: 10,
        step: 0.1,
      },
      {
        name: 'c',
        defaultValue: 0.5,
        min: 0.1,
        max: 10,
        step: 0.1,
      },
    ],
  },

  // ECONOMICS APPLICATIONS
  {
    id: 'progressive-tax',
    name: 'Progressive Tax Bracket',
    description: 'Different tax rates for different income levels',
    category: 'economics',
    pieces: [
      {
        equation: 'T = 0.10 * x',
        constraintType: 'lte',
        constraintValue: 10000,
        displayLabel: 'x ≤ $10,000 (10%)',
      },
      {
        equation: 'T = 1000 + 0.20 * (x - 10000)',
        constraintType: 'range',
        constraintValue: 10000,
        constraintValue2: 50000,
        displayLabel: '$10k < x ≤ $50k (20%)',
      },
      {
        equation: 'T = 9000 + 0.30 * (x - 50000)',
        constraintType: 'gt',
        constraintValue: 50000,
        displayLabel: 'x > $50,000 (30%)',
      },
    ],
    variableSliders: [
      {
        name: 'x',
        defaultValue: 30000,
        min: 0,
        max: 200000,
        step: 1000,
      },
    ],
  },
  {
    id: 'utility-function',
    name: 'Piecewise Utility Function',
    description: 'Different marginal utility for different consumption levels',
    category: 'economics',
    pieces: [
      {
        equation: 'U = 2 * x',
        constraintType: 'lt',
        constraintValue: 10,
        displayLabel: 'x < 10 units',
      },
      {
        equation: 'U = 20 + 1.5 * (x - 10)',
        constraintType: 'range',
        constraintValue: 10,
        constraintValue2: 50,
        displayLabel: '10 ≤ x < 50 units',
      },
      {
        equation: 'U = 80 + 0.5 * (x - 50)',
        constraintType: 'gte',
        constraintValue: 50,
        displayLabel: 'x ≥ 50 units',
      },
    ],
  },
  {
    id: 'supply-curve',
    name: 'Piecewise Supply Curve',
    description: 'Different supply elasticities at different price levels',
    category: 'economics',
    pieces: [
      {
        equation: 'Q = 0',
        constraintType: 'lt',
        constraintValue: 5,
        displayLabel: 'P < $5 (no supply)',
      },
      {
        equation: 'Q = 10 * (P - 5)',
        constraintType: 'range',
        constraintValue: 5,
        constraintValue2: 20,
        displayLabel: '$5 ≤ P < $20',
      },
      {
        equation: 'Q = 150 + 5 * (P - 20)',
        constraintType: 'gte',
        constraintValue: 20,
        displayLabel: 'P ≥ $20',
      },
    ],
  },
]

/**
 * Convert a template to block presets for easy creation
 */
export function templateToPresets(
  template: PiecewiseTemplate,
  baseY: number = 0
): Array<{ type: string; data: any }> {
  const presets: Array<{ type: string; data: any }> = []
  const startY = baseY

  // Create equations and limiters for each piece
  template.pieces.forEach((piece, index) => {
    const equationY = startY + index * 3
    const limiterY = startY + index * 3 + 1

    // Equation block
    presets.push({
      type: 'equation',
      data: {
        equation: piece.equation,
        position: { x: 2, y: equationY },
      },
    })

    // Piecewise limiter
    presets.push({
      type: 'piecewise-limiter',
      data: {
        variableName: 'x',
        constraint: {
          type: piece.constraintType,
          min: piece.constraintValue,
          max: piece.constraintValue2,
        },
        enabled: true,
        displayLabel: piece.displayLabel,
        position: { x: 2, y: limiterY },
      },
    })
  })

  // Piecewise builder
  presets.push({
    type: 'piecewise-builder',
    data: {
      connectedLimiterIds: [], // Will be connected automatically
      fallbackEnabled: !!template.fallbackEquation,
      fallbackEquation: template.fallbackEquation || '0',
      position: { x: 15, y: startY + template.pieces.length * 1.5 },
    },
  })

  // Chart block
  presets.push({
    type: 'chart',
    data: {
      dimensions: { width: 24, height: 16 },
      position: { x: 25, y: startY },
    },
  })

  // Table block
  presets.push({
    type: 'table',
    data: {
      autoGenerateRows: true,
      variableName: 'x',
      showGrid: true,
      highlightLastRow: true,
      position: { x: 25, y: startY + 18 },
    },
  })

  return presets
}

export default PIECEWISE_TEMPLATES
