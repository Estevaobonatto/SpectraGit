import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckCircle2, Copy, Ban, Archive, AlertTriangle } from 'lucide-react';

type CloseReason = 'FIXED' | 'DUPLICATE' | 'NOT_REPRODUCIBLE' | 'NOT_PLANNED' | 'OBSOLETE';

const reasons: { value: CloseReason; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { value: 'FIXED', label: 'Fixed', description: 'This issue has been resolved', icon: CheckCircle2, color: '#28A745' },
  { value: 'DUPLICATE', label: 'Duplicate', description: 'This issue already exists', icon: Copy, color: '#6F42C1' },
  { value: 'NOT_REPRODUCIBLE', label: 'Not Reproducible', description: 'Cannot reproduce the issue', icon: AlertTriangle, color: '#F9A825' },
  { value: 'NOT_PLANNED', label: 'Not Planned', description: 'Will not be addressed', icon: Ban, color: '#6B7280' },
  { value: 'OBSOLETE', label: 'Obsolete', description: 'No longer relevant', icon: Archive, color: '#8B5CF6' },
];

interface CloseIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: (data: { status: string; closeReason: string; closeReasonNote?: string }) => void;
  isPending: boolean;
}

export function CloseIssueDialog({ open, onOpenChange, onClose, isPending }: CloseIssueDialogProps) {
  const [reason, setReason] = useState<CloseReason | null>(null);
  const [note, setNote] = useState('');

  const handleClose = () => {
    if (!reason) return;
    onClose({
      status: 'CLOSED',
      closeReason: reason,
      closeReasonNote: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Close Issue</DialogTitle>
          <DialogDescription>Select a reason for closing this issue.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {reasons.map((r) => {
            const Icon = r.icon;
            const isSelected = reason === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-all cursor-pointer',
                  isSelected
                    ? 'border-primary-300 bg-primary-50/60 ring-1 ring-primary-200'
                    : 'border-border bg-surface hover:bg-surface-hover',
                )}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: r.color + '18', color: r.color }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-text-tertiary">{r.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {reason && (
          <div className="space-y-1.5">
            <Label htmlFor="close-note" className="text-sm">Note (optional)</Label>
            <Textarea
              id="close-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional context..."
              rows={2}
              className="resize-y"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleClose}
            disabled={!reason || isPending}
          >
            {isPending ? 'Closing...' : 'Close issue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
