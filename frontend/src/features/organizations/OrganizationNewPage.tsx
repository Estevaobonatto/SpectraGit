import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Building2,
  Plus,
  ArrowLeft,
  Loader2,
  Check,
  AlertTriangle,
  Globe,
  Users,
  FolderGit,
  Info,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useCreateOrganization } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/* ─── Live Preview Card ──────────────────────────────────── */

function OrgPreview({
  name,
  displayName,
  description,
}: {
  name: string;
  displayName: string;
  description: string;
}) {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return (
    <Card className="overflow-hidden border-border">
      <div className="bg-gradient-to-r from-primary-500/10 to-violet-500/10 border-b border-border px-4 py-6 text-center">
        <div className="h-14 w-14 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center mx-auto">
          <Building2 className="h-7 w-7 text-primary-600" />
        </div>
        <h3 className="mt-2 font-semibold text-text-primary text-sm">
          {displayName || name || 'Organization Name'}
        </h3>
        <p className="text-xs text-text-tertiary">@{slug || 'org-name'}</p>
      </div>
      <CardContent className="p-4 space-y-3">
        {description ? (
          <p className="text-xs text-text-secondary leading-relaxed text-center">{description}</p>
        ) : (
          <p className="text-xs text-text-tertiary italic text-center">No description provided</p>
        )}
        <div className="flex items-center justify-center gap-4 text-[10px] text-text-tertiary pt-1">
          <span className="flex items-center gap-1">
            <FolderGit className="h-3 w-3" />
            0 repos
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            1 member
          </span>
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Public
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Component ─────────────────────────────────────── */

export default function OrganizationNewPage() {
  const navigate = useNavigate();
  const createMutation = useCreateOrganization();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');

  const slug = useMemo(
    () =>
      name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
    [name],
  );

  const isValidName = name.length > 0 && /^[a-z0-9-]+$/.test(name);
  const nameError = name.length > 0 && !isValidName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidName) return;
    createMutation.mutate(
      { name, displayName, description },
      { onSuccess: (org) => navigate(`/orgs/${org.name}`) },
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
          <Link to="/organizations">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to organizations
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Create a new organization</h1>
        <p className="text-sm text-text-secondary mt-1">
          Organizations let you collaborate with multiple team members across many projects.
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
                <Building2 className="h-5 w-5 text-primary-500" />
                Organization details
              </CardTitle>
              <CardDescription>
                Configure the basic settings for your new organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
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
                  {nameError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center gap-1.5 text-xs text-red-600"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Only lowercase letters, numbers, and hyphens are allowed.
                    </motion.div>
                  )}
                  {isValidName && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center gap-1.5 text-xs text-emerald-600"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Your organization will be at{' '}
                      <code className="bg-surface px-1 py-0.5 rounded text-[10px] font-mono">
                        /orgs/{slug}
                      </code>
                    </motion.div>
                  )}
                </div>

                {/* Display name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium">
                    Display name
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="My Organization"
                  />
                  <p className="text-xs text-text-tertiary">
                    How your organization appears publicly. Falls back to the organization name if empty.
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description
                    </Label>
                    <span
                      className={cn(
                        'text-[10px]',
                        description.length > 450 ? 'text-amber-600' : 'text-text-tertiary',
                      )}
                    >
                      {description.length}/500
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this organization do?"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                {/* Error */}
                {createMutation.isError && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <Alert variant="error">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      {(createMutation.error as Error)?.message ?? 'Failed to create organization'}
                    </Alert>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/organizations')}
                    className="text-text-secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!isValidName || createMutation.isPending}
                    className="gap-2"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create organization
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
          {/* Preview */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Live preview
            </h3>
            <OrgPreview name={name} displayName={displayName} description={description} />
          </div>

          {/* Info */}
          <Card className="bg-gradient-to-br from-primary-500/5 to-violet-500/5 border-primary-200/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary-600" />
                <h4 className="text-sm font-semibold text-text-primary">What is an organization?</h4>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                An organization is a shared account where multiple users can collaborate on repositories.
                You can create teams, manage permissions, and keep your projects organized.
              </p>
              <div className="space-y-2 pt-1">
                <div className="flex items-start gap-2">
                  <Users className="h-3.5 w-3.5 text-primary-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-text-secondary">Invite unlimited members</p>
                </div>
                <div className="flex items-start gap-2">
                  <FolderGit className="h-3.5 w-3.5 text-primary-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-text-secondary">Manage multiple repositories</p>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="h-3.5 w-3.5 text-primary-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-text-secondary">Create teams with custom access</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
