import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  CircleDot,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Pause,
  UserCheck,
  Ban,
  CircleCheck,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useIssuesKanban, useMoveIssueStatus } from '@/hooks/useIssues';
import { useAuthStore } from '@/stores/auth.store';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { PageLoader } from '@/components/ui/spinner';
import { IssueTypeBadge } from '@/components/issues/IssueTypeBadge';
import { IssuePriorityBadge } from '@/components/issues/IssuePriorityBadge';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Issue } from '@/types';

// Map column key → Prisma IssueStatus value used for status update
const COLUMN_STATUS: Record<string, string> = {
  triage: 'TRIAGE',
  open: 'OPEN',
  confirmed: 'CONFIRMED',
  in_progress: 'IN_PROGRESS',
  blocked: 'BLOCKED',
  waiting_user: 'WAITING_USER',
  done: 'RESOLVED',
};

const columnConfig: { key: string; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'triage', label: 'Triage', icon: AlertTriangle, color: '#F59E0B' },
  { key: 'open', label: 'Open', icon: CircleDot, color: '#10B981' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, color: '#3B82F6' },
  { key: 'in_progress', label: 'In Progress', icon: Clock, color: '#8B5CF6' },
  { key: 'blocked', label: 'Blocked', icon: Pause, color: '#EF4444' },
  { key: 'waiting_user', label: 'Waiting', icon: UserCheck, color: '#F97316' },
  { key: 'done', label: 'Done', icon: CircleCheck, color: '#6B7280' },
];

// ─── Card inner content ───────────────────────────────────────────────────────

