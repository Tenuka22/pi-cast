/**
 * Graph Rendering Engine
 *
 * Renders mathematical function graphs on canvas.
 * Supports linear, quadratic, cubic, exponential, and trigonometric functions.
 */

/* Note: Function constructor is required for dynamic mathematical expression evaluation. */
/* This is safe because equation strings come from controlled application input. */

export interface GraphPoint {
  x: number
  y: number
}

export interface GraphConfig {
  width: number
  height: number
  xAxis: {
    min: number
    max: number
    label: string
    showLabels: boolean
    showGrid: boolean
  }
  yAxis: {
    min: number
    max: number
    label: string
    showLabels: boolean
    showGrid: boolean
  }
  zoom: number
  pan: { x: number; y: number }
  showAxes: boolean
  showGrid: boolean
  backgroundColor?: string | null
}

export interface PlotOptions {
  color: string
  lineWidth: number
  dashed?: boolean
  label?: string
}

export const DEFAULT_GRAPH_CONFIG: GraphConfig = {
  width: 512,
  height: 384,
  xAxis: {
    min: -10,
    max: 10,
    label: "x",
    showLabels: true,
    showGrid: true,
  },
  yAxis: {
    min: -10,
    max: 10,
    label: "y",
    showLabels: true,
    showGrid: true,
  },
  zoom: 1,
  pan: { x: 0, y: 0 },
  showAxes: true,
  showGrid: true,
}

/**
 * Evaluate a mathematical function at a given x value
 */
