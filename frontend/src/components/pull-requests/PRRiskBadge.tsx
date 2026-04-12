import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/types';

interface PRRiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

const config: Record<RiskLevel, { label: string; classes: string }> = {
  LOW: { label: 'Low Risk', classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  MEDIUM: { label: 'Medium Risk', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  HIGH: { label: 'High Risk', classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  CRITICAL: { label: 'Critical Risk', classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export function PRRiskBadge({ level, className }: PRRiskBadgeProps) {
  const { label, classes } = config[level];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', classes, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
