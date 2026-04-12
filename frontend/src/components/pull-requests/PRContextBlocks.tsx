import { useState } from 'react';
import { ChevronDown, ChevronRight, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateContextBlocks } from '@/hooks/usePullRequests';
import type { ContextBlocks } from '@/types';

type BlockKey = keyof ContextBlocks;

const BLOCKS: { key: BlockKey; label: string; placeholder: string }[] = [
  { key: 'problem', label: 'Problem', placeholder: 'What problem does this PR solve?' },
  { key: 'solution', label: 'Solution', placeholder: 'How does this PR solve the problem?' },
  { key: 'impact', label: 'Impact', placeholder: 'What is the expected impact of these changes?' },
  { key: 'testInstructions', label: 'Testing Instructions', placeholder: 'How to test these changes manually?' },
];

interface PRContextBlocksProps {
  prNumber: number;
  owner: string;
  repo: string;
  contextBlocks: ContextBlocks | null;
  editable?: boolean;
}

export function PRContextBlocks({ prNumber, owner, repo, contextBlocks, editable = false }: PRContextBlocksProps) {
  const [expanded, setExpanded] = useState<Set<BlockKey>>(new Set(['problem']));
  const [draft, setDraft] = useState<ContextBlocks>(contextBlocks ?? {});
  const [editing, setEditing] = useState<Set<BlockKey>>(new Set());
  const mutation = useUpdateContextBlocks(owner, repo, prNumber);

  const toggle = (key: BlockKey) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const startEdit = (key: BlockKey) => {
    setEditing(prev => new Set(prev).add(key));
    setExpanded(prev => new Set(prev).add(key));
  };

  const save = (key: BlockKey) => {
    const next = { ...draft };
    mutation.mutate(next, {
      onSuccess: () => {
        setEditing(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      },
    });
  };

  return (
    <div className="space-y-1 rounded-[var(--radius-md)] border border-border overflow-hidden">
      {BLOCKS.map(({ key, label, placeholder }) => {
        const isOpen = expanded.has(key);
        const isEditing = editing.has(key);
        const value = draft[key] ?? '';
        const hasContent = !!value.trim();

        return (
          <div key={key} className="border-b border-border last:border-b-0">
            <button
              type="button"
              onClick={() => toggle(key)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-text-primary bg-surface-hover hover:bg-surface-active transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                {label}
              </span>
              {!hasContent && (
                <span className="text-xs text-text-tertiary font-normal">Empty</span>
              )}
            </button>

            {isOpen && (
              <div className="px-3 pb-3 pt-2 space-y-2 bg-surface">
                {isEditing ? (
                  <>
                    <Textarea
                      value={value}
                      onChange={e => setDraft(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      rows={4}
                      className="resize-y text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setDraft(contextBlocks ?? {});
                          setEditing(prev => { const next = new Set(prev); next.delete(key); return next; });
                        }}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => save(key)}
                        disabled={mutation.isPending}
                        className="h-7 text-xs gap-1"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </Button>
                    </div>
                  </>
                ) : (
                  <div
                    className={cn(
                      'text-sm leading-relaxed',
                      hasContent ? 'text-text-primary whitespace-pre-wrap' : 'text-text-tertiary italic',
                    )}
                    onClick={() => editable && startEdit(key)}
                    role={editable ? 'button' : undefined}
                    tabIndex={editable ? 0 : undefined}
                    onKeyDown={e => e.key === 'Enter' && editable && startEdit(key)}
                  >
                    {hasContent ? value : editable ? `Click to add ${label.toLowerCase()}…` : 'Not provided.'}
                  </div>
                )}
                {editable && !isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs text-text-tertiary hover:text-text-primary"
                    onClick={() => startEdit(key)}
                  >
                    {hasContent ? 'Edit' : 'Add'}
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
