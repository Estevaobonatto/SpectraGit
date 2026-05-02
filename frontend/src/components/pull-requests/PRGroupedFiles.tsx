// @ts-nocheck
import { useState, memo } from 'react';
import { ChevronDown, ChevronRight, Folder, FileCode2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Fade } from '@/components/animate-ui/fade';
import { AnimatedList } from '@/components/animate-ui/animated-list';
import type { DiffFile, DiffLine } from '@/types';

interface PRGroupedFilesProps {
  files: DiffFile[];
}

interface DirectoryNode {
  name: string;
  path: string;
  /** Files stored with original full path preserved as `_fullPath` */
  files: Array<DiffFile & { _displayName: string }>;
  children: Record<string, DirectoryNode>;
}

function buildTree(files: DiffFile[]): DirectoryNode {
  const root: DirectoryNode = { name: '', path: '', files: [], children: {} };
  for (const file of files) {
    const parts = file.filePath.split('/');
    const fileName = parts.pop()!;
    let node = root;
    let currentPath = '';
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!node.children[part]) {
        node.children[part] = { name: part, path: currentPath, files: [], children: {} };
      }
      node = node.children[part];
    }
    // Keep original file (with full filePath and all hunks), add display name
    node.files.push({ ...file, _displayName: fileName });
  }
  return root;
}

// ─── Inline diff ──────────────────────────────────────────────────────────────

