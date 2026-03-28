# Piecewise Function System - Extensions & Improvements

## Current Limitations Analysis

### 1. **Single Variable Only**
- Currently only supports `x` as the independent variable
- Cannot create piecewise functions like `f(x,y)` for 3D surfaces
- Limited to 2D graphing

### 2. **Basic Constraint Types**
- Only supports: lt, lte, gt, gte, range
- No support for compound conditions (AND, OR, NOT)
- Cannot express conditions like: `x < 0 AND y > 0` or `x² + y² < 1`

### 3. **No Discontinuity Visualization**
- Open/closed circles at boundaries not shown
- Jump discontinuities not marked
- Asymptotic behavior not highlighted

### 4. **Manual Setup Required**
- Users must manually create each limiter
- No quick templates for common piecewise functions
- Time-consuming to set up complex functions

### 5. **Limited Domain Detection**
- No automatic gap detection
- No overlap warnings
- Users might create invalid functions unknowingly

### 6. **No Nested Piecewise**
- Cannot have piecewise inside piecewise
- Limits composability

### 7. **Basic Table Output**
- Fixed x-value generation
- No custom range selection
- No export functionality

---

## Proposed Extensions

### Extension 1: **Compound Constraints** ✅ Priority: HIGH

Add support for logical combinations of constraints.

**New Constraint Types:**
```typescript
type CompoundConstraint = {
  type: 'and' | 'or' | 'not'
  constraints: VariableConstraint[]
}

// Example: 0 < x < 10 AND y > 0
{
  type: 'and',
  constraints: [
    { type: 'range', min: 0, max: 10, variableName: 'x' },
    { type: 'gt', min: 0, variableName: 'y' }
  ]
}
```

**Use Cases:**
- Absolute value: `|x| = x if x ≥ 0, -x if x < 0`
- Sign function: `sgn(x) = 1 if x > 0, 0 if x = 0, -1 if x < 0`
- Regional definitions: `f(x,y) = x+y if x>0 AND y>0`

---

### Extension 2: **Multivariable Piecewise** ✅ Priority: HIGH

Support piecewise functions with multiple independent variables.

**New Block Type: Piecewise Surface**
```typescript
interface PiecewiseSurfaceBlock {
  type: 'piecewise-surface'
  connectedLimiterIds: string[]
  fallbackEquation?: string
  variables: string[] // ['x', 'y']
}
```

**3D Chart Support:**
- Surface plots for each piece
- Different colors per piece
- Domain boundaries highlighted

---

### Extension 3: **Discontinuity Markers** ✅ Priority: MEDIUM

Visual indicators for discontinuities and boundaries.

**New Features:**
- Open circles (○) for excluded points
- Filled circles (●) for included points
- Vertical dashed lines at jumps
- Asymptote indicators

**Implementation:**
```typescript
interface DiscontinuityPoint {
  x: number
  y: number
  type: 'open' | 'closed' | 'asymptote'
  pieceId: string
}
```

---

### Extension 4: **Piecewise Templates** ✅ Priority: HIGH

Pre-built templates for common piecewise functions.

**Template Library:**
```typescript
interface PiecewiseTemplate {
  id: string
  name: string
  category: 'basic' | 'advanced' | 'calculus' | 'physics'
  pieces: Array<{
    equation: string
    constraint: VariableConstraint
    displayLabel: string
  }>
  fallback?: string
}

// Examples:
- Absolute Value
- Sign Function
- Heaviside Step
- Ramp Function
- Tax Brackets
- Physics: Velocity with Terminal
- Floor/Ceiling Approximation
```

---

### Extension 5: **Domain Analysis** ✅ Priority: MEDIUM

Automatic analysis of piecewise function domains.

**Features:**
- Gap detection (x values with no piece)
- Overlap detection (x values with multiple pieces)
- Boundary point analysis
- Continuity checking
- Domain visualization

**Output:**
```
Domain Analysis for f(x):
✓ Continuous on: (-∞, 0) ∪ (0, ∞)
⚠ Jump discontinuity at: x = 0
✓ Domain: All real numbers
✓ Range: [0, ∞)
```

---

### Extension 6: **Nested Piecewise** ✅ Priority: LOW

Allow piecewise functions as pieces of other piecewise functions.

**Example:**
```
f(x) = { g(x) if x < 0
       { h(x) if x ≥ 0

where g(x) = { x+1 if x < -1
             { x²   if x ≥ -1
```

---

