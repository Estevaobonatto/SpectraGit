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
  BookOpen,
  Lock,
  Unlock,
  RefreshCw,
  FileCode,
  MessageSquare,
  FlaskConical,
  GitPullRequest,
  ChevronRight,
  Save,
  Copy,
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
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'motion/react';
import type { Branch, Webhook } from '@/types';
import { usePrRiskConfig, useUpdatePrRiskConfig } from '@/hooks/usePullRequests';
import { useWikiSettings, useUpdateWikiSettings } from '@/hooks/useWiki';

// ─── Types ───────────────────────────────────────────────────

type SettingsTab = 'general' | 'features' | 'branches' | 'webhooks' | 'pull-requests' | 'wiki' | 'danger';

interface TabDef {
  id: SettingsTab;
  label: string;
  icon: typeof Settings;
  description: string;
}

const TABS: TabDef[] = [
  { id: 'general', label: 'General', icon: Settings, description: 'Basic info and visibility' },
  { id: 'features', label: 'Features', icon: ToggleLeft, description: 'Features and merge settings' },
  { id: 'branches', label: 'Branches', icon: GitBranch, description: 'Protection rules' },
  { id: 'webhooks', label: 'Webhooks', icon: WebhookIcon, description: 'Event callbacks' },
  { id: 'pull-requests', label: 'Pull Requests', icon: GitMerge, description: 'Risk thresholds' },
  { id: 'wiki', label: 'Wiki', icon: BookOpen, description: 'Documentation settings' },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, description: 'Destructive actions' },
];

// ─── Shared Components ───────────────────────────────────────

