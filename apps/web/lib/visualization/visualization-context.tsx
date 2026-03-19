/**
 * Visualization Context
 * 
 * React context for managing visualization state across components.
 * Handles equation-chart-control linking and real-time updates.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { EquationBlock, ChartBlock, ControlBlock } from '@/lib/block-system/types';
import type { EquationGroup } from '@/lib/visualization/equation-grouping';

interface VisualizationState {
  equations: EquationBlock[];
  charts: ChartBlock[];
  controls: ControlBlock[];
  groups: EquationGroup[];
  variables: Record<string, number>;
}

interface VisualizationContextValue extends VisualizationState {
  addEquation: (equation: EquationBlock) => void;
  removeEquation: (id: string) => void;
  updateEquation: (id: string, updates: Partial<EquationBlock>) => void;
  
  addChart: (chart: ChartBlock) => void;
  removeChart: (id: string) => void;
  linkChartToEquations: (chartId: string, equationIds: string[]) => void;
  
  addControls: (controls: ControlBlock) => void;
  removeControls: (id: string) => void;
  linkControlsToEquations: (controlsId: string, equationIds: string[]) => void;
  
  setVariable: (name: string, value: number) => void;
  setVariables: (variables: Record<string, number>) => void;
  
  createGroup: (name: string, equationIds: string[]) => EquationGroup;
  deleteGroup: (groupId: string) => void;
  
  getEquationsForChart: (chartId: string) => EquationBlock[];
  getChartForEquations: (equationIds: string[]) => ChartBlock | undefined;
  getControlsForEquations: (equationIds: string[]) => ControlBlock | undefined;
}

const VisualizationContext = createContext<VisualizationContextValue | undefined>(undefined);

interface VisualizationProviderProps {
  children: React.ReactNode;
  initialState?: Partial<VisualizationState>;
}

export function VisualizationProvider({ children, initialState }: VisualizationProviderProps) {
  const [state, setState] = useState<VisualizationState>({
    equations: [],
    charts: [],
    controls: [],
    groups: [],
    variables: {},
    ...initialState,
  });

  // Add equation
  const addEquation = useCallback((equation: EquationBlock) => {
    setState((prev) => ({
      ...prev,
      equations: [...prev.equations, equation],
    }));

    // Initialize variables with default values
    if (equation.variables) {
      setState((prev) => {
        const newVariables = { ...prev.variables };
        equation.variables?.forEach((v) => {
          if (!(v.name in newVariables)) {
            newVariables[v.name] = v.defaultValue;
          }
        });
        return { ...prev, variables: newVariables };
      });
    }
  }, []);

  // Remove equation
  const removeEquation = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      equations: prev.equations.filter((eq) => eq.id !== id),
    }));
  }, []);

  // Update equation
  const updateEquation = useCallback((id: string, updates: Partial<EquationBlock>) => {
    setState((prev) => ({
      ...prev,
      equations: prev.equations.map((eq) =>
        eq.id === id ? { ...eq, ...updates, updatedAt: Date.now() } : eq
      ),
    }));
  }, []);

  // Add chart
  const addChart = useCallback((chart: ChartBlock) => {
    setState((prev) => ({
      ...prev,
      charts: [...prev.charts, chart],
    }));
  }, []);

  // Remove chart
  const removeChart = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      charts: prev.charts.filter((chart) => chart.id !== id),
    }));
  }, []);

  // Link chart to equations
  const linkChartToEquations = useCallback((chartId: string, equationIds: string[]) => {
    setState((prev) => ({
      ...prev,
      charts: prev.charts.map((chart) =>
        chart.id === chartId
          ? { ...chart, equations: equationIds, updatedAt: Date.now() }
          : chart
      ),
    }));
  }, []);

  // Add controls
  const addControls = useCallback((controls: ControlBlock) => {
    setState((prev) => ({
      ...prev,
      controls: [...prev.controls, controls],
    }));
  }, []);

  // Remove controls
  const removeControls = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      controls: prev.controls.filter((c) => c.id !== id),
    }));
  }, []);

  // Link controls to equations
  const linkControlsToEquations = useCallback((controlsId: string, equationIds: string[]) => {
    setState((prev) => ({
      ...prev,
      controls: prev.controls.map((c) =>
        c.id === controlsId
          ? { ...c, sourceEquationId: equationIds[0], updatedAt: Date.now() }
          : c
      ),
    }));
  }, []);

  // Set variable value
  const setVariable = useCallback((name: string, value: number) => {
    setState((prev) => ({
      ...prev,
      variables: { ...prev.variables, [name]: value },
    }));
  }, []);

  // Set multiple variables
  const setVariables = useCallback((variables: Record<string, number>) => {
    setState((prev) => ({
      ...prev,
      variables: { ...prev.variables, ...variables },
    }));
  }, []);

  // Create group
  const createGroup = useCallback((name: string, equationIds: string[]) => {
    const group: EquationGroup = {
      id: `group-${Date.now()}`,
      name,
      equationIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      groups: [...prev.groups, group],
    }));

    return group;
  }, []);

  // Delete group
  const deleteGroup = useCallback((groupId: string) => {
    setState((prev) => ({
      ...prev,
      groups: prev.groups.filter((g) => g.id !== groupId),
    }));
  }, []);

  // Get equations for a chart
  const getEquationsForChart = useCallback(
    (chartId: string) => {
      const chart = state.charts.find((c) => c.id === chartId);
      if (!chart) return [];
      
      // If chart has equation IDs, return those equations
      if (chart.equations && chart.equations.length > 0) {
        return state.equations.filter((eq) =>
          typeof chart.equations[0] === 'string'
            ? chart.equations.includes(eq.id)
            : true
        );
      }
      
      return [];
    },
    [state.charts, state.equations]
  );

  // Get chart for equations
  const getChartForEquations = useCallback(
    (equationIds: string[]) => {
      return state.charts.find((chart) => {
        if (typeof chart.equations[0] === 'string') {
          return chart.equations.some((eqId: string) => equationIds.includes(eqId));
        }
        return false;
      });
    },
    [state.charts]
  );

  // Get controls for equations
  const getControlsForEquations = useCallback(
    (equationIds: string[]) => {
      return state.controls.find((controls) =>
        equationIds.includes(controls.sourceEquationId || '')
      );
    },
    [state.controls]
  );

  const value = useMemo<VisualizationContextValue>(
    () => ({
      ...state,
      addEquation,
      removeEquation,
      updateEquation,
      addChart,
      removeChart,
      linkChartToEquations,
      addControls,
      removeControls,
      linkControlsToEquations,
      setVariable,
      setVariables,
      createGroup,
      deleteGroup,
      getEquationsForChart,
      getChartForEquations,
      getControlsForEquations,
    }),
    [
      state,
      addEquation,
      removeEquation,
      updateEquation,
      addChart,
      removeChart,
      linkChartToEquations,
      addControls,
      removeControls,
      linkControlsToEquations,
      setVariable,
      setVariables,
      createGroup,
      deleteGroup,
      getEquationsForChart,
      getChartForEquations,
      getControlsForEquations,
    ]
  );

  return (
    <VisualizationContext.Provider value={value}>
      {children}
    </VisualizationContext.Provider>
  );
}

export function useVisualization() {
  const context = useContext(VisualizationContext);
  if (context === undefined) {
    throw new Error('useVisualization must be used within a VisualizationProvider');
  }
  return context;
}

export default VisualizationContext;
