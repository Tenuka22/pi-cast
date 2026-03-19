/**
 * Variable Slider Component
 * 
 * Interactive slider for adjusting equation variables with infinite range support.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@workspace/ui/lib/utils';

interface VariableSliderProps {
  name: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (name: string, value: number) => void;
  showInput?: boolean;
  showSlider?: boolean;
  className?: string;
}

const INFINITY_SYMBOL = '∞';
const DEFAULT_MIN = -1000;
const DEFAULT_MAX = 1000;
const DEFAULT_STEP = 0.5;

export function VariableSlider({
  name,
  value,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
  step = DEFAULT_STEP,
  onChange,
  showInput = true,
  showSlider = true,
  className,
}: VariableSliderProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange?.(name, newValue);
    }
  }, [name, onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange?.(name, clamped);
      setInputValue(clamped.toString());
    } else {
      setInputValue(value.toString());
    }
  }, [inputValue, min, max, name, onChange, value]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  }, [handleInputBlur]);

  const formatValue = (v: number): string => {
    if (v <= DEFAULT_MIN) return `-∞`;
    if (v >= DEFAULT_MAX) return `+∞`;
    return Number.isInteger(v) ? v.toString() : v.toFixed(2);
  };

  const sliderPercentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('flex flex-col gap-2 p-2', className)}>
      <div className="flex items-center justify-between gap-4">
        <label className="font-mono text-sm font-medium text-muted-foreground">
          {name}
        </label>
        {showInput && (
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            step={step}
            className="h-7 w-24 rounded-md border border-input bg-background px-2 text-right text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        )}
      </div>

      {showSlider && (
        <div className="relative">
          <input
            type="range"
            value={value}
            onChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary hover:accent-primary/80"
            style={{
              background: `linear-gradient(to right, oklch(0.518 0.253 323.949) 0%, oklch(0.518 0.253 323.949) ${sliderPercentage}%, oklch(0.542 0.034 322.5) ${sliderPercentage}%, oklch(0.542 0.034 322.5) 100%)`,
            }}
          />
        </div>
      )}

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatValue(min)}</span>
        <span className="font-mono text-primary">{formatValue(value)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}

export default VariableSlider;
