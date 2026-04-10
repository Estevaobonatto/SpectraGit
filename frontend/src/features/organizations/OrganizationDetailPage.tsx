import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, UserPlus, ShieldCheck } from 'lucide-react';
import { useOrganization, useOrgTeams, useOrgMembers, useInviteOrgMember } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageLoader } from '@/components/ui/spinner';

export default function OrganizationDetailPage() {
  const { orgName } = useParams();
  const { data: org, isLoading } = useOrganization(orgName!);
  const { data: teams } = useOrgTeams(orgName!);
  const { data: members } = useOrgMembers(orgName!);
  const inviteMutation = useInviteOrgMember(orgName!);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  if (isLoading || !org) return <PageLoader />;

  const handleInvite = () => {
    if (!inviteUsername.trim()) return;
    inviteMutation.mutate(
      { username: inviteUsername, role: inviteRole },
      { onSuccess: () => { setInviteOpen(false); setInviteUsername(''); } },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar src={org.avatarUrl} alt={org.name} fallback={org.displayName || org.name} size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{org.displayName || org.name}</h1>
          <p className="text-sm text-text-tertiary">@{org.name}</p>
          {org.description && <p className="mt-1 text-sm text-text-secondary">{org.description}</p>}
        </div>
      </div>

      <Separator />

      {/* Members */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
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
                  <Input id="username" value={inviteUsername} onChange={(e) => setInviteUsername(e.target.value)} placeholder="username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
                <Button onClick={handleInvite} disabled={inviteMutation.isPending || !inviteUsername.trim()}>
                  Send invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {members && members.length > 0 ? (
            <div className="divide-y divide-border">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-3">
                  <Avatar src={m.user?.avatarUrl} alt={m.user?.username ?? ''} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-text-primary">{m.user?.username}</p>
                  </div>
                  <Badge variant={m.role === 'OWNER' ? 'default' : 'secondary'}>{m.role}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">No members yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Teams */}
      {teams && teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center gap-3 py-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-text-primary">{team.name}</p>
                    {team.description && <p className="text-xs text-text-tertiary">{team.description}</p>}
                  </div>
                  <Badge variant="secondary">{team.name}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
