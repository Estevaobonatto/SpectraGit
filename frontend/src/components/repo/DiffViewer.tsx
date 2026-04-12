import { useState, useCallback, memo, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  File,
  Minimize2,
  Maximize2,
  MessageSquare,
  Send,
  X,
  Columns2,
  AlignLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DiffFile, DiffHunk, DiffLine } from '@/types';

/** Files with more total changed lines than this are auto-collapsed on load. */
const AUTO_COLLAPSE_THRESHOLD = 150;
/** Only render this many lines per file; user can opt-in to load more. */
const LINE_RENDER_CAP = 250;

interface DiffViewerProps {
  files: DiffFile[];
  onLineComment?: (filePath: string, lineNumber: number, body: string) => void;
}

type ViewMode = 'unified' | 'split';

export function DiffViewer({ files, onLineComment }: DiffViewerProps) {
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('unified');

  const { totalAdditions, totalDeletions } = useMemo(
    () => ({
      totalAdditions: files.reduce((s, f) => s + f.additions, 0),
      totalDeletions: files.reduce((s, f) => s + f.deletions, 0),
    }),
    [files],
  );

  const bigDiff = files.length > 8 || totalAdditions + totalDeletions > 500;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        <div className="rounded-[var(--radius-md)] border border-border bg-surface-hover p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Showing <span className="font-bold">{files.length}</span>{' '}
              changed {files.length === 1 ? 'file' : 'files'} with{' '}
              <span className="text-success font-semibold">+{totalAdditions}</span> and{' '}
              <span className="text-error font-semibold">-{totalDeletions}</span>
            </p>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode((m) => (m === 'unified' ? 'split' : 'unified'))}
                    className="gap-1.5 text-xs"
                  >
                    {viewMode === 'unified' ? (
                      <><Columns2 className="h-3.5 w-3.5" />Split</>
                    ) : (
                      <><AlignLeft className="h-3.5 w-3.5" />Unified</>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {viewMode === 'unified' ? 'Switch to split view' : 'Switch to unified view'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAllCollapsed((v) => !v)}
                    className="gap-1.5 text-xs"
                  >
                    {allCollapsed ? (
                      <><Maximize2 className="h-3.5 w-3.5" />Expand all</>
                    ) : (
                      <><Minimize2 className="h-3.5 w-3.5" />Collapse all</>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {allCollapsed ? 'Expand all files' : 'Collapse all files'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            {files.map((file) => (
              <div key={file.filePath} className="flex items-center gap-2 text-xs">
                <StatusBadge status={file.status} />
                <a
                  href={`#diff-${encodeURIComponent(file.filePath)}`}
                  className="text-primary-500 hover:underline truncate"
                >
                  {file.filePath}
                </a>
                <span className="text-success">+{file.additions}</span>
                <span className="text-error">-{file.deletions}</span>
              </div>
            ))}
          </div>
        </div>

        {files.map((file) => (
          <DiffFileView
            key={file.filePath}
            file={file}
            onLineComment={onLineComment}
            forceCollapsed={allCollapsed}
            viewMode={viewMode}
            defaultCollapsed={bigDiff || file.additions + file.deletions > AUTO_COLLAPSE_THRESHOLD}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}

const DiffFileView = memo(function DiffFileView({
  file,
  onLineComment,
  forceCollapsed,
  viewMode,
  defaultCollapsed,
}: {
  file: DiffFile;
  onLineComment?: (filePath: string, lineNumber: number, body: string) => void;
  forceCollapsed: boolean;
  viewMode: ViewMode;
  defaultCollapsed: boolean;
}) {
  const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);
  const [showAllLines, setShowAllLines] = useState(false);
  const [activeCommentLine, setActiveCommentLine] = useState<number | null>(null);
  const [commentBody, setCommentBody] = useState('');

  const collapsed = forceCollapsed || localCollapsed;

  const totalUnifiedLines = useMemo(
    () => file.hunks.reduce((s, h) => s + h.lines.length, 0),
    [file.hunks],
  );
  const hiddenCount = showAllLines ? 0 : Math.max(0, totalUnifiedLines - LINE_RENDER_CAP);

  const handleSubmitComment = useCallback(() => {
    if (!commentBody.trim() || activeCommentLine == null) return;
    onLineComment?.(file.filePath, activeCommentLine, commentBody.trim());
    setCommentBody('');
    setActiveCommentLine(null);
  }, [commentBody, activeCommentLine, file.filePath, onLineComment]);

  const handleToggleComment = useCallback((lineNum: number) => {
    setActiveCommentLine((prev) => (prev === lineNum ? null : lineNum));
    setCommentBody('');
  }, []);

  const handleCancelComment = useCallback(() => {
    setActiveCommentLine(null);
    setCommentBody('');
  }, []);

  return (
    <div
      id={`diff-${encodeURIComponent(file.filePath)}`}
      className="rounded-[var(--radius-md)] border border-border overflow-hidden"
    >
      <button
        onClick={() => setLocalCollapsed(!localCollapsed)}
        className="flex w-full items-center gap-2 border-b border-border bg-surface-hover px-4 py-2 text-sm hover:bg-background transition-colors text-left cursor-pointer"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        )}
        <File className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
        <span className="font-mono font-medium truncate">{file.filePath}</span>
        <StatusBadge status={file.status} />
        <span className="ml-auto flex items-center gap-1.5 text-xs shrink-0">
          <DiffBar additions={file.additions} deletions={file.deletions} />
          <span className="text-success">+{file.additions}</span>
          <span className="text-error">-{file.deletions}</span>
        </span>
      </button>

      {!collapsed && (
        <div className="overflow-x-auto">
          {viewMode === 'split' ? (
            <table className="w-full text-xs font-mono">
              <tbody>
                {file.hunks.map((hunk, hi) => (
                  <HunkViewSplit
                    key={hi}
                    hunk={hunk}
                    filePath={file.filePath}
                    onLineComment={onLineComment}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs font-mono">
              <tbody>
                {file.hunks.map((hunk, hi) => {
                  const hunkStart = file.hunks.slice(0, hi).reduce((s, h) => s + h.lines.length, 0);
                  const capEnd = showAllLines ? Infinity : LINE_RENDER_CAP;
                  if (hunkStart >= capEnd) return null;
                  const slicedLines = showAllLines
                    ? hunk.lines
                    : hunk.lines.slice(0, Math.max(0, capEnd - hunkStart));
                  return (
                    <HunkViewUnified
                      key={hi}
                      hunk={hunk}
                      lines={slicedLines}
                      filePath={file.filePath}
                      activeCommentLine={activeCommentLine}
                      commentBody={commentBody}
                      onToggleComment={handleToggleComment}
                      onCommentBodyChange={setCommentBody}
                      onSubmitComment={handleSubmitComment}
                      onCancelComment={handleCancelComment}
                    />
                  );
                })}
                {hiddenCount > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1.5"
                        onClick={() => setShowAllLines(true)}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                        Show {hiddenCount} more lines
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
});

const HunkViewSplit = memo(function HunkViewSplit({
  hunk,
  filePath,
  onLineComment,
}: {
  hunk: DiffHunk;
  filePath: string;
  onLineComment?: (filePath: string, lineNumber: number, body: string) => void;
}) {
  const pairs = useMemo(() => splitPairLines(hunk.lines), [hunk.lines]);
  return (
    <>
      <tr className="bg-primary-50/50">
        <td colSpan={4} className="px-4 py-1 text-primary-600 text-[11px]">
          {hunk.header}
        </td>
      </tr>
      {pairs.map((pair, pi) => (
        <SplitLineRow key={pi} pair={pair} filePath={filePath} onLineComment={onLineComment} />
      ))}
    </>
  );
});

const HunkViewUnified = memo(function HunkViewUnified({
  hunk,
  lines,
  filePath,
  activeCommentLine,
  commentBody,
  onToggleComment,
  onCommentBodyChange,
  onSubmitComment,
  onCancelComment,
}: {
  hunk: DiffHunk;
  lines: DiffLine[];
  filePath: string;
  activeCommentLine: number | null;
  commentBody: string;
  onToggleComment: (lineNum: number) => void;
  onCommentBodyChange: (body: string) => void;
  onSubmitComment: () => void;
  onCancelComment: () => void;
}) {
  return (
    <>
      <tr className="bg-primary-50/50">
        <td colSpan={3} className="px-4 py-1 text-primary-600 text-[11px]">
          {hunk.header}
        </td>
      </tr>
      {lines.map((line, li) => (
        <UnifiedLineRow
          key={li}
          line={line}
          filePath={filePath}
          isCommentActive={activeCommentLine === line.newLineNumber}
          commentBody={commentBody}
          onToggleComment={onToggleComment}
          onCommentBodyChange={onCommentBodyChange}
          onSubmitComment={onSubmitComment}
          onCancelComment={onCancelComment}
        />
      ))}
    </>
  );
});

const SplitLineRow = memo(function SplitLineRow({
  pair,
  filePath,
  onLineComment,
}: {
  pair: { old: DiffLine | null; new: DiffLine | null };
  filePath: string;
  onLineComment?: (filePath: string, lineNumber: number, body: string) => void;
}) {
  const oldBg =
    pair.old?.type === 'del'
      ? 'bg-red-200 dark:bg-red-900/50'
      : pair.old?.type === 'context' ? '' : 'bg-surface-hover';
  const newBg =
    pair.new?.type === 'add'
      ? 'bg-emerald-200 dark:bg-emerald-900/50'
      : pair.new?.type === 'context' ? '' : 'bg-surface-hover';
  const oldText = pair.old?.type === 'del' ? 'text-black dark:text-white' : '';
  const newText = pair.new?.type === 'add' ? 'text-black dark:text-white' : '';

  return (
    <tr className="group">
      <td className={cn('select-none border-r border-border px-2 py-0 text-right text-text-tertiary w-10 text-[11px]', oldBg)}>
        {pair.old?.oldLineNumber ?? ''}
      </td>
      <td className={cn('border-r border-border px-3 py-0 whitespace-pre font-mono text-[12px] w-[50%]', oldBg, oldText)}>
        {pair.old ? `${pair.old.type === 'del' ? '-' : ' '}${pair.old.content}` : ''}
      </td>
      <td className={cn('select-none border-r border-border px-2 py-0 text-right text-text-tertiary w-10 text-[11px]', newBg)}>
        {pair.new?.newLineNumber ?? ''}
      </td>
      <td className={cn('px-3 py-0 whitespace-pre font-mono text-[12px] w-[50%]', newBg, newText)}>
        {pair.new ? `${pair.new.type === 'add' ? '+' : ' '}${pair.new.content}` : ''}
        {onLineComment && pair.new?.newLineNumber && (
          <button
            type="button"
            onClick={() => onLineComment(filePath, pair.new!.newLineNumber!, '')}
            className="invisible group-hover:visible ml-2 rounded bg-primary-500 px-1 py-0.5 text-white text-[10px]"
          >
            <MessageSquare className="h-3 w-3" />
          </button>
        )}
      </td>
    </tr>
  );
});

const UnifiedLineRow = memo(function UnifiedLineRow({
  line,
  isCommentActive,
  commentBody,
  onToggleComment,
  onCommentBodyChange,
  onSubmitComment,
  onCancelComment,
}: {
  line: DiffLine;
  filePath: string;
  isCommentActive: boolean;
  commentBody: string;
  onToggleComment: (lineNum: number) => void;
  onCommentBodyChange: (body: string) => void;
  onSubmitComment: () => void;
  onCancelComment: () => void;
}) {
  const bgColor =
    line.type === 'add'
      ? 'bg-emerald-200 dark:bg-emerald-900/50'
      : line.type === 'del'
        ? 'bg-red-200 dark:bg-red-900/50'
        : '';
  const textColor =
    line.type === 'add'
      ? 'text-black dark:text-white'
      : line.type === 'del'
        ? 'text-black dark:text-white'
        : '';
  const prefix = line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ';

  return (
    <>
      <tr className={cn('hover:brightness-95 group', bgColor)}>
        <td className="select-none border-r border-border px-2 py-0 text-right text-text-tertiary w-12">
          {line.oldLineNumber ?? ''}
        </td>
        <td className="select-none border-r border-border px-2 py-0 text-right text-text-tertiary w-12">
          {line.newLineNumber ?? ''}
        </td>
        <td className={cn('px-4 py-0 whitespace-pre', textColor)}>
          <span className="inline-flex items-center">
            {line.newLineNumber && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onToggleComment(line.newLineNumber!)}
                    className="invisible group-hover:visible mr-2 rounded bg-primary-500 hover:bg-primary-600 px-1.5 py-0.5 text-white text-[10px] cursor-pointer transition-colors"
                  >
                    <MessageSquare className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Add comment on this line</TooltipContent>
              </Tooltip>
            )}
            {prefix}
            {line.content}
          </span>
        </td>
      </tr>
      {isCommentActive && (
        <tr>
          <td colSpan={3}>
            <div className="border-y border-border bg-surface-hover p-3 space-y-2">
              <Textarea
                autoFocus
                value={commentBody}
                onChange={(e) => onCommentBodyChange(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="text-xs resize-y"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onSubmitComment();
                  if (e.key === 'Escape') onCancelComment();
                }}
              />
              <div className="flex items-center gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={onCancelComment} className="gap-1 text-xs">
                  <X className="h-3 w-3" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!commentBody.trim()}
                  onClick={onSubmitComment}
                  className="gap-1 text-xs"
                >
                  <Send className="h-3 w-3" />
                  Comment
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

function splitPairLines(lines: DiffLine[]): Array<{ old: DiffLine | null; new: DiffLine | null }> {
  const result: Array<{ old: DiffLine | null; new: DiffLine | null }> = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].type === 'context') {
      result.push({ old: lines[i], new: lines[i] });
      i++;
    } else {
      const dels: DiffLine[] = [];
      const adds: DiffLine[] = [];
      while (i < lines.length && lines[i].type === 'del') dels.push(lines[i++]);
      while (i < lines.length && lines[i].type === 'add') adds.push(lines[i++]);
      const maxLen = Math.max(dels.length, adds.length);
      for (let j = 0; j < maxLen; j++) {
        result.push({ old: dels[j] ?? null, new: adds[j] ?? null });
      }
    }
  }
  return result;
}

function DiffBar({ additions, deletions }: { additions: number; deletions: number }) {
  const total = additions + deletions;
  if (total === 0) return null;
  const blocks = 5;
  const addBlocks = Math.round((additions / total) * blocks);
  const delBlocks = blocks - addBlocks;
  return (
    <span className="inline-flex gap-px">
      {Array.from({ length: addBlocks }).map((_, i) => (
        <span key={`a${i}`} className="inline-block h-2 w-1.5 rounded-[1px] bg-success" />
      ))}
      {Array.from({ length: delBlocks }).map((_, i) => (
        <span key={`d${i}`} className="inline-block h-2 w-1.5 rounded-[1px] bg-error" />
      ))}
    </span>
  );
}

function StatusBadge({ status }: { status: DiffFile['status'] }) {
  const map = {
    added: { variant: 'success' as const, label: 'A' },
    modified: { variant: 'warning' as const, label: 'M' },
    deleted: { variant: 'destructive' as const, label: 'D' },
    renamed: { variant: 'default' as const, label: 'R' },
  };
  const s = map[status];
  return (
    <Badge variant={s.variant} className="text-[10px] px-1 py-0 font-mono">
      {s.label}
    </Badge>
  );
}
