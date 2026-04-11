import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Trash2,
  ChevronRight,
  Building2,
  X,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  useCollaborators,
  useAddCollaborator,
  useUpdateCollaboratorRole,
  useRemoveCollaborator,
  useSearchCollaboratorUsers,
  useOrgMembersForRepo,
} from '@/hooks/useCollaborators';
import { useRepository } from '@/hooks/useRepositories';
import { useMyOrganizations } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
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
import { PageLoader } from '@/components/ui/spinner';
import type { RepoRole, CollaboratorSearchUser, Collaborator } from '@/types';

const ROLE_CONFIG: Record<RepoRole, { label: string; color: string; icon: typeof Shield; description: string }> = {
  ADMIN: {
    label: 'Admin',
    color: 'destructive',
    icon: ShieldAlert,
    description: 'Full access including settings and collaborator management',
  },
  MAINTAINER: {
    label: 'Maintainer',
    color: 'warning',
    icon: ShieldCheck,
    description: 'Can manage branches, merge PRs, and manage issues',
  },
  WRITE: {
    label: 'Write',
    color: 'default',
    icon: Shield,
    description: 'Can push to branches, create issues and PRs',
  },
  READ: {
    label: 'Read',
    color: 'secondary',
    icon: Eye,
    description: 'Can view the repository and create issues',
  },
};

// ─── Step-based Add Collaborator Flow ────────────────────────

type AddStep = 'search' | 'select-role' | 'confirm';

