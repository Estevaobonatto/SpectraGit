import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Settings, Trash2, Archive } from 'lucide-react';
import { useRepository, useUpdateRepository, useDeleteRepository } from '@/hooks/useRepositories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';

export default function RepositorySettingsPage() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  const { data: repository, isLoading } = useRepository(owner!, repo!);
  const updateMutation = useUpdateRepository(owner!, repo!);
  const deleteMutation = useDeleteRepository(owner!, repo!);

  const [description, setDescription] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [initialized, setInitialized] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  if (isLoading) return <PageLoader />;

  if (!repository) {
    return (
      <Alert variant="error" title="Repository not found">
        The repository <strong>{owner}/{repo}</strong> does not exist.
      </Alert>
    );
  }

  if (!initialized) {
    setDescription(repository.description ?? '');
    setDefaultBranch(repository.defaultBranch ?? 'main');
    setVisibility(repository.visibility as 'PUBLIC' | 'PRIVATE');
    setInitialized(true);
  }

  const handleSave = () => {
    updateMutation.mutate({ description, defaultBranch, visibility });
  };

  const handleDelete = () => {
    if (deleteConfirm !== `${owner}/${repo}`) return;
    deleteMutation.mutate(undefined, {
      onSuccess: () => navigate('/'),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
        <Settings className="h-6 w-6" />
        Repository Settings
      </h1>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of this repository"
            />
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
              >
                Public
              </Button>
              <Button
                variant={visibility === 'PRIVATE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVisibility('PRIVATE')}
              >
                Private
              </Button>
            </div>
          </div>

          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-red-500/20 p-4">
            <div>
              <p className="font-medium">Archive this repository</p>
              <p className="text-sm text-text-tertiary">Mark as read-only. Can be unarchived later.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
              onClick={() => updateMutation.mutate({ isArchived: true })}
              disabled={updateMutation.isPending || repository.isArchived}
            >
              <Archive className="mr-1 h-4 w-4" />
              {repository.isArchived ? 'Archived' : 'Archive'}
            </Button>
          </div>

          <div className="rounded-md border border-red-500/20 p-4 space-y-3">
            <p className="font-medium text-red-500">Delete this repository</p>
            <p className="text-sm text-text-tertiary">
              This action is irreversible. Type <strong>{owner}/{repo}</strong> to confirm.
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
