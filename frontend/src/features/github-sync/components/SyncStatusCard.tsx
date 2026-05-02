import { useQuery, useMutation } from '@tanstack/react-query';
import { RefreshCw, Loader2, CheckCircle2, AlertCircle, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { integrationsService } from '@/services/integrations.service';
import type { GitHubRepo } from '@/types';

interface SyncStatusCardProps {
  repo: GitHubRepo;
}

export default function SyncStatusCard({ repo }: SyncStatusCardProps) {
  const { data: status, isLoading } = useQuery({
    queryKey: ['github-sync-status', repo.fullName],
    queryFn: () => integrationsService.getSyncStatus(repo.fullName),
    enabled: true,
  });

  const syncMutation = useMutation({
    mutationFn: () => integrationsService.syncRepo(repo.fullName),
  });

  const incrementalMutation = useMutation({
    mutationFn: () => integrationsService.syncIncremental(repo.fullName),
  });

  const isSyncing = syncMutation.isPending || incrementalMutation.isPending;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-6">
          <Spinner size="sm" />
        </CardContent>
      </Card>
    );
  }

  const lastSynced = status?.lastSyncedAt
    ? new Date(status.lastSyncedAt)
    : null;

  const isLinked = !!status?.githubRepoFullName;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-text-primary truncate">{repo.fullName}</p>
              {isLinked ? (
                <Badge variant="success" className="text-[10px] shrink-0">Linked</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] shrink-0">Not linked</Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-text-tertiary">
              {lastSynced ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Last synced {lastSynced.toLocaleString()}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-text-tertiary/60" />
                  Never synced
                </span>
              )}
            </div>
            {isLinked && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-text-secondary">Mirror to GitHub</span>
                <Switch
                  checked={status?.mirrorEnabled ?? false}
                  disabled
                />
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-1">
            {isLinked && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSyncing}
                  onClick={() => syncMutation.mutate()}
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span className="ml-1 text-xs">Sync</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSyncing}
                  onClick={() => incrementalMutation.mutate()}
                >
                  {incrementalMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  )}
                  <span className="ml-1 text-xs">Incremental</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Incremental sync result */}
        {incrementalMutation.isSuccess && incrementalMutation.data && (
          <div className="mt-3 rounded-[var(--radius-sm)] bg-success/5 border border-success/20 p-2">
            <p className="text-xs text-success font-medium">
              {incrementalMutation.data.success ? 'Sync complete' : 'Sync finished with errors'}
            </p>
            {incrementalMutation.data.syncedResources.length > 0 && (
              <p className="text-[10px] text-text-secondary mt-0.5">
                Synced: {incrementalMutation.data.syncedResources.join(', ')}
              </p>
            )}
            {incrementalMutation.data.errors.length > 0 && (
              <p className="text-[10px] text-destructive mt-0.5">
                Errors: {incrementalMutation.data.errors.join('; ')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
