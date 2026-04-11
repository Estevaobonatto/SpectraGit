import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import { useCreateOrganization } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { motion } from 'motion/react';

export default function OrganizationNewPage() {
  const navigate = useNavigate();
  const createMutation = useCreateOrganization();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(
      { name, displayName, description },
      { onSuccess: (org) => navigate(`/orgs/${org.name}`) },
    );
  };

  const slugPreview = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  return (
    <motion.div
      className="mx-auto max-w-lg"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4 -ml-2 text-text-secondary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50">
              <Building2 className="h-4 w-4 text-primary-500" />
            </div>
            Create a new organization
          </CardTitle>
          <CardDescription>
            Organizations let you collaborate with multiple team members across many projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">
                Organization name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-organization"
                required
                autoFocus
              />
              {slugPreview ? (
                <p className="text-xs text-text-tertiary">
                  URL: <span className="font-mono text-text-secondary">/orgs/{slugPreview}</span>
                </p>
              ) : (
                <p className="text-xs text-text-tertiary">Only lowercase letters, numbers, and hyphens.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="My Organization"
              />
              <p className="text-xs text-text-tertiary">How your organization appears publicly.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this organization do?"
                rows={3}
              />
            </div>

            {createMutation.isError && (
              <Alert variant="error">
                {(createMutation.error as Error)?.message ?? 'Failed to create organization'}
              </Alert>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
                {createMutation.isPending ? 'Creating...' : 'Create organization'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

