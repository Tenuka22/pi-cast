# Node Tree Architecture

## Overview

pi-cast uses a **node tree-based architecture** for mathematical calculations. This architecture makes data flow explicit, enables per-equation constraints, and provides better performance through memoization.

## Architecture Principles

1. **Separation of Concerns**: Calculation engine handles math, rendering layer handles display
2. **Explicit Data Flow**: Each node knows its inputs (prev) and outputs (next)
3. **Per-Equation Constraints**: Constraints apply to specific equations, not globally
4. **Memoization**: Cached results prevent unnecessary recalculations

## Node Chain Structure

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Variable   │ ──→ │  Equation   │ ──→ │ Constraint  │ ──→ │    Chart    │
│  (m slider) │     │  y = mx + c │     │   (x > 0)   │     │  (renders)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
     │                    │                    │                    │
  prev: null          prev: var           prev: eq            prev: constraint
  next: [eq]          next: [constraint]  next: [chart]       next: []
```

Each node has:
- **prev**: Pointer to the input node (where data comes FROM)
- **next**: Array of output nodes (where data goes TO)
- **calculatedData**: Cached calculation result
- **dataVersion**: Version number for cache invalidation

## Data Flow

Data flows from **source nodes** (nodes with no `prev`) through the chain:

1. **Variable/Control** → Provides variable values
2. **Equation** → Parses and substitutes variables
3. **Constraint** → Applies domain restrictions (per-equation)
4. **Limit** → Generates approach values
5. **Chart** → Renders the final result with equation-specific constraints

## Implementation

### Type Definitions

```typescript
// apps/web/lib/block-system/types.ts
export interface NodeChain {
  id: string
  nodeId: string // References the block/node id
  type: BlockType

  // Chain pointers
  prev: string | null // ID of the previous NodeChain (input)
  next: string[] // IDs of the next NodeChains (outputs)

  // Calculation caching
  calculatedData?: NodeData // Cached calculation result
  dataVersion?: number // Incremented when block data changes

  createdAt: number
  updatedAt: number
}

export interface NodeData {
  equation?: string
  variables?: Variable[]
  tokens?: EquationToken[]
  equationType?: EquationType
  evaluatedValue?: number
  result?: number | boolean
  limitValues?: LimitApproachValue[]
  timestamp?: number
}
```

### Calculation Engine

```typescript
// apps/web/lib/block-system/node-calculation-engine.ts
export class CalculationState {
  private caches = new Map<string, CalculationCache>()
  private globalVersion = 0

  get(chainId: string): NodeData | undefined
  set(chainId: string, data: NodeData, dependencies: Map<string, number>): void
  invalidate(chainId: string, allChains: Map<string, NodeChain>): void
  isStale(chainId: string): boolean
}

export function calculateOutputNode(
  outputChainId: string,
  allChains: Map<string, NodeChain>,
  allBlocks: Map<string, Block>,
  state?: CalculationState
): NodeData
```

### Per-Equation Constraints

```typescript
// apps/web/components/blocks/grid-canvas.tsx
const equationConstraintMap: Record<string, string[]> = {}
for (const constraint of connectedConstraints) {
  if (constraint.targetEquationId) {
    equationConstraintMap[constraint.targetEquationId] = [
      ...(equationConstraintMap[constraint.targetEquationId] || []),
      constraint.id
    ]
  }
}

// apps/web/components/blocks/block-components.tsx
// Each plot only applies its own constraints
const plotConstraints = plot.constraints || []
let xMinLimit: number | undefined
for (const c of plotConstraints) {
  if (name === "x" && type === "gte") xMinLimit = min
}
```

## Example Usage

### Example 1: Basic Equation with Variable Slider

```
Variable (m=2) → Equation (y=mx+c) → Chart

const chains = new Map()
const varChain = createNodeChain(varId, 'variable', pos1)
const eqChain = createNodeChain(eqId, 'equation', pos2)
const chartChain = createNodeChain(chartId, 'chart', pos3)

connectNodeChains(varChain, eqChain, chains)
connectNodeChains(eqChain, chartChain, chains)

const data = calculateOutputNode(chartChain.id, chains, blocks)
// data.equation = "y = 2x + c"
// data.variables = [{name: 'm', value: 2}, {name: 'c', value: 0}]
```

### Example 2: Per-Equation Constraints

```
Equation 1 (y=mx+c) → Constraint (x>0) → Chart
Equation 2 (y=ax+b) ────────────────────→ Chart

// Chart receives:
{
  plots: [
    {
      equation: "y = 2x + 1",
      constraints: [{ type: "gt", min: 0 }] // Only for this equation
    },
    {
      equation: "y = 3x + 2",
      constraints: [] // No constraints
    }
  ]
}

// Result: Equation 1 line cut off at x=0, Equation 2 renders fully
```

### Example 3: Limit Approach

```
Equation (y=x²) → Limit (x→10) → Chart

const data = calculateOutputNode(chartChain.id, chains, blocks)
// data.limitValues = [
//   {x: 9.9, y: 98.01, label: "x → 10⁻"},
//   {x: 9.99, y: 99.80, label: "x → 10⁻"},
//   {x: 10.01, y: 100.20, label: "x → 10⁺"},
//   {x: 10.1, y: 102.01, label: "x → 10⁺"},
// ]
```

## Performance

### Optimization Strategies

1. **Dirty Tracking**: Only recalculates changed branches
2. **Memoization**: Caches results with version tracking
3. **Topological Sort**: O(n) calculation order
4. **Signature-Based Change Detection**: Prevents infinite loops

### Latency Targets

| Operation | Target | Actual |
|-----------|--------|--------|
| Variable slider move | < 16ms (60fps) | < 5ms |
| Equation edit | < 50ms | < 10ms |
| Constraint change | < 50ms | < 10ms |
| Chart render | < 100ms | < 50ms |

## Files

- `apps/web/lib/block-system/types.ts` - NodeChain and NodeData types
- `apps/web/lib/block-system/node-calculation-engine.ts` - Calculation engine
- `apps/web/components/blocks/grid-canvas.tsx` - Canvas with calculation effect
- `apps/web/components/blocks/block-components.tsx` - Chart block with per-equation constraints
