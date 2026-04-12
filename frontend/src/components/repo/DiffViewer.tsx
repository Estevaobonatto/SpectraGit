import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, File, Minimize2, Maximize2, MessageSquare, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'motion/react';
import type { DiffFile, DiffHunk, DiffLine } from '@/types';

interface DiffViewerProps {
  files: DiffFile[];
  onLineComment?: (filePath: string, lineNumber: number, body: string) => void;
}

export function DiffViewer({ files, onLineComment }: DiffViewerProps) {
  const [allCollapsed, setAllCollapsed] = useState(false);

  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* File summary header */}
        <div className="rounded-[var(--radius-md)] border border-border bg-surface-hover p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Showing{' '}
              <span className="font-bold">{files.length}</span>{' '}
              changed {files.length === 1 ? 'file' : 'files'}{' '}
              with{' '}
              <span className="text-success font-semibold">+{totalAdditions}</span>{' '}
              and{' '}
              <span className="text-error font-semibold">-{totalDeletions}</span>
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAllCollapsed((v) => !v)}
                  className="gap-1.5 text-xs"
                >
                  {allCollapsed ? (
                    <>
                      <Maximize2 className="h-3.5 w-3.5" />
                      Expand all
                    </>
                  ) : (
                    <>
                      <Minimize2 className="h-3.5 w-3.5" />
                      Collapse all
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{allCollapsed ? 'Expand all files' : 'Collapse all files'}</TooltipContent>
            </Tooltip>
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
          />
        ))}
      </div>
    </TooltipProvider>
  );
}

function DiffFileView({
  file,
  onLineComment,
  forceCollapsed,
}: {
  file: DiffFile;
  onLineComment?: (filePath: string, lineNumber: number, body: string) => void;
  forceCollapsed: boolean;
}) {
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const collapsed = forceCollapsed || localCollapsed;

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
        {/* Change bar visualization */}
        <span className="ml-auto flex items-center gap-1.5 text-xs shrink-0">
          <DiffBar additions={file.additions} deletions={file.deletions} />
          <span className="text-success">+{file.additions}</span>
          <span className="text-error">-{file.deletions}</span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <tbody>
                  {file.hunks.map((hunk, hi) => (
                    <HunkView
                      key={hi}
                      hunk={hunk}
                      filePath={file.filePath}
                      onLineComment={onLineComment}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HunkView({
  hunk,
  filePath,
  onLineComment,
}: {
  hunk: DiffHunk;
  filePath: string;
  onLineComment?: (filePath: string, lineNumber: number, body: string) => void;
}) {
  return (
    <>
      <tr className="bg-primary-50/50">
        <td colSpan={3} className="px-4 py-1 text-primary-600 text-[11px]">
          {hunk.header}
        </td>
      </tr>
      {hunk.lines.map((line, li) => (
        <DiffLineRow
          key={li}
          line={line}
          filePath={filePath}
          onLineComment={onLineComment}
        />
      ))}
    </>
  );
}

function DiffLineRow({
  line,
  filePath,
  onLineComment,
}: {
  line: DiffLine;
  filePath: string;
  onLineComment?: (filePath: string, lineNumber: number, body: string) => void;
}) {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentBody, setCommentBody] = useState('');

  const bgColor =
    line.type === 'add'
      ? 'bg-emerald-50/70'
      : line.type === 'del'
        ? 'bg-red-50/70'
        : '';
  const textColor =
    line.type === 'add'
      ? 'text-emerald-800'
      : line.type === 'del'
        ? 'text-red-800'
        : '';
  const prefix = line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ';

  const handleSubmitComment = useCallback(() => {
    if (!commentBody.trim() || !line.newLineNumber) return;
    onLineComment?.(filePath, line.newLineNumber, commentBody.trim());
    setCommentBody('');
    setShowCommentForm(false);
  }, [commentBody, filePath, line.newLineNumber, onLineComment]);

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
            {onLineComment && line.newLineNumber && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowCommentForm((v) => !v)}
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
      {/* Inline comment form */}
      <AnimatePresence>
        {showCommentForm && (
          <tr>
            <td colSpan={3}>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="border-y border-border bg-surface-hover p-3 space-y-2">
                  <Textarea
                    autoFocus
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                    className="text-xs resize-y"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleSubmitComment();
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCommentForm(false);
                        setCommentBody('');
                      }}
                      className="gap-1 text-xs"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={!commentBody.trim()}
                      onClick={handleSubmitComment}
                      className="gap-1 text-xs"
                    >
                      <Send className="h-3 w-3" />
                      Comment
                    </Button>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

/** Mini bar chart showing additions vs deletions ratio */
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
