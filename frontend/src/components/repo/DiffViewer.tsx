import { useState } from 'react';
import { ChevronDown, ChevronRight, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import type { DiffFile, DiffHunk, DiffLine } from '@/types';

interface DiffViewerProps {
  files: DiffFile[];
  onLineComment?: (filePath: string, lineNumber: number) => void;
}

export function DiffViewer({ files, onLineComment }: DiffViewerProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] border border-border bg-surface-hover p-3">
        <p className="text-sm font-medium">
          Showing {files.length} changed {files.length === 1 ? 'file' : 'files'}
        </p>
        <div className="mt-2 space-y-1">
          {files.map((file) => (
            <div key={file.filePath} className="flex items-center gap-2 text-xs">
              <StatusBadge status={file.status} />
              <a href={`#diff-${encodeURIComponent(file.filePath)}`} className="text-primary-500 hover:underline truncate">
                {file.filePath}
              </a>
              <span className="text-success">+{file.additions}</span>
              <span className="text-error">-{file.deletions}</span>
            </div>
          ))}
        </div>
      </div>

      {files.map((file) => (
        <DiffFileView key={file.filePath} file={file} onLineComment={onLineComment} />
      ))}
    </div>
  );
}

function DiffFileView({ file, onLineComment }: { file: DiffFile; onLineComment?: (filePath: string, lineNumber: number) => void }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div id={`diff-${encodeURIComponent(file.filePath)}`} className="rounded-[var(--radius-md)] border border-border overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 border-b border-border bg-surface-hover px-4 py-2 text-sm hover:bg-background transition-colors text-left cursor-pointer"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        <File className="h-3.5 w-3.5 text-text-tertiary" />
        <span className="font-mono font-medium truncate">{file.filePath}</span>
        <StatusBadge status={file.status} />
        <span className="ml-auto text-xs">
          <span className="text-success">+{file.additions}</span>{' '}
          <span className="text-error">-{file.deletions}</span>
        </span>
      </button>

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
                <HunkView key={hi} hunk={hunk} filePath={file.filePath} onLineComment={onLineComment} />
              ))}
            </tbody>
          </table>
        </div>
        </motion.div>
      )}
    </div>
  );
}

function HunkView({ hunk, filePath, onLineComment }: { hunk: DiffHunk; filePath: string; onLineComment?: (filePath: string, lineNumber: number) => void }) {
  return (
    <>
      <tr className="bg-blue-50">
        <td colSpan={3} className="px-4 py-1 text-blue-600">{hunk.header}</td>
      </tr>
      {hunk.lines.map((line, li) => (
        <DiffLineRow key={li} line={line} filePath={filePath} onLineComment={onLineComment} />
      ))}
    </>
  );
}

function DiffLineRow({ line, filePath, onLineComment }: { line: DiffLine; filePath: string; onLineComment?: (filePath: string, lineNumber: number) => void }) {
  const bgColor = line.type === 'add' ? 'bg-emerald-50' : line.type === 'del' ? 'bg-red-50' : '';
  const textColor = line.type === 'add' ? 'text-emerald-800' : line.type === 'del' ? 'text-red-800' : '';
  const prefix = line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ';

  return (
    <tr className={cn('hover:brightness-95 group', bgColor)}>
      <td className="select-none border-r border-border px-2 py-0 text-right text-text-tertiary w-12">
        {line.oldLineNumber ?? ''}
      </td>
      <td className="select-none border-r border-border px-2 py-0 text-right text-text-tertiary w-12">
        {line.newLineNumber ?? ''}
      </td>
      <td className={cn('px-4 py-0 whitespace-pre', textColor)}>
        {onLineComment && line.newLineNumber && (
          <button
            onClick={() => onLineComment(filePath, line.newLineNumber!)}
            className="invisible group-hover:visible mr-2 rounded bg-primary-500 px-1 text-white text-[10px] cursor-pointer"
          >
            +
          </button>
        )}
        {prefix}{line.content}
      </td>
    </tr>
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
  return <Badge variant={s.variant} className="text-[10px] px-1 py-0 font-mono">{s.label}</Badge>;
}
