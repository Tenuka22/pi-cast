/**
 * Control Variable Input Component
 *
 * Renders a slider and input for controlling a variable value.
 */

'use client';

import React, { useState } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { type ControlVariable } from '@/lib/block-system/types';

interface ControlVariableInputProps {
  variable: ControlVariable;
  onChange?: (value: number) => void;
}

export function ControlVariableInput({
  variable,
  onChange,
}: ControlVariableInputProps): React.ReactElement {
  const [value, setValue] = useState(variable.value);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = parseFloat(e.target.value);
    setValue(newValue);
    onChange?.(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = parseFloat(e.target.value);
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-mono text-sm">{variable.name}</Label>
        <Input
          type="number"
          value={value}
          onChange={handleInputChange}
          className="h-7 w-20 text-right font-mono"
          step={variable.step || 1}
        />
      </div>
      <input
        type="range"
        value={value}
        min={variable.min || -100}
        max={variable.max || 100}
        step={variable.step || 1}
        onChange={handleSliderChange}
        className="w-full"
      />
    </div>
  );
}

export default ControlVariableInput;