### Extension 7: **Advanced Table Features** ✅ Priority: MEDIUM

Enhanced table block for piecewise functions.

**New Features:**
- Custom x-range selection
- Export to CSV/Excel
- Copy to clipboard
- Custom column selection
- Sort by x or y
- Filter by piece
- Statistics (min, max, average per piece)

---

### Extension 8: **Piecewise Function Editor** ✅ Priority: HIGH

Visual editor for creating piecewise functions quickly.

**UI Components:**
- Drag-and-drop piece ordering
- Inline constraint editing
- Real-time preview
- Template browser
- Import/export piecewise definitions

---

### Extension 9: **LaTeX Export** ✅ Priority: LOW

Export piecewise functions to LaTeX format.

**Output:**
```latex
f(x) = \begin{cases}
  x + 1 & \text{if } x < 0 \\
  x^2 & \text{if } x \geq 0 \\
  0 & \text{otherwise}
\end{cases}
```

---

### Extension 10: **Interactive Boundary Exploration** ✅ Priority: MEDIUM

Explore behavior near boundaries interactively.

**Features:**
- Slider to approach boundary from left/right
- Limit value display
- Left/right limit comparison
- Continuity indicator

---

## Implementation Priority

### Phase 1 (Immediate Value)
1. ✅ **Piecewise Templates** - Quick setup for common functions
2. ✅ **Compound Constraints** - More expressive domain definitions
3. ✅ **Piecewise Editor UI** - Better UX

### Phase 2 (Enhanced Visualization)
4. ✅ **Discontinuity Markers** - Better mathematical accuracy
5. ✅ **Domain Analysis** - Prevent errors
6. ✅ **Advanced Table Features** - More useful outputs

### Phase 3 (Advanced Features)
7. ✅ **Multivariable Piecewise** - 3D surface support
8. ✅ **LaTeX Export** - Academic use
9. ✅ **Nested Piecewise** - Advanced compositions

---

## Quick Wins (Can be implemented in < 1 day each)

1. **Template Library** - Add 10 common piecewise templates
2. **Table Export** - CSV export button
3. **Domain Warnings** - Show overlap/gap warnings
4. **Custom X-Range** - Let users set table x-min/x-max
5. **Piece Colors** - Consistent colors across chart/table

---

## Example Use Cases for Extensions

### 1. Physics: Projectile Motion with Air Resistance
```
         ⎧ gt - 0.5kt²    if t < t_terminal
v(t) = ⎨
         ⎩ v_terminal     if t ≥ t_terminal
```
**Extensions Used:** Templates, Domain Analysis

### 2. Economics: Progressive Tax
```
         ⎧ 0.10x                    if x ≤ 10000
Tax(x) = ⎨ 1000 + 0.20(x-10000)     if 10000 < x ≤ 50000
         ⎩ 9000 + 0.30(x-50000)     if x > 50000
```
**Extensions Used:** Templates, Table Export

### 3. Engineering: Stress-Strain Curve
```
         ⎧ E·ε              if ε < ε_yield
σ(ε) = ⎨ σ_yield + K·εⁿ    if ε_yield ≤ ε < ε_ultimate
         ⎩ 0                if ε ≥ ε_ultimate
```
**Extensions Used:** Multivariable, Discontinuity Markers

### 4. Computer Graphics: Smoothstep Function
```
         ⎧ 0                    if x ≤ 0
S(x) = ⎨ 3x² - 2x³            if 0 < x < 1
         ⎩ 1                    if x ≥ 1
```
**Extensions Used:** Templates, Continuity Check

---

## Files to Create/Modify

### New Files
- `apps/web/lib/piecewise-templates.ts` - Template library
- `apps/web/components/piecewise/template-browser.tsx` - Template UI
- `apps/web/components/piecewise/piecewise-editor.tsx` - Visual editor
- `apps/web/lib/piecewise-domain-analyzer.ts` - Domain analysis
- `apps/web/components/piecewise/discontinuity-markers.tsx` - Visual markers

### Modified Files
- `types.ts` - Add compound constraint types
- `block-components.tsx` - Enhanced table, discontinuity rendering
- `graph-renderer.ts` - 3D surface support
- `block-library.tsx` - Add template category

---

**Next Steps:**
1. Review and prioritize extensions
2. Implement Phase 1 features
3. Gather user feedback
4. Iterate on Phase 2 & 3

---

**Last Updated:** March 28, 2026
**Status:** Planning Complete - Ready for Implementation
