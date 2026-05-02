// @ts-nocheck
import { useState } from 'react';
import { GitPullRequest, Plus, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAddDependency, useRemoveDependency } from '@/hooks/usePullRequests';
import { AnimatedList } from '@/components/animate-ui/animated-list';
import type { PullRequest } from '@/types';

interface PRDependenciesProps {
  pr: PullRequest;
  owner: string;
  repo: string;
  canEdit?: boolean;
}

export function PRDependencies({ pr, owner, repo, canEdit = false }: PRDependenciesProps) {
  const [addInput, setAddInput] = useState('');
  const addMutation = useAddDependency(owner, repo, pr.number);
  const removeMutation = useRemoveDependency(owner, repo, pr.number);

  const handleAdd = () => {
    const num = parseInt(addInput.trim(), 10);
    if (!isNaN(num) && num > 0) {
      addMutation.mutate({ dependsOnPrNumber: num }, {
        onSuccess: () => setAddInput(''),
      });
    }
  };

  const out = pr.dependenciesOut ?? [];
  const inn = pr.dependenciesIn ?? [];

  if (out.length === 0 && inn.length === 0 && !canEdit) {
    return <p className="text-xs text-text-tertiary">No dependencies.</p>;
  }

  return (
    <div className="space-y-3">
      {/* This PR depends on */}
      <div>
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
          <ArrowRight className="h-3 w-3" />
          This PR depends on
        </h4>
        {out.length === 0 ? (
          <p className="text-xs text-text-tertiary">None.</p>
        ) : (
          <AnimatedList className="flex flex-col gap-1" staggerDelay={0.05} duration={0.25}>
            {out.map(dep => (
              <div key={dep.id} className="flex items-center gap-2 group">
                <GitPullRequest className="h-3.5 w-3.5 text-text-tertiary flex-shrink-0" />
                <Badge variant="outline" className="text-[11px] font-mono">
                  #{dep.dependsOnPrId.slice(-6)}
                </Badge>
                {canEdit && (
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 ml-auto transition-opacity text-text-tertiary hover:text-error"
                    onClick={() => removeMutation.mutate(dep.id)}
                    aria-label="Remove dependency"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </AnimatedList>
        )}
      </div>

      {inn.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
              <ArrowLeft className="h-3 w-3" />
              PRs that depend on this
            </h4>
            <AnimatedList className="flex flex-col gap-1" staggerDelay={0.05} duration={0.25}>
              {inn.map(dep => (
                <div key={dep.id} className="flex items-center gap-2">
                  <GitPullRequest className="h-3.5 w-3.5 text-text-tertiary flex-shrink-0" />
                  <Badge variant="outline" className="text-[11px] font-mono">
                    #{dep.dependentPrId.slice(-6)}
                  </Badge>
                </div>
              ))}
            </AnimatedList>
          </div>
        </>
      )}

      {canEdit && (
        <>
          <Separator />
          <div className="flex gap-2">
            <Input
              value={addInput}
              onChange={e => setAddInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="PR number (e.g. 42)"
              className="h-8 text-sm"
              type="number"
              min={1}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd}
              disabled={!addInput.trim() || addMutation.isPending}
              className="h-8 px-3"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
