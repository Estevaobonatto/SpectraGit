import { useState } from 'react';
import { ExternalLink, RefreshCw, Download, CheckCircle2 } from 'lucide-react';
import { integrationsService } from '@/services/integrations.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageLoader, Spinner } from '@/components/ui/spinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { GitHubRepo } from '@/types';
import { motion } from 'motion/react';

export default function GitHubIntegrationPage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['github-profile'],
    queryFn: () => integrationsService.getGitHubProfile(),
    retry: false,
  });

  const { data: repos, isLoading: reposLoading } = useQuery({
    queryKey: ['github-repos'],
    queryFn: () => integrationsService.listGitHubRepos(),
    enabled: !!profile,
  });

  const importMutation = useMutation({
    mutationFn: (repoFullName: string) => integrationsService.importRepo(repoFullName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repositories'] }),
  });

  const syncMutation = useMutation({
    mutationFn: () => integrationsService.syncRepo('all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['github-repos'] }),
  });

  const [importedRepos, setImportedRepos] = useState<Set<string>>(new Set());

  const handleImport = (repo: GitHubRepo) => {
    importMutation.mutate(repo.fullName, {
      onSuccess: () => setImportedRepos((prev) => new Set(prev).add(repo.fullName)),
    });
  };

  if (profileLoading) return <PageLoader />;

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Connect GitHub
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-secondary">
              Connect your GitHub account to import repositories and sync your profile.
            </p>
            <Button asChild>
              <a href="/api/v1/integrations/github/connect">
                <ExternalLink className="h-4 w-4" />
                Connect GitHub account
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <ExternalLink className="h-6 w-6" />
          GitHub Integration
        </h1>
        <Button variant="outline" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
          <RefreshCw className={syncMutation.isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Sync
        </Button>
      </div>

      {/* Connected account */}
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <span className="text-sm text-text-primary">
            Connected as <span className="font-semibold">{String((profile as Record<string, unknown>).username ?? '')}</span>
          </span>
          <Badge variant="success">Connected</Badge>
        </CardContent>
      </Card>

      <Separator />

      {/* Importable repos */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Your GitHub Repositories</h2>
        {reposLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !repos || repos.length === 0 ? (
          <p className="text-sm text-text-tertiary">No repositories found on your GitHub account.</p>
        ) : (
          <div className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
            {repos.map((r: GitHubRepo, index: number) => (
              <motion.div
                key={r.fullName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-text-primary">{r.fullName}</p>
                  {r.description && <p className="text-xs text-text-secondary line-clamp-1">{r.description}</p>}
                  <div className="mt-1 flex items-center gap-2 text-xs text-text-tertiary">
                    {r.language && <span>{r.language}</span>}
                    <Badge variant="secondary" className="text-[10px]">{r.private ? 'Private' : 'Public'}</Badge>
                  </div>
                </div>
                {importedRepos.has(r.fullName) ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Imported
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleImport(r)}
                    disabled={importMutation.isPending}
                  >
                    <Download className="h-4 w-4" />
                    Import
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
