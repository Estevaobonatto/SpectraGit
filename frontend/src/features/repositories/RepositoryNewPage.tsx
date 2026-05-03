import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Plus,
  Globe,
  Lock,
  GitFork,
  Zap,
  ArrowLeft,
  Loader2,
  Check,
  AlertTriangle,
  FileText,
  GitBranch,
  Info,
  ChevronRight,
  Eye,
  Code,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useCreateRepository } from '@/hooks/useRepositories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/* ─── Visibility Option Card ─────────────────────────────── */

function VisibilityCard({
  value,
  selected,
  onSelect,
  icon: Icon,
  title,
  description,
  recommended,
}: {
  value: 'PUBLIC' | 'PRIVATE';
  selected: boolean;
  onSelect: (v: 'PUBLIC' | 'PRIVATE') => void;
  icon: React.ElementType;
  title: string;
  description: string;
  recommended?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'relative flex items-start gap-3 w-full p-4 rounded-lg border text-left transition-all',
        selected
          ? 'bg-primary-50 border-primary-400 shadow-sm ring-1 ring-primary-200'
          : 'bg-surface border-border hover:border-primary-200 hover:bg-surface-hover',
      )}
    >
      <div
        className={cn(
          'h-9 w-9 rounded-md flex items-center justify-center shrink-0 transition-colors',
          selected ? 'bg-primary-100 text-primary-600' : 'bg-surface border border-border text-text-tertiary',
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-text-primary">{title}</span>
          {recommended && (
            <Badge variant="outline" className="text-[10px] px-1.5 bg-primary-50 border-primary-200 text-primary-700">
              Recommended
            </Badge>
          )}
        </div>
        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div
        className={cn(
          'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
          selected ? 'border-primary-500 bg-primary-500' : 'border-border',
        )}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </div>
    </button>
  );
}

/* ─── Branch Selector ────────────────────────────────────── */

function BranchSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const branches = ['main', 'master'];
  return (
    <div className="flex items-center gap-2">
      {branches.map((branch) => (
        <button
          key={branch}
          type="button"
          onClick={() => onChange(branch)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all',
            value === branch
              ? 'bg-primary-50 border-primary-400 text-primary-700'
              : 'bg-surface border-border text-text-secondary hover:border-primary-300 hover:text-text-primary',
          )}
        >
          <GitBranch className="h-3 w-3" />
          {branch}
        </button>
      ))}
    </div>
  );
}

/* ─── Live Preview Card ──────────────────────────────────── */

