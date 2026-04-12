import { GitCommit, Plus, Minus, FileCode2, MessageSquare, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PRRiskBadge } from './PRRiskBadge';
import { PRChangeTypeBadges } from './PRChangeTypeBadges';
import { CountingNumber } from '@/components/animate-ui/counting-number';
import { Fade } from '@/components/animate-ui/fade';
import type { PRDiffStats, RiskLevel } from '@/types';

interface PRSummaryCardProps {
  diffStats: PRDiffStats;
  riskLevel: RiskLevel;
  commentCount: number;
  reviewCounts: Record<string, number>;
  className?: string;
}

export function PRSummaryCard({ diffStats, riskLevel, commentCount, reviewCounts, className }: PRSummaryCardProps) {
  const approvedCount = reviewCounts['APPROVED'] ?? 0;
  const changesCount = reviewCounts['CHANGES_REQUESTED'] ?? 0;

  return (
    <Card className={className}>
      <CardContent className="pt-4 pb-3">
        <div className="flex flex-wrap items-center gap-4">
          {/* Commit count */}
          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
            <GitCommit className="h-4 w-4 text-text-tertiary" />
            <CountingNumber value={diffStats.commitCount} className="font-medium text-text-primary" />
            <span>commits</span>
          </div>

          {/* Files changed */}
          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
            <FileCode2 className="h-4 w-4 text-text-tertiary" />
            <CountingNumber value={diffStats.filesChanged} className="font-medium text-text-primary" />
            <span>files changed</span>
          </div>

          {/* Lines added */}
          <div className="flex items-center gap-1.5 text-sm">
            <Plus className="h-3.5 w-3.5 text-success" />
            <CountingNumber value={diffStats.linesAdded} className="font-medium text-success" />
          </div>

          {/* Lines removed */}
          <div className="flex items-center gap-1.5 text-sm">
            <Minus className="h-3.5 w-3.5 text-error" />
            <CountingNumber value={diffStats.linesRemoved} className="font-medium text-error" />
          </div>

          {/* Reviews */}
          {(approvedCount > 0 || changesCount > 0) && (
            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
              <Eye className="h-4 w-4 text-text-tertiary" />
              {approvedCount > 0 && (
                <span className="text-success font-medium">{approvedCount} approved</span>
              )}
              {approvedCount > 0 && changesCount > 0 && <span>·</span>}
              {changesCount > 0 && (
                <span className="text-error font-medium">{changesCount} changes</span>
              )}
            </div>
          )}

          {/* Comments */}
          {commentCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
              <MessageSquare className="h-4 w-4 text-text-tertiary" />
              <span className="font-medium text-text-primary">{commentCount}</span>
              <span>comments</span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Risk badge */}
          <PRRiskBadge level={riskLevel} />
        </div>

        {/* Change type badges */}
        <div className="mt-3">
          <PRChangeTypeBadges categories={diffStats.categories} />
        </div>
      </CardContent>
    </Card>
  );
}
