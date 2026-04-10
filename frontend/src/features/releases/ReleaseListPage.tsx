import { useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Package, Plus, Trash2, Tag as TagIcon, Clock, User as UserIcon, GitCommit, GitBranch, Upload, X, Paperclip } from 'lucide-react';
import { useReleases, useCreateRelease, useDeleteRelease, useUploadAssets } from '@/hooks/useReleases';
import { useTags } from '@/hooks/useTags';
import { useBranches, useCommits } from '@/hooks/useBranches';
import { useRepository } from '@/hooks/useRepositories';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { motion } from 'motion/react';

export default function ReleaseListPage() {
  const { owner, repo } = useParams();
  const { data: releases, isLoading } = useReleases(owner!, repo!);
  const { data: repoData } = useRepository(owner!, repo!);
  const { data: tags } = useTags(owner!, repo!);
  const { data: branches } = useBranches(owner!, repo!);
  const createRelease = useCreateRelease(owner!, repo!);
  const uploadAssets = useUploadAssets(owner!, repo!);
  const deleteRelease = useDeleteRelease(owner!, repo!);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: commits } = useCommits(owner!, repo!, { limit: 50 });

  const [tagSelectValue, setTagSelectValue] = useState('');
  const [tagName, setTagName] = useState('');
  const [releaseName, setReleaseName] = useState('');
  const [body, setBody] = useState('');
  const [targetBranch, setTargetBranch] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [isPrerelease, setIsPrerelease] = useState(false);
  const [commitSha, setCommitSha] = useState('');
  const [commitSelectValue, setCommitSelectValue] = useState('');
  const [manualCommit, setManualCommit] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);

  const existingTagNames = tags?.map((t) => t.name) || [];
  const isNewTag = tagSelectValue === '__new__';
  const defaultBranch = repoData?.defaultBranch ?? 'main';

  const handleTagSelect = (value: string) => {
    setTagSelectValue(value);
    setTagName(value === '__new__' ? '' : value);
    setCreateError(null);
  };

  const handleCommitSelect = (value: string) => {
    setCommitSelectValue(value);
    if (value === '__manual__') {
      setManualCommit(true);
      setCommitSha('');
    } else {
      setManualCommit(false);
      setCommitSha(value);
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCreate = () => {
    if (!tagName.trim() || !releaseName.trim()) return;
    createRelease.mutate(
      {
        tagName,
        name: releaseName,
        body: body || undefined,
        targetBranch: targetBranch || defaultBranch,
        isDraft,
        isPrerelease,
        commitSha: isNewTag ? commitSha : undefined,
      },
      {
        onSuccess: (release) => {
          if (attachedFiles.length > 0) {
            uploadAssets.mutate(
              { releaseId: release.id, files: attachedFiles },
              {
                onSuccess: () => resetForm(),
                onError: (err) => {
                  setCreateError(`Release created but file upload failed: ${(err as Error)?.message}`);
                },
              },
            );
          } else {
            resetForm();
          }
        },
        onError: (err) => {
          setCreateError((err as Error)?.message ?? 'Failed to create release');
        },
      },
    );
  };

  const resetForm = () => {
    setTagSelectValue('');
    setTagName('');
    setReleaseName('');
    setBody('');
    setTargetBranch('');
    setIsDraft(false);
    setIsPrerelease(false);
    setCommitSha('');
    setCommitSelectValue('');
    setManualCommit(false);
    setAttachedFiles([]);
    setDialogOpen(false);
    setCreateError(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Releases</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setCreateError(null); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New release
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create a new release</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Tag</Label>
                <Select value={tagSelectValue} onValueChange={handleTagSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an existing tag…" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingTagNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        <span className="flex items-center gap-2">
                          <TagIcon className="h-3 w-3 shrink-0 text-text-tertiary" />
                          {name}
                        </span>
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__">
                      <span className="text-primary-600 text-xs font-medium">+ Create a new tag</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {isNewTag && (
                  <Input
                    value={tagName}
                    onChange={(e) => { setTagName(e.target.value); setCreateError(null); }}
                    placeholder="New tag name (e.g. v1.0.0)"
                    autoFocus
                  />
                )}
              </div>

              {isNewTag && (
                <div className="space-y-2">
                  <Label>Commit SHA</Label>
                  <Select value={commitSelectValue} onValueChange={handleCommitSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a recent commit…" />
                    </SelectTrigger>
                    <SelectContent>
                      {commits?.map((c) => (
                        <SelectItem key={c.sha} value={c.sha}>
                          <span className="flex items-center gap-2">
                            <GitCommit className="h-3 w-3 shrink-0 text-text-tertiary" />
                            <code className="font-mono text-xs">{c.sha.substring(0, 7)}</code>
                            <span className="text-text-secondary truncate max-w-[240px]">
                              {c.message.split('\n')[0].substring(0, 60)}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                      <SelectItem value="__manual__">
                        <span className="text-text-tertiary italic text-xs">Enter SHA manually…</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {manualCommit && (
                    <Input
                      value={commitSha}
                      onChange={(e) => setCommitSha(e.target.value)}
                      placeholder="Full or short commit SHA"
                      className="font-mono text-xs"
                      autoFocus
                    />
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Release title</Label>
                <Input
                  value={releaseName}
                  onChange={(e) => setReleaseName(e.target.value)}
                  placeholder="v1.0.0 - Initial Release"
                />
              </div>

              <div className="space-y-2">
                <Label>Release notes <span className="text-text-tertiary text-xs">(Markdown)</span></Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Describe this release... (Markdown supported)"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Target branch</Label>
                <Select value={targetBranch || defaultBranch} onValueChange={setTargetBranch}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((b) => (
                      <SelectItem key={b.id} value={b.name}>
                        <span className="flex items-center gap-2">
                          <GitBranch className="h-3 w-3 shrink-0 text-text-tertiary" />
                          {b.name}
                          {b.name === defaultBranch && (
                            <span className="text-[10px] text-text-tertiary">(default)</span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Attach files <span className="text-text-tertiary text-xs">(optional, max 100MB each)</span></Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFilesSelected}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Choose files
                </Button>
                {attachedFiles.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {attachedFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-border bg-surface-secondary px-3 py-1.5 text-sm"
                      >
                        <span className="flex items-center gap-2 truncate min-w-0">
                          <Paperclip className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                          <span className="truncate">{file.name}</span>
                          <span className="shrink-0 text-[10px] text-text-tertiary">{formatFileSize(file.size)}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="shrink-0 text-text-tertiary hover:text-error"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={isPrerelease} onCheckedChange={setIsPrerelease} id="prerelease" />
                  <Label htmlFor="prerelease" className="text-sm font-normal">Pre-release</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={isDraft} onCheckedChange={setIsDraft} id="draft" />
                  <Label htmlFor="draft" className="text-sm font-normal">Draft</Label>
                </div>
              </div>

              {createError && (
                <Alert variant="error">{createError}</Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={!tagSelectValue || (isNewTag && !tagName.trim()) || !releaseName.trim() || (isNewTag && !commitSha.trim()) || createRelease.isPending || uploadAssets.isPending}
              >
                {(createRelease.isPending || uploadAssets.isPending) ? 'Publishing...' : isDraft ? 'Save draft' : 'Publish release'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {(!releases || releases.length === 0) ? (
        <EmptyState
          icon={Package}
          title="No releases"
          description="Releases are deployable software iterations you can package and make available for a wider audience"
        />
      ) : (
        <div className="space-y-4">
          {releases.map((release, index) => (
            <motion.div
              key={release.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="rounded-[var(--radius-md)] border border-border p-5"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/${owner}/${repo}/releases/${release.id}`}
                      className="text-lg font-semibold text-primary-600 hover:underline"
                    >
                      {release.name}
                    </Link>
                    {release.isDraft && (
                      <Badge variant="outline" className="text-[10px]">Draft</Badge>
                    )}
                    {release.isPrerelease && (
                      <Badge variant="warning" className="text-[10px]">Pre-release</Badge>
                    )}
                    {!release.isDraft && !release.isPrerelease && (
                      <Badge variant="success" className="text-[10px]">Latest</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <TagIcon className="h-3 w-3" />
                      {release.tag.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      {release.targetBranch}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(release.createdAt)}
                    </span>
                    {release.author && (
                      <span className="flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        {release.author.displayName || release.author.username}
                      </span>
                    )}
                    <code className="text-[10px]">{release.tag.commitSha.substring(0, 7)}</code>
                  </div>

                  {release.body && (
                    <p className="text-sm text-text-secondary line-clamp-3 mt-2 max-w-[600px]">{release.body}</p>
                  )}

                  {release.assets && release.assets.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-text-tertiary">
                      <Paperclip className="h-3 w-3" />
                      {release.assets.length} asset{release.assets.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-text-tertiary hover:text-error"
                  onClick={() => deleteRelease.mutate(release.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
