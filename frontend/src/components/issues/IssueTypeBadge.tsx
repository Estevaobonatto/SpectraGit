import { Bug, Lightbulb, HelpCircle, LifeBuoy, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { IssueType } from '@/types';

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  BUG: { label: 'Bug', icon: Bug, color: '#D73A49' },
  FEATURE: { label: 'Feature', icon: Lightbulb, color: '#0075CA' },
  QUESTION: { label: 'Question', icon: HelpCircle, color: '#D876E3' },
  SUPPORT: { label: 'Support', icon: LifeBuoy, color: '#F9A825' },
  IMPROVEMENT: { label: 'Improvement', icon: Sparkles, color: '#28A745' },
};

export function IssueTypeBadge({ type }: { type?: IssueType | null }) {
  if (!type) return null;
  const config = typeConfig[type];
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