function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-text-secondary">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function FeatureToggle({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  disabled,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary-50 text-primary-600">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-text-primary">{title}</p>
            {badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{badge}</Badge>}
          </div>
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      key={String(children?.toString?.())}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
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
  const [copied, setCopied] = useState(false);

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

  const repoUrl = `${window.location.origin}/${owner}/${repo}`;

  return (
    <TabPanel>
      <div className="space-y-6">
        <SettingsSection title="Repository Identity" description="How your repository appears to others">
          <Card>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short description of this repository"
                  maxLength={500}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-text-secondary">Briefly explain what this project does</p>
                  <p className="text-xs text-text-tertiary">{description.length}/500</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium">
                  <Globe className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                  Website
                </Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                />
                <p className="text-xs text-text-secondary">Link to project homepage or documentation</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Topics</Label>
                <p className="text-xs text-text-secondary">
                  Add topics to categorize your repository and help people find it. Up to 20 topics.
                </p>
                <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
                  {topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="gap-1 px-2.5 py-1 text-xs">
                      <Tag className="h-3 w-3" />
                      {topic}
                      <button
                        onClick={() => handleRemoveTopic(topic)}
                        className="ml-0.5 hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {topics.length === 0 && (
                    <span className="text-xs text-text-tertiary italic">No topics added yet</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="Add a topic..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                    disabled={topics.length >= 20}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddTopic}
                    disabled={topics.length >= 20 || !topicInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </SettingsSection>

        <SettingsSection title="Default Branch" description="The default branch for new pull requests and commits">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <GitBranch className="h-5 w-5 text-primary-500 shrink-0" />
                <div className="flex-1">
                  <Label htmlFor="defaultBranch" className="text-sm font-medium">
                    Branch name
                  </Label>
                  <Input
                    id="defaultBranch"
                    value={defaultBranch}
                    onChange={(e) => setDefaultBranch(e.target.value)}
                    placeholder="main"
                    className="mt-1.5 font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </SettingsSection>

        <SettingsSection title="Visibility" description="Control who can see this repository">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setVisibility('PUBLIC')}
                  className={`flex items-center gap-3 rounded-[var(--radius-md)] border p-4 text-left transition-all ${
                    visibility === 'PUBLIC'
                      ? 'border-primary-400 bg-primary-50/60 ring-1 ring-primary-400'
                      : 'border-border hover:border-primary-200 hover:bg-surface-hover'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      visibility === 'PUBLIC' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-text-tertiary'
                    }`}
                  >
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-text-primary">Public</p>
                    <p className="text-xs text-text-secondary mt-0.5">Anyone on the internet can see this repository</p>
                  </div>
                  {visibility === 'PUBLIC' && (
                    <div className="ml-auto">
                      <div className="h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setVisibility('PRIVATE')}
                  className={`flex items-center gap-3 rounded-[var(--radius-md)] border p-4 text-left transition-all ${
                    visibility === 'PRIVATE'
                      ? 'border-primary-400 bg-primary-50/60 ring-1 ring-primary-400'
                      : 'border-border hover:border-primary-200 hover:bg-surface-hover'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      visibility === 'PRIVATE' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-text-tertiary'
                    }`}
                  >
                    <EyeOff className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-text-primary">Private</p>
                    <p className="text-xs text-text-secondary mt-0.5">Only you and collaborators can see this repository</p>
                  </div>
                  {visibility === 'PRIVATE' && (
                    <div className="ml-auto">
                      <div className="h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </SettingsSection>

        <SettingsSection title="Clone URL" description="Direct link to clone this repository">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-[var(--radius-sm)] bg-background px-3 py-2 text-sm font-mono text-text-secondary border border-border truncate">
                  {repoUrl}.git
                </code>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${repoUrl}.git`);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{copied ? 'Copied!' : 'Copy URL'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        </SettingsSection>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-1.5">
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
          {saveSuccess && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <Alert variant="success" className="py-2 px-3">
                Settings saved successfully.
              </Alert>
            </motion.div>
          )}
          {saveError && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <Alert variant="error" className="py-2 px-3">
                {saveError}
              </Alert>
            </motion.div>
          )}
        </div>
      </div>
    </TabPanel>
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
    <TabPanel>
      <div className="space-y-6">
        <SettingsSection title="Repository Features" description="Enable or disable core repository features">
          <div className="grid grid-cols-1 gap-3">
            <FeatureToggle
              icon={MessageSquare}
              title="Issues"
              description="Track bugs, feature requests, and tasks"
              checked={repository.hasIssuesEnabled}
              onChange={(v) => handleToggle('hasIssuesEnabled', v)}
              disabled={updateMutation.isPending}
            />
            <FeatureToggle
              icon={GitPullRequest}
              title="Pull Requests"
              description="Propose, review, and merge code changes"
              checked={repository.hasPRsEnabled}
              onChange={(v) => handleToggle('hasPRsEnabled', v)}
              disabled={updateMutation.isPending}
            />
            <FeatureToggle
              icon={BookOpen}
              title="Wiki"
              description="Host documentation alongside the repository"
              checked={repository.hasWikiEnabled}
              onChange={(v) => handleToggle('hasWikiEnabled', v)}
              disabled={updateMutation.isPending}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Pull Request Merge Settings" description="Control how pull requests are merged">
          <Card>
            <CardContent className="pt-5 space-y-3">
              <FeatureToggle
                icon={GitMerge}
                title="Allow merge commits"
                description="Add all commits from head branch as merge commit"
                checked={repository.allowMergeCommit}
                onChange={(v) => handleToggle('allowMergeCommit', v)}
                disabled={updateMutation.isPending}
              />
              <FeatureToggle
                icon={RefreshCw}
                title="Allow squash merging"
                description="Combine commits into a single commit"
                checked={repository.allowSquashMerge}
                onChange={(v) => handleToggle('allowSquashMerge', v)}
                disabled={updateMutation.isPending}
              />
              <FeatureToggle
                icon={ArrowRightLeft}
                title="Allow rebase merging"
                description="Rebase and fast-forward the head branch"
                checked={repository.allowRebaseMerge}
                onChange={(v) => handleToggle('allowRebaseMerge', v)}
                disabled={updateMutation.isPending}
              />
              <FeatureToggle
                icon={Trash2}
                title="Auto-delete head branches"
                description="Automatically delete head branches after merging"
                checked={repository.autoDeleteBranch}
                onChange={(v) => handleToggle('autoDeleteBranch', v)}
                disabled={updateMutation.isPending}
              />
            </CardContent>
          </Card>
        </SettingsSection>

        {saveSuccess && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert variant="success">Feature settings updated.</Alert>
          </motion.div>
        )}
      </div>
    </TabPanel>
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
    <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto p-0 gap-0">
      <DialogHeader className="p-6 pb-4">
        <DialogTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-primary-500" />
          Branch Protection: <span className="font-mono text-primary-700">{branch.name}</span>
        </DialogTitle>
        <DialogDescription>
          Configure protection rules for the <strong>{branch.name}</strong> branch
        </DialogDescription>
      </DialogHeader>

      <div className="px-6 pb-2 space-y-5">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-text-secondary" />
            Pull Request Requirements
          </h4>

          <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Require pull request before merging</p>
                <p className="text-xs text-text-secondary mt-0.5">All commits must be made via PR</p>
              </div>
              <Switch
                checked={rules.requirePullRequest}
                onCheckedChange={(v) => setRules({ ...rules, requirePullRequest: v })}
              />
            </div>
          </div>

          {rules.requirePullRequest && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="ml-4 space-y-3 border-l-2 border-primary-200 pl-4"
            >
              <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Required approving reviews</p>
                    <p className="text-xs text-text-secondary mt-0.5">Number of approvals needed</p>
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
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Dismiss stale reviews</p>
                    <p className="text-xs text-text-secondary mt-0.5">Dismiss approvals when new commits are pushed</p>
                  </div>
                  <Switch
                    checked={rules.dismissStaleReviews}
                    onCheckedChange={(v) => setRules({ ...rules, dismissStaleReviews: v })}
                  />
                </div>
              </div>

              <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Require code owner review</p>
                    <p className="text-xs text-text-secondary mt-0.5">Require review from CODEOWNERS</p>
                  </div>
                  <Switch
                    checked={rules.requireCodeOwnerReview}
                    onCheckedChange={(v) => setRules({ ...rules, requireCodeOwnerReview: v })}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Shield className="h-4 w-4 text-text-secondary" />
            Push Restrictions
          </h4>

          {[
            {
              key: 'restrictPushes',
              title: 'Restrict pushes',
              desc: 'Only allow admins to push',
            },
            {
              key: 'allowForcePushes',
              title: 'Allow force pushes',
              desc: 'Can overwrite history',
              warning: true,
            },
            {
              key: 'allowDeletions',
              title: 'Allow deletions',
              desc: 'Allow branch to be deleted',
              warning: true,
            },
            {
              key: 'requireLinearHistory',
              title: 'Require linear history',
              desc: 'Prevent merge commits',
            },
            {
              key: 'lockBranch',
              title: 'Lock branch',
              desc: 'Make the branch read-only',
            },
          ].map((item) => (
            <div
              key={item.key}
              className={`rounded-[var(--radius-md)] border border-border bg-surface p-4 shadow-sm ${
                item.warning ? 'border-amber-200/60' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className={`text-xs mt-0.5 ${item.warning ? 'text-amber-600' : 'text-text-secondary'}`}>
                    {item.warning && '⚠ '}
                    {item.desc}
                  </p>
                </div>
                <Switch
                  checked={rules[item.key as keyof typeof rules]}
                  onCheckedChange={(v) => setRules({ ...rules, [item.key]: v })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter className="p-6 pt-4 gap-2">
        {branch.isProtected && (
          <Button
            variant="outline"
            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            onClick={handleRemove}
            disabled={removeMutation.isPending}
          >
            <Unlock className="h-4 w-4 mr-1.5" />
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
    <TabPanel>
      <div className="space-y-6">
        <SettingsSection
          title="Branch Protection Rules"
          description="Protect important branches by enforcing review requirements and restricting pushes"
        >
          <Card>
            <CardContent className="pt-5">
              {isLoading ? (
                <PageLoader />
              ) : !branches?.length ? (
                <div className="text-center py-10">
                  <GitBranch className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
                  <p className="text-sm text-text-secondary font-medium">No branches found</p>
                  <p className="text-xs text-text-tertiary mt-1">This repository doesn&apos;t have any branches yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {branches.map((branch, idx) => (
                    <motion.div
                      key={branch.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface p-3.5 shadow-sm transition-all hover:shadow-md hover:border-primary-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                          <GitBranch className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm font-mono truncate">{branch.name}</p>
                          {branch.headCommitSha && (
                            <p className="text-xs text-text-tertiary font-mono mt-0.5">
                              {branch.headCommitSha.slice(0, 7)}
                            </p>
                          )}
                        </div>
                        {branch.isDefault && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            Default
                          </Badge>
                        )}
                        {branch.isProtected && (
                          <Badge variant="warning" className="gap-1 shrink-0">
                            <ShieldCheck className="h-3 w-3" />
                            Protected
                          </Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setEditBranch(branch)} className="shrink-0">
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        {branch.isProtected ? 'Edit' : 'Protect'}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </SettingsSection>

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
    </TabPanel>
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
    <TabPanel>
      <div className="space-y-6">
        <SettingsSection
          title="Webhooks"
          description="Receive HTTP callbacks when events happen in this repository"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <WebhookIcon className="h-5 w-5 text-primary-500" />
                    Active Webhooks
                  </CardTitle>
                  <CardDescription>
                    {webhooks?.length ?? 0} configured
                  </CardDescription>
                </div>
                {!showAdd && (
                  <Button onClick={() => setShowAdd(true)} size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    Add Webhook
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAdd && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-[var(--radius-md)] border border-primary-200 bg-primary-50/40 p-5 space-y-4 mb-2"
                >
                  <h4 className="text-sm font-semibold text-primary-700">New Webhook</h4>

                  <div className="space-y-2">
                    <Label htmlFor="webhook-url" className="text-sm font-medium">
                      Payload URL
                    </Label>
                    <Input
                      id="webhook-url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://example.com/webhooks"
                      type="url"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhook-secret" className="text-sm font-medium">
                      Secret <span className="text-text-tertiary font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="webhook-secret"
                      value={newSecret}
                      onChange={(e) => setNewSecret(e.target.value)}
                      placeholder="Secret token for payload verification"
                      type="password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Events</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {WEBHOOK_EVENTS.map((event) => (
                        <button
                          key={event.value}
                          onClick={() => toggleEvent(event.value)}
                          className={`flex items-start gap-2.5 rounded-[var(--radius-md)] border p-3 text-left text-sm transition-all ${
                            newEvents.includes(event.value)
                              ? 'border-primary-400 bg-primary-50/70 ring-1 ring-primary-400/30'
                              : 'border-border hover:border-primary-200 hover:bg-surface-hover'
                          }`}
                        >
                          <div
                            className={`mt-0.5 h-4.5 w-4.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                              newEvents.includes(event.value)
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {newEvents.includes(event.value) && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div>
                            <p className="font-medium text-xs">{event.label}</p>
                            <p className="text-xs text-text-secondary">{event.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {addError && <Alert variant="error">{addError}</Alert>}

                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={handleCreate}
                      disabled={!newUrl || createMutation.isPending}
                      size="sm"
                      className="gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      {createMutation.isPending ? 'Creating…' : 'Create Webhook'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}

              {isLoading ? (
                <PageLoader />
              ) : !webhooks?.length && !showAdd ? (
                <div className="text-center py-10">
                  <WebhookIcon className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
                  <p className="text-sm text-text-secondary font-medium">No webhooks configured</p>
                  <p className="text-xs text-text-tertiary mt-1">Add a webhook to receive event notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {webhooks?.map((webhook, idx) => (
                    <motion.div
                      key={webhook.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="rounded-[var(--radius-md)] border border-border bg-surface p-4 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm truncate font-mono text-text-primary">
                              {webhook.url}
                            </p>
                            {webhook.isActive ? (
                              <Badge variant="success" className="text-[10px]">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {webhook.events.map((event) => (
                              <Badge key={event} variant="outline" className="text-[10px] px-1.5">
                                {event}
                              </Badge>
                            ))}
                          </div>
                          {webhook.lastStatus && (
                            <div className="flex items-center gap-2 mt-2">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  webhook.lastStatus < 400 ? 'bg-success' : 'bg-error'
                                }`}
                              />
                              <p
                                className={`text-xs ${
                                  webhook.lastStatus < 400 ? 'text-success' : 'text-error'
                                }`}
                              >
                                Last response: {webhook.lastStatus}
                                {webhook.lastCalledAt && ` at ${new Date(webhook.lastCalledAt).toLocaleString()}`}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={webhook.isActive}
                            onCheckedChange={() => handleToggleActive(webhook)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </SettingsSection>
      </div>
    </TabPanel>
  );
}

// ─── Pull Requests Tab ───────────────────────────────────────

function PullRequestsTab({ owner, repo }: { owner: string; repo: string }) {
  const { data: configData } = usePrRiskConfig(owner, repo);
  const updateConfig = useUpdatePrRiskConfig(owner, repo);

  const config = configData as
    | { maxFiles?: number; maxLines?: number; criticalPaths?: string[] }
    | undefined;
  const [maxFiles, setMaxFiles] = useState(String(config?.maxFiles ?? 50));
  const [maxLines, setMaxLines] = useState(String(config?.maxLines ?? 500));
  const [criticalPaths, setCriticalPaths] = useState((config?.criticalPaths ?? []).join(', '));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateConfig.mutate(
      {
        maxFiles: Number(maxFiles) || 50,
        maxLines: Number(maxLines) || 500,
        criticalPaths: criticalPaths
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
      },
    );
  };

  return (
    <TabPanel>
      <div className="space-y-6">
        <SettingsSection
          title="PR Risk Configuration"
          description="Configure thresholds used to compute the risk level badge on pull requests"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary-500" />
                Risk Thresholds
              </CardTitle>
              <CardDescription>PRs exceeding these limits receive a higher risk score</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="maxFiles" className="text-sm font-medium">
                    Max files <span className="text-text-tertiary font-normal">(MEDIUM threshold)</span>
                  </Label>
                  <Input
                    id="maxFiles"
                    type="number"
                    min={1}
                    value={maxFiles}
                    onChange={(e) => setMaxFiles(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-text-secondary">PRs touching more files get elevated risk</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLines" className="text-sm font-medium">
                    Max lines changed <span className="text-text-tertiary font-normal">(HIGH threshold)</span>
                  </Label>
                  <Input
                    id="maxLines"
                    type="number"
                    min={1}
                    value={maxLines}
                    onChange={(e) => setMaxLines(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-text-secondary">PRs changing more lines get HIGH or CRITICAL risk</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="criticalPaths" className="text-sm font-medium">
                  Critical paths <span className="text-text-tertiary font-normal">(comma-separated)</span>
                </Label>
                <Input
                  id="criticalPaths"
                  value={criticalPaths}
                  onChange={(e) => setCriticalPaths(e.target.value)}
                  placeholder="e.g. src/auth, prisma/schema.prisma, .env"
                  className="w-full font-mono text-sm"
                />
                <p className="text-xs text-text-secondary">
                  PRs touching any of these paths automatically receive CRITICAL risk
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Button size="sm" onClick={handleSave} disabled={updateConfig.isPending} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  {updateConfig.isPending ? 'Saving...' : 'Save configuration'}
                </Button>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-success flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Saved
                  </motion.span>
                )}
              </div>

              {updateConfig.isError && <Alert variant="error">Failed to save configuration.</Alert>}
            </CardContent>
          </Card>
        </SettingsSection>
      </div>
    </TabPanel>
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
    <TabPanel>
      <div className="space-y-6">
        <SettingsSection title="Danger Zone" description="Irreversible and destructive actions. Proceed with caution.">
          <Card className="border-red-200/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Destructive Actions
              </CardTitle>
              <CardDescription className="text-red-600/70">
                These actions cannot be undone. Make sure you understand the consequences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Archive */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-[var(--radius-md)] border border-amber-200/60 bg-amber-50/40 p-4 gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Archive className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-text-primary">Archive this repository</p>
                    <p className="text-xs text-text-secondary mt-0.5 max-w-md">
                      {repository.isArchived
                        ? 'This repository is archived and read-only. Unarchiving will restore full functionality.'
                        : 'Mark as read-only. This will prevent new issues, PRs, and pushes. Can be unarchived later.'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
                  onClick={handleArchiveToggle}
                  disabled={updateMutation.isPending}
                >
                  <Archive className="mr-1.5 h-4 w-4" />
                  {repository.isArchived ? 'Unarchive' : 'Archive'}
                </Button>
              </div>

              <Separator className="bg-red-100" />

              {/* Transfer */}
              <div className="rounded-[var(--radius-md)] border border-red-200/60 bg-red-50/30 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <ArrowRightLeft className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-text-primary">Transfer ownership</p>
                      <p className="text-xs text-text-secondary mt-0.5 max-w-md">
                        Transfer this repository to another user or organization. You will lose owner access.
                      </p>
                    </div>
                  </div>
                  {!showTransfer && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50 shrink-0"
                      onClick={() => setShowTransfer(true)}
                    >
                      <ArrowRightLeft className="mr-1.5 h-4 w-4" />
                      Transfer
                    </Button>
                  )}
                </div>

                {showTransfer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 pt-3 border-t border-red-100"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="transfer-owner" className="text-sm font-medium">
                          New owner
                        </Label>
                        <Input
                          id="transfer-owner"
                          value={transferOwner}
                          onChange={(e) => setTransferOwner(e.target.value)}
                          placeholder="Username or organization name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="transfer-name" className="text-sm font-medium">
                          New repository name <span className="text-text-tertiary font-normal">(optional)</span>
                        </Label>
                        <Input
                          id="transfer-name"
                          value={transferName}
                          onChange={(e) => setTransferName(e.target.value)}
                          placeholder={repo}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm text-text-secondary">
                        Type <code className="bg-red-100 text-red-700 px-1 py-0.5 rounded text-xs font-mono">{owner}/{repo}</code> to confirm
                      </p>
                      <Input
                        value={transferConfirm}
                        onChange={(e) => setTransferConfirm(e.target.value)}
                        placeholder={`${owner}/${repo}`}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={
                          transferConfirm !== `${owner}/${repo}` || !transferOwner || transferMutation.isPending
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
                  </motion.div>
                )}
              </div>

              <Separator className="bg-red-100" />

              {/* Delete */}
              <div className="rounded-[var(--radius-md)] border border-red-200/60 bg-red-50/30 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <Trash2 className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-red-700">Delete this repository</p>
                    <p className="text-xs text-text-secondary mt-0.5 max-w-lg">
                      This action is <strong className="text-red-600">irreversible</strong>. All data including issues, pull requests,
                      branches, and commits will be permanently deleted.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary">
                    Type <code className="bg-red-100 text-red-700 px-1 py-0.5 rounded text-xs font-mono">{owner}/{repo}</code> to confirm deletion
                  </p>
                  <Input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder={`${owner}/${repo}`}
                    className="font-mono text-sm"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteConfirm !== `${owner}/${repo}` || deleteMutation.isPending}
                  onClick={handleDelete}
                  className="gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete Repository'}
                </Button>
                {deleteError && <Alert variant="error">{deleteError}</Alert>}
              </div>
            </CardContent>
          </Card>
        </SettingsSection>
      </div>
    </TabPanel>
  );
}

// ─── Wiki Settings Tab ───────────────────────────────────────

function WikiSettingsTab({ owner, repo }: { owner: string; repo: string }) {
  const { data: settings, isLoading } = useWikiSettings(owner, repo);
  const updateMutation = useUpdateWikiSettings(owner, repo);
  const [saved, setSaved] = useState(false);

  const [sourceMode, setSourceMode] = useState<'PLATFORM' | 'REPOSITORY'>('PLATFORM');
  const [sourceBranch, setSourceBranch] = useState('main');
  const [sourceRoot, setSourceRoot] = useState('/docs');
  const [homePage, setHomePage] = useState('home');
  const [allowComments, setAllowComments] = useState(true);
  const [allowAttachments, setAllowAttachments] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      setSourceMode(settings.sourceMode as 'PLATFORM' | 'REPOSITORY');
      setSourceBranch(settings.sourceBranch ?? 'main');
      setSourceRoot(settings.sourceRoot ?? '/docs');
      setHomePage(settings.homePage ?? 'home');
      setAllowComments(settings.allowComments);
      setAllowAttachments(settings.allowAttachments);
      setInitialized(true);
    }
  }, [settings, initialized]);

  const handleSave = () => {
    setSaved(false);
    updateMutation.mutate(
      { sourceMode, sourceBranch, sourceRoot, homePage, allowComments, allowAttachments },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
      },
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <TabPanel>
      <div className="space-y-6">
        <SettingsSection
          title="Wiki Settings"
          description="Configure how your wiki content is stored and managed"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileCode className="h-5 w-5 text-primary-500" />
                Content Source
              </CardTitle>
              <CardDescription>Choose where wiki pages are stored</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Source Mode</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setSourceMode('PLATFORM')}
                    className={`flex items-center gap-3 rounded-[var(--radius-md)] border p-4 text-left transition-all ${
                      sourceMode === 'PLATFORM'
                        ? 'border-primary-400 bg-primary-50/60 ring-1 ring-primary-400'
                        : 'border-border hover:border-primary-200 hover:bg-surface-hover'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        sourceMode === 'PLATFORM' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-text-tertiary'
                      }`}
                    >
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-text-primary">Platform</p>
                      <p className="text-xs text-text-secondary mt-0.5">Stored in database, edited via web UI</p>
                    </div>
                    {sourceMode === 'PLATFORM' && (
                      <div className="ml-auto">
                        <div className="h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setSourceMode('REPOSITORY')}
                    className={`flex items-center gap-3 rounded-[var(--radius-md)] border p-4 text-left transition-all ${
                      sourceMode === 'REPOSITORY'
                        ? 'border-primary-400 bg-primary-50/60 ring-1 ring-primary-400'
                        : 'border-border hover:border-primary-200 hover:bg-surface-hover'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        sourceMode === 'REPOSITORY'
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-gray-100 text-text-tertiary'
                      }`}
                    >
                      <GitBranch className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-text-primary">Repository</p>
                      <p className="text-xs text-text-secondary mt-0.5">Read from markdown files in repo</p>
                    </div>
                    {sourceMode === 'REPOSITORY' && (
                      <div className="ml-auto">
                        <div className="h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {sourceMode === 'REPOSITORY' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="sourceBranch" className="text-sm font-medium">
                      Source Branch
                    </Label>
                    <Input
                      id="sourceBranch"
                      value={sourceBranch}
                      onChange={(e) => setSourceBranch(e.target.value)}
                      placeholder="main"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sourceRoot" className="text-sm font-medium">
                      Source Root
                    </Label>
                    <Input
                      id="sourceRoot"
                      value={sourceRoot}
                      onChange={(e) => setSourceRoot(e.target.value)}
                      placeholder="/docs"
                      className="font-mono text-sm"
                    />
                  </div>
                </motion.div>
              )}

              <Separator />

              <div className="space-y-1.5">
                <Label htmlFor="homePage" className="text-sm font-medium">
                  Home Page Slug
                </Label>
                <Input
                  id="homePage"
                  value={homePage}
                  onChange={(e) => setHomePage(e.target.value)}
                  placeholder="home"
                />
                <p className="text-xs text-text-secondary">The default page shown when visiting the wiki</p>
              </div>
            </CardContent>
          </Card>
        </SettingsSection>

        <SettingsSection title="Interaction" description="Control how users interact with wiki pages">
          <Card>
            <CardContent className="pt-5 space-y-3">
              <FeatureToggle
                icon={MessageSquare}
                title="Allow Comments"
                description="Let users leave comments on wiki pages"
                checked={allowComments}
                onChange={setAllowComments}
              />
              <FeatureToggle
                icon={FileCode}
                title="Allow Attachments"
                description="Let users upload files to wiki pages"
                checked={allowAttachments}
                onChange={setAllowAttachments}
              />
            </CardContent>
          </Card>
        </SettingsSection>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-1.5">
            <Check className="h-3.5 w-3.5" />
            {updateMutation.isPending ? 'Saving...' : 'Save Wiki Settings'}
          </Button>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-success flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Saved
            </motion.span>
          )}
        </div>

        {updateMutation.isError && <Alert variant="error">Failed to save wiki settings.</Alert>}
      </div>
    </TabPanel>
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

  const activeTabDef = TABS.find((t) => t.id === activeTab)!;

  return (
    <motion.div
      className="mx-auto max-w-5xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          <span className="font-medium">{owner}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium">{repo}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-text-tertiary">Settings</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-primary-500 text-white shadow-sm">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Repository Settings</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-text-secondary">Manage repository configuration and preferences</p>
              {repository.visibility === 'PRIVATE' ? (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Eye className="h-3 w-3" />
                  Public
                </Badge>
              )}
              {repository.isArchived && (
                <Badge variant="warning" className="text-[10px] gap-1">
                  <Archive className="h-3 w-3" />
                  Archived
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Navigation */}
        <nav className="w-56 shrink-0">
          <div className="sticky top-4 flex flex-col gap-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDanger = tab.id === 'danger';
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    isActive
                      ? isDanger
                        ? 'text-red-700'
                        : 'text-primary-700'
                      : isDanger
                        ? 'text-red-500 hover:bg-red-50/60 hover:text-red-600'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="settings-nav-indicator"
                      className={cn(
                        'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full',
                        isDanger ? 'bg-red-500' : 'bg-primary-500',
                      )}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive
                        ? isDanger
                          ? 'text-red-600'
                          : 'text-primary-600'
                        : isDanger
                          ? 'text-red-400 group-hover:text-red-500'
                          : 'text-text-tertiary group-hover:text-text-secondary',
                    )}
                  />
                  <div className="text-left flex-1 min-w-0">
                    <p className="truncate">{tab.label}</p>
                    <p
                      className={cn(
                        'text-[11px] font-normal truncate',
                        isActive
                          ? isDanger
                            ? 'text-red-500/70'
                            : 'text-primary-600/70'
                          : 'text-text-tertiary',
                      )}
                    >
                      {tab.description}
                    </p>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="settings-nav-bg"
                      className={cn(
                        'absolute inset-0 rounded-lg -z-10',
                        isDanger ? 'bg-red-50' : 'bg-primary-50',
                      )}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tab Content */}
        <div className="flex-1 min-w-0 pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {activeTab === 'general' && <GeneralTab owner={owner!} repo={repo!} />}
              {activeTab === 'features' && <FeaturesTab owner={owner!} repo={repo!} />}
              {activeTab === 'branches' && <BranchesTab owner={owner!} repo={repo!} />}
              {activeTab === 'webhooks' && <WebhooksTab owner={owner!} repo={repo!} />}
              {activeTab === 'pull-requests' && <PullRequestsTab owner={owner!} repo={repo!} />}
              {activeTab === 'wiki' && <WikiSettingsTab owner={owner!} repo={repo!} />}
              {activeTab === 'danger' && <DangerZoneTab owner={owner!} repo={repo!} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
