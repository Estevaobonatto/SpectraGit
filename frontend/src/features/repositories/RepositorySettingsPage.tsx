import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Settings,
  Trash2,
  Archive,
  Globe,
  Tag,
  X,
  Plus,
  GitBranch,
  Shield,
  ShieldCheck,
  Webhook as WebhookIcon,
  ArrowRightLeft,
  ToggleLeft,
  GitMerge,
  Eye,
  EyeOff,
  Pencil,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  useRepository,
  useUpdateRepository,
  useDeleteRepository,
  useBranchProtection,
  useUpdateBranchProtection,
  useRemoveBranchProtection,
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useTransferRepository,
} from '@/hooks/useRepositories';
import { useBranches } from '@/hooks/useBranches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'motion/react';
import type { Branch, Webhook } from '@/types';
import { usePrRiskConfig, useUpdatePrRiskConfig } from '@/hooks/usePullRequests';

// ─── Settings Navigation ─────────────────────────────────────

type SettingsTab = 'general' | 'features' | 'branches' | 'webhooks' | 'pull-requests' | 'danger';

const TABS: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'features', label: 'Features', icon: ToggleLeft },
  { id: 'branches', label: 'Branches', icon: GitBranch },
  { id: 'webhooks', label: 'Webhooks', icon: WebhookIcon },
  { id: 'pull-requests', label: 'Pull Requests', icon: GitMerge },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

// ─── Pull Requests Tab ───────────────────────────────────────

