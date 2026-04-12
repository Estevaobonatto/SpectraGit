import { useState, useRef } from 'react';
import { Check, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpdateChecklist } from '@/hooks/usePullRequests';
import { AnimatedList } from '@/components/animate-ui/animated-list';
import type { ChecklistItem } from '@/types';

interface PRChecklistProps {
  prNumber: number;
  owner: string;
  repo: string;
  items: ChecklistItem[];
  editable?: boolean;
}

export function PRChecklist({ prNumber, owner, repo, items, editable = false }: PRChecklistProps) {
  const [localItems, setLocalItems] = useState<ChecklistItem[]>(items);
  const [newItemText, setNewItemText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useUpdateChecklist(owner, repo, prNumber);

  const save = (next: ChecklistItem[]) => {
    setLocalItems(next);
    mutation.mutate(next);
  };

  const toggle = (id: string) => {
    const next = localItems.map(it => it.id === id ? { ...it, checked: !it.checked } : it);
    save(next);
  };

  const remove = (id: string) => {
    const next = localItems.filter(it => it.id !== id);
    save(next);
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    const next: ChecklistItem = {
      id: `item-${Date.now()}`,
      text: newItemText.trim(),
      checked: false,
    };
    save([...localItems, next]);
    setNewItemText('');
    inputRef.current?.focus();
  };

  const checked = localItems.filter(it => it.checked).length;
  const total = localItems.length;
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="space-y-3">
      {total > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-text-tertiary whitespace-nowrap">
            {checked}/{total} completed
          </span>
        </div>
      )}

      <AnimatedList className="space-y-1.5" staggerDelay={0.04} duration={0.25}>
        {localItems.map(item => (
          <li key={item.id} className="flex items-center gap-2 group list-none">
            <button
              type="button"
              disabled={!editable && !item.checked}
              onClick={() => editable && toggle(item.id)}
              className={cn(
                'flex-shrink-0 h-4 w-4 rounded border transition-colors',
                item.checked
                  ? 'bg-success border-success text-white'
                  : 'border-border bg-surface-hover',
                editable && 'cursor-pointer hover:border-primary',
              )}
              aria-label={item.checked ? 'Uncheck item' : 'Check item'}
            >
              {item.checked && <Check className="h-3 w-3 mx-auto" />}
            </button>
            <span className={cn('flex-1 text-sm', item.checked && 'line-through text-text-tertiary')}>
              {item.text}
            </span>
            {editable && (
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-error"
                aria-label="Remove item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </AnimatedList>

      {editable && (
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Add checklist item…"
            className="h-8 text-sm"
          />
          <Button size="sm" variant="outline" onClick={addItem} disabled={!newItemText.trim()} className="h-8 px-3">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {total === 0 && !editable && (
        <p className="text-sm text-text-tertiary italic">No checklist items.</p>
      )}
    </div>
  );
}
