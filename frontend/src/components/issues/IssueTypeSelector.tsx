import { Bug, Lightbulb, HelpCircle, LifeBuoy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IssueType } from '@/types';

const types: { value: IssueType; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { value: 'BUG', label: 'Bug Report', description: 'Something isn\'t working as expected', icon: Bug, color: '#D73A49' },
  { value: 'FEATURE', label: 'Feature Request', description: 'Suggest a new feature or enhancement', icon: Lightbulb, color: '#0075CA' },
  { value: 'QUESTION', label: 'Question', description: 'Ask a question about the project', icon: HelpCircle, color: '#D876E3' },
  { value: 'SUPPORT', label: 'Support', description: 'Request help with a problem', icon: LifeBuoy, color: '#F9A825' },
  { value: 'IMPROVEMENT', label: 'Improvement', description: 'Suggest an improvement to existing functionality', icon: Sparkles, color: '#28A745' },
];

interface IssueTypeSelectorProps {
  value?: IssueType;
  onChange: (type: IssueType) => void;
}

export function IssueTypeSelector({ value, onChange }: IssueTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {types.map((type) => {
        const Icon = type.icon;
        const isSelected = value === type.value;
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={cn(
              'flex items-start gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-all cursor-pointer',
              isSelected
                ? 'border-primary-300 bg-primary-50/60 ring-2 ring-primary-200 shadow-sm'
                : 'border-border bg-surface hover:bg-surface-hover hover:border-border-strong',
            )}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
              style={{ backgroundColor: type.color + '18', color: type.color }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{type.label}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{type.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
