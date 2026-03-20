/**
 * Components Index
 *
 * Main export file for all components.
 */

// Shared components
export * from './shared';

// Block system components
export * from './block-system';

// Canvas node components (excluding conflicting types)
export { CanvasNode } from './canvas-node/canvas-node';
export { CanvasNodeContent } from './canvas-node/canvas-node-content';
export { CanvasNodeOutline } from './canvas-node/canvas-node-outline';
export { useCanvasNodeDrag } from './canvas-node/use-canvas-node-drag';
export { useCanvasNodeConnections } from './canvas-node/use-canvas-node-connections';

// Lesson components
export * from './lesson';

// Recording components
export * from './recording';

// Playback components
export * from './playback';

// Visualization components
export * from './visualization';

// Admin components
export * from './admin';

// Auth components
export { AuthGuard } from './auth/auth-guard';
export { UserNav } from './auth/user-nav';
