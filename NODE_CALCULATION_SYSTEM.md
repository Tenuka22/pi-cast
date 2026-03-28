# Node-Based Calculation System

## Overview

This document explains the node-based calculation architecture for pi-cast's block system. The system separates **calculation** from **rendering**, providing better performance, maintainability, and extensibility.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
│  (Variable slider move, equation edit, constraint change)   │
└─────────────────────────────────────────────────────────────┘
                          ↓ triggers
┌─────────────────────────────────────────────────────────────┐
│                  CALCULATION ENGINE                          │
│  (apps/web/lib/block-system/node-calculation-engine.ts)     │
│  - Topological sort (determines calculation order)          │
│  - Dirty tracking (only recalculates changed branches)      │
│  - Memoization (caches results per node)                    │
│  - Cycle detection (prevents infinite loops)                │
└─────────────────────────────────────────────────────────────┘
                          ↓ stores in
┌─────────────────────────────────────────────────────────────┐
│                  NODE CHAIN CACHE                            │
│  (NodeChain.calculatedData)                                 │
│  - Stores equation data with substituted variables          │
│  - Stores constraint information per equation               │
│  - Stores limit approach values                             │
└─────────────────────────────────────────────────────────────┘
                          ↓ reads from
┌─────────────────────────────────────────────────────────────┐
│                   RENDERING LAYER                            │
│  (chart-block.tsx, table-block.tsx, shape-block.tsx)       │
│  - Just renders cached data (no calculation)                │
│  - Fast, predictable rendering                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Example: `y = mx + c` with Constraints

### Setup
1. **Equation Block**: `y = mx + c`
2. **Variable Block**: Slider for `m` (connected to equation)
3. **Constraint Block**: `x > 0` (connected to equation)
4. **Chart Block**: Connected to both the constrained equation AND another equation without constraints

### Calculation Flow

```
Variable (m=2) ──→ Equation 1 (y=mx+c) ──→ Constraint (x>0) ──→ Chart
     │                    │                                      │
     │                    │                                      │
     └─ provides ───────┘                                      │
        m=2                                                     │
                                                                │
     Equation 2 (y=ax+b) ──────────────────────────────────────┘
     (no constraints)
```

### Step-by-Step Calculation

1. **Variable Block** provides: `{ variables: [{ name: 'm', value: 2 }] }`
2. **Equation 1** calculates:
   - Parses `y = mx + c`
   - Merges variables: `{ m: 2, c: 0, x: 0, y: 0 }`
   - Stores: `{ equation: 'y = mx + c', variables: [...] }`
3. **Constraint Block** calculates:
   - Applies filter: `x > 0` (for Equation 1 ONLY)
   - Stores constraint metadata
4. **Equation 2** calculates:
   - No constraints
   - Full domain rendering
5. **Chart Block** receives:
   - **Equation 1**: `y = 2x + 0` with constraint `x > 0` → Line rendered ONLY for x > 0
   - **Equation 2**: `y = ax + b` with NO constraints → Full line rendered

## Key Components

### 1. CalculationState (`node-calculation-engine.ts`)

```typescript
const state = new CalculationState()

// Cache calculation result
state.set(chainId, data, dependencies)

// Invalidate cache when data changes
state.invalidate(chainId, allChains)

// Check if cache is stale
if (state.isStale(chainId)) {
  // Recalculate
}
```

### 2. Topological Sort

Ensures calculations happen in correct order (dependencies first):

```typescript
const sortedChains = topologicalSort(inputChains, allChains)
// Returns: ['variable-chain', 'equation-chain', 'constraint-chain', 'chart-chain']
```

### 3. Per-Equation Constraints

Each equation maintains its own constraints independently:

```typescript
// In grid-canvas.tsx
const equationConstraintMap: Record<string, string[]> = {}
// { "eq-1-id": ["constraint-1-id"], "eq-2-id": [] }

// In chart-block.tsx
const plotConstraints = plot.constraints || []
// Each plot only applies its own constraints
```

### 4. Output Node Calculation

Main entry point for calculating data for an output block:

```typescript
const calculatedData = calculateOutputNode(
  chartChainId,
  allChains,
  allBlocks,
  state
)
// Returns: { 
//   equation: 'y = 2x', 
//   variables: [...],
//   constraints: [constraint1],
//   timestamp: ... 
// }
```

## Performance Optimizations

### 1. Dirty Tracking

Only recalculates affected branches:

```
Variable (m changed) ──→ Equation ──→ Chart
                              ╰──→ Table (also recalculated)
```

### 2. Memoization

Caches results with version tracking:

```typescript
interface CalculationCache {
  data: NodeData
  version: number
  dependsOnVersions: Map<string, number>
}
```

### 3. Signature-Based Change Detection

Prevents infinite loops by tracking block changes:

```typescript
const blocksSignature = blocks.map(b => `${b.id}-${b.updatedAt}`).join(',')
if (blocksSignature === prevSignature) return // Skip recalculation
```

## When Calculations Happen

| Trigger | Calculation Scope | Latency |
|---------|------------------|---------|
| Variable slider move | Downstream nodes only | < 1ms |
| Equation edit | Downstream nodes only | < 5ms |
| Constraint change | Downstream output nodes | < 2ms |
| Block add/remove | All chains (cache clear) | < 10ms |

## Per-Equation Constraint System

### Old System (Global Constraints)
```typescript
// ALL equations affected by ALL constraints
const constraintDomain = { xMin: 0 } // x > 0
// Both Equation 1 AND Equation 2 cut off at x=0 ❌
```

### New System (Per-Equation Constraints)
```typescript
// Each equation has its own constraints
const equationConstraintMap = {
  "equation-1-id": ["constraint-x-gt-0"],
  "equation-2-id": [] // No constraints
}
// Only Equation 1 cut off at x=0 ✅
```

## Adding New Block Types

### 1. Add to NodeData interface

```typescript
export interface NodeData {
  // Existing fields...
  myNewData?: MyNewDataType
}
```

### 2. Add calculation function

```typescript
function calculateMyBlockNode(
  block: MyBlockType,
  prevData: NodeData | null,
  allBlocks: Map<string, Block>,
  timestamp: number
): NodeData {
  return {
    ...prevData,
    myNewData: /* calculate */,
    timestamp,
  }
}
```

### 3. Add to calculateNode switch

```typescript
switch (block.type) {
  case 'my-block': return calculateMyBlockNode(...)
}
```

## Debugging

### Check Calculation Cache

```typescript
// In browser console
const state = calculationStateRef.current
console.log(state.caches) // View all cached calculations
```

### View Chain Traversal

```typescript
const { chainIds, blocks } = traverseChain(
  outputChainId,
  allChains,
  allBlocks
)
console.log('Calculation order:', chainIds)
```

### Detect Cycles

```typescript
if (hasCycle(chainId, allChains)) {
  console.error('Cycle detected!')
}
```

## Related Files

- `apps/web/lib/block-system/node-calculation-engine.ts` - Core calculation engine
- `apps/web/lib/block-system/types.ts` - NodeChain interface with calculatedData
- `apps/web/components/blocks/block-components.tsx` - Chart block with per-equation constraints
- `apps/web/components/blocks/grid-canvas.tsx` - Calculation effect integration