function RepoPreview({
  name,
  description,
  visibility,
  ownerName,
  avatarUrl,
  initReadme,
  defaultBranch,
}: {
  name: string;
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  ownerName: string;
  avatarUrl?: string | null;
  initReadme: boolean;
  defaultBranch: string;
}) {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');

  return (
    <Card className="overflow-hidden border-border">
      <div className="bg-surface border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[10px] text-text-tertiary font-mono">{ownerName}/{slug || 'repo-name'}</span>
          </div>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt={ownerName} className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <div className="h-5 w-5 rounded-full bg-primary-50 flex items-center justify-center">
              <BookOpen className="h-3 w-3 text-primary-500" />
            </div>
          )}
          <span className="text-xs text-text-secondary">
            {ownerName}/<span className="font-medium text-text-primary">{slug || 'repo-name'}</span>
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 ml-auto">
            {visibility === 'PUBLIC' ? <Globe className="mr-0.5 h-2.5 w-2.5" /> : <Lock className="mr-0.5 h-2.5 w-2.5" />}
            {visibility === 'PUBLIC' ? 'Public' : 'Private'}
          </Badge>
        </div>

        {description ? (
          <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
        ) : (
          <p className="text-xs text-text-tertiary italic">No description provided</p>
        )}

        <div className="flex items-center gap-3 text-[10px] text-text-tertiary pt-1">
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            {defaultBranch}
          </span>
          {initReadme && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              README
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Code className="h-3 w-3" />
            0 files
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Component ─────────────────────────────────────── */

export default function RepositoryNewPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const createRepo = useCreateRepository();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [initReadme, setInitReadme] = useState(true);

  const slug = useMemo(
    () => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9._-]/g, ''),
    [name],
  );

  const isValidName = name.length > 0 && /^[a-zA-Z0-9._-]+$/.test(name);
  const nameError = name.length > 0 && !isValidName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidName) return;

    createRepo.mutate(
      {
        name,
        description: description || undefined,
        visibility,
        defaultBranch,
        initWithReadme: initReadme,
      },
      {
        onSuccess: (repo) => {
          navigate(`/${user?.username}/${repo.slug}`);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-text-secondary hover:text-text-primary" asChild>
          <Link to="/repositories">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to repositories
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Create a new repository</h1>
        <p className="text-sm text-text-secondary mt-1">
          A repository contains all project files, including the revision history.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2 space-y-5"
        >
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary-500" />
                Repository details
              </CardTitle>
              <CardDescription>
                Configure the basic settings for your new repository.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Owner + Name */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Repository name</Label>
                  <div className="flex items-center gap-0 rounded-lg border border-border bg-surface overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-1">
                    <div className="flex items-center gap-2 px-3 py-2 bg-surface-hover border-r border-border shrink-0">
                      <Avatar src={user?.avatarUrl ?? undefined} alt={user?.username ?? ''} size="sm" />
                      <span className="text-sm text-text-secondary font-medium">{user?.username}</span>
                      <span className="text-text-tertiary">/</span>
                    </div>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="awesome-project"
                      className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-auto py-2"
                      autoFocus
                    />
                  </div>
                  {nameError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center gap-1.5 text-xs text-red-600"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Name can only contain letters, numbers, hyphens, underscores and dots.
                    </motion.div>
                  )}
                  {isValidName && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center gap-1.5 text-xs text-emerald-600"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Your repository will be created at{' '}
                      <code className="bg-surface px-1 py-0.5 rounded text-[10px] font-mono">
                        {user?.username}/{slug}
                      </code>
                    </motion.div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description
                    </Label>
                    <span className={cn('text-[10px]', description.length > 450 ? 'text-amber-600' : 'text-text-tertiary')}>
                      {description.length}/500
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this project about?"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                {/* Default branch */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <GitBranch className="h-4 w-4 text-text-tertiary" />
                    Default branch
                  </Label>
                  <BranchSelector value={defaultBranch} onChange={setDefaultBranch} />
                  <p className="text-xs text-text-tertiary">
                    This will be the default branch for your repository.
                  </p>
                </div>

                {/* Visibility */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Visibility</Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <VisibilityCard
                      value="PUBLIC"
                      selected={visibility === 'PUBLIC'}
                      onSelect={setVisibility}
                      icon={Globe}
                      title="Public"
                      description="Anyone on the internet can see this repository. You choose who can commit."
                      recommended
                    />
                    <VisibilityCard
                      value="PRIVATE"
                      selected={visibility === 'PRIVATE'}
                      onSelect={setVisibility}
                      icon={Lock}
                      title="Private"
                      description="You choose who can see and commit to this repository."
                    />
                  </div>
                </div>

                {/* README toggle */}
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface">
                  <div className="pt-0.5">
                    <Switch
                      checked={initReadme}
                      onCheckedChange={setInitReadme}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Label className="text-sm font-medium cursor-pointer" onClick={() => setInitReadme(!initReadme)}>
                      Initialize with a README
                    </Label>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                      This will let you immediately clone the repository to your computer. Skip this step if you are
                      importing an existing repository.
                    </p>
                  </div>
                  <FileText className="h-5 w-5 text-text-tertiary shrink-0" />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {createRepo.isError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <Alert variant="error">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {(createRepo.error as Error)?.message ?? 'Failed to create repository'}
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/repositories')}
                    className="text-text-secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!isValidName || createRepo.isPending}
                    className="gap-2"
                  >
                    {createRepo.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating repository...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create repository
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-6"
        >
          {/* Live Preview */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Live preview
            </h3>
            <RepoPreview
              name={name}
              description={description}
              visibility={visibility}
              ownerName={user?.username ?? 'user'}
              avatarUrl={user?.avatarUrl}
              initReadme={initReadme}
              defaultBranch={defaultBranch}
            />
          </div>

          {/* Info card */}
          <Card className="bg-gradient-to-br from-primary-500/5 to-violet-500/5 border-primary-200/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary-600" />
                <h4 className="text-sm font-semibold text-text-primary">Did you know?</h4>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                You can also create a repository by pushing an existing project from the command line, or by importing
                from GitHub.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                  <Link to="/integrations/github">
                    Import from GitHub
                    <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
