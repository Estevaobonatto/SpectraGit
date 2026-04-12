import { useState, useRef } from 'react';
import { Eye, Bold, Italic, Code, Link2, List, ListOrdered, Quote, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  id?: string;
  className?: string;
  disabled?: boolean;
}

type ToolbarAction = {
  icon: React.ElementType;
  label: string;
  prefix: string;
  suffix?: string;
  block?: boolean;
};

const TOOLBAR: ToolbarAction[] = [
  { icon: Bold, label: 'Bold', prefix: '**', suffix: '**' },
  { icon: Italic, label: 'Italic', prefix: '_', suffix: '_' },
  { icon: Code, label: 'Inline code', prefix: '`', suffix: '`' },
  { icon: Link2, label: 'Link', prefix: '[', suffix: '](url)' },
  { icon: List, label: 'Bullet list', prefix: '- ', block: true },
  { icon: ListOrdered, label: 'Numbered list', prefix: '1. ', block: true },
  { icon: Quote, label: 'Blockquote', prefix: '> ', block: true },
  { icon: Minus, label: 'Horizontal rule', prefix: '\n---\n', block: true },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write with Markdown support…',
  rows = 6,
  id,
  className,
  disabled,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyAction = (action: ToolbarAction) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);

    let newText: string;
    let cursorOffset: number;

    if (action.block) {
      // Insert at start of line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const prefix = action.prefix;
      newText = value.slice(0, lineStart) + prefix + value.slice(lineStart);
      cursorOffset = lineStart + prefix.length + (start - lineStart);
    } else {
      const suffix = action.suffix ?? action.prefix;
      const replacement = `${action.prefix}${selected || 'text'}${suffix}`;
      newText = value.slice(0, start) + replacement + value.slice(end);
      cursorOffset = start + action.prefix.length + (selected.length || 4);
    }

    onChange(newText);
    // Restore focus + cursor after React re-renders
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursorOffset, cursorOffset);
    });
  };

  return (
    <div className={cn('rounded-[var(--radius-md)] border border-border bg-background overflow-hidden', className)}>
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface-hover/30 px-2 py-1">
        <div className="flex">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-[var(--radius-sm)] transition-colors',
              tab === 'write'
                ? 'bg-background text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary',
            )}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-[var(--radius-sm)] transition-colors',
              tab === 'preview'
                ? 'bg-background text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary',
            )}
          >
            <Eye className="inline h-3 w-3 mr-1 -mt-px" />
            Preview
          </button>
        </div>

        {/* Toolbar – only in write mode */}
        {tab === 'write' && (
          <TooltipProvider>
            <div className="flex items-center gap-0.5">
              {TOOLBAR.map(({ icon: Icon, label, ...rest }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-text-tertiary hover:text-text-primary"
                      disabled={disabled}
                      onClick={() => applyAction({ icon: Icon, label, ...rest })}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        )}
      </div>

      {/* Write panel */}
      {tab === 'write' && (
        <Textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none bg-background font-mono text-sm"
        />
      )}

      {/* Preview panel */}
      {tab === 'preview' && (
        <div
          className="px-3 py-2.5 min-h-[100px]"
          style={{ minHeight: `${rows * 1.5}rem` }}
        >
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-xs text-text-tertiary italic">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
