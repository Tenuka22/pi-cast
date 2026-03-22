/**
 * Variable Slider Component
 *
 * Interactive slider for adjusting equation variables with infinite range support.
 */

'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';

import { Slider } from '@workspace/ui/components/slider';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';

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
  const [inputValue, setInputValue] = React.useState(value.toString());

  React.useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleSliderChange = React.useCallback((newValue: number | readonly number[]) => {
    const newVal = Array.isArray(newValue) ? newValue[0] ?? 0 : newValue;
    if (!isNaN(newVal)) {
      onChange?.(name, newVal);
    }
  }, [name, onChange]);

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputBlur = React.useCallback(() => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange?.(name, clamped);
      setInputValue(clamped.toString());
    } else {
      setInputValue(value.toString());
    }
  }, [inputValue, min, max, name, onChange, value]);

  const handleInputKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  }, [handleInputBlur]);

  const formatValue = (v: number): string => {
    if (v <= DEFAULT_MIN) return `-∞`;
    if (v >= DEFAULT_MAX) return `+∞`;
    return Number.isInteger(v) ? v.toString() : v.toFixed(2);
  };

  return (
    <div className={cn('flex flex-col gap-2 p-2', className)}>
      <div className="flex items-center justify-between gap-4">
        <Label className="font-mono text-sm font-medium text-muted-foreground">
          {name}
        </Label>
        {showInput && (
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            step={step}
            className="h-7 w-24 text-right font-mono"
          />
        )}
      </div>

      {showSlider && (
        <div className="relative">
          <Slider
            value={[value]}
            onValueChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
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
