import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowUpCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { integrationsService } from '@/services/integrations.service';

interface MirrorableItem {
  id: string;
  title: string;
  number?: number;
  githubExternalId: string | null;
}

interface MirrorActionsProps {
  type: 'issue' | 'pull-request' | 'comment' | 'release' | 'label' | 'milestone';
  items: MirrorableItem[];
  onSuccess?: () => void;
}

const typeLabels: Record<string, string> = {
  issue: 'Issue',
  'pull-request': 'Pull Request',
  comment: 'Comment',
  release: 'Release',
  label: 'Label',
  milestone: 'Milestone',
};

const mirrorFn: Record<string, (id: string) => Promise<{ mirrored: boolean; action: string }>> = {
  issue: integrationsService.mirrorIssue,
  'pull-request': integrationsService.mirrorPR,
  comment: integrationsService.mirrorComment,
  release: integrationsService.mirrorRelease,
  label: integrationsService.mirrorLabel,
  milestone: integrationsService.mirrorMilestone,
};

export default function MirrorActions({ type, items, onSuccess }: MirrorActionsProps) {
  const [mirrorStates, setMirrorStates] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
  const [mirrorErrors, setMirrorErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async ({ itemId }: { itemId: string }) => {
      const fn = mirrorFn[type];
      if (!fn) throw new Error('Unknown mirror type');
      return fn(itemId);
    },
    onSuccess: (_data, { itemId }) => {
      setMirrorStates((s) => ({ ...s, [itemId]: 'success' }));
      setMirrorErrors((e) => { const n = { ...e }; delete n[itemId]; return n; });
      onSuccess?.();
    },
    onError: (err: unknown, { itemId }) => {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ??
        (err as { message?: string })?.message ??
        'Mirror failed';
      setMirrorStates((s) => ({ ...s, [itemId]: 'error' }));
      setMirrorErrors((e) => ({ ...e, [itemId]: message }));
    },
  });

  const handleMirror = (itemId: string) => {
    setMirrorStates((s) => ({ ...s, [itemId]: 'loading' }));
    mutation.mutate({ itemId });
  };

  if (items.length === 0) {
    return (
      <p className="text-sm text-text-tertiary">No {typeLabels[type].toLowerCase()}s found for this repository.</p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const state = mirrorStates[item.id];
        const error = mirrorErrors[item.id];
        const isLinked = !!item.githubExternalId;

        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border p-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary truncate">
                  {item.number !== undefined ? `#${item.number} ` : ''}
                  {item.title}
                </span>
                {isLinked ? (
                  <Badge variant="success" className="text-[10px] shrink-0">Synced</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] shrink-0">Local only</Badge>
                )}
              </div>
              {state === 'error' && error && (
                <p className="mt-1 text-xs text-destructive">{error}</p>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              disabled={state === 'loading'}
              onClick={() => handleMirror(item.id)}
            >
              {state === 'loading' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : state === 'success' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              ) : state === 'error' ? (
                <XCircle className="h-3.5 w-3.5 text-destructive" />
              ) : (
                <ArrowUpCircle className="h-3.5 w-3.5" />
              )}
              <span className="ml-1 text-xs">
                {state === 'success' ? 'Mirrored' : isLinked ? 'Update' : 'Push'}
              </span>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
