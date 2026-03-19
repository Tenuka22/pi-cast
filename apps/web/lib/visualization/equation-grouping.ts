/**
 * Equation Grouping System
 * 
 * Manages groups of related equations that should be visualized together.
 */

import type { EquationBlock, ChartBlock, ControlBlock } from '@/lib/block-system/types';

export interface EquationGroup {
  id: string;
  name: string;
  equationIds: string[];
  chartBlockId?: string;
  controlBlockId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface GroupedVisualization {
  group: EquationGroup;
  equations: EquationBlock[];
  chart?: ChartBlock;
  controls?: ControlBlock;
}

/**
 * Create a new equation group
 */
export function createEquationGroup(
  name: string,
  equationIds: string[],
  chartBlockId?: string,
  controlBlockId?: string
): EquationGroup {
  const now = Date.now();
  return {
    id: `group-${now}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    equationIds,
    chartBlockId,
    controlBlockId,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Add an equation to a group
 */
export function addEquationToGroup(group: EquationGroup, equationId: string): EquationGroup {
  if (group.equationIds.includes(equationId)) return group;
  
  return {
    ...group,
    equationIds: [...group.equationIds, equationId],
    updatedAt: Date.now(),
  };
}

/**
 * Remove an equation from a group
 */
export function removeEquationFromGroup(group: EquationGroup, equationId: string): EquationGroup {
  return {
    ...group,
    equationIds: group.equationIds.filter((id) => id !== equationId),
    updatedAt: Date.now(),
  };
}

/**
 * Link a chart block to a group
 */
export function linkChartToGroup(group: EquationGroup, chartBlockId: string): EquationGroup {
  return {
    ...group,
    chartBlockId,
    updatedAt: Date.now(),
  };
}

/**
 * Link a control block to a group
 */
export function linkControlsToGroup(group: EquationGroup, controlBlockId: string): EquationGroup {
  return {
    ...group,
    controlBlockId,
    updatedAt: Date.now(),
  };
}

/**
 * Find all equations that belong to a group
 */
export function getGroupEquations(group: EquationGroup, allEquations: EquationBlock[]): EquationBlock[] {
  return allEquations.filter((eq) => group.equationIds.includes(eq.id));
}

/**
 * Automatically group equations by type
 */
export function autoGroupEquations(equations: EquationBlock[]): EquationGroup[] {
  const groupsByType = new Map<string, EquationBlock[]>();
  
  equations.forEach((eq) => {
    const type = eq.equationType || 'custom';
    const existing = groupsByType.get(type) || [];
    groupsByType.set(type, [...existing, eq]);
  });
  
  return Array.from(groupsByType.entries()).map(([type, eqs]) => 
    createEquationGroup(
      `${type.charAt(0).toUpperCase() + type.slice(1)} Equations`,
      eqs.map((eq) => eq.id)
    )
  );
}

/**
 * Check if an equation is already in a group
 */
export function isEquationInGroup(equationId: string, groups: EquationGroup[]): boolean {
  return groups.some((group) => group.equationIds.includes(equationId));
}

/**
 * Get or create a group for a single equation
 */
export function getOrCreateEquationGroup(
  equation: EquationBlock,
  existingGroups: EquationGroup[]
): EquationGroup {
  const existingGroup = existingGroups.find((g) => g.equationIds.includes(equation.id));
  
  if (existingGroup) {
    return existingGroup;
  }
  
  return createEquationGroup(
    `${equation.equationType || 'Custom'} Group`,
    [equation.id]
  );
}

/**
 * Merge two groups together
 */
export function mergeGroups(group1: EquationGroup, group2: EquationGroup): EquationGroup {
  const allEquationIds = Array.from(new Set([...group1.equationIds, ...group2.equationIds]));
  
  return {
    id: `merged-${Date.now()}`,
    name: `${group1.name} + ${group2.name}`,
    equationIds: allEquationIds,
    chartBlockId: group1.chartBlockId || group2.chartBlockId,
    controlBlockId: group1.controlBlockId || group2.controlBlockId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Split a group into individual equation groups
 */
export function splitGroup(group: EquationGroup): EquationGroup[] {
  return group.equationIds.map((eqId) => 
    createEquationGroup(`Equation ${eqId}`, [eqId])
  );
}

export default {
  createEquationGroup,
  addEquationToGroup,
  removeEquationFromGroup,
  linkChartToGroup,
  linkControlsToGroup,
  getGroupEquations,
  autoGroupEquations,
  isEquationInGroup,
  getOrCreateEquationGroup,
  mergeGroups,
  splitGroup,
};
