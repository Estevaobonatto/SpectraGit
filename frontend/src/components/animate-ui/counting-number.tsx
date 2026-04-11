import { useEffect, useState } from 'react';
import { useSpring, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';

interface CountingNumberProps {
  value: number;
  duration?: number;
  className?: string;
  format?: (value: number) => string;
}

export function CountingNumber({
  value,
  duration = 1.2,
  className,
  format = (v) => Math.round(v).toLocaleString(),
}: CountingNumberProps) {
  const spring = useSpring(0, {
    stiffness: 75,
    damping: 30,
    duration: duration * 1000,
  });
  const display = useTransform(spring, (latest) => format(latest));
  const [displayValue, setDisplayValue] = useState(format(0));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayValue(v));
    return unsubscribe;
  }, [display]);

  return <span className={cn(className)}>{displayValue}</span>;
}
