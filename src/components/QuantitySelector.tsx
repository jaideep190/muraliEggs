'use client';

import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    onChange(Math.max(min, value - step));
  };

  const handleIncrement = () => {
    onChange(Math.min(max, value + step));
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="secondary"
        size="icon"
        className="h-14 w-14 rounded-full"
        onClick={handleDecrement}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-6 w-6" />
      </Button>
      <span
        className="text-5xl font-bold font-headline w-24 text-center"
        aria-live="polite"
      >
        {value}
      </span>
      <Button
        variant="secondary"
        size="icon"
        className="h-14 w-14 rounded-full"
        onClick={handleIncrement}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
