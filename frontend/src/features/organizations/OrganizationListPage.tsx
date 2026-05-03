import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Users,
  FolderGit,
  ShieldCheck,
  Crown,
  UserCog,
  User,
  X,
  ArrowRight,
  Globe,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMyOrganizations } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type RoleFilter = 'ALL' | 'OWNER' | 'ADMIN' | 'MEMBER';

const ROLE_CONFIG = {
  OWNER: { icon: Crown, label: 'Owner', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  ADMIN: { icon: UserCog, label: 'Admin', color: 'text-primary-600 bg-primary-50 border-primary-200' },
  MEMBER: { icon: User, label: 'Member', color: 'text-text-secondary bg-surface border-border' },
};

function RoleFilterPill({
  role,
  count,
  active,
  onClick,
}: {
  role: RoleFilter;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const config = role === 'ALL' ? null : ROLE_CONFIG[role];
  const Icon = config?.icon ?? Building2;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
        active
          ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm'
          : 'bg-surface border-border text-text-secondary hover:border-primary-200 hover:text-text-primary',
      )}
    >
      <Icon className={cn('h-4 w-4', active ? 'text-primary-600' : 'text-text-tertiary')} />
      <span>{count}</span>
      <span className="text-xs opacity-70">{role === 'ALL' ? 'All' : config?.label}</span>
    </button>
  );
}

export default function OrganizationListPage() {
  const { data: memberships, isLoading } = useMyOrganizations();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');

  const allMemberships = memberships ?? [];

  const stats = useMemo(() => {
    const total = allMemberships.length;
    const owner = allMemberships.filter((m) => m.role === 'OWNER').length;
    const admin = allMemberships.filter((m) => m.role === 'ADMIN').length;
    const member = allMemberships.filter((m) => m.role === 'MEMBER').length;
    return { total, owner, admin, member };
  }, [allMemberships]);

  const filtered = useMemo(() => {
    let result = allMemberships;

    if (roleFilter !== 'ALL') {
      result = result.filter((m) => m.role === roleFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          (m.organization?.name ?? '').toLowerCase().includes(q) ||
          (m.organization?.displayName ?? '').toLowerCase().includes(q) ||
          (m.organization?.description ?? '').toLowerCase().includes(q),
      );
    }

    return result;
  }, [allMemberships, roleFilter, search]);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Organizations</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {stats.total > 0
              ? `You are a member of ${stats.total} organization${stats.total !== 1 ? 's' : ''}`
              : 'Collaborate with your team across multiple projects'}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link to="/organizations/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New organization
          </Link>
        </Button>
      </div>

      {stats.total > 0 && (
        <>
          {/* Role Filters */}
          <div className="flex flex-wrap gap-2">
            <RoleFilterPill role="ALL" count={stats.total} active={roleFilter === 'ALL'} onClick={() => setRoleFilter('ALL')} />
            <RoleFilterPill role="OWNER" count={stats.owner} active={roleFilter === 'OWNER'} onClick={() => setRoleFilter('OWNER')} />
            <RoleFilterPill role="ADMIN" count={stats.admin} active={roleFilter === 'ADMIN'} onClick={() => setRoleFilter('ADMIN')} />
            <RoleFilterPill role="MEMBER" count={stats.member} active={roleFilter === 'MEMBER'} onClick={() => setRoleFilter('MEMBER')} />
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find an organization..."
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </>
      )}

      {/* Results */}
      {allMemberships.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Create an organization to collaborate with your team and manage multiple repositories."
          action={
            <Button asChild size="sm">
              <Link to="/organizations/new">
                <Plus className="h-4 w-4 mr-1.5" />
                New organization
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((membership, index) => {
            const org = membership.organization;
            const repoCount = (org as any)?._count?.repositories ?? 0;
            const memberCount = (org as any)?._count?.members ?? 0;
            const roleCfg = ROLE_CONFIG[membership.role];
            const RoleIcon = roleCfg.icon;

            return (
              <motion.div
                key={membership.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
              >
                <Link
                  to={`/orgs/${org?.name ?? membership.id}`}
                  className="group block h-full"
                >
                  <Card className="h-full hover:border-primary-200 hover:bg-surface-hover transition-colors">
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={org?.avatarUrl}
                          alt={org?.name ?? ''}
                          fallback={org?.displayName || org?.name || '?'}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-text-primary group-hover:text-primary-600 transition-colors truncate text-sm">
                            {org?.displayName || org?.name}
                          </p>
                          {org?.name && (
                            <p className="text-xs text-text-tertiary flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              @{org.name}
                            </p>
                          )}
                        </div>
                        <Badge
                          className={cn('text-[10px] px-1.5 shrink-0', roleCfg.color)}
                          variant="outline"
                        >
                          <RoleIcon className="h-3 w-3 mr-0.5" />
                          {membership.role}
                        </Badge>
                      </div>

                      {/* Description */}
                      {org?.description ? (
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                          {org.description}
                        </p>
                      ) : (
                        <p className="text-xs text-text-tertiary italic">No description</p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-[11px] text-text-tertiary pt-1">
                        <span className="flex items-center gap-1">
                          <FolderGit className="h-3.5 w-3.5" />
                          {repoCount} repo{repoCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {memberCount} member{memberCount !== 1 ? 's' : ''}
                        </span>
                        <span className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary-600">
                          View
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