function PullRequestsTab({ owner, repo }: { owner: string; repo: string }) {
  const { data: configData } = usePrRiskConfig(owner, repo);
  const updateConfig = useUpdatePrRiskConfig(owner, repo);

  const config = (configData as { maxFiles?: number; maxLines?: number; criticalPaths?: string[] } | undefined);
  const [maxFiles, setMaxFiles] = useState(String(config?.maxFiles ?? 50));
  const [maxLines, setMaxLines] = useState(String(config?.maxLines ?? 500));
  const [criticalPaths, setCriticalPaths] = useState((config?.criticalPaths ?? []).join(', '));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateConfig.mutate({
      maxFiles: Number(maxFiles) || 50,
      maxLines: Number(maxLines) || 500,
      criticalPaths: criticalPaths.split(',').map(s => s.trim()).filter(Boolean),
    }, {
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500); },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">PR Risk Configuration</h2>
        <p className="mt-1 text-sm text-text-tertiary">
          Configure thresholds used to compute the risk level badge on pull requests.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Thresholds</CardTitle>
          <CardDescription>
            PRs exceeding these limits receive a higher risk score.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="maxFiles">Max files (MEDIUM threshold)</Label>
              <Input
                id="maxFiles"
                type="number"
                min={1}
                value={maxFiles}
                onChange={e => setMaxFiles(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-text-tertiary">PRs touching more files get elevated risk.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxLines">Max lines changed (HIGH threshold)</Label>
              <Input
                id="maxLines"
                type="number"
                min={1}
                value={maxLines}
                onChange={e => setMaxLines(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-text-tertiary">PRs changing more lines get HIGH or CRITICAL risk.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="criticalPaths">Critical paths (comma-separated)</Label>
            <Input
              id="criticalPaths"
              value={criticalPaths}
              onChange={e => setCriticalPaths(e.target.value)}
              placeholder="e.g. src/auth, prisma/schema.prisma, .env"
              className="w-full font-mono text-sm"
            />
            <p className="text-xs text-text-tertiary">
              PRs touching any of these paths automatically receive CRITICAL risk.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button size="sm" onClick={handleSave} disabled={updateConfig.isPending} className="gap-1.5">
              <Check className="h-3.5 w-3.5" />
              {updateConfig.isPending ? 'Saving...' : 'Save configuration'}
            </Button>
            {saved && (
              <span className="text-xs text-success flex items-center gap-1">
                <Check className="h-3 w-3" />Saved
              </span>
            )}
          </div>

          {updateConfig.isError && (
            <Alert variant="error">Failed to save configuration.</Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── General Tab ─────────────────────────────────────────────

function GeneralTab({ owner, repo }: { owner: string; repo: string }) {
  const { data: repository } = useRepository(owner, repo);
  const updateMutation = useUpdateRepository(owner, repo);

  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [topicInput, setTopicInput] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (repository && !initialized) {
      setDescription(repository.description ?? '');
      setWebsite(repository.website ?? '');
      setDefaultBranch(repository.defaultBranch ?? 'main');
      setVisibility(repository.visibility as 'PUBLIC' | 'PRIVATE');
      setTopics(repository.topics ?? []);
      setInitialized(true);
    }
  }, [repository, initialized]);

  const handleAddTopic = () => {
    const cleaned = topicInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (cleaned && !topics.includes(cleaned) && topics.length < 20) {
      setTopics([...topics, cleaned]);
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter((t) => t !== topic));
  };

  const handleSave = () => {
    setSaveError(null);
    setSaveSuccess(false);
    updateMutation.mutate(
      { description, website: website || undefined, defaultBranch, visibility, topics },
      {
        onSuccess: () => setSaveSuccess(true),
        onError: (err) => setSaveError((err as Error)?.message ?? 'Failed to save settings'),
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Repository Name & Description */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Manage basic info about your repository</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of this repository"
              maxLength={500}
            />
            <p className="text-xs text-text-tertiary">{description.length}/500</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">
              <Globe className="inline h-3.5 w-3.5 mr-1" />
              Website
            </Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label>Topics</Label>
            <p className="text-xs text-text-tertiary">
              Add topics to categorize your repository and help people find it. Up to 20 topics.
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {topic}
                  <button onClick={() => handleRemoveTopic(topic)} className="ml-0.5 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Add a topic..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                disabled={topics.length >= 20}
              />
              <Button variant="outline" size="sm" onClick={handleAddTopic} disabled={topics.length >= 20 || !topicInput.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultBranch">Default Branch</Label>
            <Input
              id="defaultBranch"
              value={defaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
              placeholder="main"
            />
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <div className="flex gap-3">
              <Button
                variant={visibility === 'PUBLIC' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVisibility('PUBLIC')}
                className="gap-1.5"
              >
                <Eye className="h-4 w-4" />
                Public
              </Button>
              <Button
                variant={visibility === 'PRIVATE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVisibility('PRIVATE')}
                className="gap-1.5"
              >
                <EyeOff className="h-4 w-4" />
                Private
              </Button>
            </div>
            <p className="text-xs text-text-tertiary">
              {visibility === 'PUBLIC'
                ? 'Anyone on the internet can see this repository.'
                : 'Only you and collaborators can see this repository.'}
            </p>
          </div>

          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
          {saveError && <Alert variant="error">{saveError}</Alert>}
          {saveSuccess && <Alert variant="success">Settings saved successfully.</Alert>}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Features Tab ────────────────────────────────────────────

function FeaturesTab({ owner, repo }: { owner: string; repo: string }) {
  const { data: repository } = useRepository(owner, repo);
  const updateMutation = useUpdateRepository(owner, repo);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!repository) return null;

  const handleToggle = (field: string, value: boolean) => {
    setSaveSuccess(false);
    updateMutation.mutate(
      { [field]: value },
      { onSuccess: () => setSaveSuccess(true) },
    );
  };

  return (
    <div className="space-y-6">
      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Enable or disable repository features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-md border border-border p-4">
            <div>
              <p className="font-medium text-sm">Issues</p>
              <p className="text-xs text-text-tertiary">Track bugs, feature requests, and tasks</p>
            </div>
            <Switch
              checked={repository.hasIssuesEnabled}
              onCheckedChange={(v) => handleToggle('hasIssuesEnabled', v)}
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-4">
            <div>
              <p className="font-medium text-sm">Pull Requests</p>
              <p className="text-xs text-text-tertiary">Propose, review, and merge code changes</p>
            </div>
            <Switch
              checked={repository.hasPRsEnabled}
              onCheckedChange={(v) => handleToggle('hasPRsEnabled', v)}
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-4">
            <div>
              <p className="font-medium text-sm">Wiki</p>
              <p className="text-xs text-text-tertiary">Host documentation alongside the repository</p>
            </div>
            <Switch
              checked={repository.hasWikiEnabled}
              onCheckedChange={(v) => handleToggle('hasWikiEnabled', v)}
              disabled={updateMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Merge Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Pull Request Merge Settings
          </CardTitle>
          <CardDescription>Control how pull requests are merged</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-md border border-border p-4">
            <div>
              <p className="font-medium text-sm">Allow merge commits</p>
              <p className="text-xs text-text-tertiary">Add all commits from head branch as merge commit</p>
            </div>
            <Switch
              checked={repository.allowMergeCommit}
              onCheckedChange={(v) => handleToggle('allowMergeCommit', v)}
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-4">
            <div>
              <p className="font-medium text-sm">Allow squash merging</p>
              <p className="text-xs text-text-tertiary">Combine commits into a single commit</p>
            </div>
            <Switch
              checked={repository.allowSquashMerge}
              onCheckedChange={(v) => handleToggle('allowSquashMerge', v)}
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-4">
            <div>
              <p className="font-medium text-sm">Allow rebase merging</p>
              <p className="text-xs text-text-tertiary">Rebase and fast-forward the head branch</p>
            </div>
            <Switch
              checked={repository.allowRebaseMerge}
              onCheckedChange={(v) => handleToggle('allowRebaseMerge', v)}
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-4">
            <div>
              <p className="font-medium text-sm">Auto-delete head branches</p>
              <p className="text-xs text-text-tertiary">Automatically delete head branches after merging</p>
            </div>
            <Switch
              checked={repository.autoDeleteBranch}
              onCheckedChange={(v) => handleToggle('autoDeleteBranch', v)}
              disabled={updateMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {saveSuccess && <Alert variant="success">Feature settings updated.</Alert>}
    </div>
  );
}

// ─── Branch Protection Tab ───────────────────────────────────

function BranchProtectionEditor({
  owner,
  repo,
  branch,
  onClose,
}: {
  owner: string;
  repo: string;
  branch: Branch;
  onClose: () => void;
}) {
  const { data: protection, isLoading } = useBranchProtection(owner, repo, branch.name);
  const updateMutation = useUpdateBranchProtection(owner, repo);
  const removeMutation = useRemoveBranchProtection(owner, repo);

  const [rules, setRules] = useState({
    requirePullRequest: true,
    requiredReviewCount: 1,
    dismissStaleReviews: false,
    requireCodeOwnerReview: false,
    restrictPushes: true,
    allowForcePushes: false,
    allowDeletions: false,
    requireLinearHistory: false,
    lockBranch: false,
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (protection?.protection && !initialized) {
      setRules({
        requirePullRequest: protection.protection.requirePullRequest,
        requiredReviewCount: protection.protection.requiredReviewCount,
        dismissStaleReviews: protection.protection.dismissStaleReviews,
        requireCodeOwnerReview: protection.protection.requireCodeOwnerReview,
        restrictPushes: protection.protection.restrictPushes,
        allowForcePushes: protection.protection.allowForcePushes,
        allowDeletions: protection.protection.allowDeletions,
        requireLinearHistory: protection.protection.requireLinearHistory,
        lockBranch: protection.protection.lockBranch,
      });
      setInitialized(true);
    }
  }, [protection, initialized]);

  const handleSave = () => {
    updateMutation.mutate(
      { branch: branch.name, data: rules },
      { onSuccess: () => onClose() },
    );
  };

  const handleRemove = () => {
    removeMutation.mutate(branch.name, { onSuccess: () => onClose() });
  };

  if (isLoading) return <PageLoader />;

  return (
    <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Branch Protection: {branch.name}
        </DialogTitle>
        <DialogDescription>
          Configure protection rules for the <strong>{branch.name}</strong> branch
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="font-medium text-sm">Require pull request before merging</p>
            <p className="text-xs text-text-tertiary">All commits must be made via PR</p>
          </div>
          <Switch
            checked={rules.requirePullRequest}
            onCheckedChange={(v) => setRules({ ...rules, requirePullRequest: v })}
          />
        </div>

        {rules.requirePullRequest && (
          <div className="ml-4 space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="font-medium text-sm">Required approving reviews</p>
              </div>
              <Select
                value={String(rules.requiredReviewCount)}
                onValueChange={(v) => setRules({ ...rules, requiredReviewCount: parseInt(v) })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="font-medium text-sm">Dismiss stale reviews</p>
                <p className="text-xs text-text-tertiary">Dismiss approvals when new commits are pushed</p>
              </div>
              <Switch
                checked={rules.dismissStaleReviews}
                onCheckedChange={(v) => setRules({ ...rules, dismissStaleReviews: v })}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="font-medium text-sm">Require code owner review</p>
                <p className="text-xs text-text-tertiary">Require review from CODEOWNERS</p>
              </div>
              <Switch
                checked={rules.requireCodeOwnerReview}
                onCheckedChange={(v) => setRules({ ...rules, requireCodeOwnerReview: v })}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="font-medium text-sm">Restrict pushes</p>
            <p className="text-xs text-text-tertiary">Only allow admins to push</p>
          </div>
          <Switch
            checked={rules.restrictPushes}
            onCheckedChange={(v) => setRules({ ...rules, restrictPushes: v })}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="font-medium text-sm">Allow force pushes</p>
            <p className="text-xs text-text-tertiary text-amber-600">⚠ Can overwrite history</p>
          </div>
          <Switch
            checked={rules.allowForcePushes}
            onCheckedChange={(v) => setRules({ ...rules, allowForcePushes: v })}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="font-medium text-sm">Allow deletions</p>
            <p className="text-xs text-text-tertiary text-amber-600">⚠ Allow branch to be deleted</p>
          </div>
          <Switch
            checked={rules.allowDeletions}
            onCheckedChange={(v) => setRules({ ...rules, allowDeletions: v })}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="font-medium text-sm">Require linear history</p>
            <p className="text-xs text-text-tertiary">Prevent merge commits</p>
          </div>
          <Switch
            checked={rules.requireLinearHistory}
            onCheckedChange={(v) => setRules({ ...rules, requireLinearHistory: v })}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="font-medium text-sm">Lock branch</p>
            <p className="text-xs text-text-tertiary">Make the branch read-only</p>
          </div>
          <Switch
            checked={rules.lockBranch}
            onCheckedChange={(v) => setRules({ ...rules, lockBranch: v })}
          />
        </div>
      </div>

      <DialogFooter className="gap-2">
        {branch.isProtected && (
          <Button
            variant="outline"
            className="text-red-500 border-red-500/30 hover:bg-red-50"
            onClick={handleRemove}
            disabled={removeMutation.isPending}
          >
            Remove Protection
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving…' : 'Save Rules'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function BranchesTab({ owner, repo }: { owner: string; repo: string }) {
  const { data: branches, isLoading } = useBranches(owner, repo);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Branch Protection Rules
          </CardTitle>
          <CardDescription>
            Protect important branches by enforcing review requirements and restricting pushes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoader />
          ) : !branches?.length ? (
            <p className="text-sm text-text-tertiary text-center py-6">No branches found</p>
          ) : (
            <div className="space-y-2">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="flex items-center justify-between rounded-md border border-border p-3 transition-colors hover:bg-gray-50/50"
                >
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-4 w-4 text-text-tertiary" />
                    <div>
                      <p className="font-medium text-sm font-mono">{branch.name}</p>
                      {branch.headCommitSha && (
                        <p className="text-xs text-text-tertiary font-mono">{branch.headCommitSha.slice(0, 7)}</p>
                      )}
                    </div>
                    {branch.isProtected && (
                      <Badge variant="warning" className="gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Protected
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditBranch(branch)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    {branch.isProtected ? 'Edit' : 'Protect'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editBranch} onOpenChange={(open) => !open && setEditBranch(null)}>
        {editBranch && (
          <BranchProtectionEditor
            owner={owner}
            repo={repo}
            branch={editBranch}
            onClose={() => setEditBranch(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

// ─── Webhooks Tab ────────────────────────────────────────────

const WEBHOOK_EVENTS = [
  { value: 'push', label: 'Push', description: 'Branch pushed to' },
  { value: 'pull_request', label: 'Pull Request', description: 'PR opened, closed, or merged' },
  { value: 'issues', label: 'Issues', description: 'Issue opened or closed' },
  { value: 'issue_comment', label: 'Comments', description: 'Comment on issue or PR' },
  { value: 'create', label: 'Create', description: 'Branch or tag created' },
  { value: 'delete', label: 'Delete', description: 'Branch or tag deleted' },
  { value: 'release', label: 'Release', description: 'Release created or edited' },
  { value: 'fork', label: 'Fork', description: 'Repository forked' },
  { value: 'watch', label: 'Watch', description: 'Repository watched' },
];

function WebhooksTab({ owner, repo }: { owner: string; repo: string }) {
  const { data: webhooks, isLoading } = useWebhooks(owner, repo);
  const createMutation = useCreateWebhook(owner, repo);
  const updateMutation = useUpdateWebhook(owner, repo);
  const deleteMutation = useDeleteWebhook(owner, repo);

  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>(['push']);
  const [addError, setAddError] = useState<string | null>(null);

  const resetForm = () => {
    setNewUrl('');
    setNewSecret('');
    setNewEvents(['push']);
    setAddError(null);
    setShowAdd(false);
  };

  const handleCreate = () => {
    setAddError(null);
    createMutation.mutate(
      { url: newUrl, secret: newSecret || undefined, events: newEvents },
      {
        onSuccess: () => resetForm(),
        onError: (err) => setAddError((err as Error)?.message ?? 'Failed to create webhook'),
      },
    );
  };

  const toggleEvent = (event: string) => {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  const handleToggleActive = (webhook: Webhook) => {
    updateMutation.mutate({ webhookId: webhook.id, data: { isActive: !webhook.isActive } });
  };

  const handleDeleteWebhook = (webhookId: string) => {
    deleteMutation.mutate(webhookId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <WebhookIcon className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Receive HTTP callbacks when events happen in this repository
              </CardDescription>
            </div>
            {!showAdd && (
              <Button onClick={() => setShowAdd(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Webhook
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Webhook Form */}
          {showAdd && (
            <div className="rounded-md border border-primary-200 bg-primary-50/30 p-4 space-y-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Payload URL</Label>
                <Input
                  id="webhook-url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/webhooks"
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Secret (optional)</Label>
                <Input
                  id="webhook-secret"
                  value={newSecret}
                  onChange={(e) => setNewSecret(e.target.value)}
                  placeholder="Secret token for payload verification"
                  type="password"
                />
              </div>

              <div className="space-y-2">
                <Label>Events</Label>
                <div className="grid grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <button
                      key={event.value}
                      onClick={() => toggleEvent(event.value)}
                      className={`flex items-start gap-2 rounded-md border p-2.5 text-left text-sm transition-all ${
                        newEvents.includes(event.value)
                          ? 'border-primary-500 bg-primary-50/50'
                          : 'border-border hover:border-gray-300'
                      }`}
                    >
                      <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        newEvents.includes(event.value)
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}>
                        {newEvents.includes(event.value) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-xs">{event.label}</p>
                        <p className="text-xs text-text-tertiary">{event.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {addError && <Alert variant="error">{addError}</Alert>}

              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!newUrl || createMutation.isPending} size="sm">
                  {createMutation.isPending ? 'Creating…' : 'Create Webhook'}
                </Button>
                <Button variant="outline" size="sm" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Webhook List */}
          {isLoading ? (
            <PageLoader />
          ) : !webhooks?.length && !showAdd ? (
            <p className="text-sm text-text-tertiary text-center py-6">No webhooks configured</p>
          ) : (
            <div className="space-y-2">
              {webhooks?.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate font-mono">{webhook.url}</p>
                      {webhook.isActive ? (
                        <Badge variant="success" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                    {webhook.lastStatus && (
                      <p className={`text-xs mt-1 ${webhook.lastStatus < 400 ? 'text-green-600' : 'text-red-500'}`}>
                        Last response: {webhook.lastStatus}
                        {webhook.lastCalledAt && ` at ${new Date(webhook.lastCalledAt).toLocaleString()}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Switch
                      checked={webhook.isActive}
                      onCheckedChange={() => handleToggleActive(webhook)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Danger Zone Tab ─────────────────────────────────────────

function DangerZoneTab({ owner, repo }: { owner: string; repo: string }) {
  const navigate = useNavigate();
  const { data: repository } = useRepository(owner, repo);
  const updateMutation = useUpdateRepository(owner, repo);
  const deleteMutation = useDeleteRepository(owner, repo);
  const transferMutation = useTransferRepository(owner, repo);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferOwner, setTransferOwner] = useState('');
  const [transferName, setTransferName] = useState('');
  const [transferConfirm, setTransferConfirm] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);

  if (!repository) return null;

  const handleArchiveToggle = () => {
    updateMutation.mutate({ isArchived: !repository.isArchived });
  };

  const handleDelete = () => {
    if (deleteConfirm !== `${owner}/${repo}`) return;
    setDeleteError(null);
    deleteMutation.mutate(undefined, {
      onSuccess: () => navigate('/'),
      onError: (err) => setDeleteError((err as Error)?.message ?? 'Failed to delete repository'),
    });
  };

  const handleTransfer = () => {
    if (transferConfirm !== `${owner}/${repo}`) return;
    setTransferError(null);
    transferMutation.mutate(
      { newOwner: transferOwner, newName: transferName || undefined },
      {
        onSuccess: (result) => {
          const newOwnerName = result.ownerUser?.username || result.ownerOrg?.name;
          navigate(`/${newOwnerName}/${result.slug}/settings`);
        },
        onError: (err) => setTransferError((err as Error)?.message ?? 'Failed to transfer'),
      },
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Archive */}
          <div className="flex items-center justify-between rounded-md border border-red-500/20 p-4">
            <div>
              <p className="font-medium">Archive this repository</p>
              <p className="text-sm text-text-tertiary">
                {repository.isArchived
                  ? 'This repository is archived and read-only.'
                  : 'Mark as read-only. Can be unarchived later.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
              onClick={handleArchiveToggle}
              disabled={updateMutation.isPending}
            >
              <Archive className="mr-1 h-4 w-4" />
              {repository.isArchived ? 'Unarchive' : 'Archive'}
            </Button>
          </div>

          {/* Transfer */}
          <div className="rounded-md border border-red-500/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Transfer ownership</p>
                <p className="text-sm text-text-tertiary">Transfer to another user or organization</p>
              </div>
              {!showTransfer && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                  onClick={() => setShowTransfer(true)}
                >
                  <ArrowRightLeft className="mr-1 h-4 w-4" />
                  Transfer
                </Button>
              )}
            </div>

            {showTransfer && (
              <div className="space-y-3 pt-2 border-t border-red-500/10">
                <div className="space-y-2">
                  <Label htmlFor="transfer-owner">New owner</Label>
                  <Input
                    id="transfer-owner"
                    value={transferOwner}
                    onChange={(e) => setTransferOwner(e.target.value)}
                    placeholder="Username or organization name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transfer-name">New repository name (optional)</Label>
                  <Input
                    id="transfer-name"
                    value={transferName}
                    onChange={(e) => setTransferName(e.target.value)}
                    placeholder={repo}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-text-tertiary">
                    Type <strong>{owner}/{repo}</strong> to confirm
                  </p>
                  <Input
                    value={transferConfirm}
                    onChange={(e) => setTransferConfirm(e.target.value)}
                    placeholder={`${owner}/${repo}`}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={
                      transferConfirm !== `${owner}/${repo}` ||
                      !transferOwner ||
                      transferMutation.isPending
                    }
                    onClick={handleTransfer}
                  >
                    {transferMutation.isPending ? 'Transferring…' : 'Transfer Repository'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowTransfer(false)}>
                    Cancel
                  </Button>
                </div>
                {transferError && <Alert variant="error">{transferError}</Alert>}
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="rounded-md border border-red-500/20 p-4 space-y-3">
            <p className="font-medium text-red-500">Delete this repository</p>
            <p className="text-sm text-text-tertiary">
              This action is <strong>irreversible</strong>. All data including issues, pull requests,
              branches, and commits will be permanently deleted. Type{' '}
              <strong>{owner}/{repo}</strong> to confirm.
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={`${owner}/${repo}`}
            />
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteConfirm !== `${owner}/${repo}` || deleteMutation.isPending}
              onClick={handleDelete}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Repository'}
            </Button>
            {deleteError && <Alert variant="error">{deleteError}</Alert>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Settings Page ──────────────────────────────────────

export default function RepositorySettingsPage() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { data: repository, isLoading } = useRepository(owner!, repo!);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  if (isLoading) return <PageLoader />;

  if (!repository) {
    return (
      <Alert variant="error" title="Repository not found">
        The repository <strong>{owner}/{repo}</strong> does not exist.
      </Alert>
    );
  }

  return (
    <motion.div
      className="mx-auto max-w-4xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary mb-6">
        <Settings className="h-6 w-6" />
        Settings
      </h1>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <nav className="w-48 flex-shrink-0">
          <ul className="space-y-1 sticky top-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : tab.id === 'danger'
                          ? 'text-red-500 hover:bg-red-50 hover:text-red-600'
                          : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && <GeneralTab owner={owner!} repo={repo!} />}
          {activeTab === 'features' && <FeaturesTab owner={owner!} repo={repo!} />}
          {activeTab === 'branches' && <BranchesTab owner={owner!} repo={repo!} />}
          {activeTab === 'webhooks' && <WebhooksTab owner={owner!} repo={repo!} />}
          {activeTab === 'pull-requests' && <PullRequestsTab owner={owner!} repo={repo!} />}
          {activeTab === 'danger' && <DangerZoneTab owner={owner!} repo={repo!} />}
        </div>
      </div>
    </motion.div>
  );
}