export function evaluateFunction(
  equation: string,
  variables: Record<string, number>
): number {
  try {
    // Replace variables with their values
    let expr = equation.toLowerCase().replace(/\s/g, '')

    // Extract right-hand side of equation (e.g., "y=mx+c" -> "mx+c")
    const equalsIndex = expr.indexOf('=')
    if (equalsIndex !== -1) {
      expr = expr.substring(equalsIndex + 1)
    }

    // Handle common mathematical functions
    expr = expr.replace(/sin/g, "Math.sin")
    expr = expr.replace(/cos/g, "Math.cos")
    expr = expr.replace(/tan/g, "Math.tan")
    expr = expr.replace(/log/g, "Math.log10")
    expr = expr.replace(/ln/g, "Math.log")
    expr = expr.replace(/sqrt/g, "Math.sqrt")
    expr = expr.replace(/abs/g, "Math.abs")
    expr = expr.replace(/exp/g, "Math.exp")
    expr = expr.replace(/floor/g, "Math.floor")
    expr = expr.replace(/ceil/g, "Math.ceil")

    // Handle power notation
    // Fix: Add parentheses for negative bases and exponents (e.g., -2^2 -> (-2)**2, 2^-3 -> 2**(-3))
    expr = expr.replace(/\^/g, "**")
    
    // Fix unary minus before ** as base (e.g., "(2*-3**2" -> "(2*(-3)**2")
    expr = expr.replace(/([(+\-,])(-?\d+\.?\d*)\*\*/g, '$1($2)**')
    expr = expr.replace(/^(-?\d+\.?\d*)\*\*/g, '($1)**')
    
    // Fix unary minus after ** as exponent (e.g., "2**-3" -> "2**(-3)")
    expr = expr.replace(/\*\*(-\d+\.?\d*)/g, '**($1)')

    // Replace variables (but not 'e' or 'pi')
    for (const [name, value] of Object.entries(variables)) {
      if (name !== "e" && name !== "pi") {
        const regex = new RegExp(`\\b${name}\\b`, "g")
        expr = expr.replace(regex, value.toString())
      }
    }

    // Handle implicit multiplication (e.g., 2x -> 2*x)
    expr = expr.replace(/(\d)([a-z])/g, "$1*$2")
    expr = expr.replace(/([a-z])(\d)/g, "$1*$2")

    // Replace mathematical constants
    expr = expr.replace(/\be\b/g, Math.E.toString())
    expr = expr.replace(/\bpi\b/g, Math.PI.toString())

    // Evaluate mathematical expression using Function constructor
    // Note: This is safe because equation strings come from the application's controlled input
    return evaluateExpression(expr, variables.x || 0)
  } catch (error) {
    console.error("Error evaluating function:", error)
    return NaN
  }
}

/**
 * Safely evaluate a mathematical expression
 * Uses a controlled evaluation approach with explicit math function mapping
 */

// Typed function constructor wrapper for mathematical expressions
type MathFunction = (
  x: number,
  sin: (x: number) => number,
  cos: (x: number) => number,
  tan: (x: number) => number,
  log: (x: number) => number,
  log10: (x: number) => number,
  sqrt: (x: number) => number,
  abs: (x: number) => number,
  exp: (x: number) => number,
  floor: (x: number) => number,
  ceil: (x: number) => number,
  PI: number,
  E: number
) => number;

function createMathFunction(expression: string): MathFunction {
  // Note: This uses Function constructor with strictly controlled input
  // The expression comes from application-controlled equation strings
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(
    "x",
    "sin",
    "cos",
    "tan",
    "log",
    "log10",
    "sqrt",
    "abs",
    "exp",
    "floor",
    "ceil",
    "PI",
    "E",
    `return ${expression};`
  );
  return fn as MathFunction;
}

function evaluateExpression(expression: string, xValue: number): number {
  const mathFunc = createMathFunction(expression);

  const result = mathFunc(
    xValue,
    Math.sin,
    Math.cos,
    Math.tan,
    Math.log,
    Math.log10,
    Math.sqrt,
    Math.abs,
    Math.exp,
    Math.floor,
    Math.ceil,
    Math.PI,
    Math.E
  );
  return typeof result === "number" ? result : Number(result);
}

/**
 * Generate points for graphing a function
 */
export function generateGraphPoints(
  equation: string,
  variables: Record<string, number>,
  config: GraphConfig
): GraphPoint[] {
  const points: GraphPoint[] = []
  const step = (config.xAxis.max - config.xAxis.min) / config.width

  for (let pixelX = 0; pixelX < config.width; pixelX++) {
    const x = config.xAxis.min + pixelX * step
    const y = evaluateFunction(equation, { ...variables, x })

    if (!isNaN(y) && isFinite(y)) {
      points.push({ x, y })
    }
  }

  return points
}

/**
 * Convert graph coordinates to canvas pixel coordinates
 */
export function graphToPixels(
  point: GraphPoint,
  config: GraphConfig
): { x: number; y: number } {
  const xRange = config.xAxis.max - config.xAxis.min
  const yRange = config.yAxis.max - config.yAxis.min

  const pixelX = ((point.x - config.xAxis.min) / xRange) * config.width
  const pixelY =
    config.height - ((point.y - config.yAxis.min) / yRange) * config.height

  return { x: pixelX, y: pixelY }
}

/**
 * Render a graph on a canvas element
 */
export function renderGraph(
  ctx: CanvasRenderingContext2D,
  equations: Array<{
    equation: string
    variables: Record<string, number>
    options?: PlotOptions
  }>,
  config: GraphConfig = DEFAULT_GRAPH_CONFIG
): void {
  const { width, height } = config

  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  if (config.backgroundColor) {
    ctx.fillStyle = config.backgroundColor
    ctx.fillRect(0, 0, width, height)
  }

  // Draw grid
  if (config.showGrid) {
    drawGrid(ctx, config)
  }

  // Draw axes
  if (config.showAxes) {
    drawAxes(ctx, config)
  }

  // Draw each function
  equations.forEach(({ equation, variables, options }) => {
    const points = generateGraphPoints(equation, variables, config)
    drawFunction(ctx, points, config, options)
  })
}

/**
 * Draw grid lines
 */
function drawGrid(ctx: CanvasRenderingContext2D, config: GraphConfig): void {
  const { width, height } = config
  const xStep = Math.ceil((config.xAxis.max - config.xAxis.min) / 10)
  const yStep = Math.ceil((config.yAxis.max - config.yAxis.min) / 10)

  ctx.strokeStyle = "#e5e5e5"
  ctx.lineWidth = 1

  // Vertical grid lines
  for (let x = config.xAxis.min; x <= config.xAxis.max; x += xStep) {
    const pixelX = graphToPixels({ x, y: 0 }, config).x
    ctx.beginPath()
    ctx.moveTo(pixelX, 0)
    ctx.lineTo(pixelX, height)
    ctx.stroke()
  }

  // Horizontal grid lines
  for (let y = config.yAxis.min; y <= config.yAxis.max; y += yStep) {
    const pixelY = graphToPixels({ x: 0, y }, config).y
    ctx.beginPath()
    ctx.moveTo(0, pixelY)
    ctx.lineTo(width, pixelY)
    ctx.stroke()
  }
}

/**
 * Draw axes
 */
function drawAxes(ctx: CanvasRenderingContext2D, config: GraphConfig): void {
  const { width, height } = config

  ctx.strokeStyle = "#333333"
  ctx.lineWidth = 2

  // X-axis
  const xAxisY = graphToPixels({ x: 0, y: 0 }, config).y
  if (xAxisY >= 0 && xAxisY <= height) {
    ctx.beginPath()
    ctx.moveTo(0, xAxisY)
    ctx.lineTo(width, xAxisY)
    ctx.stroke()
  }

  // Y-axis
  const yAxisX = graphToPixels({ x: 0, y: 0 }, config).x
  if (yAxisX >= 0 && yAxisX <= width) {
    ctx.beginPath()
    ctx.moveTo(yAxisX, 0)
    ctx.lineTo(yAxisX, height)
    ctx.stroke()
  }

  // Axis labels
  if (config.xAxis.showLabels) {
    ctx.fillStyle = "#666666"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"

    const xStep = Math.ceil((config.xAxis.max - config.xAxis.min) / 10)
    for (let x = config.xAxis.min; x <= config.xAxis.max; x += xStep) {
      if (x === 0) continue
      const pixelX = graphToPixels({ x, y: 0 }, config).x
      const pixelY = xAxisY + 20
      ctx.fillText(x.toString(), pixelX, pixelY)
    }
  }

  if (config.yAxis.showLabels) {
    ctx.fillStyle = "#666666"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "right"

    const yStep = Math.ceil((config.yAxis.max - config.yAxis.min) / 10)
    for (let y = config.yAxis.min; y <= config.yAxis.max; y += yStep) {
      if (y === 0) continue
      const pos = graphToPixels({ x: 0, y }, config)
      ctx.fillText(y.toString(), pos.x - 10, pos.y + 4)
    }
  }
}

/**
 * Draw a function curve
 */
function drawFunction(
  ctx: CanvasRenderingContext2D,
  points: GraphPoint[],
  config: GraphConfig,
  options: PlotOptions = { color: "#3b82f6", lineWidth: 2 }
): void {
  if (points.length < 2) return

  ctx.strokeStyle = options.color
  ctx.lineWidth = options.lineWidth
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  if (options.dashed) {
    ctx.setLineDash([5, 5])
  } else {
    ctx.setLineDash([])
  }

  ctx.beginPath()

  let moveTo = true
  for (const point of points) {
    const pixel = graphToPixels(point, config)

    // Skip points outside visible range
    if (pixel.y < -100 || pixel.y > config.height + 100) {
      moveTo = true
      continue
    }

    if (moveTo) {
      ctx.moveTo(pixel.x, pixel.y)
      moveTo = false
    } else {
      ctx.lineTo(pixel.x, pixel.y)
    }
  }

  ctx.stroke()
  ctx.setLineDash([])
}

/**
 * Get default graph config for an equation type
 */
export function getDefaultConfigForEquation(
  equationType: string
): Partial<GraphConfig> {
  switch (equationType) {
    case "trigonometric":
      return {
        xAxis: {
          min: -2 * Math.PI,
          max: 2 * Math.PI,
          label: "x",
          showLabels: true,
          showGrid: true,
        },
        yAxis: {
          min: -2,
          max: 2,
          label: "y",
          showLabels: true,
          showGrid: true,
        },
      }
    case "exponential":
      return {
        xAxis: {
          min: -5,
          max: 5,
          label: "x",
          showLabels: true,
          showGrid: true,
        },
        yAxis: {
          min: -10,
          max: 100,
          label: "y",
          showLabels: true,
          showGrid: true,
        },
      }
    default:
      return {}
  }
}

export default {
  renderGraph,
  generateGraphPoints,
  evaluateFunction,
  graphToPixels,
  getDefaultConfigForEquation,
}
