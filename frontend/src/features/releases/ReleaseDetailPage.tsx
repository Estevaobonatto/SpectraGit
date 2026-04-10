import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Package, Tag as TagIcon, Clock, User as UserIcon, Pencil, Trash2, ArrowLeft, GitBranch, Download, Upload, Paperclip, X } from 'lucide-react';
import { useRelease, useUpdateRelease, useDeleteRelease, useUploadAssets, useDeleteAsset } from '@/hooks/useReleases';
import { releasesService } from '@/services/repositories.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import ReactMarkdown from 'react-markdown';

export default function ReleaseDetailPage() {
  const { owner, repo, releaseId } = useParams();
  const navigate = useNavigate();
  const { data: release, isLoading, error } = useRelease(owner!, repo!, releaseId!);
  const updateRelease = useUpdateRelease(owner!, repo!);
  const deleteRelease = useDeleteRelease(owner!, repo!);
  const uploadAssets = useUploadAssets(owner!, repo!);
  const deleteAsset = useDeleteAsset(owner!, repo!);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editIsPrerelease, setEditIsPrerelease] = useState(false);
  const [editIsDraft, setEditIsDraft] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openEdit = () => {
    if (!release) return;
    setEditName(release.name);
    setEditBody(release.body || '');
    setEditIsPrerelease(release.isPrerelease);
    setEditIsDraft(release.isDraft);
    setEditing(true);
  };

  const handleUpdate = () => {
    if (!release) return;
    updateRelease.mutate(
      {
        releaseId: release.id,
        data: {
          name: editName,
          body: editBody,
          isPrerelease: editIsPrerelease,
          isDraft: editIsDraft,
        },
      },
      {
        onSuccess: () => {
          setEditing(false);
          setEditError(null);
        },
        onError: (err) => {
          setEditError((err as Error)?.message ?? 'Failed to update release');
        },
      },
    );
  };

  const handleDelete = () => {
    if (!release) return;
    deleteRelease.mutate(release.id, {
      onSuccess: () => navigate(`/${owner}/${repo}/releases`),
    });
  };

  const handleUploadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !release) return;
    uploadAssets.mutate({ releaseId: release.id, files });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAsset = (assetId: string) => {
    if (!release) return;
    deleteAsset.mutate({ releaseId: release.id, assetId });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) return <PageLoader />;

  if (error || !release) {
    return (
      <Alert variant="error" title="Release not found">
        The release does not exist or you don't have access.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to={`/${owner}/${repo}/releases`}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to releases
        </Link>
      </div>

      <div className="rounded-[var(--radius-md)] border border-border p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary-500" />
              <h1 className="text-xl font-semibold">{release.name}</h1>
              {release.isDraft && (
                <Badge variant="outline">Draft</Badge>
              )}
              {release.isPrerelease && (
                <Badge variant="warning">Pre-release</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-text-tertiary">
              <span className="flex items-center gap-1.5">
                <TagIcon className="h-3.5 w-3.5" />
                <code className="text-xs bg-surface-secondary px-1.5 py-0.5 rounded">{release.tag.name}</code>
              </span>
              <span className="flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" />
                <code className="text-xs bg-surface-secondary px-1.5 py-0.5 rounded">{release.targetBranch}</code>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(release.createdAt)}
              </span>
              {release.author && (
                <span className="flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" />
                  {release.author.displayName || release.author.username}
                </span>
              )}
              <code className="text-xs bg-surface-secondary px-1.5 py-0.5 rounded">{release.tag.commitSha.substring(0, 7)}</code>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-text-tertiary hover:text-error" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Markdown body */}
        {release.body && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-text-primary prose-p:text-text-secondary prose-a:text-primary-600 prose-code:bg-surface-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-surface-secondary prose-pre:rounded-[var(--radius-md)]">
              <ReactMarkdown>{release.body}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Assets section */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-text-tertiary" />
              Assets
              {release.assets && release.assets.length > 0 && (
                <span className="text-xs text-text-tertiary">({release.assets.length})</span>
              )}
            </h3>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleUploadFiles}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploadAssets.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                {uploadAssets.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>

          {release.assets && release.assets.length > 0 ? (
            <div className="space-y-1">
              {release.assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-border px-4 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Paperclip className="h-4 w-4 shrink-0 text-text-tertiary" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{asset.fileName}</p>
                      <p className="text-xs text-text-tertiary">{formatFileSize(asset.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={releasesService.getAssetDownloadUrl(owner!, repo!, release.id, asset.id)}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-[var(--radius-sm)] text-text-tertiary hover:text-primary-600 hover:bg-surface-secondary transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => handleDeleteAsset(asset.id)}
                      disabled={deleteAsset.isPending}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-[var(--radius-sm)] text-text-tertiary hover:text-error hover:bg-surface-secondary transition-colors disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">No assets attached to this release.</p>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit release</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Release title</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Release notes <span className="text-text-tertiary text-xs">(Markdown)</span></Label>
              <Textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={editIsPrerelease} onCheckedChange={setEditIsPrerelease} id="edit-prerelease" />
                <Label htmlFor="edit-prerelease" className="text-sm font-normal">Pre-release</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editIsDraft} onCheckedChange={setEditIsDraft} id="edit-draft" />
                <Label htmlFor="edit-draft" className="text-sm font-normal">Draft</Label>
              </div>
            </div>
            {editError && <Alert variant="error">{editError}</Alert>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!editName.trim() || updateRelease.isPending}>
              {updateRelease.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
