import { AlertTriangle, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { IssuePriority } from '@/types';

const priorityConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  CRITICAL: { label: 'Critical', icon: AlertTriangle, color: '#DC2626' },
  HIGH: { label: 'High', icon: ArrowUp, color: '#EA580C' },
  MEDIUM: { label: 'Medium', icon: ArrowRight, color: '#CA8A04' },
  LOW: { label: 'Low', icon: ArrowDown, color: '#6B7280' },
};

export function IssuePriorityBadge({ priority }: { priority?: IssuePriority | null }) {
  if (!priority) return null;
  const config = priorityConfig[priority];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <Badge
      className="gap-1 text-[10px] px-1.5"
      style={{
        backgroundColor: config.color + '18',
        color: config.color,
        borderColor: config.color + '30',
        border: '1px solid',
      }}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
