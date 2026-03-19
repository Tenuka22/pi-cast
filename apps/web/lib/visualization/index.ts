/**
 * Visualization System
 * 
 * Interactive graph visualization for mathematical equations.
 * Includes chart rendering, variable controls, and equation grouping.
 */

// Graph rendering engine
export * from './graph-renderer';

// Equation grouping system
export * from './equation-grouping';

// Visualization context
export { VisualizationProvider, useVisualization } from './visualization-context';
