import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Search } from 'lucide-react';
import { useMyOrganizations } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { motion } from 'motion/react';

const roleVariant: Record<string, 'default' | 'warning' | 'secondary'> = {
  OWNER: 'default',
  ADMIN: 'warning',
  MEMBER: 'secondary',
};

export default function OrganizationListPage() {
  const { data: memberships, isLoading } = useMyOrganizations();
  const [search, setSearch] = useState('');

  if (isLoading) return <PageLoader />;

  const filtered = (memberships ?? []).filter((m) =>
    (m.organization?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (m.organization?.displayName ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Organizations</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {memberships && memberships.length > 0
              ? `You are a member of ${memberships.length} organization${memberships.length !== 1 ? 's' : ''}`
              : 'Collaborate with your team'}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link to="/organizations/new">
            <Plus className="h-4 w-4" />
            New organization
          </Link>
        </Button>
      </div>

      {memberships && memberships.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find an organization..."
            className="pl-9"
          />
        </div>
      )}

      {!memberships || memberships.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Create an organization to collaborate with your team."
          action={
            <Button asChild>
              <Link to="/organizations/new">
                <Plus className="h-4 w-4" />
                New organization
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations found"
          description="Try a different search term."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((membership, index) => {
            const org = membership.organization;
            return (
              <motion.div
                key={membership.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <Link
                  to={`/orgs/${org?.name ?? membership.id}`}
                  className="group flex items-start gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-4 transition-colors hover:bg-surface-hover hover:border-primary-200"
                >
                  <Avatar
                    src={org?.avatarUrl}
                    alt={org?.name ?? ''}
                    fallback={org?.displayName || org?.name || '?'}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary group-hover:text-primary-600 transition-colors truncate">
                      {org?.displayName || org?.name}
                    </p>
                    {org?.name && <p className="text-xs text-text-tertiary">@{org.name}</p>}
                    {org?.description && (
                      <p className="mt-1 text-xs text-text-secondary line-clamp-2">{org.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={roleVariant[membership.role] ?? 'secondary'} className="text-[10px]">
                        {membership.role}
                      </Badge>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
