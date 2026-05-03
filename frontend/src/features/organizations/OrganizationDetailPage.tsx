import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building2,
  FolderGit,
  Crown,
  UserCog,
  User,
  Plus,
  GitFork,
  AlertCircle,
  GitPullRequest,
  Zap,
  Clock,
  BookOpen,
  ChevronRight,
  X,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  useOrganization,
  useOrgTeams,
  useOrgMembers,
  useInviteOrgMember,
} from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { cn, formatRelativeTime } from '@/lib/utils';

const ROLE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  OWNER: { icon: Crown, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  ADMIN: { icon: UserCog, color: 'text-primary-700', bg: 'bg-primary-50 border-primary-200' },
  MEMBER: { icon: User, color: 'text-text-secondary', bg: 'bg-surface border-border' },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.MEMBER;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 gap-1', cfg.bg, cfg.color)}>
      <Icon className="h-3 w-3" />
      {role}
    </Badge>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <Card className="hover:border-primary-200 transition-colors">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-primary-600" />
        </div>
        <div>
          <p className="text-xl font-bold text-text-primary">{value}</p>
          <p className="text-[11px] text-text-secondary">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrganizationDetailPage() {
  const { orgName } = useParams();
  const { data: org, isLoading } = useOrganization(orgName!);
  const { data: teams } = useOrgTeams(orgName!);
  const { data: members } = useOrgMembers(orgName!);
  const inviteMutation = useInviteOrgMember(orgName!);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [activeTab, setActiveTab] = useState('members');

  if (isLoading || !org) return <PageLoader />;

  const repoCount = (org as any)?._count?.repositories ?? 0;
  const memberCount = (org as any)?._count?.members ?? 0;
  const teamCount = teams?.length ?? 0;
  const orgRepos = ((org as any)?.repositories ?? []) as any[];

  const handleInvite = () => {
    if (!inviteUsername.trim()) return;
    setInviteError(null);
    inviteMutation.mutate(
      { username: inviteUsername, role: inviteRole },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setInviteUsername('');
        },
        onError: (err) => setInviteError((err as Error)?.message ?? 'Failed to invite member'),
      },
    );
  };

  const filteredMembers = (members ?? []).filter((m) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return (
      (m.user?.username ?? '').toLowerCase().includes(q) ||
      (m.user?.displayName ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Cover Header */}
      <div className="relative">
        <div className="h-24 sm:h-32 rounded-xl bg-gradient-to-r from-primary-500/20 via-violet-500/15 to-primary-500/10 border border-border" />
        <div className="px-4 sm:px-6 -mt-10 sm:-mt-12 flex items-end gap-4">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-surface border-4 border-background shadow-lg flex items-center justify-center shrink-0">
            {org.avatarUrl ? (
              <img src={org.avatarUrl} alt={org.name} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-primary-500" />
            )}
          </div>
          <div className="pb-1 min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary truncate">
              {org.displayName || org.name}
            </h1>
            <p className="text-sm text-text-tertiary flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              @{org.name}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      {org.description && (
        <p className="text-sm text-text-secondary leading-relaxed px-1">{org.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={FolderGit} label="Repositories" value={repoCount} />
        <StatCard icon={Users} label="Members" value={memberCount} />
        <StatCard icon={ShieldCheck} label="Teams" value={teamCount} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-4 w-4" />
            Members
            <Badge variant="secondary" className="text-[10px] ml-1">
              {memberCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Teams
            <Badge variant="secondary" className="text-[10px] ml-1">
              {teamCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="repositories" className="gap-1.5">
            <FolderGit className="h-4 w-4" />
            Repositories
            <Badge variant="secondary" className="text-[10px] ml-1">
              {repoCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary-500" />
                Members
              </CardTitle>
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={inviteUsername}
                        onChange={(e) => {
                          setInviteUsername(e.target.value);
                          setInviteError(null);
                        }}
                        placeholder="username"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="OWNER">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {inviteError && <Alert variant="error">{inviteError}</Alert>}
                    <div className="flex gap-2 pt-1">
                      <Button
                        onClick={handleInvite}
                        disabled={inviteMutation.isPending || !inviteUsername.trim()}
                        className="flex-1"
                      >
                        {inviteMutation.isPending ? 'Sending...' : 'Send invitation'}
                      </Button>
                      <Button variant="outline" onClick={() => setInviteOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {/* Search */}
              {members && members.length > 5 && (
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members..."
                    className="pl-9 pr-9"
                  />
                  {memberSearch && (
                    <button
                      onClick={() => setMemberSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {filteredMembers.length > 0 ? (
                <div className="divide-y divide-border">
                  {filteredMembers.map((m, index) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.25 }}
                      className="flex items-center gap-3 py-3"
                    >
                      <Avatar src={m.user?.avatarUrl} alt={m.user?.username ?? ''} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-text-primary truncate">
                          {m.user?.displayName || m.user?.username}
                        </p>
                        {m.user?.displayName && (
                          <p className="text-xs text-text-tertiary">@{m.user?.username}</p>
                        )}
                      </div>
                      <RoleBadge role={m.role} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No members found"
                  description={
                    memberSearch
                      ? 'Try a different search term.'
                      : 'Invite your first member to get started.'
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5 text-primary-500" />
                Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teams && teams.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {teams.map((team, index) => {
                    const memberCount = (team as any)?._count?.members ?? 0;
                    const repoAccessCount = (team as any)?._count?.repoAccess ?? 0;
                    return (
                      <motion.div
                        key={team.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.25 }}
                      >
                        <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
                          <div className="h-9 w-9 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                            <ShieldCheck className="h-4.5 w-4.5 text-primary-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-text-primary">{team.name}</p>
                            {team.description && (
                              <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">
                                {team.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-[10px] text-text-tertiary mt-2">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {memberCount} member{memberCount !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <FolderGit className="h-3 w-3" />
                                {repoAccessCount} repo{repoAccessCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={ShieldCheck}
                  title="No teams yet"
                  description="Teams help organize members and manage repository access."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Repositories Tab */}
        <TabsContent value="repositories" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderGit className="h-5 w-5 text-primary-500" />
                Public repositories
              </CardTitle>
              <Button size="sm" variant="outline" asChild>
                <Link to="/repositories/new">
                  <Plus className="h-4 w-4 mr-1.5" />
                  New repo
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {orgRepos.length > 0 ? (
                <div className="space-y-2">
                  {orgRepos.map((repo: any, index: number) => {
                    const issues = repo._count?.issues ?? 0;
                    const prs = repo._count?.pullRequests ?? 0;
                    const pulses = repo._count?.pulses ?? 0;
                    return (
                      <motion.div
                        key={repo.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Link
                          to={`/${org.name}/${repo.slug}`}
                          className="flex items-center gap-4 p-3 rounded-lg border border-border bg-background hover:bg-surface-hover transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <BookOpen className="h-5 w-5 text-text-tertiary shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-primary-600 truncate group-hover:text-primary-700 transition-colors">
                                {repo.name}
                              </p>
                              {repo.description && (
                                <p className="text-xs text-text-secondary truncate">{repo.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="hidden sm:flex items-center gap-4 text-xs text-text-tertiary shrink-0">
                            {repo.language && <span>{repo.language}</span>}
                            <span className="flex items-center gap-0.5">
                              <AlertCircle className="h-3 w-3" />
                              {issues}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <GitPullRequest className="h-3 w-3" />
                              {prs}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Zap className="h-3 w-3" />
                              {pulses}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(repo.updatedAt)}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0 group-hover:text-primary-600 transition-colors" />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={FolderGit}
                  title="No public repositories"
                  description="This organization doesn't have any public repositories yet."
                  action={
                    <Button asChild size="sm">
                      <Link to="/repositories/new">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Create repository
                      </Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
