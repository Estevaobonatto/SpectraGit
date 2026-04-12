import { GitBranch, Tag, Users, UserPlus, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAddReviewer, useRemoveReviewer } from '@/hooks/usePullRequests';
import { useCollaborators } from '@/hooks/useCollaborators';
import type { PullRequest } from '@/types';

interface PRMetadataSidebarProps {
  pr: PullRequest;
  owner: string;
  repo: string;
  canEdit?: boolean;
}

export function PRMetadataSidebar({ pr, owner, repo, canEdit = false }: PRMetadataSidebarProps) {
  const addReviewerMutation = useAddReviewer(owner, repo, pr.number);
  const removeReviewerMutation = useRemoveReviewer(owner, repo, pr.number);
  const { data: collaborators } = useCollaborators(owner, repo);

  const requestedIds = new Set((pr.requestedReviewers ?? []).map(r => r.userId));

  const availableCollaborators = (collaborators ?? []).filter(c => !requestedIds.has(c.userId));

  const handleAddReviewer = (userId: string) => {
    addReviewerMutation.mutate(userId);
  };

  const handleRemoveReviewer = (userId: string) => {
    removeReviewerMutation.mutate(userId);
  };

  return (
    <div className="space-y-4 text-sm">
      {/* Branches */}
      <div>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <GitBranch className="h-3 w-3" />
          Branches
        </h3>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary text-xs">from</span>
            <code className="text-xs bg-surface-hover px-1.5 py-0.5 rounded border border-border font-mono">
              {pr.sourceBranch}
            </code>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary text-xs">into</span>
            <code className="text-xs bg-surface-hover px-1.5 py-0.5 rounded border border-border font-mono">
              {pr.targetBranch}
            </code>
          </div>
        </div>
      </div>

      <Separator />

      {/* Reviewers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            Reviewers
          </h3>
          {canEdit && availableCollaborators.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableCollaborators.map(c => (
                  <DropdownMenuItem
                    key={c.userId}
                    onClick={() => handleAddReviewer(c.userId)}
                    className="gap-2"
                  >
                    <Avatar src={c.user.avatarUrl} alt={c.user.username} size="sm" />
                    <span>{c.user.username}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {(pr.requestedReviewers ?? []).length === 0 ? (
          <p className="text-xs text-text-tertiary">No reviewers requested.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {(pr.requestedReviewers ?? []).map(reviewer => (
              <div key={reviewer.id} className="flex items-center gap-2 group">
                <Avatar src={reviewer.user.avatarUrl} alt={reviewer.user.username} size="sm" />
                <span className="flex-1 text-xs text-text-primary">{reviewer.user.username}</span>
                {canEdit && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-error"
                          onClick={() => handleRemoveReviewer(reviewer.userId)}
                          aria-label="Remove reviewer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Remove reviewer</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Labels */}
      <div>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Tag className="h-3 w-3" />
          Labels
        </h3>
        {(pr.labels ?? []).length === 0 ? (
          <p className="text-xs text-text-tertiary">None yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {(pr.labels ?? []).map(label => (
              <Badge
                key={label.id}
                style={{ backgroundColor: label.color + '33', color: label.color, borderColor: label.color + '55' }}
                variant="outline"
                className="text-[11px] py-0 h-5"
              >
                {label.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