const InlineDiff = memo(function InlineDiff({ file }: { file: DiffFile }) {
  const [showAll, setShowAll] = useState(false);
  const CAP = 200;

  let linesRendered = 0;
  let totalLines = file.hunks.reduce((s, h) => s + h.lines.length, 0);

  return (
    <div className="overflow-x-auto border-t border-border">
      <table className="w-full text-[11px] font-mono">
        <tbody>
          {file.hunks.map((hunk, hi) => {
            const hunkStart = linesRendered;
            const capEnd = showAll ? Infinity : CAP;
            if (hunkStart >= capEnd) return null;
            const lines = showAll
              ? hunk.lines
              : hunk.lines.slice(0, Math.max(0, capEnd - hunkStart));
            linesRendered += hunk.lines.length;

            return (
              <>
                <tr key={`h-${hi}`} className="bg-primary-50/60">
                  <td colSpan={3} className="px-3 py-0.5 text-primary-600 text-[10px]">
                    {hunk.header}
                  </td>
                </tr>
                {lines.map((line: DiffLine, li: number) => {
                  const bg =
                    line.type === 'add'
                      ? 'bg-emerald-200 dark:bg-emerald-900/50'
                        : line.type === 'del'
                        ? 'bg-red-200 dark:bg-red-900/50'
                        : '';
                  const text =
                    line.type === 'add'
                      ? 'text-black dark:text-white'
                        : line.type === 'del'
                        ? 'text-black dark:text-white'
                        : '';
                  const prefix = line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ';
                  return (
                    <tr key={li} className={cn('leading-[18px]', bg)}>
                      <td className="select-none border-r border-border/60 px-1.5 py-0 text-right text-text-tertiary w-8 text-[10px]">
                        {line.oldLineNumber ?? ''}
                      </td>
                      <td className="select-none border-r border-border/60 px-1.5 py-0 text-right text-text-tertiary w-8 text-[10px]">
                        {line.newLineNumber ?? ''}
                      </td>
                      <td className={cn('px-3 py-0 whitespace-pre', text)}>
                        {prefix}{line.content}
                      </td>
                    </tr>
                  );
                })}
              </>
            );
          })}
          {!showAll && totalLines > CAP && (
            <tr>
              <td colSpan={3} className="py-1.5 text-center">
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="text-[11px] text-primary-500 hover:underline"
                >
                  Show {totalLines - CAP} more lines…
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});

// ─── File row (expandable) ────────────────────────────────────────────────────

function FileRow({ file }: { file: DiffFile & { _displayName: string } }) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = file.hunks && file.hunks.length > 0;

  const statusColors: Record<DiffFile['status'], string> = {
    added: 'text-success',
    deleted: 'text-error',
    modified: 'text-warning',
    renamed: 'text-blue-500',
  };

  const statusBadge: Record<DiffFile['status'], { variant: 'success' | 'destructive' | 'warning' | 'default'; label: string }> = {
    added: { variant: 'success', label: 'A' },
    deleted: { variant: 'destructive', label: 'D' },
    modified: { variant: 'warning', label: 'M' },
    renamed: { variant: 'default', label: 'R' },
  };

  const badge = statusBadge[file.status];

  return (
    <div
      id={`grouped-${encodeURIComponent(file.filePath)}`}
      className="rounded-[var(--radius-sm)] overflow-hidden"
    >
      <button
        type="button"
        onClick={() => hasContent && setExpanded((v) => !v)}
        className={cn(
          'w-full flex items-center gap-2 py-1 px-2 rounded transition-colors text-left group',
          hasContent ? 'hover:bg-surface-hover cursor-pointer' : 'cursor-default',
          expanded && 'bg-surface-hover rounded-b-none',
        )}
      >
        {hasContent ? (
          expanded
            ? <ChevronDown className="h-3 w-3 text-text-tertiary flex-shrink-0" />
            : <ChevronRight className="h-3 w-3 text-text-tertiary flex-shrink-0" />
        ) : (
          <span className="h-3 w-3 flex-shrink-0" />
        )}
        <FileCode2 className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary" />
        <span className={cn('flex-1 text-xs truncate', statusColors[file.status])}>
          {file._displayName}
        </span>
        <Badge
          variant={badge.variant}
          className="text-[9px] px-1 py-0 font-mono h-4 opacity-60 group-hover:opacity-100 transition-opacity"
        >
          {badge.label}
        </Badge>
        <span className="text-[11px] flex gap-1 ml-1">
          {file.additions > 0 && <span className="text-success">+{file.additions}</span>}
          {file.deletions > 0 && <span className="text-error">-{file.deletions}</span>}
        </span>
      </button>

      {expanded && hasContent && (
        <Fade direction="down" duration={0.2}>
          <div className="border border-t-0 border-border rounded-b-[var(--radius-sm)] overflow-hidden mb-1">
            <InlineDiff file={file} />
          </div>
        </Fade>
      )}
    </div>
  );
}

// ─── Directory group ──────────────────────────────────────────────────────────

function DirectoryGroup({ node, depth = 0 }: { node: DirectoryNode; depth?: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = Object.keys(node.children).length > 0;
  const hasFiles = node.files.length > 0;

  if (!hasChildren && !hasFiles) return null;

  return (
    <div>
      {node.name && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-1.5 py-1.5 px-2 rounded hover:bg-surface-hover transition-colors text-left"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {open
            ? <ChevronDown className="h-3.5 w-3.5 text-text-tertiary flex-shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-text-tertiary flex-shrink-0" />}
          <Folder className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
          <span className="flex-1 text-xs font-medium text-text-primary">{node.name}</span>
          <span className="text-[11px] text-text-tertiary">
            {node.files.length + Object.keys(node.children).length} items
          </span>
        </button>
      )}

      {open && (
        <AnimatedList staggerDelay={0.03} duration={0.2} style={{ paddingLeft: node.name ? `${(depth + 1) * 12}px` : 0 }}>
          {node.files.map((file, i) => (
            <FileRow key={i} file={file} />
          ))}
          {Object.values(node.children)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((child) => (
              <DirectoryGroup key={child.path} node={child} depth={node.name ? depth + 1 : 0} />
            ))}
        </AnimatedList>
      )}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export function PRGroupedFiles({ files }: PRGroupedFilesProps) {
  const tree = buildTree(files);

  if (files.length === 0) {
    return <p className="text-sm text-text-tertiary italic">No files changed.</p>;
  }

  const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface overflow-hidden text-sm">
      <div className="px-3 py-2 border-b border-border bg-surface-hover flex items-center justify-between">
        <span className="text-xs font-semibold text-text-primary">{files.length} files changed</span>
        <div className="flex gap-2 text-xs">
          <span className="text-success">+{totalAdditions}</span>
          <span className="text-error">-{totalDeletions}</span>
        </div>
      </div>
      <div className="p-1">
        <DirectoryGroup node={tree} />
      </div>
    </div>
  );
}
