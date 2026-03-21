# Node Tree Architecture Implementation

## Overview

This document describes the new **node tree-based architecture** for the pi-cast block system. The new architecture replaces the free-form connection system with a more structured chain-based approach that makes data flow explicit and easier to track.

## Key Concepts

### Node Chain Structure

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Equation   │ ──→ │   Control   │ ──→ │    Chart    │
│  y = mx + c │     │  (m slider) │     │  (renders)  │
└─────────────┘     └─────────────┘     └─────────────┘
     │                    │                    │
  prev: null          prev: eq            prev: ctrl
  next: [ctrl]        next: [chart]       next: []
```

Each node has:
- **prev**: Pointer to the input node (where data comes FROM)
- **next**: Array of output nodes (where data goes TO)

### Data Flow

Data flows from **source nodes** (nodes with no `prev`) through the chain:

1. **Equation** → Provides the base equation and variables
2. **Control/Variable** → Modifies variable values
3. **Limit** → Generates approach values
4. **Logic/Comparator** → Produces boolean results
5. **Chart** → Renders the final result
6. **Shape** → Visualizes boolean results as fill

## Implementation Status

### ✅ Completed

1. **Type Definitions** (`lib/block-system/types.ts`)
   - `NodeChain` interface with prev/next pointers
   - `NodeData` interface for data flowing through chains
   - `LimitApproachValue` for limit visualization
   - Chain utility functions:
     - `createNodeChain()` - Create a new chain
     - `connectNodeChains()` - Connect two chains
     - `disconnectNodeChains()` - Disconnect chains
     - `traverseChainBackwards()` - Get all nodes from source to current
     - `traverseChainForwards()` - Get all nodes from current to ends
     - `evaluateNodeChain()` - Evaluate data flow through chain
     - `generateLimitApproachValues()` - Generate limit approach values

2. **Data Flow Evaluator** (`lib/block-system/node-chain-evaluator.ts`)
   - `evaluateChain()` - Main evaluation entry point
   - `processNode()` - Process data through individual nodes
   - `getSubstitutedEquation()` - Get equation with variables substituted
   - `prepareChartData()` - Prepare data for chart rendering
   - `validateChain()` - Check for cycles and broken links

3. **Canvas Page** (`app/canvas/page.tsx`)
   - Updated to manage both `blocks` and `nodeChains` state
   - `connectBlocks()` - Connect two blocks in a chain
   - `disconnectBlocks()` - Disconnect blocks
   - Creates node chains for new blocks automatically

4. **Chain Visualization** (`components/block-system/canvas/`)
   - `node-chain-visualization.tsx`:
     - `NodeChainIndicator` - Shows input/output handles
     - `ChainConnectionArrow` - Visual arrow between connected nodes
     - `ChainPathHighlight` - Highlights selected chain path
     - `ChainMiniMap` - Shows chain tree structure
   - `node-chain-layer.tsx` - Renders the chain layer on canvas

### 🔄 In Progress

1. **GridCanvas Integration**
   - Need to integrate `NodeChainLayer` into `GridCanvas`
   - Add chain-aware connection handling
   - Update block rendering to show chain indicators

2. **Block Components Update**
   - Chart block needs to use chain evaluation instead of direct connections
   - Shape block needs to accept input data for fill value
   - Limit block needs to display approach values

3. **Connection System**
   - Migrate from `BlockConnection` to `NodeChain` connections
   - Update connection handles to use chain-based connections

### 📋 TODO

1. **Update GridCanvas** (`components/blocks/grid-canvas.tsx`)
   ```typescript
   // Add nodeChains prop
   interface GridCanvasProps {
     blocks: Block[];
     nodeChains: Map<string, NodeChain>;
     onNodeChainsChange: (chains: Map<string, NodeChain>) => void;
     onConnectBlocks: (sourceId: string, targetId: string) => void;
     onDisconnectBlocks: (sourceId: string, targetId: string) => void;
   }
   ```

2. **Update Chart Block** to use chain evaluation:
   ```typescript
   // Instead of connectedEquations prop, use chain data
   const chainData = evaluateChain(chainId, allChains, allBlocks);
   const equation = chainData.equation;
   const variables = chainData.variables;
   ```

3. **Update Limit Block** to show approach values:
   ```typescript
   // Display limit approach values in a table
   const approachValues = generateLimitApproachValues(
     equation, variables, variableName, limitValue, approach
   );
   ```

4. **Update Shape Block** to accept input fill:
   ```typescript
   // Use chain data for fill value
   const fillValue = chainData.isFilled ? 100 : 0;
   ```

## Example Usage

### Example 1: Basic Equation → Control → Chart

```typescript
// User creates: y = mx + c → Control (m slider) → Chart

const chains = new Map();
const eqChain = createNodeChain(eqId, 'equation', pos1);
const ctrlChain = createNodeChain(ctrlId, 'control', pos2);
const chartChain = createNodeChain(chartId, 'chart', pos3);

connectNodeChains(eqChain, ctrlChain, chains); // eq → ctrl
connectNodeChains(ctrlChain, chartChain, chains); // ctrl → chart

// Evaluate chain from chart (goes back through all nodes)
const data = evaluateChain(chartChain.id, chains, blocks);
// data.equation = "y = mx + c"
// data.variables = [{name: 'm', value: 2}, {name: 'c', value: 0}]
```

### Example 2: Logic Chain → Shape Fill

```typescript
// x = 2 → y = 3 → y > x → Shape (fills if true)

const xEq = createNodeChain(xId, 'equation', pos1);
const yEq = createNodeChain(yId, 'equation', pos2);
const comp = createNodeChain(compId, 'comparator', pos3);
const shape = createNodeChain(shapeId, 'shape', pos4);

connectNodeChains(xEq, yEq, chains);
connectNodeChains(yEq, comp, chains);
connectNodeChains(comp, shape, chains);

const data = evaluateChain(shape.id, chains, blocks);
// data.booleanResult = true (3 > 2)
// data.isFilled = true
```

### Example 3: Limit Approach Visualization

```typescript
// lim(x→10) of y = x²

const eq = createNodeChain(eqId, 'equation', pos1);
const limit = createNodeChain(limitId, 'limit', pos2);
const chart = createNodeChain(chartId, 'chart', pos3);

connectNodeChains(eq, limit, chains);
connectNodeChains(limit, chart, chains);

const data = evaluateChain(chart.id, chains, blocks);
// data.limitValues = [
//   {x: 9.5, y: 90.25, label: "x → 9.50"},
//   {x: 9.6, y: 92.16, label: "x → 9.60"},
//   ...
//   {x: 9.9, y: 98.01, label: "x → 9.90"},
// ]
```

## Benefits

1. **Explicit Data Flow**: Easy to trace where data comes from and where it goes
2. **Simplified Rendering**: Chart can traverse back to get all inputs
3. **Better Validation**: Can detect cycles and broken links
4. **Easier Debugging**: Chain structure makes it clear what affects what
5. **Support for Branching**: One node can feed multiple outputs

## Migration Notes

- Old `BlockConnection` system is still supported for backward compatibility
- New blocks use `nodeChainId` to link to chain structures
- Connection handles now create chain connections instead of `BlockConnection`
- Chart blocks evaluate their chain to get equation data instead of `connectedEquations` prop

## Next Steps

1. Integrate `NodeChainLayer` into `GridCanvas`
2. Update all block components to use chain evaluation
3. Add visual indicators for chain connections
4. Implement limit approach value display
5. Test with example chains
