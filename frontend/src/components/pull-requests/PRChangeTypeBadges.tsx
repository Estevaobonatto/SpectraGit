import type { PRDiffStats } from '@/types';
import { Badge } from '@/components/ui/badge';
import { AnimatedGroup } from '@/components/animate-ui/animated-list';

interface PRChangeTypeBadgesProps {
  categories: PRDiffStats['categories'];
}

const categoryConfig: Record<keyof PRDiffStats['categories'], { label: string; classes: string }> = {
  backend: { label: 'Backend', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
  frontend: { label: 'Frontend', classes: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  database: { label: 'Database', classes: 'bg-orange-100 text-orange-800 border-orange-200' },
  docs: { label: 'Docs', classes: 'bg-amber-100 text-amber-800 border-amber-200' },
  infra: { label: 'Infra', classes: 'bg-purple-100 text-purple-800 border-purple-200' },
};

export function PRChangeTypeBadges({ categories }: PRChangeTypeBadgesProps) {
  const active = (Object.keys(categories) as (keyof typeof categories)[]).filter(k => categories[k] > 0);
  if (!active.length) return null;
  return (
    <AnimatedGroup preset="blur-slide" className="flex flex-wrap gap-1">
      {active.map(key => {
        const { label, classes } = categoryConfig[key];
        return (
          <span key={key} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${classes}`}>
            {label}
            <span className="ml-1 opacity-70">({categories[key]})</span>
          </span>
        );
      })}
    </AnimatedGroup>
  );
}
