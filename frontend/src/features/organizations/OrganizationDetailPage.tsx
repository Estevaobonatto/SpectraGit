import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, UserPlus, ShieldCheck } from 'lucide-react';
import { useOrganization, useOrgTeams, useOrgMembers, useInviteOrgMember } from '@/hooks/useOrganizations';
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
import { motion } from 'motion/react';

const roleVariant: Record<string, 'default' | 'warning' | 'secondary'> = {
  OWNER: 'default',
  ADMIN: 'warning',
  MEMBER: 'secondary',
};

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
  const [inviteSuccess, setInviteSuccess] = useState(false);

  if (isLoading || !org) return <PageLoader />;

  const handleInvite = () => {
    if (!inviteUsername.trim()) return;
    setInviteError(null);
    setInviteSuccess(false);
    inviteMutation.mutate(
      { username: inviteUsername, role: inviteRole },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setInviteUsername('');
          setInviteSuccess(true);
        },
        onError: (err) => setInviteError((err as Error)?.message ?? 'Failed to invite member'),
      },
    );
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar src={org.avatarUrl} alt={org.name} fallback={org.displayName || org.name} size="lg" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-text-primary">{org.displayName || org.name}</h1>
          <p className="text-sm text-text-tertiary">@{org.name}</p>
          {org.description && <p className="mt-1 text-sm text-text-secondary">{org.description}</p>}
          <div className="mt-3 flex items-center gap-4 text-xs text-text-tertiary">
            {members != null && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {members.length} member{members.length !== 1 ? 's' : ''}
              </span>
            )}
            {teams != null && (
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                {teams.length} team{teams.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {inviteSuccess && (
        <Alert variant="success">Member invited successfully.</Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-4 w-4" />
            Members {members != null && <span className="ml-1 text-text-tertiary">({members.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="teams">
            <ShieldCheck className="h-4 w-4" />
            Teams {teams != null && <span className="ml-1 text-text-tertiary">({teams.length})</span>}
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-500" />
                Members
              </CardTitle>
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4" />
                    Invite member
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
                        onChange={(e) => { setInviteUsername(e.target.value); setInviteError(null); }}
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
                        Send invitation
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
              {members && members.length > 0 ? (
                <div className="divide-y divide-border">
                  {members.map((m, index) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
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
                      <Badge variant={roleVariant[m.role] ?? 'secondary'} className="shrink-0">
                        {m.role}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No members yet"
                  description="Invite your first member to get started."
                  className="py-10"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-500" />
                Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teams && teams.length > 0 ? (
                <div className="divide-y divide-border">
                  {teams.map((team, index) => (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50">
                        <ShieldCheck className="h-4 w-4 text-primary-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-text-primary">{team.name}</p>
                        {team.description && (
                          <p className="text-xs text-text-tertiary truncate">{team.description}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ShieldCheck}
                  title="No teams yet"
                  description="Teams help organize members and manage repository access."
                  className="py-10"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