function AddCollaboratorDialog({
  open,
  onOpenChange,
  owner,
  repo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: string;
  repo: string;
}) {
  const [step, setStep] = useState<AddStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<CollaboratorSearchUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<RepoRole>('READ');
  const [activeTab, setActiveTab] = useState<'search' | 'org'>('search');
  const [selectedOrg, setSelectedOrg] = useState('');

  const { data: searchResults, isLoading: searching } = useSearchCollaboratorUsers(owner, repo, searchQuery);
  const { data: orgMembers } = useOrgMembersForRepo(owner, repo, selectedOrg);
  const { data: myOrgs } = useMyOrganizations();
  const addMutation = useAddCollaborator(owner, repo);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep('search');
      setSearchQuery('');
      setSelectedUser(null);
      setSelectedRole('READ');
      setActiveTab('search');
      setSelectedOrg('');
    }
  }, [open]);

  const handleSelectUser = (user: CollaboratorSearchUser) => {
    setSelectedUser(user);
    setStep('select-role');
  };

  const handleConfirm = () => {
    if (!selectedUser) return;
    addMutation.mutate(
      { username: selectedUser.username, role: selectedRole },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  const stepIndicator = (
    <div className="flex items-center gap-2 mb-6">
      {(['search', 'select-role', 'confirm'] as AddStep[]).map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
              step === s
                ? 'bg-primary-500 text-white'
                : i < ['search', 'select-role', 'confirm'].indexOf(step)
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-text-tertiary'
            }`}
          >
            {i < ['search', 'select-role', 'confirm'].indexOf(step) ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              i + 1
            )}
          </div>
          {i < 2 && <ChevronRight className="h-4 w-4 text-text-tertiary" />}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Collaborator
          </DialogTitle>
          <DialogDescription>
            {step === 'search' && 'Search for a user or select from an organization'}
            {step === 'select-role' && 'Choose the access level for this collaborator'}
            {step === 'confirm' && 'Review and confirm the invitation'}
          </DialogDescription>
        </DialogHeader>

        {stepIndicator}

        <AnimatePresence mode="wait">
          {/* Step 1: Search */}
          {step === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Tabs: Search / Org */}
              <div className="flex gap-2 border-b border-border">
                <button
                  className={`px-3 py-2 text-sm font-medium -mb-px transition-colors ${
                    activeTab === 'search'
                      ? 'text-primary-600 border-b-2 border-primary-500'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  onClick={() => setActiveTab('search')}
                >
                  <Search className="inline h-3.5 w-3.5 mr-1.5" />
                  Search Users
                </button>
                <button
                  className={`px-3 py-2 text-sm font-medium -mb-px transition-colors ${
                    activeTab === 'org'
                      ? 'text-primary-600 border-b-2 border-primary-500'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  onClick={() => setActiveTab('org')}
                >
                  <Building2 className="inline h-3.5 w-3.5 mr-1.5" />
                  From Organization
                </button>
              </div>

              {activeTab === 'search' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                    <Input
                      placeholder="Search by username or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {searching && searchQuery.length >= 2 && (
                      <p className="text-sm text-text-tertiary text-center py-4">Searching...</p>
                    )}
                    {searchResults?.length === 0 && searchQuery.length >= 2 && (
                      <p className="text-sm text-text-tertiary text-center py-4">No users found</p>
                    )}
                    {searchQuery.length < 2 && (
                      <p className="text-sm text-text-tertiary text-center py-4">Type at least 2 characters to search</p>
                    )}
                    {searchResults?.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] p-2.5 text-left transition-colors hover:bg-gray-50"
                      >
                        <Avatar src={user.avatarUrl} alt={user.username} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
                          <p className="text-xs text-text-tertiary truncate">@{user.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'org' && (
                <div className="space-y-3">
                  {myOrgs && myOrgs.length > 0 ? (
                    <>
                      <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {myOrgs.map((m) => (
                            <SelectItem key={m.organization?.name || m.id} value={m.organization?.name || ''}>
                              {m.organization?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedOrg && (
                        <div className="max-h-60 overflow-y-auto space-y-1">
                          {orgMembers?.length === 0 && (
                            <p className="text-sm text-text-tertiary text-center py-4">
                              All organization members are already collaborators
                            </p>
                          )}
                          {orgMembers?.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleSelectUser(user)}
                              className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] p-2.5 text-left transition-colors hover:bg-gray-50"
                            >
                              <Avatar src={user.avatarUrl} alt={user.username} size="sm" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
                                <p className="text-xs text-text-tertiary truncate">@{user.username}</p>
                              </div>
                              {user.orgRole && (
                                <Badge variant="outline" className="text-xs">
                                  {user.orgRole}
                                </Badge>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-text-tertiary text-center py-4">
                      You are not a member of any organization
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Select Role */}
          {step === 'select-role' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {selectedUser && (
                <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border p-3 bg-gray-50/50">
                  <Avatar src={selectedUser.avatarUrl} alt={selectedUser.username} size="md" />
                  <div>
                    <p className="font-medium">{selectedUser.displayName || selectedUser.username}</p>
                    <p className="text-sm text-text-tertiary">@{selectedUser.username}</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {(Object.entries(ROLE_CONFIG) as [RepoRole, typeof ROLE_CONFIG[RepoRole]][]).map(
                  ([role, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`flex w-full items-start gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-all ${
                          selectedRole === role
                            ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500'
                            : 'border-border hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${selectedRole === role ? 'text-primary-600' : 'text-text-tertiary'}`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{config.label}</p>
                          <p className="text-xs text-text-tertiary mt-0.5">{config.description}</p>
                        </div>
                        {selectedRole === role && (
                          <Check className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  },
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('search')}>
                  Back
                </Button>
                <Button onClick={() => setStep('confirm')} className="flex-1">
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="rounded-[var(--radius-md)] border border-border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar src={selectedUser?.avatarUrl} alt={selectedUser?.username} size="md" />
                  <div>
                    <p className="font-medium">{selectedUser?.displayName || selectedUser?.username}</p>
                    <p className="text-sm text-text-tertiary">@{selectedUser?.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <span className="text-sm text-text-secondary">Access level:</span>
                  <Badge variant={ROLE_CONFIG[selectedRole].color as 'default'}>
                    {ROLE_CONFIG[selectedRole].label}
                  </Badge>
                </div>
                <p className="text-xs text-text-tertiary">
                  {ROLE_CONFIG[selectedRole].description}
                </p>
              </div>

              {addMutation.isError && (
                <Alert variant="error">
                  {(addMutation.error as Error)?.message || 'Failed to add collaborator'}
                </Alert>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep('select-role')}>
                  Back
                </Button>
                <Button onClick={handleConfirm} disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Adding...' : 'Add Collaborator'}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ─── Collaborator Row ────────────────────────────────────────

function CollaboratorRow({
  collaborator,
  canManage,
  owner,
  repo,
}: {
  collaborator: Collaborator;
  canManage: boolean;
  owner: string;
  repo: string;
}) {
  const [editingRole, setEditingRole] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const updateMutation = useUpdateCollaboratorRole(owner, repo);
  const removeMutation = useRemoveCollaborator(owner, repo);

  const config = ROLE_CONFIG[collaborator.role];
  const Icon = config.icon;

  const handleRoleChange = (newRole: string) => {
    updateMutation.mutate(
      { username: collaborator.user.username, role: newRole as RepoRole },
      { onSuccess: () => setEditingRole(false) },
    );
  };

  const handleRemove = () => {
    removeMutation.mutate(collaborator.user.username, {
      onSuccess: () => setConfirmRemove(false),
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-4 rounded-[var(--radius-md)] border border-border p-4 transition-colors hover:bg-gray-50/50"
    >
      <Avatar
        src={collaborator.user.avatarUrl}
        alt={collaborator.user.username}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">
          {collaborator.user.displayName || collaborator.user.username}
        </p>
        <p className="text-xs text-text-tertiary truncate">@{collaborator.user.username}</p>
      </div>

      <div className="flex items-center gap-2">
        {editingRole && canManage ? (
          <div className="flex items-center gap-2">
            <Select
              value={collaborator.role}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MAINTAINER">Maintainer</SelectItem>
                <SelectItem value="WRITE">Write</SelectItem>
                <SelectItem value="READ">Read</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingRole(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => canManage && setEditingRole(true)}
            className={`flex items-center gap-1.5 ${canManage ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            disabled={!canManage}
          >
            <Icon className="h-4 w-4 text-text-tertiary" />
            <Badge variant={config.color as 'default'}>{config.label}</Badge>
          </button>
        )}

        {canManage && (
          <>
            {confirmRemove ? (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" onClick={handleRemove} disabled={removeMutation.isPending}>
                  {removeMutation.isPending ? '...' : 'Confirm'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmRemove(true)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function CollaboratorsPage() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { data: repository } = useRepository(owner!, repo!);
  const { data: collaborators, isLoading, error } = useCollaborators(owner!, repo!);

  if (isLoading) return <PageLoader />;

  const canManage = repository?.canEdit ?? false;

  return (
    <motion.div
      className="mx-auto max-w-3xl space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-text-secondary" />
          <h1 className="text-2xl font-bold text-text-primary">Collaborators</h1>
          {collaborators && (
            <Badge variant="secondary" className="ml-1">
              {collaborators.length}
            </Badge>
          )}
        </div>
        {canManage && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Collaborator
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="error" title="Error loading collaborators">
          {(error as Error)?.message || 'Failed to load collaborators'}
        </Alert>
      )}

      {/* Collaborators List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            People with access to this repository
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Owner */}
          {repository?.ownerUser && (
            <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-primary-200 bg-primary-50/30 p-4 mb-3">
              <Avatar
                src={repository.ownerUser.avatarUrl}
                alt={repository.ownerUser.username}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">
                  {repository.ownerUser.username}
                </p>
                <p className="text-xs text-text-tertiary">Repository owner</p>
              </div>
              <Badge variant="default">Owner</Badge>
            </div>
          )}

          {/* Collaborators */}
          <AnimatePresence>
            {collaborators && collaborators.length > 0 ? (
              <div className="space-y-2">
                {collaborators.map((collab) => (
                  <CollaboratorRow
                    key={collab.id}
                    collaborator={collab}
                    canManage={canManage}
                    owner={owner!}
                    repo={repo!}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-text-tertiary/50" />
                <p className="mt-3 text-sm text-text-secondary">No collaborators yet</p>
                {canManage && (
                  <p className="mt-1 text-xs text-text-tertiary">
                    Add collaborators to let others contribute to this repository
                  </p>
                )}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Role Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Access Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.entries(ROLE_CONFIG) as [RepoRole, typeof ROLE_CONFIG[RepoRole]][]).map(
              ([role, config]) => {
                const Icon = config.icon;
                return (
                  <div key={role} className="flex items-start gap-3 rounded-[var(--radius-sm)] p-2">
                    <Icon className="h-5 w-5 text-text-tertiary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-xs text-text-tertiary">{config.description}</p>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Collaborator Dialog */}
      <AddCollaboratorDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        owner={owner!}
        repo={repo!}
      />
    </motion.div>
  );
}