function IssueCard({
  issue,
  owner,
  repo,
  onDragHandlePointerDown,
  isDragging,
  isOverlay,
}: {
  issue: Issue;
  owner: string;
  repo: string;
  onDragHandlePointerDown?: (e: React.PointerEvent) => void;
  isDragging?: boolean;
  isOverlay?: boolean;
}) {
  return (
    <Card
      className={cn(
        'group',
        isOverlay && 'shadow-2xl rotate-2 scale-105 border-primary-400',
        isDragging && 'opacity-30',
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-1.5">
          <div
            onPointerDown={onDragHandlePointerDown}
            className="mt-0.5 shrink-0 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none select-none"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
          <Link
            to={`/${owner}/${repo}/issues/${issue.number}`}
            className="flex-1 text-sm font-medium text-text-primary hover:text-primary-600 transition-colors leading-tight"
            onClick={(e) => {
              if (isDragging) e.preventDefault();
            }}
          >
            {issue.title}
          </Link>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap pl-5">
          <IssueTypeBadge type={issue.type} />
          <IssuePriorityBadge priority={issue.priority} />
        </div>
        <div className="flex items-center justify-between text-xs text-text-tertiary pl-5">
          <span className="font-mono">#{issue.number}</span>
          <div className="flex items-center gap-1.5">
            <span>{formatRelativeTime(issue.createdAt)}</span>
            {issue.assignee && (
              <Avatar src={issue.assignee.avatarUrl} alt={issue.assignee.username} size="sm" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Animated card with layoutId for cross-column transitions ─────────────────

function AnimatedCard({
  issue,
  owner,
  repo,
  isDragging,
  onDragStart,
}: {
  issue: Issue;
  owner: string;
  repo: string;
  isDragging: boolean;
  onDragStart: (e: React.PointerEvent, issue: Issue) => void;
}) {
  return (
    <motion.div
      layoutId={issue.id}
      layout="position"
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      animate={{ opacity: isDragging ? 0.3 : 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -6 }}
      transition={{
        layout: { type: 'spring', stiffness: 350, damping: 30 },
        opacity: { duration: 0.15 },
        scale: { type: 'spring', stiffness: 400, damping: 25 },
      }}
    >
      <IssueCard
        issue={issue}
        owner={owner}
        repo={repo}
        isDragging={isDragging}
        onDragHandlePointerDown={(e) => onDragStart(e, issue)}
      />
    </motion.div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function KanbanColumn({
  colKey,
  label,
  icon: Icon,
  color,
  issues,
  owner,
  repo,
  isOver,
  draggingId,
  onDragStart,
  columnRef,
}: {
  colKey: string;
  label: string;
  icon: React.ElementType;
  color: string;
  issues: Issue[];
  owner: string;
  repo: string;
  isOver: boolean;
  draggingId: string | null;
  onDragStart: (e: React.PointerEvent, issue: Issue) => void;
  columnRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex-shrink-0 w-72"
    >
      <div
        ref={columnRef}
        data-column={colKey}
        className={cn(
          'rounded-[var(--radius-md)] border transition-all duration-200',
          isOver
            ? 'border-primary-400 bg-primary-50/40 shadow-sm shadow-primary-200/50'
            : 'border-border bg-surface-hover/30',
        )}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
          <Icon className="h-4 w-4" style={{ color }} />
          <span className="text-sm font-semibold text-text-primary">{label}</span>
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">
            {issues.length}
          </Badge>
        </div>

        <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {issues.length === 0 ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-text-tertiary text-center py-8"
              >
                No issues
              </motion.p>
            ) : (
              issues.map((issue) => (
                <AnimatedCard
                  key={issue.id}
                  issue={issue}
                  owner={owner}
                  repo={repo}
                  isDragging={draggingId === issue.id}
                  onDragStart={onDragStart}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Floating drag overlay (rendered in portal) ──────────────────────────────

function FloatingOverlay({
  issue,
  owner,
  repo,
  position,
}: {
  issue: Issue;
  owner: string;
  repo: string;
  position: { x: number; y: number };
}) {
  return createPortal(
    <motion.div
      initial={{ scale: 0.95, opacity: 0.8 }}
      animate={{ scale: 1.05, opacity: 1, rotate: 2 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="fixed pointer-events-none z-[100] w-72"
      style={{ left: position.x - 144, top: position.y - 40 }}
    >
      <IssueCard issue={issue} owner={owner} repo={repo} isOverlay />
    </motion.div>,
    document.body,
  );
}

// ─── Board page ───────────────────────────────────────────────────────────────

export default function IssueBoardPage() {
  const { owner, repo } = useParams();
  const { isAuthenticated } = useAuthStore();
  const { data: kanbanData, isLoading, isError } = useIssuesKanban(owner!, repo!);
  const moveStatus = useMoveIssueStatus(owner!, repo!);

  // Optimistic local column state (null = use server data)
  const [columns, setColumns] = useState<Record<string, Issue[]> | null>(null);
  const boardData = (columns ?? kanbanData ?? {}) as Record<string, Issue[]>;

  // Drag state
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [targetColumn, setTargetColumn] = useState<string | null>(null);

  // Refs for mutable drag info (avoids stale closures in event listeners)
  const dragInfoRef = useRef<{ fromColumn: string; issue: Issue } | null>(null);
  const latestTargetRef = useRef<string | null>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const findColumn = useCallback(
    (issueId: string) =>
      Object.entries(boardData).find(([, issues]) => issues.some((i) => i.id === issueId))?.[0],
    [boardData],
  );

  const handleDragStart = useCallback(
    (e: React.PointerEvent, issue: Issue) => {
      e.preventDefault();
      const col = findColumn(issue.id);
      if (!col) return;

      dragInfoRef.current = { fromColumn: col, issue };
      latestTargetRef.current = null;

      setDraggedIssue(issue);
      setDragPosition({ x: e.clientX, y: e.clientY });
      if (!columns && kanbanData) setColumns(kanbanData as Record<string, Issue[]>);
    },
    [findColumn, columns, kanbanData],
  );

  // Attach global pointer listeners while dragging
  useEffect(() => {
    if (!draggedIssue) return;

    const handlePointerMove = (e: PointerEvent) => {
      setDragPosition({ x: e.clientX, y: e.clientY });

      // Hit-test column bounding boxes
      const hit = Object.entries(columnRefs.current).find(([, el]) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      });
      const colKey = hit?.[0] ?? null;
      latestTargetRef.current = colKey;
      setTargetColumn(colKey);
    };

    const handlePointerUp = () => {
      const info = dragInfoRef.current;
      const dropCol = latestTargetRef.current;

      if (info && dropCol && dropCol !== info.fromColumn) {
        // Optimistic move
        setColumns((prev) => {
          const base = { ...(prev ?? (kanbanData as Record<string, Issue[]>)) };
          const fromList = [...(base[info.fromColumn] ?? [])];
          const toList = [...(base[dropCol] ?? [])];
          const idx = fromList.findIndex((i) => i.id === info.issue.id);
          if (idx === -1) return base;
          const [moved] = fromList.splice(idx, 1);
          toList.unshift({ ...moved, status: COLUMN_STATUS[dropCol] as Issue['status'] });
          return { ...base, [info.fromColumn]: fromList, [dropCol]: toList };
        });

        moveStatus.mutate(
          { issueNumber: info.issue.number, status: COLUMN_STATUS[dropCol] },
          { onError: () => setColumns(null) },
        );
      }

      dragInfoRef.current = null;
      latestTargetRef.current = null;
      setDraggedIssue(null);
      setTargetColumn(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggedIssue, kanbanData, moveStatus]);

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-8 text-center">
        <Ban className="mx-auto mb-3 h-8 w-8 text-error opacity-60" />
        <p className="font-medium text-text-primary">Failed to load board</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Issue Board</h1>
        <div className="flex items-center gap-2">
          {moveStatus.isPending && (
            <span className="text-xs text-text-tertiary animate-pulse">Saving…</span>
          )}
          {isAuthenticated && (
            <Button size="sm" asChild>
              <Link to={`/${owner}/${repo}/issues/new`}>
                <Plus className="h-4 w-4" />
                New issue
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-text-tertiary select-none">
        <ChevronLeft className="h-3 w-3" />
        <span>Scroll horizontally to see all {columnConfig.length} stages</span>
        <ChevronRight className="h-3 w-3" />
      </div>

      <div className="relative">
        {/* left fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent z-10" />
        {/* right fade */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-hover">
        {columnConfig.map((col) => (
          <KanbanColumn
            key={col.key}
            colKey={col.key}
            label={col.label}
            icon={col.icon}
            color={col.color}
            issues={boardData[col.key] ?? []}
            owner={owner!}
            repo={repo!}
            isOver={targetColumn === col.key}
            draggingId={draggedIssue?.id ?? null}
            onDragStart={handleDragStart}
            columnRef={(el) => {
              columnRefs.current[col.key] = el;
            }}
          />
        ))}
        </div>
      </div>

      <AnimatePresence>
        {draggedIssue && (
          <FloatingOverlay
            issue={draggedIssue}
            owner={owner!}
            repo={repo!}
            position={dragPosition}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
