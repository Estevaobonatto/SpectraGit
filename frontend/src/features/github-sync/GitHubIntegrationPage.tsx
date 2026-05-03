import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
  Building2,
  Activity,
  Webhook,
  GitBranch,
} from 'lucide-react';
import { integrationsService } from '@/services/integrations.service';
import { repositoriesService } from '@/services/repositories.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageLoader, Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { GitHubRepo, ImportJobResponse, Repository } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import ImportProgressModal from './ImportProgressModal';
import RateLimitCard from './components/RateLimitCard';
import WebhookEventsList from './components/WebhookEventsList';
import SyncStatusCard from './components/SyncStatusCard';

type RepoImportState = 'importing' | 'success' | 'error';
type VisibilityFilter = 'all' | 'public' | 'private';

interface ActiveImport {
  jobId: string;
  repositorySlug: string;
  ownerUsername: string;
  repoFullName: string;
}

export default function GitHubIntegrationPage() {
  const navigate = useNavigate();
  const [repoStates, setRepoStates] = useState<Record<string, RepoImportState>>({});
  const [repoErrors, setRepoErrors] = useState<Record<string, string>>({});
  const [activeImport, setActiveImport] = useState<ActiveImport | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [activeTab, setActiveTab] = useState('repos');

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['github-profile'],
    queryFn: () => integrationsService.getGitHubProfile(),
    retry: false,
  });

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['github-permissions'],
    queryFn: () => integrationsService.checkPermissions(),
    enabled: !!profile,
    retry: false,
  });

  const { data: repos, isLoading: reposLoading, refetch: refetchRepos, isFetching: isSyncingRepos } = useQuery({
    queryKey: ['github-repos'],
    queryFn: () => integrationsService.listGitHubRepos(),
    enabled: !!profile,
  });

  const { data: localRepos } = useQuery({
    queryKey: ['repositories'],
    queryFn: () => repositoriesService.list({ scope: 'mine' }),
    enabled: !!profile,
  });

  // Map of fullName -> local repo for quick lookup
  const linkedRepos = new Map<string, Repository>();
  localRepos?.data.forEach((r: Repository) => {
    if (r.githubRepoFullName) {
      linkedRepos.set(r.githubRepoFullName, r);
    }
  });

  const importMutation = useMutation({
    mutationFn: (repoFullName: string) => integrationsService.importRepo(repoFullName),
    onSuccess: (data: ImportJobResponse, repoFullName: string) => {
      if (data.alreadyImported) {
        setRepoStates((s) => ({ ...s, [repoFullName]: 'success' }));
        navigate(`/${data.ownerUsername}/${data.repositorySlug}`);
        return;
      }

      if (data.jobId) {
        setRepoStates((s) => ({ ...s, [repoFullName]: 'importing' }));
        setActiveImport({
          jobId: data.jobId,
          repositorySlug: data.repositorySlug,
          ownerUsername: data.ownerUsername,
          repoFullName,
        });
      }
    },
    onError: (err: unknown, repoFullName: string) => {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ??
        (err as { message?: string })?.message ??
        'Import failed';
      setRepoStates((s) => ({ ...s, [repoFullName]: 'error' }));
      setRepoErrors((e) => ({ ...e, [repoFullName]: message }));
    },
  });

  const handleImport = (repo: GitHubRepo) => {
    setRepoStates((s) => ({ ...s, [repo.fullName]: 'importing' }));
    setRepoErrors((e) => { const n = { ...e }; delete n[repo.fullName]; return n; });
    importMutation.mutate(repo.fullName);
  };

  const handleImportModalClose = () => {
    if (activeImport) {
      setRepoStates((s) => ({ ...s, [activeImport.repoFullName]: 'error' }));
    }
    setActiveImport(null);
  };

  const handleImportRetry = () => {
    if (activeImport) {
      setActiveImport(null);
      const repo = repos?.find((r: GitHubRepo) => r.fullName === activeImport.repoFullName);
      if (repo) handleImport(repo);
    }
  };

  const filteredRepos = (repos ?? []).filter((r: GitHubRepo) => {
    if (visibilityFilter === 'public') return !r.private;
    if (visibilityFilter === 'private') return r.private;
    return true;
  });

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
              Connect your GitHub account to import repositories, enable two-way sync, and mirror changes back to GitHub.
            </p>
            <Button asChild>
              <a href="/api/v1/auth/oauth/github">
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <ExternalLink className="h-6 w-6" />
          GitHub Integration
        </h1>
      </div>

      {/* Connected account */}
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <span className="text-sm text-text-primary">
            Connected as <span className="font-semibold">{String((profile as Record<string, unknown>).login ?? '')}</span>
          </span>
          <Badge variant="success">Connected</Badge>
        </CardContent>
      </Card>

      {/* Re-auth banner when missing scopes */}
      {!permissionsLoading && permissions && !permissions.hasRepo && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">Additional permissions required</p>
              <p className="text-xs text-text-secondary">
                Your GitHub connection is missing the permissions needed to access private repositories
                {!permissions.hasReadOrg && ' and organization repos'}. Please reconnect to grant the required scopes.
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <a href="/api/v1/auth/oauth/github">Reconnect GitHub</a>
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="repos" className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            Repositories
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Health & Limits
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-1.5">
            <Webhook className="h-3.5 w-3.5" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Repositories Tab */}
        <TabsContent value="repos" className="space-y-6">
          {/* Linked Repositories - Sync Status */}
          {localRepos && localRepos.data.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">Linked Repositories</h2>
                <Button variant="outline" size="sm" onClick={() => refetchRepos()} disabled={isSyncingRepos}>
                  <RefreshCw className={isSyncingRepos ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
                  <span className="ml-1 text-xs">Refresh</span>
                </Button>
              </div>
              <div className="space-y-2">
                {localRepos.data
                  .filter((r: Repository) => !!r.githubRepoFullName)
                  .map((repo: Repository) => (
                    <SyncStatusCard
                      key={repo.id}
                      repo={{
                        id: 0,
                        fullName: repo.githubRepoFullName!,
                        name: repo.name,
                        description: repo.description,
                        private: repo.visibility === 'PRIVATE',
                        language: repo.language ?? null,
                        stargazersCount: 0,
                        forksCount: 0,
                        updatedAt: repo.updatedAt,
                        ownerLogin: '',
                        ownerType: 'User',
                      }}
                    />
                  ))}
              </div>
              <Separator />
            </div>
          )}

          {/* Importable repos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Import from GitHub</h2>
              <div className="flex items-center gap-2">
                {repos && repos.length > 0 && (
                  <span className="text-xs text-text-tertiary">{filteredRepos.length} of {repos.length} repositories</span>
                )}
              </div>
            </div>

            {/* Visibility filter tabs */}
            {repos && repos.length > 0 && (
              <div className="flex gap-1 rounded-[var(--radius-md)] border border-border p-1 w-fit">
                {(['all', 'public', 'private'] as VisibilityFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setVisibilityFilter(f)}
                    className={`rounded-[var(--radius-sm)] px-3 py-1 text-xs font-medium transition-colors ${
                      visibilityFilter === f
                        ? 'bg-bg-secondary text-text-primary'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'public' ? 'Public' : 'Private'}
                  </button>
                ))}
              </div>
            )}

            {reposLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : !repos || repos.length === 0 ? (
              <p className="text-sm text-text-tertiary">No repositories found on your GitHub account.</p>
            ) : filteredRepos.length === 0 ? (
              <p className="text-sm text-text-tertiary">No {visibilityFilter} repositories found.</p>
            ) : (
              <div className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
                {filteredRepos.map((r: GitHubRepo, index: number) => {
                  const state = repoStates[r.fullName];
                  const error = repoErrors[r.fullName];
                  const isLinked = linkedRepos.has(r.fullName);
                  return (
                    <motion.div
                      key={r.fullName}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      className="flex items-center gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {r.ownerType === 'Organization' && (
                            <Building2 className="h-3.5 w-3.5 text-text-tertiary" />
                          )}
                          <p className="font-medium text-sm text-text-primary">{r.fullName}</p>
                          {isLinked && (
                            <Badge variant="success" className="text-[10px]">Linked</Badge>
                          )}
                        </div>
                        {r.description && <p className="text-xs text-text-secondary line-clamp-1">{r.description}</p>}
                        <div className="mt-1 flex items-center gap-2 text-xs text-text-tertiary">
                          {r.language && <span>{r.language}</span>}
                          <Badge variant="secondary" className="text-[10px]">{r.private ? 'Private' : 'Public'}</Badge>
                        </div>
                        <AnimatePresence>
                          {state === 'error' && error && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-1 flex items-center gap-1 text-xs text-destructive">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              {error}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="shrink-0">
                        {state === 'success' || isLinked ? (
                          <Badge variant="success" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {isLinked ? 'Linked' : 'Imported'}
                          </Badge>
                        ) : state === 'importing' ? (
                          <Button size="sm" variant="outline" disabled>
                            <Spinner size="sm" />
                            Importing...
                          </Button>
                        ) : state === 'error' ? (
                          <Button size="sm" variant="outline" onClick={() => handleImport(r)}>
                            <RotateCcw className="h-4 w-4" />
                            Retry
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleImport(r)}>
                            <Download className="h-4 w-4" />
                            Import
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <RateLimitCard enabled={activeTab === 'health'} />
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <WebhookEventsList enabled={activeTab === 'webhooks'} />
        </TabsContent>
      </Tabs>

      {/* Import Progress Modal */}
      <ImportProgressModal
        open={!!activeImport}
        jobId={activeImport?.jobId ?? null}
        repositorySlug={activeImport?.repositorySlug ?? ''}
        ownerUsername={activeImport?.ownerUsername ?? ''}
        onClose={handleImportModalClose}
        onRetry={handleImportRetry}
      />
    </div>
  );
}
