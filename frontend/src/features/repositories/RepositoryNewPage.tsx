import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useCreateRepository } from '@/hooks/useRepositories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';

export default function RepositoryNewPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const createRepo = useCreateRepository();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [initReadme, setInitReadme] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRepo.mutate(
      {
        name,
        description: description || undefined,
        visibility,
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
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create a new repository</h1>

      <Card>
        <CardHeader>
          <CardTitle>Repository details</CardTitle>
          <CardDescription>A repository contains all project files, including the revision history.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" value={user?.username ?? ''} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Repository name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-awesome-project"
                required
              />
              <p className="text-xs text-text-tertiary">
                Great repository names are short and memorable.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your repository"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as 'PUBLIC' | 'PRIVATE')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public - Anyone can see this repository</SelectItem>
                  <SelectItem value="PRIVATE">Private - Only you can see this repository</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="readme"
                checked={initReadme}
                onChange={(e) => setInitReadme(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
              />
              <Label htmlFor="readme" className="cursor-pointer">
                Initialize this repository with a README
              </Label>
            </div>

            {createRepo.isError && (
              <Alert variant="error">
                {(createRepo.error as Error)?.message ?? 'Failed to create repository'}
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || createRepo.isPending}>
                {createRepo.isPending ? 'Creating...' : 'Create repository'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
