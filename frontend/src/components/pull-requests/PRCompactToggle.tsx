import { LayoutList, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ClickEffect } from '@/components/animate-ui/effects';

interface PRCompactToggleProps {
  isCompact: boolean;
  onToggle: () => void;
}

export function PRCompactToggle({ isCompact, onToggle }: PRCompactToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <ClickEffect>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggle}
              className="gap-1.5 h-8"
              aria-label={isCompact ? 'Switch to detailed view' : 'Switch to compact view'}
            >
              {isCompact ? (
                <LayoutGrid className="h-3.5 w-3.5" />
              ) : (
                <LayoutList className="h-3.5 w-3.5" />
              )}
              <span className="text-xs">{isCompact ? 'Detailed' : 'Compact'}</span>
            </Button>
          </ClickEffect>
        </TooltipTrigger>
        <TooltipContent>
          {isCompact ? 'Switch to detailed view' : 'Switch to compact view'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
